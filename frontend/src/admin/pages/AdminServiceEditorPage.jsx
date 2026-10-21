import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { AlertCircle, ArrowLeft, CheckCircle2, ExternalLink, Info, Loader2 } from 'lucide-react'
import { usePageTitle } from '../../hooks/usePageTitle'
import { formatDate } from '../../utils/format'
import { adminApi } from '../api'
import { canEditContent, useAdminAuth } from '../auth'
import ConfirmDialog from '../components/ConfirmDialog'
import ListEditor from '../components/ListEditor'
import { withKey } from '../components/listKeys'
import { Button, Card, Field, StatusBadge, inputClass } from '../components/ui'

const EMPTY_FORM = {
  title: '',
  slug: '',
  agency_id: '',
  category_id: '',
  summary: '',
  description: '',
  fee_description: '',
  processing_time_description: '',
  last_verified_at: '',
  eligibility: [],
  requirements: [],
  steps: [],
  sources: [],
  office_ids: [],
}

const SUCCESS_MESSAGES = {
  published: 'Guide published. It is now visible on the public site.',
  draft: 'Guide moved to drafts. It is no longer visible to the public.',
  archived: 'Guide archived. It is hidden from the public site.',
}

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 200)
}

function fromService(service) {
  return {
    title: service.title ?? '',
    slug: service.slug ?? '',
    agency_id: String(service.agency_id ?? ''),
    category_id: String(service.category_id ?? ''),
    summary: service.summary ?? '',
    description: service.description ?? '',
    fee_description: service.fee_description ?? '',
    processing_time_description: service.processing_time_description ?? '',
    last_verified_at: service.last_verified_at ?? '',
    eligibility: service.eligibility.map((text) => withKey({ text })),
    requirements: service.requirements.map((item) =>
      withKey({ id: item.id, requirement_text: item.requirement_text, notes: item.notes ?? '', is_optional: item.is_optional })
    ),
    steps: service.steps.map((step) => withKey({ title: step.title, instructions: step.instructions ?? '' })),
    sources: service.sources.map((source) =>
      withKey({ label: source.label ?? '', url: source.url, verified_at: source.verified_at ?? '' })
    ),
    office_ids: service.office_ids,
  }
}

function stripKey(item) {
  const copy = { ...item }
  delete copy._key
  return copy
}

function toPayload(form) {
  return {
    title: form.title,
    slug: form.slug,
    agency_id: form.agency_id ? Number(form.agency_id) : null,
    category_id: form.category_id ? Number(form.category_id) : null,
    summary: form.summary,
    description: form.description,
    fee_description: form.fee_description,
    processing_time_description: form.processing_time_description,
    last_verified_at: form.last_verified_at || null,
    eligibility: form.eligibility.map((item) => item.text),
    requirements: form.requirements.map(stripKey),
    steps: form.steps.map(stripKey),
    sources: form.sources.map((source) => ({ ...stripKey(source), verified_at: source.verified_at || null })),
    office_ids: form.office_ids,
  }
}

function TextInput({ id, error, ...props }) {
  return (
    <input
      id={id}
      aria-invalid={Boolean(error)}
      aria-describedby={error ? `${id}-error` : undefined}
      className={inputClass}
      {...props}
    />
  )
}

function InlineError({ message }) {
  return message ? <p className="text-xs font-medium text-red-600">{message}</p> : null
}

export default function AdminServiceEditorPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { admin } = useAdminAuth()
  const readOnly = !canEditContent(admin)

  const [loadError, setLoadError] = useState('')
  const [ready, setReady] = useState(false)
  const [lookups, setLookups] = useState({ categories: [], agencies: [], offices: [] })
  const [service, setService] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [dirty, setDirty] = useState(false)
  const [slugEdited, setSlugEdited] = useState(false)
  const [errors, setErrors] = useState({})
  const [banner, setBanner] = useState(() =>
    location.state?.flash ? { type: 'success', message: location.state.flash } : null
  )
  const [saving, setSaving] = useState(null)
  const [confirmAction, setConfirmAction] = useState(null)

  usePageTitle(`${service ? service.title : 'New guide'} · Admin`)

  useEffect(() => {
    let active = true
    Promise.all([adminApi.lookups(), id ? adminApi.getService(id) : Promise.resolve(null)])
      .then(([lookupData, serviceData]) => {
        if (!active) return
        setLookups(lookupData)
        if (serviceData) {
          setService(serviceData)
          setForm(fromService(serviceData))
        }
        setReady(true)
      })
      .catch((err) => {
        if (active) setLoadError(err.message)
      })
    return () => {
      active = false
    }
  }, [id])

  useEffect(() => {
    if (!dirty) return undefined
    const warn = (event) => {
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])

  function update(patch) {
    setForm((current) => ({ ...current, ...patch }))
    setDirty(true)
  }

  function handleTitle(value) {
    update(service || slugEdited ? { title: value } : { title: value, slug: slugify(value) })
  }

  function toggleOffice(officeId) {
    update({
      office_ids: form.office_ids.includes(officeId)
        ? form.office_ids.filter((value) => value !== officeId)
        : [...form.office_ids, officeId],
    })
  }

  function requestStatus(nextStatus) {
    if (nextStatus === 'archived') {
      setConfirmAction({
        status: 'archived',
        title: 'Archive this guide?',
        message: 'It will be hidden from the public site. You can restore it to drafts later.',
        confirmLabel: 'Archive guide',
        tone: 'danger',
      })
    } else if (nextStatus === 'draft' && service?.status === 'published') {
      setConfirmAction({
        status: 'draft',
        title: 'Unpublish this guide?',
        message: 'Residents will no longer see it until you publish it again.',
        confirmLabel: 'Unpublish',
        tone: 'danger',
      })
    } else {
      save(nextStatus)
    }
  }

  async function confirmPendingAction() {
    await save(confirmAction.status)
    setConfirmAction(null)
  }

  async function save(nextStatus) {
    setErrors({})
    setBanner(null)
    setSaving(nextStatus || 'save')
    try {
      let saved = service
      if (!service || dirty) {
        saved = service
          ? await adminApi.updateService(service.id, toPayload(form))
          : await adminApi.createService(toPayload(form))
      }
      if (nextStatus) saved = await adminApi.setServiceStatus(saved.id, nextStatus)
      setDirty(false)

      if (!service) {
        navigate(`/admin/services/${saved.id}`, {
          replace: true,
          state: { flash: nextStatus === 'published' ? SUCCESS_MESSAGES.published : 'Guide created as a draft.' },
        })
        return
      }

      setService(saved)
      setForm(fromService(saved))
      setBanner({ type: 'success', message: SUCCESS_MESSAGES[nextStatus] || 'Changes saved.' })
    } catch (err) {
      setErrors(err.details || {})
      setBanner({ type: 'error', message: err.message })
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } finally {
      setSaving(null)
    }
  }

  if (loadError) {
    return (
      <div className="mx-auto max-w-4xl rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
        {loadError}{' '}
        <Link to="/admin/services" className="font-semibold underline">
          Back to guides
        </Link>
      </div>
    )
  }

  if (!ready) {
    return (
      <p role="status" className="flex items-center gap-2 text-sm text-stone-500">
        <Loader2 size={16} className="animate-spin" aria-hidden="true" /> Loading guide...
      </p>
    )
  }

  const status = service?.status ?? 'draft'
  const sortedOffices = [...lookups.offices].sort(
    (a, b) => (String(b.agency_id) === form.agency_id) - (String(a.agency_id) === form.agency_id)
  )

  return (
    <div className="mx-auto max-w-4xl pb-28">
      <Link to="/admin/services" className="inline-flex items-center gap-1.5 text-sm font-semibold text-stone-600 hover:text-bay-700">
        <ArrowLeft size={16} aria-hidden="true" /> All guides
      </Link>

      <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-bay-950">{service ? service.title : 'New service guide'}</h1>
          <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-stone-500">
            <StatusBadge status={status} />
            {service?.updated_at && (
              <span>
                Last saved {formatDate(service.updated_at.slice(0, 10))}
                {service.updated_by_name ? ` by ${service.updated_by_name}` : ''}
              </span>
            )}
          </p>
        </div>
        {service?.status === 'published' && (
          <a
            href={`/services/${service.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-bay-700 hover:underline"
          >
            View live page <ExternalLink size={14} aria-hidden="true" />
            <span className="sr-only">(opens in a new tab)</span>
          </a>
        )}
      </div>

      {banner && (
        <div
          role={banner.type === 'error' ? 'alert' : 'status'}
          className={`mt-5 flex items-start gap-2 rounded-lg px-4 py-3 text-sm ${
            banner.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-800'
          }`}
        >
          {banner.type === 'error' ? (
            <AlertCircle size={18} aria-hidden="true" className="mt-0.5 shrink-0" />
          ) : (
            <CheckCircle2 size={18} aria-hidden="true" className="mt-0.5 shrink-0" />
          )}
          {banner.message}
        </div>
      )}

      {readOnly && (
        <p className="mt-5 flex items-center gap-2 rounded-lg bg-bay-50 px-4 py-3 text-sm text-bay-800">
          <Info size={17} aria-hidden="true" /> Your reviewer role can view guides but not edit them.
        </p>
      )}

      <form onSubmit={(event) => event.preventDefault()} className="mt-6">
        <fieldset disabled={readOnly || saving !== null} className="space-y-6">
          <Card title="Basics" description="What residents see first in search results and at the top of the guide.">
            <Field id="title" label="Guide title" required error={errors.title} hint='Start with an action, e.g. "Request a PSA Birth Certificate".'>
              <TextInput id="title" value={form.title} error={errors.title} maxLength={200} onChange={(e) => handleTitle(e.target.value)} />
            </Field>

            <Field id="slug" label="Web address" error={errors.slug} hint="Lowercase letters, numbers, and hyphens. Changing it breaks old links.">
              <div className="flex items-center rounded-lg border border-stone-300 bg-stone-50 focus-within:border-bay-500 focus-within:ring-2 focus-within:ring-bay-500/20">
                <span className="shrink-0 whitespace-nowrap pl-3 text-sm text-stone-500">/services/</span>
                <input
                  id="slug"
                  value={form.slug}
                  maxLength={220}
                  aria-invalid={Boolean(errors.slug)}
                  onChange={(e) => {
                    setSlugEdited(true)
                    update({ slug: e.target.value.toLowerCase() })
                  }}
                  className="w-full rounded-r-lg bg-white px-2 py-2 text-sm focus:outline-none"
                />
              </div>
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="agency_id" label="Responsible agency" required error={errors.agency_id}>
                <select id="agency_id" value={form.agency_id} aria-invalid={Boolean(errors.agency_id)} onChange={(e) => update({ agency_id: e.target.value })} className={inputClass}>
                  <option value="">Choose an agency</option>
                  {lookups.agencies.map((agency) => (
                    <option key={agency.id} value={agency.id}>
                      {agency.acronym ? `${agency.acronym} — ${agency.name}` : agency.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field id="category_id" label="Category" required error={errors.category_id}>
                <select id="category_id" value={form.category_id} aria-invalid={Boolean(errors.category_id)} onChange={(e) => update({ category_id: e.target.value })} className={inputClass}>
                  <option value="">Choose a category</option>
                  {lookups.categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <Field id="summary" label="Summary" error={errors.summary} hint={`One or two sentences for search results. ${form.summary.length}/500`}>
              <textarea id="summary" rows={2} maxLength={500} value={form.summary} onChange={(e) => update({ summary: e.target.value })} className={inputClass} />
            </Field>

            <Field id="description" label="About this service" error={errors.description}>
              <textarea id="description" rows={5} value={form.description} onChange={(e) => update({ description: e.target.value })} className={inputClass} />
            </Field>
          </Card>

          <Card title="Fees and processing time" description="Only fill these in when confirmed by an official source.">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="fee_description" label="Fee" error={errors.fee_description}>
                <TextInput id="fee_description" value={form.fee_description} maxLength={255} placeholder="e.g. PHP 365 per copy" onChange={(e) => update({ fee_description: e.target.value })} />
              </Field>
              <Field id="processing_time_description" label="Processing time" error={errors.processing_time_description}>
                <TextInput id="processing_time_description" value={form.processing_time_description} maxLength={255} placeholder="e.g. 3 to 8 working days" onChange={(e) => update({ processing_time_description: e.target.value })} />
              </Field>
            </div>
          </Card>

          <Card title="Who can apply" description="Eligibility conditions, one per line item.">
            <ListEditor
              items={form.eligibility}
              onChange={(eligibility) => update({ eligibility })}
              newItem={() => ({ text: '' })}
              addLabel="Add condition"
              itemName="condition"
              max={30}
              emptyText="No eligibility conditions yet."
              renderItem={(item, index, patch) => (
                <>
                  <label htmlFor={`eligibility-${item._key}`} className="sr-only">Condition {index + 1}</label>
                  <TextInput id={`eligibility-${item._key}`} value={item.text} maxLength={500} error={errors[`eligibility.${index}`]} onChange={(e) => patch({ text: e.target.value })} />
                  <InlineError message={errors[`eligibility.${index}`]} />
                </>
              )}
            />
          </Card>

          <Card title="Document checklist" description="Every document residents should prepare. Mark items that only apply in some cases.">
            <ListEditor
              items={form.requirements}
              onChange={(requirements) => update({ requirements })}
              newItem={() => ({ requirement_text: '', notes: '', is_optional: false })}
              addLabel="Add requirement"
              itemName="requirement"
              emptyText="No requirements yet."
              renderItem={(item, index, patch) => (
                <>
                  <label htmlFor={`req-${item._key}`} className="sr-only">Requirement {index + 1}</label>
                  <TextInput id={`req-${item._key}`} value={item.requirement_text} maxLength={255} placeholder="e.g. Valid government-issued ID" error={errors[`requirements.${index}.requirement_text`]} onChange={(e) => patch({ requirement_text: e.target.value })} />
                  <InlineError message={errors[`requirements.${index}.requirement_text`]} />
                  <label htmlFor={`req-notes-${item._key}`} className="sr-only">Notes for requirement {index + 1}</label>
                  <TextInput id={`req-notes-${item._key}`} value={item.notes} maxLength={500} placeholder="Notes (optional), e.g. Bring the original and one photocopy" onChange={(e) => patch({ notes: e.target.value })} />
                  <label className="flex items-center gap-2 text-sm text-stone-700">
                    <input type="checkbox" checked={item.is_optional} onChange={(e) => patch({ is_optional: e.target.checked })} className="h-4 w-4 accent-bay-700" />
                    Only needed in some cases (shown as "If applicable")
                  </label>
                </>
              )}
            />
          </Card>

          <Card title="Application steps" description="In the order residents should follow them.">
            <ListEditor
              items={form.steps}
              onChange={(steps) => update({ steps })}
              newItem={() => ({ title: '', instructions: '' })}
              addLabel="Add step"
              itemName="step"
              max={40}
              emptyText="No steps yet."
              renderItem={(item, index, patch) => (
                <>
                  <label htmlFor={`step-${item._key}`} className="sr-only">Step {index + 1} title</label>
                  <TextInput id={`step-${item._key}`} value={item.title} maxLength={150} placeholder="Step title, e.g. Pay the fee" error={errors[`steps.${index}.title`]} onChange={(e) => patch({ title: e.target.value })} />
                  <InlineError message={errors[`steps.${index}.title`]} />
                  <label htmlFor={`step-text-${item._key}`} className="sr-only">Step {index + 1} instructions</label>
                  <textarea id={`step-text-${item._key}`} rows={2} value={item.instructions} placeholder="Instructions" onChange={(e) => patch({ instructions: e.target.value })} className={inputClass} />
                </>
              )}
            />
          </Card>

          <Card title="Official sources and verification" description="Link the official pages this guide is based on, and record when it was last checked.">
            <Field id="last_verified_at" label="Guide last verified on" error={errors.last_verified_at} hint="Shown to residents. Guides older than 6 months are flagged for review.">
              <TextInput id="last_verified_at" type="date" value={form.last_verified_at} error={errors.last_verified_at} onChange={(e) => update({ last_verified_at: e.target.value })} className={`${inputClass} sm:max-w-xs`} />
            </Field>
            <ListEditor
              items={form.sources}
              onChange={(sources) => update({ sources })}
              newItem={() => ({ label: '', url: '', verified_at: '' })}
              addLabel="Add source"
              itemName="source"
              max={20}
              emptyText="No official sources yet. Add at least one before publishing."
              renderItem={(item, index, patch) => (
                <div className="grid gap-2 sm:grid-cols-[1fr_1.4fr_auto]">
                  <div>
                    <label htmlFor={`src-label-${item._key}`} className="sr-only">Source {index + 1} name</label>
                    <TextInput id={`src-label-${item._key}`} value={item.label} maxLength={150} placeholder="Name, e.g. PSA Serbilis" onChange={(e) => patch({ label: e.target.value })} />
                  </div>
                  <div>
                    <label htmlFor={`src-url-${item._key}`} className="sr-only">Source {index + 1} link</label>
                    <TextInput id={`src-url-${item._key}`} type="url" value={item.url} maxLength={255} placeholder="https://..." error={errors[`sources.${index}.url`]} onChange={(e) => patch({ url: e.target.value })} />
                    <InlineError message={errors[`sources.${index}.url`]} />
                  </div>
                  <div>
                    <label htmlFor={`src-date-${item._key}`} className="sr-only">Source {index + 1} checked on</label>
                    <TextInput id={`src-date-${item._key}`} type="date" value={item.verified_at} error={errors[`sources.${index}.verified_at`]} onChange={(e) => patch({ verified_at: e.target.value })} />
                    <InlineError message={errors[`sources.${index}.verified_at`]} />
                  </div>
                </div>
              )}
            />
          </Card>

          <Card title="Where to go" description="Offices that handle this service. Offices of the selected agency are listed first.">
            {errors.office_ids && <InlineError message={errors.office_ids} />}
            {lookups.offices.length === 0 ? (
              <p className="text-sm text-stone-500">No offices have been added yet.</p>
            ) : (
              <ul className="grid gap-2 sm:grid-cols-2">
                {sortedOffices.map((office) => (
                  <li key={office.id}>
                    <label className="flex items-center gap-2 rounded-lg bg-stone-50 px-3 py-2 text-sm transition-colors hover:bg-stone-100">
                      <input type="checkbox" checked={form.office_ids.includes(office.id)} onChange={() => toggleOffice(office.id)} className="h-4 w-4 accent-bay-700" />
                      <span>
                        <span className="font-medium text-stone-900">{office.name}</span>
                        <span className="ml-1.5 text-xs text-stone-500">{office.agency_acronym}</span>
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </fieldset>
      </form>

      {!readOnly && (
        <div className="fixed inset-x-0 bottom-0 z-20 bg-white/95 shadow-[0_-8px_24px_-12px_rgba(10,38,51,0.18)] backdrop-blur lg:left-64">
          <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
            <p className="text-sm text-stone-500">{dirty ? 'You have unsaved changes.' : 'All changes saved.'}</p>
            <div className="flex flex-wrap gap-2">
              {status === 'published' && (
                <>
                  <Button variant="danger" disabled={saving !== null} onClick={() => requestStatus('archived')}>Archive</Button>
                  <Button variant="secondary" disabled={saving !== null} onClick={() => requestStatus('draft')}>Unpublish</Button>
                  <Button loading={saving === 'save'} disabled={saving !== null || !dirty} onClick={() => save()}>Save changes</Button>
                </>
              )}
              {status === 'draft' && (
                <>
                  {service && <Button variant="danger" disabled={saving !== null} onClick={() => requestStatus('archived')}>Archive</Button>}
                  <Button variant="secondary" loading={saving === 'save'} disabled={saving !== null || (service && !dirty)} onClick={() => save()}>{service ? 'Save draft' : 'Save as draft'}</Button>
                  <Button variant="success" loading={saving === 'published'} disabled={saving !== null} onClick={() => save('published')}>{dirty ? 'Save and publish' : 'Publish'}</Button>
                </>
              )}
              {status === 'archived' && (
                <Button variant="secondary" loading={saving === 'draft'} disabled={saving !== null} onClick={() => save('draft')}>Restore to drafts</Button>
              )}
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={confirmAction !== null}
        title={confirmAction?.title}
        message={confirmAction?.message}
        confirmLabel={confirmAction?.confirmLabel}
        tone={confirmAction?.tone}
        busy={saving !== null}
        onConfirm={confirmPendingAction}
        onCancel={() => setConfirmAction(null)}
      />
    </div>
  )
}
