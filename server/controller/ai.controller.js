import {
  recommendGigs,
  getSimilarGigs,
  getTrendingGigs,
} from "../ai/gigRecommendation.js";
import {
  extractSkillsFromText,
  suggestSkillsForCategory,
  getSkillSuggestions,
  validateSkills,
} from "../ai/skillExtraction.js";
import {
  predictLocalDemand,
  getDemandForecast,
  getHotCategories,
} from "../ai/localDemandPrediction.js";
import {
  suggestPrice,
  analyzePriceCompetitiveness,
  getPricingTrends,
  getCategoryPrices,
} from "../ai/pricingSuggestion.js";
import {
  analyzeUserSkills,
  suggestSkillsToAdd,
  predictSkillsFromHistory,
} from "../ai/studentSkillPrediction.js";
import User from "../models/user.model.js";
import Gig from "../models/gig.model.js";
import createError from "../utils/createError.js";

/**
 * AI Controller - Handles all AI/ML feature endpoints
 */

// ==================== GIG RECOMMENDATIONS ====================

/**
 * Get personalized gig recommendations for a user
 * GET /api/ai/recommendations/:userId
 */
export const getRecommendations = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { limit = 10, includeScores = false } = req.query;

    const recommendations = await recommendGigs(userId, {
      limit: parseInt(limit),
      includeScores: includeScores === "true",
    });

    res.status(200).json({
      success: true,
      count: recommendations.length,
      recommendations,
    });
  } catch (error) {
    next(createError(500, error.message));
  }
};

/**
 * Get similar gigs to a specific gig
 * GET /api/ai/similar/:gigId
 */
export const getSimilar = async (req, res, next) => {
  try {
    const { gigId } = req.params;
    const { limit = 5 } = req.query;

    const similarGigs = await getSimilarGigs(gigId, parseInt(limit));

    res.status(200).json({
      success: true,
      count: similarGigs.length,
      gigs: similarGigs,
    });
  } catch (error) {
    next(createError(500, error.message));
  }
};

/**
 * Get trending gigs in user's area
 * GET /api/ai/trending
 */
export const getTrending = async (req, res, next) => {
  try {
    const { lat, lng, limit = 10 } = req.query;

    const userLocation =
      lat && lng
        ? {
            coordinates: [parseFloat(lng), parseFloat(lat)],
          }
        : null;

    const trendingGigs = await getTrendingGigs(userLocation, parseInt(limit));

    res.status(200).json({
      success: true,
      count: trendingGigs.length,
      gigs: trendingGigs,
    });
  } catch (error) {
    next(createError(500, error.message));
  }
};

// ==================== SKILL EXTRACTION ====================

/**
 * Extract skills from text (resume/profile)
 * POST /api/ai/extract-skills
 */
export const extractSkills = async (req, res, next) => {
  try {
    const { text } = req.body;

    if (!text) {
      return next(createError(400, "Text is required"));
    }

    const result = extractSkillsFromText(text);

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(createError(500, error.message));
  }
};

/**
 * Get skill suggestions for a category
 * GET /api/ai/skills/suggest/:category
 */
export const getSkillsForCategory = async (req, res, next) => {
  try {
    const { category } = req.params;
    const skills = suggestSkillsForCategory(category);

    res.status(200).json({
      success: true,
      category,
      suggestedSkills: skills,
    });
  } catch (error) {
    next(createError(500, error.message));
  }
};

/**
 * Get skill autocomplete suggestions
 * GET /api/ai/skills/autocomplete
 */
export const skillAutocomplete = async (req, res, next) => {
  try {
    const { q, limit = 10 } = req.query;
    const suggestions = getSkillSuggestions(q, parseInt(limit));

    res.status(200).json({
      success: true,
      suggestions,
    });
  } catch (error) {
    next(createError(500, error.message));
  }
};

/**
 * Analyze user's skills and get recommendations
 * GET /api/ai/skills/analyze/:userId
 */
export const analyzeSkills = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const analysis = await analyzeUserSkills(userId);

    res.status(200).json({
      success: true,
      ...analysis,
    });
  } catch (error) {
    next(createError(500, error.message));
  }
};

/**
 * Get skill improvement suggestions for a user
 * GET /api/ai/skills/improvements/:userId
 */
export const getSkillImprovements = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const suggestions = await suggestSkillsToAdd(userId);

    res.status(200).json({
      success: true,
      ...suggestions,
    });
  } catch (error) {
    next(createError(500, error.message));
  }
};

/**
 * Update user skills from extracted data
 * PUT /api/ai/skills/update/:userId
 */
export const updateUserSkills = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { skills } = req.body;

    // Verify user owns this profile
    if (req.userId !== userId) {
      return next(createError(403, "You can only update your own skills"));
    }

    const validatedSkills = validateSkills(skills);

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: { skills: validatedSkills } },
      { new: true },
    );

    res.status(200).json({
      success: true,
      skills: updatedUser.skills,
      message: `Updated ${validatedSkills.length} skills`,
    });
  } catch (error) {
    next(createError(500, error.message));
  }
};

// ==================== DEMAND PREDICTION ====================

/**
 * Predict demand for a gig
 * POST /api/ai/demand/predict
 */
export const predictDemand = async (req, res, next) => {
  try {
    const { category, location, coordinates, price } = req.body;

    if (!category) {
      return next(createError(400, "Category is required"));
    }

    const prediction = await predictLocalDemand(
      category,
      location,
      coordinates,
      price,
    );

    res.status(200).json({
      success: true,
      ...prediction,
    });
  } catch (error) {
    next(createError(500, error.message));
  }
};

/**
 * Get demand forecast for the week
 * GET /api/ai/demand/forecast
 */
export const getDemandForecastRoute = async (req, res, next) => {
  try {
    const { category, location } = req.query;
    const forecast = await getDemandForecast(category, location);

    res.status(200).json({
      success: true,
      forecast,
    });
  } catch (error) {
    next(createError(500, error.message));
  }
};

/**
 * Get hot/trending categories in an area
 * GET /api/ai/demand/hot-categories
 */
export const getHotCategoriesRoute = async (req, res, next) => {
  try {
    const { lat, lng } = req.query;
    const coordinates = lat && lng ? [parseFloat(lng), parseFloat(lat)] : null;

    const hotCategories = await getHotCategories(coordinates);

    res.status(200).json({
      success: true,
      categories: hotCategories,
    });
  } catch (error) {
    next(createError(500, error.message));
  }
};

// ==================== PRICING SUGGESTIONS ====================

/**
 * Get price suggestion for a gig
 * POST /api/ai/pricing/suggest
 */
export const suggestPricing = async (req, res, next) => {
  try {
    const {
      category,
      duration,
      city,
      experienceRequired,
      skills,
      description,
    } = req.body;

    if (!category) {
      return next(createError(400, "Category is required"));
    }

    const suggestion = await suggestPrice({
      category,
      duration,
      city,
      experienceRequired,
      skills,
      description,
    });

    res.status(200).json({
      success: true,
      ...suggestion,
    });
  } catch (error) {
    next(createError(500, error.message));
  }
};

/**
 * Analyze price competitiveness
 * POST /api/ai/pricing/analyze
 */
export const analyzePricing = async (req, res, next) => {
  try {
    const { price, category, city } = req.body;

    if (!price || !category) {
      return next(createError(400, "Price and category are required"));
    }

    const analysis = await analyzePriceCompetitiveness(price, category, city);

    res.status(200).json({
      success: true,
      ...analysis,
    });
  } catch (error) {
    next(createError(500, error.message));
  }
};

/**
 * Get pricing trends for a category
 * GET /api/ai/pricing/trends/:category
 */
export const getPricingTrendsRoute = async (req, res, next) => {
  try {
    const { category } = req.params;
    const { months = 3 } = req.query;

    const trends = await getPricingTrends(category, parseInt(months));

    res.status(200).json({
      success: true,
      ...trends,
    });
  } catch (error) {
    next(createError(500, error.message));
  }
};

/**
 * Get base prices for all categories
 * GET /api/ai/pricing/categories
 */
export const getCategoryPricesRoute = async (req, res, next) => {
  try {
    const prices = getCategoryPrices();

    res.status(200).json({
      success: true,
      categories: prices,
    });
  } catch (error) {
    next(createError(500, error.message));
  }
};

// ==================== COMBINED AI INSIGHTS ====================

/**
 * Get comprehensive AI insights for creating a gig
 * POST /api/ai/gig-insights
 */
export const getGigCreationInsights = async (req, res, next) => {
  try {
    const {
      category,
      location,
      city,
      coordinates,
      duration,
      experienceRequired,
      skills,
    } = req.body;

    // Get pricing suggestion
    const pricing = await suggestPrice({
      category,
      duration,
      city,
      experienceRequired,
      skills,
    });

    // Get demand prediction
    const demand = await predictLocalDemand(
      category,
      location,
      coordinates,
      pricing.recommended,
    );

    // Get skill suggestions for the category
    const suggestedSkills = suggestSkillsForCategory(category);

    res.status(200).json({
      success: true,
      pricing,
      demand,
      suggestedSkills,
      recommendations: [
        ...(pricing.insights || []),
        ...(demand.insights || []),
      ],
    });
  } catch (error) {
    next(createError(500, error.message));
  }
};

/**
 * Get dashboard insights for a user
 * GET /api/ai/dashboard/:userId
 */
export const getDashboardInsights = async (req, res, next) => {
  try {
    const { userId } = req.params;

    // Get user
    const user = await User.findById(userId);
    if (!user) {
      return next(createError(404, "User not found"));
    }

    const isWorker = user.role === "student" || user.role === "worker";

    if (isWorker) {
      // Worker dashboard
      const [recommendations, skillAnalysis, hotCategories] = await Promise.all(
        [
          recommendGigs(userId, { limit: 5, includeScores: true }),
          analyzeUserSkills(userId),
          getHotCategories(user.location?.coordinates),
        ],
      );

      res.status(200).json({
        success: true,
        userType: "worker",
        recommendations,
        skillAnalysis,
        hotCategories,
        tips: [
          skillAnalysis.skillGaps.length > 0
            ? `Learn ${skillAnalysis.skillGaps[0]} to increase your gig matches`
            : "Your skills are well-matched for available gigs",
          `Complete your profile to improve recommendations`,
          hotCategories.length > 0
            ? `${hotCategories[0].category} gigs are trending in your area`
            : "Check back for trending categories",
        ],
      });
    } else {
      // Shop dashboard
      const hotCategories = await getHotCategories(user.location?.coordinates);

      res.status(200).json({
        success: true,
        userType: "shop",
        hotCategories,
        tips: [
          "Use AI pricing suggestions to set competitive rates",
          "Check demand prediction before posting gigs",
          "Add required skills to attract qualified workers",
        ],
      });
    }
  } catch (error) {
    next(createError(500, error.message));
  }
};

// ==================== SEED GIG SKILLS (Admin Utility) ====================

/**
 * Seed requiredSkills on existing gigs that have none, based on category/title/description.
 * POST /api/ai/seed-gig-skills
 */

const CATEGORY_SKILL_MAP = {
  retail: [
    "customer service",
    "cash handling",
    "inventory management",
    "communication",
    "sales",
  ],
  food: ["food handling", "cooking", "customer service", "hygiene", "teamwork"],
  delivery: [
    "driving",
    "navigation",
    "time management",
    "physical fitness",
    "communication",
  ],
  tutoring: [
    "teaching",
    "communication",
    "patience",
    "subject knowledge",
    "lesson planning",
  ],
  events: [
    "event management",
    "communication",
    "teamwork",
    "physical fitness",
    "customer service",
  ],
  other: ["communication", "teamwork", "time management", "adaptability"],
};

export const seedGigSkills = async (req, res, next) => {
  try {
    const gigsWithNoSkills = await Gig.find({
      $or: [
        { requiredSkills: { $exists: false } },
        { requiredSkills: { $size: 0 } },
      ],
    });

    if (gigsWithNoSkills.length === 0) {
      return res
        .status(200)
        .json({
          success: true,
          message: "All gigs already have skills.",
          updated: 0,
        });
    }

    let updatedCount = 0;
    for (const gig of gigsWithNoSkills) {
      const cat = (gig.cat || "other").toLowerCase();
      const baseSkills = CATEGORY_SKILL_MAP[cat] || CATEGORY_SKILL_MAP.other;

      // Also try to extract extra skills from title/description using keyword matching
      const text = `${gig.title || ""} ${gig.desc || ""}`.toLowerCase();
      const extraSkills = [];
      const keywordMap = {
        "computer|laptop|ms office|excel|word": "computer skills",
        "photoshop|design|canva": "graphic design",
        "social media|instagram|facebook": "social media",
        "english|hindi|language": "communication",
        "clean|cleaning|sweep|mop": "cleaning",
        "repair|fix|mechanic": "repair",
        "cook|bake|chef": "cooking",
        "drive|delivery|vehicle": "driving",
        "teach|tutor|coach": "teaching",
        "sell|sales|marketing": "sales",
      };
      for (const [pattern, skill] of Object.entries(keywordMap)) {
        if (new RegExp(pattern).test(text) && !baseSkills.includes(skill)) {
          extraSkills.push(skill);
        }
      }

      const skills = [
        ...new Set([...baseSkills.slice(0, 3), ...extraSkills.slice(0, 2)]),
      ];
      await Gig.findByIdAndUpdate(gig._id, { requiredSkills: skills });
      updatedCount++;
    }

    res.status(200).json({
      success: true,
      message: `Seeded skills for ${updatedCount} gigs. Recommendations will now show varied match scores.`,
      updated: updatedCount,
    });
  } catch (error) {
    next(createError(500, error.message));
  }
};
