import { Link } from 'react-router-dom'
import { ChevronRight, CircleHelp, FileText, Globe, MapPin } from 'lucide-react'
import AgencyLogo from './AgencyLogo'
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

const PRESENCE_ICONS = { physical_office: MapPin, online_only: Globe, unconfirmed: CircleHelp }

// Not every national agency has an office here, so the label says what is confirmed.
export function AgencyPresence({ presence }) {
  const { t } = useI18n()
  const Icon = PRESENCE_ICONS[presence] ?? CircleHelp

  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-stone-600">
      <Icon size={13} aria-hidden="true" className="shrink-0" />
      {t(`agencyPresence.${PRESENCE_ICONS[presence] ? presence : 'unconfirmed'}`)}
    </span>
  )
}

export default function AgencyCard({ agency }) {
  const { t } = useI18n()

  return (
    <Link
      to={`/agencies/${agency.slug}`}
      className="group flex h-full flex-col rounded-xl border border-stone-200 bg-white p-5 transition-shadow hover:border-bay-300 hover:shadow-md"
    >
      <div className="flex flex-1 items-start gap-4">
        <AgencyLogo agency={agency} />
        <div className="min-w-0">
          {agency.acronym && (
            <p className="text-xs font-bold uppercase tracking-wide text-sun-700">{agency.acronym}</p>
          )}
          <h3 className="mt-0.5 font-bold leading-snug text-bay-950 group-hover:text-bay-700">{agency.name}</h3>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
            <AgencyTypeBadge isLocal={Boolean(agency.is_local_government)} />
            <AgencyPresence presence={agency.presence} />
          </div>
        </div>
      </div>

      <div className="mt-5 flex items-center gap-4 border-t border-stone-100 pt-4 text-sm text-stone-600">
        <span className="inline-flex items-center gap-1.5">
          <FileText size={15} aria-hidden="true" className="text-bay-600" />
          {t('common.guidesCount', { count: Number(agency.service_count ?? 0) })}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <MapPin size={15} aria-hidden="true" className="text-bay-600" />
          {t('common.officesCount', { count: Number(agency.office_count ?? 0) })}
        </span>
        <ChevronRight
          size={18}
          aria-hidden="true"
          className="ml-auto shrink-0 text-stone-400 transition-transform group-hover:translate-x-0.5 group-hover:text-bay-600"
        />
      </div>
    </Link>
  )
}
