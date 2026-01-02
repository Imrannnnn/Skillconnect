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
    } catch (error) {
      notify(error?.response?.data?.message || "Failed to start chat", { type: "error" });
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
    <div className="group bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 flex flex-col h-full overflow-hidden">
      {/* Header / Avatar */}
      <div className="p-5 flex items-start gap-4">
        <div className="relative">
          {provider?.avatarUrl ? (
            <img
              src={provider?.avatarUrl || `https://ui-avatars.com/api/?name=${provider?.name}&background=10b981&color=fff`}
              alt={provider?.name}
              className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-md"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 text-xl font-bold border-2 border-white shadow-md">
              {provider?.name?.[0]?.toUpperCase() || "P"}
            </div>
          )}

          {/* Status Indicator (Mock) */}
          <div className="absolute bottom-1 right-1 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white"></div>
        </div>

        <div className="flex-1 min-w-0 pt-1">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-bold text-gray-900 truncate text-lg group-hover:text-emerald-600 transition-colors" title={provider?.name}>
              {provider?.name}
            </h3>
            {topPerformer && (
              <span className="shrink-0 inline-flex items-center justify-center w-6 h-6 bg-amber-100 text-amber-600 rounded-full" title="Top Performer">
                <span className="text-sm">🏆</span>
              </span>
            )}
          </div>

          <p className="text-sm font-medium text-emerald-600 mb-2 truncate">
            {Array.isArray(provider?.categories) ? provider.categories.join(", ") : (provider?.category || "Professional")}
          </p>

          <div className="flex flex-wrap gap-2 text-xs text-gray-500">
            {(provider?.location?.city || provider?.location?.state) && (
              <span className="flex items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
                {[provider.location.city, provider.location.state].filter(Boolean).join(", ")}
              </span>
            )}
            {typeof distanceKm === 'number' && (
              <span className="text-emerald-600 font-medium whitespace-nowrap">
                • {distanceKm.toFixed(1)} km
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Stats & Badges */}
      <div className="px-5 py-3 bg-gray-50/50 border-t border-b border-gray-100 flex items-center justify-between text-sm">
        <div className="flex items-center gap-1.5">
          <span className="text-amber-500 text-base">★</span>
          <span className="font-bold text-gray-900">{provider.ratingAvg || "New"}</span>
          <span className="text-gray-400">({provider.ratingCount || 0})</span>
        </div>
        <div className="text-gray-600 font-medium">
          {jobsDone || 0} <span className="font-normal text-gray-400">jobs</span>
        </div>
      </div>

      {/* Tags / Badges Row */}
      <div className="px-5 py-3 flex flex-wrap gap-2 min-h-[3rem]">
        {(emailVerified || phoneVerified) && (
          <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-medium border border-blue-100 flex items-center gap-1">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Verified
          </span>
        )}
        {idVerified && (
          <span className="px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 text-xs font-medium border border-purple-100">
            ID Checked
          </span>
        )}
        {trustedProvider && (
          <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium border border-emerald-100 flex items-center gap-1">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Trusted
          </span>
        )}
      </div>

      {/* Footer Actions */}
      <div className="mt-auto px-5 py-4 flex gap-3">
        <Link
          to={`/providers/${provider?._id}`}
          className="flex-1 py-2.5 rounded-lg bg-gray-900 text-white text-center text-sm font-semibold hover:bg-gray-800 transition-colors shadow-sm"
        >
          Profile
        </Link>
        <button
          onClick={startChat}
          disabled={chatLoading}
          className="flex-1 py-2.5 rounded-lg bg-white border border-gray-200 text-gray-700 text-center text-sm font-semibold hover:bg-gray-50 hover:text-emerald-600 transition-colors disabled:opacity-50"
        >
          {chatLoading ? "..." : "Chat"}
        </button>
      </div>
    </div>
  );
}
