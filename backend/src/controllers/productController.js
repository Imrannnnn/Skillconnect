import Product from "../models/product.js";

// Create a new product for a provider
export const createProduct = async (req, res) => {
  try {
    const providerId = req.user?._id || req.body.providerId;
    if (!providerId) return res.status(400).json({ message: "providerId required" });

    const {
      name,
      shortDescription,
      fullDescription,
      category,
      price,
      discountPrice,
      currency,
      stockQty,
      stockStatus,
      sku,
      images,
      deliveryOptions,
      deliveryFee,
      deliveryEta,
      variants,
      status,
      visibility,
      productCode,
    } = req.body;

    if (!name || price == null) return res.status(400).json({ message: "name and price are required" });

    const code = productCode || `P-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

    const product = await Product.create({
      providerId,
      productCode: code,
      name,
      shortDescription,
      fullDescription,
      category,
      price,
      discountPrice,
      currency,
      stockQty,
      stockStatus,
      sku,
      images,
      deliveryOptions,
      deliveryFee,
      deliveryEta,
      variants,
      status,
      visibility,
    });
    res.status(201).json({ product });
  } catch (error) {
    res.status(500).json({ message: "Failed to create product", error });
  }
};

// List products, optionally filtered by providerId
export const listProducts = async (req, res) => {
  try {
    const { providerId, status, visibility, category, stockStatus, sort } = req.query;
    const filter = {};
    if (providerId) filter.providerId = providerId;
    if (status) filter.status = status;
    if (visibility) filter.visibility = visibility;
    if (category) filter.category = category;
    if (stockStatus) filter.stockStatus = stockStatus;

    let query = Product.find(filter);
    // Basic sorting options
    if (sort === "price_asc") query = query.sort({ price: 1 });
    else if (sort === "price_desc") query = query.sort({ price: -1 });
    else if (sort === "top_rated") query = query.sort({ ratingAvg: -1, ratingCount: -1 });
    else query = query.sort({ createdAt: -1 });

    const products = await query;
    res.json({ products });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch products", error });
  }
};

export const getProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json({ product });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch product", error });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const allowed = [
      "name",
      "shortDescription",
      "fullDescription",
      "category",
      "price",
      "discountPrice",
      "currency",
      "stockQty",
      "stockStatus",
      "sku",
      "images",
      "deliveryOptions",
      "deliveryFee",
      "deliveryEta",
      "variants",
      "status",
      "visibility",
    ];
    const update = {};
    for (const k of allowed) if (req.body[k] !== undefined) update[k] = req.body[k];
    const product = await Product.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json({ product });
  } catch (error) {
    res.status(500).json({ message: "Failed to update product", error });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete product", error });
  }
};
