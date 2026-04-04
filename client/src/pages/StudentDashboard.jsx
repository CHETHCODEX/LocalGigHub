import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { Clock, CheckCircle, XCircle, Sparkles, Star } from "lucide-react";
import ReviewModal from "../components/reviews/ReviewModal";
import getCurrentUser from "../utils/getCurrentUser";
import newRequest from "../utils/newRequest";
import { AIRecommendations, SkillExtractor } from "../components/ai";
import AreaAlertsPanel from "../components/location/AreaAlertsPanel";
import { getCurrentBrowserLocation } from "../utils/locationService";

const StudentDashboard = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState(null);
  const [reviewStatuses, setReviewStatuses] = useState({});
  const [reviewModalApp, setReviewModalApp] = useState(null);
  const navigate = useNavigate();
  const currentUser = getCurrentUser();

  useEffect(() => {
    if (!currentUser) {
      navigate("/login");
      return;
    }
    if (currentUser.role !== "student") {
      navigate("/shop/dashboard");
      return;
    }
    fetchApplications();
    getCurrentBrowserLocation()
      .then(setUserLocation)
      .catch(() => setUserLocation(null));
  }, []);

  // Check review status for completed applications
  useEffect(() => {
    const checkReviews = async () => {
      const completedApps = applications.filter(
        (app) => app.status === "completed",
      );
      const statuses = {};
      await Promise.all(
        completedApps.map(async (app) => {
          try {
            const res = await newRequest.get(`/reviews/check/${app._id}`);
            statuses[app._id] = res.data;
          } catch {
            statuses[app._id] = { hasReviewed: false };
          }
        }),
      );
      setReviewStatuses(statuses);
    };
    if (applications.length > 0) checkReviews();
  }, [applications]);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const res = await newRequest.get("/applications");
      setApplications(res.data);
    } catch (err) {
      console.error("Error fetching applications:", err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "completed":
        return (
          <div className="flex items-center gap-2 bg-amber-500/20 text-amber-400 px-3 py-1.5 rounded-md text-sm font-bold">
            <CheckCircle size={16} /> Completed
          </div>
        );
      case "accepted":
        return (
          <div className="flex items-center gap-2 bg-neonGreen/20 text-neonGreen px-3 py-1.5 rounded-md text-sm font-bold">
            <CheckCircle size={16} /> Accepted
          </div>
        );
      case "rejected":
        return (
          <div className="flex items-center gap-2 bg-red-500/20 text-red-500 px-3 py-1.5 rounded-md text-sm font-bold">
            <XCircle size={16} /> Rejected
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-2 bg-yellow-500/20 text-yellow-500 px-3 py-1.5 rounded-md text-sm font-bold">
            <Clock size={16} /> Pending
          </div>
        );
    }
  };

  const completedGigs = applications.filter(
    (app) => app.status === "accepted",
  ).length;

  if (!currentUser) return null;

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="flex flex-col md:flex-row gap-8 items-start mb-12">
        <div className="flex-1">
          <h1 className="text-3xl font-bold mb-2">My Student Hub</h1>
          <p className="text-gray-400">
            Track your gig applications and active jobs.
          </p>
        </div>
        <div className="glass-card p-6 flex gap-6 items-center">
          <div>
            <div className="text-sm text-gray-400 font-medium">
              Applications
            </div>
            <div className="text-3xl font-extrabold text-neonBlue">
              {applications.length}
            </div>
          </div>
          <div className="h-12 w-px bg-white/10" />
          <div>
            <div className="text-sm text-gray-400 font-medium">
              Gigs Accepted
            </div>
            <div className="text-3xl font-extrabold text-neonGreen">
              {completedGigs}
            </div>
          </div>
        </div>
      </div>

      {/* AI Recommended Gigs Section */}
      <div className="mb-8">
        <AIRecommendations limit={6} showScores={true} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-xl font-bold border-b border-white/10 pb-4">
            My Applications
          </h2>

          {loading ? (
            <div className="text-center py-8 text-gray-400">Loading...</div>
          ) : applications.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              No applications yet.{" "}
              <Link to="/marketplace" className="text-neonBlue hover:underline">
                Browse gigs
              </Link>{" "}
              to get started!
            </div>
          ) : (
            applications.map((app, index) => (
              <motion.div
                key={app._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="glass-card p-6 flex items-center justify-between hover:bg-surfaceElevated transition-colors"
              >
                <div>
                  <h3 className="font-bold text-lg mb-1">
                    <Link
                      to={`/gig/${app.gigId}`}
                      className="hover:text-neonBlue"
                    >
                      {app.gigTitle || "Gig Application"}
                    </Link>
                  </h3>
                  <p className="text-sm text-gray-400">
                    Applied: {new Date(app.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {getStatusBadge(app.status)}
                  {app.status === "completed" && (
                    reviewStatuses[app._id]?.hasReviewed ? (
                      <div className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold px-3 py-1.5 rounded-md">
                        <Star size={14} fill="currentColor" /> Reviewed
                      </div>
                    ) : (
                      <button
                        onClick={() => setReviewModalApp(app)}
                        className="flex items-center gap-1.5 bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 border border-amber-500/30 text-amber-400 text-xs font-bold px-3 py-1.5 rounded-md transition-all"
                      >
                        <Star size={14} /> Leave Review
                      </button>
                    )
                  )}
                  <Link
                    to={`/chat?gigId=${app.gigId}&userId=${app.shopId}`}
                    className="bg-neonBlue/15 hover:bg-neonBlue/25 border border-neonBlue/40 text-neonBlue text-xs font-bold px-3 py-1.5 rounded-md"
                  >
                    Open Chat
                  </Link>
                </div>
              </motion.div>
            ))
          )}

          {/* Review Modal */}
          {reviewModalApp && (
            <ReviewModal
              isOpen={true}
              onClose={() => setReviewModalApp(null)}
              applicationId={reviewModalApp._id}
              gigTitle={reviewModalApp.gigTitle}
              revieweeName={reviewModalApp.shopName || "the job provider"}
              onReviewSubmitted={() => {
                setReviewModalApp(null);
                fetchApplications();
              }}
            />
          )}
        </div>

        <div>
          <h2 className="text-xl font-bold border-b border-white/10 pb-4 mb-6">
            Profile Details
          </h2>
          <div className="glass-card p-6">
            <div className="w-20 h-20 bg-surfaceElevated rounded-full flex items-center justify-center text-2xl font-bold mb-4 border-2 border-neonBlue">
              {currentUser.username?.substring(0, 2).toUpperCase()}
            </div>
            <h3 className="text-xl font-bold">{currentUser.username}</h3>
            <p className="text-gray-400 text-sm mb-6">{currentUser.email}</p>

            <div className="space-y-4">
              <div>
                <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">
                  Role
                </div>
                <span className="bg-neonBlue/20 text-neonBlue px-2 py-1 rounded text-xs capitalize">
                  {currentUser.role}
                </span>
              </div>
              <div>
                <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">
                  Location
                </div>
                <p className="text-sm">
                  {currentUser.country || "Not specified"}
                </p>
              </div>
            </div>
          </div>

          {/* AI Skill Extractor */}
          <div className="mt-6">
            <SkillExtractor
              initialSkills={currentUser.skills || []}
              showTextInput={true}
              compact={false}
            />
          </div>

          <div className="mt-6">
            <AreaAlertsPanel
              currentUser={currentUser}
              userLocation={userLocation}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
