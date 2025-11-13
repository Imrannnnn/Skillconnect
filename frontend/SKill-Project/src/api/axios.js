import axios from "axios";

// Simple event bus for offline banner
export const NetBus = {
  listeners: new Set(),
  emit(status) { this.listeners.forEach((fn) => fn(status)); },
  subscribe(fn) { this.listeners.add(fn); return () => this.listeners.delete(fn); },
};

const API = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || "http://localhost:5000/api/v1",
});

// Attach Authorization header if token exists
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

API.interceptors.response.use(
  (res) => res,
  (err) => {
    const isNetwork = err?.code === 'ERR_NETWORK' || !err?.response;
    if (isNetwork) {
      NetBus.emit({ offline: true, at: Date.now() });
    }
    console.error("API error:", err?.response?.status, err?.response?.data || err.message);
    throw err;
  }
);

export default API;
