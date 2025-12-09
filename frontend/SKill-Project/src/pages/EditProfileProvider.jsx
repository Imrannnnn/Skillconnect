import { useContext, useEffect, useMemo, useState } from "react";
import { AuthContext } from "../context/auth.js";
import API from "../api/axios.js";
import { useNavigate } from "react-router-dom";
import { getImageUrl } from "../utils/image.js";

export default function EditProfileProvider() {
  const { user, setUser } = useContext(AuthContext);
  const navigate = useNavigate();

  const [bio, setBio] = useState(user?.bio || "");
  const [handle, setHandle] = useState(user?.handle || "");
  const [categories, setCategories] = useState(Array.isArray(user?.categories) ? user.categories : []);
  const [catInput, setCatInput] = useState("");
  const [city, setCity] = useState(user?.location?.city || user?.city || "");
  const [stateRegion, setStateRegion] = useState(user?.location?.state || user?.state || "");
  const [country, setCountry] = useState(user?.location?.country || user?.country || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(user?.avatarUrl || "");
  const [dragOver, setDragOver] = useState(false);
  const [providerMode, setProviderMode] = useState(user?.providerMode || "service");
  const [instagram, setInstagram] = useState(user?.social?.instagram || "");
  const [facebook, setFacebook] = useState(user?.social?.facebook || "");
  const [tiktok, setTiktok] = useState(user?.social?.tiktok || "");
  const [whatsapp, setWhatsapp] = useState(user?.social?.whatsapp || "");
  const [website, setWebsite] = useState(user?.social?.website || "");
  const [step, setStep] = useState(0);
  const [lat, setLat] = useState(user?.location?.latitude ?? user?.latitude ?? null);
  const [lng, setLng] = useState(user?.location?.longitude ?? user?.longitude ?? null);

  const isProvider = useMemo(() => user?.role === "provider", [user]);

  useEffect(() => {
    if (!user) navigate("/login");
  }, [user, navigate]);

  function addCategoriesFromInput() {
    const raw = catInput.split(",").map((s) => s.trim()).filter(Boolean);
    if (!raw.length) return;
    if (raw.some((c) => c.length > 30)) {
      setError("Each category must be 30 characters or fewer.");
      return;
    }
    const merged = Array.from(new Set([...(categories || []), ...raw]));
    if (merged.length > 8) {
      setError("You can add up to 8 categories.");
      return;
    }
    setError("");
    setCategories(merged);
    setCatInput("");
  }

  async function handleSave(e) {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!user?._id) return;
    const maxStep = 2;

    // Multi-step: advance until final step, then submit
    if (step < maxStep) {
      if (step === 1 && (!categories || categories.length === 0)) {
        setError("Add at least one category before continuing.");
        return;
      }
      setStep((s) => Math.min(maxStep, s + 1));
      return;
    }

    // Basic client-side validation for handle (if provided)
    if (handle) {
      const normalized = handle.trim().toLowerCase();
      if (!/^[a-z0-9_-]{3,30}$/.test(normalized)) {
        setError("Handle must be 3-30 characters of a-z, 0-9, '-' or '_'.");
        return;
      }
    }

    setSaving(true);
    try {
      // If avatar selected, upload first
      if (avatarFile) {
        const fd = new FormData();
        fd.append('avatar', avatarFile);
        const { data: up } = await API.put(`/users/${user._id}/avatar`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        if (up?.user?.avatarUrl) {
          setUser({ ...user, avatarUrl: up.user.avatarUrl });
          setAvatarPreview(up.user.avatarUrl);
        }
      }

      const payload = {
        bio,
        categories,
        providerMode,
        handle: handle ? handle.trim().toLowerCase() : undefined,
        city,
        state: stateRegion,
        country,
        social: {
          instagram: instagram || undefined,
          facebook: facebook || undefined,
          tiktok: tiktok || undefined,
          whatsapp: whatsapp || undefined,
          website: website || undefined,
        },
      };
      if (typeof lat === "number" && typeof lng === "number") {
        payload.latitude = lat;
        payload.longitude = lng;
        payload.location = {
          ...(user?.location || {}),
          city,
          state: stateRegion,
          country,
          latitude: lat,
          longitude: lng,
        };
      }
      const { data } = await API.put(`/providers/${user._id}`, payload);
      if (data) {
        // merge into local user state
        setUser({ ...user, ...data });
        setSuccess("Profile updated successfully.");
      }
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  }

  if (!isProvider) {
    return (
      <div className="max-w-xl mx-auto px-4 py-8">
        <h2 className="text-xl font-semibold">Edit Profile</h2>
        <p className="text-sm text-gray-500 mt-2">Only provider accounts can edit provider profile details.</p>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <h2 className="text-2xl font-semibold">Edit Profile</h2>
      <p className="text-sm text-gray-500 mt-1">Update your categories, bio, location, and social links.</p>

      <div className="mt-3 flex items-center gap-2 text-xs">
        <span className={`px-2 py-1 rounded-full border ${step === 0 ? 'border-emerald-600 text-emerald-700 bg-emerald-50' : 'border-gray-200 text-gray-500'}`}>1. Avatar & what you offer</span>
        <span className={`px-2 py-1 rounded-full border ${step === 1 ? 'border-emerald-600 text-emerald-700 bg-emerald-50' : 'border-gray-200 text-gray-500'}`}>2. Categories & bio</span>
        <span className={`px-2 py-1 rounded-full border ${step === 2 ? 'border-emerald-600 text-emerald-700 bg-emerald-50' : 'border-gray-200 text-gray-500'}`}>3. Location & social</span>
      </div>

      <form onSubmit={handleSave} className="mt-4 grid gap-3 bg-white border border-gray-200 rounded-lg p-4">
        {step === 0 && (
          <>
            <div>
              <h3 className="text-sm font-medium text-gray-700">Avatar</h3>
              <p className="text-xs text-gray-500 mb-2">PNG/JPG/WEBP up to 5MB.</p>
              <div className="flex items-center gap-3 mb-2">
                <div className="h-16 w-16 rounded-full overflow-hidden bg-emerald-100 flex items-center justify-center text-emerald-700 font-semibold">
                  {avatarPreview ? (
                    <img src={getImageUrl(avatarPreview)} alt="avatar" className="h-full w-full object-cover" />
                  ) : (
                    (user?.name?.[0] || 'P').toUpperCase()
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => document.getElementById('avatar-input')?.click()}
                    className="inline-flex items-center px-3 py-1.5 text-sm rounded-md border border-gray-300 hover:bg-gray-50"
                  >
                    Change avatar
                  </button>
                  <input
                    id="avatar-input"
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/webp"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (!f) return;
                      setAvatarFile(f);
                      const url = URL.createObjectURL(f);
                      setAvatarPreview(url);
                    }}
                  />
                </div>
              </div>
              <div
                className={`mt-2 rounded-md border-2 border-dashed p-4 text-center text-xs transition ${dragOver ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-gray-300 text-gray-500'}`}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  const f = e.dataTransfer.files?.[0];
                  if (!f) return;
                  if (!['image/png', 'image/jpeg', 'image/jpg', 'image/webp'].includes(f.type)) return;
                  setAvatarFile(f);
                  const url = URL.createObjectURL(f);
                  setAvatarPreview(url);
                }}
              >
                Drag & drop an image here to upload
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-700 mt-4">What you offer</h3>
              <p className="text-xs text-gray-500 mb-2">Choose whether you provide services, products, or both.</p>
              <select
                className="px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                value={providerMode}
                onChange={(e) => setProviderMode(e.target.value)}
              >
                <option value="service">Service provider</option>
                <option value="product">Product provider</option>
                <option value="both">Both service & product</option>
              </select>
              <div className="mt-4">
                <h3 className="text-sm font-medium text-gray-700">Public handle / link</h3>
                <p className="text-xs text-gray-500 mb-2">
                  This becomes part of your public link, for example <span className="font-mono">@mybusiness</span>. Only a-z, 0-9, '-' and '_' are allowed.
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">@</span>
                  <input
                    className="flex-1 px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                    value={handle}
                    onChange={(e) => setHandle(e.target.value)}
                    placeholder="yourbusiness"
                  />
                </div>
              </div>
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <div>
              <h3 className="text-sm font-medium text-gray-700">Categories</h3>
              <p className="text-xs text-gray-500 mb-2">Max 8 items. Each up to 30 characters. Press Enter or comma to add.</p>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                {(categories || []).map((c) => (
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
                    addCategoriesFromInput();
                  }
                  if (e.key === 'Backspace' && !catInput && categories?.length) {
                    setCategories((prev) => prev.slice(0, -1));
                  }
                }}
                onBlur={addCategoriesFromInput}
              />
            </div>

            <label className="grid gap-1 text-sm">
              <span className="text-gray-700">Bio</span>
              <textarea
                className="px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[100px]"
                placeholder="Tell clients about your experience, skills, and what you offer."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
              />
            </label>
          </>
        )}

        {step === 2 && (
          <>
            <div>
              <h3 className="text-sm font-medium text-gray-700">Location</h3>
              <p className="text-xs text-gray-500 mb-1">Optional, but helps clients find you with proximity search.</p>
              <p className="text-[11px] text-gray-400 mb-2">Distance is calculated from your approximate location combined with the client's live location when available.</p>
              <div className="grid sm:grid-cols-3 gap-3">
                <label className="grid gap-1 text-sm">
                  <span className="text-gray-700">City</span>
                  <input className="px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500" value={city} onChange={(e) => setCity(e.target.value)} />
                </label>
                <label className="grid gap-1 text-sm">
                  <span className="text-gray-700">State / Region</span>
                  <input className="px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500" value={stateRegion} onChange={(e) => setStateRegion(e.target.value)} />
                </label>
                <label className="grid gap-1 text-sm">
                  <span className="text-gray-700">Country</span>
                  <input className="w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500" value={country} onChange={(e) => setCountry(e.target.value)} />
                </label>
              </div>
              <div className="mt-2 flex items-center gap-2 text-xs text-gray-600">
                <button
                  type="button"
                  onClick={() => {
                    if (!navigator.geolocation) {
                      setError("Geolocation is not supported in this browser.");
                      return;
                    }
                    navigator.geolocation.getCurrentPosition(
                      (pos) => {
                        const { latitude: la, longitude: lo } = pos.coords || {};
                        if (typeof la === "number" && typeof lo === "number") {
                          setLat(la);
                          setLng(lo);
                          setSuccess("Live location captured for distance-based search.");
                        }
                      },
                      (err) => {
                        setError(err?.message || "Unable to get current location.");
                      }
                    );
                  }}
                  className="px-3 py-1.5 rounded-md border border-emerald-600 text-emerald-700 hover:bg-emerald-50 text-xs"
                >
                  Use my current location
                </button>
                {typeof lat === "number" && typeof lng === "number" && (
                  <span className="text-[11px] text-gray-500">Location saved for search (hidden from clients).</span>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-700 mt-4">Social links (optional)</h3>
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
          </>
        )}

        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            disabled={step === 0}
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            className={`px-4 py-2 rounded-md border text-sm ${step === 0 ? 'border-gray-200 text-gray-300 cursor-not-allowed' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}
          >
            Back
          </button>
          <button
            type="submit"
            disabled={saving}
            className="ml-auto px-4 py-2 rounded-md bg-emerald-600 text-white hover:bg-emerald-700 transition disabled:opacity-70"
          >
            {step < 2 ? 'Next' : (saving ? 'Saving…' : 'Save changes')}
          </button>
          <button type="button" onClick={() => navigate(-1)} className="px-4 py-2 rounded-md border border-gray-300 hover:bg-gray-50">Cancel</button>
        </div>
        {error && <p className="text-rose-600 text-sm">{error}</p>}
        {success && <p className="text-emerald-700 text-sm">{success}</p>}
      </form>
    </div>
  );
}
