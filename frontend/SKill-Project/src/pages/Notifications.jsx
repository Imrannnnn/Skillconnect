import { useEffect, useState } from 'react'
import API from '../api/axios.js'
import { useToast } from '../components/toast.js'

export default function Notifications() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const { notify } = useToast()

  useEffect(() => {
    let mounted = true
    async function load() {
      setLoading(true)
      try {
        const { data } = await API.get('/notifications')
        const list = Array.isArray(data?.notifications) ? data.notifications : Array.isArray(data) ? data : []
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

  async function markRead(id) {
    try {
      await API.put(`/notifications/${id}/read`)
      setItems((prev) => prev.map((n) => (n._id === id ? { ...n, read: true } : n)))
      notify('Notification marked as read', { type: 'success' })
    } catch {
      notify('Failed to mark as read', { type: 'error' })
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h2 className="text-2xl font-semibold">Notifications</h2>
      {loading && (
        <div className="mt-4 flex items-center justify-center">
          <div className="loader" />
        </div>
      )}
      {!loading && items.length === 0 && (
        <p className="text-sm text-gray-500 mt-2">No notifications.</p>
      )}
      <div className="mt-4 divide-y divide-gray-100 rounded-lg border border-gray-200 bg-white">
        {items.map((n) => (
          <div key={n._id} className="p-4 flex items-start gap-3">
            <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-semibold ${n.read ? 'bg-gray-100 text-gray-600' : 'bg-emerald-100 text-emerald-700'}`}>
              {n.type?.[0]?.toUpperCase() || 'N'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm text-gray-800 truncate">{n.type || 'notification'}</div>
              {n.data?.message && <div className="text-xs text-gray-500 truncate">{n.data.message}</div>}
              <div className="text-[11px] text-gray-500 mt-1">{new Date(n.createdAt || Date.now()).toLocaleString()}</div>
            </div>
            {!n.read && (
              <button onClick={() => markRead(n._id)} className="px-3 py-1.5 text-sm rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50">
                Mark as read
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
