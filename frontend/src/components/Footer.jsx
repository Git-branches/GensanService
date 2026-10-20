import { Link } from 'react-router-dom'
import { ExternalLink, KeyRound, RefreshCw, ShieldAlert } from 'lucide-react'
import Logo from './Logo'
import TunaBadge from './TunaBadge'

const EXPLORE_LINKS = [
  { to: '/services', label: 'Service guides' },
  { to: '/agencies', label: 'Government agencies' },
  { to: '/offices', label: 'Office directory' },
]

const OFFICIAL_PORTALS = [
  { href: 'https://e.gov.ph', label: 'eGovPH' },
  { href: 'https://gensantos.gov.ph', label: 'City Government of General Santos' },
  { href: 'https://www.gov.ph', label: 'GOV.PH' },
]

const REMINDERS = [
  { icon: ShieldAlert, text: 'This is not an official government website. Information is for guidance only.' },
  { icon: RefreshCw, text: 'Requirements can change. Confirm with the responsible agency.' },
  { icon: KeyRound, text: 'We never ask for your government account passwords or OTPs.' },
]

function ColumnTitle({ children }) {
  return <h2 className="text-sm font-bold text-bay-950">{children}</h2>
}

export default function Footer() {
  return (
    <footer className="mt-auto border-t-4 border-sun-400 bg-stone-100 print:hidden">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <Link to="/" aria-label="Andam GenSan home" className="inline-block">
              <Logo size="lg" />
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-stone-600">
              An independent community guide to government requirements, checklists, and offices for residents
              of General Santos City.
            </p>
            <div className="mt-6">
              <TunaBadge />
            </div>
          </div>

          <div className="lg:col-span-2">
            <ColumnTitle>Explore</ColumnTitle>
            <ul className="mt-4 space-y-2.5 text-sm">
              {EXPLORE_LINKS.map((link) => (
                <li key={link.to}>
                  <Link to={link.to} className="text-stone-600 hover:text-bay-700 hover:underline">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-3">
            <ColumnTitle>Official portals</ColumnTitle>
            <ul className="mt-4 space-y-2.5 text-sm">
              {OFFICIAL_PORTALS.map((portal) => (
                <li key={portal.href}>
                  <a
                    href={portal.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-stone-600 hover:text-bay-700 hover:underline"
                  >
                    {portal.label}{' '}
                    <ExternalLink size={13} aria-hidden="true" className="inline align-[-1px]" />
                    <span className="sr-only">(opens in a new tab)</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-3">
            <ColumnTitle>Good to know</ColumnTitle>
            <ul className="mt-4 space-y-3 text-sm text-stone-600">
              {REMINDERS.map(({ icon: Icon, text }) => (
                <li key={text} className="flex gap-2.5">
                  <Icon size={16} aria-hidden="true" className="mt-0.5 shrink-0 text-sun-600" />
                  <span>{text}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="bg-bay-900 text-bay-100">
        <div className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-4 text-xs sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>&copy; {new Date().getFullYear()} Andam GenSan — independent community project.</p>
          <p>Not affiliated with any government agency.</p>
        </div>
      </div>
    </footer>
  )
}
