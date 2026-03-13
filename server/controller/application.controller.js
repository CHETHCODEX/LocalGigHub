import Application from "../models/application.model.js";
import createError from "../utils/createError.js";
import Gig from "../models/gig.model.js";
import User from "../models/user.model.js";
import { createNotification } from "../utils/notify.js";

export const createApplication = async (req, res, next) => {
  if (req.role !== "student") {
    return next(createError(403, "Only students can apply to gigs"));
  }

  try {
    const gig = await Gig.findById(req.body.gigId);
    if (!gig) return next(createError(404, "Gig not found"));

    if (gig.moderationStatus && gig.moderationStatus !== "approved") {
      return next(
        createError(
          403,
          "This gig is under moderation review and is not accepting applications",
        ),
      );
    }

    const [student, shop] = await Promise.all([
      User.findById(req.userId).select("blockedUsers username"),
      User.findById(gig.userId).select("blockedUsers"),
    ]);

    if (!student || !shop) {
      return next(createError(404, "User not found"));
    }

    const studentBlockedShop = (student.blockedUsers || []).includes(
      gig.userId,
    );
    const shopBlockedStudent = (shop.blockedUsers || []).includes(req.userId);

    if (studentBlockedShop || shopBlockedStudent) {
      return next(
        createError(
          403,
          "Application blocked due to trust and safety settings",
        ),
      );
    }

    // Check if already applied
    const existing = await Application.findOne({
      gigId: req.body.gigId,
      studentId: req.userId,
    });

    if (existing) {
      return res.status(400).json("You have already applied to this gig");
    }

    const newApplication = new Application({
      gigId: gig._id,
      studentId: req.userId,
      shopId: gig.userId,
      coverLetter: req.body.coverLetter,
    });

    const savedApplication = await newApplication.save();

    await createNotification({
      userId: gig.userId,
      type: "application:new",
      title: "New application received",
      body: `${student?.username || "A student"} applied to ${gig.title || "your gig"}`,
      link: "/shop/dashboard",
      meta: {
        applicationId: savedApplication._id,
        gigId: gig._id,
        studentId: req.userId,
      },
    });

    res.status(201).json(savedApplication);
  } catch (error) {
    next(error);
  }
};

export const getApplications = async (req, res, next) => {
  try {
    let applications;
    if (req.role === "student") {
      // Students see their own applications
      applications = await Application.find({ studentId: req.userId });
    } else if (req.role === "shop") {
      // Shops see applications to their gigs
      applications = await Application.find({ shopId: req.userId });
    } else {
      return next(createError(403, "Invalid role"));
    }

    // Populate gig and user details
    const populatedApplications = await Promise.all(
      applications.map(async (app) => {
        const gig = await Gig.findById(app.gigId);
        const student = await User.findById(app.studentId);
        return {
          ...app._doc,
          gigTitle: gig?.title || "Unknown Gig",
          applicantName: student?.username || "Unknown User",
        };
      }),
    );

    res.status(200).json(populatedApplications);
  } catch (error) {
    next(error);
  }
};

export const getApplication = async (req, res, next) => {
  try {
    const application = await Application.findById(req.params.id);
    if (!application) return next(createError(404, "Application not found"));

    // Check if user has permission to view
    if (
      application.studentId !== req.userId &&
      application.shopId !== req.userId
    ) {
      return next(createError(403, "Not authorized"));
    }

    res.status(200).json(application);
  } catch (error) {
    next(error);
  }
};

export const updateApplicationStatus = async (req, res, next) => {
  if (req.role !== "shop") {
    return next(createError(403, "Only shops can update application status"));
  }

  try {
    const application = await Application.findById(req.params.id);
    if (!application) return next(createError(404, "Application not found"));

    if (application.shopId !== req.userId) {
      return next(
        createError(403, "You can only manage applications for your own gigs"),
      );
    }

    application.status = req.body.status;
    await application.save();

    await createNotification({
      userId: application.studentId,
      type: `application:${application.status}`,
      title: "Application status updated",
      body: `Your application is now ${application.status}`,
      link: "/student/dashboard",
      meta: {
        applicationId: application._id,
        gigId: application.gigId,
        status: application.status,
      },
    });

    res.status(200).json(application);
  } catch (error) {
    next(error);
  }
};
