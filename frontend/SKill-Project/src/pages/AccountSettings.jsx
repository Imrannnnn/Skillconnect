import { useContext, useState, useEffect } from 'react'
import API from '../api/axios.js'
import { useToast } from '../components/toast.js'
import { useNavigate } from 'react-router-dom'
import { AuthContext } from '../context/auth.js'

export default function AccountSettings() {
  const { notify } = useToast()
  const navigate = useNavigate()
  const auth = useContext(AuthContext)
  const [deleting, setDeleting] = useState(false)
  const [becoming, setBecoming] = useState(false)
  const [providerType, setProviderType] = useState('individual')
  const [providerMode, setProviderMode] = useState('service')
  const [categoriesInput, setCategoriesInput] = useState('')
  const [bio, setBio] = useState('')
  const [city, setCity] = useState('')
  const [stateRegion, setStateRegion] = useState('')
  const [country, setCountry] = useState('')
  const [instagram, setInstagram] = useState('')
  const [facebook, setFacebook] = useState('')
  const [tiktok, setTiktok] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [website, setWebsite] = useState('')

  const user = auth?.user
  const roles = Array.isArray(user?.roles) && user.roles.length
    ? user.roles
    : (user?.role ? [user.role] : [])
  const isClient = roles.includes('client')
  const isProvider = roles.includes('provider')
  const isAdmin = roles.includes('admin')

  useEffect(() => {
    if (user?.categories) {
      setCategoriesInput(user.categories.join(', '))
    }
  }, [user])

  const handleBecomeProvider = async (e) => {
    e.preventDefault()
    if (!user) {
      notify('You need to be logged in to update your roles.', { type: 'error' })
      return
    }
    if (isProvider) {
      notify('Your account is already a provider.', { type: 'info' })
      return
    }
    setBecoming(true)
    try {
      const categories = categoriesInput
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
      const payload = {
        providerType,
        providerMode,
        categories: categories.length ? categories : undefined,
        bio: bio || undefined,
        city: city || undefined,
        state: stateRegion || undefined,
        country: country || undefined,
        social: {
          instagram: instagram || undefined,
          facebook: facebook || undefined,
          tiktok: tiktok || undefined,
          whatsapp: whatsapp || undefined,
          website: website || undefined,
        },
      }
      const { data } = await API.post('/users/me/become-provider', payload)
      if (data?.user && typeof auth?.setUser === 'function') {
        auth.setUser(data.user)
      }
      notify('Your account is now set up as a provider. You can access your provider dashboard and profile.', { type: 'success' })
    } catch (e) {
      notify(e?.response?.data?.message || 'Failed to enable provider role', { type: 'error' })
    } finally {
      setBecoming(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h2 className="text-2xl font-semibold text-gray-900">Account settings</h2>
      <p className="mt-1 text-sm text-gray-600">
        Manage sensitive actions related to your SkillConnect account.
      </p>

      <section className="mt-6 rounded-lg border border-gray-200 bg-white p-4">
        <h3 className="font-semibold mb-1 text-sm text-gray-900">Account roles</h3>
        <p className="text-xs text-gray-600">
          Your account can act as a client, provider, or admin. These roles control what parts of SkillConnect you
          can use.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {['client', 'provider', 'admin'].map((r) => {
            const active = roles.includes(r)
            const label = r.charAt(0).toUpperCase() + r.slice(1)
            return (
              <span
                key={r}
                className={
                  'inline-flex items-center gap-1 rounded-full border px-3 py-1 text-[11px]' +
                  (active
                    ? ' border-emerald-300 bg-emerald-50 text-emerald-800'
                    : ' border-gray-200 bg-gray-50 text-gray-500')
                }
              >
                <span className="h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: active ? '#059669' : '#9CA3AF' }}
                />
                <span>{label}</span>
                <span className="text-[10px] uppercase tracking-wide">
                  {active ? 'Active' : 'Not active'}
                </span>
              </span>
            )
          })}
        </div>
      </section>

      <section className="mt-8 rounded-lg border border-gray-200 bg-white p-4">
        <h3 className="font-semibold mb-1 text-sm text-gray-900">Event subscriptions</h3>
        <p className="text-xs text-gray-600 mb-4">
          Subscribe to event categories you're interested in. We'll notify you whenever a new event in these categories is published.
        </p>

        <div className="space-y-4">
          <label className="grid gap-1 text-xs">
            <span className="text-gray-700 font-medium uppercase tracking-wider">Subscribed Categories</span>
            <div className="flex gap-2">
              <input
                className="flex-1 rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all shadow-sm"
                placeholder="e.g. Technology, Business, Design"
                value={categoriesInput}
                onChange={(e) => setCategoriesInput(e.target.value)}
              />
              <button
                onClick={async () => {
                  try {
                    const categories = categoriesInput.split(',').map(s => s.trim()).filter(Boolean);
                    await API.put('/users/me/subscriptions', { categories });
                    notify('Subscription preferences updated!', { type: 'success' });
                    // Update local user state if needed
                    if (auth?.setUser) {
                      auth.setUser({ ...user, categories });
                    }
                  } catch {
                    notify('Failed to update subscriptions', { type: 'error' });
                  }
                }}
                className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-emerald-700 transition-colors shadow-sm"
              >
                Update
              </button>
            </div>
            <span className="text-[10px] text-gray-400 mt-1 italic">Comma separated list. Example: Music, Sports, Tech</span>
          </label>
        </div>
      </section>

      {isClient && !isProvider && !isAdmin && (
        <section className="mt-6 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h3 className="font-semibold text-sm text-emerald-900">Become a provider</h3>
              <p className="text-xs text-emerald-900/80 mt-1">
                Turn your existing account into a provider profile so clients can find and book you.
              </p>
            </div>
          </div>

          <form onSubmit={handleBecomeProvider} className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3 text-sm">
              <label className="grid gap-1 text-xs">
                <span className="text-emerald-900 font-medium">Provider type</span>
                <select
                  className="rounded-md border border-emerald-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  value={providerType}
                  onChange={(e) => setProviderType(e.target.value)}
                >
                  <option value="individual">Individual</option>
                  <option value="company">Company</option>
                </select>
              </label>
              <label className="grid gap-1 text-xs">
                <span className="text-emerald-900 font-medium">What do you offer?</span>
                <select
                  className="rounded-md border border-emerald-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  value={providerMode}
                  onChange={(e) => setProviderMode(e.target.value)}
                >
                  <option value="service">Services</option>
                  <option value="product">Products</option>
                  <option value="both">Both services & products</option>
                </select>
              </label>
              <label className="grid gap-1 text-xs">
                <span className="text-emerald-900 font-medium">Categories</span>
                <input
                  className="rounded-md border border-emerald-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="e.g. plumbing, electrical, web design"
                  value={categoriesInput}
                  onChange={(e) => setCategoriesInput(e.target.value)}
                />
                <span className="text-[11px] text-emerald-900/70">Comma-separated. This helps clients find you.</span>
              </label>
              <label className="grid gap-1 text-xs">
                <span className="text-emerald-900 font-medium">Short bio</span>
                <textarea
                  className="rounded-md border border-emerald-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[80px]"
                  placeholder="Tell clients about your experience and what you offer."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                />
              </label>
            </div>

            <div className="space-y-3 text-sm">
              <div className="grid sm:grid-cols-3 gap-3">
                <label className="grid gap-1 text-xs">
                  <span className="text-emerald-900 font-medium">City</span>
                  <input
                    className="rounded-md border border-emerald-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="City"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                  />
                </label>
                <label className="grid gap-1 text-xs">
                  <span className="text-emerald-900 font-medium">State / Region</span>
                  <input
                    className="rounded-md border border-emerald-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="State / Region"
                    value={stateRegion}
                    onChange={(e) => setStateRegion(e.target.value)}
                  />
                </label>
                <label className="grid gap-1 text-xs">
                  <span className="text-emerald-900 font-medium">Country</span>
                  <input
                    className="rounded-md border border-emerald-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="Country"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                  />
                </label>
              </div>
              <div className="space-y-2">
                <p className="text-[11px] font-medium text-emerald-900">Optional social links</p>
                <input
                  className="w-full rounded-md border border-emerald-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Instagram URL"
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value)}
                />
                <input
                  className="w-full rounded-md border border-emerald-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Facebook URL"
                  value={facebook}
                  onChange={(e) => setFacebook(e.target.value)}
                />
                <input
                  className="w-full rounded-md border border-emerald-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="TikTok URL"
                  value={tiktok}
                  onChange={(e) => setTiktok(e.target.value)}
                />
                <input
                  className="w-full rounded-md border border-emerald-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="WhatsApp Business link or number"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                />
                <input
                  className="w-full rounded-md border border-emerald-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Website URL"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                />
              </div>
              <div className="pt-1 flex justify-end">
                <button
                  type="submit"
                  disabled={becoming}
                  className="inline-flex items-center rounded-md bg-emerald-600 px-4 py-2 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
                >
                  {becoming ? 'Enabling provider role…' : 'Enable provider profile'}
                </button>
              </div>
            </div>
          </form>
        </section>
      )}

      <section className="mt-8 rounded-lg border border-rose-200 bg-rose-50 p-4">
        <h3 className="font-semibold mb-1 text-sm text-rose-800">Danger zone</h3>
        <p className="text-xs text-rose-800/80 mb-3">
          Deleting your account is permanent. This will remove your SkillConnect account and you may lose
          access to bookings, chats, and wallet history associated with this login.
        </p>
        <button
          type="button"
          disabled={deleting}
          onClick={async () => {
            if (!window.confirm('Are you sure you want to permanently delete your SkillConnect account? This action cannot be undone.')) return
            setDeleting(true)
            try {
              await API.delete('/users/me')
              notify('Your account has been deleted.', { type: 'success' })
              navigate('/')
              window.location.reload()
            } catch (e) {
              notify(e?.response?.data?.message || 'Failed to delete account', { type: 'error' })
            } finally {
              setDeleting(false)
            }
          }}
          className="inline-flex items-center px-3 py-1.5 rounded-md border border-rose-300 bg-rose-600 text-white text-xs hover:bg-rose-700 disabled:opacity-60"
        >
          {deleting ? 'Deleting account…' : 'Delete my account'}
        </button>
      </section>
    </div>
  )
}
