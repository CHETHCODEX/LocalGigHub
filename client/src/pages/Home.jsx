import React from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { Briefcase, MapPin, Zap, Users, Shield, Clock } from "lucide-react";
import getCurrentUser from "../utils/getCurrentUser";

const Home = () => {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();

  const handlePostGig = () => {
    if (!currentUser) {
      // Not logged in - go to signup
      navigate("/signup");
    } else if (currentUser.role === "shop") {
      // Logged in as shop - go to dashboard with post modal
      navigate("/shop/dashboard?post=true");
    } else {
      // Logged in as student - they can't post gigs, redirect to marketplace
      navigate("/marketplace");
    }
  };

  return (
    <div className="w-full overflow-hidden">
      {/* Hero Section */}
      <section className="relative pt-20 pb-20 px-6 max-w-7xl mx-auto">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-neonPurple/20 blur-[120px] rounded-full pointer-events-none" />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="text-center lg:text-left">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6"
            >
              Hyperlocal <span className="text-gradient">Gig Intelligence</span>{" "}
              for your community.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-xl text-gray-400 mb-10"
            >
              Students find short-term nearby work. Local shops get immediate
              help. Powered by smart matching.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
            >
              <Link
                to="/marketplace"
                className="bg-neonPurple hover:bg-neonPurple/90 text-white font-semibold py-4 px-8 rounded-full shadow-[0_0_20px_rgba(168,85,247,0.4)] transition-all flex items-center justify-center gap-2"
              >
                <Zap size={20} /> Browse Gigs
              </Link>
              <button
                onClick={handlePostGig}
                className="glass hover:bg-white/10 text-white font-semibold py-4 px-8 rounded-full transition-all"
              >
                Post a Gig
              </button>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="relative"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-neonPurple/20 to-neonBlue/20 blur-3xl rounded-full" />
            <img
              src="/images/—Pngtree—hand drawn cartoon vector flat_4486811.png"
              alt="LocalGigHub Hero"
              className="relative z-10 w-full h-auto rounded-2xl shadow-2xl"
            />
          </motion.div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="py-24 px-6 max-w-7xl mx-auto relative">
        <div className="absolute top-0 right-0 w-96 h-96 bg-neonBlue/10 blur-[100px] rounded-full pointer-events-none" />

        <h2 className="text-3xl font-bold text-center mb-16">
          Why LocalGigHub?
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              title: "Nearby Matching",
              desc: "Find opportunities within walking distance. No commute required.",
              icon: <MapPin className="text-neonBlue" size={32} />,
            },
            {
              title: "Short-Term Work",
              desc: "Gigs taking 2-5 hours. Fits perfectly into student schedules.",
              icon: <Briefcase className="text-neonPurple" size={32} />,
            },
            {
              title: "Instant Help",
              desc: "Shops get verified local students ready to work right away.",
              icon: <Zap className="text-neonGreen" size={32} />,
            },
          ].map((feature, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.2 }}
              className="glass-card p-8 flex flex-col items-start hover:-translate-y-2 transition-transform duration-300"
            >
              <div className="p-3 bg-surfaceElevated rounded-2xl mb-6">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
              <p className="text-gray-400 leading-relaxed">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* For Businesses Section */}
      <section className="py-24 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-neonPurple/5 to-transparent" />
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="order-2 lg:order-1"
            >
              <img
                src="/images/business-desktop-870-x1.webp"
                alt="Business Dashboard"
                className="w-full h-auto rounded-2xl shadow-2xl border border-white/10"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="order-1 lg:order-2"
            >
              <span className="text-neonPurple font-semibold text-sm uppercase tracking-wider">
                For Local Shops
              </span>
              <h2 className="text-4xl font-bold mt-4 mb-6">
                Manage Your Workforce{" "}
                <span className="text-gradient">Effortlessly</span>
              </h2>
              <p className="text-gray-400 text-lg mb-8 leading-relaxed">
                Post gigs in seconds, review applicants instantly, and get
                immediate help from verified local students. Our smart dashboard
                keeps everything organized.
              </p>
              <div className="space-y-4">
                {[
                  {
                    icon: <Users size={20} />,
                    text: "Access to verified student talent pool",
                  },
                  {
                    icon: <Clock size={20} />,
                    text: "Fill positions within hours, not days",
                  },
                  {
                    icon: <Shield size={20} />,
                    text: "Secure payments & ratings system",
                  },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-4 text-gray-300"
                  >
                    <div className="p-2 bg-neonPurple/20 rounded-lg text-neonPurple">
                      {item.icon}
                    </div>
                    <span>{item.text}</span>
                  </div>
                ))}
              </div>
              <button
                onClick={handlePostGig}
                className="mt-10 bg-neonPurple hover:bg-neonPurple/90 text-white font-semibold py-4 px-8 rounded-full shadow-[0_0_20px_rgba(168,85,247,0.4)] transition-all"
              >
                Start Posting Gigs
              </button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats & CTA Section */}
      <section className="py-24 px-6 relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-neonBlue/10 blur-[150px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <span className="text-neonBlue font-semibold text-sm uppercase tracking-wider">
                For Students
              </span>
              <h2 className="text-4xl font-bold mt-4 mb-6">
                Earn While You <span className="text-gradient">Learn</span>
              </h2>
              <p className="text-gray-400 text-lg mb-8 leading-relaxed">
                Find flexible, short-term work that fits around your class
                schedule. Build real experience, earn money, and connect with
                local businesses.
              </p>

              <div className="grid grid-cols-3 gap-6 mb-10">
                {[
                  { number: "500+", label: "Active Gigs" },
                  { number: "2-5hr", label: "Avg Duration" },
                  { number: "₹1250-2100", label: "Hourly Rate" },
                ].map((stat, idx) => (
                  <div key={idx} className="text-center">
                    <div className="text-3xl font-extrabold text-gradient">
                      {stat.number}
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>

              <Link
                to="/marketplace"
                className="inline-flex items-center gap-2 bg-neonBlue hover:bg-neonBlue/90 text-white font-semibold py-4 px-8 rounded-full shadow-[0_0_20px_rgba(59,130,246,0.4)] transition-all"
              >
                <Zap size={20} /> Find Your First Gig
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="relative"
            >
              <div className="absolute -inset-4 bg-gradient-to-r from-neonBlue/20 to-neonPurple/20 blur-2xl rounded-3xl" />
              <img
                src="/images/logomaker.webp"
                alt="Student Opportunities"
                className="relative z-10 w-full h-auto rounded-2xl shadow-2xl border border-white/10"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl mx-auto text-center glass-card p-12 relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-neonPurple/10 to-neonBlue/10 pointer-events-none" />
          <h2 className="text-3xl md:text-4xl font-bold mb-6 relative z-10">
            Ready to Get Started?
          </h2>
          <p className="text-gray-400 text-lg mb-10 relative z-10">
            Join thousands of students and local businesses already using
            LocalGigHub.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center relative z-10">
            <Link
              to="/signup"
              className="bg-neonPurple hover:bg-neonPurple/90 text-white font-semibold py-4 px-10 rounded-full shadow-[0_0_20px_rgba(168,85,247,0.4)] transition-all"
            >
              Create Free Account
            </Link>
            <Link
              to="/marketplace"
              className="glass hover:bg-white/10 text-white font-semibold py-4 px-10 rounded-full transition-all"
            >
              Explore Marketplace
            </Link>
          </div>
        </motion.div>
      </section>
    </div>
  );
};

export default Home;
