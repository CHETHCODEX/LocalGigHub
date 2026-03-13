import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { motion } from "framer-motion";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Loader2, MessageSquare, SendHorizonal } from "lucide-react";
import getCurrentUser from "../utils/getCurrentUser";
import newRequest from "../utils/newRequest";

const getApiErrorMessage = (err, fallbackMessage) => {
  const payload = err?.response?.data;
  if (typeof payload === "string" && payload.trim()) {
    return payload;
  }
  if (
    payload &&
    typeof payload?.message === "string" &&
    payload.message.trim()
  ) {
    return payload.message;
  }
  return fallbackMessage;
};

const Chat = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const currentUser = useMemo(() => getCurrentUser(), []);
  const currentUserId = currentUser?._id || null;
  const currentUserRole = currentUser?.role || null;
  const queryGigId = searchParams.get("gigId") || "";
  const queryParticipantId = searchParams.get("userId") || "";

  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const conversationsRequestIdRef = useRef(0);
  const messagesRequestIdRef = useRef(0);
  const bootstrapKeyRef = useRef("");

  const loadConversations = useCallback(
    async ({ showLoader = true, showError = true } = {}) => {
      const requestId = ++conversationsRequestIdRef.current;
      try {
        if (showLoader) {
          setLoadingConversations(true);
        }
        const response = await newRequest.get("/chat/conversations");
        setConversations(response.data || []);
        // Clear stale banner even during silent polling when fresh data arrives.
        setError(null);
        return response.data || [];
      } catch (err) {
        if (showError && requestId === conversationsRequestIdRef.current) {
          setError(getApiErrorMessage(err, "Failed to load conversations"));
        }
        return [];
      } finally {
        if (showLoader && requestId === conversationsRequestIdRef.current) {
          setLoadingConversations(false);
        }
      }
    },
    [],
  );

  const loadMessages = useCallback(
    async (conversationId, { showLoader = true, showError = true } = {}) => {
      const requestId = ++messagesRequestIdRef.current;
      try {
        if (showLoader) {
          setLoadingMessages(true);
        }
        const response = await newRequest.get(
          `/chat/conversations/${conversationId}/messages`,
        );
        setMessages(response.data || []);
        // Clear stale banner even during silent polling when fresh data arrives.
        setError(null);
      } catch (err) {
        if (showError && requestId === messagesRequestIdRef.current) {
          setError(getApiErrorMessage(err, "Failed to load messages"));
        }
      } finally {
        if (showLoader && requestId === messagesRequestIdRef.current) {
          setLoadingMessages(false);
        }
      }
    },
    [],
  );

  const ensureConversationFromQuery = useCallback(async () => {
    if (!queryGigId || !queryParticipantId) {
      return null;
    }

    try {
      const response = await newRequest.post("/chat/conversations", {
        gigId: queryGigId,
        participantId: queryParticipantId,
      });
      return response.data;
    } catch (err) {
      setError(getApiErrorMessage(err, "Unable to open chat room"));
      return null;
    }
  }, [queryGigId, queryParticipantId]);

  useEffect(() => {
    if (!currentUserId) {
      navigate("/login");
      return;
    }
    if (!["shop", "student"].includes(currentUserRole)) {
      navigate("/");
      return;
    }

    const bootstrapKey = [
      currentUserId,
      currentUserRole,
      queryGigId,
      queryParticipantId,
    ].join(":");

    if (bootstrapKeyRef.current === bootstrapKey) {
      return;
    }
    bootstrapKeyRef.current = bootstrapKey;

    const bootstrap = async () => {
      const created = await ensureConversationFromQuery();
      const list = await loadConversations();

      if (created) {
        setActiveConversation(created);
        await loadMessages(created._id);
        return;
      }

      if (list.length > 0) {
        setActiveConversation(list[0]);
        await loadMessages(list[0]._id);
      }
    };

    bootstrap();
  }, [
    currentUserId,
    currentUserRole,
    navigate,
    queryGigId,
    queryParticipantId,
    ensureConversationFromQuery,
    loadConversations,
    loadMessages,
  ]);

  useEffect(() => {
    if (!activeConversation?._id) {
      return;
    }

    const timer = setInterval(() => {
      loadMessages(activeConversation._id, {
        showLoader: false,
        showError: false,
      });
      loadConversations({ showLoader: false, showError: false });
    }, 2500);

    return () => clearInterval(timer);
  }, [activeConversation, loadMessages, loadConversations]);

  const onSend = async (event) => {
    event.preventDefault();
    if (!activeConversation?._id) {
      return;
    }

    const trimmed = text.trim();
    if (!trimmed) {
      return;
    }

    try {
      setSending(true);
      setError(null);
      await newRequest.post(
        `/chat/conversations/${activeConversation._id}/messages`,
        {
          text: trimmed,
        },
      );
      setText("");
      await loadMessages(activeConversation._id);
      await loadConversations();
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to send message"));
    } finally {
      setSending(false);
    }
  };

  const conversationTitle = useMemo(() => {
    if (!activeConversation) {
      return "Choose a conversation";
    }

    const otherUserId =
      activeConversation.shopId === currentUserId
        ? activeConversation.studentId
        : activeConversation.shopId;

    return `Gig ${activeConversation.gigId} • User ${otherUserId?.slice(-6) || "-"}`;
  }, [activeConversation, currentUserId]);

  if (!currentUser) return null;

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <MessageSquare className="text-neonBlue" size={28} /> Live Chat
          </h1>
          <p className="text-gray-400">
            Direct chat between job provider and seeker.
          </p>
        </div>
        <Link
          to={
            currentUserRole === "shop"
              ? "/shop/dashboard"
              : "/student/dashboard"
          }
          className="bg-surfaceElevated hover:bg-white/10 px-4 py-2 rounded-lg text-sm font-semibold"
        >
          Back to Dashboard
        </Link>
      </div>

      {error && (
        <div className="mb-5 rounded-xl border border-red-500/30 bg-red-500/10 text-red-300 px-4 py-3 text-sm">
          {error}
        </div>
      )}

      <div className="grid lg:grid-cols-[320px_1fr] gap-5">
        <div className="glass-card p-4 max-h-[68vh] overflow-y-auto">
          <h2 className="font-bold mb-3">Conversations</h2>
          {loadingConversations ? (
            <div className="py-8 flex justify-center">
              <Loader2 className="animate-spin text-neonBlue" size={24} />
            </div>
          ) : conversations.length === 0 ? (
            <div className="text-sm text-gray-400">No conversations yet.</div>
          ) : (
            <div className="space-y-2">
              {conversations.map((conversation) => (
                <button
                  key={conversation._id}
                  type="button"
                  onClick={() => {
                    setActiveConversation(conversation);
                    loadMessages(conversation._id);
                  }}
                  className={`w-full text-left rounded-lg px-3 py-2 border transition-colors ${
                    activeConversation?._id === conversation._id
                      ? "border-neonBlue bg-neonBlue/10"
                      : "border-white/10 bg-surfaceElevated hover:bg-white/10"
                  }`}
                >
                  <div className="font-semibold text-sm mb-1 line-clamp-1">
                    Gig {conversation.gigId}
                  </div>
                  <div className="text-xs text-gray-400 line-clamp-1">
                    {conversation.lastMessage || "No messages yet"}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="glass-card p-4 flex flex-col h-[68vh]">
          <div className="border-b border-white/10 pb-3 mb-3">
            <div className="font-bold">{conversationTitle}</div>
            {activeConversation && (
              <div className="text-xs text-gray-400 mt-1">
                Conversation ID: {activeConversation._id}
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {loadingMessages ? (
              <div className="h-full flex items-center justify-center">
                <Loader2 className="animate-spin text-neonBlue" size={24} />
              </div>
            ) : messages.length === 0 ? (
              <div className="h-full flex items-center justify-center text-gray-500 text-sm">
                Send a message to start chatting.
              </div>
            ) : (
              messages.map((message, idx) => {
                const mine = message.senderId === currentUser._id;
                return (
                  <motion.div
                    key={message._id || idx}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`max-w-[75%] rounded-xl px-4 py-3 text-sm ${
                      mine
                        ? "ml-auto bg-neonBlue/20 border border-neonBlue/40"
                        : "bg-surfaceElevated border border-white/10"
                    }`}
                  >
                    <div className="whitespace-pre-wrap leading-relaxed">
                      {message.text}
                    </div>
                    <div className="text-[10px] text-gray-400 mt-1">
                      {new Date(message.createdAt).toLocaleTimeString()}
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>

          <form onSubmit={onSend} className="mt-4 flex gap-2">
            <input
              type="text"
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder={
                activeConversation
                  ? "Type your message..."
                  : "Select a conversation first"
              }
              disabled={!activeConversation || sending}
              className="flex-1 bg-surfaceElevated border border-white/10 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-neonBlue disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={!activeConversation || sending || !text.trim()}
              className="bg-neonBlue hover:bg-neonBlue/90 disabled:opacity-50 rounded-lg px-4 py-3 font-semibold flex items-center gap-2"
            >
              {sending ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <SendHorizonal size={16} />
              )}
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Chat;
