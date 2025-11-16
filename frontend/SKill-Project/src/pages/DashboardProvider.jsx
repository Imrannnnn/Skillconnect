import { useContext, useEffect, useMemo, useState } from 'react'
import Calendar from 'react-calendar'
import { Link, useNavigate } from 'react-router-dom'
import API from '../api/axios.js'
import { AuthContext } from '../context/auth.js'
import { useToast } from '../components/toast.js'

export default function DashboardProvider() {
  const auth = useContext(AuthContext)
  const navigate = useNavigate()
  const { notify } = useToast()
  const [txs, setTxs] = useState([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [userSnapshot, setUserSnapshot] = useState(auth?.user || null)
  const [deleting, setDeleting] = useState(false)
  const [wallet, setWallet] = useState(null)
  const [fundAmount, setFundAmount] = useState('')
  const [funding, setFunding] = useState(false)
  const [walletTxs, setWalletTxs] = useState([])
  const [calendarValue, setCalendarValue] = useState(new Date())

  useEffect(() => {
    let mounted = true
    async function load() {
      setLoading(true)
      try {
        const [paymentsRes, meRes, walletRes, walletTxRes] = await Promise.all([
          API.get('/payments'),
          auth?.user?._id ? API.get(`/users/${auth.user._id}`) : Promise.resolve({ data: auth.user }),
          API.get('/wallet/me').catch(() => ({ data: null })),
          API.get('/wallet/transactions?limit=5&page=1').catch(() => ({ data: { items: [] } })),
        ])
        const list = Array.isArray(paymentsRes.data?.payments) ? paymentsRes.data.payments : Array.isArray(paymentsRes.data) ? paymentsRes.data : []
        if (mounted) {
          setTxs(list)
          setUserSnapshot(meRes.data || auth.user)
          if (walletRes?.data?.wallet) setWallet(walletRes.data.wallet)
          const walletItems = Array.isArray(walletTxRes?.data?.items) ? walletTxRes.data.items : []
          setWalletTxs(walletItems.slice(0, 5))
        }
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [auth.user])

  const profileUrl = userSnapshot?._id
    ? userSnapshot.handle
      ? `${window.location.origin}/@${userSnapshot.handle}`
      : `${window.location.origin}/p/${userSnapshot._id}`
    : ''

  const earnings = useMemo(() => {
    const eligible = txs.filter((t) => ['paid','released'].includes(t.status))
    const sum = eligible.reduce((acc, t) => acc + (typeof t.amount === 'number' ? t.amount : 0), 0)
    // assume cents when large
    const normalized = sum / (sum > 1000 ? 100 : 1)
    const currency = (txs[0]?.currency || 'usd').toUpperCase()
    return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(normalized)
  }, [txs])

  function formatWalletAmount(w) {
    if (!w) return '₦0.00'
    const balance = typeof w.balance === 'number' ? w.balance : 0
    const naira = balance / 100
    const currency = (w.currency || 'NGN').toUpperCase()
    try {
      return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(naira)
    } catch {
      return `₦${naira.toFixed(2)}`
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Provider Dashboard</h2>
          <p className="mt-1 text-sm text-gray-600">Overview of your services, earnings, and recent activity.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 text-xs text-gray-600">
            <div className="hidden sm:flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1.5 shadow-sm">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 text-[11px] font-semibold">
                {userSnapshot?.name?.[0]?.toUpperCase?.() || 'P'}
              </span>
              <div className="flex flex-col leading-tight">
                <span className="text-[11px] uppercase tracking-wide text-gray-500">Signed in as</span>
                <span className="text-xs font-medium text-gray-800 max-w-[180px] truncate" title={userSnapshot?.name || userSnapshot?.email}>
                  {userSnapshot?.name || userSnapshot?.email}
                </span>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-medium text-emerald-700 border border-emerald-100">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Provider workspace
            </span>
          </div>
          <div className="flex items-center gap-2 relative">
            <button
              type="button"
              onClick={() => navigate('/notifications')}
              className="relative flex h-10 w-10 items-center justify-center rounded-full border border-gray-100 bg-gray-50 text-gray-700 hover:bg-gray-100"
            >
              <span className="sr-only">Open notifications</span>
              <svg width="18" height="18" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M11 20.1667C9.88317 20.1667 8.88718 19.63 8.23901 18.7917H13.761C13.113 19.63 12.1169 20.1667 11 20.1667Z" fill="currentColor" />
                <path d="M10.1157 2.74999C10.1157 2.24374 10.5117 1.83333 11 1.83333C11.4883 1.83333 11.8842 2.24374 11.8842 2.74999V2.82604C14.3932 3.26245 16.3051 5.52474 16.3051 8.24999V14.287C16.3051 14.5301 16.3982 14.7633 16.564 14.9352L18.2029 16.6342C18.4814 16.9229 18.2842 17.4167 17.8903 17.4167H4.10961C3.71574 17.4167 3.5185 16.9229 3.797 16.6342L5.43589 14.9352C5.6017 14.7633 5.69485 14.5301 5.69485 14.287V8.24999C5.69485 5.52474 7.60672 3.26245 10.1157 2.82604V2.74999Z" fill="currentColor" />
              </svg>
              <span className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-rose-500" />
            </button>
            <button
              type="button"
              onClick={() => navigate('/chats') }
              className="relative flex h-10 w-10 items-center justify-center rounded-full border border-gray-100 bg-gray-50 text-gray-700 hover:bg-gray-100"
            >
              <span className="sr-only">Open chats</span>
              <svg width="18" height="18" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M7.74866 5.97421C7.91444 5.96367 8.08162 5.95833 8.25005 5.95833C12.5532 5.95833 16.0417 9.4468 16.0417 13.75C16.0417 13.9184 16.0364 14.0856 16.0259 14.2514C16.3246 14.138 16.6127 14.003 16.8883 13.8482L19.2306 14.629C19.7858 14.8141 20.3141 14.2858 20.129 13.7306L19.3482 11.3882C19.8694 10.4604 20.1667 9.38996 20.1667 8.25C20.1667 4.70617 17.2939 1.83333 13.75 1.83333C11.0077 1.83333 8.66702 3.55376 7.74866 5.97421Z" fill="currentColor" />
                <path d="M14.6667 13.75C14.6667 17.2938 11.7939 20.1667 8.25004 20.1667C7.11011 20.1667 6.03962 19.8694 5.11182 19.3482L2.76946 20.129C2.21421 20.3141 1.68597 19.7858 1.87105 19.2306L2.65184 16.8882C2.13062 15.9604 1.83338 14.89 1.83338 13.75C1.83338 10.2062 4.70622 7.33333 8.25004 7.33333C11.7939 7.33333 14.6667 10.2062 14.6667 13.75Z" fill="currentColor" />
              </svg>
              <span className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-emerald-500" />
            </button>
          </div>
        </div>
      </div>
      {loading && (
        <div className="mt-4 flex items-center justify-center">
          <div className="loader" />
        </div>
      )}
      {userSnapshot && (
        <section className="mt-4 rounded-lg border border-gray-200 bg-white p-4">
          <div className="flex items-start gap-3">
            <div className="h-12 w-12 shrink-0 rounded-full overflow-hidden bg-emerald-100 flex items-center justify-center text-emerald-700 font-semibold">
              {userSnapshot.avatarUrl ? (
                <img src={userSnapshot.avatarUrl} alt="avatar" className="h-full w-full object-cover" />
              ) : (
                (userSnapshot.name?.[0] || 'P').toUpperCase()
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-lg font-semibold text-gray-800 break-words">{userSnapshot.name}</div>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-600">
                {userSnapshot.providerType && (
                  <span className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-700">{userSnapshot.providerType}</span>
                )}
                {Array.isArray(userSnapshot.categories) && userSnapshot.categories.map((c) => (
                  <span key={c} className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700">{c}</span>
                ))}
              </div>
              {userSnapshot.bio && (
                <p className="mt-2 text-sm text-gray-700 leading-relaxed break-words">{userSnapshot.bio}</p>
              )}
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link to="/provider/edit-profile" className="inline-flex items-center text-sm px-3 py-1.5 rounded-md border border-gray-300 hover:bg-gray-50">
              Edit profile
            </Link>
            <Link to="/provider/products" className="inline-flex items-center text-sm px-3 py-1.5 rounded-md border border-emerald-600 text-emerald-700 hover:bg-emerald-50">
              Manage product catalog
            </Link>
            {userSnapshot?._id && (
              <Link
                to={`/providers/${userSnapshot._id}`}
                className="inline-flex items-center text-sm px-3 py-1.5 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                View my public profile
              </Link>
            )}
          </div>
          {auth?.user?._id && (
            <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50/60 p-3 text-xs flex flex-col gap-2">
              <div className="font-semibold text-emerald-800 text-sm">Share your profile</div>
              <p className="text-[11px] text-emerald-800/80">
                Send this link to clients as your mini website so they can view your profile, book your services, or order your products.
              </p>
              <div className="flex items-center gap-2">
                <input
                  className="flex-1 px-2 py-1.5 rounded-md border border-emerald-200 bg-white text-[11px] text-gray-800 truncate"
                  value={profileUrl}
                  readOnly
                  onFocus={(e) => e.target.select()}
                />
                <button
                  type="button"
                  onClick={async () => {
                    if (!profileUrl) return
                    try {
                      await navigator.clipboard.writeText(profileUrl)
                      setCopied(true)
                      setTimeout(() => setCopied(false), 1500)
                    } catch {
                      // ignore clipboard errors
                    }
                  }}
                  className="px-3 py-1.5 rounded-md bg-emerald-600 text-white text-[11px] hover:bg-emerald-700"
                >
                  {copied ? 'Copied' : 'Copy link'}
                </button>
              </div>
            </div>
          )}
        </section>
      )}
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <section className="lg:col-span-2 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-2.5">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Top selling services</h3>
              <p className="mt-1 text-xs text-gray-500">Snapshot of your most recent paid and released jobs.</p>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <label className="text-gray-500" htmlFor="top-period">Period</label>
              <select
                id="top-period"
                className="rounded-md border border-gray-200 bg-gray-50 px-2 py-1 text-[11px] text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                defaultValue="monthly"
              >
                <option value="yearly">Yearly</option>
                <option value="monthly">Monthly</option>
                <option value="weekly">Weekly</option>
              </select>
            </div>
          </div>
          <div className="mt-3 overflow-x-auto">
            <table className="min-w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-100 text-[11px] uppercase tracking-wide text-gray-500">
                  <th className="py-2.5 pr-3 font-medium align-middle"></th>
                  <th className="py-2.5 pr-3 font-medium align-middle min-w-[150px]">Service</th>
                  <th className="py-2.5 pr-3 font-medium align-middle">Client</th>
                  <th className="py-2.5 pr-3 font-medium align-middle min-w-[80px] whitespace-nowrap">Price</th>
                  <th className="py-2.5 pr-3 font-medium align-middle min-w-[80px] whitespace-nowrap">Status</th>
                  <th className="py-2.5 pr-3 font-medium align-middle min-w-[80px] text-right whitespace-nowrap">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {txs.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-4 text-center text-xs text-gray-500">
                      No transactions yet. Once you start getting bookings, your top services will appear here.
                    </td>
                  </tr>
                )}
                {txs
                  .filter((t) => ['paid','released'].includes(t.status))
                  .slice(0, 5)
                  .map((t) => (
                    <tr key={t._id} className="hover:bg-gray-50/70">
                      <td className="py-2.5 pr-3 align-middle">
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 ml-1"
                        />
                      </td>
                      <td className="py-2.5 pr-3 align-middle">
                        <div className="flex items-center min-w-[150px]">
                          <div className="flex h-12 w-12 max-w-[50px] items-center justify-center rounded-md bg-emerald-50 text-[10px] font-semibold text-emerald-700 mr-3 overflow-hidden">
                            {t?.serviceName?.[0]?.toUpperCase?.() || t?.clientName?.[0]?.toUpperCase?.() || 'S'}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-gray-900 truncate">
                              {t.serviceName || t.description || 'Service'}
                            </p>
                            {t.category && (
                              <p className="text-[11px] text-gray-500 truncate">{t.category}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5 pr-3 align-middle">
                        <p className="text-xs text-gray-700 truncate max-w-[140px]">
                          {t.clientName || t.clientId || 'Client'}
                        </p>
                      </td>
                      <td className="py-2.5 pr-3 align-middle whitespace-nowrap">
                        <p className="text-xs font-semibold text-gray-900">{formatAmount(t.amount, t.currency)}</p>
                      </td>
                      <td className="py-2.5 pr-3 align-middle whitespace-nowrap">
                        <StatusPill status={t.status} />
                      </td>
                      <td className="py-2.5 pl-3 text-right align-middle whitespace-nowrap">
                        <p className="text-[11px] text-gray-500">
                          {new Date(t.createdAt || Date.now()).toLocaleDateString()}
                        </p>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </section>
        <section className="rounded-xl bg-slate-900 text-white p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="text-sm font-semibold">Today at a glance</h3>
              <p className="mt-1 text-[11px] text-slate-300">
                Quick summary of your pipeline for the current day.
              </p>
            </div>
            <div className="rounded-md bg-slate-800 px-2 py-1 text-[11px] text-slate-200">
              {new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
            </div>
          </div>
          <div className="mt-3 rounded-lg bg-slate-800/70 p-2.5 text-xs">
            <div className="rounded-md bg-slate-900/60 p-1.5">
              <Calendar
                value={calendarValue}
                onChange={setCalendarValue}
                className="w-full text-[11px] border-0 [&_.react-calendar__navigation]:mb-2 [&_.react-calendar__navigation button]:!bg-transparent [&_.react-calendar__navigation button]:!border-none [&_.react-calendar__navigation button]:!text-slate-200 [&_.react-calendar__month-view__weekdays]:text-[10px] [&_.react-calendar__month-view__weekdays__weekday]:text-slate-400 [&_.react-calendar__tile]:text-slate-200 [&_.react-calendar__tile]:rounded-md [&_.react-calendar__tile]:border-0 [&_.react-calendar__tile]:!bg-transparent [&_.react-calendar__tile--now]:!bg-emerald-600 [&_.react-calendar__tile--now]:!text-white [&_.react-calendar__tile--active]:!bg-emerald-500 [&_.react-calendar__tile--active]:!text-white [&_.react-calendar__month-view__days__day]:p-1.5"
              />
            </div>
            <div className="mt-3 space-y-2 text-[11px] text-slate-200">
              <div className="flex items-center justify-between">
                <span className="text-slate-300">Earnings to date</span>
                <span className="text-sm font-semibold text-emerald-300">{earnings}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-300">Paid jobs</span>
                <span className="text-sm font-semibold text-emerald-300">{txs.filter(t=>t.status==='paid').length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-300">Pending jobs</span>
                <span className="text-sm font-semibold text-amber-300">{txs.filter(t=>t.status==='pending').length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-300">Released payouts</span>
                <span className="text-sm font-semibold text-sky-300">{txs.filter(t=>t.status==='released').length}</span>
              </div>
            </div>
          </div>
        </section>
      </div>
      <section className="mt-6 rounded-lg border border-gray-200 bg-white p-4">
        <h3 className="font-semibold mb-2 text-sm text-gray-800">Recent wallet activity</h3>
        {walletTxs.length === 0 && (
          <p className="text-sm text-gray-500">No wallet transactions yet.</p>
        )}
        <div className="space-y-2 mt-1">
          {walletTxs.map((t) => (
            <div key={t._id} className="flex items-center justify-between text-xs border border-gray-100 rounded-md px-3 py-2">
              <div className="min-w-0">
                <div className="font-medium text-gray-800 truncate">{t.type === 'fund' ? 'Wallet funding' : (t.type || 'Transaction')}</div>
                <div className="text-[11px] text-gray-500 truncate">{new Date(t.createdAt || Date.now()).toLocaleString()}</div>
              </div>
              <div className="text-right">
                <div className="font-semibold text-gray-800">{formatAmount(t.amount, t.currency || 'ngn')}</div>
                <div className="text-[11px] text-gray-500 capitalize">{t.status || 'pending'}</div>
              </div>
            </div>
          ))}
        </div>
      </section>
      <section className="mt-6 rounded-lg border border-emerald-200 bg-emerald-50 p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <div className="text-sm text-emerald-700">Wallet balance</div>
          <div className="text-2xl font-semibold text-emerald-900 mt-1">
            {formatWalletAmount(wallet)}
          </div>
          <p className="mt-2 text-[11px] text-emerald-800/80 max-w-md">
            This is your SkillConnect wallet balance. When clients fund jobs, money is held in escrow and released here after you complete bookings.
          </p>
          <div className="mt-3 flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1"
                step="0.01"
                value={fundAmount}
                onChange={(e) => setFundAmount(e.target.value)}
                placeholder="Amount (e.g. 5000)"
                className="flex-1 px-2 py-1.5 rounded-md border border-emerald-200 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <button
                type="button"
                disabled={funding}
                onClick={async () => {
                  const amt = Number(fundAmount)
                  if (!Number.isFinite(amt) || amt <= 0) {
                    notify('Enter a valid amount to fund your wallet.', { type: 'info' })
                    return
                  }
                  setFunding(true)
                  try {
                    const { data } = await API.post('/wallet/fund/initiate', { amount: amt })
                    notify(data?.message || 'Funding initialized. Redirecting to Paystack…', { type: 'success' })
                    if (data?.checkoutUrl) {
                      window.location.href = data.checkoutUrl
                    }
                  } catch (e) {
                    notify(e?.response?.data?.message || 'Failed to initiate wallet funding', { type: 'error' })
                  } finally {
                    setFunding(false)
                  }
                }}
                className="px-3 py-1.5 rounded-md bg-emerald-600 text-white text-[11px] hover:bg-emerald-700 disabled:opacity-60"
              >
                {funding ? 'Starting…' : 'Fund wallet'}
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-[10px] text-emerald-800/70">
              <button
                type="button"
                onClick={() => navigate('/payments')}
                className="inline-flex items-center px-3 py-1.5 rounded-md border border-emerald-600 text-emerald-700 bg-white hover:bg-emerald-50"
              >
                View wallet & payments
              </button>
              <span className="block">
                You will be redirected to Paystack to complete funding. After success, your wallet balance updates automatically.
              </span>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-start md:items-end gap-1 text-[11px] text-emerald-800/80">
          <span>
            Paid transactions: <span className="font-semibold">{txs.filter(t=>t.status==='paid').length}</span>
          </span>
          <span>
            Released transactions: <span className="font-semibold">{txs.filter(t=>t.status==='released').length}</span>
          </span>
        </div>
      </section>

      {userSnapshot && typeof userSnapshot.profileViews === 'number' && (
        <section className="mt-4 rounded-lg border border-gray-200 bg-white p-4">
          <h3 className="font-semibold mb-1 text-sm text-gray-800">Profile analytics</h3>
          <p className="text-xs text-gray-600 mb-2">Basic visibility into how many times clients have opened your public profile link.</p>
          <div className="text-sm text-gray-800">
            Profile views: <span className="font-semibold">{userSnapshot.profileViews}</span>
          </div>
        </section>
      )}

      <section className="mt-6 rounded-lg border border-gray-200 bg-white p-4">
        <h3 className="font-semibold mb-1 text-sm text-rose-700">Danger zone</h3>
        <p className="text-xs text-rose-600/80 mb-3">
          Deleting your account is permanent. This will remove your provider profile and you may lose access to bookings, chats, and wallet history.
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
              auth?.logout?.()
              navigate('/')
            } catch (e) {
              notify(e?.response?.data?.message || 'Failed to delete account', { type: 'error' })
            } finally {
              setDeleting(false)
            }
          }}
          className="inline-flex items-center px-3 py-1.5 rounded-md border border-rose-200 bg-rose-50 text-rose-700 text-xs hover:bg-rose-100 disabled:opacity-60"
        >
          {deleting ? 'Deleting account…' : 'Delete my account'}
        </button>
      </section>

      <section className="rounded-lg border border-gray-200 bg-white p-4 mt-6">
        <h3 className="font-semibold mb-2">Recent Transactions</h3>
        <div className="space-y-2">
          {txs.length === 0 && <p className="text-sm text-gray-500">No transactions yet.</p>}
          {txs.slice(0, 8).map((t) => (
            <div key={t._id} className="px-3 py-2 rounded-md border border-gray-200 flex items-center justify-between">
              <div className="min-w-0">
                <div className="text-sm font-medium text-gray-800 truncate">{t.clientName || t.clientId}</div>
                <div className="text-xs text-gray-500">{new Date(t.createdAt || Date.now()).toLocaleString()} • {t.paymentProvider || 'stripe'}</div>
              </div>
              <div className="flex items-center gap-3">
                <StatusPill status={t.status} />
                <div className="text-sm font-semibold text-gray-800">{formatAmount(t.amount, t.currency)}</div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

function StatusPill({ status }) {
  const map = {
    paid: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    released: 'bg-sky-50 text-sky-700 border-sky-200',
    refunded: 'bg-gray-50 text-gray-700 border-gray-200',
    failed: 'bg-rose-50 text-rose-700 border-rose-200',
  }
  const cls = map[status] || 'bg-gray-50 text-gray-700 border-gray-200'
  return <span className={`text-[10px] px-2 py-0.5 rounded border ${cls}`}>{status || 'unknown'}</span>
}

function formatAmount(amount, currency = 'usd') {
  if (typeof amount === 'number') {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency: currency.toUpperCase() }).format(amount / (amount > 1000 ? 100 : 1))
  }
  return amount
}
