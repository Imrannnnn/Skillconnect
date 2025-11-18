import { useContext, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import API from "../api/axios.js";
import { AuthContext } from "../context/auth.js";

export default function VerifyEmail() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState("verifying");
  const [message, setMessage] = useState("");
  const auth = useContext(AuthContext);

  useEffect(() => {
    async function run() {
      if (!token) {
        setStatus("error");
        setMessage("Verification token is missing.");
        return;
      }
      try {
        const { data } = await API.get(`/auth/verify/${token}`);
        setStatus("success");
        setMessage(data?.message || "Email verified successfully.");

        // If a user is present in AuthContext, update verification flags locally
        if (auth?.setUser) {
          auth.setUser((prev) =>
            prev
              ? {
                  ...prev,
                  verified: true,
                  verification: {
                    ...(prev.verification || {}),
                    emailVerified: true,
                  },
                }
              : prev
          );
        }

        setTimeout(() => navigate("/login"), 1500);
      } catch (err) {
        setStatus("error");
        setMessage(err?.response?.data?.message || "Verification link is invalid or has expired.");
      }
    }
    run();
  }, [token, navigate, auth]);

  return (
    <div className="max-w-md mx-auto mt-10 bg-white rounded-lg border border-gray-200 shadow-sm p-6">
      <h2 className="text-xl font-semibold mb-3">Verify your email</h2>
      {status === "verifying" && (
        <p className="text-sm text-gray-600">Verifying your email, please wait…</p>
      )}
      {status !== "verifying" && (
        <p className={`text-sm ${status === "success" ? "text-emerald-700" : "text-rose-600"}`}>
          {message}
        </p>
      )}
    </div>
  );
}
