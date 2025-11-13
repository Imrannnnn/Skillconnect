import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/auth.js";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("client");
  const [providerType, setProviderType] = useState("individual");
  const [categories, setCategories] = useState([]);
  const [catInput, setCatInput] = useState("");
  const [bio, setBio] = useState("");
  const [city, setCity] = useState("");
  const [stateRegion, setStateRegion] = useState("");
  const [country, setCountry] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const auth = useContext(AuthContext);

  function handleSubmit(e) {
    e.preventDefault();
    setError("");
    const payload = { name, email, password, role };
    if (role === "provider") {
      payload.providerType = providerType;
      if (categories.length) payload.categories = categories;
      if (bio) payload.bio = bio;
    }
    if (city) payload.city = city;
    if (stateRegion) payload.state = stateRegion;
    if (country) payload.country = country;
    if (latitude) payload.latitude = Number(latitude);
    if (longitude) payload.longitude = Number(longitude);
    auth
      .register(payload)
      .then(() => {
        const next = role === "provider" ? "/provider/dashboard" : "/dashboard";
        navigate(next);
      })
      .catch((err) => setError(err?.response?.data?.message || "Registration failed"));
  }

  return (
    <div className="max-w-md mx-auto mt-10 bg-white rounded-lg border border-gray-200 shadow-sm p-4 sm:p-6">
      <h2 className="text-xl font-semibold mb-1">Create your account</h2>
      <p className="text-sm text-gray-500 mb-5">Choose your role and get started.</p>
      <form onSubmit={handleSubmit} className="grid gap-3">
        <label className="grid gap-1 text-sm">
          <span className="text-gray-700">Name</span>
          <input
            className="px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            placeholder="Jane Doe"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </label>
        <label className="grid gap-1 text-sm">
          <span className="text-gray-700">Email</span>
          <input
            className="px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            placeholder="jane@email.com"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>
        <label className="grid gap-1 text-sm">
          <span className="text-gray-700">Password</span>
          <input
            className="px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            placeholder="••••••••"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>
        <div className="grid sm:grid-cols-2 gap-3">
          <label className="grid gap-1 text-sm">
            <span className="text-gray-700">Role</span>
            <select
              className="px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="client">Client</option>
              <option value="provider">Provider</option>
            </select>
          </label>
          {role === "provider" && (
            <label className="grid gap-1 text-sm">
              <span className="text-gray-700">Provider Type</span>
              <select
                className="px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                value={providerType}
                onChange={(e) => setProviderType(e.target.value)}
              >
                <option value="individual">Individual</option>
                <option value="company">Company</option>
              </select>
              <span className="text-xs text-gray-500">Choose whether you are an individual freelancer or a registered company.</span>
            </label>
          )}
        </div>
        {role === "provider" && (
          <div className="grid gap-3">
            <div>
              <h3 className="text-sm font-medium text-gray-700">Categories</h3>
              <p className="text-xs text-gray-500 mb-2">Add one or more categories that describe your services. Press Enter or comma to add.</p>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                {categories.map((c) => (
                  <span key={c} className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700">
                    {c}
                    <button type="button" onClick={() => setCategories((prev) => prev.filter((x) => x !== c))} className="ml-1 text-emerald-700/80 hover:text-emerald-900">×</button>
                  </span>
                ))}
              </div>
              <input
                className="w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="e.g. plumbing, electrical, web design"
                value={catInput}
                onChange={(e) => setCatInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ',') {
                    e.preventDefault();
                    const raw = catInput.split(',').map((s) => s.trim()).filter(Boolean);
                    if (raw.some((c) => c.length > 30)) {
                      setError('Each category must be 30 characters or fewer.');
                      return;
                    }
                    const merged = Array.from(new Set([...categories, ...raw]));
                    if (merged.length > 8) {
                      setError('You can add up to 8 categories.');
                      return;
                    }
                    setError("");
                    setCategories(merged);
                    setCatInput("");
                  }
                  if (e.key === 'Backspace' && !catInput && categories.length) {
                    setCategories((prev) => prev.slice(0, -1));
                  }
                }}
                onBlur={() => {
                  const raw = catInput.split(',').map((s) => s.trim()).filter(Boolean);
                  if (raw.length) {
                    if (raw.some((c) => c.length > 30)) {
                      setError('Each category must be 30 characters or fewer.');
                      return;
                    }
                    const merged = Array.from(new Set([...categories, ...raw]));
                    if (merged.length > 8) {
                      setError('You can add up to 8 categories.');
                      return;
                    }
                    setError("");
                    setCategories(merged);
                    setCatInput("");
                  }
                }}
              />
            </div>
            <label className="grid gap-1 text-sm">
              <span className="text-gray-700">Bio</span>
              <textarea
                className="px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[90px]"
                placeholder="Tell clients about your experience, skills, and what you offer."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
              />
            </label>
          </div>
        )}
        <div className="pt-2">
          <h3 className="text-sm font-medium text-gray-700">Location</h3>
          <p className="text-xs text-gray-500 mb-2">Optional, but helps clients find you with proximity search.</p>
        </div>
        <div className="grid sm:grid-cols-3 gap-3">
          <label className="grid gap-1 text-sm">
            <span className="text-gray-700">City</span>
            <input
              className="px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="City"
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="text-gray-700">State / Region</span>
            <input
              className="px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="State / Region"
              value={stateRegion}
              onChange={(e) => setStateRegion(e.target.value)}
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="text-gray-700">Country</span>
            <input
              className="px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="Country"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
            />
          </label>
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <label className="grid gap-1 text-sm">
            <span className="text-gray-700">Latitude (optional)</span>
            <input
              className="px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="e.g. 37.7749"
              type="number"
              step="any"
              value={latitude}
              onChange={(e) => setLatitude(e.target.value)}
            />
            <span className="text-xs text-gray-500">Used to calculate distance for nearby clients.</span>
          </label>
          <label className="grid gap-1 text-sm">
            <span className="text-gray-700">Longitude (optional)</span>
            <input
              className="px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="e.g. -122.4194"
              type="number"
              step="any"
              value={longitude}
              onChange={(e) => setLongitude(e.target.value)}
            />
            <span className="text-xs text-gray-500">Pair with latitude for accurate proximity search.</span>
          </label>
        </div>
        <button type="submit" className="mt-2 px-4 py-2 rounded-md bg-emerald-600 text-white hover:bg-emerald-700 transition-all">
          Create account
        </button>
      </form>
      {error && <p className="text-rose-500 mt-3 text-sm">{error}</p>}
    </div>
  );
}
