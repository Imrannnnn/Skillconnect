import { useContext, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import API from "../api/axios.js";
import { AuthContext } from "../context/auth.js";
import { useToast } from "../components/toast.js";
import { getImageUrl } from "../utils/image.js";

export default function ContentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const { notify } = useToast();
  const [content, setContent] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [commentText, setCommentText] = useState("");
  const [replyTo, setReplyTo] = useState(null); // { id, authorName }
  const [postingComment, setPostingComment] = useState(false);
  const [likeLoading, setLikeLoading] = useState(false);

  // Group comments by parentId
  const threadedComments = useMemo(() => {
    const map = {};
    const roots = [];
    comments.forEach((c) => {
      map[c._id] = { ...c, replies: [] };
    });
    comments.forEach((c) => {
      if (c.parentId && map[c.parentId]) {
        map[c.parentId].replies.push(map[c._id]);
      } else {
        roots.push(map[c._id]);
      }
    });
    return roots;
  }, [comments]);

  function formatDate(value) {
    if (!value) return "";
    try {
      return new Intl.DateTimeFormat(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(value));
    } catch {
      return "";
    }
  }

  useEffect(() => {
    if (!id) return undefined;
    let mounted = true;

    async function load() {
      setLoading(true);
      setError("");
      try {
        const [contentRes, commentsRes] = await Promise.all([
          API.get(`/content/${id}`),
          API.get(`/content/${id}/comments`).catch(() => ({ data: { comments: [] } })),
        ]);
        if (!mounted) return;
        const c = contentRes.data?.content || null;
        setContent(c);
        const list = Array.isArray(commentsRes.data?.comments) ? commentsRes.data.comments : [];
        setComments(list);

        // Dynamic Meta Tags (Manual DOM manipulation)
        if (c) {
          document.title = `${c.title || c.contentType} | SkillConnect`;
          const meta = {
            "og:title": c.title || "SkillConnect Post",
            "og:description": (c.body || "").substring(0, 150) + "...",
            "og:image": Array.isArray(c.mediaUrls) && c.mediaUrls[0] ? getImageUrl(c.mediaUrls[0]) : window.location.origin + "/vi.svg",
            "og:url": window.location.href,
            "twitter:card": "summary_large_image"
          };
          Object.entries(meta).forEach(([name, content]) => {
            let el = document.querySelector(`meta[property="${name}"]`) || document.querySelector(`meta[name="${name}"]`);
            if (!el) {
              el = document.createElement("meta");
              if (name.startsWith("og:")) el.setAttribute("property", name);
              else el.setAttribute("name", name);
              document.head.appendChild(el);
            }
            el.setAttribute("content", content);
          });
        }
      } catch (e) {
        if (!mounted) return;
        setError(e?.response?.data?.message || "Failed to load post.");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, [id]);

  const hasLiked = useMemo(() => {
    if (!user?._id || !content || !Array.isArray(content.likes)) return false;
    const uid = String(user._id);
    return content.likes.some((u) => String(u) === uid);
  }, [content, user]);

  async function toggleLike() {
    if (!user?._id) {
      notify("You must be logged in to like posts.", { type: "info" });
      return;
    }
    if (!content || !id) return;
    setLikeLoading(true);
    try {
      const method = hasLiked ? "delete" : "post";
      const { data } = await API[method](`/content/${id}/like`);
      if (data?.content) setContent(data.content);
    } catch (e) {
      notify(e?.response?.data?.message || "Failed to update like.", { type: "error" });
    } finally {
      setLikeLoading(false);
    }
  }

  async function handleCommentSubmit(e) {
    e.preventDefault();
    if (!user?._id) {
      notify("You must be logged in to comment.", { type: "info" });
      return;
    }
    if (!commentText.trim()) {
      notify("Write a comment before sending.", { type: "info" });
      return;
    }
    if (!id) return;
    setPostingComment(true);
    try {
      const { data } = await API.post(`/content/${id}/comments`, {
        body: commentText.trim(),
        parentId: replyTo?.id || null
      });
      const created = data?.comment;
      if (created) {
        // Optimistically add author name if current user
        const newComment = { ...created, authorName: user.name || "Me" };
        setComments((prev) => [...prev, newComment]);
        setCommentText("");
        setReplyTo(null);
        setContent((prev) =>
          prev
            ? {
              ...prev,
              commentsCount: (prev.commentsCount || 0) + 1,
            }
            : prev,
        );
      }
      notify(replyTo ? "Reply added." : "Comment added.", { type: "success" });
    } catch (e) {
      notify(e?.response?.data?.message || "Failed to add comment.", { type: "error" });
    } finally {
      setPostingComment(false);
    }
  }

  function handleCopyLink() {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      notify("Link copied to clipboard!", { type: "success" });
    }).catch(() => {
      notify("Failed to copy link.", { type: "error" });
    });
  }

  if (loading && !content && !error) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <p className="text-sm text-gray-500">Loading post...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-3">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="text-sm text-emerald-700 hover:underline"
        >
          Back
        </button>
        <p className="text-sm text-rose-600">{error}</p>
      </div>
    );
  }

  if (!content) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="text-sm text-emerald-700 hover:underline"
        >
          Back
        </button>
        <p className="mt-2 text-sm text-gray-600">Post not found.</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="text-sm text-emerald-700 hover:underline inline-flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to feed
        </button>
        <button
          type="button"
          onClick={handleCopyLink}
          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:border-emerald-500 hover:bg-emerald-50 transition"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
          Share URL
        </button>
      </div>

      <article className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 uppercase tracking-wider">
              {String(content.contentType || "status")}
            </span>
            <span className="text-[11px] text-gray-500">
              {formatDate(content.createdAt)}
            </span>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-gray-500">
            {typeof content.likesCount === "number" && (
              <span>{content.likesCount} like{content.likesCount === 1 ? "" : "s"}</span>
            )}
            {typeof content.commentsCount === "number" && (
              <span>{content.commentsCount} comment{content.commentsCount === 1 ? "" : "s"}</span>
            )}
            {typeof content.views === "number" && (
              <span className="flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                {content.views} view{content.views === 1 ? "" : "s"}
              </span>
            )}
          </div>
        </div>
        {content.title && (
          <h1 className="text-2xl font-bold text-gray-900 mb-4 leading-tight">
            {content.title}
          </h1>
        )}

        {/* Media rendering fix */}
        {Array.isArray(content.mediaUrls) && content.mediaUrls.length > 0 && (
          <div className="mb-6 grid grid-cols-1 gap-4">
            {content.mediaUrls.map((url, i) => (
              <img
                key={i}
                src={getImageUrl(url)}
                alt={`Content image ${i + 1}`}
                className="w-full max-h-[500px] object-contain rounded-xl border border-gray-100 bg-gray-50"
              />
            ))}
          </div>
        )}

        <div className="text-base text-gray-800 whitespace-pre-wrap leading-relaxed space-y-4">
          {String(content.body || "")}
        </div>
        <div className="mt-6 pt-6 border-t border-gray-100">
          <button
            type="button"
            onClick={toggleLike}
            disabled={likeLoading}
            className={`inline-flex items-center gap-2 rounded-full border px-5 py-2 text-sm font-semibold transition-all ${hasLiked
              ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
              : "bg-white text-gray-800 border-gray-200 hover:border-emerald-500 hover:bg-emerald-50"
              } disabled:opacity-60`}
          >
            <svg className={`w-4 h-4 ${hasLiked ? 'fill-current' : 'fill-none'}`} stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            <span>{hasLiked ? "Liked" : "Like"}</span>
          </button>
        </div>
      </article>

      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          Comments
          <span className="text-sm font-normal text-gray-500">({comments.length})</span>
        </h2>

        {user ? (
          <form onSubmit={handleCommentSubmit} className="space-y-3 mb-6">
            {replyTo && (
              <div className="flex items-center justify-between bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100 mb-2">
                <span className="text-xs text-emerald-800">
                  Replying to <strong>{replyTo.authorName}</strong>
                </span>
                <button
                  type="button"
                  onClick={() => setReplyTo(null)}
                  className="text-[10px] text-emerald-600 hover:text-emerald-800 font-bold"
                >
                  Cancel
                </button>
              </div>
            )}
            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              rows={replyTo ? 2 : 3}
              placeholder={replyTo ? "Write a reply..." : "Share your thoughts..."}
              className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
            />
            <div className="flex items-center justify-between gap-3">
              <p className="text-[11px] text-gray-500">
                Comments are visible to everyone who can see this post.
              </p>
              <button
                type="submit"
                disabled={postingComment}
                className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-6 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60 shadow-sm transition"
              >
                {postingComment ? "Posting..." : replyTo ? "Post Reply" : "Post Comment"}
              </button>
            </div>
          </form>
        ) : (
          <div className="mb-6 p-4 rounded-lg bg-emerald-50 border border-emerald-100 text-center">
            <p className="text-sm text-gray-700">
              <Link to="/login" className="font-bold text-emerald-700 hover:underline">
                Log in
              </Link>{" "}
              to join the discussion and share your thoughts.
            </p>
          </div>
        )}

        {threadedComments.length === 0 ? (
          <div className="py-8 text-center text-gray-500 italic text-sm">
            Be the first to comment on this post.
          </div>
        ) : (
          <div className="space-y-4">
            {threadedComments.map((c) => (
              <div key={c._id} className="space-y-3">
                <div className="p-4 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-gray-50 transition">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-gray-900">
                        {c.authorName || (String(c.authorType || "user").toUpperCase())}
                      </span>
                      <span className="text-[10px] uppercase font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                        {c.authorType}
                      </span>
                    </div>
                    <span className="text-[11px] text-gray-500">
                      {formatDate(c.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-800 whitespace-pre-wrap leading-normal">{String(c.body || "")}</p>

                  {user && (
                    <button
                      type="button"
                      onClick={() => {
                        setReplyTo({ id: c._id, authorName: c.authorName || c.authorType });
                      }}
                      className="mt-3 text-xs font-semibold text-emerald-600 hover:text-emerald-800"
                    >
                      Reply
                    </button>
                  )}
                </div>

                {/* Replies nested */}
                {c.replies && c.replies.length > 0 && (
                  <div className="ml-8 space-y-3 pl-4 border-l-2 border-gray-100">
                    {c.replies.map((r) => (
                      <div key={r._id} className="p-3 rounded-lg border border-gray-50 bg-white shadow-sm">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-gray-900">{r.authorName}</span>
                            <span className="text-[9px] uppercase font-bold text-gray-400 bg-gray-50 px-1 py-0.5 rounded">
                              {r.authorType}
                            </span>
                          </div>
                          <span className="text-[10px] text-gray-500">{formatDate(r.createdAt)}</span>
                        </div>
                        <p className="text-xs text-gray-700 whitespace-pre-wrap">{String(r.body || "")}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
