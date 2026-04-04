import express from "express";
import {
  createReview,
  getGigReviews,
  getUserReviews,
  checkReviewStatus,
} from "../controller/review.controller.js";
import { verifyToken } from "../middelware/jwt.js";

const router = express.Router();

router.post("/", verifyToken, createReview);
router.get("/gig/:gigId", getGigReviews);
router.get("/user/:userId", getUserReviews);
router.get("/check/:applicationId", verifyToken, checkReviewStatus);

export default router;
