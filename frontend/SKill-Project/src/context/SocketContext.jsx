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
