import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AlertTriangle, Archive, ExternalLink, EyeOff, Pencil, Plus, RotateCcw, Send } from 'lucide-react'
import { usePageTitle } from '../../hooks/usePageTitle'
import { formatDate } from '../../utils/format'
import { adminApi } from '../api'
import { canEditContent, useAdminAuth } from '../auth'
import { useAdminQuery } from '../useAdminList'
import ConfirmDialog from '../components/ConfirmDialog'
import FormModal from '../components/FormModal'
import { DataTable, TableToolbar } from '../components/ResourceTable'
import Toast from '../components/Toast'
import { Button, Field, IconAction, PageTitle, StatusBadge, inputClass } from '../components/ui'

const STATUS_TABS = [
  { value: '', label: 'All' },
  { value: 'draft', label: 'Drafts' },
  { value: 'published', label: 'Published' },
  { value: 'archived', label: 'Archived' },
]

const STATUS_ACTIONS = {
  published: {
    title: 'Publish this guide?',
    message: (s) => `"${s.title}" will be visible to residents on the public site.`,
    confirmLabel: 'Publish',
    tone: 'primary',
    toast: 'Guide published.',
  },
  draft: {
    title: 'Unpublish this guide?',
    message: (s) => `Residents will no longer see "${s.title}" until it is published again.`,
    confirmLabel: 'Unpublish',
    tone: 'danger',
    toast: 'Guide moved to drafts.',
  },
  archived: {
    title: 'Archive this guide?',
    message: (s) => `"${s.title}" will be hidden from the public site. You can restore it to drafts later.`,
    confirmLabel: 'Archive guide',
    tone: 'danger',
    toast: 'Guide archived.',
  },
  restore: {
    title: 'Restore to drafts?',
    message: (s) => `"${s.title}" will move back to drafts so it can be edited and published again.`,
    confirmLabel: 'Restore',
    tone: 'primary',
    toast: 'Guide restored to drafts.',
  },
}

function NewGuideModal({ lookups, onClose }) {
  const navigate = useNavigate()

  return (
    <FormModal
      title="New service guide"
      description="Start with the basics. You'll add requirements, steps, and sources on the next screen."
      initialValues={{ title: '', agency_id: '', category_id: '', summary: '' }}
      submitLabel="Create draft"
      onClose={onClose}
      onSubmit={async (values) => {
        const created = await adminApi.createService({
          ...values,
          agency_id: values.agency_id ? Number(values.agency_id) : null,
          category_id: values.category_id ? Number(values.category_id) : null,
        })
        navigate(`/admin/services/${created.id}`, {
          state: { flash: 'Draft created. Add the requirements, steps, and official sources, then publish.' },
        })
      }}
      onSaved={() => {}}
    >
      {(values, set, errors) => (
        <>
          <Field id="new-title" label="Guide title" required error={errors.title} hint='Start with an action, e.g. "Request a PSA Birth Certificate".'>
            <input id="new-title" data-autofocus value={values.title} maxLength={200} aria-invalid={Boolean(errors.title)} onChange={(e) => set({ title: e.target.value })} className={inputClass} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="new-agency" label="Responsible agency" required error={errors.agency_id}>
              <select id="new-agency" value={values.agency_id} aria-invalid={Boolean(errors.agency_id)} onChange={(e) => set({ agency_id: e.target.value })} className={inputClass}>
                <option value="">Choose an agency</option>
                {lookups.agencies.map((agency) => (
                  <option key={agency.id} value={agency.id}>
                    {agency.acronym ? `${agency.acronym} — ${agency.name}` : agency.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field id="new-category" label="Category" required error={errors.category_id}>
              <select id="new-category" value={values.category_id} aria-invalid={Boolean(errors.category_id)} onChange={(e) => set({ category_id: e.target.value })} className={inputClass}>
                <option value="">Choose a category</option>
                {lookups.categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <Field id="new-summary" label="Summary" error={errors.summary} hint="One or two sentences shown in search results.">
            <textarea id="new-summary" rows={3} maxLength={500} value={values.summary} onChange={(e) => set({ summary: e.target.value })} className={inputClass} />
          </Field>
        </>
      )}
    </FormModal>
  )
}

export default function AdminServicesPage() {
  usePageTitle('Service guides · Admin')
  const { admin } = useAdminAuth()
  const canEdit = canEditContent(admin)
  const [searchInput, setSearchInput] = useState('')
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('')
  const [needsReview, setNeedsReview] = useState(false)
  const [creating, setCreating] = useState(false)
  const [pending, setPending] = useState(null)
  const [pendingError, setPendingError] = useState('')
  const [working, setWorking] = useState(false)
  const [toast, setToast] = useState('')
  const dismissToast = useCallback(() => setToast(''), [])

  useEffect(() => {
    const id = setTimeout(() => setQ(searchInput.trim()), 300)
    return () => clearTimeout(id)
  }, [searchInput])

  const { data: services, error, loading, reload } = useAdminQuery(
    () => adminApi.listServices({ q, status, needsReview }),
    [q, status, needsReview]
  )
  const { data: lookups } = useAdminQuery(adminApi.lookups, [])

  function askStatus(service, action) {
    setPendingError('')
    setPending({ service, action })
  }

  async function confirmStatus() {
    const { service, action } = pending
    setWorking(true)
    try {
      await adminApi.setServiceStatus(service.id, action === 'restore' ? 'draft' : action)
      setToast(STATUS_ACTIONS[action].toast)
      setPending(null)
      reload()
    } catch (err) {
      setPendingError(err.message)
    } finally {
      setWorking(false)
    }
  }

  const columns = [
    {
      key: 'guide',
      label: 'Guide',
      render: (s) => (
        <>
          <Link to={`/admin/services/${s.id}`} className="font-semibold text-bay-900 hover:text-bay-700 hover:underline">
            {s.title}
          </Link>
          <p className="mt-0.5 text-xs text-stone-500">
            {s.agency_acronym || s.agency_name} · {s.category_name}
          </p>
        </>
      ),
    },
    { key: 'status', label: 'Status', className: 'md:w-32', render: (s) => <StatusBadge status={s.status} /> },
    {
      key: 'verified',
      label: 'Last verified',
      className: 'md:w-44 whitespace-nowrap',
      render: (s) => (
        <span className="inline-flex items-center gap-1.5 text-stone-700">
          {s.last_verified_at ? formatDate(s.last_verified_at) : <span className="text-stone-400">Not set</span>}
          {Boolean(s.needs_review) && s.status !== 'archived' && (
            <span title="Not verified in the last 6 months" className="inline-flex items-center gap-1 rounded-full bg-sun-50 px-2 py-0.5 text-xs font-semibold text-sun-800">
              <AlertTriangle size={11} aria-hidden="true" /> Review
            </span>
          )}
        </span>
      ),
    },
    {
      key: 'updated',
      label: 'Updated',
      hideBelow: 'xl',
      className: 'whitespace-nowrap',
      render: (s) => (
        <span className="text-stone-600">
          {formatDate(s.updated_at?.slice(0, 10))}
          {s.updated_by_name && <span className="block text-xs text-stone-400">by {s.updated_by_name}</span>}
        </span>
      ),
    },
    {
      key: 'actions',
      label: <span className="sr-only">Actions</span>,
      className: 'md:w-px',
      render: (s) => (
        <div className="flex items-center gap-0.5 md:justify-end">
          <IconAction label={canEdit ? `Edit ${s.title}` : `View ${s.title}`} to={`/admin/services/${s.id}`}>
            <Pencil size={16} />
          </IconAction>
          {s.status === 'published' && (
            <IconAction label="View live page" href={`/services/${s.slug}`}>
              <ExternalLink size={16} />
            </IconAction>
          )}
          {canEdit && s.status === 'draft' && (
            <IconAction label="Publish" tone="success" onClick={() => askStatus(s, 'published')}>
              <Send size={16} />
            </IconAction>
          )}
          {canEdit && s.status === 'published' && (
            <IconAction label="Unpublish" onClick={() => askStatus(s, 'draft')}>
              <EyeOff size={16} />
            </IconAction>
          )}
          {canEdit && s.status !== 'archived' && (
            <IconAction label="Archive" tone="danger" onClick={() => askStatus(s, 'archived')}>
              <Archive size={16} />
            </IconAction>
          )}
          {canEdit && s.status === 'archived' && (
            <IconAction label="Restore to drafts" onClick={() => askStatus(s, 'restore')}>
              <RotateCcw size={16} />
            </IconAction>
          )}
        </div>
      ),
    },
  ]

  const action = pending ? STATUS_ACTIONS[pending.action] : null

  return (
    <div className="mx-auto max-w-6xl">
      <PageTitle
        title="Service guides"
        description="Create, update, publish, and archive the guides residents see."
        action={
          canEdit && (
            <Button onClick={() => setCreating(true)} disabled={!lookups}>
              <Plus size={17} aria-hidden="true" /> New guide
            </Button>
          )
        }
      />

      <TableToolbar search={searchInput} onSearch={setSearchInput} searchPlaceholder="Search by title or agency">
        <div role="group" aria-label="Filter by status" className="flex flex-wrap gap-1 rounded-lg bg-stone-100 p-1">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              aria-pressed={status === tab.value}
              onClick={() => setStatus(tab.value)}
              className={`rounded-md px-3 py-1.5 text-sm font-semibold transition-colors ${
                status === tab.value ? 'bg-white text-bay-800 shadow-sm' : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 whitespace-nowrap px-1 text-sm font-medium text-stone-700">
          <input type="checkbox" checked={needsReview} onChange={(e) => setNeedsReview(e.target.checked)} className="h-4 w-4 accent-bay-700" />
          Needs re-verification
        </label>
      </TableToolbar>

      <DataTable loading={loading} error={error} rows={services} columns={columns} emptyText="No guides match these filters." />

      {creating && lookups && <NewGuideModal lookups={lookups} onClose={() => setCreating(false)} />}

      <ConfirmDialog
        open={pending !== null}
        title={action?.title}
        message={pending ? action.message(pending.service) : ''}
        confirmLabel={action?.confirmLabel}
        tone={action?.tone}
        busy={working}
        error={pendingError}
        onConfirm={confirmStatus}
        onCancel={() => setPending(null)}
      />
      <Toast message={toast} onDismiss={dismissToast} />
    </div>
  )
}
