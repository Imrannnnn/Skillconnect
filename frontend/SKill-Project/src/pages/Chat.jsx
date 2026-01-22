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
  const fileInputRef = useRef(null);
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
  const [attachments, setAttachments] = useState([]);
  const [uploading, setUploading] = useState(false);

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

          // Mark as read immediately
          markAsRead();
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

  const markAsRead = async () => {
    try {
      await API.put(`/chats/${chatId}/read`);
      // Clear local unread
      setUnread((prev) => {
        const next = { ...prev, [chatId]: 0 };
        localStorage.setItem("unreadCounts", JSON.stringify(next));
        NetBus.emit({ chatsUpdated: true, at: Date.now() });
        return next;
      });
    } catch (e) {
      console.error("Failed to mark as read", e);
    }
  };

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

  // Join room and subscribe to socket events
  useEffect(() => {
    if (!socket || !chatId) return;

    socket.emit?.("joinRoom", { chatId });

    const handleMessage = (msg) => {
      if (msg?.chatId === chatId) {
        const selfId = auth?.user?._id;
        const nm = { ...msg, text: msg.text ?? msg.content ?? "", self: String(msg.sender) === String(selfId) };
        setMessages((prev) => [...prev, nm]);

        // Mark as read if we are viewing this chat
        if (String(msg.sender) !== String(selfId)) {
          markAsRead();
        }

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
    const nearBottom = distanceFromBottom < 80;

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

  const handleFileSelect = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const newAttachments = [...attachments];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const formData = new FormData();
      formData.append("image", file);

      try {
        const { data } = await API.post("/uploads/content-image", formData, {
          headers: { "Content-Type": "multipart/form-data" }
        });
        newAttachments.push({
          url: data.url,
          type: file.type.startsWith("image/") ? "image" : "file",
          name: file.name
        });
      } catch (error) {
        console.error("Upload failed", error);
        notify(`Failed to upload ${file.name}`, { type: "error" });
      }
    }

    setAttachments(newAttachments);
    setUploading(false);
    // Clear input
    e.target.value = "";
  };

  const removeAttachment = (index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  async function sendMessage() {
    const text = input.trim();
    if (!text && attachments.length === 0) return;

    // optimistic
    const optimistic = {
      _id: `tmp-${Date.now()}`,
      chatId,
      text,
      attachments,
      self: true,
      createdAt: new Date().toISOString()
    };
    setMessages((prev) => [...prev, optimistic]);
    setInput("");
    setAttachments([]);

    // socket first
    socket?.emit?.("message", { chatId, text, attachments });

    // REST fallback (and to persist)
    try {
      const { data } = await API.post(`/chats/${chatId}/messages`, { text, attachments });
      if (data) {
        const normalized = {
          ...data,
          text: data.text ?? data.content ?? text,
          attachments: data.attachments || attachments,
          self: true
        };
        setMessages((prev) => prev.map((m) => (m._id === optimistic._id ? normalized : m)));
      }
    } catch {
      notify("Failed to send message", { type: "error" });
    }
  }

  function onInputChange(e) {
    setInput(e.target.value);
    socket?.emit?.("typing", { chatId, userId: auth?.user?._id, name: auth?.user?.name || auth?.user?.email });
    if (onInputChange._t) clearTimeout(onInputChange._t);
    onInputChange._t = setTimeout(() => socket?.emit?.("stopTyping", { chatId, userId: auth?.user?._id }), 1000);
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 flex justify-center h-[calc(100vh-64px)]">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 w-full h-full">
        {/* Left: Chat List (Modern SaaS Style) */}
        <aside className="hidden lg:flex lg:col-span-1 flex-col rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-50 bg-gray-50/50">
            <h3 className="font-bold text-lg text-gray-800">Messages</h3>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {chatsLoading && (
              <div className="space-y-2 p-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex gap-3 animate-pulse">
                    <div className="h-10 w-10 bg-gray-100 rounded-full"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-3 w-2/3 bg-gray-100 rounded"></div>
                      <div className="h-2 w-1/2 bg-gray-100 rounded"></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {!chatsLoading && chats.length === 0 && (
              <div className="text-center py-10 text-gray-400 text-sm">No chats yet</div>
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
                  className={`w-full text-left p-3 rounded-xl transition-all duration-200 group ${active ? 'bg-emerald-50 shadow-sm' : 'hover:bg-gray-50'
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold shadow-sm ${active ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
                        {other?.avatarUrl ? <img src={getImageUrl(other.avatarUrl)} className="h-full w-full object-cover rounded-full" /> : (other?.name?.[0] || 'C').toUpperCase()}
                      </div>
                      {active && <div className="absolute bottom-0 right-0 h-3 w-3 bg-green-400 border-2 border-white rounded-full"></div>}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex justify-between items-center mb-0.5">
                        <span className={`text-sm font-bold truncate ${active ? 'text-gray-900' : 'text-gray-700'}`}>{title}</span>
                        {/* Time could go here */}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className={`text-xs truncate max-w-[120px] ${active ? 'text-emerald-700 font-medium' : 'text-gray-500'}`}>
                          {c?.lastMessage?.text || (c?.lastMessage?.attachments?.length ? '📎 Attachment' : 'No messages')}
                        </span>
                        {unreadCount > 0 && (
                          <span className="h-5 min-w-[20px] px-1.5 flex items-center justify-center rounded-full bg-emerald-500 text-white text-[10px] font-bold shadow-sm shadow-emerald-200">
                            {unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        {/* Right: Chat Area */}
        <section className="col-span-1 lg:col-span-3 rounded-2xl border border-gray-100 bg-white shadow-xl shadow-gray-100/50 flex flex-col overflow-hidden relative">
          {/* Header */}
          <div className="h-16 border-b border-gray-100 flex items-center justify-between px-6 bg-white/80 backdrop-blur z-10">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 p-0.5">
                <div className="h-full w-full bg-white rounded-full overflow-hidden flex items-center justify-center">
                  {otherUser?.avatarUrl ? (
                    <img src={getImageUrl(otherUser.avatarUrl)} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span className="font-bold text-gray-700 text-sm">{(otherUser?.name?.[0] || 'U').toUpperCase()}</span>
                  )}
                </div>
              </div>
              <div>
                <h2 className="font-bold text-gray-900 leading-tight">{otherUser?.name || 'Chat'}</h2>
                <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Online
                </p>
              </div>
            </div>
            {chatId && (
              <button
                type="button"
                onClick={deleteCurrentChat}
                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                title="Delete conversation"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </button>
            )}
          </div>

          {/* Messages */}
          <div
            ref={messagesContainerRef}
            className="flex-1 overflow-y-auto p-6 bg-gray-50 space-y-6"
            onScroll={(e) => {
              const el = e.currentTarget;
              const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
              setAutoScroll(nearBottom);
            }}
          >
            {loading && (
              <div className="flex flex-col items-center justify-center h-full opacity-50">
                <div className="loader"></div>
              </div>
            )}
            {!loading && messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 space-y-2">
                <div className="text-4xl">👋</div>
                <p className="font-medium">Start the conversation!</p>
              </div>
            )}
            {messages.map((m) => (
              <MessageBubble key={m._id} message={m} />
            ))}
            {typingUser && (
              <div className="flex items-center gap-2 text-xs font-bold text-gray-400 ml-4 animate-pulse">
                <span>{typingUser} is typing</span>
                <span className="flex gap-1">
                  <span className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></span>
                  <span className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></span>
                  <span className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                </span>
              </div>
            )}
            <div ref={endRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 bg-white border-t border-gray-100">
            {/* Attachment Previews */}
            {attachments.length > 0 && (
              <div className="flex gap-2 mb-3 overflow-x-auto pb-2">
                {attachments.map((file, i) => (
                  <div key={i} className="relative h-16 w-16 bg-gray-100 rounded-lg border border-gray-200 flex-shrink-0 flex items-center justify-center overflow-hidden group">
                    {file.type === 'image' ? (
                      <img src={getImageUrl(file.url)} className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-xs text-gray-500 font-bold uppercase">{file.name.split('.').pop()}</span>
                    )}
                    <button
                      onClick={() => removeAttachment(i)}
                      className="absolute inset-0 bg-black/40 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-end gap-3 bg-gray-50 p-2 rounded-[1.5rem] border border-gray-200 focus-within:ring-2 focus-within:ring-emerald-100 focus-within:border-emerald-300 transition-all shadow-inner">
              <input
                type="file"
                multiple
                className="hidden"
                ref={fileInputRef}
                onChange={handleFileSelect}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className={`h-10 w-10 flex-shrink-0 flex items-center justify-center rounded-full text-gray-400 hover:bg-gray-200 hover:text-gray-600 transition-colors ${uploading ? 'animate-pulse' : ''}`}
                disabled={uploading}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
              </button>

              <textarea
                className="flex-1 bg-transparent border-none focus:ring-0 resize-none py-2.5 max-h-32 text-gray-800 placeholder-gray-400 font-medium"
                rows={1}
                placeholder="Write a message..."
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
                disabled={(!input.trim() && attachments.length === 0) || uploading}
                className="h-10 w-10 flex-shrink-0 flex items-center justify-center rounded-full bg-emerald-600 text-white shadow-lg shadow-emerald-200 hover:scale-105 hover:bg-emerald-700 transition-all disabled:opacity-50 disabled:shadow-none disabled:bg-gray-300"
              >
                <svg className="w-4 h-4 translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
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
    <div className={`flex ${isSelf ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[75%] space-y-1`}>
        <div className={`rounded-2xl p-4 shadow-sm ${isSelf
            ? "bg-emerald-600 text-white rounded-br-xs"
            : "bg-white text-gray-800 border border-gray-100 rounded-bl-xs"
          }`}>
          {/* Attachments */}
          {message.attachments && message.attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {message.attachments.map((att, i) => (
                <div key={i} className="rounded-lg overflow-hidden border border-white/20">
                  {att.type === 'image' || att.url?.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                    <a href={getImageUrl(att.url)} target="_blank" rel="noopener noreferrer">
                      <img src={getImageUrl(att.url)} className="max-w-[200px] max-h-[200px] object-cover" />
                    </a>
                  ) : (
                    <a href={getImageUrl(att.url)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-3 bg-black/10 hover:bg-black/20 transition rounded">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                      <span className="text-xs font-bold underline truncate max-w-[150px]">{att.name || "Download File"}</span>
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}

          {message.text && <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.text}</p>}

          <div className={`mt-1 flex items-center justify-end gap-1.5 opacity-70 text-[10px] font-bold ${isSelf ? "text-emerald-100" : "text-gray-400"}`}>
            <span>{new Date(message.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            {isSelf && (
              <span>
                {message.isRead ? (
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7m-10.5 4L5 13m0 0l4 4m6-10l-4.5 9" /></svg> // Double check kinda
                ) : (
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                )}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
