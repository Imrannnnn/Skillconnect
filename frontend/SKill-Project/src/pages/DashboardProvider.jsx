import { useContext, useEffect, useMemo, useState } from 'react'
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
  }, [])

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
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h2 className="text-2xl font-semibold">Provider Dashboard</h2>
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

      <section className="mt-4 rounded-lg border border-gray-200 bg-white p-4">
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

      <div className="mt-4 grid gap-6 md:grid-cols-4">
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 md:col-span-2">
          <div className="text-sm text-emerald-700">Total Earnings</div>
          <div className="text-2xl font-semibold text-emerald-800 mt-1">{earnings}</div>
          <div className="text-xs text-emerald-700/80 mt-1">Sum of paid and released transactions.</div>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <div className="text-sm text-gray-600">Paid</div>
          <div className="text-xl font-semibold text-gray-800 mt-1">{txs.filter(t=>t.status==='paid').length}</div>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <div className="text-sm text-gray-600">Pending</div>
          <div className="text-xl font-semibold text-gray-800 mt-1">{txs.filter(t=>t.status==='pending').length}</div>
        </div>
      </div>

      <section className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
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

      <section className="mt-6 rounded-lg border border-rose-200 bg-rose-50 p-4">
        <h3 className="font-semibold mb-1 text-sm text-rose-800">Danger zone</h3>
        <p className="text-xs text-rose-800/80 mb-3">
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
          className="inline-flex items-center px-3 py-1.5 rounded-md border border-rose-300 bg-rose-600 text-white text-xs hover:bg-rose-700 disabled:opacity-60"
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
