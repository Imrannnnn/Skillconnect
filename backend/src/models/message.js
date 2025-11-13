import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
  chatId: { type: String, index: true, required: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  receiver: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  content: { type: String, required: true },
}, { timestamps: true });

export default mongoose.model("Message", messageSchema);
