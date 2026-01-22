import { useState, useEffect, useContext } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import API from "../api/axios";
import { AuthContext } from "../context/auth";
import { getImageUrl } from "../utils/image";

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

    if (loading) return (
        <div className="flex flex-col items-center justify-center py-40 space-y-4">
            <div className="h-16 w-16 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin"></div>
            <p className="text-emerald-600 font-black tracking-widest uppercase text-xs">Loading Asset...</p>
        </div>
    );

    if (error || !product) return (
        <div className="max-w-xl mx-auto px-6 py-20 text-center">
            <div className="text-6xl mb-6">🏜️</div>
            <h2 className="text-2xl font-black text-gray-900 mb-2">Resource Unavailable</h2>
            <p className="text-gray-500 font-bold mb-8">This asset might have been moved or removed from the marketplace.</p>
            <Link to="/digital-marketplace" className="px-8 py-4 bg-emerald-600 text-white font-black rounded-2xl shadow-lg shadow-emerald-200 uppercase tracking-widest text-xs">Back to Marketplace</Link>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50/50 pb-20 pt-12">
            <div className="max-w-7xl mx-auto px-6">

                {/* Breadcrumbs */}
                <nav className="flex items-center gap-2 text-xs font-black text-gray-400 uppercase tracking-widest mb-8">
                    <Link to="/digital-marketplace" className="hover:text-emerald-600 transition-colors">Marketplace</Link>
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7" /></svg>
                    <span className="text-emerald-600">{product.name}</span>
                </nav>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">

                    {/* Left Column: Visual Showcase */}
                    <div className="lg:col-span-12 xl:col-span-8 flex flex-col gap-8">
                        <div className="bg-white rounded-[3rem] shadow-2xl shadow-emerald-100/30 border border-emerald-50/50 overflow-hidden relative">
                            {product.coverImage ? (
                                <img src={getImageUrl(product.coverImage)} alt={product.name} className="w-full h-auto object-cover" />
                            ) : (
                                <div className="aspect-video flex items-center justify-center bg-gradient-to-br from-emerald-50 to-white">
                                    <svg className="w-32 h-32 text-emerald-100" fill="currentColor" viewBox="0 0 24 24"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.89 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" /></svg>
                                </div>
                            )}
                        </div>

                        {/* Description & Details */}
                        <div className="bg-white rounded-[3rem] p-10 shadow-sm border border-gray-100 space-y-8">
                            <div className="space-y-4">
                                <h2 className="text-2xl font-black text-gray-900 tracking-tight">Product Insight</h2>
                                <div className="prose prose-emerald max-w-none text-gray-600 text-lg leading-relaxed font-medium">
                                    {product.description || "No detailed description provided for this premium asset."}
                                </div>
                            </div>

                            <div className="pt-8 border-t border-gray-50 grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">⚡</div>
                                    <div>
                                        <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Delivery</p>
                                        <p className="text-sm font-bold text-gray-900">Instant Download</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 bg-teal-50 rounded-2xl flex items-center justify-center text-teal-600">🛡️</div>
                                    <div>
                                        <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Security</p>
                                        <p className="text-sm font-bold text-gray-900">Verified Secure</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">♾️</div>
                                    <div>
                                        <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">License</p>
                                        <p className="text-sm font-bold text-gray-900">Commercial Use</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Checkout & Actions */}
                    <div className="lg:col-span-12 xl:col-span-4 space-y-8">
                        <div className="bg-white rounded-[3rem] p-10 shadow-2xl shadow-emerald-100/50 border border-gray-100 sticky top-12 space-y-8 overflow-hidden relative">
                            {/* Accent decoration */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full blur-3xl -mr-16 -mt-16 opacity-40"></div>

                            <div className="space-y-6 relative z-10">
                                <div className="flex items-center justify-between">
                                    <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-black rounded-lg uppercase tracking-widest border border-emerald-100 italic">
                                        {product.mimeType?.split('/')[1] || 'DIGITAL ASSET'}
                                    </span>
                                    <div className="flex items-center gap-1.5 px-3 py-1 bg-gray-50 rounded-lg text-xs font-bold text-gray-500">
                                        ⭐ 5.0
                                    </div>
                                </div>

                                <h1 className="text-3xl font-black text-gray-900 leading-none tracking-tight">
                                    {product.name}
                                </h1>

                                <div className="flex items-center gap-4 p-4 bg-gray-50/50 rounded-2xl border border-gray-100">
                                    <div className="relative">
                                        <img src={getImageUrl(product.providerId?.avatarUrl) || "https://ui-avatars.com/api/?background=059669&color=fff&name=P"} className="h-12 w-12 rounded-2xl object-cover border-2 border-white shadow-sm" />
                                        <div className="absolute -bottom-1 -right-1 h-4 w-4 bg-emerald-600 rounded-full border-2 border-white flex items-center justify-center">
                                            <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20"><path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" /></svg>
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Architect</p>
                                        <p className="text-sm font-black text-gray-900 truncate max-w-[150px]">{product.providerId?.name || "Premium Creator"}</p>
                                    </div>
                                    <Link to={`/providers/${product.providerId?._id}`} className="ml-auto h-10 w-10 flex items-center justify-center bg-white rounded-xl shadow-sm border border-gray-100 hover:text-emerald-600 transition-colors">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                                    </Link>
                                </div>

                                <div className="pt-6 border-t border-gray-50">
                                    <div className="flex flex-col mb-8">
                                        <span className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">Investment Price</span>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-2xl font-black text-emerald-600">{product.currency === "USD" ? "$" : product.currency === "GBP" ? "£" : "₦"}</span>
                                            <span className="text-5xl font-black text-gray-900 tracking-tighter">{product.price?.toLocaleString()}</span>
                                            <span className="text-gray-300 font-bold ml-2">.00</span>
                                        </div>
                                    </div>

                                    <button
                                        onClick={handleBuy}
                                        disabled={buying}
                                        className="w-full py-6 bg-emerald-600 text-white font-black rounded-3xl shadow-2xl shadow-emerald-100 hover:bg-emerald-700 hover:-translate-y-1 transition-all disabled:opacity-50 uppercase tracking-[0.2em] text-xs flex items-center justify-center gap-3"
                                    >
                                        {buying ? (
                                            <>
                                                <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                Initializing Secure Flow...
                                            </>
                                        ) : (
                                            <>
                                                Unlock Asset
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                            </>
                                        )}
                                    </button>

                                    <div className="mt-8 flex flex-col items-center gap-4 bg-gray-50/50 p-6 rounded-[2rem] border border-gray-100">
                                        <div className="flex gap-2">
                                            <div className="h-5 w-8 bg-gray-200 rounded"></div>
                                            <div className="h-5 w-8 bg-gray-200 rounded"></div>
                                            <div className="h-5 w-8 bg-gray-200 rounded"></div>
                                        </div>
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                            <svg className="w-3 h-3 text-emerald-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M2.166 4.9L10 1.554 17.834 4.9c.8.342 1.166 1.127 1.166 1.884V13.5c0 3.012-3.834 5.5-9 6-5.166-.5-9-2.988-9-6V6.784c0-.757.366-1.542 1.166-1.884zM10 3.172L3.5 5.95v7.55c0 2.373 2.871 4.398 6.5 4.88 3.629-.482 6.5-2.507 6.5-4.88V5.95L10 3.172zM10 14a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" /></svg>
                                            Secured by Global Infrastructure
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Additional Info Cards */}
                        <div className="bg-gradient-to-br from-emerald-900 to-emerald-800 rounded-[3rem] p-8 text-white space-y-4 shadow-xl">
                            <h4 className="font-black text-sm uppercase tracking-widest italic opacity-60">Creator's Note</h4>
                            <p className="text-sm font-medium leading-relaxed">
                                "This resource was built with specific attention to scalability and ease of use. I provide lifetime updates for all my verified assets."
                            </p>
                            <div className="pt-4 flex items-center gap-3">
                                <div className="h-3 w-3 rounded-full bg-emerald-400 animate-pulse"></div>
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-300">Online Support Available</span>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
