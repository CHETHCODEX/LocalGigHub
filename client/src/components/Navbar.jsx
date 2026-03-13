import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { User, LogOut, ChevronDown, Bell } from "lucide-react";
import getCurrentUser from "../utils/getCurrentUser";
import newRequest from "../utils/newRequest";

const Navbar = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const user = getCurrentUser();
    setCurrentUser(user);
  }, []);

  useEffect(() => {
    if (!currentUser?._id) return;

    const fetchUnreadCount = async () => {
      try {
        const response = await newRequest.get("/notifications/unread-count");
        setUnreadCount(response.data?.unreadCount || 0);
      } catch {
        setUnreadCount(0);
      }
    };

    fetchUnreadCount();

    if (
      typeof window !== "undefined" &&
      "Notification" in window &&
      Notification.permission === "default"
    ) {
      Notification.requestPermission().catch(() => {
        // Ignore permission request failures.
      });
    }

    const stream = new EventSource(
      "http://localhost:8000/api/notifications/stream",
      { withCredentials: true },
    );

    stream.addEventListener("snapshot", (event) => {
      try {
        const payload = JSON.parse(event.data || "{}");
        setUnreadCount(payload.unreadCount || 0);
      } catch {
        // No-op.
      }
    });

    stream.addEventListener("notification", (event) => {
      try {
        const payload = JSON.parse(event.data || "{}");
        if (typeof payload.unreadCount === "number") {
          setUnreadCount(payload.unreadCount);
        }

        const notification = payload?.notification;
        if (
          notification &&
          typeof window !== "undefined" &&
          "Notification" in window &&
          Notification.permission === "granted" &&
          document.hidden
        ) {
          new Notification(notification.title || "LocalGigHub", {
            body: notification.body || "You have a new update",
          });
        }
      } catch {
        // No-op.
      }
    });

    return () => {
      stream.close();
    };
  }, [currentUser?._id]);

  const handleLogout = async () => {
    try {
      await newRequest.post("/auth/logout");
      localStorage.removeItem("currentUser");
      setCurrentUser(null);
      setUnreadCount(0);
      navigate("/");
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  const getDashboardLink = () => {
    if (currentUser?.role === "shop") {
      return "/shop/dashboard";
    }
    return "/student/dashboard";
  };

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 100 }}
      className="sticky top-0 z-50 glass px-6 py-4 flex justify-between items-center"
    >
      <Link to="/" className="text-2xl font-bold tracking-tighter">
        Local<span className="text-neonPurple">Gig</span>Hub
      </Link>
      <div className="flex gap-6 items-center">
        <Link
          to="/marketplace"
          className="text-sm font-medium hover:text-neonPurple transition-colors"
        >
          Marketplace
        </Link>

        {currentUser && (
          <Link
            to="/notifications"
            className="relative text-sm font-medium hover:text-neonPurple transition-colors"
            title="Notifications"
          >
            <div className="bg-surfaceElevated p-2 rounded-full">
              <Bell size={16} />
            </div>
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </Link>
        )}

        {currentUser ? (
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 text-sm font-medium hover:text-neonPurple transition-colors"
            >
              <div className="bg-surfaceElevated p-2 rounded-full">
                <User size={16} />
              </div>
              <span>{currentUser.username}</span>
              <ChevronDown
                size={16}
                className={`transition-transform ${dropdownOpen ? "rotate-180" : ""}`}
              />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 glass-card rounded-lg shadow-lg py-2 z-50">
                <Link
                  to={getDashboardLink()}
                  className="block px-4 py-2 text-sm hover:bg-white/10 transition-colors"
                  onClick={() => setDropdownOpen(false)}
                >
                  Dashboard
                </Link>
                <Link
                  to="/notifications"
                  className="block px-4 py-2 text-sm hover:bg-white/10 transition-colors"
                  onClick={() => setDropdownOpen(false)}
                >
                  Notifications {unreadCount > 0 ? `(${unreadCount})` : ""}
                </Link>
                {currentUser.role === "shop" && (
                  <Link
                    to="/shop/dashboard?post=true"
                    className="block px-4 py-2 text-sm hover:bg-white/10 transition-colors"
                    onClick={() => setDropdownOpen(false)}
                  >
                    Post a Gig
                  </Link>
                )}
                {currentUser.role === "shop" && (
                  <Link
                    to="/shop/moderation"
                    className="block px-4 py-2 text-sm hover:bg-white/10 transition-colors"
                    onClick={() => setDropdownOpen(false)}
                  >
                    Moderation Queue
                  </Link>
                )}
                <hr className="border-white/10 my-2" />
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-white/10 transition-colors flex items-center gap-2"
                >
                  <LogOut size={14} /> Logout
                </button>
              </div>
            )}
          </div>
        ) : (
          <>
            <Link
              to="/login"
              className="text-sm font-medium hover:text-white transition-colors"
            >
              Login
            </Link>
            <Link
              to="/signup"
              className="text-sm bg-neonPurple text-white px-5 py-2 rounded-full font-medium shadow-[0_0_15px_rgba(168,85,247,0.5)] hover:shadow-[0_0_25px_rgba(168,85,247,0.8)] transition-shadow"
            >
              Join Now
            </Link>
          </>
        )}
      </div>
    </motion.nav>
  );
};

export default Navbar;
