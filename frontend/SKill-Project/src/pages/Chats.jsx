import { useContext, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import API, { NetBus } from '../api/axios.js'
import { AuthContext } from '../context/auth.js'

export default function Chats() {
  const auth = useContext(AuthContext)
  const [chats, setChats] = useState([])
  const [loading, setLoading] = useState(true)
  const [unread, setUnread] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('unreadCounts') || '{}')
    } catch {
      return {}
    }
  })

  useEffect(() => {
    let mounted = true
    async function load() {
      setLoading(true)
      try {
        const { data } = await API.get('/chats')
        const list = Array.isArray(data?.chats) ? data.chats : Array.isArray(data) ? data : []
        if (mounted) setChats(list)
      } catch {
        if (mounted) setChats([])
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [])

  async function deleteChat(chatId) {
    if (!chatId) return
    const ok = window.confirm('Delete this conversation for you? This will hide the chat on your side but not for the other user.')
    if (!ok) return
    try {
      await API.delete(`/chats/${chatId}`)
      setChats((prev) => prev.filter((c) => (c._id || c.chatId) !== chatId))
      setUnread((prev) => {
        const next = { ...prev }
        delete next[chatId]
        localStorage.setItem('unreadCounts', JSON.stringify(next))
        NetBus.emit({ chatsUpdated: true, at: Date.now() })
        return next
      })
    } catch (e) {
      // best-effort; optionally surface toast in future
      console.error('Failed to delete chat', e?.response?.data || e)
    }
  }

  // Sync unread counts from localStorage and NetBus
  useEffect(() => {
    function compute() {
      try {
        const obj = JSON.parse(localStorage.getItem('unreadCounts') || '{}')
        setUnread(obj)
      } catch {
        setUnread({})
      }
    }
    compute()
    const unsub = NetBus.subscribe((s) => {
      if (s?.chatsUpdated) compute()
    })
    const onStorage = (e) => { if (e.key === 'unreadCounts') compute() }
    window.addEventListener('storage', onStorage)
    return () => { unsub?.(); window.removeEventListener('storage', onStorage) }
  }, [])

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h2 className="text-2xl font-semibold">Chats</h2>
      <div className="mt-4 space-y-2">
        {loading && (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="animate-pulse w-full px-3 py-2 rounded-md border border-gray-200">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-full bg-gray-200" />
                  <div className="flex-1 min-w-0">
                    <div className="h-3 bg-gray-200 rounded w-2/3 mb-1" />
                    <div className="h-2 bg-gray-100 rounded w-1/2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        {!loading && chats.length === 0 && (
          <p className="text-sm text-gray-500">No conversations yet.</p>
        )}
        {chats.map((c) => {
          const id = c?._id || c?.chatId
          const selfId = auth?.user?._id
          const participants = Array.isArray(c?.participants) ? c.participants : []
          const other = participants.find?.((p) => p?._id && p._id !== selfId) || participants[0] || {}
          const fallbackTitle = other?.email || 'Conversation'
          const rawTitle = c?.title
          const looksLikeId = typeof rawTitle === 'string' && /^[0-9a-f]{24}$/i.test(rawTitle)
          const title = (!looksLikeId && rawTitle) || other?.name || fallbackTitle
          const unreadCount = unread?.[id] || 0
          return (
            <div
              key={id}
              className="flex items-center gap-2 px-3 py-2 rounded-md border border-gray-200 hover:bg-gray-50"
            >
              <Link to={`/chat/${id}`} className="flex items-center gap-2 flex-1 min-w-0">
                <div className="h-7 w-7 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 text-xs font-semibold">
                  {(other?.name?.[0] || other?.email?.[0] || 'C').toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <div className="text-sm font-medium truncate flex-1">{title}</div>
                    {unreadCount > 0 && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-600 text-white">
                        {unreadCount}
                      </span>
                    )}
                  </div>
                  {c?.lastMessage?.text && (
                    <div className="text-xs text-gray-500 truncate">{c.lastMessage.text}</div>
                  )}
                </div>
              </Link>
              <button
                type="button"
                onClick={() => deleteChat(id)}
                className="text-[10px] px-2 py-1 rounded-md border border-rose-200 text-rose-600 hover:bg-rose-50 shrink-0"
              >
                Delete
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
