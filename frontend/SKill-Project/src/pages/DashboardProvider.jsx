import { useContext, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import API from '../api/axios.js'
import { AuthContext } from '../context/auth.js'

export default function DashboardProvider() {
  const auth = useContext(AuthContext)
  const [txs, setTxs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    async function load() {
      setLoading(true)
      try {
        const { data } = await API.get('/payments')
        const list = Array.isArray(data?.payments) ? data.payments : Array.isArray(data) ? data : []
        if (mounted) setTxs(list)
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [])

  const earnings = useMemo(() => {
    const eligible = txs.filter((t) => ['paid','released'].includes(t.status))
    const sum = eligible.reduce((acc, t) => acc + (typeof t.amount === 'number' ? t.amount : 0), 0)
    // assume cents when large
    const normalized = sum / (sum > 1000 ? 100 : 1)
    const currency = (txs[0]?.currency || 'usd').toUpperCase()
    return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(normalized)
  }, [txs])

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h2 className="text-2xl font-semibold">Provider Dashboard</h2>
      {loading && <p className="text-sm text-gray-500 mt-2">Loading…</p>}

      {auth?.user && (
        <section className="mt-4 rounded-lg border border-gray-200 bg-white p-4">
          <div className="flex items-start gap-3">
            <div className="h-12 w-12 shrink-0 rounded-full overflow-hidden bg-emerald-100 flex items-center justify-center text-emerald-700 font-semibold">
              {auth.user.avatarUrl ? (
                <img src={auth.user.avatarUrl} alt="avatar" className="h-full w-full object-cover" />
              ) : (
                (auth.user.name?.[0] || 'P').toUpperCase()
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-lg font-semibold text-gray-800 break-words">{auth.user.name}</div>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-600">
                {auth.user.providerType && (
                  <span className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-700">{auth.user.providerType}</span>
                )}
                {Array.isArray(auth.user.categories) && auth.user.categories.map((c) => (
                  <span key={c} className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700">{c}</span>
                ))}
              </div>
              {auth.user.bio && (
                <p className="mt-2 text-sm text-gray-700 leading-relaxed break-words">{auth.user.bio}</p>
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
            {auth?.user?._id && (
              <Link
                to={`/providers/${auth.user._id}`}
                className="inline-flex items-center text-sm px-3 py-1.5 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                View my public profile
              </Link>
            )}
          </div>
        </section>
      )}

      <div className="mt-4 grid gap-6 md:grid-cols-3">
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
          <div className="text-sm text-emerald-700">Total Earnings</div>
          <div className="text-2xl font-semibold text-emerald-800 mt-1">{earnings}</div>
          <div className="text-xs text-emerald-700/80 mt-1">Sum of paid and released</div>
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
