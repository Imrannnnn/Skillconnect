import { useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import API from "../api/axios.js";
import { AuthContext } from "../context/auth.js";
import { useToast } from "../components/toast.js";
import { getImageUrl } from "../utils/image.js";

export default function CommunityFeed() {
  const { user } = useContext(AuthContext);
  const { notify } = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [creating, setCreating] = useState(false);
  const [newType, setNewType] = useState("post");
  const [newTitle, setNewTitle] = useState("");
  const [newBody, setNewBody] = useState("");
  const [mediaUrls, setMediaUrls] = useState([]);
  const [imageUploading, setImageUploading] = useState(false);

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

  function formatType(value) {
    const v = String(value || "").toLowerCase();
    if (v === "post") return "Post";
    if (v === "blog") return "Blog";
    return "Update";
  }

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      setError("");
      try {
        const params = new URLSearchParams();
        if (filterType !== "all") params.set("contentType", filterType);
        const { data } = await API.get(`/content?${params.toString()}`);
        if (!mounted) return;
        const list = Array.isArray(data?.contents) ? data.contents : [];
        setItems(list);
      } catch {
        if (!mounted) return;
        setError("Failed to load community feed.");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, [filterType]);

  async function handleImageUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      notify("Please select an image file.", { type: "error" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      notify("Image must be smaller than 5MB.", { type: "error" });
      return;
    }
    setImageUploading(true);
    try {
      const formData = new FormData();
      formData.append("image", file);
      const { data } = await API.post("/users/content-image", formData);
      const url = data?.url;
      if (url) {
        setMediaUrls((prev) => [...prev, url]);
        notify("Image uploaded.", { type: "success" });
      }
    } catch (e) {
      notify(e?.response?.data?.message || "Image upload failed.", { type: "error" });
    } finally {
      setImageUploading(false);
      // Reset file input
      e.target.value = "";
    }
  }

  function removeImage(url) {
    setMediaUrls((prev) => prev.filter((u) => u !== url));
  }

  async function handleCreate(e) {
    e.preventDefault();
    if (!user?._id) {
      notify("You must be logged in to post.", { type: "info" });
      return;
    }
    if (!newBody.trim()) {
      notify("Write something before posting.", { type: "info" });
      return;
    }
    if (newType === "blog" && (!newTitle.trim() || newBody.trim().length < 200)) {
      notify("Blog requires a title and at least 200 characters.", { type: "info" });
      return;
    }
    if (newType === "blog" && mediaUrls.length === 0) {
      notify("Blog must include at least one image.", { type: "info" });
      return;
    }
    if (newType === "post" && mediaUrls.length > 1) {
      notify("Post can have at most one image.", { type: "info" });
      return;
    }
    setCreating(true);
    try {
      const payload = {
        contentType: newType,
        body: newBody.trim(),
        mediaUrls,
      };
      if (newType === "blog" || newTitle.trim()) payload.title = newTitle.trim();
      const { data } = await API.post("/content", payload);
      const created = data?.content;
      if (created) {
        setItems((prev) => [created, ...prev]);
        setNewBody("");
        setNewTitle("");
        setMediaUrls([]);
      }
      notify("Posted to community.", { type: "success" });
    } catch (e) {
      notify(e?.response?.data?.message || "Failed to create post.", { type: "error" });
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900">Community feed</h1>
          <p className="mt-1 text-sm text-gray-600">
            See recent posts and blogs from people using SkillConnect.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <button
            type="button"
            onClick={() => setFilterType("all")}
            className={`px-3 py-1.5 rounded-full border text-xs font-medium ${filterType === "all"
              ? "bg-emerald-600 text-white border-emerald-600"
              : "bg-white text-gray-700 border-gray-200 hover:border-emerald-500"
              }`}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => setFilterType("post")}
            className={`px-3 py-1.5 rounded-full border text-xs font-medium ${filterType === "post"
              ? "bg-emerald-600 text-white border-emerald-600"
              : "bg-white text-gray-700 border-gray-200 hover:border-emerald-500"
              }`}
          >
            Posts
          </button>
          <button
            type="button"
            onClick={() => setFilterType("blog")}
            className={`px-3 py-1.5 rounded-full border text-xs font-medium ${filterType === "blog"
              ? "bg-emerald-600 text-white border-emerald-600"
              : "bg-white text-gray-700 border-gray-200 hover:border-emerald-500"
              }`}
          >
            Blogs
          </button>
        </div>
      </div>

      {user && (
        <section className="mb-6 rounded-xl border border-emerald-100 bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-900 mb-2">Share an update</h2>
          <form onSubmit={handleCreate} className="space-y-3">
            <div className="flex flex-wrap gap-2 text-xs">
              <label className="inline-flex items-center gap-1">
                <input
                  type="radio"
                  name="contentType"
                  value="post"
                  checked={newType === "post"}
                  onChange={() => setNewType("post")}
                  className="h-3 w-3"
                />
                <span>Post</span>
              </label>
              <label className="inline-flex items-center gap-1">
                <input
                  type="radio"
                  name="contentType"
                  value="blog"
                  checked={newType === "blog"}
                  onChange={() => setNewType("blog")}
                  className="h-3 w-3"
                />
                <span>Blog</span>
              </label>
            </div>
            {newType === "blog" && (
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Title (required for blog)"
                required
                className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            )}
            {newType === "post" && newTitle.trim() && (
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Title (optional for post)"
                className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            )}
            <textarea
              value={newBody}
              onChange={(e) => setNewBody(e.target.value)}
              placeholder={
                newType === "post"
                  ? "Share a quick update..."
                  : "Write your blog (at least 200 characters)..."
              }
              required
              rows={3}
              className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2">
                <label className="inline-flex items-center justify-center rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:border-emerald-500 cursor-pointer">
                  <input
                    type="file"
                    accept="image/jpeg,image/png"
                    onChange={handleImageUpload}
                    disabled={imageUploading || (newType === "post" && mediaUrls.length >= 1)}
                    className="sr-only"
                  />
                  {imageUploading ? "Uploading..." : "Add Image"}
                </label>
                <span className="text-[11px] text-gray-500 self-center">
                  {newType === "post"
                    ? mediaUrls.length >= 1
                      ? "Post can have at most one image."
                      : "Optional: add one image."
                    : "Blog must include at least one image."}
                </span>
              </div>
              {mediaUrls.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {mediaUrls.map((url, i) => (
                    <div key={i} className="relative group">
                      <img
                        src={url}
                        alt={`upload-${i}`}
                        className="h-16 w-16 object-cover rounded border border-gray-200"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(url)}
                        className="absolute -top-1 -right-1 bg-rose-600 text-white rounded-full w-4 h-4 text-[10px] opacity-0 group-hover:opacity-100 transition"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="flex items-center justify-between gap-3">
              <p className="text-[11px] text-gray-500">
                Your content is visible to everyone by default. You can manage visibility later.
              </p>
              <button
                type="submit"
                disabled={creating}
                className="inline-flex items-center justify-center rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
              >
                {creating ? "Posting..." : "Post"}
              </button>
            </div>
          </form>
        </section>
      )}

      {loading && (
        <p className="text-sm text-gray-500">Loading feed...</p>
      )}

      {!loading && error && (
        <p className="text-sm text-rose-600">{error}</p>
      )}

      {!loading && !error && (
        <section className="space-y-3">
          {items.length === 0 && (
            <p className="text-sm text-gray-600">
              No community posts yet. When people share updates, they will appear here.
            </p>
          )}
          {items.map((item) => (
            <Link
              key={item._id}
              to={`/feed/${item.slug || item._id}`}
              className="block rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:border-emerald-500 hover:shadow-md transition"
            >
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 uppercase">
                    {formatType(item.contentType)}
                  </span>
                  <span className="text-[11px] text-gray-500">
                    {formatDate(item.createdAt)}
                  </span>
                </div>
                {typeof item.likesCount === "number" && (
                  <span className="text-[11px] text-gray-500">
                    {item.likesCount} like{item.likesCount === 1 ? "" : "s"}
                  </span>
                )}
              </div>
              {item.title && (
                <h2 className="text-sm font-semibold text-gray-900 mb-1 line-clamp-1">
                  {item.title}
                </h2>
              )}
              <p className="text-sm text-gray-700 line-clamp-3">
                {String(item.body || "")}
              </p>
              {Array.isArray(item.mediaUrls) && item.mediaUrls.length > 0 && (
                <div className="mt-3 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                  {item.mediaUrls.map((url, i) => (
                    <img
                      key={i}
                      src={getImageUrl(url)}
                      alt="preview"
                      className="h-20 w-32 object-cover rounded-lg border border-gray-100 flex-shrink-0"
                    />
                  ))}
                </div>
              )}
              {typeof item.commentsCount === "number" && (
                <p className="mt-2 text-[11px] text-gray-500">
                  {item.commentsCount} comment{item.commentsCount === 1 ? "" : "s"}
                </p>
              )}
            </Link>
          ))}
        </section>
      )}
    </div>
  );
}
