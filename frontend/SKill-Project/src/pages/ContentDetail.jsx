import { useContext, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import API from "../api/axios.js";
import { AuthContext } from "../context/auth.js";
import { useToast } from "../components/toast.js";

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
  const [postingComment, setPostingComment] = useState(false);
  const [likeLoading, setLikeLoading] = useState(false);

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
        setContent(contentRes.data?.content || null);
        const list = Array.isArray(commentsRes.data?.comments) ? commentsRes.data.comments : [];
        setComments(list);
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
      const { data } = await API.post(`/content/${id}/comments`, { body: commentText.trim() });
      const created = data?.comment;
      if (created) {
        setComments((prev) => [...prev, created]);
        setCommentText("");
        setContent((prev) =>
          prev
            ? {
                ...prev,
                commentsCount: (prev.commentsCount || 0) + 1,
              }
            : prev,
        );
      }
      notify("Comment added.", { type: "success" });
    } catch (e) {
      notify(e?.response?.data?.message || "Failed to add comment.", { type: "error" });
    } finally {
      setPostingComment(false);
    }
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
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="text-sm text-emerald-700 hover:underline"
      >
        Back to feed
      </button>

      <article className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 uppercase">
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
          </div>
        </div>
        {content.title && (
          <h1 className="text-xl font-semibold text-gray-900 mb-2">
            {content.title}
          </h1>
        )}
        <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
          {String(content.body || "")}
        </p>
        <div className="mt-4 flex items-center gap-3">
          <button
            type="button"
            onClick={toggleLike}
            disabled={likeLoading}
            className={`inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-medium ${
              hasLiked
                ? "bg-emerald-600 text-white border-emerald-600"
                : "bg-white text-gray-800 border-gray-200 hover:border-emerald-500"
            } disabled:opacity-60`}
          >
            <span>{hasLiked ? "Liked" : "Like"}</span>
          </button>
        </div>
      </article>

      <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-gray-900 mb-3">Comments</h2>

        {user ? (
          <form onSubmit={handleCommentSubmit} className="space-y-3 mb-4">
            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              rows={3}
              placeholder="Share your thoughts..."
              className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <div className="flex items-center justify-between gap-3">
              <p className="text-[11px] text-gray-500">
                Comments are visible to everyone who can see this post.
              </p>
              <button
                type="submit"
                disabled={postingComment}
                className="inline-flex items-center justify-center rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
              >
                {postingComment ? "Posting..." : "Comment"}
              </button>
            </div>
          </form>
        ) : (
          <p className="mb-4 text-sm text-gray-600">
            <Link to="/login" className="text-emerald-700 hover:underline">
              Log in
            </Link>{" "}
            to join the discussion.
          </p>
        )}

        {comments.length === 0 && (
          <p className="text-sm text-gray-500">No comments yet.</p>
        )}

        <div className="space-y-3">
          {comments.map((c) => (
            <div key={c._id} className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-sm">
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-[11px] font-medium text-gray-700">
                  {String(c.authorType || "user").toUpperCase()}
                </span>
                <span className="text-[11px] text-gray-500">
                  {formatDate(c.createdAt)}
                </span>
              </div>
              <p className="text-sm text-gray-800 whitespace-pre-wrap">{String(c.body || "")}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
