import { useCallback, useState } from 'react'
import { ExternalLink, Pencil, Plus } from 'lucide-react'
import { usePageTitle } from '../../hooks/usePageTitle'
import { formatDate } from '../../utils/format'
import { adminApi } from '../api'
import { canEditContent, isSuperAdmin, useAdminAuth } from '../auth'
import { useAdminList, useAdminQuery } from '../useAdminList'
import FormModal from '../components/FormModal'
import ListEditor from '../components/ListEditor'
import ResourceTable from '../components/ResourceTable'
import Toast from '../components/Toast'
import { withKey } from '../components/listKeys'
import { Field, IconAction, PageTitle, Switch, Button, inputClass } from '../components/ui'

const EMPTY = { title: '', slug: '', summary: '', description: '', status: 'draft', display_order: '0', steps: [] }

function toForm(event) {
  if (!event) return EMPTY
  return {
    title: event.title,
    slug: event.slug,
    summary: event.summary ?? '',
    description: event.description ?? '',
    status: event.status,
    display_order: String(event.display_order ?? 0),
    steps: event.steps.map((step) =>
      withKey({ service_id: step.service_id, title: step.title, note: step.note ?? '', source_url: step.source_url ?? '', is_optional: step.is_optional }),
    ),
  }
}

function toPayload(values) {
  return {
    ...values,
    display_order: Number(values.display_order) || 0,
    steps: values.steps.map(({ service_id, title, note, source_url, is_optional }) => ({ service_id, title, note, source_url, is_optional })),
  }
}

function LifeEventModal({ event, services, readOnly, canPublish, onClose, onSaved }) {
  return (
    <FormModal
      title={event ? `Edit ${event.title}` : 'Add life event'}
      description="An ordered list of steps for one situation. Link each step to its guide where there is one."
      initialValues={toForm(event)}
      readOnly={readOnly}
      submitLabel={event ? 'Save changes' : 'Add life event'}
      onClose={onClose}
      onSaved={() => onSaved(event ? 'Life event updated.' : 'Life event added.')}
      onSubmit={(values) => (event ? adminApi.update('life-events', event.id, toPayload(values)) : adminApi.create('life-events', toPayload(values)))}
    >
      {(values, set, errors) => (
        <>
          <Field id="event-title" label="Title" required error={errors.title} hint='Name the situation, e.g. "Starting a business in General Santos City".'>
            <input id="event-title" data-autofocus value={values.title} maxLength={150} aria-invalid={Boolean(errors.title)} onChange={(e) => set({ title: e.target.value })} className={inputClass} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-[1fr_8rem]">
            <Field id="event-slug" label="Web address" error={errors.slug} hint="Leave empty to make one from the title.">
              <div className="flex items-center rounded-lg border border-stone-300 bg-stone-50 focus-within:border-bay-500 focus-within:ring-2 focus-within:ring-bay-500/20">
                <span className="shrink-0 whitespace-nowrap pl-3 text-sm text-stone-500">/life-events/</span>
                <input id="event-slug" value={values.slug} maxLength={170} aria-invalid={Boolean(errors.slug)} onChange={(e) => set({ slug: e.target.value.toLowerCase() })} className="w-full rounded-r-lg bg-white px-2 py-2 text-sm focus:outline-none" />
              </div>
            </Field>
            <Field id="event-order" label="Order" error={errors.display_order} hint="Lower comes first.">
              <input id="event-order" type="number" min={0} max={999} value={values.display_order} onChange={(e) => set({ display_order: e.target.value })} className={inputClass} />
            </Field>
          </div>
          <Field id="event-summary" label="Summary" error={errors.summary} hint={`Shown on the home page. ${values.summary.length}/300`}>
            <textarea id="event-summary" rows={2} maxLength={300} value={values.summary} onChange={(e) => set({ summary: e.target.value })} className={inputClass} />
          </Field>
          <Field id="event-description" label="Note at the top of the page" error={errors.description}>
            <textarea id="event-description" rows={2} maxLength={5000} value={values.description} onChange={(e) => set({ description: e.target.value })} className={inputClass} />
          </Field>

          <div>
            <p className="text-sm font-semibold text-stone-800">Steps, in order</p>
            {errors.steps && <p className="mt-1 text-xs font-medium text-red-600">{errors.steps}</p>}
            <div className="mt-2">
              <ListEditor
                items={values.steps}
                onChange={(steps) => set({ steps })}
                newItem={() => ({ service_id: null, title: '', note: '', source_url: '', is_optional: false })}
                addLabel="Add step"
                itemName="step"
                max={30}
                emptyText="No steps yet."
                renderItem={(item, index, patch) => (
                  <div className="space-y-2">
                    <label htmlFor={`step-guide-${item._key}`} className="block text-xs font-semibold text-stone-600">Guide for this step</label>
                    <select
                      id={`step-guide-${item._key}`}
                      value={item.service_id ?? ''}
                      onChange={(e) => {
                        const id = e.target.value ? Number(e.target.value) : null
                        const guide = services.find((service) => service.id === id)
                        patch({ service_id: id, title: item.title || guide?.title || '' })
                      }}
                      className={inputClass}
                    >
                      <option value="">No guide yet (the step shows its own title and note)</option>
                      {services.map((service) => (
                        <option key={service.id} value={service.id}>
                          {service.title}{service.status !== 'published' ? ' (not published: shown without a link)' : ''}
                        </option>
                      ))}
                    </select>
                    <label htmlFor={`step-title-${item._key}`} className="sr-only">Step {index + 1} title</label>
                    <input id={`step-title-${item._key}`} value={item.title} maxLength={200} placeholder="Step title, e.g. Get a barangay clearance" aria-invalid={Boolean(errors[`steps.${index}.title`])} onChange={(e) => patch({ title: e.target.value })} className={inputClass} />
                    {errors[`steps.${index}.title`] && <p className="text-xs font-medium text-red-600">{errors[`steps.${index}.title`]}</p>}
                    <label htmlFor={`step-note-${item._key}`} className="sr-only">Step {index + 1} note</label>
                    <textarea id={`step-note-${item._key}`} rows={2} maxLength={500} value={item.note} placeholder="Why this step comes here, from an official source" onChange={(e) => patch({ note: e.target.value })} className={inputClass} />
                    <label htmlFor={`step-source-${item._key}`} className="sr-only">Step {index + 1} source link</label>
                    <input id={`step-source-${item._key}`} type="url" value={item.source_url} maxLength={255} placeholder="Official source link (shown when there is no guide)" aria-invalid={Boolean(errors[`steps.${index}.source_url`])} onChange={(e) => patch({ source_url: e.target.value })} className={inputClass} />
                    {errors[`steps.${index}.source_url`] && <p className="text-xs font-medium text-red-600">{errors[`steps.${index}.source_url`]}</p>}
                    <label className="flex items-center gap-2 text-sm text-stone-700">
                      <input type="checkbox" checked={item.is_optional} onChange={(e) => patch({ is_optional: e.target.checked })} className="h-4 w-4 accent-bay-700" />
                      Only for some people (shown as "If applicable")
                    </label>
                  </div>
                )}
              />
            </div>
          </div>

          <Switch
            id="event-published"
            label="Show on the public site"
            description={canPublish ? 'Published life events appear on the home page.' : 'Only a super admin can publish or change a published life event.'}
            checked={values.status === 'published'}
            onChange={(on) => canPublish && set({ status: on ? 'published' : 'draft' })}
            error={errors.status}
          />
        </>
      )}
    </FormModal>
  )
}

export default function AdminLifeEventsPage() {
  usePageTitle('Life events · Admin')
  const { admin } = useAdminAuth()
  const canEdit = canEditContent(admin)
  const isSuper = isSuperAdmin(admin)
  const events = useAdminList('life-events')
  const lookups = useAdminQuery(() => adminApi.lookups(), [])
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState(null)
  const [toast, setToast] = useState('')
  const dismissToast = useCallback(() => setToast(''), [])

  const needle = search.trim().toLowerCase()
  const rows = events.data?.filter((event) => !needle || `${event.title} ${event.summary ?? ''}`.toLowerCase().includes(needle))

  const columns = [
    {
      key: 'title',
      label: 'Life event',
      render: (event) => (
        <>
          <span className="font-semibold text-bay-900">{event.title}</span>
          <span className="block text-xs text-stone-500">/life-events/{event.slug}</span>
        </>
      ),
    },
    { key: 'steps', label: 'Steps', render: (event) => <span className="text-stone-700">{event.steps.length}</span> },
    {
      key: 'status',
      label: 'Status',
      render: (event) =>
        event.status === 'published' ? (
          <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">Published</span>
        ) : (
          <span className="inline-flex rounded-full bg-stone-100 px-2.5 py-0.5 text-xs font-semibold text-stone-700">Draft</span>
        ),
    },
    { key: 'updated', label: 'Updated', hideBelow: 'xl', render: (event) => <span className="text-stone-600">{formatDate(event.updated_at?.slice(0, 10))}{event.updated_by_name ? ` by ${event.updated_by_name}` : ''}</span> },
    {
      key: 'actions',
      label: <span className="sr-only">Actions</span>,
      className: 'md:w-px',
      render: (event) => (
        <div className="flex gap-1 md:justify-end">
          {event.status === 'published' && (
            <IconAction label={`View ${event.title} on the public site`} href={`/life-events/${event.slug}`}>
              <ExternalLink size={16} />
            </IconAction>
          )}
          <IconAction label={`${canEdit ? 'Edit' : 'View'} ${event.title}`} onClick={() => setEditing(event)}>
            <Pencil size={16} />
          </IconAction>
        </div>
      ),
    },
  ]

  return (
    <div className="mx-auto max-w-6xl">
      <PageTitle
        title="Life events"
        description="Step-by-step paths for one situation, such as starting a business, built from existing guides. Shown on the home page."
        action={
          canEdit && (
            <Button onClick={() => setEditing('new')} disabled={!lookups.data}>
              <Plus size={17} aria-hidden="true" /> Add life event
            </Button>
          )
        }
      />
      <ResourceTable
        search={search}
        onSearch={setSearch}
        searchPlaceholder="Search life events"
        loading={events.loading}
        error={events.error}
        rows={rows}
        columns={columns}
        emptyText="No life events yet."
      />

      {editing && lookups.data && (
        <LifeEventModal
          event={editing === 'new' ? null : editing}
          services={lookups.data.services}
          readOnly={!canEdit || (!isSuper && editing !== 'new' && editing.status === 'published')}
          canPublish={isSuper}
          onClose={() => setEditing(null)}
          onSaved={(message) => {
            setEditing(null)
            setToast(message)
            events.reload()
          }}
        />
      )}
      <Toast message={toast} onDismiss={dismissToast} />
    </div>
  )
}
