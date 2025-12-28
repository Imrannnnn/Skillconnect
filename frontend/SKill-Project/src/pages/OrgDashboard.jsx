import { useContext, useEffect, useMemo, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import API from '../api/axios.js'
import { AuthContext } from '../context/auth.js'
import { useToast } from '../components/toast.js'
import { getImageUrl } from '../utils/image.js'

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

const CAPABILITY_HIGHLIGHTS = [
  {
    icon: '📊',
    title: 'Organization dashboard',
    description: 'Monitor everything in one place with quick stats on forms, staff, and engagement.',
  },
  {
    icon: '🛠',
    title: 'Custom form builder',
    description: 'Design workflows with drag-and-drop style configuration, rich field types, and quick publishing.',
  },
  {
    icon: '👥',
    title: 'Add staff & collaborators',
    description: 'Invite teammates to manage submissions, respond to clients, and keep operations moving.',
  },
]

const DASHBOARD_TASKS = [
  'Add form fields',
  'Choose field types',
  'Save forms',
  'Publish forms',
  'Get a public form link',
  'View submissions',
  'View form responses',
  'Manage departments',
  'Attach workflows',
  'Adjust organization settings',
]

const STAFF_PERMISSIONS = [
  'View submissions in real time',
  'Respond to forms and manage follow-ups',
  'Collaborate on internal workflows',
  'Keep the organization data up to date',
  'Cannot delete the organization account',
]

const PROFILE_SECTION_LABELS = {
  services: 'Services',
  projects: 'Projects',
  teamMembers: 'Team members',
  partners: 'Partners',
  achievements: 'Achievements',
  reviews: 'Testimonials',
  media: 'Media gallery',
  certificates: 'Certificates',
  updates: 'Updates',
}

const DEFAULT_PROFILE_SECTION_STATE = {
  services: true,
  teamMembers: true,
  achievements: true,
  projects: true,
  reviews: true,
  partners: true,
  media: true,
  certificates: true,
  updates: true,
}

const logoInputId = 'org-logo-input'

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
  const [deletingFormId, setDeletingFormId] = useState(null) // For delete confirmation state
  const [templateKey, setTemplateKey] = useState('')
  const [orgDraft, setOrgDraft] = useState(null)

  const [savingOrgProfile, setSavingOrgProfile] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [showProfileEditor, setShowProfileEditor] = useState(false)
  const [openProfileSections, setOpenProfileSections] = useState({ ...DEFAULT_PROFILE_SECTION_STATE })

  // Collaborators state
  const [collaborators, setCollaborators] = useState({ owner: null, admins: [], staff: [] })
  const [loadingCollaborators, setLoadingCollaborators] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('staff')
  const [inviting, setInviting] = useState(false)

  useEffect(() => {
    if (showProfileEditor) {
      setOpenProfileSections({ ...DEFAULT_PROFILE_SECTION_STATE })
    }
  }, [showProfileEditor])

  const activeForm = useMemo(
    () => forms.find((f) => f._id === activeFormId) || null,
    [forms, activeFormId],
  )

  const publicOrgUrl = useMemo(() => {
    if (!org || !org.slug) return ''
    const origin = typeof window !== 'undefined' && window.location ? window.location.origin : ''
    return origin ? `${origin}/org/${org.slug}` : `/org/${org.slug}`
  }, [org])

  const formStats = useMemo(() => {
    const total = forms.length
    const active = forms.filter((f) => f?.status === 'active').length
    const draft = total - active
    return { total, active, draft: draft < 0 ? 0 : draft }
  }, [forms])

  const staffSummary = useMemo(() => {
    const staff = Array.isArray(org?.staff) ? org.staff : []
    const admins = Array.isArray(org?.admins) ? org.admins : []
    const uniqueIds = new Set([
      ...staff.map((id) => (typeof id === 'object' && id !== null && 'toString' in id ? id.toString() : String(id))),
      ...admins.map((id) => (typeof id === 'object' && id !== null && 'toString' in id ? id.toString() : String(id))),
    ])
    return {
      staffCount: staff.length,
      adminCount: admins.length,
      totalMembers: uniqueIds.has('undefined') ? uniqueIds.size - 1 : uniqueIds.size,
    }
  }, [org?.staff, org?.admins])

  const profileSummary = useMemo(() => {
    const summaryDraft = orgDraft || {}

    const countEntries = (value) => {
      if (Array.isArray(value)) {
        return value.filter((item) => {
          if (item && typeof item === 'object') {
            return Object.values(item).some((val) => Boolean(val))
          }
          return Boolean(item)
        }).length
      }

      if (value && typeof value === 'object') {
        return Object.values(value).some((val) => Boolean(val)) ? 1 : 0
      }

      return value ? 1 : 0
    }

    return {
      services: countEntries(summaryDraft.services),
      projects: countEntries(summaryDraft.projects),
      teamMembers: countEntries(summaryDraft.teamMembers),
      partners: countEntries(summaryDraft.partners),
      achievements: countEntries(summaryDraft.achievements),
      reviews: countEntries(summaryDraft.reviews),
      media: countEntries(summaryDraft.media),
      certificates: countEntries(summaryDraft.certificates),
      updates: countEntries(summaryDraft.updates),
    }
  }, [orgDraft])

  const truncatedDescription = useMemo(() => {
    if (!orgDraft?.description) return ''
    const trimmed = orgDraft.description.trim()
    if (trimmed.length <= 220) return trimmed
    return `${trimmed.slice(0, 220)}…`
  }, [orgDraft?.description])

  const contactEntries = useMemo(() => {
    const entries = []
    if (org?.email) {
      entries.push({ label: 'Email', value: org.email, href: `mailto:${org.email}` })
    }
    if (orgDraft?.phone) {
      entries.push({ label: 'Phone', value: orgDraft.phone, href: `tel:${orgDraft.phone}` })
    }
    if (orgDraft?.website) {
      entries.push({ label: 'Website', value: orgDraft.website, href: orgDraft.website, external: true })
    }
    if (orgDraft?.address) {
      entries.push({ label: 'Address', value: orgDraft.address })
    }
    return entries
  }, [org?.email, orgDraft?.phone, orgDraft?.website, orgDraft?.address])

  const populatedSections = useMemo(
    () => Object.values(profileSummary).filter((count) => Number(count) > 0).length,
    [profileSummary],
  )

  const profileCompletionPercent = useMemo(() => {
    const totalSections = Object.keys(profileSummary).length || 0
    if (!totalSections) return 0
    const ratio = (populatedSections / totalSections) * 100
    return Math.min(100, Math.round(ratio))
  }, [profileSummary, populatedSections])

  const profileSectionsList = useMemo(
    () =>
      Object.entries(profileSummary).map(([key, count]) => ({
        key,
        label: PROFILE_SECTION_LABELS[key] || key,
        count: Number(count) || 0,
      })),
    [profileSummary],
  )

  const hasProfileDetails = useMemo(
    () => profileSectionsList.some((section) => section.count > 0),
    [profileSectionsList],
  )

  const hasContactInfo = useMemo(() => contactEntries.length > 0, [contactEntries])

  const createdAtLabel = useMemo(() => {
    if (!org?.createdAt) return ''
    const createdDate = new Date(org.createdAt)
    if (Number.isNaN(createdDate.getTime())) return ''
    return createdDate.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }, [org?.createdAt])

  const orgInitial = useMemo(() => {
    const name = orgDraft?.name || org?.name || ''
    if (!name) return 'O'
    return name.trim().charAt(0).toUpperCase()
  }, [orgDraft?.name, org?.name])

  const handleOrgDraftChange = (field, value) => {
    setOrgDraft((prev) => (prev ? { ...prev, [field]: value } : prev))
  }

  const handleLogoUpload = async (file) => {
    if (!org?._id || !file) return

    const maxSize = 5 * 1024 * 1024
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp']

    if (!allowedTypes.includes(file.type)) {
      notify('Unsupported file type. Please use PNG, JPG, or WEBP.', { type: 'error' })
      return
    }

    if (file.size > maxSize) {
      notify('File is too large. Maximum size is 5MB.', { type: 'error' })
      return
    }

    setUploadingLogo(true)
    try {
      const fd = new FormData()
      fd.append('logo', file)
      const { data } = await API.post(`/organizations/${org._id}/logo`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      if (data?.url) {
        setOrgDraft((prev) => (prev ? { ...prev, logo: data.url } : prev))
        notify('Logo uploaded', { type: 'success' })
      }
    } catch (e) {
      notify(e?.response?.data?.message || 'Failed to upload logo', { type: 'error' })
    } finally {
      setUploadingLogo(false)
    }
  }

  const handleSaveOrgProfile = async () => {
    if (!org?._id || !orgDraft) return
    setSavingOrgProfile(true)
    try {
      const payload = {
        name: orgDraft.name,
        sector: orgDraft.sector,
        tagline: orgDraft.tagline,
        phone: orgDraft.phone,
        website: orgDraft.website,
        logo: orgDraft.logo,
        address: orgDraft.address,
        description: orgDraft.description,
        services: Array.isArray(orgDraft.services) ? orgDraft.services : [],
        teamMembers: Array.isArray(orgDraft.teamMembers) ? orgDraft.teamMembers : [],
        achievements: Array.isArray(orgDraft.achievements) ? orgDraft.achievements : [],
        projects: Array.isArray(orgDraft.projects) ? orgDraft.projects : [],
        ratingScore: orgDraft.ratingScore,
        ratingCount: orgDraft.ratingCount,
        reviews: Array.isArray(orgDraft.reviews) ? orgDraft.reviews : [],
        partners: Array.isArray(orgDraft.partners) ? orgDraft.partners : [],
        media: Array.isArray(orgDraft.media) ? orgDraft.media : [],
        certificates: Array.isArray(orgDraft.certificates) ? orgDraft.certificates : [],
        updates: Array.isArray(orgDraft.updates) ? orgDraft.updates : [],
      }
      await API.put(`/organizations/${org._id}/profile`, payload)
      const { data } = await API.get(`/organizations/${user.organizationId}`)
      setOrg(data)
      notify('Organization profile updated', { type: 'success' })
    } catch (e) {
      notify(e?.response?.data?.message || 'Failed to update organization profile', { type: 'error' })
    } finally {
      setSavingOrgProfile(false)
    }
  }

  useEffect(() => {
    if (org) {
      setOrgDraft({
        name: org.name || '',
        sector: org.sector || '',
        tagline: org.tagline || '',
        phone: org.phone || '',
        website: org.website || '',
        logo: org.logo || '',
        address: org.address || '',
        description: org.description || '',
        services: Array.isArray(org.services) ? org.services : [],
        teamMembers: Array.isArray(org.teamMembers) ? org.teamMembers : [],
        achievements: Array.isArray(org.achievements) ? org.achievements : [],
        projects: Array.isArray(org.projects) ? org.projects : [],
        ratingScore: typeof org.ratingScore === 'number' ? org.ratingScore : '',
        ratingCount: typeof org.ratingCount === 'number' ? org.ratingCount : '',
        reviews: Array.isArray(org.reviews) ? org.reviews : [],
        partners: Array.isArray(org.partners) ? org.partners : [],
        media: Array.isArray(org.media) ? org.media : [],
        certificates: Array.isArray(org.certificates) ? org.certificates : [],
        updates: Array.isArray(org.updates) ? org.updates : [],
      })
      setShowProfileEditor(false)
    } else {
      setOrgDraft(null)
      setShowProfileEditor(false)
    }
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

  // Collaborators API helpers
  const loadCollaborators = useCallback(async () => {
    if (!org?._id) return
    setLoadingCollaborators(true)
    try {
      const { data } = await API.get(`/organizations/${org._id}/collaborators`)
      setCollaborators(data.collaborators || { owner: null, admins: [], staff: [] })
    } catch (e) {
      notify(e?.response?.data?.message || 'Failed to load collaborators', { type: 'error' })
    } finally {
      setLoadingCollaborators(false)
    }
  }, [org?._id, notify])

  useEffect(() => {
    if (!org?._id) return
    loadCollaborators()
  }, [org, loadCollaborators])

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

  const handleDeleteForm = async (formId, e) => {
    if (e) e.stopPropagation()
    if (!formId) return
    if (deletingFormId === formId) {
      try {
        await API.delete(`/forms/${formId}`)
        setForms((prev) => prev.filter((f) => f._id !== formId))
        if (activeFormId === formId) {
          setActiveFormId(null)
          setEditableForm(null)
        }
        notify('Form deleted', { type: 'success' })
      } catch (err) {
        notify(err?.response?.data?.message || 'Failed to delete form', { type: 'error' })
      } finally {
        setDeletingFormId(null)
      }
    } else {
      setDeletingFormId(formId)
      setTimeout(() => setDeletingFormId((prev) => (prev === formId ? null : prev)), 3000)
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

  const handleInvite = async (e) => {
    e.preventDefault()
    if (!inviteEmail.trim()) {
      notify('Enter an email address', { type: 'info' })
      return
    }
    setInviting(true)
    try {
      await API.post(`/organizations/${org._id}/invite`, { email: inviteEmail.trim(), role: inviteRole })
      notify('Invitation sent', { type: 'success' })
      setInviteEmail('')
      setInviteRole('staff')
      // Optionally refresh list after a short delay
      setTimeout(loadCollaborators, 500)
    } catch (e) {
      notify(e?.response?.data?.message || 'Failed to send invitation', { type: 'error' })
    } finally {
      setInviting(false)
    }
  }

  const handleRemoveCollaborator = async (userId) => {
    if (!confirm('Remove this collaborator?')) return
    try {
      await API.delete(`/organizations/${org._id}/collaborators/${userId}`)
      notify('Collaborator removed', { type: 'success' })
      loadCollaborators()
    } catch (e) {
      notify(e?.response?.data?.message || 'Failed to remove collaborator', { type: 'error' })
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

  const renderProfileEditor = () => {
    if (!orgDraft) {
      return <p className="text-sm text-gray-500">Load an organization to edit its public profile.</p>
    }

    const updateListItem = (field, index, patch) => {
      setOrgDraft((prev) => {
        if (!prev) return prev
        const current = Array.isArray(prev[field]) ? [...prev[field]] : []
        const nextItem = { ...(current[index] || {}), ...patch }
        current[index] = nextItem
        return { ...prev, [field]: current }
      })
    }

    const removeListItem = (field, index) => {
      setOrgDraft((prev) => {
        if (!prev) return prev
        const current = Array.isArray(prev[field]) ? prev[field] : []
        const next = current.filter((_, i) => i !== index)
        return { ...prev, [field]: next }
      })
    }

    const SectionCard = ({ id, title, description, children, badge }) => {
      const isOpen = openProfileSections[id] ?? true

      const toggle = () => {
        setOpenProfileSections((prev) => ({
          ...prev,
          [id]: !isOpen,
        }))
      }

      return (
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
          <button
            type="button"
            onClick={toggle}
            className="flex w-full items-center justify-between gap-3 rounded-2xl px-4 py-3 text-left"
          >
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-900">{title}</span>
                {badge != null && <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-medium text-emerald-700">{badge}</span>}
              </div>
              {description && <p className="mt-1 text-xs text-gray-500">{description}</p>}
            </div>
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
              <span>{isOpen ? 'Hide' : 'Show'}</span>
              <span className="text-base">{isOpen ? '▴' : '▾'}</span>
            </span>
          </button>
          {isOpen ? <div className="border-t border-gray-100 px-4 py-4 sm:px-5 sm:py-5">{children}</div> : null}
        </div>
      )
    }

    return (
      <div className="space-y-8">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-1 text-xs sm:text-sm">
            <span className="text-gray-700">Organization name</span>
            <input
              type="text"
              value={orgDraft.name}
              onChange={(e) => handleOrgDraftChange('name', e.target.value)}
              className="rounded-md border border-gray-300 px-3 py-2 text-xs sm:text-sm"
            />
          </label>
          <label className="grid gap-1 text-xs sm:text-sm">
            <span className="text-gray-700">Sector</span>
            <input
              type="text"
              value={orgDraft.sector}
              onChange={(e) => handleOrgDraftChange('sector', e.target.value)}
              className="rounded-md border border-gray-300 px-3 py-2 text-xs sm:text-sm"
            />
          </label>
          <label className="grid gap-1 text-xs sm:text-sm sm:col-span-2">
            <span className="text-gray-700">Tagline</span>
            <input
              type="text"
              value={orgDraft.tagline}
              onChange={(e) => handleOrgDraftChange('tagline', e.target.value)}
              placeholder="e.g. Connecting patients to the right care"
              className="rounded-md border border-gray-300 px-3 py-2 text-xs sm:text-sm"
            />
          </label>
          <label className="grid gap-1 text-xs sm:text-sm">
            <span className="text-gray-700">Phone</span>
            <input
              type="text"
              value={orgDraft.phone}
              onChange={(e) => handleOrgDraftChange('phone', e.target.value)}
              className="rounded-md border border-gray-300 px-3 py-2 text-xs sm:text-sm"
            />
          </label>
          <label className="grid gap-1 text-xs sm:text-sm">
            <span className="text-gray-700">Website</span>
            <input
              type="text"
              value={orgDraft.website}
              onChange={(e) => handleOrgDraftChange('website', e.target.value)}
              placeholder="https://..."
              className="rounded-md border border-gray-300 px-3 py-2 text-xs sm:text-sm"
            />
          </label>
          <div className="grid gap-3 text-xs sm:col-span-2 sm:text-sm">
            <span className="text-gray-700">Logo</span>
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-gray-200 bg-gray-50 text-sm font-semibold text-gray-500">
                {orgDraft.logo ? (
                  <img src={getImageUrl(orgDraft.logo)} alt="Logo" className="h-full w-full rounded-xl object-contain" />
                ) : (
                  orgInitial
                )}
              </div>
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => document.getElementById(logoInputId)?.click()}
                  disabled={uploadingLogo}
                  className="inline-flex items-center rounded-md border border-gray-300 px-3 py-1.5 text-[11px] font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                >
                  {uploadingLogo ? 'Uploading…' : orgDraft.logo ? 'Change logo' : 'Upload logo'}
                </button>
                <p className="text-[11px] text-gray-500">PNG/JPG/WEBP up to 5MB.</p>
                {orgDraft.logo && (
                  <button
                    type="button"
                    onClick={() => handleOrgDraftChange('logo', '')}
                    className="text-[11px] font-medium text-rose-600 hover:text-rose-700"
                  >
                    Remove logo
                  </button>
                )}
              </div>
            </div>
            <input
              id={logoInputId}
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleLogoUpload(file)
              }}
            />
            <input
              type="text"
              value={orgDraft.logo}
              onChange={(e) => handleOrgDraftChange('logo', e.target.value)}
              placeholder="Or paste a logo URL"
              className="rounded-md border border-gray-300 px-3 py-2 text-xs sm:text-sm"
            />
          </div>
        </div>

        <div className="grid gap-4">
          <label className="grid gap-1 text-xs sm:text-sm">
            <span className="text-gray-700">Address</span>
            <textarea
              value={orgDraft.address}
              onChange={(e) => handleOrgDraftChange('address', e.target.value)}
              placeholder="Street, city, state, country"
              rows={2}
              className="rounded-md border border-gray-300 px-3 py-2 text-xs sm:text-sm"
            />
          </label>
          <label className="grid gap-1 text-xs sm:text-sm">
            <span className="text-gray-700">Description</span>
            <textarea
              value={orgDraft.description}
              onChange={(e) => handleOrgDraftChange('description', e.target.value)}
              placeholder="Short description shown on your public organization page"
              rows={4}
              className="rounded-md border border-gray-300 px-3 py-2 text-xs sm:text-sm"
            />
          </label>
        </div>

        <div className="space-y-6">
          <SectionCard
            id="services"
            title="Services offered"
            description="Highlight what you provide to clients."
            badge={`${profileSummary.services || 0}`}
          >
            <div className="mb-3 flex justify-end">
              <button
                type="button"
                onClick={() => setOrgDraft((prev) => {
                  if (!prev) return prev
                  const current = Array.isArray(prev.services) ? prev.services : []
                  return { ...prev, services: [...current, { title: '', description: '' }] }
                })}
                className="rounded-md border border-gray-200 px-2 py-1 text-[11px] text-gray-700 hover:bg-gray-50"
              >
                Add service
              </button>
            </div>
            {Array.isArray(orgDraft.services) && orgDraft.services.length > 0 ? (
              <div className="grid gap-2">
                {orgDraft.services.map((service, index) => (
                  <div key={index} className="flex flex-col gap-2 rounded-md border border-gray-200 bg-white p-3">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={service.title || ''}
                        onChange={(e) => updateListItem('services', index, { title: e.target.value })}
                        placeholder="Service title"
                        className="flex-1 rounded-md border border-gray-300 px-2 py-1 text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => removeListItem('services', index)}
                        className="rounded-md border border-rose-200 px-2 py-1 text-[11px] text-rose-700 hover:bg-rose-50"
                      >
                        Remove
                      </button>
                    </div>
                    <textarea
                      value={service.description || ''}
                      onChange={(e) => updateListItem('services', index, { description: e.target.value })}
                      placeholder="Short description"
                      rows={2}
                      className="rounded-md border border-gray-300 px-2 py-1 text-xs"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[11px] text-gray-500">No services added yet.</p>
            )}
          </SectionCard>

          <SectionCard
            id="teamMembers"
            title="Team members"
            description="Introduce your core team and what they do."
            badge={`${profileSummary.teamMembers || 0}`}
          >
            <div className="mb-3 flex justify-end">
              <button
                type="button"
                onClick={() => setOrgDraft((prev) => {
                  if (!prev) return prev
                  const current = Array.isArray(prev.teamMembers) ? prev.teamMembers : []
                  return { ...prev, teamMembers: [...current, { name: '', role: '', photoUrl: '', bio: '' }] }
                })}
                className="rounded-md border border-gray-200 px-2 py-1 text-[11px] text-gray-700 hover:bg-gray-50"
              >
                Add member
              </button>
            </div>
            {Array.isArray(orgDraft.teamMembers) && orgDraft.teamMembers.length > 0 ? (
              <div className="grid gap-2">
                {orgDraft.teamMembers.map((member, index) => (
                  <div key={index} className="flex flex-col gap-2 rounded-md border border-gray-200 bg-white p-3">
                    <div className="grid gap-2 sm:grid-cols-3">
                      <input
                        type="text"
                        value={member.name || ''}
                        onChange={(e) => updateListItem('teamMembers', index, { name: e.target.value })}
                        placeholder="Name"
                        className="rounded-md border border-gray-300 px-2 py-1 text-xs"
                      />
                      <input
                        type="text"
                        value={member.role || ''}
                        onChange={(e) => updateListItem('teamMembers', index, { role: e.target.value })}
                        placeholder="Role"
                        className="rounded-md border border-gray-300 px-2 py-1 text-xs"
                      />
                      <input
                        type="text"
                        value={member.photoUrl || ''}
                        onChange={(e) => updateListItem('teamMembers', index, { photoUrl: e.target.value })}
                        placeholder="Photo URL"
                        className="rounded-md border border-gray-300 px-2 py-1 text-xs"
                      />
                    </div>
                    <textarea
                      value={member.bio || ''}
                      onChange={(e) => updateListItem('teamMembers', index, { bio: e.target.value })}
                      placeholder="Short bio"
                      rows={2}
                      className="rounded-md border border-gray-300 px-2 py-1 text-xs"
                    />
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => removeListItem('teamMembers', index)}
                        className="rounded-md border border-rose-200 px-2 py-1 text-[11px] text-rose-700 hover:bg-rose-50"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[11px] text-gray-500">No team members added yet.</p>
            )}
          </SectionCard>

          <SectionCard
            id="achievements"
            title="Achievements"
            description="Spotlight recognitions and milestones."
            badge={`${profileSummary.achievements || 0}`}
          >
            <div className="mb-3 flex justify-end">
              <button
                type="button"
                onClick={() => setOrgDraft((prev) => {
                  if (!prev) return prev
                  const current = Array.isArray(prev.achievements) ? prev.achievements : []
                  return { ...prev, achievements: [...current, ''] }
                })}
                className="rounded-md border border-gray-200 px-2 py-1 text-[11px] text-gray-700 hover:bg-gray-50"
              >
                Add achievement
              </button>
            </div>
            {Array.isArray(orgDraft.achievements) && orgDraft.achievements.length > 0 ? (
              <div className="grid gap-2">
                {orgDraft.achievements.map((achievement, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={achievement || ''}
                      onChange={(e) => setOrgDraft((prev) => {
                        if (!prev) return prev
                        const current = Array.isArray(prev.achievements) ? [...prev.achievements] : []
                        current[index] = e.target.value
                        return { ...prev, achievements: current }
                      })}
                      placeholder="e.g. Reached 10,000 users in 2025"
                      className="flex-1 rounded-md border border-gray-300 px-2 py-1 text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => removeListItem('achievements', index)}
                      className="rounded-md border border-rose-200 px-2 py-1 text-[11px] text-rose-700 hover:bg-rose-50"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[11px] text-gray-500">No achievements added yet.</p>
            )}
          </SectionCard>

          <SectionCard
            id="projects"
            title="Projects / portfolio"
            description="Summarize flagship programs or case studies."
            badge={`${profileSummary.projects || 0}`}
          >
            <div className="mb-3 flex justify-end">
              <button
                type="button"
                onClick={() => setOrgDraft((prev) => {
                  if (!prev) return prev
                  const current = Array.isArray(prev.projects) ? prev.projects : []
                  return { ...prev, projects: [...current, ''] }
                })}
                className="rounded-md border border-gray-200 px-2 py-1 text-[11px] text-gray-700 hover:bg-gray-50"
              >
                Add project
              </button>
            </div>
            {Array.isArray(orgDraft.projects) && orgDraft.projects.length > 0 ? (
              <div className="grid gap-2">
                {orgDraft.projects.map((project, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={project || ''}
                      onChange={(e) => setOrgDraft((prev) => {
                        if (!prev) return prev
                        const current = Array.isArray(prev.projects) ? [...prev.projects] : []
                        current[index] = e.target.value
                        return { ...prev, projects: current }
                      })}
                      placeholder="e.g. Flagship project or case study"
                      className="flex-1 rounded-md border border-gray-300 px-2 py-1 text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => removeListItem('projects', index)}
                      className="rounded-md border border-rose-200 px-2 py-1 text-[11px] text-rose-700 hover:bg-rose-50"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[11px] text-gray-500">No projects added yet.</p>
            )}
          </SectionCard>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {loadingOrg && (
          <div className="mb-6 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            Loading your organization workspace…
          </div>
        )}
        <header className="py-8">
          <div className="flex flex-col gap-6 rounded-3xl bg-white/90 p-6 shadow-sm ring-1 ring-gray-100 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-1 items-start gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-600 text-xl font-semibold text-white">
                {orgDraft?.logo ? (
                  <img src={getImageUrl(orgDraft.logo)} alt="Organization logo" className="h-full w-full rounded-2xl object-cover" />
                ) : (
                  orgInitial
                )}
              </div>
              <div className="space-y-2">
                <div>
                  <h1 className="text-2xl font-semibold text-gray-900 sm:text-3xl">{orgDraft?.name || org?.name || 'Organization dashboard'}</h1>
                  {orgDraft?.tagline && <p className="mt-1 text-sm text-gray-600">{orgDraft.tagline}</p>}
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                  {createdAtLabel && <span>Joined {createdAtLabel}</span>}
                  {org?.sector && <span>• {org.sector}</span>}
                  {org?.email && <span>• {org.email}</span>}
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-2 sm:items-end">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyOrgLink}
                  disabled={!publicOrgUrl}
                  className="inline-flex items-center gap-2 rounded-md border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                >
                  Copy public profile link
                </button>
                {publicOrgUrl && (
                  <a
                    href={publicOrgUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700"
                  >
                    View public profile
                  </a>
                )}
              </div>
              <button
                type="button"
                onClick={() => setShowProfileEditor((prev) => !prev)}
                className="inline-flex items-center gap-2 text-xs font-medium text-emerald-700 hover:text-emerald-800"
              >
                {showProfileEditor ? 'Hide profile editor' : 'Edit public profile'}
              </button>
            </div>
          </div>
        </header>

        <section className="grid gap-4 rounded-3xl bg-gradient-to-br from-white via-white to-emerald-50 p-6 shadow-sm ring-1 ring-gray-100 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium uppercase tracking-wide text-emerald-600">Forms</span>
            <p className="text-2xl font-semibold text-gray-900">{formStats.total}</p>
            <p className="text-xs text-gray-500">{formStats.active} active · {formStats.draft} drafts</p>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium uppercase tracking-wide text-emerald-600">Team</span>
            <p className="text-2xl font-semibold text-gray-900">{staffSummary.totalMembers}</p>
            <p className="text-xs text-gray-500">{staffSummary.adminCount} admins · {staffSummary.staffCount} staff</p>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium uppercase tracking-wide text-emerald-600">Profile completeness</span>
            <p className="text-2xl font-semibold text-gray-900">{profileCompletionPercent}%</p>
            <p className="text-xs text-gray-500">{populatedSections} of {profileSectionsList.length} sections filled</p>
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-xs font-medium uppercase tracking-wide text-emerald-600">Quick actions</span>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleCreateForm}
                className="inline-flex items-center rounded-full border border-emerald-200 bg-white px-3 py-1 text-[11px] font-medium text-emerald-700 hover:bg-emerald-50"
              >
                New form
              </button>
              <button
                type="button"
                onClick={() => setShowProfileEditor(true)}
                className="inline-flex items-center rounded-full border border-emerald-200 bg-white px-3 py-1 text-[11px] font-medium text-emerald-700 hover:bg-emerald-50"
              >
                Update profile
              </button>
              <Link
                to="/my-content"
                className="inline-flex items-center rounded-full border border-emerald-600 bg-emerald-50 px-3 py-1 text-[11px] font-medium text-emerald-700 hover:bg-emerald-100"
              >
                My content
              </Link>
            </div>
          </div>
        </section>

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* LEFT COLUMN (2/3) - Forms */}
          <div className="lg:col-span-2 space-y-8">
            <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">Form workspace</h2>
              <p className="mt-1 text-xs text-gray-500">Build forms, share them, and keep track of submissions in one place.</p>

              <div className="mt-4 grid gap-6 lg:grid-cols-[240px,1fr]">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={handleCreateForm}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-emerald-600 px-3 py-2 text-xs font-medium text-white hover:bg-emerald-700"
                    >
                      Create a new form
                    </button>
                    <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                      <p className="text-[11px] font-medium text-gray-700">Quick templates</p>
                      <div className="mt-2 flex flex-col gap-2">
                        <select
                          value={templateKey}
                          onChange={(e) => setTemplateKey(e.target.value)}
                          className="rounded-md border border-gray-300 px-2 py-1 text-xs"
                        >
                          <option value="">Select template…</option>
                          {FORM_TEMPLATES.map((template) => (
                            <option key={template.key} value={template.key}>
                              {template.name}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={handleCreateFormFromTemplate}
                          disabled={!templateKey}
                          className="inline-flex items-center justify-center rounded-md border border-emerald-200 bg-white px-3 py-1 text-[11px] font-medium text-emerald-700 hover:bg-emerald-50 disabled:opacity-60"
                        >
                          Use template
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-700">Your forms</h3>
                    <div className="max-h-96 space-y-2 overflow-y-auto pr-1">
                      {forms.length === 0 && !loadingForms && (
                        <p className="text-[11px] text-gray-500">Create your first form to start collecting responses.</p>
                      )}
                      {loadingForms && <p className="text-[11px] text-gray-500">Loading forms…</p>}
                      {forms.map((form) => (
                        <div
                          key={form._id}
                          className={`group flex w-full flex-col items-start rounded-xl border px-3 py-2 text-left text-xs transition relative ${activeFormId === form._id
                            ? 'border-emerald-500 bg-emerald-50 text-emerald-800'
                            : 'border-gray-200 bg-white text-gray-700 hover:border-emerald-200 hover:text-emerald-700'
                            }`}
                        >
                          <button
                            type="button"
                            onClick={() => setActiveFormId(form._id)}
                            className="w-full text-left"
                          >
                            <span className="font-medium block pr-6">{form.name}</span>
                            <span className="mt-0.5 text-[11px] text-gray-500 block">{form.status || 'draft'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={(e) => handleDeleteForm(form._id, e)}
                            className={`absolute top-2 right-2 p-1 rounded hover:bg-rose-100 text-rose-500 ${deletingFormId === form._id ? 'bg-rose-100 text-rose-700 ring-1 ring-rose-300' : 'opacity-0 group-hover:opacity-100'}`}
                            title="Delete form"
                          >
                            {deletingFormId === form._id ? (
                              <span className="text-[10px] font-bold px-1">CONFIRM?</span>
                            ) : (
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                            )}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  {!editableForm && !loadingForms && (
                    <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-8 text-sm text-gray-600 flex flex-col items-center justify-center text-center h-64">
                      <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center mb-3 text-2xl">📝</div>
                      <p>Select a form to edit or create a new one.</p>
                    </div>
                  )}

                  {editableForm && (
                    <div className="space-y-6">
                      <div className="rounded-2xl border border-gray-100 p-4">
                        <div className="grid gap-3 sm:grid-cols-[minmax(0,2fr),minmax(0,1fr)]">
                          <div className="space-y-3">
                            <input
                              type="text"
                              value={editableForm.name || ''}
                              onChange={(e) => setEditableForm((prev) => ({ ...prev, name: e.target.value }))}
                              placeholder="Form name"
                              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm font-medium"
                            />
                            <textarea
                              value={editableForm.description || ''}
                              onChange={(e) => setEditableForm((prev) => ({ ...prev, description: e.target.value }))}
                              placeholder="Short description (optional)"
                              rows={2}
                              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                            />
                            <div className="flex flex-wrap items-center gap-4 text-xs text-gray-700">
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
                          <div className="flex flex-col items-stretch justify-between gap-2">
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
                              className="inline-flex items-center justify-center rounded-md border border-gray-200 bg-white px-3 py-2 text-[11px] text-gray-700 hover:bg-gray-50"
                            >
                              Copy public link
                            </button>
                            <a
                              href={typeof window !== 'undefined' ? `${window.location.origin}/forms/${editableForm._id}` : `#/forms/${editableForm._id}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center justify-center rounded-md border border-gray-200 bg-white px-3 py-2 text-[11px] text-gray-700 hover:bg-gray-50"
                            >
                              Open form
                            </a>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
                        <button
                          type="button"
                          onClick={() => setViewMode('builder')}
                          className={`rounded-full px-4 py-1.5 text-xs font-medium transition ${viewMode === 'builder'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-white text-gray-600 hover:bg-gray-50'
                            }`}
                        >
                          Builder
                        </button>
                        <button
                          type="button"
                          onClick={() => setViewMode('submissions')}
                          className={`rounded-full px-4 py-1.5 text-xs font-medium transition ${viewMode === 'submissions'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-white text-gray-600 hover:bg-gray-50'
                            }`}
                        >
                          Submissions
                        </button>
                      </div>

                      {viewMode === 'builder' && (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <h3 className="text-sm font-semibold text-gray-900">Form Fields</h3>
                            <button
                              type="button"
                              onClick={handleAddField}
                              className="rounded-full border border-emerald-200 px-3 py-1 text-[11px] font-medium text-emerald-700 hover:bg-emerald-50"
                            >
                              + Add field
                            </button>
                          </div>
                          <div className="space-y-3">
                            {Array.isArray(editableForm.fields) && editableForm.fields.length > 0 ? (
                              editableForm.fields.map((field, index) => renderFieldRow(field, index))
                            ) : (
                              <div className="text-center py-8 border-2 border-dashed border-gray-100 rounded-xl">
                                <p className="text-xs text-gray-500 mb-2">No fields yet.</p>
                                <button onClick={handleAddField} className="text-xs text-emerald-600 font-medium hover:underline">Add your first field</button>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {viewMode === 'submissions' && (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <h3 className="text-sm font-semibold text-gray-900">Recent submissions</h3>
                            <button
                              type="button"
                              onClick={handleExportCsv}
                              className="rounded-full border border-gray-200 px-3 py-1 text-[11px] text-gray-700 hover:bg-gray-50"
                            >
                              Export CSV
                            </button>
                          </div>
                          {renderSubmissions()}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN (1/3) - Sidebar */}
          <div className="space-y-8">
            {/* Public Profile Preview */}
            <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">Public profile preview</h2>
              <p className="mt-1 text-xs text-gray-500">A quick snapshot of what visitors see.</p>
              <div className="mt-4 space-y-4">
                <div className="rounded-2xl border border-gray-100 p-4">
                  <h3 className="text-sm font-semibold text-gray-900">Overview</h3>
                  {truncatedDescription ? (
                    <p className="mt-2 text-sm text-gray-600">{truncatedDescription}</p>
                  ) : (
                    <p className="mt-2 text-sm text-gray-400">Add a description so clients know what you do.</p>
                  )}
                  <dl className="mt-4 space-y-2 text-xs text-gray-600">
                    {profileSectionsList.map((section) => (
                      <div key={section.key} className="flex items-center justify-between rounded-lg border border-dashed border-gray-200 px-3 py-2">
                        <dt>{section.label}</dt>
                        <dd className="font-medium text-gray-900">{section.count}</dd>
                      </div>
                    ))}
                  </dl>
                  {!hasProfileDetails && (
                    <p className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                      Share highlights like services or projects.
                    </p>
                  )}
                </div>
                <div className="rounded-2xl border border-gray-100 p-4">
                  <h3 className="text-sm font-semibold text-gray-900">Contact & visibility</h3>
                  <div className="mt-2 space-y-2">
                    {hasContactInfo ? (
                      contactEntries.map((entry) => (
                        <a
                          key={entry.label}
                          href={entry.href || undefined}
                          target={entry.external ? '_blank' : undefined}
                          rel={entry.external ? 'noreferrer' : undefined}
                          className={`flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2 text-xs text-gray-700 hover:border-emerald-200 hover:text-emerald-700 ${entry.href ? 'cursor-pointer' : 'cursor-default'}`}
                        >
                          <span>{entry.label}</span>
                          <span className="truncate text-right text-[11px] text-gray-500">{entry.value}</span>
                        </a>
                      ))
                    ) : (
                      <p className="text-sm text-gray-400">Add contact details.</p>
                    )}
                  </div>
                </div>
              </div>
              <div className="mt-4">
                <button
                  type="button"
                  onClick={() => setShowProfileEditor((prev) => !prev)}
                  className="w-full inline-flex justify-center items-center rounded-md border border-gray-200 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
                >
                  {showProfileEditor ? 'Close editor' : 'Edit public profile'}
                </button>
              </div>
              {showProfileEditor && (
                <div className="mt-6 border-t border-gray-100 pt-6">
                  {renderProfileEditor()}
                  <div className="mt-6 flex justify-end">
                    <button
                      type="button"
                      onClick={handleSaveOrgProfile}
                      disabled={savingOrgProfile}
                      className="inline-flex items-center justify-center rounded-md bg-emerald-600 px-4 py-2 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
                    >
                      {savingOrgProfile ? 'Saving…' : 'Save profile'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Collaborators Section */}
            <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Collaborators</h2>
              {loadingCollaborators ? (
                <p className="text-sm text-gray-500">Loading collaborators…</p>
              ) : (
                <div className="space-y-4">
                  {/* Invite Form */}
                  <form onSubmit={handleInvite} className="flex flex-col gap-2">
                    <input
                      type="email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="Email address"
                      className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      required
                    />
                    <div className="flex gap-2">
                      <select
                        value={inviteRole}
                        onChange={(e) => setInviteRole(e.target.value)}
                        className="flex-1 rounded-md border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      >
                        <option value="staff">Staff</option>
                        <option value="admin">Admin</option>
                      </select>
                      <button
                        type="submit"
                        disabled={inviting}
                        className="inline-flex items-center justify-center rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
                      >
                        {inviting ? '...' : 'Invite'}
                      </button>
                    </div>
                  </form>

                  <div className="max-h-60 overflow-y-auto pr-1 space-y-4">
                    {/* Owner */}
                    {collaborators.owner && (
                      <div>
                        <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Owner</h3>
                        <div className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 px-3 py-2">
                          <div className="text-sm">
                            <p className="font-medium text-gray-900">{collaborators.owner.name || '—'}</p>
                            <p className="text-xs text-gray-500">{collaborators.owner.email}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Admins */}
                    {collaborators.admins.length > 0 && (
                      <div>
                        <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Admins</h3>
                        <div className="space-y-2">
                          {collaborators.admins.map((u) => (
                            <div key={u._id} className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-3 py-2">
                              <div className="text-sm">
                                <p className="font-medium text-gray-900">{u.name || '—'}</p>
                                <p className="text-xs text-gray-500">{u.email}</p>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRemoveCollaborator(u._id)}
                                className="text-xs text-rose-600 hover:text-rose-700"
                              >
                                Remove
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Staff */}
                    {collaborators.staff.length > 0 && (
                      <div>
                        <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Staff</h3>
                        <div className="space-y-2">
                          {collaborators.staff.map((u) => (
                            <div key={u._id} className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-3 py-2">
                              <div className="text-sm">
                                <p className="font-medium text-gray-900">{u.name || '—'}</p>
                                <p className="text-xs text-gray-500">{u.email}</p>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRemoveCollaborator(u._id)}
                                className="text-xs text-rose-600 hover:text-rose-700"
                              >
                                Remove
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* BOTTOM SECTION - Info Grid */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
            <h3 className="text-sm font-semibold text-gray-900">Platform highlights</h3>
            <div className="mt-4 space-y-3">
              {CAPABILITY_HIGHLIGHTS.map((highlight) => (
                <div key={highlight.title} className="flex gap-3 rounded-2xl border border-gray-100 p-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-lg">{highlight.icon}</div>
                  <div className="flex-1 text-xs text-gray-600">
                    <p className="font-semibold text-gray-900">{highlight.title}</p>
                    <p className="mt-1 leading-5">{highlight.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
            <h3 className="text-sm font-semibold text-gray-900">What you can do here</h3>
            <ul className="mt-4 space-y-2 text-xs text-gray-600">
              {DASHBOARD_TASKS.map((task) => (
                <li key={task} className="flex items-start gap-2">
                  <span className="mt-0.5 text-emerald-600">•</span>
                  <span>{task}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
            <h3 className="text-sm font-semibold text-gray-900">Staff permissions</h3>
            <ul className="mt-4 space-y-2 text-xs text-gray-600">
              {STAFF_PERMISSIONS.map((permission) => (
                <li key={permission} className="flex items-start gap-2">
                  <span className="mt-0.5 text-emerald-600">✔</span>
                  <span>{permission}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )

}
