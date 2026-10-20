import { BadgeCheck } from 'lucide-react'
import { formatDate } from '../utils/format'

export default function VerifiedBadge({ date, label = 'Verified' }) {
  if (!date) return null

  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-800 ring-1 ring-emerald-200">
      <BadgeCheck size={14} aria-hidden="true" />
      {label} {formatDate(date)}
    </span>
  )
}
