import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { User, Check, X, PlusCircle, Loader2, Sparkles } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import getCurrentUser from "../utils/getCurrentUser";
import newRequest from "../utils/newRequest";
import { DemandPredictor, PricingSuggestion } from "../components/ai";
import { seedGigSkills } from "../utils/aiService";

const ShopDashboard = () => {
  const [searchParams] = useSearchParams();
  const [showPostModal, setShowPostModal] = useState(
    searchParams.get("post") === "true",
  );
  const [myGigs, setMyGigs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const currentUser = getCurrentUser();

  const [seeding, setSeeding] = useState(false);
  const [seedMsg, setSeedMsg] = useState(null);
  const [publishNotice, setPublishNotice] = useState(null);

  // Gig form state
  const [gigForm, setGigForm] = useState({
    title: "",
    desc: "",
    cat: "",
    price: "",
    location: "",
    duration: "",
    cover: "",
    requiredSkills: [],
  });
  const [skillInput, setSkillInput] = useState("");

  useEffect(() => {
    if (!currentUser) {
      navigate("/login");
      return;
    }
    if (currentUser.role !== "shop") {
      navigate("/student/dashboard");
      return;
    }
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [gigsRes, appsRes] = await Promise.all([
        newRequest.get(`/gigs?userId=${currentUser._id}`),
        newRequest.get(`/applications`),
      ]);
      setMyGigs(gigsRes.data);
      setApplications(appsRes.data);
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setGigForm((prev) => ({ ...prev, [name]: value }));
  };

  const handlePostGig = async (e) => {
    e.preventDefault();
    setPosting(true);
    setError(null);
    setPublishNotice(null);
    try {
      const response = await newRequest.post("/gigs", {
        ...gigForm,
        price: Number(gigForm.price),
      });

      const moderationStatus = response.data?.moderationStatus;
      setPublishNotice(
        moderationStatus === "pending_review"
          ? "Gig submitted and moved to moderation queue before it appears publicly."
          : "Gig published successfully.",
      );

      setShowPostModal(false);
      setGigForm({
        title: "",
        desc: "",
        cat: "",
        price: "",
        location: "",
        duration: "",
        cover: "",
        requiredSkills: [],
      });
      setSkillInput("");
      fetchData(); // Refresh gigs list
    } catch (err) {
      setError(err.response?.data || "Failed to post gig");
    } finally {
      setPosting(false);
    }
  };

  const handleApplicationAction = async (appId, action) => {
    try {
      await newRequest.patch(`/applications/${appId}/status`, {
        status: action,
      });
      fetchData(); // Refresh applications
    } catch (err) {
      console.error("Error updating application:", err);
    }
  };

  const handleSeedSkills = async () => {
    setSeeding(true);
    setSeedMsg(null);
    try {
      const result = await seedGigSkills();
      setSeedMsg(result.message);
    } catch (err) {
      setSeedMsg("Failed to seed skills.");
    } finally {
      setSeeding(false);
    }
  };

  if (!currentUser) return null;

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-3xl font-bold mb-2">Shop Manager</h1>
          <p className="text-gray-400">
            Post gigs and manage student applications.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/shop/moderation"
            className="bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-200 border border-yellow-500/30 font-bold py-3 px-4 rounded-xl transition-all text-sm"
          >
            Moderation Queue
          </Link>
          <button
            onClick={handleSeedSkills}
            disabled={seeding}
            title="One-time fix: assigns skills to existing gigs so AI recommendations show varied match scores"
            className="bg-neonBlue/10 hover:bg-neonBlue/20 text-neonBlue border border-neonBlue/30 font-bold py-3 px-4 rounded-xl flex items-center gap-2 transition-all text-sm disabled:opacity-50"
          >
            {seeding ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Sparkles size={16} />
            )}
            {seeding ? "Fixing..." : "Fix AI Scores"}
          </button>
          <button
            onClick={() => setShowPostModal(true)}
            className="bg-neonPurple hover:bg-neonPurple/90 text-white font-bold py-3 px-6 rounded-xl flex items-center gap-2 shadow-[0_0_15px_rgba(168,85,247,0.4)] transition-all"
          >
            <PlusCircle size={20} /> Post New Gig
          </button>
        </div>
      </div>
      {seedMsg && (
        <div className="mb-6 bg-neonBlue/10 border border-neonBlue/30 text-neonBlue rounded-xl px-5 py-3 text-sm flex items-center justify-between">
          <span>✓ {seedMsg}</span>
          <button
            onClick={() => setSeedMsg(null)}
            className="ml-4 hover:text-white"
          >
            ×
          </button>
        </div>
      )}
      {publishNotice && (
        <div className="mb-6 bg-neonGreen/10 border border-neonGreen/30 text-neonGreen rounded-xl px-5 py-3 text-sm flex items-center justify-between">
          <span>✓ {publishNotice}</span>
          <button
            onClick={() => setPublishNotice(null)}
            className="ml-4 hover:text-white"
          >
            ×
          </button>
        </div>
      )}

      {/* Post Gig Modal */}
      {showPostModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto"
          >
            <h2 className="text-2xl font-bold mb-6">Post a New Gig</h2>
            {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
            <form onSubmit={handlePostGig} className="space-y-4">
              <div>
                <label className="text-xs text-gray-500 font-medium mb-1 block uppercase tracking-wider">
                  Title
                </label>
                <input
                  type="text"
                  name="title"
                  value={gigForm.title}
                  onChange={handleInputChange}
                  required
                  className="w-full bg-surfaceElevated border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-neonPurple"
                  placeholder="e.g. Weekend Shop Assistant"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 font-medium mb-1 block uppercase tracking-wider">
                  Description
                </label>
                <textarea
                  name="desc"
                  value={gigForm.desc}
                  onChange={handleInputChange}
                  required
                  rows={3}
                  className="w-full bg-surfaceElevated border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-neonPurple resize-none"
                  placeholder="Describe the job requirements..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-500 font-medium mb-1 block uppercase tracking-wider">
                    Category
                  </label>
                  <select
                    name="cat"
                    value={gigForm.cat}
                    onChange={handleInputChange}
                    required
                    className="w-full bg-surfaceElevated border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-neonPurple"
                  >
                    <option value="">Select category</option>
                    <option value="retail">Retail</option>
                    <option value="food">Food & Beverage</option>
                    <option value="delivery">Delivery</option>
                    <option value="tutoring">Tutoring</option>
                    <option value="events">Events</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500 font-medium mb-1 block uppercase tracking-wider">
                    Price (₹)
                  </label>
                  <input
                    type="number"
                    name="price"
                    value={gigForm.price}
                    onChange={handleInputChange}
                    required
                    min="1"
                    className="w-full bg-surfaceElevated border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-neonPurple"
                    placeholder="50"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-500 font-medium mb-1 block uppercase tracking-wider">
                    Location
                  </label>
                  <input
                    type="text"
                    name="location"
                    value={gigForm.location}
                    onChange={handleInputChange}
                    required
                    className="w-full bg-surfaceElevated border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-neonPurple"
                    placeholder="e.g. Downtown"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 font-medium mb-1 block uppercase tracking-wider">
                    Duration
                  </label>
                  <input
                    type="text"
                    name="duration"
                    value={gigForm.duration}
                    onChange={handleInputChange}
                    required
                    className="w-full bg-surfaceElevated border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-neonPurple"
                    placeholder="e.g. 4 hours"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500 font-medium mb-1 block uppercase tracking-wider">
                  Cover Image URL (optional)
                </label>
                <input
                  type="text"
                  name="cover"
                  value={gigForm.cover}
                  onChange={handleInputChange}
                  className="w-full bg-surfaceElevated border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-neonPurple"
                  placeholder="https://..."
                />
              </div>

              {/* Required Skills */}
              <div>
                <label className="text-xs text-gray-500 font-medium mb-1 block uppercase tracking-wider">
                  Required Skills
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (
                        (e.key === "Enter" || e.key === ",") &&
                        skillInput.trim()
                      ) {
                        e.preventDefault();
                        const skill = skillInput.trim().toLowerCase();
                        if (!gigForm.requiredSkills.includes(skill)) {
                          setGigForm((prev) => ({
                            ...prev,
                            requiredSkills: [...prev.requiredSkills, skill],
                          }));
                        }
                        setSkillInput("");
                      }
                    }}
                    className="flex-1 bg-surfaceElevated border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-neonPurple text-sm"
                    placeholder="Type a skill and press Enter (e.g. driving, customer service)"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const skill = skillInput.trim().toLowerCase();
                      if (skill && !gigForm.requiredSkills.includes(skill)) {
                        setGigForm((prev) => ({
                          ...prev,
                          requiredSkills: [...prev.requiredSkills, skill],
                        }));
                      }
                      setSkillInput("");
                    }}
                    className="bg-neonPurple/20 hover:bg-neonPurple/40 text-neonPurple border border-neonPurple/30 px-4 py-3 rounded-lg text-sm font-bold transition-colors"
                  >
                    Add
                  </button>
                </div>
                {gigForm.requiredSkills.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {gigForm.requiredSkills.map((skill) => (
                      <span
                        key={skill}
                        className="flex items-center gap-1 bg-neonPurple/20 text-neonPurple border border-neonPurple/30 px-3 py-1 rounded-full text-xs font-medium"
                      >
                        {skill}
                        <button
                          type="button"
                          onClick={() =>
                            setGigForm((prev) => ({
                              ...prev,
                              requiredSkills: prev.requiredSkills.filter(
                                (s) => s !== skill,
                              ),
                            }))
                          }
                          className="ml-1 hover:text-white transition-colors"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                {gigForm.requiredSkills.length === 0 && (
                  <p className="text-xs text-gray-600 mt-1">
                    Adding skills helps the AI match the right candidates to
                    your gig.
                  </p>
                )}
              </div>

              {/* AI Pricing Suggestion */}
              {gigForm.cat && (
                <div className="border-t border-white/10 pt-4 mt-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles size={16} className="text-neonPurple" />
                    <span className="text-sm text-gray-400">
                      AI Pricing Assistant
                    </span>
                  </div>
                  <PricingSuggestion
                    category={gigForm.cat}
                    duration={gigForm.duration}
                    city={gigForm.location}
                    currentPrice={gigForm.price ? Number(gigForm.price) : null}
                    onPriceSelect={(price) =>
                      setGigForm((prev) => ({
                        ...prev,
                        price: price.toString(),
                      }))
                    }
                    autoFetch={true}
                  />
                </div>
              )}

              {/* AI Demand Prediction */}
              {gigForm.cat && gigForm.location && (
                <div className="border-t border-white/10 pt-4">
                  <DemandPredictor
                    category={gigForm.cat}
                    location={gigForm.location}
                    price={gigForm.price ? Number(gigForm.price) : 0}
                    autoFetch={true}
                    showForecast={false}
                  />
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowPostModal(false)}
                  className="flex-1 bg-surfaceElevated hover:bg-white/10 py-3 rounded-lg font-bold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={posting}
                  className="flex-1 bg-neonPurple hover:bg-neonPurple/90 py-3 rounded-lg font-bold flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(168,85,247,0.4)] transition-all disabled:opacity-50"
                >
                  {posting ? (
                    <>
                      <Loader2 size={18} className="animate-spin" /> Posting...
                    </>
                  ) : (
                    "Post Gig"
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <h2 className="text-xl font-bold mb-6 border-b border-white/10 pb-4">
            Recent Applicants
          </h2>

          {loading ? (
            <div className="text-center py-8 text-gray-400">Loading...</div>
          ) : applications.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              No applications yet
            </div>
          ) : (
            <div className="space-y-4">
              {applications.map((app) => (
                <motion.div
                  key={app._id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="glass-card p-5"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-surfaceElevated p-2 rounded-full">
                        <User size={20} />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm">
                          {app.applicantName || "Student"}
                        </h3>
                        <p className="text-xs text-gray-400">
                          Applied for: {app.gigTitle || "Gig"}
                        </p>
                      </div>
                    </div>
                    <div className="text-xs text-neonBlue font-bold">
                      {app.status}
                    </div>
                  </div>
                  <p className="text-sm text-gray-300 mb-4 bg-surface/50 p-3 rounded-md line-clamp-2">
                    "{app.coverLetter || "No cover letter provided"}"
                  </p>
                  <div className="flex gap-3">
                    <Link
                      to={`/chat?gigId=${app.gigId}&userId=${app.studentId}`}
                      className="flex-1 bg-neonBlue/10 text-neonBlue hover:bg-neonBlue/20 py-2 rounded-lg text-sm font-bold flex justify-center items-center gap-2 transition-colors"
                    >
                      Chat
                    </Link>
                    {app.status === "pending" && (
                      <>
                        <button
                          onClick={() =>
                            handleApplicationAction(app._id, "accepted")
                          }
                          className="flex-1 bg-neonGreen/10 text-neonGreen hover:bg-neonGreen/20 py-2 rounded-lg text-sm font-bold flex justify-center items-center gap-2 transition-colors"
                        >
                          <Check size={16} /> Accept
                        </button>
                        <button
                          onClick={() =>
                            handleApplicationAction(app._id, "rejected")
                          }
                          className="flex-1 bg-red-500/10 text-red-500 hover:bg-red-500/20 py-2 rounded-lg text-sm font-bold flex justify-center items-center gap-2 transition-colors"
                        >
                          <X size={16} /> Decline
                        </button>
                      </>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        <div>
          <h2 className="text-xl font-bold mb-6 border-b border-white/10 pb-4">
            My Gigs
          </h2>

          {loading ? (
            <div className="text-center py-8 text-gray-400">Loading...</div>
          ) : myGigs.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              No gigs posted yet. Create your first gig!
            </div>
          ) : (
            <div className="space-y-4">
              {myGigs.map((gig) => (
                <motion.div
                  key={gig._id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="glass-card p-5 flex justify-between items-center group cursor-pointer hover:border-white/20 transition-colors"
                >
                  <div>
                    <h3 className="font-bold text-lg mb-1 group-hover:text-neonPurple transition-colors">
                      <Link to={`/gig/${gig._id}`}>{gig.title}</Link>
                    </h3>
                    <p className="text-sm text-gray-400">
                      {gig.duration} • ₹{gig.price} •{" "}
                      <span className="text-neonPurple font-bold">
                        {gig.location}
                      </span>
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Moderation: {gig.moderationStatus || "approved"}
                    </p>
                  </div>
                  <div
                    className={`text-xs font-bold uppercase tracking-wide px-2 py-1 rounded ${gig.status === "open" ? "bg-neonGreen/20 text-neonGreen" : "bg-surfaceElevated text-white/70"}`}
                  >
                    {gig.status}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShopDashboard;
