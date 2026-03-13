import User from "../models/user.model.js";
import Application from "../models/application.model.js";
import Gig from "../models/gig.model.js";
import {
  extractSkillsFromText,
  getSkillsByCategory,
} from "./skillExtraction.js";

/**
 * Worker/Student Skill Prediction Module
 * Predicts and suggests skills based on:
 * 1. Profile analysis
 * 2. Completed gig history
 * 3. Application patterns
 * 4. Location-based popular skills
 */

/**
 * Predict skills from user's profile text
 * @param {string} profileText - User description/bio
 * @returns {Array} - Predicted skills
 */
export const predictSkillsFromProfile = async (profileText) => {
  if (!profileText || typeof profileText !== "string") {
    return [];
  }

  const extraction = extractSkillsFromText(profileText);
  return extraction.skills.slice(0, 15); // Return top 15 skills
};

/**
 * Predict skills based on user's gig history
 * @param {string} userId - User ID
 * @returns {Object} - Predicted skills with confidence
 */
export const predictSkillsFromHistory = async (userId) => {
  try {
    // Get completed applications
    const applications = await Application.find({
      studentId: userId,
      status: "completed",
    });

    if (applications.length === 0) {
      return { skills: [], source: "history", confidence: 0 };
    }

    // Get the gigs
    const gigIds = applications.map((a) => a.gigId);
    const gigs = await Gig.find({ _id: { $in: gigIds } });

    // Collect skills from completed gigs
    const skillCounts = {};
    const categories = {};

    for (const gig of gigs) {
      // Count categories
      if (gig.cat) {
        categories[gig.cat] = (categories[gig.cat] || 0) + 1;
      }

      // Count required skills
      for (const skill of gig.requiredSkills || []) {
        const normalized = skill.toLowerCase();
        skillCounts[normalized] = (skillCounts[normalized] || 0) + 1;
      }
    }

    // Also infer skills from top categories
    const topCategories = Object.entries(categories)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([cat]) => cat);

    for (const cat of topCategories) {
      const catSkills = getSkillsByCategory(mapCategoryToSkillCategory(cat));
      for (const skill of catSkills.slice(0, 3)) {
        skillCounts[skill] = (skillCounts[skill] || 0) + 0.5;
      }
    }

    // Sort by frequency
    const predictedSkills = Object.entries(skillCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .map(([skill, count]) => ({
        skill,
        frequency: count,
        confidence: Math.min(Math.round((count / gigs.length) * 100), 100),
      }));

    return {
      skills: predictedSkills.map((s) => s.skill),
      skillsWithConfidence: predictedSkills,
      topCategories,
      source: "history",
      gigsAnalyzed: gigs.length,
      confidence:
        gigs.length >= 5 ? "high" : gigs.length >= 2 ? "medium" : "low",
    };
  } catch (error) {
    console.error("History skill prediction error:", error);
    return {
      skills: [],
      source: "history",
      confidence: 0,
      error: error.message,
    };
  }
};

/**
 * Map gig category to skill database category
 */
const mapCategoryToSkillCategory = (gigCategory) => {
  const mapping = {
    delivery: "manual",
    cleaning: "manual",
    tutoring: "education",
    tech: "programming",
    design: "design",
    marketing: "marketing",
    "customer-service": "service",
    "food-service": "service",
    retail: "service",
    "data-entry": "office",
    accounting: "office",
    healthcare: "healthcare",
    childcare: "healthcare",
  };

  return mapping[gigCategory?.toLowerCase()] || "soft";
};

/**
 * Get skill suggestions based on location demand
 * @param {string} city - City name
 * @returns {Array} - In-demand skills in that area
 */
export const getLocationBasedSkillSuggestions = async (city) => {
  try {
    // Get recent successful gigs in the city
    const recentGigs = await Gig.find({
      "geoLocation.city": { $regex: city, $options: "i" },
      status: { $in: ["completed", "in_progress"] },
      createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
    }).limit(100);

    const skillCounts = {};
    for (const gig of recentGigs) {
      for (const skill of gig.requiredSkills || []) {
        skillCounts[skill.toLowerCase()] =
          (skillCounts[skill.toLowerCase()] || 0) + 1;
      }
    }

    const inDemandSkills = Object.entries(skillCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([skill, demand]) => ({ skill, demand }));

    return {
      city,
      inDemandSkills,
      gigsAnalyzed: recentGigs.length,
    };
  } catch (error) {
    return { city, inDemandSkills: [], error: error.message };
  }
};

/**
 * Comprehensive skill analysis for a user
 * Combines all sources: profile, history, and location
 */
export const analyzeUserSkills = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Source 1: Existing skills in profile
    const existingSkills = user.skills || [];

    // Source 2: Skills from profile description
    const profileSkills = await predictSkillsFromProfile(user.desc);

    // Source 3: Skills from gig history
    const historyResult = await predictSkillsFromHistory(userId);

    // Source 4: Location-based suggestions (if city available)
    let locationSkills = [];
    if (user.location?.city) {
      const locationResult = await getLocationBasedSkillSuggestions(
        user.location.city,
      );
      locationSkills = locationResult.inDemandSkills.map((s) => s.skill);
    }

    // Combine and deduplicate
    const allSkills = new Set([
      ...existingSkills,
      ...profileSkills,
      ...historyResult.skills,
    ]);

    // Identify skill gaps (in-demand but not possessed)
    const skillGaps = locationSkills.filter((s) => !allSkills.has(s));

    // Calculate skill score
    const skillScore = Math.min(
      Math.round(
        existingSkills.length * 5 +
          historyResult.skills.length * 10 +
          profileSkills.length * 3,
      ),
      100,
    );

    return {
      currentSkills: existingSkills,
      inferredSkills: [...new Set([...profileSkills, ...historyResult.skills])],
      allSkills: [...allSkills],
      skillGaps,
      recommendations: skillGaps.slice(0, 5).map((skill) => ({
        skill,
        reason: `High demand in ${user.location?.city || "your area"}`,
      })),
      skillScore,
      analysis: {
        fromProfile: profileSkills.length,
        fromHistory: historyResult.skills.length,
        existing: existingSkills.length,
      },
    };
  } catch (error) {
    console.error("Skill analysis error:", error);
    throw error;
  }
};

/**
 * Suggest skills to add based on user's weak areas
 */
export const suggestSkillsToAdd = async (userId) => {
  try {
    const analysis = await analyzeUserSkills(userId);

    // Get general popular skills
    const popularSkills = [
      "communication",
      "time management",
      "microsoft office",
      "customer service",
      "driving",
      "data entry",
    ];

    // Filter out skills user already has
    const suggestions = [
      ...analysis.skillGaps,
      ...popularSkills.filter((s) => !analysis.allSkills.includes(s)),
    ].slice(0, 10);

    return {
      suggestions,
      currentSkillCount: analysis.currentSkills.length,
      skillScore: analysis.skillScore,
    };
  } catch (error) {
    return { suggestions: [], error: error.message };
  }
};

// Keep the original export for backward compatibility
export const predictStudentSkills = predictSkillsFromProfile;
