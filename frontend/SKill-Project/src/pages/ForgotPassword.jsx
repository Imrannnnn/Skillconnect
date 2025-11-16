import { useState } from "react";
import API from "../api/axios.js";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setMessage("");
    setError("");
    try {
      const { data } = await API.post("/auth/forgot-password", { email });
      setMessage(data?.message || "If an account exists for this email, a reset link has been sent.");
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to start password reset");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-md mx-auto mt-10 bg-white rounded-lg border border-gray-200 shadow-sm p-6">
      <h2 className="text-xl font-semibold mb-4">Forgot password</h2>
      <p className="text-sm text-gray-600 mb-4">
        Enter the email you used to create your account and we'll send you a password reset link.
      </p>
      <form onSubmit={handleSubmit} className="grid gap-3">
        <input
          className="px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          placeholder="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <button
          type="submit"
          disabled={submitting}
          className="mt-2 px-4 py-2 rounded-md bg-emerald-600 text-white hover:bg-emerald-700 transition-all disabled:opacity-70"
        >
          {submitting ? "Sending..." : "Send reset link"}
        </button>
      </form>
      {message && <p className="text-emerald-600 mt-3 text-sm">{message}</p>}
      {error && <p className="text-rose-500 mt-3 text-sm">{error}</p>}
    </div>
  );
}
