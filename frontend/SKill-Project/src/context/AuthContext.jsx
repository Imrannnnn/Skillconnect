import { useEffect, useMemo, useState } from "react";
import API from "../api/axios.js";
import { AuthContext } from "./auth.js";

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (token) localStorage.setItem("token", token);
    else localStorage.removeItem("token");
  }, [token]);

  useEffect(() => {
    if (user) localStorage.setItem("user", JSON.stringify(user));
    else localStorage.removeItem("user");
  }, [user]);

  async function login(credentials) {
    setLoading(true);
    try {
      const { data } = await API.post("/auth/login", credentials);
      setToken(data?.token);
      setUser(data?.user || null);
      return data;
    } finally {
      setLoading(false);
    }
  }

  async function register(payload) {
    setLoading(true);
    try {
      const { data } = await API.post("/auth/register", payload);
      // Some backends return token on register, others require login. Handle both.
      if (data?.token) setToken(data.token);
      if (data?.user) setUser(data.user);
      return data;
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    setToken(null);
    setUser(null);
  }

  const value = useMemo(
    () => ({ token, user, loading, login, register, logout, setUser }),
    [token, user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
