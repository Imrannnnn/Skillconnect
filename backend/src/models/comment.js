import mongoose from "mongoose";

const commentSchema = new mongoose.Schema(
  {
    contentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Content",
      required: true,
      index: true,
    },
    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    authorType: {
      type: String,
      enum: ["client", "provider", "admin", "organization"],
      required: true,
    },
    body: {
      type: String,
      required: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comment",
      default: null,
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

commentSchema.index({ contentId: 1, createdAt: -1 });

export default mongoose.model("Comment", commentSchema);
