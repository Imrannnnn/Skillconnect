import { useContext, useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../api/axios.js";
import { AuthContext } from "../context/auth.js";
import { useToast } from "../components/toast.js";

export default function AcceptInvitation() {
  const { token } = useParams();
  const { user } = useContext(AuthContext);
  const { notify } = useToast();
  const navigate = useNavigate();

  const [status, setStatus] = useState("loading"); // loading | requires_login | success | error
  const [orgName, setOrgName] = useState("");
  const [role, setRole] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setError("Invalid invitation link.");
      return;
    }
    if (!user?._id) {
      setStatus("requires_login");
      return;
    }
    accept();
  }, [token, user, accept]);

  const accept = useCallback(async () => {
    if (!user?._id) return;
    try {
      const { data } = await API.post(`/invitations/${token}/accept`);
      setOrgName(data.organization?.name || "the organization");
      setRole(data.role || "member");
      setStatus("success");
      notify("Invitation accepted! You now have access.", { type: "success" });
      setTimeout(() => {
        navigate("/dashboard/organization");
      }, 2500);
    } catch (e) {
      const msg = e?.response?.data?.message || "Failed to accept invitation.";
      setError(msg);
      setStatus("error");
      notify(msg, { type: "error" });
    }
  }, [user?._id, token, notify, navigate]);

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <p className="text-sm text-gray-600">Validating invitation…</p>
      </div>
    );
  }

  if (status === "requires_login") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-lg">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Login required</h2>
          <p className="text-sm text-gray-600 mb-4">
            You need to be logged in to accept this invitation.
          </p>
          <a
            href={`/login?redirect=${encodeURIComponent(window.location.pathname)}`}
            className="block w-full rounded-md bg-emerald-600 px-4 py-2 text-center text-sm font-medium text-white hover:bg-emerald-700"
          >
            Log in
          </a>
        </div>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-lg text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
            <svg className="h-6 w-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-1">You’re in!</h2>
          <p className="text-sm text-gray-600 mb-2">
            You are now a {role} of {orgName}.
          </p>
          <p className="text-xs text-gray-500">Redirecting to your dashboard…</p>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-lg text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-rose-100">
            <svg className="h-6 w-6 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Invitation error</h2>
          <p className="text-sm text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return null;
}
