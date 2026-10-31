import { useCallback, useState } from 'react'
import { Pencil, Plus } from 'lucide-react'
import { usePageTitle } from '../../hooks/usePageTitle'
import { adminApi } from '../api'
import { canEditContent, isSuperAdmin, useAdminAuth } from '../auth'
import { useAdminList } from '../useAdminList'
import FormModal from '../components/FormModal'
import ResourceTable from '../components/ResourceTable'
import Toast from '../components/Toast'
import { Button, Field, IconAction, PageTitle, Switch, inputClass } from '../components/ui'

const TYPES = [
  { value: 'info', label: 'General notice' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'emergency', label: 'Emergency' },
]

const toLocal = (value) => (value ? value.slice(0, 16).replace(' ', 'T') : '')
const showTime = (value) => (value ? value.slice(0, 16) : 'None')

function NoticeState({ notice }) {
  const [label, style] = notice.is_live
    ? ['Live now', 'bg-emerald-50 text-emerald-700']
    : notice.is_published
      ? ['Scheduled or ended', 'bg-sun-50 text-sun-800']
      : ['Not published', 'bg-stone-100 text-stone-700']
  return <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ${style}`}>{label}</span>
}

function NoticeFormModal({ notice, canUseFullPage, readOnly, onClose, onSaved }) {
  return (
    <FormModal
      title={notice ? 'Edit notice' : 'Add notice'}
      description="Notices appear as a banner on every public page while they are live."
      initialValues={{
        title: notice?.title ?? '',
        message: notice?.message ?? '',
        type: notice?.type ?? 'info',
        starts_at: toLocal(notice?.starts_at),
        ends_at: toLocal(notice?.ends_at),
        is_published: Boolean(notice?.is_published),
        full_page: Boolean(notice?.full_page),
      }}
      readOnly={readOnly}
      submitLabel={notice ? 'Save changes' : 'Add notice'}
      onClose={onClose}
      onSaved={() => onSaved(notice ? 'Notice updated.' : 'Notice added.')}
      onSubmit={(values) => {
        const payload = { ...values, full_page: values.type === 'maintenance' && values.full_page }
        return notice ? adminApi.update('notices', notice.id, payload) : adminApi.create('notices', payload)
      }}
    >
      {(values, set, errors) => (
        <>
          <Field id="notice-type" label="Type" required error={errors.type}>
            <select id="notice-type" data-autofocus value={values.type} onChange={(e) => set({ type: e.target.value })} className={inputClass}>
              {TYPES.map((type) => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </Field>
          <Field id="notice-title" label="Title" required error={errors.title}>
            <input id="notice-title" value={values.title} maxLength={150} aria-invalid={Boolean(errors.title)} onChange={(e) => set({ title: e.target.value })} className={inputClass} />
          </Field>
          <Field id="notice-message" label="Message" required error={errors.message}>
            <textarea id="notice-message" rows={3} maxLength={1000} value={values.message} aria-invalid={Boolean(errors.message)} onChange={(e) => set({ message: e.target.value })} className={inputClass} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="notice-starts" label="Starts" error={errors.starts_at} hint="Blank starts as soon as it is published.">
              <input id="notice-starts" type="datetime-local" value={values.starts_at} aria-invalid={Boolean(errors.starts_at)} onChange={(e) => set({ starts_at: e.target.value })} className={inputClass} />
            </Field>
            <Field id="notice-ends" label="Ends" error={errors.ends_at} hint="Blank stays up until unpublished.">
              <input id="notice-ends" type="datetime-local" value={values.ends_at} aria-invalid={Boolean(errors.ends_at)} onChange={(e) => set({ ends_at: e.target.value })} className={inputClass} />
            </Field>
          </div>

          {values.type === 'maintenance' && canUseFullPage && (
            <label className="flex items-start gap-2.5 rounded-lg bg-stone-50 p-4 text-sm">
              <input type="checkbox" checked={values.full_page} onChange={(e) => set({ full_page: e.target.checked })} className="mt-0.5 h-4 w-4 accent-bay-700" />
              <span>
                <span className="block font-semibold text-stone-800">Replace the public site with this notice</span>
                <span className="block text-xs text-stone-500">Residents can't open guides until it ends, so use this only when the site can't work. It needs an end time.</span>
              </span>
            </label>
          )}
          {errors.full_page && <p className="text-xs font-medium text-red-600">{errors.full_page}</p>}

          <Switch
            id="notice-published"
            label="Published"
            description="Unpublished notices stay here and are not shown."
            checked={values.is_published}
            onChange={(is_published) => set({ is_published })}
          />
        </>
      )}
    </FormModal>
  )
}

export default function AdminNoticesPage() {
  usePageTitle('Notices · Admin')
  const { admin } = useAdminAuth()
  const canEdit = canEditContent(admin)
  const { data, error, loading, reload } = useAdminList('notices')
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState(null)
  const [toast, setToast] = useState('')
  const dismissToast = useCallback(() => setToast(''), [])

  const needle = search.trim().toLowerCase()
  const rows = data?.filter((notice) => !needle || notice.title.toLowerCase().includes(needle))

  const columns = [
    {
      key: 'title',
      label: 'Notice',
      render: (notice) => (
        <>
          <span className="block font-semibold text-bay-900">{notice.title}</span>
          <span className="block text-xs text-stone-500">
            {TYPES.find((type) => type.value === notice.type)?.label}{notice.full_page ? ', replaces the site' : ''}
          </span>
        </>
      ),
    },
    { key: 'schedule', label: 'Schedule', hideBelow: 'lg', className: 'whitespace-nowrap', render: (notice) => <span className="text-stone-600">{showTime(notice.starts_at)} to {showTime(notice.ends_at)}</span> },
    { key: 'status', label: 'Status', render: (notice) => <NoticeState notice={notice} /> },
    {
      key: 'actions',
      label: <span className="sr-only">Actions</span>,
      className: 'md:w-px',
      render: (notice) => (
        <div className="flex md:justify-end">
          <IconAction label={`${canEdit ? 'Edit' : 'View'} ${notice.title}`} onClick={() => setEditing(notice)}>
            <Pencil size={16} />
          </IconAction>
        </div>
      ),
    },
  ]

  return (
    <div className="mx-auto max-w-6xl">
      <PageTitle
        title="Notices"
        description="Maintenance and emergency announcements for residents."
        action={
          canEdit && (
            <Button onClick={() => setEditing('new')}>
              <Plus size={17} aria-hidden="true" /> Add notice
            </Button>
          )
        }
      />
      <ResourceTable search={search} onSearch={setSearch} searchPlaceholder="Search notices" loading={loading} error={error} rows={rows} columns={columns} emptyText="No notices yet." />

      {editing && (
        <NoticeFormModal
          notice={editing === 'new' ? null : editing}
          canUseFullPage={isSuperAdmin(admin)}
          readOnly={!canEdit}
          onClose={() => setEditing(null)}
          onSaved={(message) => {
            setEditing(null)
            setToast(message)
            reload()
          }}
        />
      )}
      <Toast message={toast} onDismiss={dismissToast} />
    </div>
  )
}
