import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import API from "../api/axios";
import { getImageUrl } from "../utils/image";

export default function DigitalMarketplace() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("All");

    const categories = ["All", "Templates", "E-books", "Icons", "Fonts", "Datasets"];

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

    const getBadge = (product) => {
        const idLastChar = product._id?.slice(-1);
        if (['1', '5'].includes(idLastChar)) return { label: "BEST SELLER", class: "bg-orange-500" };
        if (['2', '0'].includes(idLastChar)) return { label: "NEW", class: "bg-emerald-600" };
        if (['3', '7'].includes(idLastChar)) return { label: "TRENDING", class: "bg-teal-600" };
        return null;
    };

    const filtered = products.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
            (p.description || "").toLowerCase().includes(search.toLowerCase());

        let matchesCategory = false;

        if (selectedCategory === "All") {
            matchesCategory = true;
        } else if (selectedCategory === "E-books") {
            // Expanded logic for E-books to include PDF and other formats
            const mime = p.mimeType?.toLowerCase() || "";
            matchesCategory = (p.category === "E-books") ||
                mime.includes("pdf") ||
                mime.includes("epub") ||
                mime.includes("mobi") ||
                mime.includes("azw") ||
                mime.includes("kobo");
        } else {
            matchesCategory = (p.category === selectedCategory) ||
                (p.mimeType?.toLowerCase().includes(selectedCategory.toLowerCase().slice(0, -1)));
        }

        return matchesSearch && matchesCategory;
    });

    return (
        <div className="min-h-screen bg-gray-50/50 pb-20 font-sans antialiased">
            {/* Premium Hero / Header Section */}
            <div className="relative bg-white border-b border-gray-100 overflow-hidden">
                {/* Abstract gradients */}
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-br from-emerald-100/40 to-teal-100/40 rounded-full blur-[120px] -mr-48 -mt-48 opacity-60"></div>
                <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-emerald-50/50 rounded-full blur-[100px] -ml-24 -mb-24 opacity-40"></div>

                <div className="max-w-7xl mx-auto px-6 py-16 relative z-10">
                    <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
                        <div className="max-w-2xl space-y-8 text-center lg:text-left">
                            <div className="flex items-center justify-center lg:justify-start gap-3">
                                <div className="h-14 w-14 bg-emerald-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-emerald-200 ring-4 ring-white">
                                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 011-1h1a2 2 0 100-4H7a1 1 0 01-1-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
                                    </svg>
                                </div>
                                <div className="h-6 w-px bg-gray-200 mx-2"></div>
                                <span className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-50 text-emerald-700 text-xs font-black rounded-xl uppercase tracking-widest border border-emerald-100 shadow-sm">
                                    Verified Assets
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                                </span>
                            </div>

                            <div className="space-y-4">
                                <h1 className="text-6xl md:text-7xl font-black text-gray-900 leading-[1] tracking-tight">
                                    Premium Digital <br />
                                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600">Resources.</span>
                                </h1>
                                <p className="text-xl text-gray-500 font-medium max-w-xl mx-auto lg:mx-0 leading-relaxed">
                                    The definitive marketplace for high-performance templates and digital assets. Professional quality, instant deployment.
                                </p>
                            </div>

                            <div className="flex flex-wrap justify-center lg:justify-start gap-4 pt-4">
                                <button className="px-10 py-5 bg-gray-900 text-white font-black rounded-[1.5rem] shadow-2xl shadow-gray-200 hover:-translate-y-1 hover:bg-gray-800 transition-all uppercase tracking-wider text-sm">
                                    Browse Assets
                                </button>
                                <Link to="/max-seller/digital" className="px-10 py-5 bg-white border border-gray-100 text-gray-900 font-black rounded-[1.5rem] shadow-sm hover:shadow-xl hover:border-emerald-100 transition-all uppercase tracking-wider text-sm">
                                    Become a Seller
                                </Link>
                            </div>
                        </div>

                        <div className="hidden lg:block w-full max-w-lg">
                            <div className="bg-white p-10 rounded-[4rem] shadow-2xl shadow-emerald-100 border border-emerald-50 relative rotate-2 hover:rotate-0 transition-transform duration-700">
                                <div className="absolute -top-10 -right-10 h-24 w-24 bg-teal-600 rounded-[2rem] flex items-center justify-center text-white text-4xl shadow-2xl shadow-teal-200 animate-bounce">
                                    💎
                                </div>
                                <div className="space-y-8 opacity-20 select-none">
                                    <div className="h-4 w-3/4 bg-gray-200 rounded-full"></div>
                                    <div className="h-4 w-1/2 bg-gray-200 rounded-full"></div>
                                    <div className="aspect-video bg-emerald-50 rounded-[2.5rem]"></div>
                                    <div className="flex justify-between items-center pt-4">
                                        <div className="h-14 w-32 bg-emerald-600 rounded-2xl"></div>
                                        <div className="h-14 w-14 bg-gray-100 rounded-full"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Smart Search & Filter Bar */}
            <div className="max-w-7xl mx-auto px-6 -mt-12 relative z-20">
                <div className="bg-white/80 backdrop-blur-xl p-4 rounded-[3rem] shadow-2xl shadow-emerald-100/50 border border-white">
                    <div className="flex flex-col lg:flex-row gap-4">
                        <div className="flex-1 relative">
                            <input
                                type="text"
                                placeholder="Search premium resources (e.g. Figma Templates, Vector Icons)..."
                                className="w-full pl-16 pr-6 py-6 bg-gray-50/50 rounded-[2rem] border-none focus:ring-4 focus:ring-emerald-50 outline-none font-bold text-gray-900 placeholder:text-gray-400 text-lg transition-all"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                            />
                            <svg className="w-7 h-7 text-emerald-600 absolute left-6 top-5.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>

                        <div className="flex flex-wrap items-center gap-4">
                            <div className="relative group">
                                <select
                                    className="appearance-none pl-8 pr-12 py-6 bg-gray-50/50 rounded-[2rem] border-none focus:ring-4 focus:ring-emerald-50 font-black text-gray-900 cursor-pointer text-sm uppercase tracking-widest min-w-[180px] transition-all"
                                    onChange={(e) => setSelectedCategory(e.target.value)}
                                >
                                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                                <svg className="w-5 h-5 text-emerald-400 absolute right-6 top-6 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" /></svg>
                            </div>

                            <button className="h-[72px] px-10 flex items-center justify-center bg-emerald-600 text-white font-black rounded-[2rem] hover:bg-emerald-700 shadow-xl shadow-emerald-200 transition-all gap-3 uppercase tracking-widest text-sm">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                                </svg>
                                Filter Assets
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Marketplace Grid */}
            <div className="max-w-7xl mx-auto px-6 py-20">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-40 space-y-6">
                        <div className="relative">
                            <div className="h-24 w-24 border-8 border-emerald-50 border-t-emerald-600 rounded-full animate-spin"></div>
                            <div className="absolute inset-0 flex items-center justify-center text-emerald-600 font-bold">💎</div>
                        </div>
                        <p className="text-emerald-600 font-black tracking-[0.3em] uppercase text-xs animate-pulse">Scanning Ecosystem</p>
                    </div>
                ) : error ? (
                    <div className="bg-red-50 text-red-600 p-10 rounded-[3rem] text-center font-black border-2 border-dashed border-red-100 max-w-xl mx-auto">
                        <span className="text-4xl block mb-4">⚠️</span>
                        {error}
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-40 bg-white rounded-[4rem] border border-gray-100 shadow-sm overflow-hidden relative">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-400 to-emerald-400"></div>
                        <div className="text-8xl mb-8 opacity-20">📂</div>
                        <h3 className="text-3xl font-black text-gray-900 mb-2 tracking-tight">System match not found</h3>
                        <p className="text-gray-500 font-bold text-lg max-w-md mx-auto leading-relaxed">We couldn't find any resources matching your parameters. Try broad terms instead.</p>
                        <button onClick={() => { setSearch(""); setSelectedCategory("All") }} className="mt-8 px-8 py-4 bg-emerald-50 text-emerald-600 font-black rounded-2xl hover:bg-emerald-100 transition-all uppercase text-xs tracking-widest">Reset Parameters</button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10">
                        {filtered.map(product => {
                            const badge = getBadge(product);
                            return (
                                <div key={product._id} className="group flex flex-col bg-white rounded-[3.5rem] border border-gray-100 shadow-sm hover:shadow-2xl hover:shadow-emerald-100/40 transition-all hover:-translate-y-3 overflow-hidden">
                                    {/* Cover Image Container */}
                                    <div className="aspect-[5/4] relative overflow-hidden bg-gray-50 border-b border-gray-50">
                                        {product.coverImage ? (
                                            <img src={getImageUrl(product.coverImage)} alt={product.name} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-emerald-50 to-white">
                                                <svg className="w-20 h-20 text-emerald-100" fill="currentColor" viewBox="0 0 24 24"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.89 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" /></svg>
                                            </div>
                                        )}

                                        {/* Dynamic Overlays */}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                                        {badge && (
                                            <div className={`absolute top-6 left-6 ${badge.class} text-white font-black px-4 py-2 rounded-2xl text-[10px] uppercase tracking-widest shadow-2xl ring-4 ring-white/30`}>
                                                {badge.label}
                                            </div>
                                        )}

                                        <div className="absolute top-6 right-6 h-12 w-12 bg-white/95 backdrop-blur-xl rounded-2xl flex items-center justify-center text-emerald-600 shadow-xl opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-300">
                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                            </svg>
                                        </div>
                                    </div>

                                    {/* Product Meta Section */}
                                    <div className="p-8 flex-1 flex flex-col space-y-6">
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] font-black text-emerald-600 px-2.5 py-1 bg-emerald-50 rounded-lg uppercase tracking-widest leading-none">{product.mimeType?.split('/')[1] || 'Digital'}</span>
                                                    <span className="flex items-center gap-1 text-[11px] font-black text-amber-500">
                                                        ★ 4.9 <span className="text-gray-300 font-bold ml-1">(1k+)</span>
                                                    </span>
                                                </div>
                                            </div>
                                            <h3 className="text-xl font-bold text-gray-900 group-hover:text-emerald-600 transition-colors line-clamp-1 leading-tight tracking-tight">{product.name}</h3>
                                            <p className="text-base text-gray-500 font-medium line-clamp-2 leading-relaxed">{product.description || "Architect-quality digital resources designed for immediate integration and scaling."}</p>
                                        </div>

                                        <div className="flex items-center gap-3 pt-6 border-t border-gray-50">
                                            <div className="relative">
                                                <img
                                                    src={getImageUrl(product.providerId?.avatarUrl) || "https://ui-avatars.com/api/?background=059669&color=fff&name=P"}
                                                    className="h-10 w-10 rounded-2xl bg-gray-100 border-2 border-white shadow-sm object-cover"
                                                />
                                                <div className="absolute -bottom-1 -right-1 h-4 w-4 bg-emerald-600 rounded-full border-2 border-white flex items-center justify-center">
                                                    <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20"><path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" /></svg>
                                                </div>
                                            </div>
                                            <span className="text-sm font-bold text-gray-600 truncate flex-1 tracking-tight">{product.providerId?.name || "Premium Creator"}</span>
                                        </div>

                                        <div className="flex items-center justify-between pt-4">
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest leading-none mb-1">Impact Price</span>
                                                <span className="text-3xl font-black text-emerald-600 flex items-start">
                                                    <span className="text-sm mt-1 mr-0.5">{product.currency === "USD" ? "$" : product.currency === "GBP" ? "£" : "₦"}</span>
                                                    {product.price?.toLocaleString()}
                                                </span>
                                            </div>
                                            <Link
                                                to={`/digital-products/${product._id}`}
                                                className="h-14 px-8 bg-gray-900 text-white text-sm font-black rounded-2xl shadow-xl shadow-gray-200 hover:bg-emerald-600 hover:shadow-emerald-200 transition-all flex items-center gap-3 uppercase tracking-widest"
                                            >
                                                Unlock
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                                </svg>
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Premium Trust Section */}
            <div className="max-w-7xl mx-auto px-6 mb-24">
                <div className="bg-gray-900 rounded-[4rem] p-16 text-center text-white relative overflow-hidden shadow-3xl shadow-emerald-200">
                    <div className="absolute top-0 right-0 w-1/2 h-full bg-emerald-600/10 skew-x-12 translate-x-32"></div>
                    <div className="absolute bottom-0 left-0 w-1/2 h-full bg-teal-600/10 -skew-x-12 -translate-x-32"></div>

                    <div className="relative z-10 space-y-10">
                        <div className="inline-flex items-center gap-3 px-6 py-2 bg-white/10 rounded-full backdrop-blur-md border border-white/10 text-xs font-black uppercase tracking-[0.3em]">
                            Global Trust Infrastructure
                        </div>
                        <h2 className="text-4xl md:text-5xl font-black tracking-tighter leading-none max-w-3xl mx-auto">
                            Empowering over <span className="text-emerald-400">50,000+</span> elite creators to ship faster.
                        </h2>
                        <div className="flex flex-wrap justify-center items-center gap-12 pt-8 opacity-40">
                            <div className="flex flex-col items-center gap-2">
                                <span className="text-2xl font-black">STRIPE</span>
                                <span className="text-[10px] font-black uppercase tracking-widest">Secure Flow</span>
                            </div>
                            <div className="h-10 w-px bg-white/20"></div>
                            <div className="flex flex-col items-center gap-2">
                                <span className="text-2xl font-black">ADOBE</span>
                                <span className="text-[10px] font-black uppercase tracking-widest">Industry Standard</span>
                            </div>
                            <div className="h-10 w-px bg-white/20"></div>
                            <div className="flex flex-col items-center gap-2">
                                <span className="text-2xl font-black">SLACK</span>
                                <span className="text-[10px] font-black uppercase tracking-widest">Direct Integration</span>
                            </div>
                        </div>

                        <div className="pt-10">
                            <p className="text-emerald-300 font-bold text-sm tracking-widest uppercase mb-8 flex items-center justify-center gap-3">
                                <span className="h-px w-8 bg-emerald-400/30"></span>
                                Every asset is hand-reviewed by our curators
                                <span className="h-px w-8 bg-emerald-400/30"></span>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
