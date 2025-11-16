import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import API from '../api/axios.js'

export default function DashboardClient() {
  const [chats, setChats] = useState([])
  const [txs, setTxs] = useState([])
  const [loading, setLoading] = useState(true)
  const [wallet, setWallet] = useState(null)

  useEffect(() => {
    let mounted = true
    async function load() {
      setLoading(true)
      try {
        const [cRes, tRes, wRes] = await Promise.all([
          API.get('/chats'),
          API.get('/payments'),
          API.get('/wallet/me').catch(() => ({ data: null })),
        ])
        const chatList = Array.isArray(cRes.data?.chats) ? cRes.data.chats : Array.isArray(cRes.data) ? cRes.data : []
        const txListRaw = Array.isArray(tRes.data?.payments) ? tRes.data.payments : Array.isArray(tRes.data) ? tRes.data : []
        const activeTx = txListRaw.filter((t) => ['pending','paid'].includes(t.status))
        if (mounted) {
          setChats(chatList.slice(0, 5))
          setTxs(activeTx.slice(0, 5))
          if (wRes?.data?.wallet) setWallet(wRes.data.wallet)
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
      {loading && (
        <div className="mt-4 flex items-center justify-center">
          <div className="loader" />
        </div>
      )}
      <div className="grid gap-6 mt-4 md:grid-cols-3">
        <section className="rounded-lg border border-gray-200 bg-white p-4 md:col-span-2">
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

        <section className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 flex flex-col justify-between">
          <div>
            <div className="text-sm text-emerald-700">Wallet balance</div>
            <div className="text-2xl font-semibold text-emerald-900 mt-1">
              {formatWalletAmount(wallet)}
            </div>
          </div>
          <p className="mt-2 text-[11px] text-emerald-800/80">
            Add funds to your SkillConnect wallet to pay providers securely when bookings are accepted.
          </p>
        </section>
      </div>
    </div>
  )
}

function formatWalletAmount(wallet) {
  if (!wallet) return '₦0.00'
  const balance = typeof wallet.balance === 'number' ? wallet.balance : 0
  const naira = balance / 100
  const currency = (wallet.currency || 'NGN').toUpperCase()
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(naira)
  } catch {
    return `₦${naira.toFixed(2)}`
  }
}

function formatAmount(amount, currency = 'usd') {
  if (typeof amount === 'number') {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency: currency.toUpperCase() }).format(amount / (amount > 1000 ? 100 : 1))
  }
  return amount
}
