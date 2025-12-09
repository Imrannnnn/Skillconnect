import { useContext, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import API from "../api/axios.js";
import { SocketContext } from "../context/socket.js";
import { useToast } from "../components/toast.js";
import { AuthContext } from "../context/auth.js";
import { NetBus } from "../api/axios.js";
import { getImageUrl } from "../utils/image.js";

export default function Chat() {
  const { chatId } = useParams();
  const navigate = useNavigate();
  const socket = useContext(SocketContext);
  const auth = useContext(AuthContext);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [typingUser, setTypingUser] = useState(null);
  const endRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const [chats, setChats] = useState([]);
  const [chatsLoading, setChatsLoading] = useState(true);
  const { notify } = useToast();
  const [unread, setUnread] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("unreadCounts") || "{}");
    } catch {
      return {};
    }
  });
  const [otherUser, setOtherUser] = useState(null);

  // Fetch chat list
  useEffect(() => {
    let mounted = true;
    async function fetchChats() {
      setChatsLoading(true);
      try {
        const { data } = await API.get("/chats");
        if (mounted) {
          const raw = Array.isArray(data?.chats) ? data.chats : Array.isArray(data) ? data : [];
          const normalized = raw.map((c) => ({
            ...c,
            lastMessage: c?.lastMessage
              ? { ...c.lastMessage, text: c.lastMessage.text ?? c.lastMessage.content ?? "" }
              : c?.lastMessage,
          }));
          setChats(normalized);
        }
      } catch {
        if (mounted) setChats([]);
      } finally {
        if (mounted) setChatsLoading(false);
      }
    }
    fetchChats();
    return () => {
      mounted = false;
    };
  }, [auth?.user?._id]);

  // Fetch history on mount/chatId change
  useEffect(() => {
    let mounted = true;
    async function fetchHistory() {
      setLoading(true);
      try {
        const { data } = await API.get(`/chats/${chatId}`);
        if (mounted) {
          const selfId = auth?.user?._id;
          const list = Array.isArray(data?.messages) ? data.messages : [];
          const normalized = list.map((m) => ({
            ...m,
            text: m.text ?? m.content ?? "",
            self: String(m.sender) === String(selfId),
          }));
          setMessages(normalized);
        }
      } catch {
        if (mounted) setMessages([]);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    if (chatId) fetchHistory();
    return () => {
      mounted = false;
    };
  }, [chatId, auth?.user?._id]);

  // Fetch other participant details for header
  useEffect(() => {
    async function loadOther() {
      if (!chatId || !auth?.user?._id) return setOtherUser(null);
      const [a, b] = String(chatId).split("_");
      const selfId = String(auth.user._id);
      const otherId = selfId === String(a) ? b : a;
      if (!otherId) return setOtherUser(null);
      try {
        const { data } = await API.get(`/users/${otherId}`);
        setOtherUser(data || null);
      } catch {
        setOtherUser(null);
      }
    }
    loadOther();
  }, [chatId, auth?.user?._id]);

  // Reset unread count when entering a chat
  useEffect(() => {
    if (!chatId) return;
    setUnread((prev) => {
      const next = { ...prev, [chatId]: 0 };
      localStorage.setItem("unreadCounts", JSON.stringify(next));
      NetBus.emit({ chatsUpdated: true, at: Date.now() });
      return next;
    });
  }, [chatId]);

  // Join room and subscribe to socket events
  useEffect(() => {
    if (!socket || !chatId) return;

    socket.emit?.("joinRoom", { chatId });

    const handleMessage = (msg) => {
      if (msg?.chatId === chatId) {
        const selfId = auth?.user?._id;
        const nm = { ...msg, text: msg.text ?? msg.content ?? "", self: String(msg.sender) === String(selfId) };
        setMessages((prev) => [...prev, nm]);
      } else {
        // increment unread for other chats if message is from someone else
        const selfId = auth?.user?._id;
        const fromOther = String(msg?.sender) !== String(selfId);
        if (msg?.chatId && fromOther) {
          setUnread((prev) => {
            const next = { ...prev, [msg.chatId]: (prev[msg.chatId] || 0) + 1 };
            localStorage.setItem("unreadCounts", JSON.stringify(next));
            NetBus.emit({ chatsUpdated: true, at: Date.now() });
            return next;
          });
        }
      }
    };
    const handleTyping = ({ userId, name }) => setTypingUser(name || userId || "Someone");
    const handleStopTyping = () => setTypingUser(null);

    socket.on?.("message", handleMessage);
    socket.on?.("typing", handleTyping);
    socket.on?.("stopTyping", handleStopTyping);

    return () => {
      socket.off?.("message", handleMessage);
      socket.off?.("typing", handleTyping);
      socket.off?.("stopTyping", handleStopTyping);
      socket.emit?.("leaveRoom", { chatId });
    };
  }, [socket, chatId, auth?.user?._id]);

  // Auto scroll to bottom when enabled and user is near bottom
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container || !autoScroll) return;

    const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
    const nearBottom = distanceFromBottom < 80; // px threshold

    if (nearBottom) {
      endRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, typingUser, autoScroll]);

  async function deleteCurrentChat() {
    if (!chatId) return;
    const ok = window.confirm("Delete this conversation for you? This will hide the chat on your side but not for the other user.");
    if (!ok) return;
    try {
      await API.delete(`/chats/${chatId}`);
      // Clear unread count for this chat
      setUnread((prev) => {
        const next = { ...prev };
        delete next[chatId];
        localStorage.setItem("unreadCounts", JSON.stringify(next));
        NetBus.emit({ chatsUpdated: true, at: Date.now() });
        return next;
      });
      notify("Chat deleted", { type: "success" });
      navigate("/chats");
    } catch (e) {
      notify(e?.response?.data?.message || "Failed to delete chat", { type: "error" });
    }
  }

  async function sendMessage() {
    const text = input.trim();
    if (!text) return;

    // optimistic
    const optimistic = { _id: `tmp-${Date.now()}`, chatId, text, self: true, createdAt: new Date().toISOString() };
    setMessages((prev) => [...prev, optimistic]);
    setInput("");

    // socket first
    socket?.emit?.("message", { chatId, text });

    // REST fallback (and to persist)
    try {
      const { data } = await API.post(`/chats/${chatId}/messages`, { text });
      if (data) {
        const normalized = { ...data, text: data.text ?? data.content ?? text, self: true };
        setMessages((prev) => prev.map((m) => (m._id === optimistic._id ? normalized : m)));
      }
    } catch {
      // keep optimistic; optionally mark failed state
      notify("Failed to send message", { type: "error" });
    }
  }

  function onInputChange(e) {
    setInput(e.target.value);
    socket?.emit?.("typing", { chatId, userId: auth?.user?._id, name: auth?.user?.name || auth?.user?.email });
    // throttle stopTyping
    if (onInputChange._t) clearTimeout(onInputChange._t);
    onInputChange._t = setTimeout(() => socket?.emit?.("stopTyping", { chatId, userId: auth?.user?._id }), 1000);
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 flex justify-center">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 w-full lg:max-w-5xl">
        {/* Left: chat list placeholder */}
        <aside className="hidden lg:block lg:col-span-1 rounded-lg border border-gray-200 bg-white p-4 h-[70vh]">
          <h3 className="font-semibold mb-3">Chats</h3>
          <div className="space-y-2 overflow-y-auto h-[calc(70vh-3rem)] pr-1">
            {chatsLoading && (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="animate-pulse w-full px-3 py-2 rounded-md border border-gray-200">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-full bg-gray-200" />
                      <div className="flex-1 min-w-0">
                        <div className="h-3 bg-gray-200 rounded w-2/3 mb-1" />
                        <div className="h-2 bg-gray-100 rounded w-1/2" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {!chatsLoading && chats.length === 0 && (
              <p className="text-sm text-gray-500">No conversations yet.</p>
            )}
            {chats.map((c) => {
              const id = c?._id || c?.chatId;
              const participants = Array.isArray(c?.participants) ? c.participants : [];
              const selfId = auth?.user?._id;
              const other = participants.find?.((p) => p?._id && p._id !== selfId) || participants[0] || {};
              const title = c?.title || other?.name || participants.map?.((p) => p?.name)?.join(", ") || id;
              const active = id === chatId;
              const unreadCount = unread?.[id] || 0;
              return (
                <button
                  key={id}
                  onClick={() => navigate(`/chat/${id}`)}
                  className={`w-full text-left px-3 py-2 rounded-md border ${active ? 'border-emerald-600 bg-emerald-50 text-emerald-700' : 'border-gray-200 hover:bg-gray-50 text-gray-700'} transition`}
                >
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 text-xs font-semibold">
                      {(other?.name?.[0] || 'C').toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">{title}</div>
                      {c?.lastMessage?.text && (
                        <div className="text-xs text-gray-500 truncate">{c.lastMessage.text}</div>
                      )}
                    </div>
                    <div className="ml-auto flex items-center gap-2">
                      {unreadCount > 0 && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-600 text-white">{unreadCount}</span>
                      )}
                      {other?.role && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">
                          {other.role}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        {/* Right: chat window */}
        <section className="lg:col-span-2 rounded-lg border border-gray-200 bg-white flex flex-col h-[70vh]">
          <div className="border-b border-gray-200 p-3">
            <div className="flex items-center gap-2 justify-between">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full overflow-hidden bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-semibold">
                  {otherUser?.avatarUrl ? (
                    <img src={getImageUrl(otherUser.avatarUrl)} alt="avatar" className="h-full w-full object-cover" />
                  ) : (
                    (otherUser?.name?.[0] || otherUser?.email?.[0] || 'U')?.toUpperCase?.()
                  )}
                </div>
                <h2 className="font-semibold">{otherUser?.name || otherUser?.email || 'Chat'}</h2>
              </div>
              {chatId && (
                <button
                  type="button"
                  onClick={deleteCurrentChat}
                  className="text-xs px-2 py-1 rounded-md border border-rose-200 text-rose-600 hover:bg-rose-50"
                >
                  Delete chat
                </button>
              )}
            </div>
            {auth?.user && (
              <p className="mt-1 text-xs text-gray-600">
                <span className="font-semibold text-gray-800">You are logged in as</span>{" "}
                <span className="font-semibold text-gray-900">{auth.user.name || auth.user.email}</span>
              </p>
            )}
          </div>
          <div
            ref={messagesContainerRef}
            className="flex-1 overflow-y-auto p-3 bg-gray-50"
            onScroll={(e) => {
              const el = e.currentTarget;
              const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
              const nearBottom = distanceFromBottom < 40; // tighter threshold for re-enabling
              setAutoScroll(nearBottom);
            }}
          >
            {loading && (
              <div className="space-y-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className={`max-w-[75%] ${i % 2 ? 'ml-auto' : 'mr-auto'}`}>
                    <div className={`rounded-2xl px-3 py-2 shadow-sm animate-pulse ${i % 2 ? 'bg-emerald-100' : 'bg-white border border-gray-200'}`}>
                      <div className="h-3 bg-gray-200 rounded w-32" />
                    </div>
                  </div>
                ))}
              </div>
            )}
            {!loading && messages.length === 0 && (
              <p className="text-sm text-gray-500">No messages yet. Say hello!</p>
            )}
            <div className="space-y-2">
              {messages.map((m) => (
                <MessageBubble key={m._id} message={m} />
              ))}
              {typingUser && <p className="text-xs text-gray-500">{typingUser} is typing…</p>}
              <div ref={endRef} />
            </div>
          </div>
          <div className="p-3 border-t border-gray-200">
            <div className="flex gap-2">
              <input
                className="flex-1 px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="Type a message"
                value={input}
                onChange={onInputChange}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
              />
              <button
                onClick={sendMessage}
                className="px-4 py-2 rounded-md bg-emerald-600 text-white hover:bg-emerald-700 transition-all"
              >
                Send
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function MessageBubble({ message }) {
  const isSelf = message.self || message.isSelf;
  return (
    <div className={`max-w-[75%] ${isSelf ? "ml-auto" : "mr-auto"}`}>
      <div
        className={`${isSelf ? "bg-emerald-600 text-white" : "bg-white text-gray-800 border border-gray-200"
          } rounded-2xl px-3 py-2 shadow-sm`}
      >
        <p className="text-sm whitespace-pre-wrap">{message.text}</p>
        <p className={`mt-1 text-[10px] ${isSelf ? "text-emerald-100" : "text-gray-500"}`}>
          {new Date(message.createdAt || Date.now()).toLocaleTimeString()}
        </p>
      </div>
    </div>
  );
}
