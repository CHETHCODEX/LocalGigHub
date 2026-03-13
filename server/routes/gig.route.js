import express from "express";
import {
  createGig,
  deleteGig,
  getGig,
  getGigs,
  getGigRouteInfo,
  reportGig,
  getModerationQueue,
  moderateGig,
} from "../controller/gig.controller.js";
import { verifyToken } from "../middelware/jwt.js";
const router = express.Router();
router.post("/", verifyToken, createGig);
router.delete("/:id", verifyToken, deleteGig);
router.get("/moderation/queue", verifyToken, getModerationQueue);
router.patch("/:id/moderation", verifyToken, moderateGig);
router.post("/:id/report", verifyToken, reportGig);
router.get("/:id/route-info", getGigRouteInfo);
router.get("/single/:id", getGig);
router.get("/", getGigs);
export default router;
