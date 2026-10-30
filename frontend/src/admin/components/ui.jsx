import { Link } from 'react-router-dom'
import { Loader2 } from 'lucide-react'

const STATUS_STYLES = {
  draft: { pill: 'bg-stone-100 text-stone-700', dot: 'bg-stone-400' },
  for_review: { pill: 'bg-sun-50 text-sun-800', dot: 'bg-sun-500' },
  approved: { pill: 'bg-bay-50 text-bay-800', dot: 'bg-bay-500' },
  published: { pill: 'bg-emerald-50 text-emerald-700', dot: 'bg-emerald-500' },
  archived: { pill: 'bg-rose-50 text-rose-700', dot: 'bg-rose-400' },
}

const STATUS_LABELS = { draft: 'Draft', for_review: 'For review', approved: 'Approved', published: 'Published', archived: 'Archived' }

export function StatusBadge({ status }) {
  const style = STATUS_STYLES[status] || STATUS_STYLES.draft
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ${style.pill}`}>
      <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
      {STATUS_LABELS[status] || status}
    </span>
  )
}

export const inputClass =
  'w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 placeholder:text-stone-400 focus:border-bay-500 focus:outline-none focus:ring-2 focus:ring-bay-500/20 disabled:bg-stone-50 disabled:text-stone-500 aria-[invalid=true]:border-red-400'

export function Field({ id, label, hint, error, required, children }) {
  return (
    <div>
      <label htmlFor={id} className="text-sm font-semibold text-stone-700">
        {label}
        {required && <span className="text-red-600"> *</span>}
      </label>
      {hint && <p className="mt-0.5 text-xs text-stone-500">{hint}</p>}
      <div className="mt-1.5">{children}</div>
      {error && (
        <p id={`${id}-error`} className="mt-1 text-xs font-medium text-red-600">
          {error}
        </p>
      )}
    </div>
  )
}

export function Button({ variant = 'primary', loading = false, className = '', children, ...props }) {
  const styles = {
    primary: 'bg-bay-700 text-white hover:bg-bay-800 disabled:bg-bay-700/60',
    secondary: 'border border-stone-300 bg-white text-stone-700 hover:bg-stone-50 disabled:text-stone-400',
    success: 'bg-emerald-600 text-white hover:bg-emerald-700 disabled:bg-emerald-600/60',
    danger: 'border border-rose-200 bg-white text-rose-700 hover:bg-rose-50 disabled:text-rose-300',
    dangerSolid: 'bg-rose-600 text-white hover:bg-rose-700 disabled:bg-rose-600/60',
  }
  return (
    <button
      type="button"
      disabled={loading || props.disabled}
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed ${styles[variant]} ${className}`}
      {...props}
    >
      {loading && <Loader2 size={15} className="animate-spin" aria-hidden="true" />}
      {children}
    </button>
  )
}

// Borderless white panel: separation comes from a soft shadow instead of outline lines.
export const SURFACE = 'rounded-2xl bg-white shadow-sm shadow-stone-900/5'

export function ActiveBadge({ active }) {
  return active ? (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
      <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Active
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-stone-100 px-2.5 py-0.5 text-xs font-semibold text-stone-600">
      <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-stone-400" /> Inactive
    </span>
  )
}

export function IconAction({ label, onClick, to, href, tone = 'default', children }) {
  const styles = {
    default: 'text-stone-500 hover:bg-bay-50 hover:text-bay-700',
    danger: 'text-stone-500 hover:bg-rose-50 hover:text-rose-600',
    success: 'text-stone-500 hover:bg-emerald-50 hover:text-emerald-700',
  }
  const className = `inline-flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${styles[tone]}`

  if (href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" aria-label={`${label} (opens in a new tab)`} title={label} className={className}>
        {children}
      </a>
    )
  }
  if (to) {
    return (
      <Link to={to} aria-label={label} title={label} className={className}>
        {children}
      </Link>
    )
  }
  return (
    <button type="button" onClick={onClick} aria-label={label} title={label} className={className}>
      {children}
    </button>
  )
}

export function Switch({ id, checked, onChange, label, description, error }) {
  return (
    <div>
      <div className="flex items-start justify-between gap-4 rounded-lg bg-stone-50 px-4 py-3">
        <div>
          <label htmlFor={id} className="text-sm font-semibold text-stone-800">
            {label}
          </label>
          {description && <p className="mt-0.5 text-xs text-stone-500">{description}</p>}
        </div>
        <button
          id={id}
          type="button"
          role="switch"
          aria-checked={checked}
          onClick={() => onChange(!checked)}
          className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:opacity-50 ${
            checked ? 'bg-bay-600' : 'bg-stone-300'
          }`}
        >
          <span className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-5.5' : 'translate-x-0.5'}`} />
        </button>
      </div>
      {error && <p className="mt-1 text-xs font-medium text-red-600">{error}</p>}
    </div>
  )
}

export function PageTitle({ title, description, action }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-bay-950">{title}</h1>
        {description && <p className="mt-1 text-sm text-stone-600">{description}</p>}
      </div>
      {action}
    </div>
  )
}

export function Card({ title, description, children, actions }) {
  return (
    <section className={SURFACE}>
      <div className="flex flex-wrap items-start justify-between gap-3 px-6 pt-5">
        <div>
          <h2 className="text-base font-bold text-bay-950">{title}</h2>
          {description && <p className="mt-0.5 text-sm text-stone-500">{description}</p>}
        </div>
        {actions}
      </div>
      <div className="space-y-4 px-6 pb-6 pt-4">{children}</div>
    </section>
  )
}
