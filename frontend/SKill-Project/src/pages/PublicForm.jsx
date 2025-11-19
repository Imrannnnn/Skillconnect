import { useContext, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import API from '../api/axios.js'
import { AuthContext } from '../context/auth.js'

export default function PublicForm() {
  const { id } = useParams()
  const { user } = useContext(AuthContext)

  const [formDef, setFormDef] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitMessage, setSubmitMessage] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError('')
      try {
        const { data } = await API.get(`/forms/${id}`)
        setFormDef(data)
      } catch (e) {
        setError(e?.response?.data?.message || 'Failed to load form')
      } finally {
        setLoading(false)
      }
    }

    if (id) load()
  }, [id])

  if (loading) {
    return (
      <div className="max-w-xl mx-auto px-4 py-8">
        <p className="text-sm text-gray-600">Loading form…</p>
      </div>
    )
  }

  if (error || !formDef) {
    return (
      <div className="max-w-xl mx-auto px-4 py-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Form unavailable</h2>
        <p className="text-sm text-gray-600">{error || 'This form could not be found.'}</p>
      </div>
    )
  }

  const requiresLogin = !formDef.allowAnonymous
  const isLoggedIn = !!user

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFieldErrors({})
    setSubmitMessage('')

    if (requiresLogin && !isLoggedIn) {
      setSubmitMessage('You must be logged in to submit this form.')
      return
    }

    const formEl = e.currentTarget
    const formData = new FormData(formEl)

    setSubmitting(true)
    try {
      await API.post(`/forms/${id}/submissions`, formData)
      setSubmitMessage('Thank you. Your response has been submitted.')
      formEl.reset()
    } catch (e) {
      const status = e?.response?.status
      const data = e?.response?.data
      if (status === 400 && Array.isArray(data?.errors)) {
        const map = {}
        data.errors.forEach((err) => {
          if (err?.fieldId) map[err.fieldId] = err.message
        })
        setFieldErrors(map)
        setSubmitMessage('Please correct the highlighted fields and try again.')
      } else if (status === 401) {
        setSubmitMessage(data?.message || 'You must be logged in to submit this form.')
      } else {
        setSubmitMessage(data?.message || 'Failed to submit form. Please try again.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  const fields = Array.isArray(formDef.fields)
    ? [...formDef.fields].sort((a, b) => (a.order || 0) - (b.order || 0))
    : []

  const renderField = (field) => {
    const idAttr = `field_${field.id}`
    const err = fieldErrors[field.id]
    const required = !!field.required

    const baseLabel = (
      <label htmlFor={idAttr} className="block text-sm font-medium text-gray-700">
        {field.label}
        {required && <span className="text-rose-600 ml-0.5">*</span>}
      </label>
    )

    const helpText = field.helpText && (
      <p className="mt-1 text-xs text-gray-500">{field.helpText}</p>
    )

    const errorText = err && (
      <p className="mt-1 text-xs text-rose-600">{err}</p>
    )

    const commonProps = {
      id: idAttr,
      name: field.id,
      required,
      className:
        'mt-1 block w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 ' +
        (err
          ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500'
          : 'border-gray-300 focus:border-emerald-500 focus:ring-emerald-500'),
      placeholder: field.placeholder || '',
    }

    if (field.type === 'textarea') {
      return (
        <div key={field.id} className="space-y-1">
          {baseLabel}
          <textarea rows={4} {...commonProps} />
          {helpText}
          {errorText}
        </div>
      )
    }

    if (field.type === 'number') {
      return (
        <div key={field.id} className="space-y-1">
          {baseLabel}
          <input type="number" {...commonProps} />
          {helpText}
          {errorText}
        </div>
      )
    }

    if (field.type === 'select') {
      const options = Array.isArray(field.options) ? field.options : []
      return (
        <div key={field.id} className="space-y-1">
          {baseLabel}
          <select
            {...commonProps}
            defaultValue=""
          >
            <option value="" disabled>{field.placeholder || 'Select an option'}</option>
            {options.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
          {helpText}
          {errorText}
        </div>
      )
    }

    if (field.type === 'radio') {
      const options = Array.isArray(field.options) ? field.options : []
      return (
        <div key={field.id} className="space-y-1">
          {baseLabel}
          <div className="mt-1 flex flex-col gap-1">
            {options.map((opt) => (
              <label key={opt} className="inline-flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="radio"
                  name={field.id}
                  value={opt}
                  required={required}
                  className="h-3.5 w-3.5 text-emerald-600 border-gray-300 focus:ring-emerald-500"
                />
                <span>{opt}</span>
              </label>
            ))}
          </div>
          {helpText}
          {errorText}
        </div>
      )
    }

    if (field.type === 'checkbox') {
      const options = Array.isArray(field.options) ? field.options : []
      return (
        <div key={field.id} className="space-y-1">
          {baseLabel}
          <div className="mt-1 flex flex-col gap-1">
            {options.map((opt) => (
              <label key={opt} className="inline-flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  name={field.id}
                  value={opt}
                  className="h-3.5 w-3.5 text-emerald-600 border-gray-300 focus:ring-emerald-500"
                />
                <span>{opt}</span>
              </label>
            ))}
          </div>
          {helpText}
          {errorText}
        </div>
      )
    }

    if (field.type === 'date' || field.type === 'time' || field.type === 'datetime') {
      const typeAttr = field.type === 'datetime' ? 'datetime-local' : field.type
      return (
        <div key={field.id} className="space-y-1">
          {baseLabel}
          <input type={typeAttr} {...commonProps} />
          {helpText}
          {errorText}
        </div>
      )
    }

    if (field.type === 'file') {
      return (
        <div key={field.id} className="space-y-1">
          {baseLabel}
          <input
            id={idAttr}
            name={field.id}
            type="file"
            required={required}
            className="mt-1 block w-full text-sm text-gray-700 file:mr-3 file:rounded-md file:border file:border-gray-300 file:bg-white file:px-3 file:py-1.5 file:text-xs file:font-medium hover:file:bg-gray-50"
          />
          {helpText}
          {errorText}
        </div>
      )
    }

    // default: text
    return (
      <div key={field.id} className="space-y-1">
        {baseLabel}
        <input type="text" {...commonProps} />
        {helpText}
        {errorText}
      </div>
    )
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">{formDef.name}</h1>
        {formDef.description && (
          <p className="mt-2 text-sm text-gray-600">{formDef.description}</p>
        )}
        {requiresLogin && !isLoggedIn && (
          <p className="mt-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
            You must be logged in to submit this form. You can still preview the fields below.
          </p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {fields.length === 0 && (
          <p className="text-sm text-gray-600">This form has no fields configured yet.</p>
        )}
        {fields.map(renderField)}

        <div className="pt-2 flex flex-col gap-2">
          <button
            type="submit"
            disabled={submitting || (requiresLogin && !isLoggedIn) || fields.length === 0}
            className="inline-flex items-center justify-center rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
          >
            {submitting ? 'Submitting…' : 'Submit'}
          </button>
          {submitMessage && (
            <p className="text-xs text-gray-700">{submitMessage}</p>
          )}
        </div>
      </form>
    </div>
  )
}
