import { useContext, useEffect, useState } from "react";
import API from "../api/axios.js";
import { AuthContext } from "../context/auth.js";

export default function ProviderProducts() {
  const { user } = useContext(AuthContext);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [editingId, setEditingId] = useState(null);
  const [name, setName] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [fullDescription, setFullDescription] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("");
  const [discountPrice, setDiscountPrice] = useState("");
  const [currency, setCurrency] = useState("NGN");
  const [stockQty, setStockQty] = useState("");
  const [stockStatus, setStockStatus] = useState("in_stock");
  const [status, setStatus] = useState("active");
  const [sku, setSku] = useState("");
  const [deliveryOptions, setDeliveryOptions] = useState({ pickup: false, delivery: false, nationwide: false });
  const [image1, setImage1] = useState("");
  const [image2, setImage2] = useState("");
  const [image3, setImage3] = useState("");

  const [filterCategory, setFilterCategory] = useState("");
  const [filterStockStatus, setFilterStockStatus] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [lastEditedId, setLastEditedId] = useState(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      if (!user?._id) return;
      setLoading(true);
      setError("");
      try {
        const { data } = await API.get(`/products?providerId=${user._id}`);
        const list = Array.isArray(data?.products) ? data.products : [];
        if (mounted) setItems(list);
      } catch (e) {
        if (mounted) setError(e?.response?.data?.message || "Failed to load products");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, [user?._id]);

  // After saving a product, ensure filters show all and scroll to the edited product
  useEffect(() => {
    if (!lastEditedId) return;
    // Reset filters to show everything
    setFilterCategory("");
    setFilterStockStatus("all");
    setFilterStatus("all");
    setSortBy("newest");

    const id = lastEditedId;
    const handle = setTimeout(() => {
      const el = document.getElementById(`provider-product-${id}`);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);

    return () => clearTimeout(handle);
  }, [lastEditedId]);

  function resetForm() {
    setEditingId(null);
    setName("");
    setShortDescription("");
    setFullDescription("");
    setCategory("");
    setPrice("");
    setDiscountPrice("");
    setCurrency("NGN");
    setStockQty("");
    setStockStatus("in_stock");
    setStatus("active");
    setSku("");
    setDeliveryOptions({ pickup: false, delivery: false, nationwide: false });
    setImage1("");
    setImage2("");
    setImage3("");
  }

  function startEdit(p) {
    setEditingId(p._id);
    setName(p.name || "");
    setShortDescription(p.shortDescription || "");
    setFullDescription(p.fullDescription || "");
    setCategory(p.category || "");
    setPrice(String(p.price ?? ""));
    setDiscountPrice(p.discountPrice != null ? String(p.discountPrice) : "");
    setCurrency(p.currency || "NGN");
    setStockQty(String(p.stockQty ?? ""));
    setStockStatus(p.stockStatus || "in_stock");
    setStatus(p.status || "active");
    setSku(p.sku || "");
    const opts = Array.isArray(p.deliveryOptions) ? p.deliveryOptions : [];
    setDeliveryOptions({
      pickup: opts.includes("pickup"),
      delivery: opts.includes("delivery"),
      nationwide: opts.includes("nationwide"),
    });
    const imgs = Array.isArray(p.images) ? p.images : [];
    setImage1(imgs[0] || "");
    setImage2(imgs[1] || "");
    setImage3(imgs[2] || "");
  }

  async function handleImageUpload(file, slot) {
    if (!user?._id || !file) return;
    try {
      const fd = new FormData();
      fd.append("image", file);
      const { data } = await API.post(`/users/${user._id}/product-image`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (data?.url) {
        if (slot === 1) setImage1(data.url);
        if (slot === 2) setImage2(data.url);
        if (slot === 3) setImage3(data.url);
      }
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to upload image");
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!user?._id) return;
    setSaving(true);
    setError("");
    try {
      const payload = {
        name,
        shortDescription,
        fullDescription,
        category,
        price: price ? Number(price) : undefined,
        discountPrice: discountPrice ? Number(discountPrice) : undefined,
        currency,
        stockQty: stockQty ? Number(stockQty) : undefined,
        stockStatus,
        status,
        sku,
        deliveryOptions: [
          deliveryOptions.pickup && "pickup",
          deliveryOptions.delivery && "delivery",
          deliveryOptions.nationwide && "nationwide",
        ].filter(Boolean),
        images: [image1, image2, image3].filter(Boolean),
      };
      if (editingId) {
        const { data } = await API.put(`/products/${editingId}`, payload);
        setItems((prev) => prev.map((p) => (p._id === editingId ? data.product : p)));
        setLastEditedId(data.product?._id || editingId);
      } else {
        const { data } = await API.post(`/products`, payload);
        setItems((prev) => [data.product, ...prev]);
        setLastEditedId(data.product?._id || null);
      }
      resetForm();
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to save product");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!id) return;
    if (!window.confirm("Delete this product?")) return;
    try {
      await API.delete(`/products/${id}`);
      setItems((prev) => prev.filter((p) => p._id !== id));
      if (editingId === id) resetForm();
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to delete product");
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h2 className="text-2xl font-semibold">My Products</h2>
      <p className="text-sm text-gray-500 mt-1">Manage the products you offer to clients.</p>

      <div className="mt-4 grid gap-3 sm:grid-cols-4 bg-white border border-emerald-200 rounded-lg p-3 text-xs shadow-md">
        <label className="grid gap-1">
          <span className="text-gray-600">Category filter</span>
          <input
            className="px-2 py-1.5 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs"
            placeholder="All categories"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          />
        </label>
        <label className="grid gap-1">
          <span className="text-gray-600">Stock status</span>
          <select
            className="px-2 py-1.5 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs"
            value={filterStockStatus}
            onChange={(e) => setFilterStockStatus(e.target.value)}
          >
            <option value="all">All</option>
            <option value="in_stock">In stock</option>
            <option value="low_stock">Low stock</option>
            <option value="out_of_stock">Out of stock</option>
            <option value="pre_order">Pre-order</option>
          </select>
        </label>
        <label className="grid gap-1">
          <span className="text-gray-600">Status</span>
          <select
            className="px-2 py-1.5 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </label>
        <label className="grid gap-1">
          <span className="text-gray-600">Sort by</span>
          <select
            className="px-2 py-1.5 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="newest">Newest</option>
            <option value="price_asc">Price: low → high</option>
            <option value="price_desc">Price: high → low</option>
            <option value="top_rated">Top rated</option>
          </select>
        </label>
      </div>

      <form onSubmit={handleSubmit} className="mt-4 grid gap-3 bg-white border border-emerald-200 rounded-lg p-4 shadow-md">
        <div className="grid sm:grid-cols-2 gap-3">
          <label className="grid gap-1 text-sm">
            <span className="text-gray-700">Name</span>
            <input
              className="px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="text-gray-700">Category</span>
            <input
              className="px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            />
          </label>
        </div>

        <div className="grid sm:grid-cols-3 gap-3">
          <label className="grid gap-1 text-sm">
            <span className="text-gray-700">Image URL 1 (cover)</span>
            <input
              className="px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              value={image1}
              onChange={(e) => setImage1(e.target.value)}
              placeholder="https://…"
            />
            <input
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp"
              className="mt-1 text-xs"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleImageUpload(f, 1);
              }}
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="text-gray-700">Image URL 2</span>
            <input
              className="px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              value={image2}
              onChange={(e) => setImage2(e.target.value)}
              placeholder="https://…"
            />
            <input
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp"
              className="mt-1 text-xs"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleImageUpload(f, 2);
              }}
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="text-gray-700">Image URL 3</span>
            <input
              className="px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              value={image3}
              onChange={(e) => setImage3(e.target.value)}
              placeholder="https://…"
            />
            <input
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp"
              className="mt-1 text-xs"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleImageUpload(f, 3);
              }}
            />
          </label>
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <label className="grid gap-1 text-sm">
            <span className="text-gray-700">Short description</span>
            <textarea
              className="px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[50px]"
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
              placeholder="One-paragraph summary clients see first"
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="text-gray-700">Full description</span>
            <textarea
              className="px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[70px]"
              value={fullDescription}
              onChange={(e) => setFullDescription(e.target.value)}
              placeholder="Bullets, features, usage, packaging info"
            />
          </label>
        </div>
        <div className="grid sm:grid-cols-4 gap-3">
          <label className="grid gap-1 text-sm">
            <span className="text-gray-700">Price</span>
            <input
              type="number"
              step="any"
              className="px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="text-gray-700">Discount price (optional)</span>
            <input
              type="number"
              step="any"
              className="px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              value={discountPrice}
              onChange={(e) => setDiscountPrice(e.target.value)}
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="text-gray-700">Currency</span>
            <select
              className="px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
            >
              <option value="NGN">Nigerian Naira (₦)</option>
              <option value="USD">US Dollar ($)</option>
              <option value="EUR">Euro (€)</option>
              <option value="GBP">British Pound (£)</option>
            </select>
          </label>
          <label className="grid gap-1 text-sm">
            <span className="text-gray-700">Stock quantity</span>
            <input
              type="number"
              className="px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              value={stockQty}
              onChange={(e) => setStockQty(e.target.value)}
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="text-gray-700">Stock status</span>
            <select
              className="px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              value={stockStatus}
              onChange={(e) => setStockStatus(e.target.value)}
            >
              <option value="in_stock">In stock</option>
              <option value="low_stock">Low stock</option>
              <option value="out_of_stock">Out of stock</option>
              <option value="pre_order">Pre-order</option>
            </select>
          </label>
          <label className="grid gap-1 text-sm">
            <span className="text-gray-700">SKU (optional)</span>
            <input
              className="px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              placeholder="e.g. SK-SHEABUTTER-01"
            />
          </label>
        </div>

        <div className="grid sm:grid-cols-3 gap-3">
          <fieldset className="grid gap-1 text-xs border border-gray-200 rounded-md p-2">
            <legend className="px-1 text-[11px] text-gray-600">Delivery options</legend>
            <label className="inline-flex items-center gap-2">
              <input type="checkbox" checked={deliveryOptions.pickup} onChange={(e) => setDeliveryOptions((prev) => ({ ...prev, pickup: e.target.checked }))} />
              <span>Pickup</span>
            </label>
            <label className="inline-flex items-center gap-2">
              <input type="checkbox" checked={deliveryOptions.delivery} onChange={(e) => setDeliveryOptions((prev) => ({ ...prev, delivery: e.target.checked }))} />
              <span>Delivery</span>
            </label>
            <label className="inline-flex items-center gap-2">
              <input type="checkbox" checked={deliveryOptions.nationwide} onChange={(e) => setDeliveryOptions((prev) => ({ ...prev, nationwide: e.target.checked }))} />
              <span>Nationwide delivery</span>
            </label>
          </fieldset>
        </div>

        <div className="grid sm:grid-cols-3 gap-3">
          <label className="grid gap-1 text-sm">
            <span className="text-gray-700">Status</span>
            <select
              className="px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </label>
        </div>
        <div className="flex items-center gap-3 pt-2">
          <button type="submit" disabled={saving} className="px-4 py-2 rounded-md bg-emerald-600 text-white hover:bg-emerald-700 transition disabled:opacity-70">
            {saving ? (editingId ? "Updating…" : "Adding…") : (editingId ? "Update product" : "Add product")}
          </button>
          {editingId && (
            <button type="button" onClick={resetForm} className="px-4 py-2 rounded-md border border-gray-300 hover:bg-gray-50 text-sm">
              Cancel edit
            </button>
          )}
          {error && <p className="text-rose-600 text-sm">{error}</p>}
        </div>
      </form>

      <section className="mt-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Your products</h3>
        {loading && <p className="text-sm text-gray-500">Loading products…</p>}
        {!loading && items.length === 0 && <p className="text-sm text-gray-500">You have not added any products yet.</p>}
        <div className="mt-2 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items
            .filter((p) => !filterCategory || (p.category || "").toLowerCase().includes(filterCategory.toLowerCase()))
            .filter((p) => filterStockStatus === "all" || p.stockStatus === filterStockStatus)
            .filter((p) => filterStatus === "all" || p.status === filterStatus)
            .sort((a, b) => {
              if (sortBy === "price_asc") return (a.price || 0) - (b.price || 0);
              if (sortBy === "price_desc") return (b.price || 0) - (a.price || 0);
              if (sortBy === "top_rated") {
                const ar = a.ratingAvg || 0;
                const br = b.ratingAvg || 0;
                if (br !== ar) return br - ar;
                return (b.ratingCount || 0) - (a.ratingCount || 0);
              }
              return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            })
            .map((p) => (
            <div
              key={p._id}
              id={`provider-product-${p._id}`}
              className="rounded-lg border border-emerald-200 bg-white p-3 flex flex-col justify-between shadow-md"
            >
              <div className="min-w-0 flex-1">
                {Array.isArray(p.images) && p.images.length > 0 && (
                  <div className="mb-2 flex gap-1 overflow-hidden rounded-md">
                    <img src={p.images[0]} alt={p.name} className="h-24 w-full object-cover rounded-md" />
                  </div>
                )}
                <div className="text-sm font-semibold text-gray-800 break-words flex items-center justify-between gap-2">
                  <span className="truncate">{p.name}</span>
                  {p.productCode && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-600 border border-gray-200 flex-shrink-0">{p.productCode}</span>
                  )}
                </div>
                {p.category && <div className="text-xs text-gray-500 mt-0.5">{p.category}</div>}
                {p.shortDescription && <div className="text-xs text-gray-600 mt-1 line-clamp-2 break-words">{p.shortDescription}</div>}
                <div className="mt-2 text-xs flex flex-wrap items-center gap-2">
                  {typeof p.price === "number" && (
                    <div className="flex items-baseline gap-1">
                      {typeof p.discountPrice === "number" && p.discountPrice < p.price ? (
                        <>
                          <span className="text-[11px] font-semibold text-emerald-700">
                            ₦{p.discountPrice.toLocaleString()}
                          </span>
                          <span className="text-[10px] text-gray-400 line-through">
                            ₦{p.price.toLocaleString()}
                          </span>
                          <span className="text-[10px] px-1 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                            -{Math.round(((p.price - p.discountPrice) / p.price) * 100)}%
                          </span>
                        </>
                      ) : (
                        <span className="text-[11px] font-semibold text-gray-800">₦{p.price.toLocaleString()}</span>
                      )}
                    </div>
                  )}
                  {p.sku && (
                    <span className="px-2 py-0.5 rounded-full bg-gray-50 border border-gray-200 text-[10px] text-gray-600">SKU: {p.sku}</span>
                  )}
                  {typeof p.ratingAvg === "number" && (p.ratingCount || 0) > 0 && (
                    <span className="flex items-center gap-1 text-[10px] text-amber-600">
                      <span className="text-[11px]">★</span>
                      <span>{p.ratingAvg.toFixed(1)} ({p.ratingCount})</span>
                    </span>
                  )}
                </div>
                <div className="mt-2 text-[10px] flex flex-wrap gap-2 items-center">
                  {typeof p.stockQty === "number" && (
                    <span className="px-2 py-0.5 rounded-full bg-gray-50 border border-gray-200 text-gray-700">
                      {p.stockQty} in stock
                    </span>
                  )}
                  {p.stockStatus && (
                    <span className={`px-2 py-0.5 rounded-full border ${p.stockStatus === "out_of_stock" ? "bg-rose-50 border-rose-200 text-rose-700" : p.stockStatus === "low_stock" ? "bg-amber-50 border-amber-200 text-amber-700" : "bg-emerald-50 border-emerald-200 text-emerald-700"}`}>
                      {p.stockStatus.replace("_", " ")}
                    </span>
                  )}
                  <span className={`px-2 py-0.5 rounded-full border ${p.status === "active" ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-gray-50 border-gray-200 text-gray-600"}`}>
                    {p.status || "inactive"}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between gap-2 mt-3">
                <button
                  type="button"
                  onClick={() => startEdit(p)}
                  className="px-3 py-1 text-xs rounded-md border border-gray-300 hover:bg-gray-50 flex-1 text-center"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(p._id)}
                  className="px-3 py-1 text-xs rounded-md border border-rose-600 text-rose-700 hover:bg-rose-50 flex-1 text-center"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
