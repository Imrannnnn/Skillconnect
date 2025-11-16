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
    if (urlCategory) setCategory(urlCategory);
    if (urlProviderType) setProviderType(urlProviderType);
    if (urlCity) setCity(urlCity);
    if (urlState) setStateRegion(urlState);
    if (urlCountry) setCountry(urlCountry);
    if (urlRadius) setRadiusKm(urlRadius);
    if (urlLat) setLat(urlLat);
    if (urlLng) setLng(urlLng);
    if (urlLat && urlLng) setSortDistance(true);
    // Auto-search on first load
    if (urlCategory || urlProviderType || urlCity || urlState || urlCountry || urlRadius || urlLat || urlLng) {
      handleSearch(urlCategory, urlProviderType, urlCity, urlState, urlCountry, urlRadius, urlLat, urlLng);
    } else {
      try {
        const saved = JSON.parse(localStorage.getItem('provider_filters') || '{}');
        if (saved) {
          if (saved.category) setCategory(saved.category);
          if (saved.providerType) setProviderType(saved.providerType);
          if (saved.city) setCity(saved.city);
          if (saved.state) setStateRegion(saved.state);
          if (saved.country) setCountry(saved.country);
          if (saved.radiusKm) setRadiusKm(String(saved.radiusKm));
          if (saved.lat) setLat(String(saved.lat));
          if (saved.lng) setLng(String(saved.lng));
          if (saved.sortDistance != null) setSortDistance(Boolean(saved.sortDistance));
          if (Object.keys(saved).length) {
            handleSearch(saved.category || "", saved.providerType || "", saved.city || "", saved.state || "", saved.country || "", saved.radiusKm || "", saved.lat || "", saved.lng || "");
            return;
          }
        }
      } catch { void 0 }
      handleSearch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch category suggestions once
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
      // Client-side distance fallback if coords are present
      const rr = Number(r);
      const latNum = Number(la);
      const lngNum = Number(ln);
      if (rr > 0 && !Number.isNaN(latNum) && !Number.isNaN(lngNum)) {
        list = list.filter((p) => {
          const plat = Number(p?.latitude);
          const plng = Number(p?.longitude);
          if (Number.isNaN(plat) || Number.isNaN(plng)) return true; // keep if no coords to avoid accidental exclusion
          const d = haversineKm(latNum, lngNum, plat, plng);
          return d <= rr;
        });
      }
      // Annotate distance when client coords known
      if (!Number.isNaN(latNum) && !Number.isNaN(lngNum)) {
        list = list.map((p) => {
          const plat = Number(p?.latitude);
          const plng = Number(p?.longitude);
          if (Number.isNaN(plat) || Number.isNaN(plng)) return p;
          const d = haversineKm(latNum, lngNum, plat, plng);
          return { ...p, __distanceKm: d };
        });
        // Sort by distance if toggle is on
        if (sortDistance) {
          list.sort((a, b) => {
            const da = typeof a.__distanceKm === 'number' ? a.__distanceKm : Infinity;
            const db = typeof b.__distanceKm === 'number' ? b.__distanceKm : Infinity;
            return da - db;
          });
        }
      }
      setProviders(list);
      // sync URL for shareability
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
      // persist filters
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

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h2 className="text-2xl font-semibold">Find providers near you</h2>
      <div className="mt-1 text-xs text-gray-500">Search by skill or service (e.g. "software engineer", "plumber") and optionally use your current location so the nearest providers show first.</div>
      <div className="mt-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input
            className="px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            placeholder="Skill or service (e.g., software engineer, plumber)"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            list="cat-suggest"
          />
          <select
            className="px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            value={providerType}
            onChange={(e) => setProviderType(e.target.value)}
          >
            <option value="">Any type</option>
            <option value="individual">Individual</option>
            <option value="company">Company</option>
          </select>
        </div>
        <datalist id="cat-suggest">
          {categorySuggestions.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <input
            className="px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            placeholder="City"
            value={city}
            onChange={(e) => setCity(e.target.value)}
          />
          <input
            className="px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            placeholder="State / Region"
            value={stateRegion}
            onChange={(e) => setStateRegion(e.target.value)}
          />
          <input
            className="px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            placeholder="Country"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input
            className="w-28 px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            placeholder="Radius km"
            type="number"
            min="1"
            value={radiusKm}
            onChange={(e) => setRadiusKm(e.target.value)}
          />
          <button
            type="button"
            onClick={useMyLocation}
            className="px-3 py-2 rounded-md border border-emerald-600 text-emerald-700 hover:bg-emerald-50"
          >
            Use my location
          </button>
          <label className="inline-flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500" checked={sortDistance} onChange={(e) => setSortDistance(e.target.checked)} />
            Sort by distance
          </label>
          <div className="ms-auto flex flex-wrap gap-2">
            <button
              onClick={() => handleSearch()}
              className="px-4 py-2 rounded-md bg-emerald-600 text-white hover:bg-emerald-700 transition-all w-full sm:w-auto"
            >
              Search
            </button>
            <button
              type="button"
              onClick={() => {
                setCategory(""); setProviderType(""); setCity(""); setStateRegion(""); setCountry(""); setRadiusKm(""); setLat(""); setLng(""); setSortDistance(false);
                setSearchParams({});
                try { localStorage.removeItem('provider_filters'); } catch { void 0 }
                handleSearch("","","","","", "", "", "");
              }}
              className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 w-full sm:w-auto"
            >
              Clear filters
            </button>
          </div>
        </div>
      </div>
      <div className="mt-6">
        {loading && <p className="text-sm text-gray-500">Searching providers…</p>}
        {!loading && providers.length === 0 && (
          <p className="text-sm text-gray-500">
            {city || stateRegion || country || radiusKm
              ? "No providers available in this location."
              : category
              ? "No providers available in this category."
              : "No providers found."}
          </p>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {providers.map((p) => (
            <ProviderCard key={p._id} provider={p} distanceKm={typeof p.__distanceKm === 'number' ? p.__distanceKm : undefined} />
          ))}
        </div>
      </div>
    </div>
  );
}
