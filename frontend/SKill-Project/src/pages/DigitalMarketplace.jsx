import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import API from "../api/axios";
import { getImageUrl } from "../utils/image";

export default function DigitalMarketplace() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");

    useEffect(() => {
        fetchProducts();
    }, []);

    async function fetchProducts() {
        setLoading(true);
        try {
            const { data } = await API.get("/digital-products");
            setProducts(data.products || []);
        } catch (error) {
            console.error(error);
            setError("Failed to load products");
        } finally {
            setLoading(false);
        }
    }

    const filtered = products.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        (p.description || "").toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="p-4 sm:p-6 lg:p-8 min-h-screen">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Digital Marketplace</h1>
                    <p className="text-gray-600">Discover templates, ebooks, and digital assets.</p>
                </div>
                <div className="relative w-full md:w-80">
                    <input
                        type="text"
                        placeholder="Search products..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                    <svg className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-20"><div className="loader"></div></div>
            ) : error ? (
                <div className="text-center text-red-600 py-10">{error}</div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-20 bg-gray-50 rounded-xl">
                    <p className="text-gray-500 text-lg">No digital products found.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filtered.map(product => (
                        <div key={product._id} className="bg-white rounded-xl shadow-sm hover:shadow-md transition border border-gray-100 overflow-hidden flex flex-col">
                            <div className="h-40 bg-emerald-50 flex items-center justify-center relative overflow-hidden group-hover:scale-105 transition-transform duration-300">
                                {product.coverImage ? (
                                    <img src={getImageUrl(product.coverImage)} alt={product.name} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="text-6xl text-emerald-200">
                                        <svg className="w-20 h-20" fill="currentColor" viewBox="0 0 24 24"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.89 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" /></svg>
                                    </div>
                                )}
                                <div className="absolute top-2 right-2 bg-white/90 backdrop-blur px-2 py-1 rounded text-xs font-medium text-emerald-800 uppercase shadow-sm">
                                    {product.mimeType?.split('/')[1] || 'Digital'}
                                </div>
                            </div>

                            <div className="p-4 flex-1 flex flex-col">
                                <div className="flex items-start justify-between gap-2">
                                    <h3 className="font-semibold text-gray-900 line-clamp-2" title={product.name}>{product.name}</h3>
                                </div>

                                <p className="text-sm text-gray-500 mt-1 line-clamp-2 mb-3 flex-1">{product.description}</p>

                                <div className="flex items-center gap-2 mb-3">
                                    <img
                                        src={getImageUrl(product.providerId?.avatarUrl) || "https://ui-avatars.com/api/?name=Provider"}
                                        alt=""
                                        className="w-5 h-5 rounded-full bg-gray-200 object-cover"
                                    />
                                    <span className="text-xs text-gray-600 truncate">{product.providerId?.name || "Unknown Provider"}</span>
                                </div>

                                <div className="flex items-center justify-between pt-3 border-t border-gray-50 mt-auto">
                                    <div>
                                        <span className="text-lg font-bold text-emerald-700">
                                            {product.currency === "USD" ? "$" : product.currency === "GBP" ? "£" : "₦"}
                                            {product.price?.toLocaleString()}
                                        </span>
                                    </div>
                                    <Link
                                        to={`/digital-products/${product._id}`}
                                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition"
                                    >
                                        View Details
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

        </div>
    );
}
