import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Sparkles, MapPin, Clock, DollarSign, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { getRecommendations } from "../../utils/aiService";
import getCurrentUser from "../../utils/getCurrentUser";

/**
 * AI-Powered Gig Recommendations Component
 * Shows personalized gig suggestions based on user skills, location, and history
 */
const AIRecommendations = ({ limit = 6, showScores = false }) => {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const currentUser = getCurrentUser();

  useEffect(() => {
    const fetchRecommendations = async () => {
      if (!currentUser?._id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const data = await getRecommendations(currentUser._id, {
          limit,
          includeScores: showScores,
        });
        setRecommendations(data.recommendations || []);
      } catch (err) {
        console.error("Failed to fetch recommendations:", err);
        setError("Unable to load recommendations");
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, [currentUser?._id, limit, showScores]);

  if (!currentUser) {
    return (
      <div className="glass rounded-2xl p-6 text-center">
        <Sparkles className="w-12 h-12 mx-auto mb-4 text-neonPurple" />
        <h3 className="text-xl font-semibold mb-2">
          Get Personalized Recommendations
        </h3>
        <p className="text-gray-400 mb-4">
          Sign in to see gigs matched to your skills and location
        </p>
        <Link to="/login" className="text-neonPurple hover:underline">
          Sign In →
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="glass rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-6">
          <Sparkles className="w-6 h-6 text-neonPurple animate-pulse" />
          <h2 className="text-xl font-bold">Finding your perfect gigs...</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="glass rounded-xl p-4 animate-pulse">
              <div className="h-4 bg-white/10 rounded w-3/4 mb-3"></div>
              <div className="h-3 bg-white/10 rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-white/10 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass rounded-2xl p-6 text-center">
        <p className="text-red-400">{error}</p>
      </div>
    );
  }

  if (recommendations.length === 0) {
    return (
      <div className="glass rounded-2xl p-6 text-center">
        <Sparkles className="w-12 h-12 mx-auto mb-4 text-gray-500" />
        <h3 className="text-xl font-semibold mb-2">No Recommendations Yet</h3>
        <p className="text-gray-400">
          Complete your profile with skills to get personalized suggestions
        </p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-2xl p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-neonPurple" />
          <h2 className="text-xl font-bold">Recommended for You</h2>
        </div>
        <Link
          to="/marketplace"
          className="text-sm text-neonPurple hover:underline flex items-center gap-1"
        >
          View All <ArrowRight size={16} />
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {recommendations.map((item, index) => (
          <motion.div
            key={item.gig._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Link
              to={`/gig/${item.gig._id}`}
              className="glass rounded-xl p-4 block hover:bg-white/5 transition-all group"
            >
              {/* Match Score Badge */}
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs px-2 py-1 bg-neonPurple/20 text-neonPurple rounded-full">
                  {item.matchScore}% Match
                </span>
                <span className="text-xs text-gray-500 capitalize">
                  {item.gig.cat}
                </span>
              </div>

              {/* Title */}
              <h3 className="font-semibold mb-2 group-hover:text-neonPurple transition-colors line-clamp-2">
                {item.gig.title}
              </h3>

              {/* Details */}
              <div className="flex flex-wrap gap-3 text-sm text-gray-400">
                <span className="flex items-center gap-1">
                  <MapPin size={14} />
                  {item.gig.location}
                </span>
                <span className="flex items-center gap-1">
                  <Clock size={14} />
                  {item.gig.duration}
                </span>
                <span className="flex items-center gap-1 text-green-400">
                  <DollarSign size={14} />₹{item.gig.price}
                </span>
              </div>

              {/* Skill Match Details (if showScores) */}
              {showScores && item.scores && (
                <div className="mt-3 pt-3 border-t border-white/10 text-xs text-gray-500">
                  <div className="flex justify-between">
                    <span>Skills: {item.scores.skill}%</span>
                    <span>Location: {item.scores.location}%</span>
                  </div>
                </div>
              )}
            </Link>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default AIRecommendations;
