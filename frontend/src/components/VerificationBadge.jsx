import { BadgeCheck, CircleDashed, History, SearchCheck } from 'lucide-react'
import { formatDate } from '../utils/format'
import { useI18n } from '../i18n/context'

// Each status has its own icon and wording, so it never depends on color alone.
const STYLES = {
  verified: { icon: BadgeCheck, tone: 'bg-emerald-50 text-emerald-800 ring-emerald-200' },
  needs_review: { icon: SearchCheck, tone: 'bg-sun-50 text-sun-800 ring-sun-200' },
  unverified: { icon: CircleDashed, tone: 'bg-stone-100 text-stone-700 ring-stone-300' },
  outdated: { icon: History, tone: 'bg-rose-50 text-rose-800 ring-rose-200' },
}

export default function VerificationBadge({ status, date }) {
  const { t } = useI18n()
  const { icon: Icon, tone } = STYLES[status] ?? STYLES.unverified
  const label = t(`verification.${STYLES[status] ? status : 'unverified'}`)

  return (
    <span className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold ring-1 ${tone}`}>
      <Icon size={14} aria-hidden="true" />
      {status === 'verified' && date ? `${label} ${formatDate(date)}` : label}
    </span>
  )
}
