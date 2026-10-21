import { useState } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { AlertCircle, Eye, EyeOff, ShieldCheck } from 'lucide-react'
import { LogoMark } from '../../components/Logo'
import { usePageTitle } from '../../hooks/usePageTitle'
import { useAdminAuth } from '../auth'
import { Button, Field, inputClass } from '../components/ui'

export default function AdminLoginPage() {
  usePageTitle('Admin sign in')
  const { status, login } = useAdminAuth()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (status === 'signedIn') {
    const from = location.state?.from
    return <Navigate to={from && from.startsWith('/admin') ? from : '/admin/services'} replace />
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await login(email.trim(), password)
    } catch (err) {
      setError(err.message)
      setPassword('')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-bay-50 via-white to-sun-50 px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center text-center">
          <LogoMark className="h-12 w-12" />
          <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-bay-950">Admin sign in</h1>
          <p className="mt-1 text-sm text-stone-600">Andam GenSan content management</p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4 rounded-2xl bg-white p-6 shadow-xl shadow-bay-900/10">
          {error && (
            <p role="alert" className="flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-700">
              <AlertCircle size={17} aria-hidden="true" className="mt-0.5 shrink-0" />
              {error}
            </p>
          )}

          <Field id="admin-email" label="Email">
            <input
              id="admin-email"
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className={inputClass}
            />
          </Field>

          <Field id="admin-password" label="Password">
            <div className="relative">
              <input
                id="admin-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className={`${inputClass} pr-10`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((shown) => !shown)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-stone-500 hover:text-stone-700"
              >
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          </Field>

          <Button type="submit" loading={submitting} className="w-full py-2.5">
            Sign in
          </Button>
        </form>

        <p className="mt-6 flex items-center justify-center gap-1.5 text-xs text-stone-500">
          <ShieldCheck size={14} aria-hidden="true" /> Authorized staff only. Activity is logged.
        </p>
        <p className="mt-2 text-center text-xs">
          <Link to="/" className="text-bay-700 hover:underline">
            Back to the public site
          </Link>
        </p>
      </div>
    </div>
  )
}
