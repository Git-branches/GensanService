import { useState } from 'react'
import { AlertCircle, CheckCircle2 } from 'lucide-react'
import { usePageTitle } from '../../hooks/usePageTitle'
import { ROLE_LABELS, useAdminAuth } from '../auth'
import PasswordInput from '../components/PasswordInput'
import { Button, Card, Field, PageTitle } from '../components/ui'

export default function AdminAccountPage() {
  usePageTitle('My account · Admin')
  const { admin, changePassword } = useAdminAuth()
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [errors, setErrors] = useState({})
  const [banner, setBanner] = useState(null)
  const [saving, setSaving] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setBanner(null)
    if (next !== confirm) {
      setErrors({ confirm: 'The new passwords do not match.' })
      return
    }
    setErrors({})
    setSaving(true)
    try {
      await changePassword(current, next)
      setCurrent('')
      setNext('')
      setConfirm('')
      setBanner({ type: 'success', message: 'Password changed. Use your new password the next time you sign in.' })
    } catch (err) {
      setErrors(err.details || {})
      setBanner({ type: 'error', message: err.message })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageTitle title="My account" description="Your admin profile and password." />

      <Card title="Profile">
        <dl className="grid gap-4 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-xs font-bold uppercase tracking-wide text-stone-500">Name</dt>
            <dd className="mt-1 text-stone-900">{admin?.name}</dd>
          </div>
          <div>
            <dt className="text-xs font-bold uppercase tracking-wide text-stone-500">Email</dt>
            <dd className="mt-1 break-all text-stone-900">{admin?.email}</dd>
          </div>
          <div>
            <dt className="text-xs font-bold uppercase tracking-wide text-stone-500">Role</dt>
            <dd className="mt-1 text-stone-900">{ROLE_LABELS[admin?.role]}</dd>
          </div>
        </dl>
        <p className="text-xs text-stone-500">To change your name, email, or role, ask a super admin.</p>
      </Card>

      <Card title="Change password" description="Use at least 10 characters with a mix of letters and numbers or symbols.">
        {banner && (
          <p
            role={banner.type === 'error' ? 'alert' : 'status'}
            className={`flex items-start gap-2 rounded-lg px-3 py-2.5 text-sm ${banner.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-800'}`}
          >
            {banner.type === 'error' ? <AlertCircle size={17} className="mt-0.5 shrink-0" aria-hidden="true" /> : <CheckCircle2 size={17} className="mt-0.5 shrink-0" aria-hidden="true" />}
            {banner.message}
          </p>
        )}
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <Field id="current-password" label="Current password" required error={errors.current_password}>
            <PasswordInput id="current-password" autoComplete="current-password" value={current} onChange={setCurrent} error={errors.current_password} />
          </Field>
          <Field id="new-password" label="New password" required error={errors.new_password}>
            <PasswordInput id="new-password" value={next} onChange={setNext} error={errors.new_password} />
          </Field>
          <Field id="confirm-password" label="Confirm new password" required error={errors.confirm}>
            <PasswordInput id="confirm-password" value={confirm} onChange={setConfirm} error={errors.confirm} />
          </Field>
          <Button type="submit" loading={saving}>
            Change password
          </Button>
        </form>
      </Card>
    </div>
  )
}
