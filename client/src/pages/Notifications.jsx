import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Bell, CheckCheck, Loader2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import getCurrentUser from "../utils/getCurrentUser";
import newRequest from "../utils/newRequest";

const Notifications = () => {
  const navigate = useNavigate();
  const currentUser = useMemo(() => getCurrentUser(), []);

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [error, setError] = useState("");

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const response = await newRequest.get("/notifications?limit=50");
      setItems(response.data?.items || []);
      setUnreadCount(response.data?.unreadCount || 0);
      setError("");
    } catch (err) {
      setError(err?.response?.data || "Failed to load notifications");
    } finally {
      setLoading(false);
    }
  }, []);

  const markRead = async (id) => {
    try {
      const response = await newRequest.patch(`/notifications/${id}/read`);
      const nextUnread = response.data?.unreadCount ?? unreadCount;
      setUnreadCount(nextUnread);
      setItems((prev) =>
        prev.map((item) =>
          item._id === id ? { ...item, isRead: true } : item,
        ),
      );
    } catch {
      // Keep UI responsive even if mark-read fails.
    }
  };

  const markAllRead = async () => {
    try {
      await newRequest.patch("/notifications/read-all");
      setUnreadCount(0);
      setItems((prev) => prev.map((item) => ({ ...item, isRead: true })));
    } catch {
      // No-op.
    }
  };

  useEffect(() => {
    if (!currentUser) {
      navigate("/login");
      return;
    }

    fetchNotifications();

    const stream = new EventSource(
      "http://localhost:8000/api/notifications/stream",
      { withCredentials: true },
    );

    stream.addEventListener("snapshot", (event) => {
      try {
        const payload = JSON.parse(event.data || "{}");
        setUnreadCount(payload.unreadCount || 0);
      } catch {
        // Ignore parse errors from malformed payloads.
      }
    });

    stream.addEventListener("notification", (event) => {
      try {
        const payload = JSON.parse(event.data || "{}");
        if (payload.notification) {
          setItems((prev) => [payload.notification, ...prev]);
        }
        if (typeof payload.unreadCount === "number") {
          setUnreadCount(payload.unreadCount);
        }
      } catch {
        // Ignore parse errors from malformed payloads.
      }
    });

    return () => {
      stream.close();
    };
  }, [currentUser, navigate, fetchNotifications]);

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Bell className="text-neonBlue" size={26} /> Notifications
          </h1>
          <p className="text-gray-400 mt-1">
            Real-time alerts for applications, messages, status updates, and
            moderation.
          </p>
        </div>
        <button
          type="button"
          onClick={markAllRead}
          className="bg-surfaceElevated hover:bg-white/10 rounded-lg px-4 py-2 text-sm font-semibold flex items-center gap-2"
          disabled={unreadCount === 0}
        >
          <CheckCheck size={16} /> Mark all read
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-300 px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="py-16 flex justify-center">
          <Loader2 className="animate-spin text-neonBlue" size={28} />
        </div>
      ) : items.length === 0 ? (
        <div className="glass-card p-8 text-gray-400 text-center">
          No notifications yet.
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item._id}
              className={`glass-card p-4 border ${
                item.isRead ? "border-white/10" : "border-neonBlue/40"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-semibold">{item.title}</div>
                  {item.body && (
                    <p className="text-sm text-gray-300 mt-1">{item.body}</p>
                  )}
                  <div className="text-xs text-gray-500 mt-2">
                    {new Date(item.createdAt).toLocaleString()}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {item.link && (
                    <Link
                      to={item.link}
                      onClick={() => markRead(item._id)}
                      className="text-xs font-semibold px-3 py-1.5 rounded-md bg-neonBlue/15 text-neonBlue hover:bg-neonBlue/25"
                    >
                      Open
                    </Link>
                  )}
                  {!item.isRead && (
                    <button
                      type="button"
                      onClick={() => markRead(item._id)}
                      className="text-xs font-semibold px-3 py-1.5 rounded-md bg-white/10 hover:bg-white/20"
                    >
                      Mark read
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Notifications;
