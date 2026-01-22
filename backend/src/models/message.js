import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
  chatId: { type: String, index: true, required: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  receiver: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  content: { type: String, required: false }, // Content can be empty if there are attachments
  attachments: [{
    url: String,
    type: String, // 'image', 'video', 'file'
    name: String
  }],
  isRead: { type: Boolean, default: false },
  // Soft delete per user: list of userIds who should no longer see this message
  deletedFor: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
}, { timestamps: true });

export default mongoose.model("Message", messageSchema);
