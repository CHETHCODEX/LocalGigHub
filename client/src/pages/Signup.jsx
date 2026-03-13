import React, { useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import newRequest from "../utils/newRequest";

const Signup = () => {
  const [role, setRole] = useState("student");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [country, setCountry] = useState("");
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await newRequest.post("/auth/register", {
        username,
        email,
        password,
        country,
        role,
      });
      navigate("/login");
    } catch (err) {
      setError(err.response?.data || "Registration failed");
    }
  };

  return (
    <div className="min-h-screen bg-background flex relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 w-full h-full z-0">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-neonBlue/20 rounded-full blur-[120px] animate-pulse" />
        <div
          className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-neonPurple/20 rounded-full blur-[120px] animate-pulse"
          style={{ animationDelay: "1s" }}
        />
      </div>

      <div className="w-full grid lg:grid-cols-2 items-center z-10 px-6 sm:px-12 md:px-16 lg:px-24 gap-10 py-10">
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="hidden lg:flex items-center justify-center"
        >
          <div className="relative w-full max-w-2xl">
            <div className="absolute inset-0 bg-neonBlue/10 blur-[120px] rounded-full pointer-events-none" />
            <img
              src="/images/—Pngtree—devops concept in 3d isometric_7601747.png"
              alt="Job platform illustration"
              className="relative w-full max-h-[680px] object-contain drop-shadow-[0_0_40px_rgba(59,130,246,0.18)]"
            />
          </div>
        </motion.div>

        {/* Floating Signup Form */}
        <div className="w-full flex items-center justify-center lg:justify-end">
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="glass-card w-full max-w-md p-8 relative overflow-hidden"
          >
            {/* Neon Glow backdrop inside card */}
            <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-neonBlue rounded-full blur-[80px] opacity-20 pointer-events-none" />

            <h2 className="text-3xl font-bold mb-2">Join the Hub</h2>
            <p className="text-gray-400 text-sm mb-6">
              Start finding or posting local gigs
            </p>

            <div className="flex bg-surfaceElevated p-1 rounded-lg mb-6 border border-white/5">
              <button
                className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${role === "student" ? "bg-background text-white shadow-sm" : "text-gray-500 hover:text-white"}`}
                onClick={() => setRole("student")}
              >
                I am a Job Seeker
              </button>
              <button
                className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${role === "shop" ? "bg-background text-white shadow-sm" : "text-gray-500 hover:text-white"}`}
                onClick={() => setRole("shop")}
              >
                I am a Job Provider
              </button>
            </div>

            <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-surfaceElevated border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-neonBlue focus:ring-1 focus:ring-neonBlue transition-all text-sm"
                  placeholder="Username"
                />
              </div>
              <div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-surfaceElevated border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-neonBlue focus:ring-1 focus:ring-neonBlue transition-all text-sm"
                  placeholder="Email Address"
                />
              </div>
              <div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-surfaceElevated border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-neonBlue focus:ring-1 focus:ring-neonBlue transition-all text-sm"
                  placeholder="Password"
                />
              </div>
              <div>
                <input
                  type="text"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full bg-surfaceElevated border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-neonBlue focus:ring-1 focus:ring-neonBlue transition-all text-sm"
                  placeholder="Country"
                />
              </div>

              <button
                type="submit"
                className="mt-2 bg-neonBlue text-white py-3 rounded-lg font-bold shadow-[0_0_15px_rgba(59,130,246,0.4)] hover:shadow-[0_0_25px_rgba(59,130,246,0.7)] transition-shadow"
              >
                Create Account
              </button>
            </form>

            <div className="mt-6 text-center text-sm text-gray-400">
              Already a member?{" "}
              <Link
                to="/login"
                className="text-neonBlue hover:underline font-medium"
              >
                Log in
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
