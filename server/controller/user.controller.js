import User from "../models/user.model.js";
import createError from "../utils/createError.js";
import { analyzeTextSafety } from "../utils/contentSafety.js";

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

export const deleteUser = async (req, res, next) => {
  const user = await User.findById(req.params.id);
  if (req.userId !== user._id.toString()) {
    return next(createError(403, "you can delete only your account"));
  }
  await User.findByIdAndDelete(req.params.id);
  res.status(200).send("deleted");
};
export const getUser = async (req, res) => {
  // console.log(res);
  const user = await User.findById(req.params.id);
  res.status(200).send(user);
};

export const updateUserProfile = async (req, res, next) => {
  try {
    if (req.userId !== req.params.id) {
      return next(createError(403, "you can update only your account"));
    }

    const allowedUpdates = {
      username: req.body.username,
      img: req.body.img,
      country: req.body.country,
      phone: req.body.phone,
      desc: req.body.desc,
      skills: Array.isArray(req.body.skills)
        ? req.body.skills
            .map((skill) => (typeof skill === "string" ? skill.trim() : ""))
            .filter(Boolean)
        : undefined,
    };

    const safety = analyzeTextSafety([
      allowedUpdates.username,
      allowedUpdates.desc,
      allowedUpdates.phone,
      ...(allowedUpdates.skills || []),
    ]);

    if (safety.blocked) {
      return next(
        createError(
          400,
          "Profile update contains content that violates safety policy",
        ),
      );
    }

    const updatePayload = Object.fromEntries(
      Object.entries(allowedUpdates).filter(([, value]) => value !== undefined),
    );

    updatePayload.profileModerationStatus = safety.reviewRecommended
      ? "pending_review"
      : "approved";
    updatePayload.profileSafetyFlags = safety.reviewFlags;

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { $set: updatePayload },
      { new: true },
    ).select("-password");

    res.status(200).json({
      ...updatedUser.toObject(),
      trustSafety: {
        profileModerationStatus: updatedUser.profileModerationStatus,
        flags: updatedUser.profileSafetyFlags,
      },
    });
  } catch (error) {
    if (error?.code === 11000) {
      return next(createError(409, "Username already exists"));
    }
    next(error);
  }
};

export const blockUser = async (req, res, next) => {
  try {
    if (req.userId !== req.params.id) {
      return next(createError(403, "you can update only your account"));
    }

    const { blockedUserId } = req.body;
    if (!blockedUserId) {
      return next(createError(400, "blockedUserId is required"));
    }

    if (blockedUserId === req.userId) {
      return next(createError(400, "you cannot block yourself"));
    }

    const target = await User.findById(blockedUserId);
    if (!target) {
      return next(createError(404, "User to block not found"));
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { $addToSet: { blockedUsers: blockedUserId } },
      { new: true },
    ).select("blockedUsers");

    res.status(200).json({
      message: "User blocked successfully",
      blockedUsers: updatedUser.blockedUsers,
    });
  } catch (error) {
    next(error);
  }
};

export const unblockUser = async (req, res, next) => {
  try {
    if (req.userId !== req.params.id) {
      return next(createError(403, "you can update only your account"));
    }

    const { blockedUserId } = req.body;
    if (!blockedUserId) {
      return next(createError(400, "blockedUserId is required"));
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { $pull: { blockedUsers: blockedUserId } },
      { new: true },
    ).select("blockedUsers");

    res.status(200).json({
      message: "User unblocked successfully",
      blockedUsers: updatedUser.blockedUsers,
    });
  } catch (error) {
    next(error);
  }
};

export const updateLocationPreferences = async (req, res, next) => {
  try {
    if (req.userId !== req.params.id) {
      return next(createError(403, "you can update only your account"));
    }

    const { preferredAreas = [], location, notificationSettings } = req.body;

    const sanitizedAreas = preferredAreas
      .filter(
        (area) =>
          area &&
          Array.isArray(area.coordinates) &&
          area.coordinates.length === 2,
      )
      .map((area) => ({
        label: area.label || area.city || "Preferred Area",
        city: area.city || "",
        radiusKm: Math.max(1, toNumber(area.radiusKm, 10)),
        coordinates: [
          toNumber(area.coordinates[0]),
          toNumber(area.coordinates[1]),
        ],
      }));

    const update = {
      ...(sanitizedAreas.length > 0 ? { preferredAreas: sanitizedAreas } : {}),
      ...(location &&
      Array.isArray(location.coordinates) &&
      location.coordinates.length === 2
        ? {
            location: {
              type: "Point",
              coordinates: [
                toNumber(location.coordinates[0]),
                toNumber(location.coordinates[1]),
              ],
              address: location.address || "",
              city: location.city || "",
              pincode: location.pincode || "",
            },
          }
        : {}),
      ...(notificationSettings
        ? {
            notificationSettings: {
              nearbyGigAlerts: notificationSettings.nearbyGigAlerts !== false,
              preferredAreaAlerts:
                notificationSettings.preferredAreaAlerts !== false,
              maxAlertDistanceKm: Math.max(
                1,
                toNumber(notificationSettings.maxAlertDistanceKm, 15),
              ),
            },
          }
        : {}),
    };

    const updatedUser = await User.findByIdAndUpdate(req.params.id, update, {
      new: true,
    });
    res.status(200).json(updatedUser);
  } catch (error) {
    next(error);
  }
};

export const getAreaAlerts = async (req, res, next) => {
  try {
    if (req.userId !== req.params.id) {
      return next(createError(403, "you can view only your alerts"));
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return next(createError(404, "User not found"));
    }

    const gigModel = (await import("../models/gig.model.js")).default;
    const gigs = await gigModel
      .find({ status: "open" })
      .sort({ createdAt: -1 })
      .limit(50);

    const areas = user.preferredAreas || [];
    const userCoords = user.location?.coordinates || [0, 0];
    const maxAlertDistance =
      user.notificationSettings?.maxAlertDistanceKm || 15;

    const alerts = gigs
      .map((gig) => {
        const gigCoords = gig.geoLocation?.coordinates || [0, 0];
        if (!gigCoords[0] || !gigCoords[1]) {
          return null;
        }

        const areaMatch = areas.find((area) => {
          const distance = calculateDistanceKm(
            area.coordinates[1],
            area.coordinates[0],
            gigCoords[1],
            gigCoords[0],
          );
          return distance <= area.radiusKm;
        });

        const nearbyDistance =
          userCoords[0] && userCoords[1]
            ? calculateDistanceKm(
                userCoords[1],
                userCoords[0],
                gigCoords[1],
                gigCoords[0],
              )
            : null;

        const isNearby =
          nearbyDistance !== null && nearbyDistance <= maxAlertDistance;
        const shouldAlert =
          (user.notificationSettings?.preferredAreaAlerts !== false &&
            areaMatch) ||
          (user.notificationSettings?.nearbyGigAlerts !== false && isNearby);

        if (!shouldAlert) {
          return null;
        }

        return {
          gigId: gig._id,
          title: gig.title,
          location: gig.location,
          category: gig.cat,
          price: gig.price,
          createdAt: gig.createdAt,
          reason: areaMatch
            ? `New gig in your preferred area: ${areaMatch.label}`
            : `New gig within ${nearbyDistance.toFixed(1)} km of your location`,
          distanceKm: nearbyDistance ? Number(nearbyDistance.toFixed(1)) : null,
        };
      })
      .filter(Boolean)
      .slice(0, 8);

    res.status(200).json({ alerts });
  } catch (error) {
    next(error);
  }
};
