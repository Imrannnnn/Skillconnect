import { useCallback, useEffect, useMemo, useState } from "react";
import API from "../api/axios.js";
import { AuthContext } from "./auth.js";

export function AuthProvider({ children }) {
  const INACTIVITY_LIMIT_MS = 30 * 60 * 1000; // 30 minutes
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  });
  const [loading, setLoading] = useState(false);
  const [lastActiveAt, setLastActiveAt] = useState(() => {
    const stored = localStorage.getItem("lastActiveAt");
    return stored ? Number(stored) : 0;
  });

  useEffect(() => {
    if (token) localStorage.setItem("token", token);
    else localStorage.removeItem("token");
  }, [token]);

  useEffect(() => {
    if (user) localStorage.setItem("user", JSON.stringify(user));
    else localStorage.removeItem("user");
  }, [user]);

  useEffect(() => {
    if (lastActiveAt) localStorage.setItem("lastActiveAt", String(lastActiveAt));
    else localStorage.removeItem("lastActiveAt");
  }, [lastActiveAt]);

  const clearSession = useCallback(() => {
    setToken(null);
    setUser(null);
    setLastActiveAt(0);
  }, []);

  const logout = useCallback(() => {
    clearSession();
  }, [clearSession]);

  const login = useCallback(async (credentials) => {
    setLoading(true);
    try {
      const { data } = await API.post("/auth/login", credentials);
      setToken(data?.token);
      setUser(data?.user || null);
      setLastActiveAt(Date.now());
      return data;
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (payload) => {
    setLoading(true);
    try {
      const { data } = await API.post("/auth/register", payload);
      // Do not auto-login on register; user must verify email and then log in manually.
      return data;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!token) return undefined;

    const handleActivity = () => {
      setLastActiveAt(Date.now());
    };

    const activityEvents = [
      "mousemove",
      "mousedown",
      "keydown",
      "scroll",
      "touchstart",
      "focus",
    ];

    activityEvents.forEach((event) => window.addEventListener(event, handleActivity, { passive: true }));
    const handleVisibility = () => {
      if (!document.hidden) {
        handleActivity();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      activityEvents.forEach((event) => window.removeEventListener(event, handleActivity));
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [token]);

  useEffect(() => {
    if (!token) return undefined;

    if (!lastActiveAt) {
      setLastActiveAt(Date.now());
      return undefined;
    }

    const now = Date.now();
    const elapsed = now - lastActiveAt;
    if (elapsed >= INACTIVITY_LIMIT_MS) {
      clearSession();
      return undefined;
    }

    const timeout = setTimeout(() => {
      clearSession();
    }, INACTIVITY_LIMIT_MS - elapsed);

    return () => clearTimeout(timeout);
  }, [token, lastActiveAt, clearSession, INACTIVITY_LIMIT_MS]);

  const value = useMemo(
    () => ({ token, user, loading, login, register, logout, setUser }),
    [token, user, loading, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
