// src/pages/ProviderList.jsx
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import API from "../api/axios.js";
import ProviderCard from "../components/ProviderCard.jsx";
import { useToast } from "../components/toast.js";

export default function ProviderList() {
  const [providers, setProviders] = useState([]);
  const [category, setCategory] = useState("");
  const [categorySuggestions, setCategorySuggestions] = useState([]);
  const [providerType, setProviderType] = useState("");
  const [city, setCity] = useState("");
  const [stateRegion, setStateRegion] = useState("");
  const [country, setCountry] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const [radiusKm, setRadiusKm] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [sortDistance, setSortDistance] = useState(false);
  const { notify } = useToast();
  const [smartQuery, setSmartQuery] = useState("");
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Initialize from URL params or localStorage once
  useEffect(() => {
    const urlCategory = searchParams.get("category") || "";
    const urlProviderType = searchParams.get("providerType") || "";
    const urlCity = searchParams.get("city") || "";
    const urlState = searchParams.get("state") || "";
    const urlCountry = searchParams.get("country") || "";
    const urlRadius = searchParams.get("radiusKm") || "";
    const urlLat = searchParams.get("lat") || "";
    const urlLng = searchParams.get("lng") || "";
    const urlSmartQuery = searchParams.get("smartQuery") || "";

    if (urlCategory) setCategory(urlCategory);
    if (urlProviderType) setProviderType(urlProviderType);
    if (urlCity) setCity(urlCity);
    if (urlState) setStateRegion(urlState);
    if (urlCountry) setCountry(urlCountry);
    if (urlRadius) setRadiusKm(urlRadius);
    if (urlLat) setLat(urlLat);
    if (urlLng) setLng(urlLng);
    if (urlLat && urlLng) setSortDistance(true);
    if (urlSmartQuery) setSmartQuery(urlSmartQuery);

    // Auto-search on first load
    if (urlSmartQuery) {
      handleSmartSearch(urlSmartQuery);
    } else if (urlCategory || urlProviderType || urlCity || urlState || urlCountry || urlRadius || urlLat || urlLng) {
      handleSearch(urlCategory, urlProviderType, urlCity, urlState, urlCountry, urlRadius, urlLat, urlLng);
    } else {
      try {
        const saved = JSON.parse(localStorage.getItem('provider_filters') || '{}');
        if (saved && Object.keys(saved).length) {
          if (saved.category) setCategory(saved.category);
          if (saved.providerType) setProviderType(saved.providerType);
          if (saved.city) setCity(saved.city);
          if (saved.state) setStateRegion(saved.state);
          if (saved.country) setCountry(saved.country);
          if (saved.radiusKm) setRadiusKm(String(saved.radiusKm));
          if (saved.lat) setLat(String(saved.lat));
          if (saved.lng) setLng(String(saved.lng));
          if (saved.sortDistance != null) setSortDistance(Boolean(saved.sortDistance));

          handleSearch(
            saved.category || "",
            saved.providerType || "",
            saved.city || "",
            saved.state || "",
            saved.country || "",
            saved.radiusKm || "",
            saved.lat || "",
            saved.lng || ""
          );
          return;
        }
      } catch { void 0 }
      handleSearch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSmartSearch(initialQuery) {
    const source = initialQuery != null ? initialQuery : smartQuery;
    const trimmed = (source || "").trim();
    if (!trimmed) {
      notify("Please describe what you need (e.g. 'fix leaking sink')", { type: "info" });
      return;
    }
    setLoading(true);
    try {
      const latNum = lat ? Number(lat) : undefined;
      const lngNum = lng ? Number(lng) : undefined;
      const radiusNum = radiusKm ? Number(radiusKm) : undefined;
      const { data } = await API.post("/users/smart-search", {
        query: trimmed,
        lat: Number.isFinite(latNum) ? latNum : undefined,
        lng: Number.isFinite(lngNum) ? lngNum : undefined,
        radiusKm: Number.isFinite(radiusNum) ? radiusNum : undefined,
      });
      const list = Array.isArray(data?.providers) ? data.providers : [];
      setProviders(list);

      if (!initialQuery) {
        setSmartQuery("");
        const next = new URLSearchParams(searchParams);
        next.delete("smartQuery");
        setSearchParams(Object.fromEntries(next.entries()));
      }
    } catch (error) {
      console.error("Error smart-searching providers:", error);
      notify("Failed to smart-match providers. Please try again.", { type: "error" });
      setProviders([]);
    } finally {
      setLoading(false);
    }
  }

  // Fetch category suggestions
  useEffect(() => {
    let mounted = true;
    async function loadCats() {
      try {
        const { data } = await API.get('/categories');
        const cats = Array.isArray(data?.categories) ? data.categories : [];
        if (mounted) setCategorySuggestions(cats.slice(0, 50));
      } catch { /* ignore */ }
    }
    loadCats();
    return () => { mounted = false };
  }, []);

  async function handleSearch(
    cat = category,
    type = providerType,
    c = city,
    st = stateRegion,
    co = country,
    r = radiusKm,
    la = lat,
    ln = lng
  ) {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("role", "provider");
      if (cat) params.set("category", cat);
      if (type) params.set("providerType", type);
      if (c) params.set("city", c);
      if (st) params.set("state", st);
      if (co) params.set("country", co);
      if (r) params.set("radiusKm", r);
      if (la) params.set("lat", la);
      if (ln) params.set("lng", ln);
      if (la && ln && sortDistance) params.set("sort", "distance");

      const { data } = await API.get(`/users?${params.toString()}`);
      let list = Array.isArray(data?.users) ? data.users : data || [];

      const rr = Number(r);
      const latNum = Number(la);
      const lngNum = Number(ln);

      // Client-side filtering/distances
      if (rr > 0 && !Number.isNaN(latNum) && !Number.isNaN(lngNum)) {
        list = list.filter((p) => {
          const plat = Number(p?.latitude);
          const plng = Number(p?.longitude);
          if (Number.isNaN(plat) || Number.isNaN(plng)) return true;
          const d = haversineKm(latNum, lngNum, plat, plng);
          return d <= rr;
        });
      }

      if (!Number.isNaN(latNum) && !Number.isNaN(lngNum)) {
        list = list.map((p) => {
          const plat = Number(p?.latitude);
          const plng = Number(p?.longitude);
          if (Number.isNaN(plat) || Number.isNaN(plng)) return p;
          const d = haversineKm(latNum, lngNum, plat, plng);
          return { ...p, __distanceKm: d };
        });

        if (sortDistance) {
          list.sort((a, b) => {
            const da = typeof a.__distanceKm === 'number' ? a.__distanceKm : Infinity;
            const db = typeof b.__distanceKm === 'number' ? b.__distanceKm : Infinity;
            return da - db;
          });
        }
      }

      setProviders(list);

      // Update/Persist params
      const next = {};
      if (cat) next.category = cat;
      if (type) next.providerType = type;
      if (c) next.city = c;
      if (st) next.state = st;
      if (co) next.country = co;
      if (r) next.radiusKm = r;
      if (la) next.lat = la;
      if (ln) next.lng = ln;
      setSearchParams(next);

      try {
        localStorage.setItem('provider_filters', JSON.stringify({
          category: cat || "",
          providerType: type || "",
          city: c || "",
          state: st || "",
          country: co || "",
          radiusKm: r || "",
          lat: la || "",
          lng: ln || "",
          sortDistance,
        }));
      } catch { void 0 }
    } catch (error) {
      console.error("Error fetching providers:", error);
      setProviders([]);
    } finally {
      setLoading(false);
    }
  }

  function useMyLocation() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: la, longitude: ln } = pos.coords || {};
        if (typeof la === "number" && typeof ln === "number") {
          setLat(String(la));
          setLng(String(ln));
          handleSearch(undefined, undefined, undefined, undefined, undefined, radiusKm || "10", String(la), String(ln));
        }
      },
      (err) => { notify(err?.message || "Unable to get location", { type: 'error' }); }
    );
  }

  function haversineKm(lat1, lon1, lat2, lon2) {
    const toRad = (v) => (v * Math.PI) / 180;
    const R = 6371; // km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  function clearFilters() {
    setCategory("");
    setProviderType("");
    setCity("");
    setStateRegion("");
    setCountry("");
    setRadiusKm("");
    setLat("");
    setLng("");
    setSortDistance(false);
    setSearchParams({});
    try { localStorage.removeItem('provider_filters'); } catch { void 0 }
    handleSearch("", "", "", "", "", "", "", "");
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Hero Section */}
      <div className="relative bg-emerald-900 border-b border-gray-200">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1521737604893-d14cc237f11d?ixlib=rb-4.0.3&auto=format&fit=crop&w=2684&q=80')] bg-cover bg-center opacity-10 mix-blend-overlay"></div>
        <div className="relative max-w-7xl mx-auto px-4 py-16 sm:py-24 flex flex-col items-center text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-4">
            Find the perfect professional
          </h1>
          <p className="text-emerald-100 text-lg sm:text-xl max-w-2xl mb-8">
            Search by skill, service, or just tell us what you need done.
          </p>

          {/* Smart Search Bar */}
          <div className="w-full max-w-2xl bg-white rounded-xl shadow-xl p-2 flex flex-col sm:flex-row gap-2">
            <input
              className="flex-1 px-4 py-3 bg-transparent text-gray-900 placeholder-gray-500 focus:outline-none text-lg"
              placeholder="Describe your task (e.g. 'I need a plumber for a leak')"
              value={smartQuery}
              onChange={(e) => setSmartQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSmartSearch(null)}
            />
            <button
              onClick={() => handleSmartSearch(null)}
              className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
              <span>Smart Search</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">

          {/* Mobile Filter Toggle */}
          <div className="lg:hidden mb-4">
            <button
              onClick={() => setShowMobileFilters(!showMobileFilters)}
              className="w-full py-3 bg-white border border-gray-200 rounded-lg shadow-sm font-medium text-gray-700 flex items-center justify-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17.293V11.414L4.293 6.707A1 1 0 014 6V3z" clipRule="evenodd" />
              </svg>
              {showMobileFilters ? "Hide Filters" : "Show Filters"}
            </button>
          </div>

          {/* Sticky Sidebar Filters */}
          <aside className={`lg:w-72 flex-shrink-0 ${showMobileFilters ? 'block' : 'hidden lg:block'}`}>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sticky top-24">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-gray-900">Filters</h3>
                <button onClick={clearFilters} className="text-sm text-emerald-600 hover:text-emerald-700 font-medium">Reset</button>
              </div>

              <div className="space-y-6">
                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                  <input
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-shadow outline-none"
                    placeholder="e.g. Design, Development"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    list="cat-suggest"
                  />
                  <datalist id="cat-suggest">
                    {categorySuggestions.map((c) => (
                      <option key={c} value={c} />
                    ))}
                  </datalist>
                </div>

                {/* Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Provider Type</label>
                  <select
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                    value={providerType}
                    onChange={(e) => setProviderType(e.target.value)}
                  >
                    <option value="">Any</option>
                    <option value="individual">Individual</option>
                    <option value="company">Company</option>
                  </select>
                </div>

                {/* Location */}
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700">Location</label>
                  <input
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                    placeholder="City"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                  />
                  <input
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                    placeholder="State"
                    value={stateRegion}
                    onChange={(e) => setStateRegion(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <input
                      className="w-1/2 px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                      placeholder="Country"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                    />
                    <input
                      className="w-1/2 px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                      placeholder="Radius (km)"
                      type="number"
                      value={radiusKm}
                      onChange={(e) => setRadiusKm(e.target.value)}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={useMyLocation}
                    className="w-full py-2 text-sm text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg flex items-center justify-center gap-2 transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                    </svg>
                    Use my location
                  </button>
                </div>

                {/* Sort */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <span className="text-sm text-gray-700">Sort by distance</span>
                  <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
                    <input
                      type="checkbox"
                      name="toggle"
                      id="toggle"
                      className="toggle-checkbox absolute block w-5 h-5 rounded-full bg-white border-4 appearance-none cursor-pointer"
                      checked={sortDistance}
                      onChange={(e) => setSortDistance(e.target.checked)}
                    />
                    <label htmlFor="toggle" className="toggle-label block overflow-hidden h-5 rounded-full bg-gray-300 cursor-pointer"></label>
                  </div>
                </div>

                <button
                  onClick={() => handleSearch()}
                  className="w-full py-3 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-800 transition-colors shadow-sm"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                {loading ? "Searching..." : `${providers.length} Professionals Found`}
              </h2>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="loader h-10 w-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="mt-4 text-emerald-600 font-medium">Finding the best matches...</p>
              </div>
            ) : providers.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-sm">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-100 mb-6 text-gray-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">No providers found</h3>
                <p className="text-gray-500 max-w-sm mx-auto mb-6">
                  {smartQuery
                    ? "We couldn't find anyone matching that description. Try broader keywords."
                    : "Try adjusting your filters or search radius to see more results."}
                </p>
                <button onClick={clearFilters} className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium">
                  Clear all filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {providers.map(p => (
                  <ProviderCard key={p._id} provider={p} distanceKm={typeof p.__distanceKm === 'number' ? p.__distanceKm : undefined} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
