import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Clock,
  MapPin,
  Building,
  Zap,
  Loader2,
  Tag,
  Route,
  Navigation,
  ShieldCheck,
  ShieldAlert,
  Flag,
  Ban,
} from "lucide-react";
import { useParams, Link, useNavigate } from "react-router-dom";
import newRequest from "../utils/newRequest";
import getCurrentUser from "../utils/getCurrentUser";
import {
  fetchGigRouteInfo,
  getCurrentBrowserLocation,
} from "../utils/locationService";
import { formatDistance, formatTravelTime } from "../utils/locationHelpers";

const GigDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const currentUser = getCurrentUser();
  const [gig, setGig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);
  const [error, setError] = useState(null);
  const [coverLetter, setCoverLetter] = useState("");
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [routeInfo, setRouteInfo] = useState(null);
  const [reporting, setReporting] = useState(false);
  const [blocking, setBlocking] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportDetails, setReportDetails] = useState("");
  const [showReportModal, setShowReportModal] = useState(false);
  const [notice, setNotice] = useState(null);
  const [ownerBlocked, setOwnerBlocked] = useState(false);

  useEffect(() => {
    fetchGig();
  }, [id]);

  useEffect(() => {
    const loadRouteInfo = async () => {
      try {
        const location = await getCurrentBrowserLocation();
        const route = await fetchGigRouteInfo(id, location);
        setRouteInfo(route);
      } catch (routeError) {
        setRouteInfo(null);
      }
    };

    loadRouteInfo();
  }, [id]);

  const fetchGig = async () => {
    try {
      setLoading(true);
      const res = await newRequest.get(`/gigs/single/${id}`);
      setGig(res.data);
    } catch (err) {
      setError("Gig not found");
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async () => {
    if (!currentUser) {
      navigate("/login");
      return;
    }

    if (currentUser.role !== "student") {
      setError("Only students can apply to gigs");
      return;
    }

    setApplying(true);
    setError(null);
    try {
      await newRequest.post("/applications", {
        gigId: id,
        coverLetter,
      });
      setApplied(true);
      setShowApplyModal(false);
    } catch (err) {
      setError(err.response?.data || "Failed to apply");
    } finally {
      setApplying(false);
    }
  };

  const handleReportGig = async () => {
    if (!currentUser) {
      navigate("/login");
      return;
    }

    if (!reportReason.trim()) {
      setError("Please select or type a report reason");
      return;
    }

    setReporting(true);
    setError(null);
    try {
      const response = await newRequest.post(`/gigs/${id}/report`, {
        reason: reportReason,
        details: reportDetails,
      });
      setShowReportModal(false);
      setReportReason("");
      setReportDetails("");
      setNotice(response.data?.message || "Report submitted");
    } catch (err) {
      setError(err.response?.data || "Failed to submit report");
    } finally {
      setReporting(false);
    }
  };

  const handleBlockOwner = async () => {
    if (!currentUser) {
      navigate("/login");
      return;
    }

    if (!gig?.userId) {
      setError("Unable to block this user right now");
      return;
    }

    setBlocking(true);
    setError(null);
    try {
      const response = await newRequest.post(
        `/users/${currentUser._id}/block`,
        {
          blockedUserId: gig.userId,
        },
      );
      setOwnerBlocked(true);
      setNotice(response.data?.message || "User blocked successfully");
    } catch (err) {
      setError(err.response?.data || "Failed to block user");
    } finally {
      setBlocking(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-40">
        <Loader2 size={40} className="animate-spin text-neonPurple" />
      </div>
    );
  }

  if (error && !gig) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-12 text-center">
        <p className="text-red-500 text-lg">{error}</p>
        <Link
          to="/marketplace"
          className="text-neonPurple hover:underline mt-4 inline-block"
        >
          Back to Marketplace
        </Link>
      </div>
    );
  }

  const isOwner = currentUser && currentUser._id === gig?.userId;
  const isStudent = currentUser && currentUser.role === "student";
  const owner = gig?.owner;
  const showTrustActions = currentUser && !isOwner;

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <Link
        to="/marketplace"
        className="text-neonPurple hover:underline text-sm font-medium mb-8 inline-block"
      >
        &larr; Back to Gigs
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-8 md:p-12 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-neonPurple/10 blur-[80px] rounded-full pointer-events-none" />

        <div className="flex flex-col md:flex-row gap-8 justify-between items-start mb-8 border-b border-white/10 pb-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span
                className={`text-xs px-2 py-1 rounded-full font-bold uppercase ${gig.status === "open" ? "bg-neonGreen/20 text-neonGreen" : "bg-gray-500/20 text-gray-400"}`}
              >
                {gig.status}
              </span>
              {gig.cat && (
                <span className="text-xs px-2 py-1 rounded-full bg-surfaceElevated text-gray-400 flex items-center gap-1">
                  <Tag size={12} /> {gig.cat}
                </span>
              )}
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold mb-4 leading-tight">
              {gig.title}
            </h1>
            {owner && (
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <span className="text-sm text-gray-300">
                  Posted by {owner.username}
                </span>
                {owner.verified ? (
                  <span className="text-xs px-2 py-1 rounded-full bg-neonBlue/20 text-neonBlue flex items-center gap-1">
                    <ShieldCheck size={12} /> Verified
                  </span>
                ) : (
                  <span className="text-xs px-2 py-1 rounded-full bg-yellow-500/20 text-yellow-300 flex items-center gap-1">
                    <ShieldAlert size={12} /> Unverified
                  </span>
                )}
              </div>
            )}
            <div className="flex items-center gap-3 text-neonBlue font-bold text-xl">
              ₹{gig.price} Total
            </div>
          </div>

          {isStudent && !isOwner && (
            <button
              onClick={() => (applied ? null : setShowApplyModal(true))}
              disabled={
                applied ||
                gig.status !== "open" ||
                gig.moderationStatus !== "approved" ||
                ownerBlocked
              }
              className={`px-8 py-4 rounded-xl font-bold transition-all shadow-lg flex items-center gap-2 whitespace-nowrap
                ${applied || gig.status !== "open" || gig.moderationStatus !== "approved" || ownerBlocked ? "bg-surfaceElevated text-gray-400 cursor-not-allowed" : "bg-neonPurple hover:bg-neonPurple/90 text-white shadow-[0_0_20px_rgba(168,85,247,0.3)]"}`}
            >
              {applied ? (
                "Application Sent ✓"
              ) : ownerBlocked ? (
                "Blocked"
              ) : gig.moderationStatus !== "approved" ? (
                "Under Review"
              ) : gig.status !== "open" ? (
                "Gig Closed"
              ) : (
                <>
                  <Zap size={20} /> Apply Now
                </>
              )}
            </button>
          )}

          {!currentUser && (
            <Link
              to="/login"
              className="px-8 py-4 rounded-xl font-bold transition-all flex items-center gap-2 whitespace-nowrap bg-neonPurple hover:bg-neonPurple/90 text-white shadow-[0_0_20px_rgba(168,85,247,0.3)]"
            >
              <Zap size={20} /> Login to Apply
            </Link>
          )}
        </div>

        {gig.moderationStatus === "pending_review" && (
          <div className="mb-5 rounded-xl border border-yellow-500/30 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-200">
            This gig is currently under moderation review. Applications are
            temporarily disabled.
          </div>
        )}

        {showTrustActions && (
          <div className="mb-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setShowReportModal(true)}
              className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-300 px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2"
            >
              <Flag size={16} /> Report Gig
            </button>
            <button
              type="button"
              onClick={handleBlockOwner}
              disabled={blocking || ownerBlocked}
              className="bg-surfaceElevated hover:bg-white/10 border border-white/20 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 disabled:opacity-60"
            >
              <Ban size={16} />
              {ownerBlocked
                ? "User Blocked"
                : blocking
                  ? "Blocking..."
                  : "Block User"}
            </button>
          </div>
        )}

        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
        {notice && <p className="text-neonGreen text-sm mb-4">{notice}</p>}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-surfaceElevated rounded-lg">
              <Building className="text-neonBlue" size={24} />
            </div>
            <div>
              <div className="text-xs text-gray-500 uppercase tracking-wide">
                Category
              </div>
              <div className="font-semibold text-lg capitalize">
                {gig.cat || "General"}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-surfaceElevated rounded-lg">
              <MapPin className="text-neonPurple" size={24} />
            </div>
            <div>
              <div className="text-xs text-gray-500 uppercase tracking-wide">
                Location
              </div>
              <div className="font-semibold text-lg">{gig.location}</div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-surfaceElevated rounded-lg">
              <Clock className="text-neonGreen" size={24} />
            </div>
            <div>
              <div className="text-xs text-gray-500 uppercase tracking-wide">
                Duration
              </div>
              <div className="font-semibold text-lg">{gig.duration}</div>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-xl font-bold mb-4">About the Gig</h3>
          <p className="text-gray-400 leading-relaxed whitespace-pre-wrap">
            {gig.desc}
          </p>
        </div>

        <div className="mt-10 border-t border-white/10 pt-8">
          <h3 className="text-xl font-bold mb-4">Route & Distance</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="rounded-2xl border border-white/10 bg-surfaceElevated/70 px-5 py-4">
              <div className="flex items-center gap-2 text-neonBlue mb-2 font-semibold">
                <Navigation size={18} /> Distance from you
              </div>
              <div className="text-lg font-bold">
                {formatDistance(routeInfo?.distanceKm)}
              </div>
              <p className="text-sm text-gray-400 mt-2">
                Enable browser location to get live nearby travel estimates.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-surfaceElevated/70 px-5 py-4">
              <div className="flex items-center gap-2 text-neonPurple mb-2 font-semibold">
                <Route size={18} /> Estimated travel time
              </div>
              <div className="text-lg font-bold">
                {formatTravelTime(routeInfo?.travel)}
              </div>
              <p className="text-sm text-gray-400 mt-2">
                Walk and drive estimates are calculated directly from your
                current position.
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Apply Modal */}
      {showApplyModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card w-full max-w-lg p-6"
          >
            <h2 className="text-2xl font-bold mb-2">Apply for this Gig</h2>
            <p className="text-gray-400 text-sm mb-6">{gig.title}</p>

            <div className="mb-6">
              <label className="text-xs text-gray-500 font-medium mb-1 block uppercase tracking-wider">
                Cover Letter (Optional)
              </label>
              <textarea
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
                rows={4}
                className="w-full bg-surfaceElevated border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-neonPurple resize-none"
                placeholder="Tell the shop owner why you're a great fit for this gig..."
              />
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowApplyModal(false)}
                className="flex-1 bg-surfaceElevated hover:bg-white/10 py-3 rounded-lg font-bold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleApply}
                disabled={applying}
                className="flex-1 bg-neonPurple hover:bg-neonPurple/90 py-3 rounded-lg font-bold flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(168,85,247,0.4)] transition-all disabled:opacity-50"
              >
                {applying ? (
                  <>
                    <Loader2 size={18} className="animate-spin" /> Applying...
                  </>
                ) : (
                  "Submit Application"
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card w-full max-w-lg p-6"
          >
            <h2 className="text-2xl font-bold mb-2">Report This Gig</h2>
            <p className="text-gray-400 text-sm mb-6">
              Help us keep LocalGigHub safe by sharing what feels wrong.
            </p>

            <div className="mb-4">
              <label className="text-xs text-gray-500 font-medium mb-1 block uppercase tracking-wider">
                Reason
              </label>
              <select
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                className="w-full bg-surfaceElevated border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-red-400"
              >
                <option value="">Select a reason</option>
                <option value="Spam or scam">Spam or scam</option>
                <option value="Unsafe or abusive content">
                  Unsafe or abusive content
                </option>
                <option value="Misleading information">
                  Misleading information
                </option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="mb-6">
              <label className="text-xs text-gray-500 font-medium mb-1 block uppercase tracking-wider">
                Details (Optional)
              </label>
              <textarea
                value={reportDetails}
                onChange={(e) => setReportDetails(e.target.value)}
                rows={4}
                className="w-full bg-surfaceElevated border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-red-400 resize-none"
                placeholder="Add context to help moderators review this faster..."
              />
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowReportModal(false)}
                className="flex-1 bg-surfaceElevated hover:bg-white/10 py-3 rounded-lg font-bold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReportGig}
                disabled={reporting}
                className="flex-1 bg-red-500 hover:bg-red-500/90 py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {reporting ? (
                  <>
                    <Loader2 size={18} className="animate-spin" /> Submitting...
                  </>
                ) : (
                  "Submit Report"
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default GigDetails;
