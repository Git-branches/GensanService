import { useSyncExternalStore } from 'react'
import { Link } from 'react-router-dom'
import { Clock, Mail, MapPin, Navigation, Phone } from 'lucide-react'
import AgencyLogo from './AgencyLogo'
import VerifiedBadge from './VerifiedBadge'
import { mapsUrl, wazeUrl } from '../utils/format'
import { formatTime, groupHours, openStatus, parseWeeklyHours } from '../utils/hours'
import { useI18n } from '../i18n/context'

// The current minute, so "Open now" changes on its own. Pre-built pages have no clock, so they show nothing.
const everyMinute = (callback) => {
  const timer = setInterval(callback, 30_000)
  return () => clearInterval(timer)
}
const currentMinute = () => Math.floor(Date.now() / 60_000)
const noClock = () => null

function HoursText({ office, hours }) {
  const { t } = useI18n()
  if (office.opening_hours) return office.opening_hours
  if (!hours) return <span className="text-stone-500">{t('common.notYetVerified')}</span>
  const days = t('hours.days')
  return groupHours(hours)
    .map((group) => `${days[group.from - 1]}${group.to > group.from ? `–${days[group.to - 1]}` : ''} ${formatTime(group.open)}–${formatTime(group.close)}`)
    .join(', ')
}

// Shown only for verified offices, so residents never plan a trip around hours nobody confirmed.
function OpenNow({ hours }) {
  const { t } = useI18n()
  const minute = useSyncExternalStore(everyMinute, currentMinute, noClock)
  if (minute === null) return null
  const status = openStatus(hours, new Date(minute * 60_000))
  if (!status) return null

  const days = t('hours.days')
  const next = status.open
    ? t('hours.closes', { time: formatTime(status.closes) })
    : status.daysAhead === 0
      ? t('hours.opensToday', { time: formatTime(status.opens) })
      : status.daysAhead === 1
        ? t('hours.opensTomorrow', { time: formatTime(status.opens) })
        : t('hours.opensOn', { day: days[status.weekday - 1], time: formatTime(status.opens) })

  return (
    <span className="mt-1 flex flex-wrap items-center gap-x-2 text-sm">
      <span className={`inline-flex items-center gap-1.5 font-bold ${status.open ? 'text-emerald-700' : 'text-stone-700'}`}>
        <span aria-hidden="true" className={`h-2 w-2 rounded-full ${status.open ? 'bg-emerald-500' : 'bg-stone-400'}`} />
        {status.open ? t('hours.openNow') : t('hours.closedNow')}
      </span>
      <span className="text-stone-600">{next}</span>
      <span className="block w-full text-xs text-stone-500">{t('hours.note')}</span>
    </span>
  )
}

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

// embedded drops the card frame for use inside a section that is already a card, such as a guide's
// "Where to go": name and directions on the left, address and contact on the right from small screens up.
export default function OfficeCard({ office, agency, showAgency = true, embedded = false }) {
  const logoAgency = agency ?? {
    name: office.agency_name,
    acronym: office.agency_acronym,
    logo_url: office.agency_logo_url,
    is_local_government: office.agency_is_local,
  }
  const address = [office.address, office.barangay, office.city].filter(Boolean).join(', ')
  const verificationKnown = office.is_verified !== undefined
  const { t } = useI18n()
  const notVerified = <span className="text-stone-500">{t('common.notYetVerified')}</span>
  // A tel: link only works for one number, so a list of numbers stays plain text.
  const callable = office.contact_number && !/[/,;]/.test(office.contact_number)
  const hours = parseWeeklyHours(office.weekly_hours)

  const badge =
    verificationKnown &&
    (office.is_verified ? (
      <VerifiedBadge date={office.last_verified_at} />
    ) : (
      <span className="inline-flex rounded-md bg-sun-50 px-2 py-1 text-xs font-semibold text-sun-800 ring-1 ring-sun-200">
        {t('officeCard.notVerified')}
      </span>
    ))

  const identity = (
    <>
      <div className="flex items-start gap-3">
        <AgencyLogo agency={logoAgency} />
        <div className="min-w-0">
          <h3 className="text-lg font-bold leading-snug text-bay-950">{office.name}</h3>
          {office.branch_type && (
            <p className="mt-0.5 text-xs font-semibold text-stone-500">{t(`officeCard.${office.branch_type}`)}</p>
          )}
        </div>
      </div>
      {office.description && <p className="mt-3 text-sm leading-relaxed text-stone-600">{office.description}</p>}
    </>
  )

  const details = (
        <div className={`space-y-2.5 text-base text-stone-700 sm:text-sm ${embedded ? '' : 'mt-4'}`}>
          <InfoRow icon={MapPin} label={t('officeCard.address')}>
            {(office.address || office.barangay) ? address : notVerified}
          </InfoRow>
          <InfoRow icon={Clock} label={t('officeCard.hours')}>
            <HoursText office={office} hours={hours} />
            {hours && Boolean(office.is_verified) && <OpenNow hours={hours} />}
          </InfoRow>
          <InfoRow icon={Phone} label={t('officeCard.phone')}>
            {callable ? (
              <a href={`tel:${office.contact_number.replace(/[^\d+]/g, '')}`} className="inline-flex min-h-6 items-center font-semibold text-bay-700 hover:underline">
                {office.contact_number}
              </a>
            ) : (
              office.contact_number || notVerified
            )}
          </InfoRow>
          {office.email && (
            <InfoRow icon={Mail} label={t('officeCard.email')}>
              <a href={`mailto:${office.email}`} className="break-all text-bay-700 hover:underline">
                {office.email}
              </a>
            </InfoRow>
          )}
        </div>
  )

  const directions = (
    <div className={`grid grid-cols-2 gap-2 ${embedded ? 'sm:max-w-sm' : 'mt-auto pt-5'}`}>
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
  )

  if (embedded) {
    // Phones: name, details, directions. Wider: name and directions left, details right.
    return (
      <article className="grid gap-4 sm:grid-cols-2 sm:grid-rows-[auto_1fr] sm:gap-x-8 sm:gap-y-5">
        <div className="min-w-0">
          {identity}
          {badge && <div className="mt-3">{badge}</div>}
        </div>
        <div className="min-w-0 sm:col-start-2 sm:row-span-2 sm:row-start-1 sm:border-l sm:border-stone-100 sm:pl-8">{details}</div>
        <div className="sm:self-end">{directions}</div>
      </article>
    )
  }

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
        {badge}
      </div>

      <div className="flex flex-1 flex-col p-5">
        {identity}
        {details}

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

        {directions}
      </div>
    </article>
  )
}
