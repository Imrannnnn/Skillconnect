import { useContext, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import API from "../api/axios.js";
import { AuthContext } from "../context/auth.js";
// Payment flow replaced by Booking flow per requirements
import { useToast } from "../components/toast.js";

export default function ProviderProfile() {
  const { id } = useParams();
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
  const { notify } = useToast();

  useEffect(() => {
    async function fetchProvider() {
      setLoading(true);
      setError("");
      try {
        const { data } = await API.get(`/users/${id}`);
        setProvider(data);
      } catch (e) {
        setError(e?.response?.data?.message || "Failed to load provider");
      } finally {
        setLoading(false);
      }
    }
    fetchProvider();
  }, [id]);

  // Load products for this provider (for product providers)
  useEffect(() => {
    let mounted = true;
    async function loadProducts() {
      if (!id) return;
      setProductsLoading(true);
      try {
        const { data } = await API.get(`/products?providerId=${id}`);
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
  }, [id]);

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

  function refreshDistance() {
    if (!provider) return;
    const plat = Number(provider?.latitude ?? provider?.location?.latitude);
    const plng = Number(provider?.longitude ?? provider?.location?.longitude);
    if (Number.isNaN(plat) || Number.isNaN(plng)) return;
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
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        const la = pos?.coords?.latitude;
        const ln = pos?.coords?.longitude;
        if (typeof la === 'number' && typeof ln === 'number') {
          setDistanceKm(haversineKm(la, ln, plat, plng));
          notify("Location updated", { type: 'success' });
        }
      }, () => { notify("Unable to get your location", { type: 'error' }); });
    }
  }

  if (loading) return <div className="max-w-4xl mx-auto px-4 py-8">Loading...</div>;
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

  const hasService = provider.providerMode === "service" || provider.providerMode === "both" || !provider.providerMode;
  const hasProducts = provider.providerMode === "product" || provider.providerMode === "both";

  async function handleChat(e) {
    e?.preventDefault?.();
    if (!auth?.token) {
      navigate("/login");
      return;
    }
    try {
      setChatLoading(true);
      const { data } = await API.post("/chats", { toUserId: id });
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
      await API.post(`/providers/${id}/rate`, { rating: r });
      notify("Thanks for your rating!", { type: "success" });
      setRatingValue(0);
      const { data } = await API.get(`/users/${id}`);
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
        providerId: id,
        clientId: auth?.user?._id,
        clientName,
        clientPhone,
        description: jobDescription,
        address,
        details,
        bookingType: selectedProduct ? "product" : "service",
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
      notify("Booking request sent to provider", { type: "success" });
      setBookingOpen(false);
      setClientName(""); setClientPhone(""); setJobDescription(""); setAddress(""); setDetails("");
      setSelectedProduct(null);
    } catch (e) {
      notify(e?.response?.data?.message || "Failed to send booking", { type: "error" });
    } finally {
      setBookingSubmitting(false);
    }
  }

  function startProductBooking(p) {
    setSelectedProduct(p);
    if (!clientName && auth?.user?.name) {
      setClientName(auth.user.name);
    }
    if (!jobDescription) {
      setJobDescription(`Order: ${p.name}`);
    }
    setBookingOpen(true);
  }

  function scrollToProducts() {
    const el = document.getElementById("provider-products-section");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="relative mb-6 flex justify-center">
        <div
          className="relative w-full max-w-xl cursor-pointer text-slate-900
                     flex flex-col justify-end gap-3 rounded-xl bg-transparent
                     before:content-[''] before:absolute before:inset-0 before:-left-[6px]
                     before:m-auto before:w-[calc(100%+12px)] before:h-[calc(100%+12px)] before:rounded-[14px]
                     before:bg-gradient-to-br before:from-emerald-500
                     before:via-emerald-500 before:to-cyan-500 before:-z-10
                     before:pointer-events-none before:transition-transform
                     before:duration-500 before:ease-[cubic-bezier(0.175,0.885,0.32,1.275)]
                     after:content-[''] after:absolute after:inset-0 after:-z-[1]
                     after:bg-gradient-to-br after:from-emerald-500 after:to-cyan-500
                     after:scale-[0.95] after:blur-[18px]
                     hover:after:blur-[26px]
                     hover:before:-rotate-90 hover:before:scale-x-[1.08] hover:before:scale-y-[0.96]"
        >
          <div className="relative rounded-lg border border-gray-200 bg-white p-5 shadow-sm overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
              <div className="flex items-start gap-4 md:col-span-2 min-w-0">
                <div className="h-16 w-16 shrink-0 rounded-full overflow-hidden bg-emerald-100 flex items-center justify-center text-emerald-700 text-xl font-semibold">
                  {provider?.avatarUrl ? (
                    <img src={provider.avatarUrl} alt="avatar" className="h-full w-full object-cover" />
                  ) : (
                    provider?.name?.[0]?.toUpperCase() || "P"
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h1 className="text-2xl font-semibold text-gray-800 break-words">{provider.name}</h1>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-gray-500">
                    {provider.providerType && (
                      <span className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-700">
                        {provider.providerType}
                      </span>
                    )}
                    {categories.map((c) => (
                      <span key={c} className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700">
                        {c}
                      </span>
                    ))}
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-gray-500">
                    {typeof provider.ratingAvg === 'number' && provider.ratingCount > 0 && (
                      <span className="inline-flex items-center gap-1 text-amber-600">
                        <span>★ {provider.ratingAvg}</span>
                        <span className="text-gray-500">({provider.ratingCount})</span>
                      </span>
                    )}
                    {typeof jobsDone === 'number' && jobsDone > 0 && (
                      <span className="inline-flex items-center gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        <span className="text-gray-600">{jobsDone} jobs done</span>
                      </span>
                    )}
                  </div>
                  {provider.location?.city && (
                    <p className="mt-2 text-sm text-gray-500 break-words">
                      {provider.location.city}
                      {provider.location.state ? `, ${provider.location.state}` : ""}
                      {provider.location.country ? `, ${provider.location.country}` : ""}
                    </p>
                  )}
                  {typeof distanceKm === 'number' && (
                    <p className="text-xs text-gray-500 mt-1">{distanceKm.toFixed(1)} km away</p>
                  )}
                </div>
              </div>
              <div className="flex md:flex-col gap-2 md:items-end">
                {typeof distanceKm === 'number' && (
                  <span className="inline-flex items-center justify-center text-[11px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {distanceKm.toFixed(1)} km away
                  </span>
                )}
                <button
                  onClick={handleChat}
                  disabled={chatLoading}
                  className="w-full md:w-auto px-4 py-2 rounded-md bg-emerald-600 text-white hover:bg-emerald-700 transition-all disabled:opacity-70"
                >
                  {chatLoading ? "Starting…" : "Chat"}
                </button>
                {hasService && (
                  <button
                    onClick={() => {
                      setSelectedProduct(null);
                      if (!jobDescription) {
                        const primaryCategory = categories[0];
                        const label = primaryCategory || "service";
                        setJobDescription(`Order: ${label}`);
                      }
                      setBookingOpen(true);
                    }}
                    className="w-full md:w-auto px-4 py-2 rounded-md border border-emerald-600 text-emerald-700 hover:bg-emerald-50 transition-all"
                  >
                    Book service
                  </button>
                )}
                {hasProducts && (
                  <button
                    type="button"
                    onClick={scrollToProducts}
                    className="w-full md:w-auto px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 transition-all text-sm"
                  >
                    View products
                  </button>
                )}
                <button
                  type="button"
                  onClick={refreshDistance}
                  className="w-full md:w-auto text-xs text-emerald-700 hover:text-emerald-800"
                >
                  Use my location
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Rating */}
      <div className="mt-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-2">Rate this provider</h2>
        <div className="flex items-center gap-2">
          {[1,2,3,4,5].map((s) => (
            <button
              key={s}
              type="button"
              disabled={ratingSubmitting}
              onClick={() => submitRating(s)}
              className={`text-2xl ${s <= (ratingValue || 0) ? 'text-amber-400' : 'text-gray-300'} hover:text-amber-400 transition`}
              onMouseEnter={() => setRatingValue(s)}
              onMouseLeave={() => setRatingValue(0)}
            >
              ★
            </button>
          ))}
          {typeof provider.ratingAvg === 'number' && provider.ratingCount > 0 && (
            <span className="text-sm text-gray-600 ml-2">{provider.ratingAvg} ({provider.ratingCount})</span>
          )}
        </div>
      </div>

      {provider.bio && (
        <div className="mt-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-2">About</h2>
          <p className="text-gray-700 leading-relaxed break-words">{provider.bio}</p>
        </div>
      )}

      {/* Products (for product providers) */}
      {hasProducts && (
        <div className="mt-6" id="provider-products-section">
          <h2 className="text-lg font-semibold text-gray-800 mb-2">Products</h2>
          {productsLoading && <p className="text-sm text-gray-500">Loading products…</p>}
          {!productsLoading && products.length === 0 && (
            <p className="text-sm text-gray-500">This provider has not added any products yet.</p>
          )}
          {products.length > 0 && (
            <div className="mt-2 grid gap-3 sm:grid-cols-2">
              {products.map((p) => (
                <div key={p._id} className="rounded-lg border border-gray-200 bg-white p-3 flex flex-col gap-1">
                  {Array.isArray(p.images) && p.images.length > 0 && (
                    <div className="mb-2">
                      <div className="overflow-hidden rounded-md">
                        <img src={p.images[0]} alt={p.name} className="h-32 w-full object-cover" />
                      </div>
                      {p.images.length > 1 && (
                        <div className="mt-1 flex gap-1 overflow-x-auto">
                          {p.images.slice(1).map((img, idx) => (
                            <img
                              key={idx}
                              src={img}
                              alt={`${p.name} ${idx + 2}`}
                              className="h-12 w-12 object-cover rounded-md flex-shrink-0 border border-gray-200"
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-gray-800 break-words">{p.name}</div>
                      {p.productCode && (
                        <div className="text-[11px] text-gray-500 mt-0.5">ID: {p.productCode}</div>
                      )}
                      {p.category && (
                        <div className="text-[11px] text-gray-500 mt-0.5">{p.category}</div>
                      )}
                    </div>
                    <span className={`px-2 py-0.5 rounded-full border text-[10px] ${p.status === 'active' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-gray-50 border-gray-200 text-gray-600'}`}>
                      {p.status || 'inactive'}
                    </span>
                  </div>
                  {(p.shortDescription || p.fullDescription) && (
                    <div className="text-xs text-gray-600 mt-1 break-words line-clamp-3">
                      {p.shortDescription || p.fullDescription}
                    </div>
                  )}
                  <div className="mt-1 flex items-center justify-between text-xs text-gray-700">
                    {typeof p.price === 'number' && (
                      <span className="font-semibold flex items-baseline gap-1">
                        {typeof p.discountPrice === 'number' && p.discountPrice < p.price ? (
                          <>
                            <span className="text-[11px] font-semibold text-emerald-700">
                              {new Intl.NumberFormat(undefined, { style: 'currency', currency: (p.currency || 'NGN').toUpperCase() }).format(p.discountPrice)}
                            </span>
                            <span className="text-[10px] text-gray-400 line-through">
                              {new Intl.NumberFormat(undefined, { style: 'currency', currency: (p.currency || 'NGN').toUpperCase() }).format(p.price)}
                            </span>
                            <span className="text-[10px] px-1 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                              -{Math.round(((p.price - p.discountPrice) / p.price) * 100)}%
                            </span>
                          </>
                        ) : (
                          <span className="text-[11px] font-semibold text-gray-800">
                            {new Intl.NumberFormat(undefined, { style: 'currency', currency: (p.currency || 'NGN').toUpperCase() }).format(p.price)}
                          </span>
                        )}
                      </span>
                    )}
                    <span className="flex items-center gap-2">
                      {typeof p.stockQty === 'number' && (
                        <span className="text-gray-500">Stock: {p.stockQty}</span>
                      )}
                      {p.stockStatus && (
                        <span
                          className={`px-2 py-0.5 rounded-full border text-[10px] ${
                            p.stockStatus === 'out_of_stock'
                              ? 'bg-rose-50 border-rose-200 text-rose-700'
                              : p.stockStatus === 'low_stock'
                              ? 'bg-amber-50 border-amber-200 text-amber-700'
                              : p.stockStatus === 'pre_order'
                              ? 'bg-sky-50 border-sky-200 text-sky-700'
                              : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                          }`}
                        >
                          {p.stockStatus.replace('_', ' ')}
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-gray-600">
                    {p.sku && (
                      <span className="px-2 py-0.5 rounded-full bg-gray-50 border border-gray-200">SKU: {p.sku}</span>
                    )}
                    {Array.isArray(p.deliveryOptions) && p.deliveryOptions.length > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700">
                        Delivery: {p.deliveryOptions.join(', ')}
                      </span>
                    )}
                    {typeof p.deliveryFee === 'number' && (
                      <span>
                        Fee: {new Intl.NumberFormat(undefined, { style: 'currency', currency: (p.currency || 'NGN').toUpperCase() }).format(p.deliveryFee)}
                      </span>
                    )}
                    {p.deliveryEta && (
                      <span>ETA: {p.deliveryEta}</span>
                    )}
                  </div>
                  <div className="mt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={() => startProductBooking(p)}
                      disabled={p.stockStatus === 'out_of_stock'}
                      className={`px-3 py-1.5 text-xs rounded-md text-white transition ${
                        p.stockStatus === 'out_of_stock'
                          ? 'bg-gray-300 cursor-not-allowed'
                          : 'bg-emerald-600 hover:bg-emerald-700'
                      }`}
                    >
                      {p.stockStatus === 'out_of_stock' ? 'Out of stock' : 'Order product'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {Array.isArray(provider.portfolio) && provider.portfolio.length > 0 && (
        <div className="mt-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">Portfolio</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {provider.portfolio.map((item, idx) => (
              <a
                key={idx}
                href={item.url}
                target="_blank"
                rel="noreferrer"
                className="block rounded-lg overflow-hidden border border-gray-200 hover:shadow-md transition"
              >
                <img src={item.url} alt={item.description || `Portfolio ${idx+1}`} className="w-full aspect-[4/3] object-cover" />
                {item.description && (
                  <div className="px-2 py-1 text-xs text-gray-600 bg-white break-words">{item.description}</div>
                )}
              </a>
            ))}
          </div>
        </div>
      )}
      {/* Booking Modal */}
      {bookingOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-md bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold">Request booking</h3>
              <button onClick={() => setBookingOpen(false)} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>
            <form onSubmit={submitBooking} className="grid gap-3">
              <label className="grid gap-1 text-sm">
                <span className="text-gray-700">Your name</span>
                <input className="px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500" value={clientName} onChange={(e)=>setClientName(e.target.value)} required />
              </label>
              <label className="grid gap-1 text-sm">
                <span className="text-gray-700">Phone number</span>
                <input className="px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500" value={clientPhone} onChange={(e)=>setClientPhone(e.target.value)} required />
              </label>
              <label className="grid gap-1 text-sm">
                <span className="text-gray-700">Job description / services required</span>
                <textarea className="px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[80px]" value={jobDescription} onChange={(e)=>setJobDescription(e.target.value)} required />
              </label>
              <label className="grid gap-1 text-sm">
                <span className="text-gray-700">Address / location</span>
                <input className="px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500" value={address} onChange={(e)=>setAddress(e.target.value)} />
              </label>
              <label className="grid gap-1 text-sm">
                <span className="text-gray-700">Additional details</span>
                <textarea className="px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[60px]" value={details} onChange={(e)=>setDetails(e.target.value)} />
              </label>
              <div className="flex items-center gap-2 pt-1">
                <button type="submit" disabled={bookingSubmitting} className="px-4 py-2 rounded-md bg-emerald-600 text-white hover:bg-emerald-700 transition disabled:opacity-70">{bookingSubmitting ? 'Sending…' : 'Send request'}</button>
                <button type="button" onClick={()=>setBookingOpen(false)} className="px-4 py-2 rounded-md border border-gray-300 hover:bg-gray-50">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
