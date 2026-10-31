import { Link } from 'react-router-dom'
import { Clock, Mail, MapPin, Navigation, Phone } from 'lucide-react'
import VerifiedBadge from './VerifiedBadge'
import { mapsUrl, wazeUrl } from '../utils/format'
import { useI18n } from '../i18n/context'

function InfoRow({ icon: Icon, label, children }) {
  return (
    <div className="flex gap-3">
      <Icon size={17} aria-hidden="true" className="mt-0.5 shrink-0 text-bay-600" />
      <div className="min-w-0">
        <span className="sr-only">{label}: </span>
        {children}
      </div>
    </div>
  )
}

export default function OfficeCard({ office, showAgency = true }) {
  const address = [office.address, office.barangay, office.city].filter(Boolean).join(', ')
  const verificationKnown = office.is_verified !== undefined
  const { t } = useI18n()

  return (
    <article className="flex h-full flex-col rounded-xl border border-stone-200 bg-white">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-100 px-5 py-3">
        {showAgency && office.agency_slug ? (
          <Link
            to={`/agencies/${office.agency_slug}`}
            className="inline-flex min-h-6 items-center text-xs font-bold uppercase tracking-wide text-sun-700 hover:underline"
          >
            {office.agency_acronym || office.agency_name}
          </Link>
        ) : (
          <span className="text-xs font-bold uppercase tracking-wide text-stone-500">{t('officeCard.office')}</span>
        )}
        {verificationKnown &&
          (office.is_verified ? (
            <VerifiedBadge date={office.last_verified_at} />
          ) : (
            <span className="rounded-md bg-sun-50 px-2 py-1 text-xs font-semibold text-sun-800 ring-1 ring-sun-200">
              {t('officeCard.notVerified')}
            </span>
          ))}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-lg font-bold leading-snug text-bay-950">{office.name}</h3>
        {office.branch_type && (
          <p className="mt-0.5 text-xs font-semibold text-stone-500">{t(`officeCard.${office.branch_type}`)}</p>
        )}
        {office.description && <p className="mt-2 text-sm leading-relaxed text-stone-600">{office.description}</p>}

        <div className="mt-4 space-y-2.5 text-base text-stone-700 sm:text-sm">
          {address && (
            <InfoRow icon={MapPin} label={t('officeCard.address')}>
              {address}
            </InfoRow>
          )}
          {office.opening_hours && (
            <InfoRow icon={Clock} label={t('officeCard.hours')}>
              {office.opening_hours}
            </InfoRow>
          )}
          {office.contact_number && (
            <InfoRow icon={Phone} label={t('officeCard.phone')}>
              {office.contact_number}
            </InfoRow>
          )}
          {office.email && (
            <InfoRow icon={Mail} label={t('officeCard.email')}>
              <a href={`mailto:${office.email}`} className="break-all text-bay-700 hover:underline">
                {office.email}
              </a>
            </InfoRow>
          )}
        </div>

        {office.services?.length > 0 && (
          <div className="mt-4">
            <p className="text-xs font-bold uppercase tracking-wide text-stone-500">{t('officeCard.guidesHere')}</p>
            <ul className="mt-1 text-sm">
              {office.services.map((guide) => (
                <li key={guide.slug}>
                  <Link to={`/services/${guide.slug}`} className="inline-flex min-h-11 items-center font-medium text-bay-700 hover:underline">
                    {guide.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-auto grid grid-cols-2 gap-2 pt-5">
          <a
            href={mapsUrl(office)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-lg bg-bay-700 px-3 text-sm font-semibold text-white transition-colors hover:bg-bay-800"
          >
            <MapPin size={15} aria-hidden="true" /> {t('officeCard.maps')}
            <span className="sr-only">{t('common.opensInNewTab')}</span>
          </a>
          <a
            href={wazeUrl(office)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-lg border border-stone-300 px-3 text-sm font-semibold text-stone-700 transition-colors hover:bg-stone-50"
          >
            <Navigation size={15} aria-hidden="true" /> {t('officeCard.waze')}
            <span className="sr-only">{t('common.opensInNewTab')}</span>
          </a>
        </div>
      </div>
    </article>
  )
}
