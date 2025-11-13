import { useContext, useEffect, useMemo, useState } from "react";
import { AuthContext } from "../context/auth.js";
import API from "../api/axios.js";
import { useNavigate } from "react-router-dom";

export default function EditProfileProvider() {
  const { user, setUser } = useContext(AuthContext);
  const navigate = useNavigate();

  const [bio, setBio] = useState(user?.bio || "");
  const [categories, setCategories] = useState(Array.isArray(user?.categories) ? user.categories : []);
  const [catInput, setCatInput] = useState("");
  const [city, setCity] = useState(user?.location?.city || user?.city || "");
  const [stateRegion, setStateRegion] = useState(user?.location?.state || user?.state || "");
  const [country, setCountry] = useState(user?.location?.country || user?.country || "");
  const [latitude, setLatitude] = useState(user?.latitude || user?.location?.latitude || "");
  const [longitude, setLongitude] = useState(user?.longitude || user?.location?.longitude || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(user?.avatarUrl || "");
  const [dragOver, setDragOver] = useState(false);

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
        city,
        state: stateRegion,
        country,
        latitude: latitude ? Number(latitude) : undefined,
        longitude: longitude ? Number(longitude) : undefined,
      };
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
      <p className="text-sm text-gray-500 mt-1">Update your categories, bio, and location.</p>

      <form onSubmit={handleSave} className="mt-4 grid gap-3 bg-white border border-gray-200 rounded-lg p-4">
        <div>
          <h3 className="text-sm font-medium text-gray-700">Avatar</h3>
          <p className="text-xs text-gray-500 mb-2">PNG/JPG/WEBP up to 5MB.</p>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-16 w-16 rounded-full overflow-hidden bg-emerald-100 flex items-center justify-center text-emerald-700 font-semibold">
              {avatarPreview ? (
                <img src={avatarPreview} alt="avatar" className="h-full w-full object-cover" />
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
              if (!['image/png','image/jpeg','image/jpg','image/webp'].includes(f.type)) return;
              setAvatarFile(f);
              const url = URL.createObjectURL(f);
              setAvatarPreview(url);
            }}
          >
            Drag & drop an image here to upload
          </div>
        </div>
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

        <div>
          <h3 className="text-sm font-medium text-gray-700">Location</h3>
          <p className="text-xs text-gray-500 mb-2">Optional, but helps clients find you with proximity search.</p>
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
              <input className="px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500" value={country} onChange={(e) => setCountry(e.target.value)} />
            </label>
          </div>
          <div className="grid sm:grid-cols-2 gap-3 mt-3">
            <label className="grid gap-1 text-sm">
              <span className="text-gray-700">Latitude (optional)</span>
              <input type="number" step="any" className="px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500" value={latitude} onChange={(e) => setLatitude(e.target.value)} />
            </label>
            <label className="grid gap-1 text-sm">
              <span className="text-gray-700">Longitude (optional)</span>
              <input type="number" step="any" className="px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500" value={longitude} onChange={(e) => setLongitude(e.target.value)} />
            </label>
          </div>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button type="submit" disabled={saving} className="px-4 py-2 rounded-md bg-emerald-600 text-white hover:bg-emerald-700 transition disabled:opacity-70">
            {saving ? 'Saving…' : 'Save changes'}
          </button>
          <button type="button" onClick={() => navigate(-1)} className="px-4 py-2 rounded-md border border-gray-300 hover:bg-gray-50">Cancel</button>
        </div>
        {error && <p className="text-rose-600 text-sm">{error}</p>}
        {success && <p className="text-emerald-700 text-sm">{success}</p>}
      </form>
    </div>
  );
}
