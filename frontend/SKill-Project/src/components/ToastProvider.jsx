import { useCallback, useRef, useState } from 'react'
import { ToastCtx } from './toast.js'

export default function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const idRef = useRef(0)

  const notify = useCallback((message, opts = {}) => {
    const id = ++idRef.current
    const toast = { id, message, type: opts.type || 'info', ttl: opts.ttl || 3000 }
    setToasts((prev) => [...prev, toast])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, toast.ttl)
  }, [])

  return (
    <ToastCtx.Provider value={{ notify }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 space-y-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`min-w-[220px] max-w-xs rounded-md border shadow-md px-3 py-2 text-sm bg-white ${
              t.type === 'success'
                ? 'border-emerald-200 text-emerald-800'
                : t.type === 'error'
                ? 'border-rose-200 text-rose-700'
                : 'border-gray-200 text-gray-700'
            }`}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  )
}
