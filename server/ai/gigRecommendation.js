import Gig from "../models/gig.model.js";
import User from "../models/user.model.js";
import Application from "../models/application.model.js";

/**
 * Smart Gig Recommendation System
 * Recommends gigs based on:
 * 1. User skills matching
 * 2. Location proximity
 * 3. Category preferences
 * 4. Historical activity
 * 5. Experience level matching
 */

// Calculate skill match score (0-100)
const calculateSkillScore = (userSkills, gigSkills) => {
  if (!gigSkills || gigSkills.length === 0) return 50; // No skills required = neutral score
  if (!userSkills || userSkills.length === 0) return 20; // User has no skills listed

  const normalizedUserSkills = userSkills.map((s) => s.toLowerCase().trim());
  const normalizedGigSkills = gigSkills.map((s) => s.toLowerCase().trim());

  let matches = 0;
  for (const skill of normalizedGigSkills) {
    if (
      normalizedUserSkills.some(
        (us) =>
          us.includes(skill) ||
          skill.includes(us) ||
          levenshteinDistance(us, skill) <= 2, // Fuzzy matching
      )
    ) {
      matches++;
    }
  }

  return Math.round((matches / normalizedGigSkills.length) * 100);
};

// Calculate distance between two coordinates (Haversine formula)
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Calculate location score (0-100) - closer = higher score
const calculateLocationScore = (userCoords, gigCoords, maxDistance = 50) => {
  if (!userCoords || !gigCoords || userCoords[0] === 0 || gigCoords[0] === 0)
    return 50; // Unknown location

  const distance = calculateDistance(
    userCoords[1],
    userCoords[0], // lat, lon
    gigCoords[1],
    gigCoords[0],
  );

  if (distance <= 2) return 100; // Within 2km = perfect score
  if (distance >= maxDistance) return 0; // Too far

  return Math.round(100 - (distance / maxDistance) * 100);
};

// Calculate category preference score
const calculateCategoryScore = (userPreferences, gigCategory) => {
  if (!userPreferences || userPreferences.length === 0) return 50;
  if (!gigCategory) return 50;

  const normalizedCat = gigCategory.toLowerCase();
  const normalizedPrefs = userPreferences.map((p) => p.toLowerCase());

  if (normalizedPrefs.includes(normalizedCat)) return 100;
  if (
    normalizedPrefs.some(
      (p) => normalizedCat.includes(p) || p.includes(normalizedCat),
    )
  )
    return 70;
  return 30;
};

// Calculate experience match score
const calculateExperienceScore = (userExp, gigExp) => {
  if (gigExp === "any" || !gigExp) return 100;
  if (!userExp) return 50;

  const levels = { beginner: 1, intermediate: 2, experienced: 3, expert: 4 };
  const userLevel = levels[userExp] || 1;
  const gigLevel = levels[gigExp] || 1;

  if (userLevel >= gigLevel) return 100;
  if (userLevel === gigLevel - 1) return 70;
  return 40;
};

// Calculate historical activity score
const calculateHistoryScore = async (userId) => {
  try {
    const applications = await Application.find({ studentId: userId });
    const completedGigs = applications.filter(
      (a) => a.status === "completed",
    ).length;
    const totalApplications = applications.length;

    // Users who complete gigs get a bonus
    if (completedGigs > 10) return 100;
    if (completedGigs > 5) return 80;
    if (totalApplications > 5) return 60;
    return 40; // New user
  } catch (error) {
    return 50; // Default score
  }
};

// Levenshtein distance for fuzzy matching
const levenshteinDistance = (str1, str2) => {
  const m = str1.length,
    n = str2.length;
  const dp = Array(m + 1)
    .fill(null)
    .map(() => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) dp[i][j] = dp[i - 1][j - 1];
      else
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
};

/**
 * Main recommendation function
 * @param {string} userId - User ID to get recommendations for
 * @param {object} options - Configuration options
 * @returns {Array} - Sorted array of recommended gigs with scores
 */
export const recommendGigs = async (userId, options = {}) => {
  const {
    limit = 10,
    maxDistance = 50, // km
    includeScores = false,
    weights = {
      skill: 0.35,
      location: 0.25,
      category: 0.15,
      experience: 0.15,
      history: 0.1,
    },
  } = options;

  try {
    // Get user data
    const user = await User.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Get all open gigs
    const gigs = await Gig.find({ status: "open" });

    // Calculate history score once (same for all gigs)
    const historyScore = await calculateHistoryScore(userId);

    // Score each gig
    const scoredGigs = gigs.map((gig) => {
      const skillScore = calculateSkillScore(user.skills, gig.requiredSkills);
      const locationScore = calculateLocationScore(
        user.location?.coordinates,
        gig.geoLocation?.coordinates,
        maxDistance,
      );
      const categoryScore = calculateCategoryScore(
        user.preferredCategories,
        gig.cat,
      );
      const experienceScore = calculateExperienceScore(
        user.experienceLevel,
        gig.experienceRequired,
      );

      // Weighted total score
      const totalScore = Math.round(
        skillScore * weights.skill +
          locationScore * weights.location +
          categoryScore * weights.category +
          experienceScore * weights.experience +
          historyScore * weights.history,
      );

      return {
        gig: gig.toObject(),
        scores: includeScores
          ? {
              skill: skillScore,
              location: locationScore,
              category: categoryScore,
              experience: experienceScore,
              history: historyScore,
              total: totalScore,
            }
          : undefined,
        matchScore: totalScore,
      };
    });

    // Sort by score and return top results
    const recommendations = scoredGigs
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, limit);

    return recommendations;
  } catch (error) {
    console.error("Recommendation error:", error);
    throw error;
  }
};

/**
 * Get similar gigs based on a given gig
 * @param {string} gigId - Reference gig ID
 * @param {number} limit - Number of similar gigs to return
 */
export const getSimilarGigs = async (gigId, limit = 5) => {
  try {
    const referenceGig = await Gig.findById(gigId);
    if (!referenceGig) {
      throw new Error("Gig not found");
    }

    const allGigs = await Gig.find({
      _id: { $ne: gigId },
      status: "open",
    });

    const similarGigs = allGigs.map((gig) => {
      let similarityScore = 0;

      // Category match
      if (gig.cat === referenceGig.cat) similarityScore += 40;

      // Skills overlap
      const commonSkills =
        gig.requiredSkills?.filter((s) =>
          referenceGig.requiredSkills?.includes(s),
        ).length || 0;
      similarityScore += Math.min(commonSkills * 10, 30);

      // Price similarity (within 30% = similar)
      const priceDiff =
        Math.abs(gig.price - referenceGig.price) / referenceGig.price;
      if (priceDiff <= 0.3) similarityScore += 20;

      // Location similarity
      if (gig.geoLocation?.city === referenceGig.geoLocation?.city)
        similarityScore += 10;

      return { gig, similarityScore };
    });

    return similarGigs
      .sort((a, b) => b.similarityScore - a.similarityScore)
      .slice(0, limit)
      .map((item) => item.gig);
  } catch (error) {
    console.error("Similar gigs error:", error);
    throw error;
  }
};

/**
 * Get trending gigs in user's area
 */
export const getTrendingGigs = async (userLocation, limit = 10) => {
  try {
    const gigs = await Gig.find({ status: "open" })
      .sort({ views: -1, applicantCount: -1, createdAt: -1 })
      .limit(limit * 2); // Get more to filter by location

    // If user has location, prioritize nearby trending gigs
    if (userLocation?.coordinates && userLocation.coordinates[0] !== 0) {
      const scoredGigs = gigs.map((gig) => {
        const locationScore = calculateLocationScore(
          userLocation.coordinates,
          gig.geoLocation?.coordinates,
        );
        const trendScore =
          (gig.views || 0) * 0.5 + (gig.applicantCount || 0) * 2;
        return { gig, score: trendScore + locationScore };
      });

      return scoredGigs
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map((item) => item.gig);
    }

    return gigs.slice(0, limit);
  } catch (error) {
    console.error("Trending gigs error:", error);
    throw error;
  }
};
