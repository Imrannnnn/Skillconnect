import { useContext, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import API from "../api/axios.js";
import { AuthContext } from "../context/auth.js";
// Payment flow replaced by Booking flow per requirements
import { useToast } from "../components/toast.js";
import { getImageUrl } from "../utils/image.js";

export default function ProviderProfile() {
  const params = useParams();
  const idFromPath = params.id;
  const handleFromPath = params.handle;
  const navigate = useNavigate();
  const auth = useContext(AuthContext);
  const [provider, setProvider] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [ratingSubmitting, setRatingSubmitting] = useState(false);
  const [bookingSubmitting, setBookingSubmitting] = useState(false);
  const [ratingValue, setRatingValue] = useState(0);
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [address, setAddress] = useState("");
  const [details, setDetails] = useState("");
  const [distanceKm, setDistanceKm] = useState(null);
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const { notify } = useToast();

  useEffect(() => {
    async function fetchProvider() {
      setLoading(true);
      setError("");
      try {
        let data;
        if (handleFromPath) {
          // Branded URL using handle, resolve to provider
          const res = await API.get(`/providers/handle/${handleFromPath}`);
          data = res.data;
        } else if (idFromPath) {
          const res = await API.get(`/users/${idFromPath}`);
          data = res.data;
        } else {
          throw new Error("Missing provider identifier");
        }
        setProvider(data);
        // Fire-and-forget visit event for analytics
        if (data?._id) {
          API.post(`/providers/${data._id}/visit`).catch(() => { });
        }
      } catch (e) {
        setError(e?.response?.data?.message || "Failed to load provider");
      } finally {
        setLoading(false);
      }
    }
    fetchProvider();
  }, [idFromPath, handleFromPath]);

  // Load products for this provider (for product providers)
  useEffect(() => {
    let mounted = true;
    async function loadProducts() {
      if (!provider?._id) return;
      setProductsLoading(true);
      try {
        const { data } = await API.get(`/products?providerId=${provider._id}`);
        const list = Array.isArray(data?.products) ? data.products : [];
        if (mounted) setProducts(list);
      } catch {
        if (mounted) setProducts([]);
      } finally {
        if (mounted) setProductsLoading(false);
      }
    }
    loadProducts();
    return () => { mounted = false; };
  }, [provider?._id]);

  useEffect(() => {
    function haversineKm(lat1, lon1, lat2, lon2) {
      const toRad = (v) => (v * Math.PI) / 180;
      const R = 6371;
      const dLat = toRad(lat2 - lat1);
      const dLon = toRad(lon2 - lon1);
      const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    }
    if (!provider) return;
    const plat = Number(provider?.latitude ?? provider?.location?.latitude);
    const plng = Number(provider?.longitude ?? provider?.location?.longitude);
    if (Number.isNaN(plat) || Number.isNaN(plng)) return;
    const uLat = Number(auth?.user?.latitude ?? auth?.user?.location?.latitude);
    const uLng = Number(auth?.user?.longitude ?? auth?.user?.location?.longitude);
    if (!Number.isNaN(uLat) && !Number.isNaN(uLng)) {
      setDistanceKm(haversineKm(uLat, uLng, plat, plng));
      return;
    }
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        const la = pos?.coords?.latitude;
        const ln = pos?.coords?.longitude;
        if (typeof la === 'number' && typeof ln === 'number') {
          setDistanceKm(haversineKm(la, ln, plat, plng));
        }
      }, () => { notify("Unable to get your location", { type: 'error' }); });
    }
  }, [provider, auth?.user, notify]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 flex items-center justify-center">
        <div className="loader" />
      </div>
    );
  }
  if (error) return <div className="max-w-4xl mx-auto px-4 py-8 text-rose-500">{error}</div>;
  if (!provider) return null;

  const categories = Array.isArray(provider.categories)
    ? provider.categories
    : provider.category
      ? [provider.category]
      : [];

  const jobsDone =
    typeof provider?.jobsDone === "number"
      ? provider.jobsDone
      : typeof provider?.completedJobs === "number"
        ? provider.completedJobs
        : typeof provider?.jobsCompleted === "number"
          ? provider.jobsCompleted
          : undefined;

  const verification = provider?.verification || {};
  const emailVerified = !!(verification.emailVerified || provider?.verified);
  const phoneVerified = !!verification.phoneVerified;
  const topPerformer = Array.isArray(verification.topPerformerMonths) && verification.topPerformerMonths.length > 0;

  const hasProducts = provider.providerMode === "product" || provider.providerMode === "both";

  async function handleChat(e) {
    e?.preventDefault?.();
    if (!auth?.token) {
      navigate("/login");
      return;
    }
    try {
      setChatLoading(true);
      const { data } = await API.post("/chats", { toUserId: provider._id });
      // Support multiple possible response shapes
      const chatIdResp = data?.chatId || data?._id || data?.chat?._id;
      if (chatIdResp) {
        navigate(`/chat/${chatIdResp}`);
      }
    } catch {
      // Optionally surface an error state; keeping silent for MVP
    } finally {
      setChatLoading(false);
    }
  }

  async function submitRating(v) {
    if (!auth?.token) {
      navigate("/login");
      return;
    }
    const r = Number(v);
    if (!r || r < 1 || r > 5) return;
    try {
      setRatingSubmitting(true);
      await API.post(`/providers/${provider._id}/rate`, { rating: r });
      notify("Thanks for your rating!", { type: "success" });
      setRatingValue(0);
      const { data } = await API.get(`/users/${provider._id}`);
      setProvider(data);
    } catch (e) {
      notify(e?.response?.data?.message || "Failed to submit rating", { type: "error" });
    } finally {
      setRatingSubmitting(false);
    }
  }

  async function submitBooking(e) {
    e?.preventDefault?.();
    if (!auth?.token) {
      navigate("/login");
      return;
    }
    if (!clientName || !clientPhone || !jobDescription) {
      notify("Name, phone and description are required", { type: "error" });
      return;
    }
    try {
      setBookingSubmitting(true);
      const payload = {
        providerId: provider._id,
        clientId: auth?.user?._id,
        clientName,
        clientPhone,
        description: jobDescription,
        address,
        details,
        bookingType: selectedProduct ? "product" : "service",
        quantity: selectedProduct ? quantity : 1,
      };

      if (selectedProduct) {
        payload.productId = selectedProduct._id;
        payload.productSnapshot = {
          productCode: selectedProduct.productCode,
          name: selectedProduct.name,
          description: selectedProduct.shortDescription || selectedProduct.fullDescription,
          category: selectedProduct.category,
          price: selectedProduct.price,
        };
      }

      await API.post(`/bookings`, payload);
      notify(selectedProduct ? "Order placed successfully" : "Booking request sent to provider", { type: "success" });
      setBookingOpen(false);
      setClientName(""); setClientPhone(""); setJobDescription(""); setAddress(""); setDetails("");
      setSelectedProduct(null);
      setQuantity(1);
    } catch (e) {
      notify(e?.response?.data?.message || "Failed to send booking", { type: "error" });
    } finally {
      setBookingSubmitting(false);
    }
  }

  function startProductBooking(p) {
    // Track product order click for simple analytics (fire-and-forget)
    if (p?._id) {
      API.post(`/products/${p._id}/order-click`).catch(() => { });
    }
    setSelectedProduct(p);
    setQuantity(1);
    if (!clientName && auth?.user?.name) {
      setClientName(auth.user.name);
    }
    if (!jobDescription) {
      setJobDescription(`Order: ${p.name}`);
    }
    setBookingOpen(true);
  }



  return (
    <div className="min-h-screen bg-gray-50/50 pb-20">
      {/* Hero Section / Profile Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 pt-12 pb-8">
          <div className="flex flex-col md:flex-row items-center md:items-end gap-8">
            {/* Profile Photo */}
            <div className="relative group">
              <div className="h-40 w-40 rounded-3xl overflow-hidden bg-emerald-50 border-4 border-white shadow-xl ring-1 ring-gray-100 relative z-10">
                {provider?.avatarUrl ? (
                  <img
                    src={getImageUrl(provider.avatarUrl)}
                    alt={provider.name}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-emerald-600 text-5xl font-bold">
                    {provider?.name?.[0]?.toUpperCase() || "P"}
                  </div>
                )}
              </div>
              {/* Subtle decorative element behind photo */}
              <div className="absolute -inset-2 bg-gradient-to-tr from-emerald-100 to-teal-100 rounded-[36px] blur-2xl opacity-50 -z-0"></div>
            </div>

            {/* Profile Info */}
            <div className="flex-1 text-center md:text-left">
              <div className="flex flex-col md:flex-row items-center md:items-center gap-2 mb-2">
                <h1 className="text-4xl font-bold text-gray-900 tracking-tight">
                  {provider.name}
                </h1>
                {(emailVerified || phoneVerified || provider.verified) && (
                  <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-emerald-600 text-white" title="Verified Professional">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </span>
                )}
              </div>

              <p className="text-xl font-medium text-gray-600 mb-1">
                {provider.providerType || "Professional Professional"}
              </p>

              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mt-4">
                {categories.map((c) => (
                  <span key={c} className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-sm font-medium border border-emerald-100">
                    {c}
                  </span>
                ))}
                {topPerformer && (
                  <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-700 text-sm font-medium border border-amber-100 inline-flex items-center gap-1.5">
                    <span className="text-lg leading-none">🏆</span> Top Performer
                  </span>
                )}
              </div>
            </div>

            {/* Main CTAs */}
            <div className="flex flex-col gap-3 w-full md:w-auto min-w-[200px]">
              <button
                onClick={handleChat}
                disabled={chatLoading}
                className="w-full px-8 py-3 bg-emerald-600 text-white font-semibold rounded-xl shadow-lg shadow-emerald-200 hover:bg-emerald-700 hover:-translate-y-0.5 transition-all disabled:opacity-70 disabled:pointer-events-none"
              >
                {chatLoading ? "Initializing..." : "Message"}
              </button>
              <div className="flex gap-2">
                <button
                  onClick={() => setBookingOpen(true)}
                  className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Connect
                </button>
                <a
                  href={`mailto:${provider.email || ""}`}
                  className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 text-center font-semibold rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Email
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Bio & Experience */}
          <div className="lg:col-span-2 space-y-8">
            {/* Bio Card */}
            <section className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 mb-4">About Professional</h2>
              <div className="text-gray-600 leading-relaxed text-lg whitespace-pre-wrap">
                {provider.bio || "No biography provided."}
              </div>
            </section>

            {/* Products / Services Section */}
            {hasProducts && (
              <section id="provider-products-section" className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-900">Portfolio & Services</h2>
                  <span className="text-sm text-gray-500 font-medium">{products.length} Items</span>
                </div>

                {productsLoading ? (
                  <div className="py-12 flex justify-center"><div className="loader" /></div>
                ) : products.length === 0 ? (
                  <div className="bg-white rounded-2xl p-12 text-center border-2 border-dashed border-gray-100 text-gray-400">
                    No items displayed yet.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {products.map((p) => (
                      <div key={p._id} className="group bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                        <div className="aspect-video relative overflow-hidden bg-gray-100">
                          {p.images?.[0] ? (
                            <img src={getImageUrl(p.images[0])} alt={p.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center text-gray-300">
                              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                            </div>
                          )}
                        </div>
                        <div className="p-6">
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="font-bold text-gray-900 text-lg group-hover:text-emerald-600 transition-colors">{p.name}</h3>
                            <span className="text-emerald-600 font-bold">
                              {new Intl.NumberFormat(undefined, { style: 'currency', currency: (p.currency || 'NGN').toUpperCase() }).format(p.price)}
                            </span>
                          </div>
                          <p className="text-gray-500 text-sm line-clamp-2 mb-4">
                            {p.shortDescription || p.fullDescription}
                          </p>
                          <button
                            onClick={() => startProductBooking(p)}
                            disabled={p.stockStatus === 'out_of_stock'}
                            className="w-full py-2 bg-emerald-50 text-emerald-700 font-semibold rounded-xl hover:bg-emerald-600 hover:text-white transition-all disabled:bg-gray-50 disabled:text-gray-300"
                          >
                            {p.stockStatus === 'out_of_stock' ? 'Out of Stock' : 'Order Now'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}

            {/* Portfolio Grid */}
            {Array.isArray(provider.portfolio) && provider.portfolio.length > 0 && (
              <section className="space-y-4">
                <h2 className="text-xl font-bold text-gray-900 font-bold">Portfolio Gallery</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {provider.portfolio.map((item, idx) => (
                    <div key={idx} className="aspect-square rounded-2xl overflow-hidden border border-gray-100 group">
                      <img src={getImageUrl(item.url)} alt={item.description} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Right Column: Details Card & Trust */}
          <div className="space-y-8">
            {/* Quick Details Card */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-6">
              <h3 className="text-lg font-bold text-gray-900">Professional Details</h3>

              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">Location</p>
                    <p className="text-gray-900 font-medium">
                      {provider.location?.city ? `${provider.location.city}, ${provider.location.country}` : "Remote / Global"}
                    </p>
                    {distanceKm !== null && <p className="text-xs text-emerald-600 font-medium mt-0.5">{distanceKm.toFixed(1)}km from you</p>}
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9-3-9m-9 9a9 9 0 019-9" /></svg>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">Website</p>
                    <a href={provider.website || "#"} target="_blank" className="text-emerald-600 font-medium hover:underline break-all">
                      {provider.website ? provider.website.replace(/^https?:\/\//, '') : "Not provided"}
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">Contact</p>
                    <p className="text-gray-900 font-medium break-all">{provider.email || "Confidential"}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Ratings & Trust Card */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-6">
              <h3 className="text-lg font-bold text-gray-900">Client Feedback</h3>

              <div className="flex items-center gap-4 pb-6 border-b border-gray-50">
                <div className="text-4xl font-bold text-gray-900">{provider.ratingAvg || "0.0"}</div>
                <div>
                  <div className="flex text-amber-400">
                    {[1, 2, 3, 4, 5].map(s => (
                      <svg key={s} className={`w-5 h-5 ${s <= Math.round(provider.ratingAvg || 0) ? 'fill-current' : 'text-gray-200'}`} viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <p className="text-sm text-gray-500 mt-1 font-medium">{provider.ratingCount || 0} Professional Reviews</p>
                </div>
              </div>

              <div className="space-y-4">
                <p className="text-sm font-bold text-gray-700">Submit your rating</p>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      disabled={ratingSubmitting}
                      onClick={() => submitRating(s)}
                      onMouseEnter={() => setRatingValue(s)}
                      onMouseLeave={() => setRatingValue(0)}
                      className={`text-2xl transition-transform hover:scale-125 ${s <= (ratingValue || (provider.ratingAvg || 0)) ? 'text-amber-400' : 'text-gray-200'}`}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Impact Metric */}
            <div className="bg-emerald-600 rounded-2xl p-6 text-white text-center shadow-lg shadow-emerald-100">
              <div className="text-3xl font-extrabold mb-1">{jobsDone || "0"}</div>
              <div className="text-emerald-100 text-sm font-semibold uppercase tracking-widest">Successful Projects</div>
            </div>
          </div>
        </div>
      </div>

      {/* Booking Modal Redesigned */}
      {bookingOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="px-8 py-6 bg-emerald-600 text-white flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold">{selectedProduct ? 'Checkout Order' : 'Collaboration Request'}</h3>
                <p className="text-emerald-100 text-sm mt-1">Ready to start something amazing?</p>
              </div>
              <button onClick={() => setBookingOpen(false)} className="h-10 w-10 flex items-center justify-center rounded-full bg-emerald-500 hover:bg-emerald-400 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <form onSubmit={submitBooking} className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Full Name</label>
                  <input className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-emerald-100 focus:border-emerald-400 outline-none transition-all" value={clientName} onChange={(e) => setClientName(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Phone</label>
                  <input className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-emerald-100 focus:border-emerald-400 outline-none transition-all" value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} required />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">{selectedProduct ? 'Order Specifications' : 'Service Requirements'}</label>
                <textarea className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-emerald-100 focus:border-emerald-400 outline-none transition-all min-h-[100px]" value={jobDescription} onChange={(e) => setJobDescription(e.target.value)} required />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Location / Deployment</label>
                <input className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-emerald-100 focus:border-emerald-400 outline-none transition-all" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Office, Remote, or City" />
              </div>

              {selectedProduct && (
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Quantity</label>
                  <input type="number" min="1" className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 outline-none" value={quantity} onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))} />
                </div>
              )}

              <div className="flex gap-4 pt-4">
                <button type="submit" disabled={bookingSubmitting} className="flex-1 py-4 bg-emerald-600 text-white font-bold rounded-2xl shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all disabled:opacity-50">
                  {bookingSubmitting ? 'Processing...' : (selectedProduct ? 'Confirm Order' : 'Send Inquiry')}
                </button>
                <button type="button" onClick={() => setBookingOpen(false)} className="px-8 py-4 text-gray-500 font-bold hover:text-gray-900 transition-colors">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
