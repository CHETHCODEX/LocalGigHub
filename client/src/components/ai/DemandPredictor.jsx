import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { TrendingUp, Users, Clock, Lightbulb, BarChart3 } from "lucide-react";
import { predictDemand, getDemandForecast } from "../../utils/aiService";

/**
 * AI-Powered Demand Prediction Component
 * Shows shops the likelihood of finding workers for their gig
 */
const DemandPredictor = ({
  category,
  location,
  coordinates,
  price,
  onDemandCalculated,
  autoFetch = false,
  showForecast = true,
}) => {
  const [prediction, setPrediction] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch prediction when inputs change (if autoFetch)
  useEffect(() => {
    if (autoFetch && category) {
      fetchPrediction();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, location, price, autoFetch]);

  const fetchPrediction = async () => {
    if (!category) return;

    setLoading(true);
    setError(null);

    try {
      const [demandResult, forecastResult] = await Promise.all([
        predictDemand({ category, location, coordinates, price }),
        showForecast ? getDemandForecast(category, location) : null,
      ]);

      setPrediction(demandResult);
      if (forecastResult) setForecast(forecastResult.forecast);

      onDemandCalculated?.(demandResult);
    } catch (err) {
      setError("Failed to predict demand");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Get color based on demand level
  const getDemandColor = (level) => {
    const colors = {
      very_high: "text-green-400",
      high: "text-emerald-400",
      moderate: "text-yellow-400",
      low: "text-orange-400",
      very_low: "text-red-400",
    };
    return colors[level] || "text-gray-400";
  };

  const getDemandBgColor = (level) => {
    const colors = {
      very_high: "bg-green-500/20",
      high: "bg-emerald-500/20",
      moderate: "bg-yellow-500/20",
      low: "bg-orange-500/20",
      very_low: "bg-red-500/20",
    };
    return colors[level] || "bg-gray-500/20";
  };

  if (loading) {
    return (
      <div className="glass rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-neonPurple animate-pulse" />
          <span className="font-medium">Analyzing demand...</span>
        </div>
        <div className="h-20 bg-white/5 rounded-xl animate-pulse"></div>
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
          <TrendingUp className="w-5 h-5 text-neonPurple" />
          <h3 className="font-bold text-lg">Demand Prediction</h3>
        </div>
        {!autoFetch && (
          <button
            onClick={fetchPrediction}
            disabled={!category || loading}
            className="text-sm bg-neonPurple/20 hover:bg-neonPurple/30 text-neonPurple px-3 py-1 rounded-lg transition-all disabled:opacity-50"
          >
            Analyze
          </button>
        )}
      </div>

      {error && <div className="text-red-400 text-sm mb-4">{error}</div>}

      {!prediction && !error && (
        <div className="text-center py-8 text-gray-500">
          <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>Enter gig details to see demand prediction</p>
        </div>
      )}

      {prediction && (
        <>
          {/* Demand Score */}
          <div
            className={`${getDemandBgColor(prediction.demandLevel)} rounded-xl p-4 mb-4`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-300">Demand Score</span>
              <span
                className={`text-3xl font-bold ${getDemandColor(prediction.demandLevel)}`}
              >
                {prediction.demandScore}%
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${prediction.demandScore}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className={`h-full rounded-full ${
                  prediction.demandScore >= 60
                    ? "bg-green-500"
                    : prediction.demandScore >= 40
                      ? "bg-yellow-500"
                      : "bg-red-500"
                }`}
              />
            </div>

            <div className="flex items-center justify-between mt-2 text-sm">
              <span
                className={`capitalize ${getDemandColor(prediction.demandLevel)}`}
              >
                {prediction.demandLevel?.replace("_", " ")} demand
              </span>
              <span className="text-gray-400">
                Est. time: {prediction.estimatedTime}
              </span>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-white/5 rounded-lg p-3">
              <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
                <Users className="w-4 h-4" />
                Workers Nearby
              </div>
              <span className="text-xl font-semibold">
                {prediction.workersInArea}+
              </span>
            </div>
            <div className="bg-white/5 rounded-lg p-3">
              <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
                <Clock className="w-4 h-4" />
                Time to Fill
              </div>
              <span className="text-xl font-semibold">
                {prediction.estimatedTime}
              </span>
            </div>
          </div>

          {/* Insights */}
          {prediction.insights && prediction.insights.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Lightbulb className="w-4 h-4" />
                AI Insights
              </div>
              {prediction.insights.map((insight, index) => (
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

          {/* Weekly Forecast */}
          {showForecast && forecast && forecast.length > 0 && (
            <div className="mt-4 pt-4 border-t border-white/10">
              <h4 className="text-sm text-gray-400 mb-3">7-Day Forecast</h4>
              <div className="flex gap-1">
                {forecast.map((day, index) => (
                  <div
                    key={index}
                    className="flex-1 text-center"
                    title={`${day.day}: ${day.demandScore}% demand`}
                  >
                    <div
                      className={`h-12 rounded-md ${getDemandBgColor(
                        day.demandScore >= 60
                          ? "high"
                          : day.demandScore >= 40
                            ? "moderate"
                            : "low",
                      )}`}
                      style={{
                        opacity: 0.3 + (day.demandScore / 100) * 0.7,
                      }}
                    />
                    <span className="text-xs text-gray-500 mt-1 block">
                      {day.day.slice(0, 3)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </motion.div>
  );
};

export default DemandPredictor;
