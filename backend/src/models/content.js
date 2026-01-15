import mongoose from "mongoose";

const contentSchema = new mongoose.Schema(
  {
    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    authorType: {
      type: String,
      enum: ["client", "provider", "admin", "organization"],
      required: true,
      index: true,
    },
    contentType: {
      type: String,
      enum: ["post", "blog"],
      required: true,
      index: true,
    },
    title: {
      type: String,
    },
    body: {
      type: String,
      required: true,
    },
    mediaUrls: {
      type: [String],
      default: [],
    },
    tags: {
      type: [String],
      default: [],
      index: true,
    },
    visibility: {
      type: String,
      enum: ["public", "private"],
      default: "public",
      index: true,
    },
    likesCount: {
      type: Number,
      default: 0,
    },
    commentsCount: {
      type: Number,
      default: 0,
    },
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    views: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
);

contentSchema.index({ createdAt: -1 });
contentSchema.index({ authorId: 1, createdAt: -1 });

export default mongoose.model("Content", contentSchema);
