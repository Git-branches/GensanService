import { useCallback, useState } from 'react'
import { BadgeCheck, Pencil, Plus } from 'lucide-react'
import { usePageTitle } from '../../hooks/usePageTitle'
import { formatDate } from '../../utils/format'
import { adminApi } from '../api'
import { canEditContent, useAdminAuth } from '../auth'
import { useAdminList } from '../useAdminList'
import FormModal from '../components/FormModal'
import ResourceTable from '../components/ResourceTable'
import Toast from '../components/Toast'
import { ActiveBadge, Button, Field, IconAction, PageTitle, Switch, inputClass } from '../components/ui'

const EMPTY = {
  agency_id: '',
  name: '',
  address: '',
  barangay: '',
  city: 'General Santos City',
  province: 'South Cotabato',
  contact_number: '',
  email: '',
  opening_hours: '',
  latitude: '',
  longitude: '',
  is_verified: false,
  last_verified_at: '',
  is_active: true,
}

function toForm(office) {
  if (!office) return EMPTY
  return Object.fromEntries(
    Object.keys(EMPTY).map((key) => {
      const value = office[key]
      if (typeof EMPTY[key] === 'boolean') return [key, Boolean(value)]
      return [key, value === null || value === undefined ? '' : String(value)]
    })
  )
}

function OfficeFormModal({ office, agencies, readOnly, onClose, onSaved }) {
  const text = (values, set, errors, key, label, props = {}) => (
    <Field id={`office-${key}`} label={label} error={errors[key]} required={props.required} hint={props.hint}>
      <input
        id={`office-${key}`}
        value={values[key]}
        aria-invalid={Boolean(errors[key])}
        onChange={(e) => set({ [key]: e.target.value })}
        className={inputClass}
        {...props.input}
      />
    </Field>
  )

  return (
    <FormModal
      title={office ? `Edit ${office.name}` : 'Add office'}
      description="Branches and local offices residents can visit."
      initialValues={toForm(office)}
      readOnly={readOnly}
      submitLabel={office ? 'Save changes' : 'Add office'}
      onClose={onClose}
      onSaved={() => onSaved(office ? 'Office updated.' : 'Office added.')}
      onSubmit={(values) => {
        const payload = { ...values, agency_id: values.agency_id ? Number(values.agency_id) : null, last_verified_at: values.last_verified_at || null }
        return office ? adminApi.update('offices', office.id, payload) : adminApi.create('offices', payload)
      }}
    >
      {(values, set, errors) => (
        <>
          <Field id="office-agency_id" label="Agency" required error={errors.agency_id}>
            <select id="office-agency_id" data-autofocus value={values.agency_id} aria-invalid={Boolean(errors.agency_id)} onChange={(e) => set({ agency_id: e.target.value })} className={inputClass}>
              <option value="">Choose an agency</option>
              {agencies.map((agency) => (
                <option key={agency.id} value={agency.id}>
                  {agency.acronym ? `${agency.acronym} — ${agency.name}` : agency.name}
                </option>
              ))}
            </select>
          </Field>

          {text(values, set, errors, 'name', 'Office name', { required: true, input: { maxLength: 150, placeholder: 'e.g. SSS General Santos Branch' } })}

          <div className="grid gap-4 sm:grid-cols-2">
            {text(values, set, errors, 'address', 'Street address', { input: { maxLength: 255 } })}
            {text(values, set, errors, 'barangay', 'Barangay', { input: { maxLength: 100 } })}
            {text(values, set, errors, 'city', 'City', { input: { maxLength: 100 } })}
            {text(values, set, errors, 'province', 'Province', { input: { maxLength: 100 } })}
            {text(values, set, errors, 'contact_number', 'Contact number', { input: { maxLength: 50, inputMode: 'tel' } })}
            {text(values, set, errors, 'email', 'Email', { input: { maxLength: 150, type: 'email' } })}
          </div>

          {text(values, set, errors, 'opening_hours', 'Office hours', { input: { maxLength: 255, placeholder: 'e.g. Monday to Friday, 8:00 AM – 5:00 PM' } })}

          <div className="grid gap-4 sm:grid-cols-2">
            {text(values, set, errors, 'latitude', 'Latitude', { hint: 'Optional — for an exact map pin.', input: { inputMode: 'decimal', placeholder: 'e.g. 6.1164' } })}
            {text(values, set, errors, 'longitude', 'Longitude', { hint: 'Enter both or neither.', input: { inputMode: 'decimal', placeholder: 'e.g. 125.1716' } })}
          </div>

          <div className="space-y-3 rounded-lg bg-stone-50 p-4">
            <label className="flex items-start gap-2.5 text-sm">
              <input type="checkbox" checked={values.is_verified} onChange={(e) => set({ is_verified: e.target.checked })} className="mt-0.5 h-4 w-4 accent-bay-700" />
              <span>
                <span className="block font-semibold text-stone-800">Details verified</span>
                <span className="block text-xs text-stone-500">Only tick this after confirming the address, contact number, and hours with the office.</span>
              </span>
            </label>
            {values.is_verified && (
              <Field id="office-last_verified_at" label="Verified on" required error={errors.last_verified_at}>
                <input id="office-last_verified_at" type="date" value={values.last_verified_at} aria-invalid={Boolean(errors.last_verified_at)} onChange={(e) => set({ last_verified_at: e.target.value })} className={`${inputClass} sm:max-w-xs`} />
              </Field>
            )}
          </div>

          <Switch
            id="office-active"
            label="Show on the public site"
            description="Inactive offices are hidden from the directory and guides."
            checked={values.is_active}
            onChange={(is_active) => set({ is_active })}
            error={errors.is_active}
          />
        </>
      )}
    </FormModal>
  )
}

export default function AdminOfficesPage() {
  usePageTitle('Offices · Admin')
  const { admin } = useAdminAuth()
  const canEdit = canEditContent(admin)
  const offices = useAdminList('offices')
  const agencies = useAdminList('agencies')
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState(null)
  const [toast, setToast] = useState('')
  const dismissToast = useCallback(() => setToast(''), [])

  const needle = search.trim().toLowerCase()
  const rows = offices.data?.filter(
    (o) => !needle || [o.name, o.address, o.barangay, o.agency_name, o.agency_acronym].filter(Boolean).join(' ').toLowerCase().includes(needle)
  )

  const columns = [
    {
      key: 'name',
      label: 'Office',
      render: (o) => (
        <>
          <span className="font-semibold text-bay-900">{o.name}</span>
          <span className="block text-xs text-stone-500">{[o.address, o.barangay, o.city].filter(Boolean).join(', ') || 'No address yet'}</span>
        </>
      ),
    },
    { key: 'agency', label: 'Agency', className: 'whitespace-nowrap', render: (o) => <span className="text-stone-700">{o.agency_acronym || o.agency_name}</span> },
    {
      key: 'verified',
      label: 'Verification',
      className: 'whitespace-nowrap',
      render: (o) =>
        o.is_verified ? (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
            <BadgeCheck size={14} aria-hidden="true" /> {formatDate(o.last_verified_at)}
          </span>
        ) : (
          <span className="inline-flex whitespace-nowrap rounded-full bg-sun-50 px-2.5 py-0.5 text-xs font-semibold text-sun-800">Not verified</span>
        ),
    },
    { key: 'guides', label: 'Guides', hideBelow: 'xl', render: (o) => <span className="text-stone-700">{o.service_count}</span> },
    { key: 'status', label: 'Status', render: (o) => <ActiveBadge active={Boolean(o.is_active)} /> },
    {
      key: 'actions',
      label: <span className="sr-only">Actions</span>,
      className: 'md:w-px',
      render: (o) => (
        <div className="flex md:justify-end">
          <IconAction label={`${canEdit ? 'Edit' : 'View'} ${o.name}`} onClick={() => setEditing(o)}>
            <Pencil size={16} />
          </IconAction>
        </div>
      ),
    },
  ]

  return (
    <div className="mx-auto max-w-6xl">
      <PageTitle
        title="Offices"
        description="Agency branches and local offices, with addresses, hours, and verification status."
        action={
          canEdit && (
            <Button onClick={() => setEditing('new')} disabled={!agencies.data}>
              <Plus size={17} aria-hidden="true" /> Add office
            </Button>
          )
        }
      />
      <ResourceTable
        search={search}
        onSearch={setSearch}
        searchPlaceholder="Search offices, barangays, or agencies"
        loading={offices.loading}
        error={offices.error}
        rows={rows}
        columns={columns}
        emptyText="No offices match your search."
      />

      {editing && agencies.data && (
        <OfficeFormModal
          office={editing === 'new' ? null : editing}
          agencies={agencies.data.filter((a) => a.is_active || (editing !== 'new' && a.id === editing.agency_id))}
          readOnly={!canEdit}
          onClose={() => setEditing(null)}
          onSaved={(message) => {
            setEditing(null)
            setToast(message)
            offices.reload()
          }}
        />
      )}
      <Toast message={toast} onDismiss={dismissToast} />
    </div>
  )
}
