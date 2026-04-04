import React from "react";
import { motion } from "framer-motion";
import StarRating from "./StarRating";

const timeAgo = (dateStr) => {
  const now = new Date();
  const date = new Date(dateStr);
  const seconds = Math.floor((now - date) / 1000);

  const intervals = [
    { label: "year", seconds: 31536000 },
    { label: "month", seconds: 2592000 },
    { label: "week", seconds: 604800 },
    { label: "day", seconds: 86400 },
    { label: "hour", seconds: 3600 },
    { label: "minute", seconds: 60 },
  ];

  for (const interval of intervals) {
    const count = Math.floor(seconds / interval.seconds);
    if (count >= 1) {
      return `${count} ${interval.label}${count > 1 ? "s" : ""} ago`;
    }
  }
  return "Just now";
};

const ReviewCard = ({ review, index = 0 }) => {
  const initials = (review.reviewerName || "U")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  const roleBadge =
    review.reviewerRole === "shop" || review.reviewerUserRole === "shop"
      ? { label: "Job Provider", color: "neonPurple" }
      : { label: "Job Seeker", color: "neonBlue" };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.35 }}
      className="glass-card p-5 group hover:border-white/20 transition-colors"
    >
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="flex-shrink-0">
          {review.reviewerImg ? (
            <img
              src={review.reviewerImg}
              alt={review.reviewerName}
              className="w-10 h-10 rounded-full object-cover border-2 border-white/10"
            />
          ) : (
            <div
              className={`w-10 h-10 rounded-full bg-${roleBadge.color}/20 border-2 border-${roleBadge.color}/30 flex items-center justify-center text-xs font-bold text-${roleBadge.color}`}
            >
              {initials}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className="font-semibold text-sm text-white">
              {review.reviewerName || "Anonymous"}
            </span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider bg-${roleBadge.color}/15 text-${roleBadge.color} border border-${roleBadge.color}/25`}
            >
              {roleBadge.label}
            </span>
            <span className="text-[11px] text-gray-500 ml-auto">
              {timeAgo(review.createdAt)}
            </span>
          </div>

          <div className="mb-2">
            <StarRating rating={review.star} size={16} />
          </div>

          {review.comment && (
            <p className="text-sm text-gray-300 leading-relaxed">
              "{review.comment}"
            </p>
          )}

          {review.gigTitle && (
            <p className="text-xs text-gray-500 mt-2">
              Gig: {review.gigTitle}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default ReviewCard;
