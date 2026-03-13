import React, { useState, Suspense, lazy } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import newRequest from "../utils/newRequest";

const Spline = lazy(() => import("@splinetool/react-spline"));

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [splineError, setSplineError] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await newRequest.post("/auth/login", { username, password });
      localStorage.setItem("currentUser", JSON.stringify(res.data));
      navigate("/");
    } catch (err) {
      setError(err.response?.data || "Login failed");
    }
  };

  return (
    <div className="min-h-screen bg-background flex relative overflow-hidden">
      {/* 3D Spline Scene */}
      <div className="absolute inset-0 w-full h-full z-0">
        {/* Fallback gradient */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-neonPurple/20 rounded-full blur-[120px] animate-pulse" />
        <div
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-neonBlue/20 rounded-full blur-[120px] animate-pulse"
          style={{ animationDelay: "1s" }}
        />
        {/* 3D Model */}
        {!splineError && (
          <Suspense fallback={null}>
            <Spline
              scene="https://prod.spline.design/thT1X9vcHhiJz5xn/scene.splinecode"
              onError={() => setSplineError(true)}
            />
          </Suspense>
        )}
      </div>

      {/* Floating Login Form */}
      <div className="w-full flex items-center justify-center md:justify-end z-10 px-6 sm:px-12 md:px-24">
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="glass-card w-full max-w-md p-8 relative overflow-hidden"
        >
          {/* Neon Glow backdrop inside card */}
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-neonPurple rounded-full blur-[80px] opacity-30 pointer-events-none" />

          <h2 className="text-3xl font-bold mb-2">Welcome Back</h2>
          <p className="text-gray-400 text-sm mb-8">
            Access your LocalGigHub account
          </p>

          <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <div>
              <label className="text-xs text-gray-500 font-medium mb-1 block uppercase tracking-wider">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-surfaceElevated border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-neonPurple focus:ring-1 focus:ring-neonPurple transition-all"
                placeholder="johndoe"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 font-medium mb-1 block uppercase tracking-wider">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-surfaceElevated border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-neonPurple focus:ring-1 focus:ring-neonPurple transition-all"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              className="mt-4 bg-neonPurple text-white py-3 rounded-lg font-bold shadow-[0_0_15px_rgba(168,85,247,0.4)] hover:shadow-[0_0_25px_rgba(168,85,247,0.7)] transition-shadow"
            >
              Sign In
            </button>
          </form>

          <div className="mt-8 text-center text-sm text-gray-400">
            Don't have an account?{" "}
            <Link
              to="/signup"
              className="text-neonPurple hover:underline font-medium"
            >
              Create one
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
