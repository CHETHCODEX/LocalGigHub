import React, { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import {
  ShieldCheck,
  ShieldX,
  AlertTriangle,
  Loader2,
  RefreshCw,
  Check,
} from "lucide-react";
import newRequest from "../utils/newRequest";
import getCurrentUser from "../utils/getCurrentUser";

const ModerationQueue = () => {
  const navigate = useNavigate();
  const [currentUser] = useState(() => getCurrentUser());

  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [workingId, setWorkingId] = useState(null);
  const [noteByGigId, setNoteByGigId] = useState({});
  const [statusFilter, setStatusFilter] = useState("all");

  const loadQueue = useCallback(
    async (status = statusFilter) => {
      try {
        setLoading(true);
        setError(null);
        const response = await newRequest.get("/gigs/moderation/queue", {
          params: { status },
        });
        setQueue(response.data?.queue || []);
      } catch (err) {
        setError(
          err.response?.data ||
            "Unable to load moderation queue. Verified shop access is required.",
        );
        setQueue([]);
      } finally {
        setLoading(false);
      }
    },
    [statusFilter],
  );

  useEffect(() => {
    if (!currentUser) {
      navigate("/login");
      return;
    }
    if (currentUser.role !== "shop") {
      navigate("/student/dashboard");
      return;
    }

    loadQueue(statusFilter);
  }, [currentUser, navigate, statusFilter, loadQueue]);

  const handleModerationAction = async (gigId, action) => {
    try {
      setWorkingId(gigId);
      setError(null);
      await newRequest.patch(`/gigs/${gigId}/moderation`, {
        action,
        note: noteByGigId[gigId] || "",
      });
      setQueue((prev) => prev.filter((gig) => gig._id !== gigId));
    } catch (err) {
      setError(err.response?.data || "Failed to update moderation status");
    } finally {
      setWorkingId(null);
    }
  };

  if (!currentUser) return null;

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
            <ShieldCheck className="text-neonBlue" size={28} /> Moderation Queue
          </h1>
          <p className="text-gray-400">
            Review flagged gigs and decide whether to approve or reject them.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/shop/dashboard"
            className="bg-surfaceElevated hover:bg-white/10 px-4 py-2 rounded-lg text-sm font-semibold"
          >
            Back to Dashboard
          </Link>
          <button
            type="button"
            onClick={() => loadQueue(statusFilter)}
            disabled={loading}
            className="bg-neonBlue/10 hover:bg-neonBlue/20 border border-neonBlue/30 text-neonBlue px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 disabled:opacity-60"
          >
            {loading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <RefreshCw size={16} />
            )}
            Refresh
          </button>
        </div>
      </div>

      <div className="mb-6 flex items-center gap-3">
        <label className="text-sm text-gray-400">Status</label>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-surface border border-white/10 rounded-lg px-3 py-2 text-sm"
        >
          <option value="all">All</option>
          <option value="pending_review">Pending Review</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 text-red-300 px-4 py-3 text-sm flex items-center gap-2">
          <AlertTriangle size={16} /> {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-neonBlue" size={36} />
        </div>
      ) : queue.length === 0 ? (
        <div className="glass-card p-10 text-center text-gray-400">
          No gigs found for the selected moderation status.
        </div>
      ) : (
        <div className="space-y-4">
          {queue.map((gig, idx) => {
            const isWorking = workingId === gig._id;
            const reportCount = Array.isArray(gig.reports)
              ? gig.reports.filter((report) => report.status === "open").length
              : 0;

            return (
              <motion.div
                key={gig._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.04 }}
                className="glass-card p-6"
              >
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-4">
                  <div>
                    <h2 className="text-xl font-bold mb-1">{gig.title}</h2>
                    <p className="text-sm text-gray-400 mb-2">
                      {gig.location} • {gig.cat || "general"} • ₹{gig.price}
                    </p>
                    <div className="flex flex-wrap gap-2 text-xs">
                      <span className="px-2 py-1 rounded-full bg-yellow-500/20 text-yellow-200">
                        {gig.moderationStatus || "pending_review"}
                      </span>
                      {reportCount > 0 && (
                        <span className="px-2 py-1 rounded-full bg-red-500/20 text-red-300">
                          {reportCount} open reports
                        </span>
                      )}
                      {(gig.safetyFlags || []).length > 0 && (
                        <span className="px-2 py-1 rounded-full bg-neonBlue/20 text-neonBlue">
                          {(gig.safetyFlags || []).length} safety flags
                        </span>
                      )}
                    </div>
                  </div>

                  <Link
                    to={`/gig/${gig._id}`}
                    className="text-neonBlue hover:underline text-sm"
                  >
                    Open Gig
                  </Link>
                </div>

                <p className="text-gray-300 text-sm leading-relaxed mb-4 whitespace-pre-wrap">
                  {gig.desc}
                </p>

                <div className="mb-4">
                  <label className="text-xs text-gray-500 uppercase tracking-wider mb-1 block">
                    Moderator note (optional)
                  </label>
                  <textarea
                    value={noteByGigId[gig._id] || ""}
                    onChange={(e) =>
                      setNoteByGigId((prev) => ({
                        ...prev,
                        [gig._id]: e.target.value,
                      }))
                    }
                    rows={2}
                    className="w-full bg-surfaceElevated border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-neonBlue resize-none"
                    placeholder="Why this decision was made..."
                  />
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    disabled={isWorking}
                    onClick={() => handleModerationAction(gig._id, "approve")}
                    className="bg-neonGreen/15 hover:bg-neonGreen/25 text-neonGreen border border-neonGreen/30 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 disabled:opacity-50"
                  >
                    {isWorking ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Check size={14} />
                    )}
                    Approve
                  </button>
                  <button
                    type="button"
                    disabled={isWorking}
                    onClick={() => handleModerationAction(gig._id, "reject")}
                    className="bg-red-500/15 hover:bg-red-500/25 text-red-300 border border-red-500/30 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 disabled:opacity-50"
                  >
                    {isWorking ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <ShieldX size={14} />
                    )}
                    Reject
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ModerationQueue;
