import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { MessageSquare, Loader2 } from "lucide-react";
import StarRating from "./StarRating";
import ReviewCard from "./ReviewCard";
import newRequest from "../../utils/newRequest";

const ReviewsSection = ({ gigId }) => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (gigId) {
      fetchReviews();
    }
  }, [gigId]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const res = await newRequest.get(`/reviews/gig/${gigId}`);
      setReviews(res.data);
    } catch (err) {
      console.error("Error fetching reviews:", err);
    } finally {
      setLoading(false);
    }
  };

  const avgRating =
    reviews.length > 0
      ? Math.round(
          (reviews.reduce((sum, r) => sum + r.star, 0) / reviews.length) * 10,
        ) / 10
      : 0;

  const starDistribution = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.star === star).length,
    percentage:
      reviews.length > 0
        ? (reviews.filter((r) => r.star === star).length / reviews.length) * 100
        : 0,
  }));

  if (loading) {
    return (
      <div className="mt-10 border-t border-white/10 pt-8">
        <div className="flex items-center justify-center py-8">
          <Loader2 size={24} className="animate-spin text-amber-400" />
        </div>
      </div>
    );
  }

  return (
    <div className="mt-10 border-t border-white/10 pt-8">
      <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
        <MessageSquare size={22} className="text-amber-400" />
        Ratings & Reviews
        {reviews.length > 0 && (
          <span className="text-sm font-normal text-gray-500 ml-1">
            ({reviews.length})
          </span>
        )}
      </h3>

      {reviews.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-10 bg-surfaceElevated/30 rounded-2xl border border-white/5"
        >
          <div className="text-4xl mb-3">⭐</div>
          <p className="text-gray-400 text-sm">
            No reviews yet. Be the first to leave one!
          </p>
        </motion.div>
      ) : (
        <>
          {/* Summary Header */}
          <div className="glass-card p-6 mb-6">
            <div className="flex flex-col md:flex-row gap-6 items-center">
              {/* Average Score */}
              <div className="flex flex-col items-center gap-1">
                <div className="text-4xl font-extrabold text-amber-400">
                  {avgRating.toFixed(1)}
                </div>
                <StarRating rating={avgRating} size={20} />
                <p className="text-xs text-gray-500 mt-1">
                  {reviews.length} review{reviews.length !== 1 ? "s" : ""}
                </p>
              </div>

              {/* Star Distribution */}
              <div className="flex-1 w-full space-y-1.5">
                {starDistribution.map(({ star, count, percentage }) => (
                  <div key={star} className="flex items-center gap-3 text-sm">
                    <span className="text-gray-400 w-6 text-right font-medium">
                      {star}★
                    </span>
                    <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ duration: 0.6, delay: star * 0.05 }}
                        className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full"
                      />
                    </div>
                    <span className="text-gray-500 text-xs w-6">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Review List */}
          <div className="space-y-3">
            {reviews.map((review, i) => (
              <ReviewCard key={review._id} review={review} index={i} />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default ReviewsSection;
