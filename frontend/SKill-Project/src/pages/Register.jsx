import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/auth.js";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [accountType, setAccountType] = useState("individual"); // 'individual' | 'organization'
  const [role, setRole] = useState("client");
  const [providerType, setProviderType] = useState("individual");
  const [providerMode, setProviderMode] = useState("service");
  const [orgSector, setOrgSector] = useState("");
  const [orgPhone, setOrgPhone] = useState("");
  const [categories, setCategories] = useState([]);
  const [catInput, setCatInput] = useState("");
  const [bio, setBio] = useState("");
  const [city, setCity] = useState("");
  const [stateRegion, setStateRegion] = useState("");
  const [country, setCountry] = useState("");
  const [error, setError] = useState("");
  const [instagram, setInstagram] = useState("");
  const [facebook, setFacebook] = useState("");
  const [tiktok, setTiktok] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [website, setWebsite] = useState("");
  const [step, setStep] = useState(0);
  const navigate = useNavigate();
  const auth = useContext(AuthContext);

  const isOrg = accountType === "organization";
  const isProvider = !isOrg && role === "provider";
  const maxStep = isOrg ? 0 : (isProvider ? 2 : 1);

  function handleSubmit(e) {
    e.preventDefault();
    setError("");

    // Basic validation for the main account step
    if (step === 0) {
      if (!name || !email || !password) {
        setError("Name, email and password are required.");
        return;
      }
      if (password.length < 6) {
        setError("Password should be at least 6 characters.");
        return;
      }
    }

    // Multi-step: advance until final step for individual accounts
    if (!isOrg && step < maxStep) {
      setStep((s) => Math.min(maxStep, s + 1));
      return;
    }

    let payload;
    if (isOrg) {
      payload = {
        name,
        email: email.trim().toLowerCase(),
        password,
        accountType: "organization",
        sector: orgSector || undefined,
        phone: orgPhone || undefined,
      };
    } else {
      payload = { name, email: email.trim().toLowerCase(), password, role, accountType: "individual" };
      if (role === "provider") {
        payload.providerType = providerType;
        payload.providerMode = providerMode;
        if (categories.length) payload.categories = categories;
        if (bio) payload.bio = bio;
        payload.social = {
          instagram: instagram || undefined,
          facebook: facebook || undefined,
          tiktok: tiktok || undefined,
          whatsapp: whatsapp || undefined,
          website: website || undefined,
        };
      }
      if (city) payload.city = city;
      if (stateRegion) payload.state = stateRegion;
      if (country) payload.country = country;
    }
    auth
      .register(payload)
      .then(() => {
        navigate(`/login?registered=1&email=${encodeURIComponent(email)}`);
      })
      .catch((err) => setError(err?.response?.data?.message || "Registration failed"));
  }

  return (
    <div className="max-w-md mx-auto mt-10 bg-white rounded-lg border border-gray-200 shadow-sm p-4 sm:p-6">
      <h2 className="text-xl font-semibold mb-1">Create your account</h2>
      <p className="text-sm text-gray-500 mb-1">Choose your role and get started.</p>
      <p className="text-xs text-gray-400 mb-2">Step {step + 1} of {maxStep + 1}</p>
      <div className="flex items-center gap-2 mb-4 text-xs">
        <span className={`px-2 py-1 rounded-full border ${step === 0 ? 'border-emerald-600 text-emerald-700 bg-emerald-50' : 'border-gray-200 text-gray-500'}`}>1. Account</span>
        <span className={`px-2 py-1 rounded-full border ${step === 1 ? 'border-emerald-600 text-emerald-700 bg-emerald-50' : 'border-gray-200 text-gray-500'}`}>{isProvider ? '2. Provider details' : '2. Location'}</span>
        {isProvider && (
          <span className={`px-2 py-1 rounded-full border ${step === 2 ? 'border-emerald-600 text-emerald-700 bg-emerald-50' : 'border-gray-200 text-gray-500'}`}>3. Location & social</span>
        )}
      </div>
      <form onSubmit={handleSubmit} className="grid gap-3">
        {step === 0 && (
          <>
            <div className="grid sm:grid-cols-2 gap-3 mb-1">
              <label className="grid gap-1 text-sm">
                <span className="text-gray-700">Account type</span>
                <select
                  className="px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  value={accountType}
                  onChange={(e) => { setAccountType(e.target.value); setStep(0); }}
                >
                  <option value="individual">Individual (client or provider)</option>
                  <option value="organization">Organization</option>
                </select>
              </label>
              {!isOrg && (
                <label className="grid gap-1 text-sm">
                  <span className="text-gray-700">Role</span>
                  <select
                    className="px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    value={role}
                    onChange={(e) => { setRole(e.target.value); setStep(0); }}
                  >
                    <option value="client">Client</option>
                    <option value="provider">Provider</option>
                  </select>
                </label>
              )}
            </div>
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
            {isProvider && !isOrg && (
              <div className="grid sm:grid-cols-2 gap-3">
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
                <label className="grid gap-1 text-sm">
                  <span className="text-gray-700">Provider Mode</span>
                  <select
                    className="px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    value={providerMode}
                    onChange={(e) => setProviderMode(e.target.value)}
                  >
                    <option value="service">Service provider</option>
                    <option value="product">Product provider</option>
                    <option value="both">Both service & product</option>
                  </select>
                </label>
              </div>
            )}
            {isOrg && (
              <div className="grid sm:grid-cols-2 gap-3 mt-2">
                <label className="grid gap-1 text-sm">
                  <span className="text-gray-700">Sector</span>
                  <input
                    className="px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="e.g. Hospital, School, Airline, NGO"
                    value={orgSector}
                    onChange={(e) => setOrgSector(e.target.value)}
                  />
                </label>
                <label className="grid gap-1 text-sm">
                  <span className="text-gray-700">Organization phone (optional)</span>
                  <input
                    className="px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="Contact phone number"
                    value={orgPhone}
                    onChange={(e) => setOrgPhone(e.target.value)}
                  />
                </label>
              </div>
            )}
          </>
        )}

        {step === 1 && isProvider && !isOrg && (
          <>
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
          </>
        )}

        {((step === 1 && !isProvider) || (step === 2 && isProvider)) && (
          <>
            <div className="pt-2">
              <h3 className="text-sm font-medium text-gray-700">Location</h3>
              <p className="text-xs text-gray-500 mb-1">Optional, but helps clients find you with proximity search.</p>
              <p className="text-[11px] text-gray-400 mb-2">Distance is calculated from your approximate location combined with the provider's live location when available.</p>
            </div>
            <div className="grid sm:grid-cols-3 gap-3">
              <label className="grid gap-1 text-sm">
                <span className="text-gray-700">City</span>
                <input
                  className="w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="City"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                />
              </label>
              <label className="grid gap-1 text-sm">
                <span className="text-gray-700">State / Region</span>
                <input
                  className="w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="State / Region"
                  value={stateRegion}
                  onChange={(e) => setStateRegion(e.target.value)}
                />
              </label>
              <label className="grid gap-1 text-sm">
                <span className="text-gray-700">Country</span>
                <input
                  className="w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Country"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                />
              </label>
            </div>
            {isProvider && (
              <div className="pt-2">
                <h3 className="text-sm font-medium text-gray-700">Social links (optional)</h3>
                <p className="text-xs text-gray-500 mb-2">These will appear on your public profile so clients can verify your business.</p>
                <div className="grid gap-2">
                  <input
                    className="px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="Instagram URL"
                    value={instagram}
                    onChange={(e) => setInstagram(e.target.value)}
                  />
                  <input
                    className="px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="Facebook URL"
                    value={facebook}
                    onChange={(e) => setFacebook(e.target.value)}
                  />
                  <input
                    className="px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="TikTok URL"
                    value={tiktok}
                    onChange={(e) => setTiktok(e.target.value)}
                  />
                  <input
                    className="px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="WhatsApp Business link or number"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                  />
                  <input
                    className="px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="Website URL"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                  />
                </div>
              </div>
            )}
          </>
        )}

        <div className="flex items-center justify-between mt-2">
          <button
            type="button"
            disabled={step === 0}
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            className={`px-3 py-2 rounded-md border text-sm ${step === 0 ? 'border-gray-200 text-gray-300 cursor-not-allowed' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}
          >
            Back
          </button>
          <button
            type="submit"
            className="px-4 py-2 rounded-md bg-emerald-600 text-white hover:bg-emerald-700 transition-all"
          >
            {step < maxStep ? 'Next' : 'Create account'}
          </button>
        </div>
      </form>
      {error && <p className="text-rose-500 mt-3 text-sm">{error}</p>}
    </div>
  );
}
