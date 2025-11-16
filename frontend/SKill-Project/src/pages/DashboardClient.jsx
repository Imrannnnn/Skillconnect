import { useContext, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import API from '../api/axios.js'
import { AuthContext } from '../context/auth.js'
import { useToast } from '../components/toast.js'

export default function DashboardClient() {
  const auth = useContext(AuthContext)
  const navigate = useNavigate()
  const { notify } = useToast()
  const [chats, setChats] = useState([])
  const [txs, setTxs] = useState([])
  const [loading, setLoading] = useState(true)
  const [wallet, setWallet] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [fundAmount, setFundAmount] = useState('')
  const [funding, setFunding] = useState(false)
  const [walletTxs, setWalletTxs] = useState([])

  useEffect(() => {
    let mounted = true
    async function load() {
      setLoading(true)
      try {
        const [cRes, tRes, wRes, walletTxRes] = await Promise.all([
          API.get('/chats'),
          API.get('/payments'),
          API.get('/wallet/me').catch(() => ({ data: null })),
          API.get('/wallet/transactions?limit=5&page=1').catch(() => ({ data: { items: [] } })),
        ])
        const chatList = Array.isArray(cRes.data?.chats) ? cRes.data.chats : Array.isArray(cRes.data) ? cRes.data : []
        const txListRaw = Array.isArray(tRes.data?.payments) ? tRes.data.payments : Array.isArray(tRes.data) ? tRes.data : []
        const activeTx = txListRaw.filter((t) => ['pending','paid'].includes(t.status))
        if (mounted) {
          setChats(chatList.slice(0, 5))
          setTxs(activeTx.slice(0, 5))
          if (wRes?.data?.wallet) setWallet(wRes.data.wallet)
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
            <p className="text-[10px] text-emerald-800/70">
              You will be redirected to Paystack to complete payment. Once successful, your wallet balance will update automatically.
            </p>
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

      <section className="mt-6 rounded-lg border border-rose-200 bg-rose-50 p-4">
        <h3 className="font-semibold mb-1 text-sm text-rose-800">Danger zone</h3>
        <p className="text-xs text-rose-800/80 mb-3">
          Deleting your account is permanent. This will remove your client account and you may lose access to bookings, chats, and wallet history.
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
