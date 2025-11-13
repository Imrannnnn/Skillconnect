import Message from "../models/message.js";
import mongoose from "mongoose";

function buildChatId(a, b) { const A = String(a); const B = String(b); return A < B ? `${A}_${B}` : `${B}_${A}`; }

export const listChats = async (req, res) => {
  try {
    const userId = String(req.user._id);
    const pipeline = [
      { $match: { $or: [{ sender: new mongoose.Types.ObjectId(userId) }, { receiver: new mongoose.Types.ObjectId(userId) }] } },
      { $sort: { createdAt: -1 } },
      { $group: { _id: "$chatId", lastMessage: { $first: "$$ROOT" } } },
      { $project: { chatId: "$_id", lastMessage: 1, _id: 0 } },
    ];
    const rows = await Message.aggregate(pipeline);
    res.json({ chats: rows.map(r => ({ chatId: r.chatId, lastMessage: r.lastMessage })) });
  } catch (error) { res.status(500).json({ message: "Failed to list chats", error }); }
};

export const createOrGetChat = async (req, res) => {
  try {
    const toUserId = req.body?.toUserId || req.body?.receiverId;
    if (!toUserId) return res.status(400).json({ message: "toUserId is required" });
    const chatId = buildChatId(req.user._id, toUserId);
    res.json({ chatId });
  } catch (error) { res.status(500).json({ message: "Failed to create chat", error }); }
};

export const getChatById = async (req, res) => {
  try {
    const messages = await Message.find({ chatId: req.params.chatId }).sort({ createdAt: 1 });
    res.json({ messages });
  } catch (error) { res.status(500).json({ message: "Failed to fetch chat", error }); }
};

export const sendMessageToChat = async (req, res) => {
  try {
    const { chatId } = req.params; const { text } = req.body;
    if (!text) return res.status(400).json({ message: "text is required" });
    const [a, b] = String(chatId).split("_"); if (!a || !b) return res.status(400).json({ message: "Invalid chatId" });
    const sender = String(req.user._id); const receiver = sender === a ? b : a;
    const msg = await Message.create({ chatId, sender, receiver, content: text });
    res.status(201).json(msg);
  } catch (error) { res.status(500).json({ message: "Failed to send message", error }); }
};
