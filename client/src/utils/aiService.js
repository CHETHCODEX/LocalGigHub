import newRequest from "./newRequest";

/**
 * AI Service - Client-side API wrapper for AI features
 */

// ==================== GIG RECOMMENDATIONS ====================

/**
 * Get personalized gig recommendations for a user
 * @param {string} userId - User ID
 * @param {object} options - { limit, includeScores }
 */
export const getRecommendations = async (userId, options = {}) => {
  const { limit = 10, includeScores = false } = options;
  const response = await newRequest.get(`ai/recommendations/${userId}`, {
    params: { limit, includeScores },
  });
  return response.data;
};

/**
 * Get similar gigs to a specific gig
 * @param {string} gigId - Gig ID
 * @param {number} limit - Max results
 */
export const getSimilarGigs = async (gigId, limit = 5) => {
  const response = await newRequest.get(`ai/similar/${gigId}`, {
    params: { limit },
  });
  return response.data;
};

/**
 * Get trending gigs
 * @param {object} location - { lat, lng }
 * @param {number} limit - Max results
 */
export const getTrendingGigs = async (location = {}, limit = 10) => {
  const response = await newRequest.get("ai/trending", {
    params: { ...location, limit },
  });
  return response.data;
};

// ==================== SKILL EXTRACTION ====================

/**
 * Extract skills from text (resume/bio)
 * @param {string} text - Text to analyze
 */
export const extractSkillsFromText = async (text) => {
  const response = await newRequest.post("ai/extract-skills", { text });
  return response.data;
};

/**
 * Get suggested skills for a category
 * @param {string} category - Gig category
 */
export const getSkillsForCategory = async (category) => {
  const response = await newRequest.get(`ai/skills/suggest/${category}`);
  return response.data;
};

/**
 * Get skill autocomplete suggestions
 * @param {string} query - Partial skill name
 * @param {number} limit - Max results
 */
export const getSkillAutocomplete = async (query, limit = 10) => {
  const response = await newRequest.get("ai/skills/autocomplete", {
    params: { q: query, limit },
  });
  return response.data;
};

/**
 * Analyze user's skills
 * @param {string} userId - User ID
 */
export const analyzeUserSkills = async (userId) => {
  const response = await newRequest.get(`ai/skills/analyze/${userId}`);
  return response.data;
};

/**
 * Get skill improvement suggestions
 * @param {string} userId - User ID
 */
export const getSkillImprovements = async (userId) => {
  const response = await newRequest.get(`ai/skills/improvements/${userId}`);
  return response.data;
};

/**
 * Update user's skills
 * @param {string} userId - User ID
 * @param {Array} skills - Array of skill strings
 */
export const updateUserSkills = async (userId, skills) => {
  const response = await newRequest.put(`ai/skills/update/${userId}`, {
    skills,
  });
  return response.data;
};

// ==================== DEMAND PREDICTION ====================

/**
 * Predict demand for a gig
 * @param {object} gigDetails - { category, location, coordinates, price }
 */
export const predictDemand = async (gigDetails) => {
  const response = await newRequest.post("ai/demand/predict", gigDetails);
  return response.data;
};

/**
 * Get demand forecast for the week
 * @param {string} category - Gig category
 * @param {string} location - Location string
 */
export const getDemandForecast = async (category, location) => {
  const response = await newRequest.get("ai/demand/forecast", {
    params: { category, location },
  });
  return response.data;
};

/**
 * Get hot/trending categories in an area
 * @param {object} location - { lat, lng }
 */
export const getHotCategories = async (location = {}) => {
  const response = await newRequest.get("ai/demand/hot-categories", {
    params: location,
  });
  return response.data;
};

// ==================== PRICING SUGGESTIONS ====================

/**
 * Get price suggestion for a gig
 * @param {object} gigDetails - { category, duration, city, experienceRequired, skills }
 */
export const suggestPrice = async (gigDetails) => {
  const response = await newRequest.post("ai/pricing/suggest", gigDetails);
  return response.data;
};

/**
 * Analyze price competitiveness
 * @param {number} price - Price to analyze
 * @param {string} category - Gig category
 * @param {string} city - City name
 */
export const analyzePricing = async (price, category, city) => {
  const response = await newRequest.post("ai/pricing/analyze", {
    price,
    category,
    city,
  });
  return response.data;
};

/**
 * Get pricing trends for a category
 * @param {string} category - Gig category
 * @param {number} months - Number of months to analyze
 */
export const getPricingTrends = async (category, months = 3) => {
  const response = await newRequest.get(`ai/pricing/trends/${category}`, {
    params: { months },
  });
  return response.data;
};

/**
 * Get base prices for all categories
 */
export const getCategoryPrices = async () => {
  const response = await newRequest.get("ai/pricing/categories");
  return response.data;
};

// ==================== COMBINED INSIGHTS ====================

/**
 * Get comprehensive AI insights for creating a gig
 * @param {object} gigDetails - Full gig details
 */
export const getGigCreationInsights = async (gigDetails) => {
  const response = await newRequest.post("ai/gig-insights", gigDetails);
  return response.data;
};

/**
 * Get dashboard insights for a user
 * @param {string} userId - User ID
 */
export const getDashboardInsights = async (userId) => {
  const response = await newRequest.get(`ai/dashboard/${userId}`);
  return response.data;
};

export const seedGigSkills = async () => {
  const response = await newRequest.post("ai/seed-gig-skills");
  return response.data;
};
