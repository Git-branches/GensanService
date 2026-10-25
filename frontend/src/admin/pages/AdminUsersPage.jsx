import { useCallback, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { KeyRound, Pencil, Plus } from 'lucide-react'
import { usePageTitle } from '../../hooks/usePageTitle'
import { adminApi } from '../api'
import { timeAgo } from '../activity'
import { ROLE_LABELS, isSuperAdmin, useAdminAuth } from '../auth'
import { useAdminQuery } from '../useAdminList'
import FormModal from '../components/FormModal'
import PasswordInput from '../components/PasswordInput'
import { DataTable } from '../components/ResourceTable'
import Toast from '../components/Toast'
import { ActiveBadge, Button, Field, IconAction, PageTitle, Switch, inputClass } from '../components/ui'

const ROLE_OPTIONS = [
  { value: 'editor', label: 'Editor', hint: 'Create, edit, publish, and archive content' },
  { value: 'reviewer', label: 'Reviewer', hint: 'View content and handle reports' },
  { value: 'super_admin', label: 'Super admin', hint: 'Everything, including admin accounts' },
]

function AdminFormModal({ account, isSelf, onClose, onSaved }) {
  return (
    <FormModal
      title={account ? `Edit ${account.name}` : 'Add admin'}
      description={account ? 'Update this account’s details, role, or access.' : 'Create a sign-in for a staff member. Share the password with them privately.'}
      initialValues={
        account
          ? { name: account.name, email: account.email, role: account.role, is_active: Boolean(account.is_active) }
          : { name: '', email: '', role: 'editor', is_active: true, password: '' }
      }
      submitLabel={account ? 'Save changes' : 'Add admin'}
      onClose={onClose}
      onSaved={() => onSaved(account ? 'Admin updated.' : 'Admin added.')}
      onSubmit={(values) => (account ? adminApi.updateAdmin(account.id, values) : adminApi.createAdmin(values))}
    >
      {(values, set, errors) => (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="admin-name" label="Full name" required error={errors.name}>
              <input id="admin-name" data-autofocus value={values.name} maxLength={100} aria-invalid={Boolean(errors.name)} onChange={(e) => set({ name: e.target.value })} className={inputClass} />
            </Field>
            <Field id="admin-email-field" label="Email" required error={errors.email}>
              <input id="admin-email-field" type="email" value={values.email} maxLength={150} aria-invalid={Boolean(errors.email)} onChange={(e) => set({ email: e.target.value })} className={inputClass} />
            </Field>
          </div>

          <fieldset disabled={isSelf}>
            <legend className="text-sm font-semibold text-stone-700">Role</legend>
            {isSelf && <p className="text-xs text-stone-500">You can’t change your own role.</p>}
            <div className="mt-1.5 grid gap-2">
              {ROLE_OPTIONS.map((option) => (
                <label
                  key={option.value}
                  className={`flex cursor-pointer items-start gap-2.5 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                    values.role === option.value ? 'bg-bay-50 ring-2 ring-bay-500' : 'bg-stone-50 hover:bg-stone-100'
                  }`}
                >
                  <input type="radio" name="admin-role" checked={values.role === option.value} onChange={() => set({ role: option.value })} className="mt-0.5 accent-bay-700" />
                  <span>
                    <span className="block font-semibold text-stone-800">{option.label}</span>
                    <span className="block text-xs text-stone-500">{option.hint}</span>
                  </span>
                </label>
              ))}
            </div>
            {errors.role && <p className="mt-1 text-xs font-medium text-red-600">{errors.role}</p>}
          </fieldset>

          {!account && (
            <Field id="admin-password-field" label="Temporary password" required hint="At least 10 characters with letters and numbers or symbols." error={errors.password}>
              <PasswordInput id="admin-password-field" value={values.password} onChange={(password) => set({ password })} error={errors.password} />
            </Field>
          )}

          {account && !isSelf && (
            <Switch
              id="admin-active"
              label="Can sign in"
              description="Turn off to remove access without deleting the account or its history."
              checked={values.is_active}
              onChange={(is_active) => set({ is_active })}
              error={errors.is_active}
            />
          )}
        </>
      )}
    </FormModal>
  )
}

function ResetPasswordModal({ account, onClose, onSaved }) {
  return (
    <FormModal
      title={`Reset password for ${account.name}`}
      description="Set a new temporary password and share it with them privately. They can change it from My account."
      initialValues={{ password: '' }}
      submitLabel="Reset password"
      onClose={onClose}
      onSaved={() => onSaved('Password reset.')}
      onSubmit={(values) => adminApi.resetAdminPassword(account.id, values.password)}
    >
      {(values, set, errors) => (
        <Field id="reset-password" label="New temporary password" required error={errors.password}>
          <PasswordInput id="reset-password" data-autofocus value={values.password} onChange={(password) => set({ password })} error={errors.password} />
        </Field>
      )}
    </FormModal>
  )
}

export default function AdminUsersPage() {
  usePageTitle('Admin accounts · Admin')
  const { admin } = useAdminAuth()
  const [editing, setEditing] = useState(null)
  const [resetting, setResetting] = useState(null)
  const [toast, setToast] = useState('')
  const dismissToast = useCallback(() => setToast(''), [])
  const allowed = isSuperAdmin(admin)
  const { data, error, loading, reload } = useAdminQuery(() => (allowed ? adminApi.admins() : Promise.resolve([])), [allowed])

  if (!allowed) return <Navigate to="/admin" replace />

  function saved(message) {
    setEditing(null)
    setResetting(null)
    setToast(message)
    reload()
  }

  const columns = [
    {
      key: 'name',
      label: 'Admin',
      render: (a) => (
        <>
          <span className="font-semibold text-bay-900">{a.name}</span>
          {a.id === admin.id && <span className="ml-2 rounded-full bg-bay-50 px-2 py-0.5 text-xs font-semibold text-bay-700">You</span>}
          <span className="block break-all text-xs text-stone-500">{a.email}</span>
        </>
      ),
    },
    { key: 'role', label: 'Role', className: 'whitespace-nowrap', render: (a) => <span className="text-stone-700">{ROLE_LABELS[a.role]}</span> },
    {
      key: 'login',
      label: 'Last sign-in',
      hideBelow: 'lg',
      className: 'whitespace-nowrap',
      render: (a) => <span className="text-stone-600">{a.last_login_at ? timeAgo(a.last_login_at) : 'Never'}</span>,
    },
    { key: 'status', label: 'Status', render: (a) => <ActiveBadge active={Boolean(a.is_active)} /> },
    {
      key: 'actions',
      label: <span className="sr-only">Actions</span>,
      className: 'md:w-px',
      render: (a) => (
        <div className="flex gap-0.5 md:justify-end">
          <IconAction label={`Edit ${a.name}`} onClick={() => setEditing(a)}>
            <Pencil size={16} />
          </IconAction>
          {a.id !== admin.id && (
            <IconAction label={`Reset password for ${a.name}`} onClick={() => setResetting(a)}>
              <KeyRound size={16} />
            </IconAction>
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="mx-auto max-w-6xl">
      <PageTitle
        title="Admin accounts"
        description="Who can sign in to the admin panel, and what they can do."
        action={
          <Button onClick={() => setEditing('new')}>
            <Plus size={17} aria-hidden="true" /> Add admin
          </Button>
        }
      />
      <DataTable loading={loading} error={error} rows={data} columns={columns} emptyText="No admins yet." />

      {editing && <AdminFormModal account={editing === 'new' ? null : editing} isSelf={editing !== 'new' && editing.id === admin.id} onClose={() => setEditing(null)} onSaved={saved} />}
      {resetting && <ResetPasswordModal account={resetting} onClose={() => setResetting(null)} onSaved={saved} />}
      <Toast message={toast} onDismiss={dismissToast} />
    </div>
  )
}
