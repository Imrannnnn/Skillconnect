import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios.js";

//AI agent
export default function AiAssistant() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    { role: "assistant", text: "Hi! I can help you find providers, manage bookings, or answer wallet questions." },
  ]);
  const [loading, setLoading] = useState(false);

  async function sendMessage(e) {
    e?.preventDefault?.();
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    const userMsg = { role: "user", text: trimmed };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");

    try {
      setLoading(true);
      const { data } = await API.post("/users/ai/chat", { message: trimmed });
      const reply = data?.reply || "I couldn't understand that. Please try rephrasing.";
      const assistantMsg = { role: "assistant", text: reply, suggestions: data?.suggestions || [] };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: "Sorry, I had trouble responding. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleSuggestionClick(suggestion) {
    if (!suggestion) return;
    if (suggestion.action === "search_providers") {
      // Use the last user message or payload query for smart search
      const lastUser = [...messages].reverse().find((m) => m.role === "user");
      const query = suggestion.payload?.query || lastUser?.text || "";

      // Navigate to providers page with prefilled query
      if (query) {
        navigate(`/providers?smartQuery=${encodeURIComponent(query)}`);
      } else {
        navigate("/providers");
      }

      // Also show a quick preview of recommended providers using smart-search
      if (query) {
        (async () => {
          try {
            const { data } = await API.post("/users/smart-search", { query });
            const providers = Array.isArray(data?.providers) ? data.providers.slice(0, 3) : [];
            if (!providers.length) {
              setMessages((prev) => [
                ...prev,
                {
                  role: "assistant",
                  text: "I couldn't find matching providers right now. Try adjusting your description or category.",
                },
              ]);
              return;
            }
            const summary = providers
              .map((p, idx) => {
                const rating = typeof p.ratingAvg === "number" && p.ratingAvg > 0 ? `${p.ratingAvg.toFixed(1)}/5` : "no rating yet";
                const category = Array.isArray(p.categories) && p.categories.length ? p.categories[0] : "general";
                return `${idx + 1}. ${p.name || "Provider"} (${category}, ${rating})`;
              })
              .join(" | ");

            setMessages((prev) => [
              ...prev,
              {
                role: "assistant",
                text: `Here are a few recommended providers based on your request: ${summary}. You can see full details on the providers page.`,
              },
            ]);
          } catch {
            setMessages((prev) => [
              ...prev,
              {
                role: "assistant",
                text: "I couldn't load recommended providers. Please try again from the providers page.",
              },
            ]);
          }
        })();
      }
    } else if (suggestion.action === "open_wallet") {
      navigate("/dashboard");
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: "Opening your dashboard so you can view your wallet balance and transactions." },
      ]);
    } else if (suggestion.action === "open_bookings") {
      navigate("/bookings");
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: "Opening your bookings page so you can review your current jobs and timelines." },
      ]);
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-40">
      {open && (
        <div className="mb-3 w-72 sm:w-80 rounded-xl border border-emerald-200 bg-white shadow-lg flex flex-col overflow-hidden">
          <div className="px-3 py-2 bg-emerald-600 text-white text-sm flex items-center justify-between">
            <span>SkillConnect Assistant</span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-xs px-1.5 py-0.5 rounded bg-emerald-700/60 hover:bg-emerald-800"
            >
              Close
            </button>
          </div>
          <div className="px-3 py-2 h-56 overflow-y-auto text-xs space-y-2 bg-emerald-50/30">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={
                  m.role === "assistant"
                    ? "text-gray-800 bg-white border border-emerald-100 rounded-md px-2 py-1"
                    : "text-gray-800 bg-emerald-100 rounded-md px-2 py-1 ml-auto max-w-[80%]"
                }
              >
                <p>{m.text}</p>
                {m.role === "assistant" && Array.isArray(m.suggestions) && m.suggestions.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {m.suggestions
                      .filter((s) => s.type === "action")
                      .map((s) => (
                        <button
                          key={s.action}
                          type="button"
                          onClick={() => handleSuggestionClick(s)}
                          className="px-2 py-0.5 text-[10px] rounded-full border border-emerald-300 text-emerald-700 bg-emerald-50 hover:bg-emerald-100"
                        >
                          {s.label}
                        </button>
                      ))}
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="text-[11px] text-gray-500">Assistant is thinking…</div>
            )}
          </div>
          <form onSubmit={sendMessage} className="border-t border-gray-100 flex">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about providers, wallet, bookings…"
              className="flex-1 px-2 py-1 text-xs outline-none"
            />
            <button
              type="submit"
              disabled={loading}
              className="px-3 py-1 text-xs bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-70"
            >
              Send
            </button>
          </form>
        </div>
      )}
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="rounded-full bg-emerald-600 text-white px-3 py-2 text-xs shadow-lg flex items-center gap-1 hover:bg-emerald-700"
        >
          <span>Ask SkillConnect</span>
        </button>
      )}
    </div>
  );
}
