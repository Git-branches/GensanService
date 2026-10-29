import { useCallback, useId, useState } from 'react'
import { ExternalLink, Pencil, Plus, Upload } from 'lucide-react'
import AgencyLogo from '../../components/AgencyLogo'
import { usePageTitle } from '../../hooks/usePageTitle'
import { adminApi } from '../api'
import { canEditContent, useAdminAuth } from '../auth'
import { useAdminList } from '../useAdminList'
import FormModal from '../components/FormModal'
import ResourceTable from '../components/ResourceTable'
import Toast from '../components/Toast'
import { ActiveBadge, Button, Field, IconAction, PageTitle, Switch, inputClass } from '../components/ui'

const EMPTY = { name: '', acronym: '', slug: '', description: '', official_website: '', hotline: '', email: '', facebook_url: '', is_local_government: false, is_active: true }

function toForm(agency) {
  if (!agency) return EMPTY
  return {
    name: agency.name,
    acronym: agency.acronym ?? '',
    slug: agency.slug,
    description: agency.description ?? '',
    official_website: agency.official_website ?? '',
    hotline: agency.hotline ?? '',
    email: agency.email ?? '',
    facebook_url: agency.facebook_url ?? '',
    is_local_government: Boolean(agency.is_local_government),
    is_active: Boolean(agency.is_active),
  }
}

// Logo changes save immediately, separately from the form, so they need an existing agency.
function LogoField({ agency, readOnly, onChange }) {
  const inputId = useId()
  const [logoUrl, setLogoUrl] = useState(agency.logo_url)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function run(action) {
    setBusy(true)
    setError('')
    try {
      const result = await action()
      setLogoUrl(result.logo_url)
      onChange()
    } catch (err) {
      setError(err.details?.logo || err.message)
    } finally {
      setBusy(false)
    }
  }

  function handleFile(event) {
    const file = event.target.files[0]
    event.target.value = ''
    if (file) run(() => adminApi.uploadAgencyLogo(agency.id, file))
  }

  return (
    <div>
      <p className="text-sm font-semibold text-stone-700">Logo</p>
      <div className="mt-1.5 flex flex-wrap items-center gap-4">
        <AgencyLogo agency={{ ...agency, logo_url: logoUrl }} />
        {!readOnly && (
          <div className="flex flex-wrap gap-2">
            <label
              htmlFor={inputId}
              className={`inline-flex cursor-pointer items-center gap-2 rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-700 transition-colors hover:bg-stone-50 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-bay-500 ${busy ? 'pointer-events-none opacity-60' : ''}`}
            >
              <Upload size={15} aria-hidden="true" /> {logoUrl ? 'Replace logo' : 'Upload logo'}
              <input id={inputId} type="file" accept="image/png,image/jpeg,image/webp" disabled={busy} onChange={handleFile} className="sr-only" />
            </label>
            {logoUrl && (
              <Button variant="danger" disabled={busy} onClick={() => run(() => adminApi.removeAgencyLogo(agency.id))}>
                Remove
              </Button>
            )}
          </div>
        )}
      </div>
      {!readOnly && (
        <p className="mt-1.5 text-xs text-stone-500">
          PNG, JPG, or WebP up to 2 MB; square images look best. Use the logo from the agency's official website.
          Logo changes are saved right away.
        </p>
      )}
      {error && <p className="mt-1 text-xs font-medium text-red-600">{error}</p>}
    </div>
  )
}

function AgencyFormModal({ agency, readOnly, onClose, onSaved, onLogoChange }) {
  return (
    <FormModal
      title={agency ? `Edit ${agency.acronym || agency.name}` : 'Add agency'}
      description="Government agencies and offices whose services are covered in the guides."
      initialValues={toForm(agency)}
      readOnly={readOnly}
      submitLabel={agency ? 'Save changes' : 'Add agency'}
      onClose={onClose}
      onSaved={() => onSaved(agency ? 'Agency updated.' : 'Agency added.')}
      onSubmit={(values) => (agency ? adminApi.update('agencies', agency.id, values) : adminApi.create('agencies', values))}
    >
      {(values, set, errors) => (
        <>
          {agency ? (
            <LogoField agency={agency} readOnly={readOnly} onChange={onLogoChange} />
          ) : (
            <p className="rounded-lg bg-stone-50 px-3 py-2.5 text-xs text-stone-600">You can add the agency's logo after saving it.</p>
          )}

          <div className="grid gap-4 sm:grid-cols-[1fr_10rem]">
            <Field id="agency-name" label="Agency name" required error={errors.name}>
              <input id="agency-name" data-autofocus value={values.name} maxLength={150} aria-invalid={Boolean(errors.name)} onChange={(e) => set({ name: e.target.value })} className={inputClass} placeholder="e.g. Social Security System" />
            </Field>
            <Field id="agency-acronym" label="Acronym" error={errors.acronym}>
              <input id="agency-acronym" value={values.acronym} maxLength={20} onChange={(e) => set({ acronym: e.target.value })} className={inputClass} placeholder="e.g. SSS" />
            </Field>
          </div>

          <Field id="agency-slug" label="Web address" error={errors.slug} hint="Leave blank to create it from the name. Changing it breaks old links.">
            <div className="flex items-center rounded-lg border border-stone-300 bg-stone-50 focus-within:border-bay-500 focus-within:ring-2 focus-within:ring-bay-500/20">
              <span className="shrink-0 whitespace-nowrap pl-3 text-sm text-stone-500">/agencies/</span>
              <input id="agency-slug" value={values.slug} maxLength={160} aria-invalid={Boolean(errors.slug)} onChange={(e) => set({ slug: e.target.value.toLowerCase() })} className="w-full rounded-r-lg bg-white px-2 py-2 text-sm focus:outline-none" />
            </div>
          </Field>

          <fieldset>
            <legend className="text-sm font-semibold text-stone-700">Type</legend>
            <div className="mt-1.5 grid gap-2 sm:grid-cols-2">
              {[
                { value: false, label: 'National agency', hint: 'e.g. SSS, PhilHealth, PSA' },
                { value: true, label: 'Local government', hint: 'City or barangay offices' },
              ].map((option) => (
                <label
                  key={option.label}
                  className={`flex cursor-pointer items-start gap-2.5 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                    values.is_local_government === option.value ? 'bg-bay-50 ring-2 ring-bay-500' : 'bg-stone-50 hover:bg-stone-100'
                  }`}
                >
                  <input type="radio" name="agency-type" checked={values.is_local_government === option.value} onChange={() => set({ is_local_government: option.value })} className="mt-0.5 accent-bay-700" />
                  <span>
                    <span className="block font-semibold text-stone-800">{option.label}</span>
                    <span className="block text-xs text-stone-500">{option.hint}</span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <Field id="agency-website" label="Official website" error={errors.official_website}>
            <input id="agency-website" type="url" value={values.official_website} maxLength={255} aria-invalid={Boolean(errors.official_website)} onChange={(e) => set({ official_website: e.target.value })} className={inputClass} placeholder="https://" />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="agency-hotline" label="Hotline" error={errors.hotline} hint="Shown on the agency page. Separate numbers with a slash.">
              <input id="agency-hotline" value={values.hotline} maxLength={100} aria-invalid={Boolean(errors.hotline)} onChange={(e) => set({ hotline: e.target.value })} className={inputClass} placeholder="e.g. 1455" />
            </Field>
            <Field id="agency-email" label="Public email" error={errors.email}>
              <input id="agency-email" type="email" value={values.email} maxLength={150} aria-invalid={Boolean(errors.email)} onChange={(e) => set({ email: e.target.value })} className={inputClass} placeholder="e.g. info@agency.gov.ph" />
            </Field>
          </div>

          <Field id="agency-facebook" label="Official Facebook page" error={errors.facebook_url}>
            <input id="agency-facebook" type="url" value={values.facebook_url} maxLength={255} aria-invalid={Boolean(errors.facebook_url)} onChange={(e) => set({ facebook_url: e.target.value })} className={inputClass} placeholder="https://www.facebook.com/..." />
          </Field>

          <Field id="agency-description" label="Description" error={errors.description}>
            <textarea id="agency-description" rows={3} value={values.description} maxLength={2000} onChange={(e) => set({ description: e.target.value })} className={inputClass} />
          </Field>

          <Switch
            id="agency-active"
            label="Show on the public site"
            description="Inactive agencies are hidden from the directory."
            checked={values.is_active}
            onChange={(is_active) => set({ is_active })}
            error={errors.is_active}
          />
        </>
      )}
    </FormModal>
  )
}

export default function AdminAgenciesPage() {
  usePageTitle('Agencies · Admin')
  const { admin } = useAdminAuth()
  const canEdit = canEditContent(admin)
  const { data, error, loading, reload } = useAdminList('agencies')
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState(null)
  const [toast, setToast] = useState('')
  const dismissToast = useCallback(() => setToast(''), [])

  const needle = search.trim().toLowerCase()
  const rows = data?.filter((a) => !needle || `${a.name} ${a.acronym ?? ''}`.toLowerCase().includes(needle))

  const columns = [
    {
      key: 'name',
      label: 'Agency',
      render: (a) => (
        <div className="flex items-center gap-3">
          <AgencyLogo agency={a} size="sm" />
          <div className="min-w-0">
            <span className="font-semibold text-bay-900">{a.name}</span>
            {a.acronym && <span className="ml-1.5 text-stone-500">({a.acronym})</span>}
            {a.official_website && (
              <a href={a.official_website} target="_blank" rel="noopener noreferrer" className="mt-0.5 flex items-center gap-1 text-xs text-stone-500 hover:text-bay-700">
                {a.official_website.replace(/^https?:\/\//, '')} <ExternalLink size={11} aria-hidden="true" />
              </a>
            )}
          </div>
        </div>
      ),
    },
    { key: 'type', label: 'Type', hideBelow: 'xl', className: 'whitespace-nowrap', render: (a) => <span className="text-stone-700">{a.is_local_government ? 'Local government' : 'National'}</span> },
    { key: 'guides', label: 'Live guides', className: 'whitespace-nowrap', render: (a) => <span className="text-stone-700">{a.published_count} <span className="text-stone-400">of {a.service_count}</span></span> },
    { key: 'offices', label: 'Offices', hideBelow: 'xl', render: (a) => <span className="text-stone-700">{a.office_count}</span> },
    { key: 'status', label: 'Status', render: (a) => <ActiveBadge active={Boolean(a.is_active)} /> },
    {
      key: 'actions',
      label: <span className="sr-only">Actions</span>,
      className: 'md:w-px',
      render: (a) => (
        <div className="flex md:justify-end">
          <IconAction label={`${canEdit ? 'Edit' : 'View'} ${a.name}`} onClick={() => setEditing(a)}>
            <Pencil size={16} />
          </IconAction>
        </div>
      ),
    },
  ]

  return (
    <div className="mx-auto max-w-6xl">
      <PageTitle
        title="Agencies"
        description="National agencies and local government offices covered by the guides."
        action={
          canEdit && (
            <Button onClick={() => setEditing('new')}>
              <Plus size={17} aria-hidden="true" /> Add agency
            </Button>
          )
        }
      />
      <ResourceTable
        search={search}
        onSearch={setSearch}
        searchPlaceholder="Search agencies"
        loading={loading}
        error={error}
        rows={rows}
        columns={columns}
        emptyText="No agencies match your search."
      />

      {editing && (
        <AgencyFormModal
          agency={editing === 'new' ? null : editing}
          readOnly={!canEdit}
          onClose={() => setEditing(null)}
          onLogoChange={reload}
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
