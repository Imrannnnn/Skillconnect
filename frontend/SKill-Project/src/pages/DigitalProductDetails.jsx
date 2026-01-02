import { useState, useEffect, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../api/axios";
import { AuthContext } from "../context/auth";

export default function DigitalProductDetails() {
    const { id } = useParams();
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();

    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [buying, setBuying] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        async function load() {
            try {
                const { data } = await API.get(`/digital-products/${id}`);
                setProduct(data.product);
            } catch {
                setError("Product not found");
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [id]);

    async function handleBuy() {
        if (!user) {
            navigate(`/login?redirect=/digital-products/${id}`);
            return;
        }
        setBuying(true);
        try {
            const { data } = await API.post(`/digital-products/${id}/buy`);
            if (data.checkoutUrl) {
                window.location.href = data.checkoutUrl;
            }
        } catch (e) {
            if (e?.response?.status === 409) {
                alert("You already own this product! check your library.");
                navigate("/my-digital-library");
            } else {
                alert(e?.response?.data?.message || "Purchase failed");
            }
        } finally {
            setBuying(false);
        }
    }

    if (loading) return <div className="flex justify-center py-20"><div className="loader"></div></div>;
    if (error || !product) return <div className="text-center py-20 text-red-600">{error}</div>;

    return (
        <div className="max-w-5xl mx-auto px-4 py-8">
            <div className="bg-white rounded-2xl shadow-sm border border-emerald-100 overflow-hidden md:flex">
                {/* Left: Visual */}
                <div className="md:w-1/3 bg-emerald-50 flex items-center justify-center relative overflow-hidden">
                    {product.coverImage ? (
                        <img src={product.coverImage} alt={product.name} className="w-full h-full object-cover" />
                    ) : (
                        <div className="p-12 text-emerald-200">
                            <svg className="w-32 h-32" fill="currentColor" viewBox="0 0 24 24"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.89 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" /></svg>
                        </div>
                    )}
                </div>

                {/* Right: Info */}
                <div className="p-8 md:w-2/3 flex flex-col">
                    <div className="mb-4">
                        <span className="text-xs font-semibold tracking-wider text-emerald-600 uppercase bg-emerald-50 px-2 py-1 rounded">
                            {product.mimeType?.split('/')[1] || 'Digital File'}
                        </span>
                    </div>

                    <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>
                    <div className="flex items-center gap-2 mb-6">
                        <span className="text-gray-500 text-sm">Sold by</span>
                        <img src={product.providerId?.avatarUrl || "https://ui-avatars.com/api/?name=?"} className="w-6 h-6 rounded-full" />
                        <span className="font-medium text-gray-800">{product.providerId?.name}</span>
                    </div>

                    <div className="prose prose-emerald prose-sm max-w-none text-gray-600 mb-8">
                        {product.description || "No description provided."}
                    </div>

                    <div className="mt-auto border-t pt-6 flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Price</p>
                            <p className="text-3xl font-bold text-emerald-700">
                                {product.currency === "USD" ? "$" : product.currency === "GBP" ? "£" : "₦"}
                                {product.price?.toLocaleString()}
                            </p>
                        </div>
                        <button
                            onClick={handleBuy}
                            disabled={buying}
                            className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl shadow-lg shadow-emerald-200 transition disabled:opacity-70 flex items-center gap-2"
                        >
                            {buying ? "Processing..." : "Buy Now"}
                            {!buying && (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
