import { useState, useEffect } from "react";
import API from "../api/axios";

export default function SellerDigitalDashboard() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    // Create Modal State
    const [showModal, setShowModal] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [formData, setFormData] = useState({ name: "", description: "", price: "", currency: "NGN", file: null, cover: null });

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
        if (!formData.file) return alert("Please select a file");

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
        } catch (e) {
            alert(e?.response?.data?.message || "Upload failed");
        } finally {
            setUploading(false);
        }
    }

    async function handleDelete(id) {
        if (!confirm("Are you sure you want to delete this product?")) return;
        try {
            await API.delete(`/digital-products/${id}`);
            setProducts(prev => prev.filter(p => p._id !== id));
        } catch (error) {
            alert(error?.response?.data?.message || "Failed to delete");
        }
    }

    function handleCopyLink(id) {
        const url = `${window.location.origin}/digital-products/${id}`;
        navigator.clipboard.writeText(url);
        alert("Product link copied to clipboard!");
    }

    return (
        <div className="max-w-6xl mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-8">
                <div className="p-4 sm:p-6 lg:p-8 min-h-screen">
                    <header className="mb-8">
                        <h1 className="text-2xl font-bold text-gray-900">Seller Dashboard</h1>
                        <p className="text-gray-600">Manage your digital products and sales.</p>
                    </header>          </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm flex items-center gap-2"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                    Upload New Product
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-emerald-100 overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 text-gray-600 border-b border-gray-200 uppercase font-medium text-xs">
                        <tr>
                            <th className="px-6 py-4">Product Name</th>
                            <th className="px-6 py-4">File Type</th>
                            <th className="px-6 py-4">Price</th>
                            <th className="px-6 py-4">Sales</th>
                            <th className="px-6 py-4">Earnings</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {products.length === 0 && !loading && (
                            <tr><td colSpan="7" className="px-6 py-8 text-center text-gray-500">No products uploaded yet.</td></tr>
                        )}
                        {products.map(p => (
                            <tr key={p._id} className="hover:bg-gray-50 transition">
                                <td className="px-6 py-4 font-medium text-gray-900">{p.name}</td>
                                <td className="px-6 py-4 text-gray-500">{p.mimeType?.split('/')[1] || "File"}</td>
                                <td className="px-6 py-4">₦{p.price?.toLocaleString()}</td>
                                <td className="px-6 py-4">{p.salesCount || 0}</td>
                                <td className="px-6 py-4 text-emerald-600 font-medium">₦{(p.totalEarnings || 0).toLocaleString()}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded-full text-xs ${p.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-800'}`}>
                                        {p.isActive ? "Active" : "Archived"}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <button onClick={() => handleCopyLink(p._id)} className="text-emerald-600 hover:underline mr-3">Copy Link</button>
                                    <button onClick={() => handleDelete(p._id)} className="text-rose-600 hover:underline">Delete</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Upload Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-emerald-50/50">
                            <h3 className="font-bold text-gray-800">Upload Digital Product</h3>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">&times;</button>
                        </div>
                        <form onSubmit={handleCreate} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
                                <input
                                    required
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>

                            <div className="flex gap-3">
                                <div className="flex-1">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
                                    <input
                                        type="number"
                                        required
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                                        value={formData.price}
                                        onChange={e => setFormData({ ...formData, price: e.target.value })}
                                    />
                                </div>
                                <div className="w-1/3">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                                    <select
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                                        value={formData.currency}
                                        onChange={e => setFormData({ ...formData, currency: e.target.value })}
                                    >
                                        <option value="NGN">NGN</option>
                                        <option value="USD">USD</option>
                                        <option value="GBP">GBP</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Cover Image (Optional)</label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-gray-50 file:text-gray-700 hover:file:bg-gray-100"
                                    onChange={e => setFormData({ ...formData, cover: e.target.files[0] })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                <textarea
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                                    rows="3"
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">File Upload</label>
                                <input
                                    type="file"
                                    required
                                    className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
                                    onChange={e => setFormData({ ...formData, file: e.target.files[0] })}
                                />
                                <p className="text-xs text-gray-500 mt-1">PDF, Video, Images (Max 50MB)</p>
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={uploading}
                                    className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg disabled:opacity-70"
                                >
                                    {uploading ? "Uploading..." : "Publish Product"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
