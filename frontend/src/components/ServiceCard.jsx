import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import AgencyLogo from './AgencyLogo'
import VerificationBadge from './VerificationBadge'
import { renderCategoryIcon } from '../utils/icons'
import { useI18n } from '../i18n/context'

export default function ServiceCard({ service }) {
  const { t } = useI18n()
  const agency = {
    name: service.agency_name,
    acronym: service.agency_acronym,
    logo_url: service.agency_logo_url,
    is_local_government: service.agency_is_local,
  }

  return (
    <Link
      to={`/services/${service.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-xl border border-stone-200 bg-white transition-shadow hover:border-bay-300 hover:shadow-md"
    >
      <div className="flex items-center gap-2 border-b border-stone-100 bg-stone-50 px-5 py-2.5 text-xs font-semibold text-stone-600">
        <span className="text-bay-700">{renderCategoryIcon(service.category_icon, { size: 15 })}</span>
        {service.category_name}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center gap-3">
          <AgencyLogo agency={agency} />
          <p className="min-w-0 text-xs font-bold uppercase tracking-wide text-sun-700">
            {service.agency_acronym || service.agency_name}
          </p>
        </div>
        <h3 className="mt-3 text-lg font-bold leading-snug text-bay-950 group-hover:text-bay-700">{service.title}</h3>
        {service.summary && <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-stone-600">{service.summary}</p>}

        <div className="mt-auto flex items-center justify-between gap-3 pt-5">
          <VerificationBadge status={service.verification_status} date={service.last_verified_at} />
          <span className="inline-flex items-center gap-0.5 text-sm font-semibold text-bay-700">
            {t('serviceCard.viewGuide')}
            <ChevronRight size={16} aria-hidden="true" className="transition-transform group-hover:translate-x-0.5" />
          </span>
        </div>
      </div>
    </Link>
  )
}
