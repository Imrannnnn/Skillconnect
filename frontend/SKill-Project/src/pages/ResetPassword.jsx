import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import API from "../api/axios.js";

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    if (!password || password.length < 6) {
      setError("Password should be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setSubmitting(true);
    setMessage("");
    setError("");
    try {
      const { data } = await API.post("/auth/reset-password", { token, password });
      setMessage(data?.message || "Password has been reset.");
      setTimeout(() => navigate("/login?reset=1"), 1500);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to reset password");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-md mx-auto mt-10 bg-white rounded-lg border border-gray-200 shadow-sm p-6">
      <h2 className="text-xl font-semibold mb-4">Set a new password</h2>
      <form onSubmit={handleSubmit} className="grid gap-3">
        <input
          className="px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          placeholder="New password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <input
          className="px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          placeholder="Confirm password"
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
        />
        <p className="text-[11px] text-gray-500">
          Use at least 6 characters. For a stronger password, combine letters, numbers and symbols.
        </p>
        <button
          type="submit"
          disabled={submitting}
          className="mt-2 px-4 py-2 rounded-md bg-emerald-600 text-white hover:bg-emerald-700 transition-all disabled:opacity-70"
        >
          {submitting ? "Updating..." : "Update password"}
        </button>
      </form>
      {message && <p className="text-emerald-600 mt-3 text-sm">{message}</p>}
      {error && <p className="text-rose-500 mt-3 text-sm">{error}</p>}
    </div>
  );
}
