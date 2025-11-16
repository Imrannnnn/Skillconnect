import { Link, useNavigate } from "react-router-dom";
import { useContext, useState } from "react";
import API from "../api/axios.js";
import { AuthContext } from "../context/auth.js";
import { useToast } from "./toast.js";

export default function ProviderCard({ provider, distanceKm }) {
  const navigate = useNavigate();
  const auth = useContext(AuthContext);
  const { notify } = useToast();
  const [chatLoading, setChatLoading] = useState(false);

  async function startChat() {
    if (!auth?.token) {
      navigate("/login");
      return;
    }
    try {
      setChatLoading(true);
      const { data } = await API.post("/chats", { toUserId: provider?._id });
      const chatId = data?.chatId || data?._id || data?.chat?._id;
      if (chatId) navigate(`/chat/${chatId}`);
      else notify("Unable to start chat", { type: "error" });
    } catch (e) {
      notify(e?.response?.data?.message || "Failed to start chat", { type: "error" });
    } finally {
      setChatLoading(false);
    }
  }

  const jobsDone =
    typeof provider?.jobsDone === "number"
      ? provider.jobsDone
      : typeof provider?.completedJobs === "number"
      ? provider.completedJobs
      : typeof provider?.jobsCompleted === "number"
      ? provider.jobsCompleted
      : undefined;

  const verification = provider?.verification || {};
  const emailVerified = !!(verification.emailVerified || provider?.verified);
  const phoneVerified = !!verification.phoneVerified;
  const idVerified = !!verification.idVerified;
  const trustedProvider = !!verification.trustedProvider;
  const topPerformer = Array.isArray(verification.topPerformerMonths) && verification.topPerformerMonths.length > 0;

  return (
    <div className="relative h-full flex flex-col">
      <div
        className="relative w-full cursor-pointer text-slate-900
                   flex flex-col justify-between rounded-xl bg-transparent
                   before:content-[''] before:absolute before:inset-0
                   before:m-auto before:w-full before:h-full before:rounded-[14px]
                   before:bg-gradient-to-br before:from-emerald-500
                   before:via-emerald-500 before:to-cyan-500 before:-z-10
                   before:pointer-events-none before:transition-transform
                   before:duration-500 before:ease-[cubic-bezier(0.175,0.885,0.32,1.275)]
                   hover:before:scale-105"
      >
        <div className="relative h-full rounded-lg border border-gray-200 bg-white p-4 shadow-sm flex flex-col">
          <div className="flex items-start gap-3">
            <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-semibold">
              {provider?.name?.[0]?.toUpperCase() || "P"}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-gray-800 truncate" title={provider?.name || ''}>{provider?.name}</h3>
              <p className="text-sm text-gray-500 truncate" title={Array.isArray(provider?.categories) ? provider.categories.join(", ") : (provider?.category || '')}>
                {Array.isArray(provider?.categories) ? provider.categories.join(", ") : provider?.category}
              </p>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                {typeof provider?.ratingAvg === 'number' && provider?.ratingCount > 0 && (
                  <span className="inline-flex items-center gap-1 text-amber-600">
                    <span>★ {provider.ratingAvg}</span>
                    <span className="text-gray-500">({provider.ratingCount})</span>
                  </span>
                )}
                {typeof jobsDone === 'number' && jobsDone > 0 && (
                  <span className="inline-flex items-center gap-1 text-gray-600">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    <span>{jobsDone} jobs done</span>
                  </span>
                )}
                {(emailVerified || phoneVerified) && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] text-emerald-700 border border-emerald-100">
                    <span>✔</span>
                    <span>Verified</span>
                  </span>
                )}
                {idVerified && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2 py-0.5 text-[11px] text-sky-700 border border-sky-100">
                    <span>🪪</span>
                    <span>ID verified</span>
                  </span>
                )}
                {trustedProvider && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] text-emerald-800 border border-emerald-200">
                    <span>🛡</span>
                    <span>Trusted</span>
                  </span>
                )}
                {topPerformer && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] text-amber-800 border border-amber-200">
                    <span>🥇</span>
                    <span>Top performer</span>
                  </span>
                )}
              </div>
              {provider?.providerType && (
                <p className="text-xs mt-1 text-gray-500">{provider.providerType}</p>
              )}
              {typeof distanceKm === 'number' && (
                <p className="text-xs mt-1 text-gray-500">{distanceKm.toFixed(1)} km away</p>
              )}
            </div>
          </div>
          <div className="mt-4 flex gap-2 mt-auto">
            <Link
              to={`/providers/${provider?._id}`}
              className="inline-flex items-center justify-center px-3 py-1.5 text-sm rounded-md bg-emerald-600 text-white hover:bg-emerald-700 transition-all w-full sm:w-auto"
            >
              View Profile
            </Link>
            <button
              onClick={startChat}
              disabled={chatLoading}
              className="inline-flex items-center justify-center px-3 py-1.5 text-sm rounded-md border border-emerald-600 text-emerald-700 hover:bg-emerald-50 transition-all disabled:opacity-70 w-full sm:w-auto"
            >
              {chatLoading ? "Starting…" : "Chat"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
