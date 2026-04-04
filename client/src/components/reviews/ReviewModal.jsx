import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, CheckCircle, X } from "lucide-react";
import StarRating from "./StarRating";
import newRequest from "../../utils/newRequest";

const ReviewModal = ({
  isOpen,
  onClose,
  applicationId,
  gigTitle,
  revieweeName,
  onReviewSubmitted,
}) => {
  const [star, setStar] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const starLabels = ["", "Poor", "Fair", "Good", "Very Good", "Excellent"];

  const handleSubmit = async () => {
    if (star < 1) {
      setError("Please select a star rating");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await newRequest.post("/reviews", {
        applicationId,
        star,
        comment: comment.trim(),
      });

      setSuccess(true);

      setTimeout(() => {
        onReviewSubmitted?.();
        handleClose();
      }, 1500);
    } catch (err) {
      setError(err.response?.data || "Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setStar(0);
    setComment("");
    setError(null);
    setSuccess(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="glass-card w-full max-w-md p-6 relative overflow-hidden"
        >
          {/* Background glow */}
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-amber-500/10 blur-[60px] rounded-full pointer-events-none" />

          {/* Close button */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>

          {success ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center py-8"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{
                  type: "spring",
                  damping: 10,
                  stiffness: 200,
                  delay: 0.1,
                }}
              >
                <CheckCircle size={64} className="text-neonGreen mb-4" />
              </motion.div>
              <h3 className="text-xl font-bold mb-2">Review Submitted!</h3>
              <p className="text-gray-400 text-sm">
                Thank you for your feedback ⭐
              </p>
            </motion.div>
          ) : (
            <>
              <h2 className="text-2xl font-bold mb-1">Leave a Review</h2>
              <p className="text-gray-400 text-sm mb-6">
                Rate your experience with{" "}
                <span className="text-white font-medium">
                  {revieweeName || "this user"}
                </span>
                {gigTitle && (
                  <>
                    {" "}
                    for{" "}
                    <span className="text-neonPurple font-medium">
                      {gigTitle}
                    </span>
                  </>
                )}
              </p>

              {/* Star Rating Input */}
              <div className="flex flex-col items-center gap-3 mb-6 py-4 bg-surfaceElevated/50 rounded-xl border border-white/5">
                <StarRating
                  rating={star}
                  size={36}
                  interactive={true}
                  onChange={setStar}
                />
                <span
                  className={`text-sm font-medium transition-colors ${star > 0 ? "text-amber-400" : "text-gray-500"}`}
                >
                  {star > 0 ? starLabels[star] : "Tap a star to rate"}
                </span>
              </div>

              {/* Comment */}
              <div className="mb-6">
                <label className="text-xs text-gray-500 font-medium mb-1 block uppercase tracking-wider">
                  Comment (Optional)
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={3}
                  maxLength={500}
                  className="w-full bg-surfaceElevated border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-amber-500/50 resize-none text-sm"
                  placeholder="Share your experience..."
                />
                <p className="text-xs text-gray-600 mt-1 text-right">
                  {comment.length}/500
                </p>
              </div>

              {error && (
                <p className="text-red-500 text-sm mb-4 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 bg-surfaceElevated hover:bg-white/10 py-3 rounded-lg font-bold transition-colors text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting || star < 1}
                  className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed text-sm shadow-[0_0_20px_rgba(245,158,11,0.25)]"
                >
                  {submitting ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />{" "}
                      Submitting...
                    </>
                  ) : (
                    "Submit Review ⭐"
                  )}
                </button>
              </div>
            </>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ReviewModal;
