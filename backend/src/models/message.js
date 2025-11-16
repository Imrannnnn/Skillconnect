import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
  chatId: { type: String, index: true, required: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  receiver: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  content: { type: String, required: true },
  // Soft delete per user: list of userIds who should no longer see this message
  deletedFor: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
}, { timestamps: true });

export default mongoose.model("Message", messageSchema);
