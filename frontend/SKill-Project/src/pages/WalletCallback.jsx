import { useEffect, useState } from 'react'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import API from '../api/axios.js'

export default function WalletCallback() {
  const location = useLocation()
  const navigate = useNavigate()
  const [status, setStatus] = useState('checking')
  const [message, setMessage] = useState('Verifying your payment, please wait…')

  useEffect(() => {
    const params = new URLSearchParams(location.search || '')
    const paystackStatus = params.get('status') || ''

    if (paystackStatus.toLowerCase() === 'success') {
      setStatus('success')
      setMessage('Your wallet funding was successful. Your balance should update shortly.')
    } else if (paystackStatus) {
      setStatus('failed')
      setMessage('Payment did not complete successfully. If you were charged, your balance may still update after verification.')
    } else {
      setStatus('unknown')
      setMessage('We could not determine the payment status. If you completed payment, your balance may update after a short delay.')
    }

    // Best-effort refresh of wallet / recent transactions
    ;(async () => {
      try {
        await API.get('/wallet/me').catch(() => null)
        await API.get('/wallet/transactions?limit=5&page=1').catch(() => null)
      } catch {
        // ignore
      }
    })()
  }, [location.search])

  const isSuccess = status === 'success'
  const isFailed = status === 'failed'

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold mb-2">Wallet funding</h2>
        <p className={`text-sm mb-4 ${isSuccess ? 'text-emerald-700' : isFailed ? 'text-rose-700' : 'text-gray-700'}`}>
          {message}
        </p>
        <div className="flex flex-wrap gap-2 mt-2">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-3 py-1.5 text-xs rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            Go back
          </button>
          <Link
            to="/dashboard"
            className="px-3 py-1.5 text-xs rounded-md bg-emerald-600 text-white hover:bg-emerald-700"
          >
            Go to client dashboard
          </Link>
          <Link
            to="/provider/dashboard"
            className="px-3 py-1.5 text-xs rounded-md border border-emerald-600 text-emerald-700 bg-white hover:bg-emerald-50"
          >
            Go to provider dashboard
          </Link>
          <Link
            to="/payments"
            className="px-3 py-1.5 text-xs rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            View payments
          </Link>
        </div>
      </div>
    </div>
  )
}
