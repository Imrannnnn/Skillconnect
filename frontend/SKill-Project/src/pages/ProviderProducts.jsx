import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios.js";
import { AuthContext } from "../context/auth.js";

export default function ProviderProducts() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
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
  const [viewMode, setViewMode] = useState("grid");
  const [lastEditedId, setLastEditedId] = useState(null);

  useEffect(() => {
    if (!user) return;
    const mode = user.providerMode;
    if (mode && mode !== "product" && mode !== "both") {
      navigate("/provider/dashboard", { replace: true });
    }
  }, [user, navigate]);

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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">My Products</h1>
          <p className="text-slate-500 font-medium mt-1 italic text-sm">Elevate your storefront with premium listings</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
          </div>

          <div className="flex items-center gap-4 bg-white p-2 rounded-2xl shadow-sm border border-slate-100 hidden sm:flex">
            <div className="px-4 py-2 text-center border-r border-slate-100">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total</p>
              <p className="text-xl font-black text-slate-900">{items.length}</p>
            </div>
            <div className="px-4 py-2 text-center">
              <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Active</p>
              <p className="text-xl font-black text-emerald-600">{items.filter(i => i.status === 'active').length}</p>
            </div>
          </div>
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-4 bg-slate-900 text-white rounded-3xl p-6 shadow-2xl shadow-slate-200">
        <label className="grid gap-2">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Category</span>
          <input
            className="px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:ring-2 focus:ring-emerald-500 focus:outline-none text-xs transition-all"
            placeholder="All categories"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          />
        </label>
        <label className="grid gap-2">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Inventory</span>
          <select
            className="px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none text-xs transition-all"
            value={filterStockStatus}
            onChange={(e) => setFilterStockStatus(e.target.value)}
          >
            <option value="all">All Inventory</option>
            <option value="in_stock">In Stock</option>
            <option value="low_stock">Low Stock</option>
            <option value="out_of_stock">Out of Stock</option>
            <option value="pre_order">Pre-order</option>
          </select>
        </label>
        <label className="grid gap-2">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Status</span>
          <select
            className="px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none text-xs transition-all"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">Every Status</option>
            <option value="active">Active Only</option>
            <option value="inactive">Paused</option>
          </select>
        </label>
        <label className="grid gap-2">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Sort</span>
          <select
            className="px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none text-xs transition-all"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="newest">Recently Added</option>
            <option value="price_asc">Price Low-High</option>
            <option value="price_desc">Price High-Low</option>
            <option value="top_rated">Most Popular</option>
          </select>
        </label>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-[2rem] p-8 shadow-2xl shadow-slate-200 border border-slate-100 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-bl-[100%] opacity-50 -z-10" />

        <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white">
            {editingId ? "✎" : "+"}
          </div>
          {editingId ? "Refine Product" : "Launch New Product"}
        </h3>

        <div className="grid lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="grid gap-4">
              <label className="grid gap-1.5">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Product Name</span>
                <input
                  className="px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all text-sm outline-none"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Premium Shea Butter"
                  required
                />
              </label>
              <label className="grid gap-1.5">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Category</span>
                <input
                  className="px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all text-sm outline-none"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="Skincare, Food, etc."
                />
              </label>
            </div>

            <div className="grid gap-4">
              <label className="grid gap-1.5">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Quick Pitch</span>
                <textarea
                  className="px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all text-sm outline-none min-h-[80px]"
                  value={shortDescription}
                  onChange={(e) => setShortDescription(e.target.value)}
                  placeholder="The first thing clients see..."
                />
              </label>
              <label className="grid gap-1.5">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Full Story</span>
                <textarea
                  className="px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all text-sm outline-none min-h-[140px]"
                  value={fullDescription}
                  onChange={(e) => setFullDescription(e.target.value)}
                  placeholder="Deep dive into features, benefits, and specifics..."
                />
              </label>
            </div>
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <label className="grid gap-1.5">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Price</span>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">₦</span>
                  <input
                    type="number"
                    className="w-full pl-8 pr-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all text-sm outline-none font-bold text-emerald-700"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    required
                  />
                </div>
              </label>
              <label className="grid gap-1.5">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Sale Price</span>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">₦</span>
                  <input
                    type="number"
                    className="w-full pl-8 pr-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 focus:bg-white focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 transition-all text-sm outline-none font-bold text-rose-600"
                    value={discountPrice}
                    onChange={(e) => setDiscountPrice(e.target.value)}
                    placeholder="Optional"
                  />
                </div>
              </label>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <label className="grid gap-1.5">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Inventory Level</span>
                <input
                  type="number"
                  className="px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all text-sm outline-none"
                  value={stockQty}
                  onChange={(e) => setStockQty(e.target.value)}
                  placeholder="Qty"
                />
              </label>
              <label className="grid gap-1.5">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Stock Status</span>
                <select
                  className="px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all text-sm outline-none"
                  value={stockStatus}
                  onChange={(e) => setStockStatus(e.target.value)}
                >
                  <option value="in_stock">In Stock</option>
                  <option value="low_stock">Low Stock</option>
                  <option value="out_of_stock">Out of Stock</option>
                  <option value="pre_order">Pre-order</option>
                </select>
              </label>
            </div>

            <div className="p-5 rounded-[1.5rem] bg-slate-50 border border-slate-100 flex flex-col gap-4">
              <span className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Product Media</span>
              <div className="grid grid-cols-3 gap-3">
                {[1, 2, 3].map(slot => (
                  <div key={slot} className="relative aspect-square rounded-xl bg-white border-2 border-dashed border-slate-200 hover:border-emerald-400 transition-all flex flex-col items-center justify-center overflow-hidden group">
                    {(slot === 1 ? image1 : slot === 2 ? image2 : image3) ? (
                      <>
                        <img src={slot === 1 ? image1 : slot === 2 ? image2 : image3} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <span className="text-[10px] text-white font-bold">Replace</span>
                        </div>
                      </>
                    ) : (
                      <div className="text-xl text-slate-300 group-hover:text-emerald-500 transition-colors">+</div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleImageUpload(f, slot);
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-between gap-6 border-t border-slate-50 pt-8">
          <div className="flex items-center gap-8">
            <fieldset className="flex items-center gap-6">
              {[
                { key: 'pickup', label: 'Local Pickup' },
                { key: 'delivery', label: 'Express' },
                { key: 'nationwide', label: 'Nationwide' }
              ].map(opt => (
                <label key={opt.key} className="flex items-center gap-2 cursor-pointer group">
                  <div className={`w-5 h-5 rounded-md border-2 transition-all flex items-center justify-center ${deliveryOptions[opt.key] ? 'border-emerald-600 bg-emerald-600' : 'border-slate-300 group-hover:border-emerald-400'}`}>
                    {deliveryOptions[opt.key] && <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>}
                  </div>
                  <input type="checkbox" className="hidden" checked={deliveryOptions[opt.key]} onChange={(e) => setDeliveryOptions(prev => ({ ...prev, [opt.key]: e.target.checked }))} />
                  <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">{opt.label}</span>
                </label>
              ))}
            </fieldset>

            <div className="h-4 w-[1px] bg-slate-200 hidden sm:block" />

            <label className="flex items-center gap-3">
              <span className="text-xs font-bold text-slate-500 uppercase">Visibility</span>
              <select
                className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-bold border-none outline-none"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="active">Visible</option>
                <option value="inactive">Hidden</option>
              </select>
            </label>
          </div>

          <div className="flex items-center gap-4">
            {editingId && (
              <button type="button" onClick={resetForm} className="px-6 py-3 rounded-2xl text-slate-500 font-bold text-sm hover:text-slate-800 transition-colors">
                Discard Changes
              </button>
            )}
            <button
              type="submit"
              disabled={saving}
              className="px-10 py-3.5 rounded-[1.5rem] bg-slate-900 text-white text-sm font-black hover:bg-emerald-600 hover:shadow-xl hover:shadow-emerald-200 transition-all active:scale-95 disabled:opacity-50"
            >
              {saving ? "Processing..." : (editingId ? "Save Evolution" : "Launch Product")}
            </button>
          </div>
        </div>

        {error && <div className="mt-4 p-4 rounded-xl bg-rose-50 text-rose-600 text-xs font-bold border border-rose-100">{error}</div>}
      </form>

      <section className="space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <h3 className="text-2xl font-black text-slate-900">Showcase</h3>
          <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">{items.length} Products Found</div>
        </div>

        {loading && (
          <div className="py-20 flex flex-col items-center justify-center gap-4">
            <div className="w-12 h-12 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin" />
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Gathering your items...</p>
          </div>
        )}

        {!loading && items.length === 0 && (
          <div className="py-20 text-center bg-slate-50 rounded-[3rem] border border-dashed border-slate-200">
            <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">No products found</p>
            <p className="text-slate-500 text-xs mt-2">Start your journey by adding your first product above.</p>
          </div>
        )}

        <div className={viewMode === "grid" ? "grid gap-8 sm:grid-cols-2 lg:grid-cols-3" : "flex flex-col gap-4"}>
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
              viewMode === "grid" ? (
                <div
                  key={p._id}
                  id={`provider-product-${p._id}`}
                  className="group bg-white rounded-[2.5rem] border border-slate-100 p-5 flex flex-col shadow-xl shadow-slate-200/40 hover:shadow-2xl hover:shadow-emerald-100/50 transition-all duration-500 hover:-translate-y-2"
                >
                  <div className="relative aspect-[4/3] rounded-[2rem] overflow-hidden mb-5">
                    {Array.isArray(p.images) && p.images.length > 0 ? (
                      <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                    ) : (
                      <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-300 font-black italic">NO IMAGE</div>
                    )}
                    <div className="absolute top-4 right-4 flex flex-col gap-2">
                      <div className={`px-3 py-1.5 rounded-full backdrop-blur-md text-[10px] font-black uppercase tracking-wider shadow-lg ${p.status === 'active' ? 'bg-emerald-500/90 text-white' : 'bg-slate-900/90 text-white'}`}>
                        {p.status}
                      </div>
                      {p.stockQty <= 5 && (
                        <div className="px-3 py-1.5 rounded-full bg-rose-500 text-white text-[10px] font-black uppercase tracking-wider shadow-lg">
                          Only {p.stockQty} Left
                        </div>
                      )}
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-6">
                      <div className="flex gap-2">
                        <button onClick={() => startEdit(p)} className="flex-1 bg-white text-slate-900 py-3 rounded-2xl font-black text-xs hover:bg-emerald-500 hover:text-white transition-all active:scale-95 shadow-lg">EDIT</button>
                        <button onClick={() => handleDelete(p._id)} className="flex-1 bg-rose-600 text-white py-3 rounded-2xl font-black text-xs hover:bg-rose-700 transition-all active:scale-95 shadow-lg">DELETE</button>
                      </div>
                    </div>
                  </div>

                  <div className="px-2 space-y-4">
                    <div className="space-y-1">
                      <div className="flex items-start justify-between gap-4">
                        <h4 className="text-xl font-black text-slate-900 truncate leading-tight">{p.name}</h4>
                        <div className="text-2xl font-black text-emerald-600 leading-tight">₦{(p.discountPrice || p.price)?.toLocaleString()}</div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">{p.category || 'General'}</span>
                        {p.discountPrice && p.discountPrice < p.price && (
                          <span className="text-xs text-slate-400 line-through font-bold">₦{p.price.toLocaleString()}</span>
                        )}
                      </div>
                    </div>

                    <p className="text-sm text-slate-500 font-medium line-clamp-2 leading-relaxed min-h-[2.5rem]">{p.shortDescription}</p>

                    <div className="flex items-center justify-between pt-2">
                      <div className="flex items-center gap-1.5">
                        {p.ratingCount > 0 ? (
                          <div className="flex items-center gap-1">
                            <span className="text-amber-400 text-lg">★</span>
                            <span className="text-sm font-black text-slate-900">{p.ratingAvg.toFixed(1)}</span>
                            <span className="text-xs font-bold text-slate-400">({p.ratingCount})</span>
                          </div>
                        ) : (
                          <span className="text-[10px] font-black text-slate-300 uppercase italic tracking-widest">Unrated</span>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        {p.deliveryOptions?.includes('delivery') && <span title="Delivery Available" className="text-slate-400 hover:text-emerald-500 transition-colors">🚚</span>}
                        {p.deliveryOptions?.includes('pickup') && <span title="Pickup Available" className="text-slate-400 hover:text-emerald-500 transition-colors">🏪</span>}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div
                  key={p._id}
                  id={`provider-product-${p._id}`}
                  className="group flex flex-col sm:flex-row items-center gap-4 p-4 bg-white rounded-3xl border border-slate-100 shadow-lg shadow-slate-100/50 hover:shadow-xl hover:shadow-emerald-100/30 transition-all hover:border-emerald-100"
                >
                  <div className="w-full sm:w-32 h-32 rounded-2xl overflow-hidden flex-shrink-0 relative">
                    {Array.isArray(p.images) && p.images.length > 0 ? (
                      <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-300 text-xs font-bold">No Image</div>
                    )}
                  </div>

                  <div className="flex-1 w-full text-center sm:text-left">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                      <h4 className="text-lg font-bold text-slate-900">{p.name}</h4>
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider w-fit mx-auto sm:mx-0 ${p.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                        {p.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 line-clamp-2 mb-3 max-w-xl">{p.shortDescription}</p>
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{p.stockQty} Left</span>
                      <span className="text-slate-200">|</span>
                      <span className="text-emerald-600 font-black">₦{p.price.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="flex flex-row sm:flex-col gap-2 w-full sm:w-auto">
                    <button
                      onClick={() => startEdit(p)}
                      className="flex-1 sm:flex-none px-6 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(p._id)}
                      className="flex-1 sm:flex-none px-6 py-2 rounded-xl bg-white border border-rose-100 text-xs font-bold text-rose-600 hover:bg-rose-50 hover:border-rose-200 transition-all"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )
            ))}
        </div>
      </section>
    </div>
  );
}
