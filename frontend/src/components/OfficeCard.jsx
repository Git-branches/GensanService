import { Link } from 'react-router-dom'
import { Clock, Mail, MapPin, Navigation, Phone } from 'lucide-react'
import VerifiedBadge from './VerifiedBadge'
import { mapsUrl, wazeUrl } from '../utils/format'

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

  return (
    <article className="flex h-full flex-col rounded-xl border border-stone-200 bg-white">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-100 px-5 py-3">
        {showAgency && office.agency_slug ? (
          <Link
            to={`/agencies/${office.agency_slug}`}
            className="text-xs font-bold uppercase tracking-wide text-sun-700 hover:underline"
          >
            {office.agency_acronym || office.agency_name}
          </Link>
        ) : (
          <span className="text-xs font-bold uppercase tracking-wide text-stone-500">Office</span>
        )}
        {verificationKnown &&
          (office.is_verified ? (
            <VerifiedBadge date={office.last_verified_at} />
          ) : (
            <span className="rounded-md bg-sun-50 px-2 py-1 text-xs font-semibold text-sun-800 ring-1 ring-sun-200">
              Details not yet verified
            </span>
          ))}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-lg font-bold leading-snug text-bay-950">{office.name}</h3>

        <div className="mt-4 space-y-2.5 text-sm text-stone-700">
          {address && (
            <InfoRow icon={MapPin} label="Address">
              {address}
            </InfoRow>
          )}
          {office.opening_hours && (
            <InfoRow icon={Clock} label="Office hours">
              {office.opening_hours}
            </InfoRow>
          )}
          {office.contact_number && (
            <InfoRow icon={Phone} label="Phone">
              {office.contact_number}
            </InfoRow>
          )}
          {office.email && (
            <InfoRow icon={Mail} label="Email">
              <a href={`mailto:${office.email}`} className="break-all text-bay-700 hover:underline">
                {office.email}
              </a>
            </InfoRow>
          )}
        </div>

        <div className="mt-auto grid grid-cols-2 gap-2 pt-5">
          <a
            href={mapsUrl(office)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-bay-700 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-bay-800"
          >
            <MapPin size={15} aria-hidden="true" /> Google Maps
            <span className="sr-only">(opens in a new tab)</span>
          </a>
          <a
            href={wazeUrl(office)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-stone-300 px-3 py-2 text-sm font-semibold text-stone-700 transition-colors hover:bg-stone-50"
          >
            <Navigation size={15} aria-hidden="true" /> Waze
            <span className="sr-only">(opens in a new tab)</span>
          </a>
        </div>
      </div>
    </article>
  )
}
