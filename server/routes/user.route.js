import express from "express";
import {
  deleteUser,
  getUser,
  updateLocationPreferences,
  getAreaAlerts,
  updateUserProfile,
  blockUser,
  unblockUser,
} from "../controller/user.controller.js";
import { verifyToken } from "../middelware/jwt.js";

const router = express.Router();
router.delete("/:id", verifyToken, deleteUser);
router.get("/:id", verifyToken, getUser);
router.put("/:id/profile", verifyToken, updateUserProfile);
router.post("/:id/block", verifyToken, blockUser);
router.post("/:id/unblock", verifyToken, unblockUser);
router.put("/:id/location-preferences", verifyToken, updateLocationPreferences);
router.get("/:id/area-alerts", verifyToken, getAreaAlerts);
export default router;
