import { Link } from 'react-router-dom'
import { Building2, ChevronRight, Landmark } from 'lucide-react'
import { useI18n } from '../i18n/context'

export function AgencyTypeBadge({ isLocal }) {
  const { t } = useI18n()

  return (
    <span
      className={`inline-flex rounded-md px-2 py-0.5 text-xs font-semibold ring-1 ${
        isLocal ? 'bg-sun-50 text-sun-800 ring-sun-200' : 'bg-bay-50 text-bay-800 ring-bay-100'
      }`}
    >
      {isLocal ? t('agencyType.local') : t('agencyType.national')}
    </span>
  )
}

export default function AgencyRow({ agency }) {
  const { t } = useI18n()
  const isLocal = Boolean(agency.is_local_government)

  return (
    <li>
      <Link
        to={`/agencies/${agency.slug}`}
        className="group flex items-center gap-4 px-4 py-4 transition-colors hover:bg-bay-50/60 sm:px-5"
      >
        <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-stone-100 text-bay-700 group-hover:bg-white">
          {isLocal ? <Building2 size={21} aria-hidden="true" /> : <Landmark size={21} aria-hidden="true" />}
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="font-bold text-bay-950 group-hover:text-bay-700">{agency.name}</span>
            {agency.acronym && <span className="text-sm font-semibold text-stone-500">({agency.acronym})</span>}
          </span>
          <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-stone-500">
            <AgencyTypeBadge isLocal={isLocal} />
            <span>{t('common.guidesCount', { count: Number(agency.service_count ?? 0) })}</span>
            <span aria-hidden="true">·</span>
            <span>{t('common.officesCount', { count: Number(agency.office_count ?? 0) })}</span>
          </span>
        </span>
        <ChevronRight
          size={18}
          aria-hidden="true"
          className="shrink-0 text-stone-400 transition-transform group-hover:translate-x-0.5 group-hover:text-bay-600"
        />
      </Link>
    </li>
  )
}
