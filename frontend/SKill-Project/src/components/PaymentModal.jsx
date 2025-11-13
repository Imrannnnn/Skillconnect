import { useMemo, useState } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js'
import API from '../api/axios.js'
import { useToast } from './toast.js'

function CheckoutForm({ providerId, onSuccess, onClose }) {
  const stripe = useStripe()
  const elements = useElements()
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { notify } = useToast()

  async function handlePay(e) {
    e.preventDefault()
    setError('')
    if (!stripe || !elements) return
    const parsed = Number(amount)
    if (!parsed || parsed <= 0) {
      setError('Enter a valid amount')
      return
    }
    try {
      setLoading(true)
      const { data } = await API.post('/payments/create-intent', {
        amount: Math.round(parsed * 100), // cents
        currency: 'usd',
        providerId,
      })
      const clientSecret = data?.client_secret || data?.clientSecret
      if (!clientSecret) {
        setError('Payment initialization failed')
        return
      }
      const card = elements.getElement(CardElement)
      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: { card },
      })
      if (result.error) {
        setError(result.error.message || 'Payment failed')
        notify(result.error.message || 'Payment failed', { type: 'error' })
        return
      }
      if (result.paymentIntent?.status === 'succeeded') {
        notify('Payment successful', { type: 'success' })
        onSuccess?.(result.paymentIntent)
        onClose?.()
      }
    } catch (e) {
      setError(e?.response?.data?.message || 'Payment error')
      notify(e?.response?.data?.message || 'Payment error', { type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handlePay} className="grid gap-3">
      <label className="grid gap-1 text-sm">
        <span className="text-gray-700">Amount (USD)</span>
        <input
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="100.00"
          type="number"
          min="0"
          step="0.01"
          className="px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
      </label>
      <div className="rounded-md border border-gray-300 p-3 bg-white">
        <CardElement options={{ hidePostalCode: true }} />
      </div>
      {error && <p className="text-rose-500 text-sm">{error}</p>}
      <div className="flex gap-2 justify-end mt-2">
        <button type="button" onClick={onClose} className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50">Cancel</button>
        <button disabled={loading} className="px-4 py-2 rounded-md bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-70">
          {loading ? 'Processing…' : 'Pay'}
        </button>
      </div>
    </form>
  )
}

export default function PaymentModal({ open, onClose, providerId, onSuccess }) {
  const stripePk = import.meta.env.VITE_STRIPE_PK
  const stripePromise = useMemo(() => (stripePk ? loadStripe(stripePk) : null), [stripePk])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="w-full max-w-md rounded-lg border border-gray-200 bg-white p-6 shadow-xl">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Complete Payment</h3>
          {!stripePk && (
            <p className="text-sm text-rose-500 mt-1">Missing Stripe publishable key (VITE_STRIPE_PK)</p>
          )}
        </div>
        {stripePromise ? (
          <Elements stripe={stripePromise}>
            <CheckoutForm providerId={providerId} onSuccess={onSuccess} onClose={onClose} />
          </Elements>
        ) : (
          <div className="text-sm text-gray-600">Configure Stripe to continue.</div>
        )}
      </div>
    </div>
  )
}
