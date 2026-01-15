import Content from "../models/content.js";
import Comment from "../models/comment.js";
import User from "../models/user.js";
import Organization from "../models/organization.js";
import Notification from "../models/notification.js";
import { deleteFromCloudinary } from "../services/cloudinaryService.js";

function deriveAuthorType(user) {
  if (!user) return "client";
  const accountType = user.accountType || "individual";
  const roles =
    Array.isArray(user.roles) && user.roles.length
      ? user.roles
      : user.role
        ? [user.role]
        : [];

  if (accountType === "organization" || user.organizationId) return "organization";
  if (roles.includes("admin")) return "admin";
  if (roles.includes("provider")) return "provider";
  return "client";
}

function normalizeArray(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  return [value];
}

function normalizeTags(tags) {
  if (!tags) return [];
  if (Array.isArray(tags)) return tags.filter(Boolean).map((t) => String(t).trim()).filter(Boolean);
  return String(tags)
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

export const createContent = async (req, res) => {
  try {
    const user = req.user;
    if (!user?._id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { contentType, title, body, mediaUrls, tags, visibility } = req.body || {};

    const allowedTypes = ["post", "blog"];
    if (!contentType || !allowedTypes.includes(contentType)) {
      return res.status(400).json({ message: "contentType must be one of post, blog" });
    }
    const trimmedBody = typeof body === "string" ? body.trim() : "";

    if (contentType === "post") {
      if (!trimmedBody) {
        return res.status(400).json({ message: "body is required for post" });
      }
    } else if (contentType === "blog") {
      const trimmedTitle = typeof title === "string" ? title.trim() : "";
      if (!trimmedTitle) {
        return res.status(400).json({ message: "title is required for blog" });
      }
      if (!trimmedBody || trimmedBody.length < 200) {
        return res.status(400).json({ message: "blog body must be at least 200 characters" });
      }
    }

    const authorId = user._id;
    const authorType = deriveAuthorType(user);

    const normalizedMedia = normalizeArray(mediaUrls);

    if (contentType === "post") {
      if (normalizedMedia.length > 1) {
        return res.status(400).json({ message: "post can have at most one image" });
      }
    } else if (contentType === "blog") {
      if (normalizedMedia.length === 0) {
        return res.status(400).json({ message: "blog must include at least one image" });
      }
    }

    const doc = await Content.create({
      authorId,
      authorType,
      contentType,
      title,
      body: trimmedBody,
      mediaUrls: normalizedMedia,
      tags: normalizeTags(tags),
      visibility: visibility === "private" ? "private" : "public",
    });

    return res.status(201).json({ content: doc });
  } catch (e) {
    return res.status(500).json({ message: "Failed to create content", error: e?.message || e });
  }
};

export const listContent = async (req, res) => {
  try {
    const { contentType, authorId, authorType, tag, q, sort, page, limit } = req.query || {};

    const filter = { isDeleted: false, visibility: "public" };

    if (contentType) filter.contentType = contentType;
    if (authorId) filter.authorId = authorId;
    if (authorType) filter.authorType = authorType;
    if (tag) filter.tags = { $in: [tag] };

    if (q && typeof q === "string" && q.trim()) {
      const regex = new RegExp(q.trim(), "i");
      filter.$or = [{ title: regex }, { body: regex }];
    }

    let query = Content.find(filter);

    if (sort === "top") query = query.sort({ likesCount: -1, createdAt: -1 });
    else if (sort === "oldest") query = query.sort({ createdAt: 1 });
    else query = query.sort({ createdAt: -1 });

    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.max(1, Math.min(50, Number(limit) || 20));

    query = query.skip((pageNum - 1) * limitNum).limit(limitNum);

    const contents = await query;
    return res.json({ contents });
  } catch (e) {
    return res.status(500).json({ message: "Failed to list content", error: e?.message || e });
  }
};

export const listAuthorContent = async (req, res) => {
  try {
    const { authorId } = req.params;
    const { contentType, sort, page, limit } = req.query || {};

    if (!authorId) {
      return res.status(400).json({ message: "authorId is required" });
    }

    const filter = { authorId, isDeleted: false };

    const requesterId = req.user?._id;
    const isOwner = requesterId && String(requesterId) === String(authorId);
    if (!isOwner) {
      filter.visibility = "public";
    }

    if (contentType) filter.contentType = contentType;

    let query = Content.find(filter);

    if (sort === "top") query = query.sort({ likesCount: -1, createdAt: -1 });
    else if (sort === "oldest") query = query.sort({ createdAt: 1 });
    else query = query.sort({ createdAt: -1 });

    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.max(1, Math.min(50, Number(limit) || 20));

    query = query.skip((pageNum - 1) * limitNum).limit(limitNum);

    const contents = await query;
    return res.json({ contents });
  } catch (e) {
    return res.status(500).json({ message: "Failed to list author content", error: e?.message || e });
  }
};

export const getContent = async (req, res) => {
  try {
    const { id } = req.params;
    const content = await Content.findByIdAndUpdate(
      id,
      { $inc: { views: 1 } },
      { new: true }
    );
    if (!content || content.isDeleted) {
      return res.status(404).json({ message: "Content not found" });
    }

    if (
      content.visibility === "private" &&
      (!req.user || String(req.user._id) !== String(content.authorId))
    ) {
      return res.status(404).json({ message: "Content not found" });
    }

    return res.json({ content });
  } catch (e) {
    return res.status(500).json({ message: "Failed to get content", error: e?.message || e });
  }
};

export const updateContent = async (req, res) => {
  try {
    const user = req.user;
    if (!user?._id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { id } = req.params;
    const content = await Content.findById(id);
    if (!content || content.isDeleted) {
      return res.status(404).json({ message: "Content not found" });
    }

    if (String(content.authorId) !== String(user._id)) {
      return res.status(403).json({ message: "You can only update your own content" });
    }

    const allowed = ["title", "body", "mediaUrls", "tags", "visibility", "contentType"];
    const update = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        if (key === "mediaUrls") update.mediaUrls = normalizeArray(req.body.mediaUrls);
        else if (key === "tags") update.tags = normalizeTags(req.body.tags);
        else if (key === "visibility") update.visibility = req.body.visibility === "private" ? "private" : "public";
        else update[key] = req.body[key];
      }
    }

    const next = { ...content.toObject(), ...update };

    const type = next.contentType;
    if (!["post", "blog"].includes(type)) {
      return res.status(400).json({ message: "contentType must be one of post, blog" });
    }

    const bodyVal = typeof next.body === "string" ? next.body.trim() : "";
    const titleVal = typeof next.title === "string" ? next.title.trim() : "";
    const media = Array.isArray(next.mediaUrls) ? next.mediaUrls : [];

    if (type === "post") {
      if (!bodyVal) {
        return res.status(400).json({ message: "body is required for post" });
      }
      if (media.length > 1) {
        return res.status(400).json({ message: "post can have at most one image" });
      }
    } else if (type === "blog") {
      if (!titleVal) {
        return res.status(400).json({ message: "title is required for blog" });
      }
      if (!bodyVal || bodyVal.length < 200) {
        return res.status(400).json({ message: "blog body must be at least 200 characters" });
      }
      if (media.length === 0) {
        return res.status(400).json({ message: "blog must include at least one image" });
      }
    }

    // Cloudinary cleanup for removed media
    if (req.body.mediaUrls !== undefined) {
      const oldMedia = content.mediaUrls || [];
      const newMedia = next.mediaUrls || [];
      const removed = oldMedia.filter(url => !newMedia.includes(url));
      for (const url of removed) {
        await deleteFromCloudinary(url).catch(console.error);
      }
    }

    Object.assign(content, next, { body: bodyVal, title: titleVal, mediaUrls: media });
    await content.save();

    return res.json({ content });
  } catch (e) {
    return res.status(500).json({ message: "Failed to update content", error: e?.message || e });
  }
};

export const softDeleteContent = async (req, res) => {
  try {
    const user = req.user;
    if (!user?._id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { id } = req.params;
    const content = await Content.findById(id);
    if (!content || content.isDeleted) {
      return res.status(404).json({ message: "Content not found" });
    }

    if (String(content.authorId) !== String(user._id)) {
      return res.status(403).json({ message: "You can only delete your own content" });
    }

    // Delete media from Cloudinary
    if (Array.isArray(content.mediaUrls)) {
      for (const url of content.mediaUrls) {
        await deleteFromCloudinary(url).catch(console.error);
      }
    }

    content.isDeleted = true;
    await content.save();

    return res.json({ message: "Content deleted" });
  } catch (e) {
    return res.status(500).json({ message: "Failed to delete content", error: e?.message || e });
  }
};

export const likeContent = async (req, res) => {
  try {
    const user = req.user;
    if (!user?._id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { id } = req.params;
    const content = await Content.findById(id);
    if (!content || content.isDeleted) {
      return res.status(404).json({ message: "Content not found" });
    }

    const userIdStr = String(user._id);
    const alreadyLiked = Array.isArray(content.likes)
      ? content.likes.some((u) => String(u) === userIdStr)
      : false;

    if (!alreadyLiked) {
      content.likes = Array.isArray(content.likes) ? content.likes : [];
      content.likes.push(user._id);
      content.likesCount = content.likes.length;
      await content.save();
    }

    return res.json({ content });
  } catch (e) {
    return res.status(500).json({ message: "Failed to like content", error: e?.message || e });
  }
};

export const unlikeContent = async (req, res) => {
  try {
    const user = req.user;
    if (!user?._id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { id } = req.params;
    const content = await Content.findById(id);
    if (!content || content.isDeleted) {
      return res.status(404).json({ message: "Content not found" });
    }

    const userIdStr = String(user._id);
    if (Array.isArray(content.likes) && content.likes.length) {
      const nextLikes = content.likes.filter((u) => String(u) !== userIdStr);
      content.likes = nextLikes;
      content.likesCount = nextLikes.length;
      await content.save();
    }

    return res.json({ content });
  } catch (e) {
    return res.status(500).json({ message: "Failed to unlike content", error: e?.message || e });
  }
};

export const createComment = async (req, res) => {
  try {
    const user = req.user;
    if (!user?._id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { id } = req.params; // contentId
    const { body, parentId } = req.body || {};

    if (!body || typeof body !== "string" || !body.trim()) {
      return res.status(400).json({ message: "body is required" });
    }

    const content = await Content.findById(id);
    if (!content || content.isDeleted) {
      return res.status(404).json({ message: "Content not found" });
    }

    if (
      content.visibility === "private" &&
      String(content.authorId) !== String(user._id)
    ) {
      return res.status(404).json({ message: "Content not found" });
    }

    const authorId = user._id;
    const authorType = deriveAuthorType(user);

    const comment = await Comment.create({
      contentId: content._id,
      authorId,
      authorType,
      body,
      parentId: parentId || null,
    });

    // Notify content author
    if (String(content.authorId) !== String(user._id)) {
      try {
        await Notification.create({
          userId: content.authorId,
          title: "New Comment",
          message: `${user.name || "Someone"} commented on your post`,
          type: "info",
          link: `/content/${id}`,
        });
      } catch (e) {
        console.error("Failed to notify content author", e);
      }
    }

    // If it's a reply, notify the parent comment author
    if (parentId) {
      try {
        const parentComment = await Comment.findById(parentId);
        if (parentComment && String(parentComment.authorId) !== String(user._id)) {
          await Notification.create({
            userId: parentComment.authorId,
            title: "New Reply",
            message: `${user.name || "Someone"} replied to your comment`,
            type: "info",
            link: `/content/${id}`,
          });
        }
      } catch (e) {
        console.error("Failed to notify parent comment author", e);
      }
    }

    content.commentsCount = (content.commentsCount || 0) + 1;
    await content.save();

    return res.status(201).json({ comment });
  } catch (e) {
    return res.status(500).json({ message: "Failed to create comment", error: e?.message || e });
  }
};

export const listComments = async (req, res) => {
  try {
    const { id } = req.params; // contentId

    const content = await Content.findById(id);
    if (!content || content.isDeleted) {
      return res.status(404).json({ message: "Content not found" });
    }

    if (
      content.visibility === "private" &&
      (!req.user || String(req.user._id) !== String(content.authorId))
    ) {
      return res.status(404).json({ message: "Content not found" });
    }

    const commentsRaw = await Comment.find({ contentId: id, isDeleted: false }).sort({ createdAt: 1 });

    const comments = await Promise.all(
      commentsRaw.map(async (c) => {
        const commentObj = c.toObject();
        let authorName = "Unknown";
        try {
          if (c.authorType === "organization") {
            const org = await Organization.findById(c.authorId);
            authorName = org?.name || "Organization";
          } else {
            const u = await User.findById(c.authorId);
            authorName = u?.name || "User";
          }
        } catch (err) {
          // ignore
        }
        return { ...commentObj, authorName };
      }),
    );

    return res.json({ comments });
  } catch (e) {
    return res.status(500).json({ message: "Failed to list comments", error: e?.message || e });
  }
};

export const deleteComment = async (req, res) => {
  try {
    const user = req.user;
    if (!user?._id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { id, commentId } = req.params; // contentId, commentId

    const comment = await Comment.findById(commentId);
    if (!comment || comment.isDeleted || String(comment.contentId) !== String(id)) {
      return res.status(404).json({ message: "Comment not found" });
    }

    const content = await Content.findById(comment.contentId);
    if (!content || content.isDeleted) {
      return res.status(404).json({ message: "Content not found" });
    }

    const isCommentAuthor = String(comment.authorId) === String(user._id);
    const isContentAuthor = String(content.authorId) === String(user._id);

    if (!isCommentAuthor && !isContentAuthor) {
      return res.status(403).json({ message: "You can only delete your own comments or comments on your content" });
    }

    comment.isDeleted = true;
    await comment.save();

    if (content.commentsCount && content.commentsCount > 0) {
      content.commentsCount -= 1;
      await content.save();
    }

    return res.json({ message: "Comment deleted" });
  } catch (e) {
    return res.status(500).json({ message: "Failed to delete comment", error: e?.message || e });
  }
};
