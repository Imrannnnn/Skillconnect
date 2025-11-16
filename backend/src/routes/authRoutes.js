import express from "express";
import { register, login, forgotPassword, resetPassword, verifyEmail } from "../controllers/authControllers.js";
const router = express.Router();
router.post("/register", register);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.get("/verify/:token", verifyEmail);
export default router;
