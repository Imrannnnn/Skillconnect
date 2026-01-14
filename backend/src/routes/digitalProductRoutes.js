import express from "express";
import multer from "multer";
import { protect } from "../middleware/authMiddleware.js";
import {
    createProduct,
    getProducts,
    getProduct,
    deleteProduct,
    getMyProducts,
    buyProduct,
    verifyPurchase,
    getMyLibrary,
    downloadProduct
} from "../controllers/digitalProductController.js";

const router = express.Router();
import { uploadDigitalProduct } from "../middleware/cloudinaryMiddleware.js";

// Note: Removed local multer setup as we now use cloudinary middleware exclusively


// Pubic
router.get("/", getProducts);
router.get("/:id", getProduct);

// Seller Management
router.post("/", protect, uploadDigitalProduct.fields([{ name: "file", maxCount: 1 }, { name: "cover", maxCount: 1 }]), createProduct);
router.get("/seller/my-products", protect, getMyProducts);
router.delete("/:id", protect, deleteProduct);
// router.put("/:id") - Update (omitted for brevity, can enable if needed)

// Purchase & Download
router.post("/:id/buy", protect, buyProduct);
router.get("/payments/verify/:reference", protect, verifyPurchase);
router.get("/buyer/my-library", protect, getMyLibrary);
router.get("/purchase/:purchaseId/download", protect, downloadProduct); // Using /purchase/:id/download to distinct from product id

export default router;
