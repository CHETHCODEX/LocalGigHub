import Gig from "../models/gig.model.js";
import Application from "../models/application.model.js";

/**
 * AI-Powered Pricing Suggestions Module
 * Suggests fair prices based on:
 * 1. Category-based pricing benchmarks
 * 2. Historical pricing data for similar gigs
 * 3. Location-based cost of living adjustments
 * 4. Duration and complexity factors
 * 5. Market demand and supply dynamics
 */

// Base pricing by category (in your currency unit)
const CATEGORY_BASE_PRICES = {
  // Tech & Digital
  "web-development": { min: 500, avg: 2000, max: 10000 },
  "app-development": { min: 1000, avg: 5000, max: 20000 },
  "graphic-design": { min: 200, avg: 800, max: 3000 },
  "video-editing": { min: 300, avg: 1000, max: 5000 },
  "content-writing": { min: 100, avg: 400, max: 1500 },
  seo: { min: 200, avg: 1000, max: 5000 },
  "social-media": { min: 150, avg: 600, max: 2000 },
  "data-entry": { min: 50, avg: 200, max: 500 },

  // Local/Physical Work
  delivery: { min: 50, avg: 150, max: 500 },
  cleaning: { min: 100, avg: 300, max: 800 },
  gardening: { min: 100, avg: 250, max: 600 },
  moving: { min: 200, avg: 500, max: 1500 },
  handyman: { min: 150, avg: 400, max: 1000 },
  painting: { min: 200, avg: 600, max: 2000 },
  plumbing: { min: 200, avg: 500, max: 1500 },
  electrical: { min: 200, avg: 600, max: 2000 },

  // Service Industry
  catering: { min: 300, avg: 1000, max: 5000 },
  "event-help": { min: 100, avg: 300, max: 800 },
  waitering: { min: 100, avg: 250, max: 500 },
  "customer-service": { min: 100, avg: 300, max: 700 },
  "retail-help": { min: 80, avg: 200, max: 500 },

  // Education
  tutoring: { min: 100, avg: 300, max: 800 },
  coaching: { min: 150, avg: 400, max: 1000 },
  training: { min: 200, avg: 600, max: 2000 },

  // Healthcare & Care
  babysitting: { min: 100, avg: 250, max: 500 },
  "elderly-care": { min: 150, avg: 350, max: 700 },
  "pet-care": { min: 50, avg: 150, max: 400 },

  // Default
  default: { min: 100, avg: 400, max: 1000 },
};

// Duration multipliers
const DURATION_MULTIPLIERS = {
  "1-hour": 0.2,
  "2-hours": 0.3,
  "half-day": 0.5,
  "full-day": 1.0,
  "2-days": 1.8,
  "3-days": 2.5,
  week: 5.0,
  "2-weeks": 9.0,
  month: 20.0,
  ongoing: 1.0, // Use base as monthly rate
};

// City tier-based cost adjustments (India example - adjust for your region)
const CITY_TIERS = {
  tier1: [
    "mumbai",
    "delhi",
    "bangalore",
    "chennai",
    "kolkata",
    "hyderabad",
    "pune",
  ],
  tier2: [
    "ahmedabad",
    "jaipur",
    "lucknow",
    "kanpur",
    "nagpur",
    "indore",
    "bhopal",
    "surat",
  ],
  tier3: [], // Everything else
};

const getCityMultiplier = (city) => {
  if (!city) return 1.0;
  const cityLower = city.toLowerCase();

  if (CITY_TIERS.tier1.some((c) => cityLower.includes(c))) return 1.3;
  if (CITY_TIERS.tier2.some((c) => cityLower.includes(c))) return 1.1;
  return 0.9; // Tier 3 cities
};

// Experience level multipliers
const EXPERIENCE_MULTIPLIERS = {
  beginner: 0.7,
  intermediate: 1.0,
  experienced: 1.3,
  expert: 1.6,
  any: 1.0,
};

/**
 * Get historical pricing data for similar gigs
 */
const getHistoricalPricing = async (category, city) => {
  try {
    const query = { cat: category };

    const gigs = await Gig.find(query)
      .select("price location geoLocation status applicantCount")
      .limit(100);

    if (gigs.length === 0) {
      return null;
    }

    // Filter for same city if possible
    let relevantGigs = gigs;
    if (city) {
      const cityGigs = gigs.filter(
        (g) =>
          g.location?.toLowerCase().includes(city.toLowerCase()) ||
          g.geoLocation?.city?.toLowerCase().includes(city.toLowerCase()),
      );
      if (cityGigs.length >= 5) {
        relevantGigs = cityGigs;
      }
    }

    const prices = relevantGigs.map((g) => g.price).sort((a, b) => a - b);

    // Calculate percentiles
    const p25 = prices[Math.floor(prices.length * 0.25)];
    const p50 = prices[Math.floor(prices.length * 0.5)]; // Median
    const p75 = prices[Math.floor(prices.length * 0.75)];

    const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;

    // Find sweet spot (gigs that got hired)
    const successfulGigs = relevantGigs.filter(
      (g) =>
        g.status === "completed" ||
        g.status === "in_progress" ||
        g.applicantCount > 0,
    );
    const successfulAvg =
      successfulGigs.length > 0
        ? successfulGigs.reduce((sum, g) => sum + g.price, 0) /
          successfulGigs.length
        : avgPrice;

    return {
      min: prices[0],
      max: prices[prices.length - 1],
      avg: Math.round(avgPrice),
      median: p50,
      p25,
      p75,
      successfulAvg: Math.round(successfulAvg),
      sampleSize: relevantGigs.length,
      isLocal: city && relevantGigs.length < gigs.length,
    };
  } catch (error) {
    console.error("Historical pricing error:", error);
    return null;
  }
};

/**
 * Calculate demand-based adjustment
 */
const getDemandAdjustment = async (category) => {
  try {
    const openGigs = await Gig.countDocuments({
      cat: category,
      status: "open",
    });
    const recentApplications = await Application.countDocuments({
      createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
    });

    // High demand (more gigs than workers) = higher prices acceptable
    // Low demand = need competitive pricing
    const ratio = openGigs > 0 ? recentApplications / openGigs : 1;

    if (ratio > 5) return 1.2; // Lots of applicants, can charge more
    if (ratio > 2) return 1.1;
    if (ratio < 0.5) return 0.85; // Few applicants, price competitively
    return 1.0;
  } catch (error) {
    return 1.0;
  }
};

/**
 * Main pricing suggestion function
 * @param {Object} gigDetails - Details about the gig
 * @returns {Object} - Pricing recommendation
 */
export const suggestPrice = async (gigDetails) => {
  const {
    category,
    duration = "full-day",
    city,
    experienceRequired = "any",
    skills = [],
    description = "",
  } = gigDetails;

  try {
    const categoryLower = category?.toLowerCase() || "default";

    // Step 1: Get base price for category
    const basePricing =
      CATEGORY_BASE_PRICES[categoryLower] || CATEGORY_BASE_PRICES.default;

    // Step 2: Get historical pricing data
    const historicalData = await getHistoricalPricing(categoryLower, city);

    // Step 3: Calculate multipliers
    const durationMultiplier =
      DURATION_MULTIPLIERS[duration?.toLowerCase()] || 1.0;
    const cityMultiplier = getCityMultiplier(city);
    const expMultiplier = EXPERIENCE_MULTIPLIERS[experienceRequired] || 1.0;
    const demandMultiplier = await getDemandAdjustment(categoryLower);

    // Step 4: Skill complexity bonus (more skills = higher complexity = higher pay)
    const skillBonus = Math.min(skills.length * 0.05, 0.3); // Max 30% bonus

    // Step 5: Calculate suggested price range
    let suggestedMin, suggestedAvg, suggestedMax;

    if (historicalData && historicalData.sampleSize >= 5) {
      // Use historical data as primary source
      suggestedMin = Math.round(
        historicalData.p25 * durationMultiplier * cityMultiplier,
      );
      suggestedAvg = Math.round(
        historicalData.successfulAvg *
          durationMultiplier *
          cityMultiplier *
          expMultiplier,
      );
      suggestedMax = Math.round(
        historicalData.p75 *
          durationMultiplier *
          cityMultiplier *
          expMultiplier *
          (1 + skillBonus),
      );
    } else {
      // Use base pricing
      suggestedMin = Math.round(
        basePricing.min * durationMultiplier * cityMultiplier,
      );
      suggestedAvg = Math.round(
        basePricing.avg *
          durationMultiplier *
          cityMultiplier *
          expMultiplier *
          demandMultiplier,
      );
      suggestedMax = Math.round(
        basePricing.max *
          durationMultiplier *
          cityMultiplier *
          expMultiplier *
          (1 + skillBonus),
      );
    }

    // Ensure min < avg < max
    if (suggestedMin >= suggestedAvg)
      suggestedMin = Math.round(suggestedAvg * 0.7);
    if (suggestedMax <= suggestedAvg)
      suggestedMax = Math.round(suggestedAvg * 1.5);

    // Step 6: Generate insights
    const insights = [];

    if (historicalData) {
      insights.push(
        `Based on ${historicalData.sampleSize} similar gigs in the area`,
      );
      if (historicalData.successfulAvg > historicalData.avg) {
        insights.push(
          `Successfully hired gigs priced ${Math.round((historicalData.successfulAvg / historicalData.avg - 1) * 100)}% higher than average`,
        );
      }
    }

    if (cityMultiplier > 1.1) {
      insights.push(
        `Metro city premium applied (+${Math.round((cityMultiplier - 1) * 100)}%)`,
      );
    } else if (cityMultiplier < 1) {
      insights.push(
        `Adjusted for local cost of living (${Math.round((1 - cityMultiplier) * 100)}% below metro rates)`,
      );
    }

    if (skillBonus > 0.1) {
      insights.push(`Complexity bonus for ${skills.length} required skills`);
    }

    if (demandMultiplier > 1.1) {
      insights.push(
        `High demand in this category - workers are competing for gigs`,
      );
    } else if (demandMultiplier < 0.9) {
      insights.push(
        `Competitive market - attractive pricing helps get more applicants`,
      );
    }

    return {
      recommended: suggestedAvg,
      range: {
        min: suggestedMin,
        max: suggestedMax,
      },
      breakdown: {
        basePrice: basePricing.avg,
        durationFactor: durationMultiplier,
        locationFactor: cityMultiplier,
        experienceFactor: expMultiplier,
        demandFactor: demandMultiplier,
        complexityBonus: skillBonus,
      },
      insights,
      historicalData: historicalData
        ? {
            avgPrice: historicalData.avg,
            medianPrice: historicalData.median,
            sampleSize: historicalData.sampleSize,
          }
        : null,
      confidence:
        historicalData && historicalData.sampleSize >= 10
          ? "high"
          : historicalData && historicalData.sampleSize >= 5
            ? "medium"
            : "low",
    };
  } catch (error) {
    console.error("Pricing suggestion error:", error);

    // Fallback to basic calculation
    const basePricing =
      CATEGORY_BASE_PRICES[category?.toLowerCase()] ||
      CATEGORY_BASE_PRICES.default;
    return {
      recommended: basePricing.avg,
      range: { min: basePricing.min, max: basePricing.max },
      breakdown: {},
      insights: ["Using default category pricing"],
      confidence: "low",
      error: error.message,
    };
  }
};

/**
 * Compare a given price with market rates
 */
export const analyzePriceCompetitiveness = async (price, category, city) => {
  try {
    const historicalData = await getHistoricalPricing(category, city);

    if (!historicalData) {
      const basePricing =
        CATEGORY_BASE_PRICES[category?.toLowerCase()] ||
        CATEGORY_BASE_PRICES.default;
      const avgPrice = basePricing.avg;

      return {
        competitiveness: price >= avgPrice ? "above_average" : "below_average",
        percentile: Math.round(
          (price / (basePricing.max - basePricing.min)) * 100,
        ),
        recommendation:
          price < avgPrice
            ? "Consider increasing to attract more applicants"
            : "Good pricing, likely to attract applicants",
      };
    }

    // Calculate percentile
    let percentile;
    if (price <= historicalData.min) percentile = 5;
    else if (price >= historicalData.max) percentile = 95;
    else if (price <= historicalData.p25)
      percentile = 25 * (price / historicalData.p25);
    else if (price <= historicalData.median)
      percentile =
        25 +
        25 *
          ((price - historicalData.p25) /
            (historicalData.median - historicalData.p25));
    else if (price <= historicalData.p75)
      percentile =
        50 +
        25 *
          ((price - historicalData.median) /
            (historicalData.p75 - historicalData.median));
    else
      percentile =
        75 +
        25 *
          ((price - historicalData.p75) /
            (historicalData.max - historicalData.p75));

    let competitiveness, recommendation;
    if (percentile >= 75) {
      competitiveness = "premium";
      recommendation =
        "Premium pricing - expect fewer but more qualified applicants";
    } else if (percentile >= 50) {
      competitiveness = "above_average";
      recommendation =
        "Above average - good balance of quality and applicant volume";
    } else if (percentile >= 25) {
      competitiveness = "average";
      recommendation =
        "Market rate pricing - standard applicant volume expected";
    } else {
      competitiveness = "below_average";
      recommendation =
        "Below average - consider increasing for better applicant quality";
    }

    return {
      competitiveness,
      percentile: Math.round(percentile),
      marketAverage: historicalData.avg,
      difference: price - historicalData.avg,
      differencePercent: Math.round(
        ((price - historicalData.avg) / historicalData.avg) * 100,
      ),
      recommendation,
    };
  } catch (error) {
    return {
      competitiveness: "unknown",
      error: error.message,
    };
  }
};

/**
 * Get pricing trends over time
 */
export const getPricingTrends = async (category, months = 3) => {
  try {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    const gigs = await Gig.find({
      cat: category,
      createdAt: { $gte: startDate },
    })
      .select("price createdAt")
      .sort("createdAt");

    if (gigs.length < 10) {
      return { trend: "insufficient_data", dataPoints: gigs.length };
    }

    // Group by month
    const monthlyData = {};
    for (const gig of gigs) {
      const monthKey = `${gig.createdAt.getFullYear()}-${gig.createdAt.getMonth() + 1}`;
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = [];
      }
      monthlyData[monthKey].push(gig.price);
    }

    const monthlyAverages = Object.entries(monthlyData)
      .map(([month, prices]) => ({
        month,
        avg: prices.reduce((a, b) => a + b, 0) / prices.length,
        count: prices.length,
      }))
      .sort((a, b) => a.month.localeCompare(b.month));

    // Determine trend
    if (monthlyAverages.length >= 2) {
      const firstAvg = monthlyAverages[0].avg;
      const lastAvg = monthlyAverages[monthlyAverages.length - 1].avg;
      const change = ((lastAvg - firstAvg) / firstAvg) * 100;

      let trend;
      if (change > 10) trend = "increasing";
      else if (change < -10) trend = "decreasing";
      else trend = "stable";

      return {
        trend,
        changePercent: Math.round(change),
        monthlyAverages,
        recommendation:
          trend === "increasing"
            ? "Prices are rising - market favors higher pricing"
            : trend === "decreasing"
              ? "Prices are falling - consider competitive pricing"
              : "Stable market - price according to quality",
      };
    }

    return { trend: "insufficient_data", monthlyAverages };
  } catch (error) {
    return { trend: "error", error: error.message };
  }
};

// Export category prices for reference
export const getCategoryPrices = () => CATEGORY_BASE_PRICES;
export const getSupportedCategories = () => Object.keys(CATEGORY_BASE_PRICES);
