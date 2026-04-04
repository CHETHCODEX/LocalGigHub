import Review from "../models/review.model.js";
import Application from "../models/application.model.js";
import Gig from "../models/gig.model.js";
import User from "../models/user.model.js";
import createError from "../utils/createError.js";
import { createNotification } from "../utils/notify.js";

export const createReview = async (req, res, next) => {
  try {
    const { applicationId, star, comment } = req.body;

    if (!applicationId || !star) {
      return next(createError(400, "applicationId and star rating are required"));
    }

    if (star < 1 || star > 5) {
      return next(createError(400, "Star rating must be between 1 and 5"));
    }

    // Find the application
    const application = await Application.findById(applicationId);
    if (!application) {
      return next(createError(404, "Application not found"));
    }

    // Must be completed
    if (application.status !== "completed") {
      return next(
        createError(403, "You can only review after the gig is completed"),
      );
    }

    // Determine reviewer role and reviewee
    let reviewerRole, revieweeId;

    if (req.userId === application.studentId) {
      reviewerRole = "student";
      revieweeId = application.shopId;
    } else if (req.userId === application.shopId) {
      reviewerRole = "shop";
      revieweeId = application.studentId;
    } else {
      return next(
        createError(403, "You are not part of this application"),
      );
    }

    // Check for duplicate
    const existing = await Review.findOne({
      applicationId,
      reviewerRole,
    });

    if (existing) {
      return next(createError(400, "You have already reviewed this gig"));
    }

    // Create the review
    const review = await Review.create({
      gigId: application.gigId,
      applicationId,
      reviewerId: req.userId,
      revieweeId,
      reviewerRole,
      star,
      comment: comment || "",
    });

    // Update Gig star aggregates (for student reviews about the shop/gig)
    if (reviewerRole === "student") {
      await Gig.findByIdAndUpdate(application.gigId, {
        $inc: { totalStars: star, starNumber: 1 },
      });
    }

    // Recalculate reviewee's avgRating
    const allReviewsForUser = await Review.find({ revieweeId });
    const totalStars = allReviewsForUser.reduce((sum, r) => sum + r.star, 0);
    const avgRating =
      allReviewsForUser.length > 0
        ? Math.round((totalStars / allReviewsForUser.length) * 10) / 10
        : 0;

    await User.findByIdAndUpdate(revieweeId, { avgRating });

    // Get reviewer info for notification
    const reviewer = await User.findById(req.userId).select("username");

    // Notify the reviewee
    await createNotification({
      userId: revieweeId,
      type: "review:new",
      title: "You received a new review!",
      body: `${reviewer?.username || "Someone"} gave you ${star} star${star > 1 ? "s" : ""} ⭐`,
      link: reviewerRole === "student" ? "/shop/dashboard" : "/student/dashboard",
      meta: {
        reviewId: review._id,
        gigId: application.gigId,
        star,
      },
    });

    res.status(201).json(review);
  } catch (error) {
    // Handle duplicate key error from unique index
    if (error.code === 11000) {
      return next(createError(400, "You have already reviewed this gig"));
    }
    next(error);
  }
};

export const getGigReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find({ gigId: req.params.gigId }).sort({
      createdAt: -1,
    });

    // Populate reviewer info
    const populated = await Promise.all(
      reviews.map(async (review) => {
        const reviewer = await User.findById(review.reviewerId).select(
          "username img role",
        );
        return {
          ...review._doc,
          reviewerName: reviewer?.username || "Unknown User",
          reviewerImg: reviewer?.img || null,
          reviewerUserRole: reviewer?.role || review.reviewerRole,
        };
      }),
    );

    res.status(200).json(populated);
  } catch (error) {
    next(error);
  }
};

export const getUserReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find({
      revieweeId: req.params.userId,
    }).sort({ createdAt: -1 });

    // Populate reviewer and gig info
    const populated = await Promise.all(
      reviews.map(async (review) => {
        const [reviewer, gig] = await Promise.all([
          User.findById(review.reviewerId).select("username img role"),
          Gig.findById(review.gigId).select("title"),
        ]);
        return {
          ...review._doc,
          reviewerName: reviewer?.username || "Unknown User",
          reviewerImg: reviewer?.img || null,
          reviewerUserRole: reviewer?.role || review.reviewerRole,
          gigTitle: gig?.title || "Unknown Gig",
        };
      }),
    );

    res.status(200).json(populated);
  } catch (error) {
    next(error);
  }
};

export const checkReviewStatus = async (req, res, next) => {
  try {
    const review = await Review.findOne({
      applicationId: req.params.applicationId,
      reviewerId: req.userId,
    });

    res.status(200).json({
      hasReviewed: !!review,
      review: review || null,
    });
  } catch (error) {
    next(error);
  }
};
