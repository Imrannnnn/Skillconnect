import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import API from '../api/axios.js'

export default function DashboardClient() {
  const [chats, setChats] = useState([])
  const [txs, setTxs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    async function load() {
      setLoading(true)
      try {
        const [cRes, tRes] = await Promise.all([
          API.get('/chats'),
          API.get('/payments'),
        ])
        const chatList = Array.isArray(cRes.data?.chats) ? cRes.data.chats : Array.isArray(cRes.data) ? cRes.data : []
        const txListRaw = Array.isArray(tRes.data?.payments) ? tRes.data.payments : Array.isArray(tRes.data) ? tRes.data : []
        const activeTx = txListRaw.filter((t) => ['pending','paid'].includes(t.status))
        if (mounted) {
          setChats(chatList.slice(0, 5))
          setTxs(activeTx.slice(0, 5))
        }
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [])

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h2 className="text-2xl font-semibold">Client Dashboard</h2>
      {loading && <p className="text-sm text-gray-500 mt-2">Loading…</p>}

      <div className="grid gap-6 mt-4 md:grid-cols-2">
        <section className="rounded-lg border border-gray-200 bg-white p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold">Recent Chats</h3>
            <Link to="/chats" className="text-sm text-emerald-700 hover:text-emerald-800">View all chats</Link>
          </div>
          <div className="space-y-2">
            {chats.length === 0 && <p className="text-sm text-gray-500">No chats yet.</p>}
            {chats.map((c) => {
              const id = c?._id || c?.chatId
              const title = c?.title || c?.participants?.map?.((p) => p?.name)?.join(', ') || id
              return (
                <Link key={id} to={`/chat/${id}`} className="block px-3 py-2 rounded-md border border-gray-200 hover:bg-gray-50">
                  <div className="text-sm font-medium truncate">{title}</div>
                  {c?.lastMessage?.text && <div className="text-xs text-gray-500 truncate">{c.lastMessage.text}</div>}
                </Link>
              )
            })}
          </div>
        </section>

        <section className="rounded-lg border border-gray-200 bg-white p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold">Active Transactions</h3>
            <Link to="/payments" className="text-sm text-emerald-700 hover:text-emerald-800">View all</Link>
          </div>
          <div className="space-y-2">
            {txs.length === 0 && <p className="text-sm text-gray-500">No active transactions.</p>}
            {txs.map((t) => (
              <div key={t._id} className="px-3 py-2 rounded-md border border-gray-200 flex items-center justify-between">
                <div className="min-w-0">
                  <div className="text-sm font-medium text-gray-800 truncate">{t.providerName || t.providerId}</div>
                  <div className="text-xs text-gray-500">{new Date(t.createdAt || Date.now()).toLocaleString()}</div>
                </div>
                <div className="text-sm font-semibold text-gray-800">{formatAmount(t.amount, t.currency)}</div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}

function formatAmount(amount, currency = 'usd') {
  if (typeof amount === 'number') {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency: currency.toUpperCase() }).format(amount / (amount > 1000 ? 100 : 1))
  }
  return amount
}
