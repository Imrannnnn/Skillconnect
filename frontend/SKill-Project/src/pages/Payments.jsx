import { useEffect, useState } from 'react'
import API from '../api/axios.js'

export default function Payments() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('all')
  const [currency, setCurrency] = useState('all')

  useEffect(() => {
    let mounted = true
    async function load() {
      setLoading(true)
      try {
        const { data } = await API.get('/payments')
        const list = Array.isArray(data?.payments) ? data.payments : Array.isArray(data) ? data : []
        if (mounted) setItems(list)
      } catch {
        if (mounted) setItems([])
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [])

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h2 className="text-2xl font-semibold">Payments</h2>
      {loading && (
        <div className="mt-4 flex items-center justify-center">
          <div className="loader" />
        </div>
      )}

      {/* Filters */}
      <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap gap-2">
          {['all','pending','paid','released','refunded','failed'].map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`text-xs px-3 py-1.5 rounded-full border transition ${
                status === s
                  ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
                  : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              {s[0].toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">Currency</label>
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="text-sm border border-gray-200 rounded-md px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
          >
            <option value="all">All</option>
            {Array.from(new Set(items.map((t) => (t.currency || 'usd').toLowerCase()))).map((c) => (
              <option key={c} value={c}>{c.toUpperCase()}</option>
            ))}
          </select>
        </div>
      </div>

      {!loading && items.length === 0 && (
        <p className="text-sm text-gray-500 mt-2">No transactions yet.</p>
      )}
      <div className="mt-4 divide-y divide-gray-100 rounded-lg border border-gray-200 bg-white">
        {items
          .filter((t) => (status === 'all' ? true : t.status === status))
          .filter((t) => (currency === 'all' ? true : (t.currency || 'usd').toLowerCase() === currency))
          .map((t) => (
          <div key={t._id} className="p-4 flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-800 truncate">{t.providerName || t.providerId}</span>
                <StatusPill status={t.status} />
              </div>
              <div className="text-xs text-gray-500 mt-0.5">
                {new Date(t.createdAt || Date.now()).toLocaleString()}
                {t.paymentProvider ? ` • ${t.paymentProvider}` : ''}
              </div>
            </div>
            <div className="text-sm font-semibold text-gray-800">{formatAmount(t.amount, t.currency)}</div>
          </div>
        ))}
      </div>
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
