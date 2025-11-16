import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
  providerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  // Unique product code visible in emails / UI (separate from _id)
  productCode: { type: String, unique: true, required: true },
  name: { type: String, required: true },
  category: String,

  // Descriptions
  shortDescription: String,
  fullDescription: String,

  // Pricing
  price: { type: Number, required: true },
  discountPrice: Number,
  currency: { type: String, default: "NGN" },

  // Inventory
  stockQty: { type: Number, default: 0 },
  stockStatus: { type: String, enum: ["in_stock", "low_stock", "out_of_stock", "pre_order"], default: "in_stock" },
  sku: String,

  // Images (first image is cover)
  images: [String],

  // Delivery
  deliveryOptions: [{ type: String }], // e.g. ["pickup","delivery","nationwide"]
  deliveryFee: Number,
  deliveryEta: String, // e.g. "2–5 business days"

  // Variants (optional)
  variants: [{
    name: String, // e.g. "Size" or "Flavor"
    value: String, // e.g. "500ml"
    price: Number,
    stockQty: Number,
  }],

  // Reviews summary (detailed reviews can be separate later)
  ratingAvg: { type: Number, default: 0 },
  ratingCount: { type: Number, default: 0 },

  // Simple analytics
  viewCount: { type: Number, default: 0 },
  orderClickCount: { type: Number, default: 0 },

  // Administrative
  status: { type: String, enum: ["active", "inactive", "deleted"], default: "active" },
  visibility: { type: String, enum: ["public", "hidden", "draft"], default: "public" },
}, { timestamps: true });

export default mongoose.model("Product", productSchema);
