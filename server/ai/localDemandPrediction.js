import Gig from "../models/gig.model.js";
import User from "../models/user.model.js";
import Application from "../models/application.model.js";

/**
 * Local Demand Prediction Module
 * Predicts the likelihood of finding workers for a gig based on:
 * 1. Number of available workers in the area
 * 2. Historical application rates for similar gigs
 * 3. Category popularity in the location
 * 4. Time-based demand patterns
 * 5. Competition analysis (other open gigs)
 */

// Category demand weights (based on typical local gig economy)
const CATEGORY_BASE_DEMAND = {
  delivery: 85,
  cleaning: 80,
  tutoring: 75,
  retail: 70,
  "data-entry": 65,
  "customer-service": 70,
  "manual-labor": 80,
  "food-service": 75,
  catering: 70,
  "event-help": 65,
  "garden-work": 60,
  driving: 80,
  "tech-support": 55,
  design: 50,
  "content-writing": 55,
  photography: 45,
  "video-editing": 45,
  marketing: 50,
  accounting: 45,
  default: 60,
};

// Time multipliers (certain times have higher worker availability)
const getTimeMultiplier = () => {
  const hour = new Date().getHours();
  const day = new Date().getDay();

  // Weekends: Higher availability of students/part-timers
  const isWeekend = day === 0 || day === 6;
  if (isWeekend) return 1.2;

  // Evening hours: More workers available
  if (hour >= 17 && hour <= 21) return 1.1;

  // Early morning: Lower availability
  if (hour >= 5 && hour <= 8) return 0.8;

  // Business hours: Moderate
  return 1.0;
};

/**
 * Calculate distance between two geo coordinates
 */
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

/**
 * Get available workers count in an area
 */
const getWorkersInArea = async (coordinates, radiusKm = 10) => {
  if (!coordinates || coordinates[0] === 0) {
    // Return estimate if no coordinates
    return { count: 50, estimated: true };
  }

  try {
    // Find workers (students and workers) with geolocation
    const workers = await User.find({
      role: { $in: ["student", "worker"] },
      "location.coordinates": {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: coordinates,
          },
          $maxDistance: radiusKm * 1000, // Convert to meters
        },
      },
    });

    return { count: workers.length, estimated: false };
  } catch (error) {
    // If geospatial query fails, do city-based count
    return { count: 50, estimated: true };
  }
};

/**
 * Get historical application rate for similar gigs
 */
const getHistoricalApplicationRate = async (category, location) => {
  try {
    const similarGigs = await Gig.find({
      cat: category,
      status: { $in: ["completed", "in_progress"] },
    }).limit(50);

    if (similarGigs.length === 0) {
      return { rate: 0.5, sampleSize: 0 };
    }

    const totalApplications = similarGigs.reduce(
      (sum, gig) => sum + (gig.applicantCount || 0),
      0,
    );

    const avgApplications = totalApplications / similarGigs.length;

    // Normalize to 0-1 rate (assuming 5+ applications is good)
    const rate = Math.min(avgApplications / 5, 1);

    return { rate, sampleSize: similarGigs.length, avgApplications };
  } catch (error) {
    return { rate: 0.5, sampleSize: 0 };
  }
};

/**
 * Get competition score (other similar open gigs)
 */
const getCompetitionScore = async (category, coordinates) => {
  try {
    const openGigs = await Gig.find({
      cat: category,
      status: "open",
    });

    // More competition = harder to find workers
    if (openGigs.length > 10) return 0.6; // High competition
    if (openGigs.length > 5) return 0.8; // Moderate
    return 1.0; // Low competition - easier to find workers
  } catch (error) {
    return 0.8;
  }
};

/**
 * Main demand prediction function
 * @param {string} category - Gig category
 * @param {string} location - Location string
 * @param {Array} coordinates - [longitude, latitude]
 * @param {number} price - Gig price
 * @returns {Object} - Demand prediction with score and insights
 */
export const predictLocalDemand = async (
  category,
  location,
  coordinates = [0, 0],
  price = 0,
) => {
  try {
    const categoryLower = category?.toLowerCase() || "default";

    // Factor 1: Base category demand
    const baseDemand =
      CATEGORY_BASE_DEMAND[categoryLower] || CATEGORY_BASE_DEMAND.default;

    // Factor 2: Workers in area
    const workersData = await getWorkersInArea(coordinates);
    let workerScore;
    if (workersData.count >= 100) workerScore = 100;
    else if (workersData.count >= 50) workerScore = 85;
    else if (workersData.count >= 20) workerScore = 70;
    else if (workersData.count >= 10) workerScore = 55;
    else workerScore = 40;

    // Factor 3: Historical application rate
    const historicalData = await getHistoricalApplicationRate(
      categoryLower,
      location,
    );
    const historicalScore = historicalData.rate * 100;

    // Factor 4: Time multiplier
    const timeMultiplier = getTimeMultiplier();

    // Factor 5: Competition
    const competitionMultiplier = await getCompetitionScore(
      categoryLower,
      coordinates,
    );

    // Factor 6: Price attractiveness (higher pay = more interest)
    let priceScore = 50;
    if (price > 0) {
      // Compare with average for category
      const avgPrice = await getAveragePriceForCategory(categoryLower);
      const priceRatio = price / avgPrice;
      if (priceRatio >= 1.3)
        priceScore = 95; // 30%+ above average
      else if (priceRatio >= 1.1)
        priceScore = 80; // 10-30% above
      else if (priceRatio >= 0.9)
        priceScore = 65; // Near average
      else priceScore = 45; // Below average
    }

    // Calculate weighted demand score
    const rawScore =
      (baseDemand * 0.2 +
        workerScore * 0.25 +
        historicalScore * 0.2 +
        priceScore * 0.2 +
        competitionMultiplier * 100 * 0.15) *
      timeMultiplier;

    const demandScore = Math.min(Math.round(rawScore), 100);

    // Generate insights
    const insights = [];

    if (workerScore >= 70) {
      insights.push(
        `Good worker availability in your area (${workersData.count}+ workers nearby)`,
      );
    } else {
      insights.push(
        `Limited workers in your area - consider increasing price to attract more applicants`,
      );
    }

    if (priceScore >= 80) {
      insights.push(`Your price is competitive and above market average`);
    } else if (priceScore < 50) {
      insights.push(
        `Consider increasing the price - it's below the area average`,
      );
    }

    if (competitionMultiplier < 0.8) {
      insights.push(
        `High demand for ${category} gigs right now - there's competition for workers`,
      );
    }

    if (timeMultiplier > 1) {
      insights.push(`Good timing! Worker availability is higher right now`);
    }

    // Determine demand level
    let demandLevel;
    if (demandScore >= 80) demandLevel = "very_high";
    else if (demandScore >= 60) demandLevel = "high";
    else if (demandScore >= 40) demandLevel = "moderate";
    else if (demandScore >= 20) demandLevel = "low";
    else demandLevel = "very_low";

    // Estimated time to find worker
    let estimatedTime;
    if (demandScore >= 80) estimatedTime = "< 1 hour";
    else if (demandScore >= 60) estimatedTime = "1-3 hours";
    else if (demandScore >= 40) estimatedTime = "3-12 hours";
    else if (demandScore >= 20) estimatedTime = "1-2 days";
    else estimatedTime = "2+ days";

    return {
      demandScore,
      demandLevel,
      estimatedTime,
      insights,
      factors: {
        baseDemand: Math.round(baseDemand),
        workerAvailability: workerScore,
        historicalRate: Math.round(historicalScore),
        priceAttractiveness: priceScore,
        competition: Math.round(competitionMultiplier * 100),
        timeFactor: Math.round(timeMultiplier * 100),
      },
      workersInArea: workersData.count,
      isEstimated: workersData.estimated,
    };
  } catch (error) {
    console.error("Demand prediction error:", error);
    return {
      demandScore: 50,
      demandLevel: "moderate",
      estimatedTime: "6-12 hours",
      insights: ["Unable to fully analyze demand - showing default estimate"],
      factors: {},
      workersInArea: 0,
      error: error.message,
    };
  }
};

/**
 * Get average price for a category
 */
const getAveragePriceForCategory = async (category) => {
  try {
    const gigs = await Gig.find({ cat: category }).select("price").limit(100);
    if (gigs.length === 0) return 500; // Default average

    const total = gigs.reduce((sum, g) => sum + g.price, 0);
    return total / gigs.length;
  } catch (error) {
    return 500; // Default
  }
};

/**
 * Get demand forecast for different times/days
 */
export const getDemandForecast = async (category, location) => {
  const forecast = [];
  const days = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  const currentDay = new Date().getDay();

  for (let i = 0; i < 7; i++) {
    const dayIndex = (currentDay + i) % 7;
    const isWeekend = dayIndex === 0 || dayIndex === 6;

    const baseDemand = CATEGORY_BASE_DEMAND[category?.toLowerCase()] || 60;
    const multiplier = isWeekend ? 1.2 : 1.0;

    forecast.push({
      day: days[dayIndex],
      demandScore: Math.min(Math.round(baseDemand * multiplier), 100),
      isWeekend,
      bestTime: isWeekend ? "All day" : "5 PM - 9 PM",
    });
  }

  return forecast;
};

/**
 * Get hot categories in an area (trending gig types)
 */
export const getHotCategories = async (coordinates) => {
  try {
    const recentGigs = await Gig.find({
      status: "open",
      createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
    });

    // Count by category
    const categoryCounts = {};
    for (const gig of recentGigs) {
      categoryCounts[gig.cat] = (categoryCounts[gig.cat] || 0) + 1;
    }

    // Sort by popularity
    const hotCategories = Object.entries(categoryCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([category, count]) => ({
        category,
        openGigs: count,
        demandLevel: CATEGORY_BASE_DEMAND[category?.toLowerCase()] || 60,
      }));

    return hotCategories;
  } catch (error) {
    return [];
  }
};
