import express from "express";
import http from "http";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { Server } from "socket.io";
import dotenv from "dotenv";
import connectDB from "./src/config/db.js";
import authRoutes from "./src/routes/authRoutes.js";
import providerRoutes from "./src/routes/providerRoutes.js";
import bookingRoutes from "./src/routes/bookingRoutes.js";
import chatRoutes from "./src/routes/chatRoutes.js";
import userRoutes from "./src/routes/userRoutes.js";
import categoriesRoutes from "./src/routes/categoriesRoutes.js";
import uploadRoutes from "./src/routes/uploadRoutes.js";
import productRoutes from "./src/routes/productRoutes.js";
import walletRoutes from "./src/routes/walletRoutes.js";

dotenv.config();
connectDB();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "2mb" }));

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});
app.set("io", io);

io.on("connection", (socket) => {
  socket.on("joinRoom", ({ chatId }) => { if (chatId) socket.join(chatId); });
  socket.on("leaveRoom", ({ chatId }) => { if (chatId) socket.leave(chatId); });
  socket.on("message", ({ chatId, text, sender, receiver }) => {
    if (chatId && text != null) io.to(chatId).emit("message", { chatId, text, sender, receiver, createdAt: new Date().toISOString() });
  });
  socket.on("typing", ({ chatId, userId, name }) => { if (chatId) socket.to(chatId).emit("typing", { chatId, userId, name }); });
  socket.on("stopTyping", ({ chatId, userId }) => { if (chatId) socket.to(chatId).emit("stopTyping", { chatId, userId }); });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/providers", providerRoutes);
app.use("/api/requests", (req, res) => res.json({ message: "deprecated" }));
app.use("/api/payment", (req, res) => res.json({ ok: true }));
app.use("/api/payments", (req, res) => res.json({ ok: true }));
app.use("/api/bookings", bookingRoutes);
app.use("/api/products", productRoutes);
app.use("/api/users", userRoutes);
app.use("/api/categories", categoriesRoutes);
app.use("/api/users", uploadRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/chats", chatRoutes);
app.use("/api/wallet", walletRoutes);

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/providers", providerRoutes);
app.use("/api/v1/requests", (req, res) => res.json({ message: "deprecated" }));
app.use("/api/v1/payment", (req, res) => res.json({ ok: true }));
app.use("/api/v1/payments", (req, res) => res.json({ ok: true }));
app.use("/api/v1/bookings", bookingRoutes);
app.use("/api/v1/products", productRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/categories", categoriesRoutes);
app.use("/api/v1/users", uploadRoutes);
app.use("/api/v1/chat", chatRoutes);
app.use("/api/v1/chats", chatRoutes);
app.use("/api/v1/wallet", walletRoutes);

app.get("/api/v1/news", (req, res) => res.json({ items: [] }));
app.get(["/api/v1/posts", "/api/v1/blog"], (req, res) => res.json({ items: [] }));

app.use("/uploads", express.static(path.join(__dirname, "src", "uploads")));

app.get("/api/v1/health", (req, res) => res.json({ status: "ok" }));
app.get("/", (req, res) => res.send("SkillConnect API"));

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
