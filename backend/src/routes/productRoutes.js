import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { createProduct, listProducts, getProduct, updateProduct, deleteProduct } from "../controllers/productController.js";

const router = express.Router();

router.post("/", protect, createProduct);
router.get("/", listProducts);
router.get("/:id", getProduct);
router.put("/:id", protect, updateProduct);
router.delete("/:id", protect, deleteProduct);

export default router;
