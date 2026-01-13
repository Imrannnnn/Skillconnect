// src/context/SocketContext.jsx
import { useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { SocketContext } from "./socket.js";
import { NetBus } from "../api/axios.js";

export const SocketProvider = ({ children }) => {
  const socket = useRef();

  useEffect(() => {
    const url = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";
    socket.current = io(url);

    socket.current.on("connect", () => {
      console.log("✅ Connected to Socket.io server");
      NetBus.emit({ offline: false, at: Date.now() });
    });

    socket.current.on("disconnect", () => {
      console.log("❌ Disconnected from server");
      NetBus.emit({ offline: true, at: Date.now() });
    });

    // Global Message Listener for Notifications/Unread Counts
    socket.current.on("message", (msg) => {
      // We need the current user ID to know if we are the receiver
      // But we can't access AuthContext here easily without circular dep or moving this logic.
      // However, usually we can filter by checking if the msg is for us, or rely on the server only sending us relevant messages.
      // Assuming server sends to room 'chatId' or specific user socket.
      // If we receive it, it's likely relevant.

      // Update Unread Chat Count
      try {
        const counts = JSON.parse(localStorage.getItem('unreadCounts') || '{}');
        // If we are currently ON this chat page, the Chat component will handle clearing it/not incrementing.
        // But here we just increment. The Chat component might race to clear it if active.
        // Better: Chat component clears it on mount/receive. 
        // We blindly increment here? 
        // Logic: specific chat page listener updates messages. 
        // Global listener updates count? 
        // If both run, we might get double update or conflict.

        // Simple approach: Always increment here. If user is reading, Chat.jsx's useEffect triggers and clears it immediately.
        // We need the chatId.
        if (msg && msg.chatId) {
          // We really need to know if WE sent it. If we sent it, don't increment unread.
          // msg.sender usually has ID. We need self ID.
          // We can get self ID from localStorage 'user' if stored, or just ignore for now and assume server only sends "new message" events to RECEIVER outside of chat room?
          // Actually socket.io broadcasts to room. Both sender and receiver get it.
          // We need to check sender != self.

          const storedUser = localStorage.getItem('user'); // Basic auth persistence often has this
          let selfId = null;
          if (storedUser) {
            try { selfId = JSON.parse(storedUser)._id; } catch { /* ignore */ }
          }

          if (selfId && String(msg.sender) !== String(selfId)) {
            counts[msg.chatId] = (counts[msg.chatId] || 0) + 1;
            localStorage.setItem('unreadCounts', JSON.stringify(counts));
            // Emit updates for both Chats (bubble) and Notifications (bell)
            // The backend now creates a notification record for messages, so we should trigger a refresh.
            NetBus.emit({ chatsUpdated: true, notificationsUpdated: true });

            // Also, if user wants "Notification Icon" to show 1, we might need to emit a notification event?
            // The user said "notification icon should show one". This usually refers to the Bell.
            // But let's start with fixing the Chat Bubble first.
          }
        }
      } catch (e) {
        console.error("Error updating unread counts", e);
      }
    });

    return () => {
      socket.current.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider value={socket.current}>
      {children}
    </SocketContext.Provider>
  );
};
