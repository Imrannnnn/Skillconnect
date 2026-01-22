import Message from "../models/message.js";
import User from "../models/user.js";
import Notification from "../models/notification.js";
import mongoose from "mongoose";

function buildChatId(a, b) { const A = String(a); const B = String(b); return A < B ? `${A}_${B}` : `${B}_${A}`; }

export const listChats = async (req, res) => {
  try {
    const userId = String(req.user._id);
    const pipeline = [
      {
        $match: {
          $and: [
            {
              $or: [
                { sender: new mongoose.Types.ObjectId(userId) },
                { receiver: new mongoose.Types.ObjectId(userId) },
              ],
            },
            {
              // Exclude messages soft-deleted for this user
              $or: [
                { deletedFor: { $exists: false } },
                { deletedFor: { $ne: new mongoose.Types.ObjectId(userId) } },
              ],
            },
          ],
        },
      },
      { $sort: { createdAt: -1 } },
      { $group: { _id: "$chatId", lastMessage: { $first: "$$ROOT" } } },
      { $project: { chatId: "$_id", lastMessage: 1, _id: 0 } },
    ];
    const rows = await Message.aggregate(pipeline);

    // Populate participant details
    const chats = await Promise.all(rows.map(async (r) => {
      const [a, b] = r.chatId.split("_");
      const otherId = a === userId ? b : a;

      let participants = [];
      if (otherId) {
        // We only really need the other user for the list view title
        const otherUser = await User.findById(otherId).select("name email avatarUrl role");
        if (otherUser) {
          participants.push(otherUser);
        }
      }

      return {
        ...r,
        participants
      };
    }));

    res.json({ chats });
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
    const messages = await Message.find({
      chatId: req.params.chatId,
      // Exclude messages that have been soft-deleted for this user
      $or: [
        { deletedFor: { $exists: false } },
        { deletedFor: { $ne: req.user._id } },
      ],
    }).sort({ createdAt: 1 });
    res.json({ messages });
  } catch (error) { res.status(500).json({ message: "Failed to fetch chat", error }); }
};

export const sendMessageToChat = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { text, attachments } = req.body;

    if (!text && (!attachments || attachments.length === 0)) {
      return res.status(400).json({ message: "Message cannot be empty" });
    }

    const [a, b] = String(chatId).split("_"); if (!a || !b) return res.status(400).json({ message: "Invalid chatId" });
    const sender = String(req.user._id); const receiver = sender === a ? b : a;

    const msg = await Message.create({
      chatId,
      sender,
      receiver,
      content: text || "",
      attachments: attachments || []
    });

    // Create Notification for the receiver
    try {
      if (sender !== receiver) {
        await Notification.create({
          userId: receiver,
          type: 'message',
          title: 'New Message',
          message: `You have a new message from ${req.user.name || 'someone'}`,
          link: `/chat/${chatId}`,
          isRead: false
        });
      }
    } catch (e) {
      console.error("Failed to create message notification", e);
    }

    res.status(201).json(msg);
  } catch (error) { res.status(500).json({ message: "Failed to send message", error }); }
};

export const deleteChat = async (req, res) => {
  try {
    const { chatId } = req.params;
    if (!chatId) return res.status(400).json({ message: "chatId is required" });

    // Ensure requester is part of the chat
    const [a, b] = String(chatId).split("_");
    const userId = String(req.user._id);
    if (userId !== String(a) && userId !== String(b)) {
      return res.status(403).json({ message: "Not allowed to delete this chat" });
    }

    // Soft delete: mark all messages in this chat as deleted for this user
    await Message.updateMany(
      { chatId },
      { $addToSet: { deletedFor: req.user._id } },
    );

    return res.json({ message: "Chat deleted for you" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete chat", error });
  }
};

export const markAsRead = async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.user._id;

    await Message.updateMany(
      { chatId, receiver: userId, isRead: false },
      { $set: { isRead: true } }
    );

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: "Failed to mark messages as read" });
  }
};
