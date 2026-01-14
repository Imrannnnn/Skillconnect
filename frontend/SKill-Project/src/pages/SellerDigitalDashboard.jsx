import { useState, useEffect } from "react";
import API from "../api/axios";
import { Link } from "react-router-dom";
import { Copy, Plus, Trash2, FileText, DollarSign, Download, Eye, MoreHorizontal, Image as ImageIcon } from "lucide-react";
import { useToast } from "../components/toast";

export default function SellerDigitalDashboard() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const { notify } = useToast();

    // Create Modal State
    const [showModal, setShowModal] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [formData, setFormData] = useState({ name: "", description: "", price: "", currency: "NGN", file: null, cover: null });

    // Stats
    const totalSales = products.reduce((acc, p) => acc + (p.salesCount || 0), 0);
    const totalEarnings = products.reduce((acc, p) => acc + (p.totalEarnings || 0), 0);

    useEffect(() => {
        loadProducts();
    }, []);

    async function loadProducts() {
        try {
            const { data } = await API.get("/digital-products/seller/my-products");
            setProducts(data.products || []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }

    async function handleCreate(e) {
        e.preventDefault();
        if (!formData.file) return notify("Please select a file", { type: "error" });

        setUploading(true);
        try {
            const fd = new FormData();
            fd.append("name", formData.name);
            fd.append("description", formData.description);
            fd.append("price", formData.price);
            fd.append("currency", formData.currency);
            fd.append("file", formData.file);
            if (formData.cover) fd.append("cover", formData.cover);

            await API.post("/digital-products", fd, {
                headers: { "Content-Type": "multipart/form-data" }
            });

            setShowModal(false);
            setFormData({ name: "", description: "", price: "", currency: "NGN", file: null, cover: null });
            loadProducts(); // refresh
            notify("Product published successfully!", { type: "success" });
        } catch (e) {
            notify(e?.response?.data?.message || "Upload failed", { type: "error" });
        } finally {
            setUploading(false);
        }
    }

    async function handleDelete(id) {
        if (!confirm("Are you sure you want to delete this product?")) return;
        try {
            await API.delete(`/digital-products/${id}`);
            setProducts(prev => prev.filter(p => p._id !== id));
            notify("Product deleted", { type: "success" });
        } catch (error) {
            notify(error?.response?.data?.message || "Failed to delete", { type: "error" });
        }
    }

    function handleCopyLink(id) {
        const url = `${window.location.origin}/digital-products/${id}`;
        navigator.clipboard.writeText(url);
        notify("Link copied to clipboard", { type: "success" });
    }

    return (
        <div className="min-h-screen bg-gray-50/50 pb-20">
            {/* Header Section */}
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Digital Dashboard</h1>
                            <p className="mt-1 text-sm text-gray-500">Manage and sell your digital assets directly.</p>
                        </div>
                        <button
                            onClick={() => setShowModal(true)}
                            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition shadow-sm hover:shadow-md"
                        >
                            <Plus className="w-4 h-4" />
                            Create New Product
                        </button>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
                        <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
                            <div className="flex items-center gap-3 mb-1">
                                <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600">
                                    <FileText className="w-4 h-4" />
                                </div>
                                <span className="text-xs font-medium text-emerald-800 uppercase tracking-wide">Total Products</span>
                            </div>
                            <p className="text-2xl font-bold text-gray-900">{products.length}</p>
                        </div>
                        <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                            <div className="flex items-center gap-3 mb-1">
                                <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                                    <DollarSign className="w-4 h-4" />
                                </div>
                                <span className="text-xs font-medium text-blue-800 uppercase tracking-wide">Total Earnings</span>
                            </div>
                            <p className="text-2xl font-bold text-gray-900">₦{totalEarnings.toLocaleString()}</p>
                        </div>
                        <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
                            <div className="flex items-center gap-3 mb-1">
                                <div className="p-2 bg-purple-100 rounded-lg text-purple-600">
                                    <Download className="w-4 h-4" />
                                </div>
                                <span className="text-xs font-medium text-purple-800 uppercase tracking-wide">Total Sales</span>
                            </div>
                            <p className="text-2xl font-bold text-gray-900">{totalSales}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Product List */}
                <div className="space-y-6">
                    <h2 className="text-lg font-semibold text-gray-800">Your Products</h2>

                    {loading ? (
                        <div className="text-center py-20">
                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600 mx-auto"></div>
                        </div>
                    ) : products.length === 0 ? (
                        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                                <FileText className="w-8 h-8" />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900">No products yet</h3>
                            <p className="text-gray-500 mt-1 max-w-sm mx-auto">Start selling ebooks, templates, software, or media by creating your first product.</p>
                            <button
                                onClick={() => setShowModal(true)}
                                className="mt-6 inline-flex items-center gap-2 text-emerald-600 hover:text-emerald-700 font-medium"
                            >
                                <Plus className="w-4 h-4" /> Create Product
                            </button>
                        </div>
                    ) : (
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {products.map((product) => (
                                <div key={product._id} className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition overflow-hidden flex flex-col group">
                                    <div className="aspect-[16/9] bg-gray-100 relative overflow-hidden">
                                        {product.coverImage ? (
                                            <img src={product.coverImage} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                                        ) : (
                                            <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                                                <ImageIcon className="w-10 h-10 mb-2 opacity-50" />
                                                <span className="text-xs">No Cover</span>
                                            </div>
                                        )}
                                        <div className="absolute top-2 right-2 flex gap-2">
                                            <span className={`px-2 py-1 rounded-md text-[10px] uppercase font-bold tracking-wider backdrop-blur-md ${product.isActive ? 'bg-emerald-500/90 text-white' : 'bg-gray-500/90 text-white'}`}>
                                                {product.isActive ? "Active" : "Archived"}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="p-5 flex-1 flex flex-col">
                                        <div className="flex justify-between items-start mb-2">
                                            <h3 className="text-base font-semibold text-gray-900 line-clamp-1" title={product.name}>{product.name}</h3>
                                            <span className="text-sm font-bold text-gray-900">₦{product.price?.toLocaleString()}</span>
                                        </div>

                                        <p className="text-sm text-gray-500 line-clamp-2 mb-4 flex-1">{product.description || "No description."}</p>

                                        <div className="grid grid-cols-2 gap-4 py-3 border-t border-gray-100 mb-4">
                                            <div>
                                                <p className="text-[10px] uppercase text-gray-400 font-semibold tracking-wider">Sales</p>
                                                <p className="font-medium text-gray-900">{product.salesCount || 0}</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] uppercase text-gray-400 font-semibold tracking-wider">Revenue</p>
                                                <p className="font-medium text-emerald-600">₦{(product.totalEarnings || 0).toLocaleString()}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 pt-1 mt-auto">
                                            <button
                                                onClick={() => handleCopyLink(product._id)}
                                                className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 text-sm font-medium rounded-lg transition border border-gray-200"
                                            >
                                                <Copy className="w-3.5 h-3.5" /> Copy Link
                                            </button>
                                            <button
                                                onClick={() => handleDelete(product._id)}
                                                className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition border border-transparent hover:border-rose-100"
                                                title="Delete Product"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Modern Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity" onClick={() => setShowModal(false)} />
                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto transform transition-all">
                        <div className="sticky top-0 bg-white/80 backdrop-blur-md px-6 py-4 border-b border-gray-100 flex justify-between items-center z-10">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">New Product</h3>
                                <p className="text-xs text-gray-500">Share your value with the world.</p>
                            </div>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition">
                                <span className="text-xl">&times;</span>
                            </button>
                        </div>

                        <form onSubmit={handleCreate} className="p-6 space-y-6">
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-4 md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
                                    <input
                                        required
                                        className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition text-sm"
                                        placeholder="e.g. Ultimate Web Dev Guide"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-2.5 text-gray-500 text-sm">₦</span>
                                            <input
                                                type="number"
                                                required
                                                className="w-full pl-8 pr-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition text-sm"
                                                placeholder="0.00"
                                                value={formData.price}
                                                onChange={e => setFormData({ ...formData, price: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                                        <select
                                            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition text-sm bg-white"
                                            value={formData.currency}
                                            onChange={e => setFormData({ ...formData, currency: e.target.value })}
                                        >
                                            <option value="NGN">NGN (Naira)</option>
                                            <option value="USD">USD (Dollar)</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Cover Image</label>
                                    <div className="mt-1 flex justify-center px-4 py-4 border-2 border-gray-300 border-dashed rounded-lg hover:bg-gray-50 transition cursor-pointer relative group h-[108px] items-center">
                                        <div className="space-y-1 text-center w-full">
                                            {formData.cover ? (
                                                <div className="flex items-center justify-center gap-2">
                                                    <span className="text-emerald-600 font-medium text-sm truncate max-w-[150px]">{formData.cover.name}</span>
                                                    <button type="button" onClick={(e) => { e.preventDefault(); setFormData({ ...formData, cover: null }) }} className="text-rose-500 hover:text-rose-700 font-bold">&times;</button>
                                                </div>
                                            ) : (
                                                <>
                                                    <ImageIcon className="mx-auto h-8 w-8 text-gray-400 group-hover:text-emerald-500 transition" />
                                                    <div className="flex text-xs text-gray-600 justify-center">
                                                        <label htmlFor="cover-upload" className="relative cursor-pointer rounded-md font-medium text-emerald-600 hover:text-emerald-500 focus-within:outline-none">
                                                            <span>Upload Cover</span>
                                                            <input id="cover-upload" type="file" className="sr-only" accept="image/*" onChange={e => setFormData({ ...formData, cover: e.target.files[0] })} />
                                                        </label>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4 md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Product File (The asset)</label>
                                    <div className="relative">
                                        <input
                                            type="file"
                                            required={!formData.file}
                                            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 transition cursor-pointer border border-gray-200 rounded-lg"
                                            onChange={e => setFormData({ ...formData, file: e.target.files[0] })}
                                        />
                                        <p className="text-xs text-gray-500 mt-1 pl-1">Supports PDF, Zip, Video, etc. (Max 50MB)</p>
                                    </div>
                                </div>

                                <div className="space-y-4 md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                    <textarea
                                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition text-sm"
                                        rows="4"
                                        placeholder="Describe what's inside... What will the user get?"
                                        value={formData.description}
                                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="pt-2 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700 font-medium text-sm transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={uploading}
                                    className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm hover:shadow font-medium text-sm transition disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {uploading ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Publishing...
                                        </>
                                    ) : "Publish Product"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
