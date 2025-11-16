import express from "express";
import { getMyWallet, getMyTransactions, initiateFundWallet, handlePaystackWebhook } from "../controllers/walletController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/me", protect, getMyWallet);
router.get("/transactions", protect, getMyTransactions);
router.post("/fund/initiate", protect, initiateFundWallet);
router.post("/webhook/paystack", handlePaystackWebhook);

export default router;
