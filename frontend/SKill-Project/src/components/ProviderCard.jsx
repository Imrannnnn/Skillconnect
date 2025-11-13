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

  return (
    <div className="h-full rounded-lg border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition-all flex flex-col">
      <div className="flex items-start gap-3">
        <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-semibold">
          {provider?.name?.[0]?.toUpperCase() || "P"}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-gray-800 truncate" title={provider?.name || ''}>{provider?.name}</h3>
          <p className="text-sm text-gray-500 truncate" title={Array.isArray(provider?.categories) ? provider.categories.join(", ") : (provider?.category || '')}>
            {Array.isArray(provider?.categories) ? provider.categories.join(", ") : provider?.category}
          </p>
          {typeof provider?.ratingAvg === 'number' && provider?.ratingCount > 0 && (
            <p className="text-xs mt-1 text-amber-600">
              ★ {provider.ratingAvg} <span className="text-gray-500">({provider.ratingCount})</span>
            </p>
          )}
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
  );
}
