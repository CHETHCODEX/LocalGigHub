import Gig from "../models/gig.model.js";
import createError from "../utils/createError.js";
import User from "../models/user.model.js";
import { analyzeTextSafety } from "../utils/contentSafety.js";
import { createNotification } from "../utils/notify.js";

const cityCoordinateMap = {
  downtown: [-74.006, 40.7128],
  uptown: [-73.9442, 40.8116],
  midtown: [-73.9857, 40.758],
  brooklyn: [-73.9442, 40.6782],
  queens: [-73.7949, 40.7282],
  chicago: [-87.6298, 41.8781],
  mumbai: [72.8777, 19.076],
  delhi: [77.1025, 28.7041],
  bangalore: [77.5946, 12.9716],
  chennai: [80.2707, 13.0827],
  hyderabad: [78.4867, 17.385],
};

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const calculateDistanceKm = (lat1, lon1, lat2, lon2) => {
  const toRadians = (deg) => (deg * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusKm * c;
};

const estimateTravel = (distanceKm) => {
  const walkingMinutes = Math.round((distanceKm / 5) * 60);
  const drivingMinutes = Math.round((distanceKm / 28) * 60);
  return {
    walkingMinutes,
    drivingMinutes,
  };
};

const resolveCoordinates = (location, geoLocation = {}) => {
  if (
    Array.isArray(geoLocation.coordinates) &&
    geoLocation.coordinates.length === 2
  ) {
    const [lng, lat] = geoLocation.coordinates;
    if (lng && lat) {
      return [toNumber(lng), toNumber(lat)];
    }
  }

  const lookupKey = (geoLocation.city || location || "").trim().toLowerCase();
  return cityCoordinateMap[lookupKey] || [0, 0];
};

const canModerate = async (userId) => {
  const user = await User.findById(userId).select("role verified");
  return Boolean(user && user.role === "shop" && user.verified);
};

export const createGig = async (req, res, next) => {
  if (req.role !== "shop") {
    return next(createError(403, "Only Shops can create a Gig"));
  }

  const safety = analyzeTextSafety([
    req.body.title,
    req.body.desc,
    req.body.location,
    req.body.cat,
    req.body.duration,
    ...(Array.isArray(req.body.requiredSkills) ? req.body.requiredSkills : []),
  ]);

  if (safety.blocked) {
    return next(
      createError(
        400,
        "Gig contains content that violates safety policy and cannot be published",
      ),
    );
  }

  const moderationStatus = safety.reviewRecommended
    ? "pending_review"
    : "approved";

  const newGig = new Gig({
    userId: req.userId,
    ...req.body,
    moderationStatus,
    moderationReason:
      moderationStatus === "pending_review"
        ? "Queued automatically by content safety checks"
        : "",
    safetyFlags: safety.reviewFlags,
    geoLocation: {
      type: "Point",
      coordinates: resolveCoordinates(req.body.location, req.body.geoLocation),
      city: req.body.geoLocation?.city || req.body.location || "",
      pincode: req.body.geoLocation?.pincode || "",
    },
  });
  console.log(req.userId);
  try {
    const savedGig = await newGig.save();
    res.status(201).json({
      ...savedGig.toObject(),
      trustSafety: {
        moderationStatus: savedGig.moderationStatus,
        flags: savedGig.safetyFlags,
      },
      message:
        savedGig.moderationStatus === "pending_review"
          ? "Gig submitted and queued for moderation review"
          : "Gig published successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const deleteGig = async (req, res, next) => {
  try {
    const gig = await Gig.findById(req.params.id);
    if (!gig) return next(createError(404, "Gig not found"));
    if (gig.userId !== req.userId) {
      return next(createError(403, "you can delete your gig"));
    }
    await Gig.findByIdAndDelete(req.params.id);
    res.status(200).send("gig has been deleted");
  } catch (err) {
    next(err);
  }
};

export const getGig = async (req, res, next) => {
  try {
    const gig = await Gig.findById(req.params.id);
    if (!gig) return next(createError(404, "Gig not found"));

    const owner = await User.findById(gig.userId).select(
      "username img verified verificationStatus",
    );

    res.status(200).send({
      ...gig.toObject(),
      owner: owner
        ? {
            _id: owner._id,
            username: owner.username,
            img: owner.img,
            verified: owner.verified,
            verificationStatus: owner.verificationStatus,
          }
        : null,
    });
  } catch (err) {
    next(err);
  }
};

export const getGigs = async (req, res, next) => {
  const q = req.query;
  const hasCoordinates = q.lat && q.lng;
  const maxDistanceKm = Math.max(1, toNumber(q.maxDistanceKm, 25));
  const filters = {
    ...(q.userId && { userId: q.userId }),
    ...(q.cat && { cat: q.cat }),
    ...((q.min || q.max) && {
      price: {
        ...(q.min && { $gte: q.min }),
        ...(q.max && { $lte: q.max }),
      },
    }),
    ...(q.search && {
      $or: [
        { title: { $regex: q.search, $options: "i" } },
        { desc: { $regex: q.search, $options: "i" } },
        { location: { $regex: q.search, $options: "i" } },
      ],
    }),
    ...(q.status && { status: q.status }),
  };
  try {
    const gigs = await Gig.find(filters).sort({ createdAt: -1, [q.sort]: -1 });

    const visibleGigs = q.userId
      ? gigs
      : gigs.filter(
          (gig) => !gig.moderationStatus || gig.moderationStatus === "approved",
        );

    const enhancedGigs = visibleGigs.map((gig) => {
      const coords = gig.geoLocation?.coordinates || [0, 0];
      let distanceKm = null;
      let travel = null;

      if (hasCoordinates && coords[0] && coords[1]) {
        distanceKm = calculateDistanceKm(
          toNumber(q.lat),
          toNumber(q.lng),
          coords[1],
          coords[0],
        );
        travel = estimateTravel(distanceKm);
      }

      return {
        ...gig.toObject(),
        distanceKm: distanceKm !== null ? Number(distanceKm.toFixed(1)) : null,
        travel,
      };
    });

    const filteredByDistance = hasCoordinates
      ? enhancedGigs.filter(
          (gig) => gig.distanceKm === null || gig.distanceKm <= maxDistanceKm,
        )
      : enhancedGigs;

    const sortedByDistance = hasCoordinates
      ? filteredByDistance.sort((a, b) => {
          if (a.distanceKm === null) return 1;
          if (b.distanceKm === null) return -1;
          return a.distanceKm - b.distanceKm;
        })
      : filteredByDistance;

    // If strict distance filtering returns nothing, fall back to showing nearest gigs.
    const sortedGigs =
      hasCoordinates && sortedByDistance.length === 0
        ? [...enhancedGigs].sort((a, b) => {
            if (a.distanceKm === null) return 1;
            if (b.distanceKm === null) return -1;
            return a.distanceKm - b.distanceKm;
          })
        : sortedByDistance;

    res.status(200).send(sortedGigs);
  } catch (err) {
    next(err);
  }
};

export const getGigRouteInfo = async (req, res, next) => {
  try {
    const gig = await Gig.findById(req.params.id);
    if (!gig) return next(createError(404, "Gig not found"));

    const { lat, lng } = req.query;
    if (!lat || !lng) {
      return res.status(200).json({
        distanceKm: null,
        travel: null,
        destination: gig.location,
      });
    }

    const coords = gig.geoLocation?.coordinates || [0, 0];
    if (!coords[0] || !coords[1]) {
      return res.status(200).json({
        distanceKm: null,
        travel: null,
        destination: gig.location,
      });
    }

    const distanceKm = calculateDistanceKm(
      toNumber(lat),
      toNumber(lng),
      coords[1],
      coords[0],
    );

    res.status(200).json({
      distanceKm: Number(distanceKm.toFixed(1)),
      travel: estimateTravel(distanceKm),
      destination: gig.location,
      coordinates: coords,
    });
  } catch (error) {
    next(error);
  }
};

export const reportGig = async (req, res, next) => {
  try {
    const gig = await Gig.findById(req.params.id);
    if (!gig) return next(createError(404, "Gig not found"));

    if (gig.userId === req.userId) {
      return next(createError(400, "You cannot report your own gig"));
    }

    const { reason, details } = req.body;
    const cleanReason = typeof reason === "string" ? reason.trim() : "";
    const cleanDetails = typeof details === "string" ? details.trim() : "";

    if (!cleanReason) {
      return next(createError(400, "reason is required"));
    }

    const existingReport = (gig.reports || []).find(
      (report) => report.reporterId === req.userId && report.status === "open",
    );

    if (existingReport) {
      return next(createError(409, "You already reported this gig"));
    }

    gig.reports.push({
      reporterId: req.userId,
      reason: cleanReason,
      details: cleanDetails,
      status: "open",
    });

    const openReports = gig.reports.filter(
      (report) => report.status === "open",
    );
    if (openReports.length >= 3) {
      gig.moderationStatus = "pending_review";
      gig.moderationReason = "Auto queued after multiple user reports";
    }

    await gig.save();

    res.status(201).json({
      message: "Report submitted",
      moderationStatus: gig.moderationStatus,
      openReports: openReports.length,
    });
  } catch (error) {
    next(error);
  }
};

export const getModerationQueue = async (req, res, next) => {
  try {
    const requester = await User.findById(req.userId).select("role verified");
    if (!requester || requester.role !== "shop") {
      return next(createError(403, "Only shops can access moderation"));
    }

    const { status = "pending_review" } = req.query;
    const allowedStatuses = ["all", "pending_review", "approved", "rejected"];
    if (!allowedStatuses.includes(status)) {
      return next(createError(400, "Invalid moderation status filter"));
    }

    const filters = status === "all" ? {} : { moderationStatus: status };

    // Non-verified shops can only view moderation state for their own gigs.
    if (!requester.verified) {
      filters.userId = req.userId;
    }

    const queue = await Gig.find(filters).sort({ createdAt: -1 }).limit(100);

    res.status(200).json({
      count: queue.length,
      queue,
      scope: requester.verified ? "global" : "own",
    });
  } catch (error) {
    next(error);
  }
};

export const moderateGig = async (req, res, next) => {
  try {
    const allowed = await canModerate(req.userId);
    if (!allowed) {
      return next(createError(403, "Only verified shops can moderate gigs"));
    }

    const gig = await Gig.findById(req.params.id);
    if (!gig) return next(createError(404, "Gig not found"));

    const { action, note } = req.body;
    if (!["approve", "reject"].includes(action)) {
      return next(createError(400, "action must be approve or reject"));
    }

    gig.moderationStatus = action === "approve" ? "approved" : "rejected";
    gig.moderationReason = typeof note === "string" ? note.trim() : "";
    gig.reports = (gig.reports || []).map((report) => ({
      ...report,
      status: "reviewed",
    }));

    await gig.save();

    await createNotification({
      userId: gig.userId,
      type: `moderation:${gig.moderationStatus}`,
      title: "Gig moderation update",
      body:
        gig.moderationStatus === "approved"
          ? "Your gig has been approved"
          : "Your gig has been rejected",
      link: "/shop/moderation",
      meta: {
        gigId: gig._id,
        moderationStatus: gig.moderationStatus,
        note: gig.moderationReason,
      },
    });

    res.status(200).json({
      message: `Gig ${action}d successfully`,
      moderationStatus: gig.moderationStatus,
    });
  } catch (error) {
    next(error);
  }
};
