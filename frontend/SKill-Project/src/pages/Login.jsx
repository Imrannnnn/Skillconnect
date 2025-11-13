import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/auth.js";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const auth = useContext(AuthContext);

  function handleSubmit(e) {
    e.preventDefault();
    setError("");
    auth
      .login({ email, password })
      .then(() => {
        // Navigate based on role if available
        const role = auth.user?.role;
        if (role === "provider") navigate("/provider/dashboard");
        else navigate("/dashboard");
      })
      .catch((err) => {
        setError(err?.response?.data?.message || "Login failed");
      });
  }

  return (
    <div className="max-w-md mx-auto mt-10 bg-white rounded-lg border border-gray-200 shadow-sm p-6">
      <h2 className="text-xl font-semibold mb-4">Login</h2>
      <form onSubmit={handleSubmit} className="grid gap-3">
        <input
          className="px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className="px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button type="submit" className="mt-2 px-4 py-2 rounded-md bg-emerald-600 text-white hover:bg-emerald-700 transition-all">
          Sign in
        </button>
      </form>
      {error && <p className="text-rose-500 mt-3 text-sm">{error}</p>}
    </div>
  );
}
