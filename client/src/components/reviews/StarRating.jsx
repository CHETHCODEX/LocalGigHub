import React, { useState } from "react";

const StarRating = ({
  rating = 0,
  maxStars = 5,
  size = 24,
  interactive = false,
  onChange,
  showValue = false,
  className = "",
}) => {
  const [hoverRating, setHoverRating] = useState(0);

  const handleClick = (starValue) => {
    if (interactive && onChange) {
      onChange(starValue);
    }
  };

  const displayRating = interactive && hoverRating > 0 ? hoverRating : rating;

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {Array.from({ length: maxStars }, (_, i) => {
        const starValue = i + 1;
        const fillPercentage = Math.min(
          100,
          Math.max(0, (displayRating - i) * 100),
        );

        return (
          <button
            key={i}
            type="button"
            disabled={!interactive}
            onClick={() => handleClick(starValue)}
            onMouseEnter={() => interactive && setHoverRating(starValue)}
            onMouseLeave={() => interactive && setHoverRating(0)}
            className={`relative p-0 border-0 bg-transparent ${
              interactive
                ? "cursor-pointer transform transition-transform duration-150 hover:scale-125"
                : "cursor-default"
            }`}
            style={{ width: size, height: size }}
          >
            {/* Background star (empty) */}
            <svg
              viewBox="0 0 24 24"
              width={size}
              height={size}
              className="absolute inset-0"
              style={{ color: "rgba(255,255,255,0.15)" }}
            >
              <path
                fill="currentColor"
                d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
              />
            </svg>
            {/* Filled star (clipped) */}
            <svg
              viewBox="0 0 24 24"
              width={size}
              height={size}
              className="absolute inset-0"
              style={{
                clipPath: `inset(0 ${100 - fillPercentage}% 0 0)`,
              }}
            >
              <defs>
                <linearGradient
                  id={`star-grad-${i}`}
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="100%"
                >
                  <stop offset="0%" stopColor="#fbbf24" />
                  <stop offset="100%" stopColor="#f59e0b" />
                </linearGradient>
              </defs>
              <path
                fill={`url(#star-grad-${i})`}
                d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
              />
            </svg>
          </button>
        );
      })}
      {showValue && rating > 0 && (
        <span className="text-sm font-bold text-amber-400 ml-1">
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  );
};

export default StarRating;
