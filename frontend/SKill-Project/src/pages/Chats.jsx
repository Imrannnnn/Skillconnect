import { useContext, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import API from '../api/axios.js'
import { AuthContext } from '../context/auth.js'

export default function Chats() {
  const auth = useContext(AuthContext)
  const [chats, setChats] = useState([])
  const [loading, setLoading] = useState(true)

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
          const other = Array.isArray(c?.participants)
            ? c.participants.find?.((p) => p?._id && p._id !== selfId) || c.participants[0] || {}
            : {}
          const title = c?.title || other?.name || id
          return (
            <Link
              key={id}
              to={`/chat/${id}`}
              className="block px-3 py-2 rounded-md border border-gray-200 hover:bg-gray-50"
            >
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 text-xs font-semibold">
                  {(other?.name?.[0] || 'C').toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">{title}</div>
                  {c?.lastMessage?.text && (
                    <div className="text-xs text-gray-500 truncate">{c.lastMessage.text}</div>
                  )}
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
