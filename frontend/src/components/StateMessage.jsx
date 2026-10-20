import { Link } from 'react-router-dom'
import { AlertCircle, Inbox, Loader2 } from 'lucide-react'

export function LoadingState({ label = 'Loading...' }) {
  return (
    <div role="status" className="flex items-center justify-center gap-2 py-20 text-stone-500">
      <Loader2 className="animate-spin text-bay-600" size={20} aria-hidden="true" />
      <span>{label}</span>
    </div>
  )
}

export function CardGridSkeleton({ count = 6, className = 'sm:grid-cols-2 lg:grid-cols-3' }) {
  return (
    <div role="status" aria-label="Loading" className={`grid grid-cols-1 gap-4 ${className}`}>
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="animate-pulse overflow-hidden rounded-xl border border-stone-200 bg-white">
          <div className="h-9 bg-stone-50" />
          <div className="space-y-3 p-5">
            <div className="h-3 w-1/4 rounded bg-stone-100" />
            <div className="h-4 w-3/4 rounded bg-stone-200" />
            <div className="h-3 w-full rounded bg-stone-100" />
            <div className="h-3 w-5/6 rounded bg-stone-100" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function ErrorState({ message = 'Something went wrong. Please try again.', action }) {
  return (
    <div role="alert" className="flex flex-col items-center gap-3 rounded-xl border border-red-200 bg-red-50/50 px-6 py-14 text-center">
      <AlertCircle className="text-red-600" size={28} aria-hidden="true" />
      <p className="max-w-md text-stone-700">{message}</p>
      {action && (
        <Link to={action.to} className="text-sm font-semibold text-bay-700 hover:underline">
          {action.label}
        </Link>
      )}
    </div>
  )
}

export function EmptyState({ title = 'Nothing to show yet', message, children }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border-2 border-dashed border-stone-200 bg-white px-6 py-14 text-center">
      <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-bay-50 text-bay-600">
        <Inbox size={22} aria-hidden="true" />
      </span>
      <p className="text-lg font-bold text-bay-950">{title}</p>
      {message && <p className="max-w-md text-sm text-stone-600">{message}</p>}
      {children}
    </div>
  )
}
