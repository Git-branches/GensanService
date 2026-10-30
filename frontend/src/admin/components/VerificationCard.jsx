import { useState } from 'react'
import { AlertCircle } from 'lucide-react'
import { adminApi } from '../api'
import { Button, Card, Field, inputClass } from './ui'

const STATUSES = [
  { value: 'verified', label: 'Verified', hint: 'Checked against official sources' },
  { value: 'needs_review', label: 'Needs review', hint: 'Written or changed, not confirmed yet' },
  { value: 'unverified', label: 'Unverified', hint: 'No official source checked' },
  { value: 'outdated', label: 'Outdated', hint: 'Known to be out of date' },
]

function toValues(service) {
  return {
    verification_status: service.verification_status,
    last_verified_at: service.last_verified_at ?? '',
    next_review_at: service.next_review_at ?? '',
    verification_notes: service.verification_notes ?? '',
  }
}

// Saved separately from the guide, because editing a guide must never verify it.
export default function VerificationCard({ service, canVerify, onSaved }) {
  const [values, setValues] = useState(() => toValues(service))
  const [errors, setErrors] = useState({})
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const set = (patch) => setValues((current) => ({ ...current, ...patch }))

  async function save() {
    setSaving(true)
    setErrors({})
    setError('')
    try {
      onSaved(await adminApi.setServiceVerification(service.id, {
        ...values,
        last_verified_at: values.last_verified_at || null,
        next_review_at: values.next_review_at || null,
      }))
    } catch (err) {
      setErrors(err.details || {})
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card
      title="Verification"
      description={canVerify
        ? 'Shown to residents. Changing the guide afterwards sets a verified guide back to Needs review.'
        : 'Shown to residents. Reviewers and super admins set this after checking official sources.'}
    >
      <fieldset disabled={!canVerify || saving} className="space-y-4">
        {error && (
          <p role="alert" className="flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-700">
            <AlertCircle size={17} aria-hidden="true" className="mt-0.5 shrink-0" />
            {error}
          </p>
        )}

        <Field id="verification_status" label="Status" error={errors.verification_status}>
          <select id="verification_status" value={values.verification_status} onChange={(e) => set({ verification_status: e.target.value })} className={inputClass}>
            {STATUSES.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}: {status.hint}
              </option>
            ))}
          </select>
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="last_verified_at" label="Last checked on" error={errors.last_verified_at}>
            <input id="last_verified_at" type="date" value={values.last_verified_at} aria-invalid={Boolean(errors.last_verified_at)} onChange={(e) => set({ last_verified_at: e.target.value })} className={inputClass} />
          </Field>
          <Field id="next_review_at" label="Next review on" error={errors.next_review_at}>
            <input id="next_review_at" type="date" value={values.next_review_at} aria-invalid={Boolean(errors.next_review_at)} onChange={(e) => set({ next_review_at: e.target.value })} className={inputClass} />
          </Field>
        </div>

        <Field id="verification_notes" label="Notes for the team" error={errors.verification_notes} hint="Not shown to residents. For example, who you called and what they confirmed.">
          <textarea id="verification_notes" rows={2} maxLength={1000} value={values.verification_notes} onChange={(e) => set({ verification_notes: e.target.value })} className={inputClass} />
        </Field>

        {canVerify && (
          <Button variant="secondary" loading={saving} onClick={save}>
            Save verification
          </Button>
        )}
      </fieldset>
    </Card>
  )
}
