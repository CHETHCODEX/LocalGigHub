import express from "express";
import { verifyToken } from "../middelware/jwt.js";
import {
  // Recommendations
  getRecommendations,
  getSimilar,
  getTrending,

  // Skills
  extractSkills,
  getSkillsForCategory,
  skillAutocomplete,
  analyzeSkills,
  getSkillImprovements,
  updateUserSkills,

  // Demand
  predictDemand,
  getDemandForecastRoute,
  getHotCategoriesRoute,

  // Pricing
  suggestPricing,
  analyzePricing,
  getPricingTrendsRoute,
  getCategoryPricesRoute,

  // Combined
  getGigCreationInsights,
  getDashboardInsights,
  seedGigSkills,
} from "../controller/ai.controller.js";

const router = express.Router();

// ==================== GIG RECOMMENDATIONS ====================
// Get personalized gig recommendations (requires auth)
router.get("/recommendations/:userId", verifyToken, getRecommendations);

// Get similar gigs to a specific gig (public)
router.get("/similar/:gigId", getSimilar);

// Get trending gigs (public)
router.get("/trending", getTrending);

// ==================== SKILL EXTRACTION ====================
// Extract skills from text (public - useful for signup)
router.post("/extract-skills", extractSkills);

// Get suggested skills for a category (public)
router.get("/skills/suggest/:category", getSkillsForCategory);

// Skill autocomplete (public)
router.get("/skills/autocomplete", skillAutocomplete);

// Analyze user's skills (requires auth)
router.get("/skills/analyze/:userId", verifyToken, analyzeSkills);

// Get skill improvement suggestions (requires auth)
router.get("/skills/improvements/:userId", verifyToken, getSkillImprovements);

// Update user skills (requires auth)
router.put("/skills/update/:userId", verifyToken, updateUserSkills);

// ==================== DEMAND PREDICTION ====================
// Predict demand for a gig (public - useful for shops)
router.post("/demand/predict", predictDemand);

// Get demand forecast for the week (public)
router.get("/demand/forecast", getDemandForecastRoute);

// Get hot categories in an area (public)
router.get("/demand/hot-categories", getHotCategoriesRoute);

// ==================== PRICING SUGGESTIONS ====================
// Get price suggestion (public - useful for gig creation)
router.post("/pricing/suggest", suggestPricing);

// Analyze price competitiveness (public)
router.post("/pricing/analyze", analyzePricing);

// Get pricing trends for a category (public)
router.get("/pricing/trends/:category", getPricingTrendsRoute);

// Get base prices for all categories (public)
router.get("/pricing/categories", getCategoryPricesRoute);

// ==================== COMBINED INSIGHTS ====================
// Get comprehensive AI insights for creating a gig (public)
router.post("/gig-insights", getGigCreationInsights);

// Get dashboard insights for a user (requires auth)
router.get("/dashboard/:userId", verifyToken, getDashboardInsights);

// Seed requiredSkills on existing gigs based on category/description (admin util)
router.post("/seed-gig-skills", seedGigSkills);

export default router;
