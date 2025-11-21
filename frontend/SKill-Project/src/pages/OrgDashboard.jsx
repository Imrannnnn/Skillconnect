import { useContext, useEffect, useMemo, useState } from 'react'
import API from '../api/axios.js'
import { AuthContext } from '../context/auth.js'
import { useToast } from '../components/toast.js'

const FIELD_TYPES = [
  'text',
  'textarea',
  'number',
  'select',
  'checkbox',
  'radio',
  'file',
  'date',
  'time',
  'datetime',
]

const FORM_TEMPLATES = [
  {
    key: 'hospital-intake',
    name: 'Hospital - Patient intake',
    description: 'Collect basic patient details and presenting symptoms.',
    fields: [
      { id: 'fullName', label: 'Full name', type: 'text', required: true },
      { id: 'dateOfBirth', label: 'Date of birth', type: 'date', required: true },
      { id: 'phone', label: 'Phone number', type: 'text', required: true },
      { id: 'symptoms', label: 'Current symptoms', type: 'textarea', required: true },
      { id: 'allergies', label: 'Allergies (if any)', type: 'textarea', required: false },
    ],
  },
  {
    key: 'airline-passenger',
    name: 'Airline - Passenger details',
    description: 'Capture passenger contact details and flight information.',
    fields: [
      { id: 'fullName', label: 'Full name', type: 'text', required: true },
      { id: 'email', label: 'Email', type: 'text', required: true },
      { id: 'flightNumber', label: 'Flight number', type: 'text', required: true },
      { id: 'departureDate', label: 'Departure date', type: 'date', required: true },
      {
        id: 'seatPreference',
        label: 'Seat preference',
        type: 'select',
        required: false,
        options: ['Window', 'Aisle', 'Middle'],
      },
    ],
  },
  {
    key: 'logistics-delivery',
    name: 'Logistics - Delivery request',
    description: 'Collect delivery address and package details.',
    fields: [
      { id: 'customerName', label: 'Customer name', type: 'text', required: true },
      { id: 'address', label: 'Delivery address', type: 'textarea', required: true },
      {
        id: 'packageType',
        label: 'Package type',
        type: 'select',
        required: true,
        options: ['Documents', 'Electronics', 'Fragile', 'General'],
      },
      { id: 'deliveryDate', label: 'Preferred delivery date', type: 'date', required: false },
      { id: 'instructions', label: 'Special instructions', type: 'textarea', required: false },
    ],
  },
  {
    key: 'school-admission',
    name: 'School - Student admission',
    description: 'Collect core details for new student admission.',
    fields: [
      { id: 'studentName', label: 'Student full name', type: 'text', required: true },
      { id: 'guardianName', label: 'Parent/guardian name', type: 'text', required: true },
      { id: 'contactPhone', label: 'Contact phone', type: 'text', required: true },
      { id: 'gradeApplying', label: 'Grade applying for', type: 'text', required: true },
      { id: 'previousSchool', label: 'Previous school (optional)', type: 'text', required: false },
    ],
  },
]

function createEmptyField(order) {
  const id = `field_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
  return {
    id,
    label: 'New field',
    type: 'text',
    required: false,
    placeholder: '',
    helpText: '',
    options: [],
    order,
  }
}

export default function OrgDashboard() {
  const { user } = useContext(AuthContext)
  const { notify } = useToast()

  const [org, setOrg] = useState(null)
  const [loadingOrg, setLoadingOrg] = useState(true)

  const [forms, setForms] = useState([])
  const [loadingForms, setLoadingForms] = useState(false)
  const [activeFormId, setActiveFormId] = useState(null)
  const [editableForm, setEditableForm] = useState(null)
  const [savingForm, setSavingForm] = useState(false)

  const [viewMode, setViewMode] = useState('builder') // 'builder' | 'submissions'
  const [responses, setResponses] = useState([])
  const [loadingResponses, setLoadingResponses] = useState(false)
  const [deletingResponseId, setDeletingResponseId] = useState(null)
  const [templateKey, setTemplateKey] = useState('')

  const activeForm = useMemo(
    () => forms.find((f) => f._id === activeFormId) || null,
    [forms, activeFormId],
  )

  const publicOrgUrl = useMemo(() => {
    if (!org || !org.slug) return ''
    const origin = typeof window !== 'undefined' && window.location ? window.location.origin : ''
    return origin ? `${origin}/org/${org.slug}` : `/org/${org.slug}`
  }, [org])

  useEffect(() => {
    if (!user || !user.organizationId) {
      setLoadingOrg(false)
      return
    }

    let mounted = true
    async function loadOrg() {
      setLoadingOrg(true)
      try {
        const { data } = await API.get(`/organizations/${user.organizationId}`)
        if (!mounted) return
        setOrg(data)
      } catch (e) {
        if (!mounted) return
        notify(e?.response?.data?.message || 'Failed to load organization', { type: 'error' })
      } finally {
        if (mounted) setLoadingOrg(false)
      }
    }

    loadOrg()
    return () => { mounted = false }
  }, [user, notify])

  useEffect(() => {
    if (!org?._id) return
    let mounted = true

    async function loadForms() {
      setLoadingForms(true)
      try {
        const { data } = await API.get('/forms', { params: { organizationId: org._id } })
        if (!mounted) return
        const list = Array.isArray(data?.forms) ? data.forms : []
        setForms(list)
        if (list.length) {
          setActiveFormId((prev) => prev || list[0]._id)
        } else {
          setActiveFormId(null)
          setEditableForm(null)
        }
      } catch (e) {
        if (!mounted) return
        notify(e?.response?.data?.message || 'Failed to load forms', { type: 'error' })
      } finally {
        if (mounted) setLoadingForms(false)
      }
    }

    loadForms()
    return () => { mounted = false }
  }, [org, notify])

  useEffect(() => {
    if (!activeFormId) {
      setEditableForm(null)
      setResponses([])
      return
    }
    const base = forms.find((f) => f._id === activeFormId)
    if (base) {
      setEditableForm(JSON.parse(JSON.stringify(base)))
      setResponses([])
      setViewMode('builder')
    }
  }, [activeFormId, forms])

  useEffect(() => {
    if (viewMode !== 'submissions' || !activeFormId) return
    let mounted = true

    async function loadResponses() {
      setLoadingResponses(true)
      try {
        const { data } = await API.get(`/forms/${activeFormId}/submissions`)
        if (!mounted) return
        const list = Array.isArray(data?.responses) ? data.responses : []
        setResponses(list)
      } catch (e) {
        if (!mounted) return
        notify(e?.response?.data?.message || 'Failed to load submissions', { type: 'error' })
      } finally {
        if (mounted) setLoadingResponses(false)
      }
    }

    loadResponses()
    return () => { mounted = false }
  }, [viewMode, activeFormId, notify])

  if (!user) {
    return null
  }

  if (user.accountType !== 'organization') {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <h2 className="text-xl font-semibold text-gray-900">Organization dashboard</h2>
        <p className="mt-2 text-sm text-gray-600">
          This area is only available to organization accounts. Please log in with an organization account.
        </p>
      </div>
    )
  }

  const handleCopyOrgLink = async () => {
    if (!publicOrgUrl) return
    try {
      if (navigator && navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(publicOrgUrl)
        notify('Organization link copied to clipboard', { type: 'success' })
      } else {
        notify(publicOrgUrl, { type: 'info' })
      }
    } catch {
      notify('Could not copy organization link. Please copy it manually from the address bar.', { type: 'error' })
    }
  }

  const handleCreateForm = async () => {
    if (!org) return
    try {
      const payload = {
        organizationId: org._id,
        name: 'Untitled form',
        description: '',
        status: 'draft',
        allowAnonymous: false,
        fields: [],
      }
      const { data } = await API.post('/forms', payload)
      const form = data
      setForms((prev) => [form, ...prev])
      setActiveFormId(form._id)
      notify('Form created', { type: 'success' })
    } catch (e) {
      notify(e?.response?.data?.message || 'Failed to create form', { type: 'error' })
    }
  }

  const handleCreateFormFromTemplate = async () => {
    if (!org || !templateKey) return
    const template = FORM_TEMPLATES.find((t) => t.key === templateKey)
    if (!template) return
    try {
      const payload = {
        organizationId: org._id,
        name: template.name,
        description: template.description,
        status: 'draft',
        allowAnonymous: false,
        fields: template.fields,
      }
      const { data } = await API.post('/forms', payload)
      const form = data
      setForms((prev) => [form, ...prev])
      setActiveFormId(form._id)
      setTemplateKey('')
      notify('Form created from template', { type: 'success' })
    } catch (e) {
      notify(e?.response?.data?.message || 'Failed to create form from template', { type: 'error' })
    }
  }

  const handleSaveForm = async () => {
    if (!editableForm || !editableForm._id) return
    setSavingForm(true)
    try {
      const fields = Array.isArray(editableForm.fields)
        ? editableForm.fields.map((f, index) => ({
            ...f,
            order: index,
          }))
        : []

      const payload = {
        name: editableForm.name,
        description: editableForm.description,
        status: editableForm.status || 'draft',
        allowAnonymous: !!editableForm.allowAnonymous,
        fields,
      }
      await API.put(`/forms/${editableForm._id}`, payload)

      if (org) {
        const { data } = await API.get('/forms', { params: { organizationId: org._id } })
        const list = Array.isArray(data?.forms) ? data.forms : []
        setForms(list)
      }

      notify('Form saved', { type: 'success' })
    } catch (e) {
      notify(e?.response?.data?.message || 'Failed to save form', { type: 'error' })
    } finally {
      setSavingForm(false)
    }
  }

  const handleAddField = () => {
    setEditableForm((prev) => {
      if (!prev) return prev
      const current = Array.isArray(prev.fields) ? prev.fields : []
      const next = [...current, createEmptyField(current.length)]
      return { ...prev, fields: next }
    })
  }

  const handleUpdateField = (index, patch) => {
    setEditableForm((prev) => {
      if (!prev) return prev
      const current = Array.isArray(prev.fields) ? prev.fields : []
      if (!current[index]) return prev
      const next = [...current]
      next[index] = { ...next[index], ...patch }
      return { ...prev, fields: next }
    })
  }

  const handleMoveField = (index, direction) => {
    setEditableForm((prev) => {
      if (!prev) return prev
      const current = Array.isArray(prev.fields) ? prev.fields : []
      const target = index + direction
      if (target < 0 || target >= current.length) return prev
      const next = [...current]
      const [item] = next.splice(index, 1)
      next.splice(target, 0, item)
      return { ...prev, fields: next }
    })
  }

  const handleDeleteField = (index) => {
    setEditableForm((prev) => {
      if (!prev) return prev
      const current = Array.isArray(prev.fields) ? prev.fields : []
      if (!current[index]) return prev
      const next = current.filter((_, i) => i !== index)
      return { ...prev, fields: next }
    })
  }

  const handleDeleteResponse = async (responseId) => {
    if (!activeForm || !responseId) return
    if (!window.confirm('Delete this submission? This cannot be undone.')) return
    setDeletingResponseId(responseId)
    try {
      await API.delete(`/forms/${activeForm._id}/submissions/${responseId}`)
      setResponses((prev) => prev.filter((r) => r._id !== responseId))
      notify('Submission deleted', { type: 'success' })
    } catch (e) {
      notify(e?.response?.data?.message || 'Failed to delete submission', { type: 'error' })
    } finally {
      setDeletingResponseId(null)
    }
  }

  const handleExportCsv = async () => {
    if (!activeForm) return
    try {
      const response = await API.get(`/forms/${activeForm._id}/export/csv`, { responseType: 'blob' })
      const data = response?.data
      const blob = data instanceof Blob ? data : new Blob([data], { type: 'text/csv;charset=utf-8;' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      const safeName = (activeForm.name || 'form').replace(/[^a-z0-9_-]+/gi, '_')
      link.download = `${safeName}-responses.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (e) {
      notify(e?.response?.data?.message || 'Failed to export responses', { type: 'error' })
    }
  }

  const handleCopyPublicLink = async () => {
    if (!editableForm || !editableForm._id) return
    try {
      const origin = typeof window !== 'undefined' && window.location ? window.location.origin : ''
      const url = `${origin}/forms/${editableForm._id}`
      if (navigator && navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(url)
        notify('Public form link copied to clipboard', { type: 'success' })
      } else {
        notify(url, { type: 'info' })
      }
    } catch {
      notify('Could not copy link. Please copy it manually from the address bar.', { type: 'error' })
    }
  }

  const renderFieldRow = (field, index) => {
    const optionsText = Array.isArray(field.options) ? field.options.join(', ') : ''
    return (
      <div key={field.id || index} className="flex flex-col gap-2 rounded-md border border-gray-200 bg-white p-3 text-xs sm:text-sm">
        <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
          <input
            type="text"
            value={field.label || ''}
            onChange={(e) => handleUpdateField(index, { label: e.target.value })}
            placeholder="Field label"
            className="flex-1 rounded-md border border-gray-300 px-2 py-1 text-xs sm:text-sm"
          />
          <select
            value={field.type || 'text'}
            onChange={(e) => handleUpdateField(index, { type: e.target.value })}
            className="w-32 rounded-md border border-gray-300 px-2 py-1 text-xs sm:text-sm"
          >
            {FIELD_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <label className="inline-flex items-center gap-1 text-[11px] sm:text-xs text-gray-700">
            <input
              type="checkbox"
              checked={!!field.required}
              onChange={(e) => handleUpdateField(index, { required: e.target.checked })}
              className="h-3 w-3"
            />
            Required
          </label>
        </div>
        {(field.type === 'select' || field.type === 'checkbox' || field.type === 'radio') && (
          <div className="flex flex-col gap-1">
            <label className="text-[11px] text-gray-600">Options (comma-separated)</label>
            <input
              type="text"
              value={optionsText}
              onChange={(e) => {
                const raw = e.target.value || ''
                const opts = raw
                  .split(',')
                  .map((s) => s.trim())
                  .filter(Boolean)
                handleUpdateField(index, { options: opts })
              }}
              placeholder="e.g. Pending, In progress, Completed"
              className="rounded-md border border-gray-300 px-2 py-1 text-xs sm:text-sm"
            />
          </div>
        )}
        <div className="flex justify-between items-center gap-2 pt-1">
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => handleMoveField(index, -1)}
              className="px-2 py-1 rounded-md border border-gray-200 text-[11px] text-gray-600 hover:bg-gray-50"
            >
              ↑
            </button>
            <button
              type="button"
              onClick={() => handleMoveField(index, 1)}
              className="px-2 py-1 rounded-md border border-gray-200 text-[11px] text-gray-600 hover:bg-gray-50"
            >
              ↓
            </button>
          </div>
          <button
            type="button"
            onClick={() => handleDeleteField(index)}
            className="px-2 py-1 rounded-md border border-rose-200 text-[11px] text-rose-700 hover:bg-rose-50"
          >
            Remove
          </button>
        </div>
      </div>
    )
  }

  const renderSubmissions = () => {
    if (!activeForm) {
      return (
        <p className="text-xs text-gray-500">Select or create a form to view submissions.</p>
      )
    }
    if (loadingResponses) {
      return <p className="text-xs text-gray-500">Loading submissions…</p>
    }
    if (!responses.length) {
      return (
        <div className="flex items-center justify-between text-xs text-gray-600">
          <p>No submissions yet for this form.</p>
          <button
            type="button"
            onClick={handleExportCsv}
            className="px-2 py-1 rounded-md border border-gray-200 text-[11px] text-gray-700 hover:bg-gray-50"
          >
            Export CSV
          </button>
        </div>
      )
    }

    return (
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-600">
            {responses.length} submission{responses.length === 1 ? '' : 's'}
          </p>
          <button
            type="button"
            onClick={handleExportCsv}
            className="px-2 py-1 rounded-md border border-gray-200 text-[11px] text-gray-700 hover:bg-gray-50"
          >
            Export CSV
          </button>
        </div>
        <div className="overflow-x-auto rounded-md border border-gray-200 bg-white">
          <table className="min-w-full text-left text-xs">
            <thead className="bg-gray-50 text-[11px] uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-3 py-2">Created</th>
                <th className="px-3 py-2">Submitted by</th>
                <th className="px-3 py-2">Summary</th>
                <th className="px-3 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {responses.map((r) => {
                const created = r.createdAt ? new Date(r.createdAt) : null
                const createdLabel = created ? created.toLocaleString() : ''
                const submittedBy = r.submittedBy || {}
                const submitLabel = submittedBy.name || submittedBy.email || '—'

                let summary = ''
                const baseFields = Array.isArray(editableForm?.fields) ? editableForm.fields : []
                const maxFields = Math.min(baseFields.length, 3)
                const parts = []
                for (let i = 0; i < maxFields; i += 1) {
                  const f = baseFields[i]
                  if (!f) continue
                  let value = ''
                  if (r.values && typeof r.values.get === 'function') {
                    value = r.values.get(f.id)
                  } else if (r.values) {
                    value = r.values[f.id]
                  }
                  if (Array.isArray(value)) value = value.join(', ')
                  if (value == null || value === '') continue
                  parts.push(`${f.label}: ${value}`)
                }
                summary = parts.join(' | ')

                return (
                  <tr key={r._id} className="border-t border-gray-100">
                    <td className="px-3 py-2 align-top text-[11px] text-gray-700">{createdLabel}</td>
                    <td className="px-3 py-2 align-top text-[11px] text-gray-700">{submitLabel}</td>
                    <td className="px-3 py-2 align-top text-[11px] text-gray-600">
                      {summary || <span className="text-gray-400">No preview</span>}
                    </td>
                    <td className="px-3 py-2 align-top text-right text-[11px]">
                      <button
                        type="button"
                        disabled={deletingResponseId === r._id}
                        onClick={() => handleDeleteResponse(r._id)}
                        className="px-2 py-1 rounded-md border border-rose-200 text-rose-700 hover:bg-rose-50 disabled:opacity-60"
                      >
                        {deletingResponseId === r._id ? 'Deleting…' : 'Delete'}
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h2 className="text-2xl font-semibold text-gray-900">Organization dashboard</h2>
      {loadingOrg && (
        <p className="mt-2 text-sm text-gray-500">Loading organization…</p>
      )}
      {org && (
        <p className="mt-1 text-sm text-gray-600">
          {org.name}{org.sector ? ` • ${org.sector}` : ''}{org.email ? ` • ${org.email}` : ''}
        </p>
      )}
      {org?.slug && publicOrgUrl && (
        <div className="mt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-gray-700">
          <div className="break-all">
            Public profile:{' '}
            <a
              href={publicOrgUrl}
              target="_blank"
              rel="noreferrer"
              className="text-emerald-700 hover:text-emerald-800 underline"
            >
              {publicOrgUrl}
            </a>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleCopyOrgLink}
              className="inline-flex items-center justify-center rounded-md border border-gray-200 bg-white px-3 py-1.5 text-[11px] text-gray-700 hover:bg-gray-50"
            >
              Copy organization link
            </button>
          </div>
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 flex flex-col gap-4">
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Forms</h3>
            {loadingForms && <p className="text-xs text-gray-500 mb-2">Loading forms…</p>}
            {org && !loadingForms && forms.length === 0 && (
              <p className="text-xs text-gray-600 mb-3">No forms yet. Create one to start collecting data.</p>
            )}
            <div className="flex flex-col gap-2 mb-4">
              <button
                type="button"
                onClick={handleCreateForm}
                className="inline-flex items-center justify-center rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700"
              >
                New form
              </button>
              <div className="mt-1 flex flex-col gap-1">
                <span className="text-[11px] text-gray-600">Or start from a template</span>
                <div className="flex items-center gap-2">
                  <select
                    value={templateKey}
                    onChange={(e) => setTemplateKey(e.target.value)}
                    className="flex-1 rounded-md border border-gray-300 px-2 py-1 text-xs"
                  >
                    <option value="">Select template…</option>
                    {FORM_TEMPLATES.map((t) => (
                      <option key={t.key} value={t.key}>{t.name}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    disabled={!templateKey}
                    onClick={handleCreateFormFromTemplate}
                    className="inline-flex items-center justify-center rounded-md border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[11px] font-medium text-emerald-800 hover:bg-emerald-100 disabled:opacity-60"
                  >
                    Create
                  </button>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-1 max-h-56 overflow-y-auto">
              {forms.map((form) => (
                <button
                  key={form._id}
                  type="button"
                  onClick={() => setActiveFormId(form._id)}
                  className={`flex flex-col items-start rounded-md border px-2 py-1.5 text-xs text-left ${
                    form._id === activeFormId
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-800'
                      : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span className="font-medium truncate max-w-[180px]">{form.name}</span>
                  <span className="mt-0.5 text-[11px] text-gray-500">{form.status || 'draft'}</span>
                  <span className="mt-0.5 text-[10px] text-gray-400 truncate max-w-[180px]">/forms/{form._id}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 flex flex-col gap-4">
          {!editableForm && (
            <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-6 text-sm text-gray-600">
              <p>Select or create a form to start configuring fields.</p>
            </div>
          )}

          {editableForm && (
            <>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex-1 flex flex-col gap-2">
                  <input
                    type="text"
                    value={editableForm.name || ''}
                    onChange={(e) => setEditableForm((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="Form name"
                    className="rounded-md border border-gray-300 px-3 py-2 text-sm"
                  />
                  <textarea
                    value={editableForm.description || ''}
                    onChange={(e) => setEditableForm((prev) => ({ ...prev, description: e.target.value }))}
                    placeholder="Short description (optional)"
                    rows={2}
                    className="rounded-md border border-gray-300 px-3 py-2 text-sm"
                  />
                  <div className="flex flex-wrap items-center gap-3 text-xs text-gray-700">
                    <label className="inline-flex items-center gap-1">
                      <span>Status:</span>
                      <select
                        value={editableForm.status || 'draft'}
                        onChange={(e) => setEditableForm((prev) => ({ ...prev, status: e.target.value }))}
                        className="rounded-md border border-gray-300 px-2 py-1 text-xs"
                      >
                        <option value="draft">draft</option>
                        <option value="active">active</option>
                        <option value="archived">archived</option>
                      </select>
                    </label>
                    <label className="inline-flex items-center gap-1">
                      <input
                        type="checkbox"
                        checked={!!editableForm.allowAnonymous}
                        onChange={(e) => setEditableForm((prev) => ({ ...prev, allowAnonymous: e.target.checked }))}
                        className="h-3 w-3"
                      />
                      Allow anonymous submissions
                    </label>
                  </div>
                </div>
                <div className="flex flex-row sm:flex-col gap-2 sm:items-end">
                  <button
                    type="button"
                    onClick={handleSaveForm}
                    disabled={savingForm}
                    className="inline-flex items-center justify-center rounded-md bg-emerald-600 px-4 py-2 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
                  >
                    {savingForm ? 'Saving…' : 'Save form'}
                  </button>
                  <button
                    type="button"
                    onClick={handleCopyPublicLink}
                    className="inline-flex items-center justify-center rounded-md border border-gray-200 bg-white px-3 py-1.5 text-[11px] text-gray-700 hover:bg-gray-50"
                  >
                    Copy public link
                  </button>
                  <a
                    href={typeof window !== 'undefined' ? `${window.location.origin}/forms/${editableForm._id}` : `#/forms/${editableForm._id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center rounded-md border border-gray-200 bg-white px-3 py-1.5 text-[11px] text-gray-700 hover:bg-gray-50"
                  >
                    Open form
                  </a>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 text-xs">
                    <button
                      type="button"
                      onClick={() => setViewMode('builder')}
                      className={`px-3 py-1.5 rounded-md border text-xs ${
                        viewMode === 'builder'
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                          : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      Builder
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode('submissions')}
                      className={`px-3 py-1.5 rounded-md border text-xs ${
                        viewMode === 'submissions'
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                          : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      Submissions
                    </button>
                  </div>
                </div>

                {viewMode === 'builder' && (
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-sm font-semibold text-gray-900">Fields</h3>
                      <button
                        type="button"
                        onClick={handleAddField}
                        className="px-3 py-1.5 rounded-md border border-emerald-600 text-[11px] text-emerald-700 hover:bg-emerald-50"
                      >
                        Add field
                      </button>
                    </div>
                    <div className="flex flex-col gap-2">
                      {Array.isArray(editableForm.fields) && editableForm.fields.length > 0 ? (
                        editableForm.fields.map((field, index) => renderFieldRow(field, index))
                      ) : (
                        <p className="text-xs text-gray-500">No fields yet. Click "Add field" to start building your form.</p>
                      )}
                    </div>
                  </div>
                )}

                {viewMode === 'submissions' && renderSubmissions()}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
