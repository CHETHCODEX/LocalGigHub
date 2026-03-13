import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Minus,
  Lightbulb,
  Loader,
} from "lucide-react";
import { suggestPrice, analyzePricing } from "../../utils/aiService";

/**
 * AI-Powered Pricing Suggestion Component
 * Helps shops set competitive prices for their gigs
 */
const PricingSuggestion = ({
  category,
  duration,
  city,
  experienceRequired,
  skills = [],
  currentPrice,
  onPriceSelect,
  autoFetch = false,
}) => {
  const [suggestion, setSuggestion] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedPrice, setSelectedPrice] = useState(currentPrice || null);

  // Fetch suggestion when inputs change
  useEffect(() => {
    if (autoFetch && category) {
      fetchSuggestion();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, duration, city, experienceRequired, skills.length, autoFetch]);

  // Analyze current price when it changes
  useEffect(() => {
    if (currentPrice && category) {
      analyzeCurrentPrice();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPrice, category, city]);

  const fetchSuggestion = async () => {
    if (!category) return;

    setLoading(true);
    try {
      const result = await suggestPrice({
        category,
        duration,
        city,
        experienceRequired,
        skills,
      });
      setSuggestion(result);

      if (!selectedPrice) {
        setSelectedPrice(result.recommended);
        onPriceSelect?.(result.recommended);
      }
    } catch (error) {
      console.error("Pricing suggestion error:", error);
    } finally {
      setLoading(false);
    }
  };

  const analyzeCurrentPrice = async () => {
    try {
      const result = await analyzePricing(currentPrice, category, city);
      setAnalysis(result);
    } catch (error) {
      console.error("Price analysis error:", error);
    }
  };

  const handlePriceSelect = (price) => {
    setSelectedPrice(price);
    onPriceSelect?.(price);
  };

  const getCompetitivenessColor = (level) => {
    const colors = {
      premium: "text-blue-400",
      above_average: "text-green-400",
      average: "text-yellow-400",
      below_average: "text-red-400",
    };
    return colors[level] || "text-gray-400";
  };

  const getCompetitivenessIcon = (level) => {
    if (level === "premium" || level === "above_average") {
      return <TrendingUp className="w-4 h-4" />;
    }
    if (level === "below_average") {
      return <TrendingDown className="w-4 h-4" />;
    }
    return <Minus className="w-4 h-4" />;
  };

  if (loading) {
    return (
      <div className="glass rounded-2xl p-6">
        <div className="flex items-center gap-2">
          <Loader className="w-5 h-5 animate-spin text-neonPurple" />
          <span>Calculating optimal price...</span>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="glass rounded-2xl p-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-neonPurple" />
          <h3 className="font-bold text-lg">AI Pricing Assistant</h3>
        </div>
        {!autoFetch && (
          <button
            onClick={fetchSuggestion}
            disabled={!category || loading}
            className="text-sm bg-neonPurple/20 hover:bg-neonPurple/30 text-neonPurple px-3 py-1 rounded-lg transition-all disabled:opacity-50"
          >
            Get Suggestion
          </button>
        )}
      </div>

      {!suggestion && !analysis && (
        <div className="text-center py-8 text-gray-500">
          <DollarSign className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>Enter gig details to get pricing suggestions</p>
        </div>
      )}

      {suggestion && (
        <>
          {/* Recommended Price */}
          <div className="bg-gradient-to-r from-neonPurple/20 to-neonBlue/20 rounded-xl p-4 mb-4">
            <div className="text-sm text-gray-400 mb-1">Recommended Price</div>
            <div className="text-4xl font-bold text-white">
              ₹{suggestion.recommended?.toLocaleString()}
            </div>
            <div className="text-sm text-gray-400 mt-1">
              Confidence: {suggestion.confidence}
            </div>
          </div>

          {/* Price Range Selector */}
          <div className="mb-4">
            <div className="text-sm text-gray-400 mb-2">Select Your Price</div>
            <div className="grid grid-cols-3 gap-2">
              {/* Budget */}
              <button
                onClick={() => handlePriceSelect(suggestion.range?.min)}
                className={`p-3 rounded-lg border transition-all ${
                  selectedPrice === suggestion.range?.min
                    ? "border-neonPurple bg-neonPurple/20"
                    : "border-white/10 hover:border-white/30"
                }`}
              >
                <div className="text-xs text-gray-400">Budget</div>
                <div className="font-semibold">
                  ₹{suggestion.range?.min?.toLocaleString()}
                </div>
              </button>

              {/* Recommended */}
              <button
                onClick={() => handlePriceSelect(suggestion.recommended)}
                className={`p-3 rounded-lg border transition-all ${
                  selectedPrice === suggestion.recommended
                    ? "border-neonPurple bg-neonPurple/20"
                    : "border-white/10 hover:border-white/30"
                }`}
              >
                <div className="text-xs text-green-400">Recommended</div>
                <div className="font-semibold">
                  ₹{suggestion.recommended?.toLocaleString()}
                </div>
              </button>

              {/* Premium */}
              <button
                onClick={() => handlePriceSelect(suggestion.range?.max)}
                className={`p-3 rounded-lg border transition-all ${
                  selectedPrice === suggestion.range?.max
                    ? "border-neonPurple bg-neonPurple/20"
                    : "border-white/10 hover:border-white/30"
                }`}
              >
                <div className="text-xs text-blue-400">Premium</div>
                <div className="font-semibold">
                  ₹{suggestion.range?.max?.toLocaleString()}
                </div>
              </button>
            </div>
          </div>

          {/* Price Breakdown */}
          {suggestion.breakdown &&
            Object.keys(suggestion.breakdown).length > 0 && (
              <div className="bg-white/5 rounded-lg p-4 mb-4">
                <div className="text-sm text-gray-400 mb-3">Price Factors</div>
                <div className="space-y-2 text-sm">
                  {suggestion.breakdown.basePrice && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Base Price</span>
                      <span>₹{suggestion.breakdown.basePrice}</span>
                    </div>
                  )}
                  {suggestion.breakdown.locationFactor &&
                    suggestion.breakdown.locationFactor !== 1 && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">
                          Location Adjustment
                        </span>
                        <span
                          className={
                            suggestion.breakdown.locationFactor > 1
                              ? "text-green-400"
                              : "text-red-400"
                          }
                        >
                          {suggestion.breakdown.locationFactor > 1 ? "+" : ""}
                          {Math.round(
                            (suggestion.breakdown.locationFactor - 1) * 100,
                          )}
                          %
                        </span>
                      </div>
                    )}
                  {suggestion.breakdown.experienceFactor &&
                    suggestion.breakdown.experienceFactor !== 1 && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Experience Level</span>
                        <span
                          className={
                            suggestion.breakdown.experienceFactor > 1
                              ? "text-green-400"
                              : "text-yellow-400"
                          }
                        >
                          {suggestion.breakdown.experienceFactor > 1 ? "+" : ""}
                          {Math.round(
                            (suggestion.breakdown.experienceFactor - 1) * 100,
                          )}
                          %
                        </span>
                      </div>
                    )}
                  {suggestion.breakdown.demandFactor &&
                    suggestion.breakdown.demandFactor !== 1 && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Market Demand</span>
                        <span
                          className={
                            suggestion.breakdown.demandFactor > 1
                              ? "text-green-400"
                              : "text-yellow-400"
                          }
                        >
                          {suggestion.breakdown.demandFactor > 1 ? "+" : ""}
                          {Math.round(
                            (suggestion.breakdown.demandFactor - 1) * 100,
                          )}
                          %
                        </span>
                      </div>
                    )}
                </div>
              </div>
            )}

          {/* Insights */}
          {suggestion.insights && suggestion.insights.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Lightbulb className="w-4 h-4" />
                Pricing Insights
              </div>
              {suggestion.insights.map((insight, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="text-sm text-gray-300 pl-6 border-l-2 border-neonPurple/30"
                >
                  {insight}
                </motion.div>
              ))}
            </div>
          )}

          {/* Historical Data */}
          {suggestion.historicalData && (
            <div className="mt-4 pt-4 border-t border-white/10 text-sm text-gray-400">
              Based on {suggestion.historicalData.sampleSize} similar gigs •
              Avg: ₹{suggestion.historicalData.avgPrice?.toLocaleString()} •
              Median: ₹{suggestion.historicalData.medianPrice?.toLocaleString()}
            </div>
          )}
        </>
      )}

      {/* Current Price Analysis */}
      {analysis && !suggestion && (
        <div className="bg-white/5 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className={getCompetitivenessColor(analysis.competitiveness)}>
              {getCompetitivenessIcon(analysis.competitiveness)}
            </span>
            <span
              className={`font-medium capitalize ${getCompetitivenessColor(analysis.competitiveness)}`}
            >
              {analysis.competitiveness?.replace("_", " ")}
            </span>
          </div>
          <p className="text-sm text-gray-400">{analysis.recommendation}</p>
          {analysis.percentile && (
            <div className="mt-2 text-xs text-gray-500">
              {analysis.percentile}th percentile in market
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
};

export default PricingSuggestion;
