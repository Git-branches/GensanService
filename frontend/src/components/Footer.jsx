import { Link } from 'react-router-dom'
import { ExternalLink, KeyRound, RefreshCw, ShieldAlert } from 'lucide-react'
import Logo from './Logo'
import TunaBadge from './TunaBadge'
import { useI18n } from '../i18n/context'

const EXPLORE_LINKS = [
  { to: '/services', label: 'nav.services' },
  { to: '/agencies', label: 'footer.governmentAgencies' },
  { to: '/offices', label: 'footer.officeDirectory' },
]

const OFFICIAL_PORTALS = [
  { href: 'https://e.gov.ph', label: 'eGovPH' },
  { href: 'https://gensantos.gov.ph', label: 'City Government of General Santos' },
  { href: 'https://www.gov.ph', label: 'GOV.PH' },
]

// Icons for the footer.reminders messages, in the same order.
const REMINDER_ICONS = [ShieldAlert, RefreshCw, KeyRound]

function ColumnTitle({ children }) {
  return <h2 className="text-sm font-bold text-white">{children}</h2>
}

export default function Footer() {
  const { t } = useI18n()

  return (
    <footer className="mt-auto border-t-[3px] border-gold-line bg-navy text-navy-muted print:hidden [&_a:focus-visible]:outline-navy-active">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <Link to="/" aria-label={t('nav.homeLink')} className="inline-block">
              <Logo size="lg" tone="dark" />
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-relaxed">
              {t('footer.about')}
            </p>
            <div className="mt-6">
              <TunaBadge />
            </div>
          </div>

          <div className="lg:col-span-2">
            <ColumnTitle>{t('footer.explore')}</ColumnTitle>
            <ul className="mt-4 space-y-2.5 text-sm">
              {EXPLORE_LINKS.map((link) => (
                <li key={link.to}>
                  <Link to={link.to} className="text-navy-muted hover:text-navy-active hover:underline">
                    {t(link.label)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-3">
            <ColumnTitle>{t('footer.officialPortals')}</ColumnTitle>
            <ul className="mt-4 space-y-2.5 text-sm">
              {OFFICIAL_PORTALS.map((portal) => (
                <li key={portal.href}>
                  <a
                    href={portal.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-navy-muted hover:text-navy-active hover:underline"
                  >
                    {portal.label}{' '}
                    <ExternalLink size={13} aria-hidden="true" className="inline align-[-1px]" />
                    <span className="sr-only">{t('common.opensInNewTab')}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-3">
            <ColumnTitle>{t('footer.goodToKnow')}</ColumnTitle>
            <ul className="mt-4 space-y-3 text-sm">
              {t('footer.reminders').map((text, index) => {
                const Icon = REMINDER_ICONS[index]
                return (
                  <li key={text} className="flex gap-2.5">
                    <Icon size={16} aria-hidden="true" className="mt-0.5 shrink-0 text-navy-active" />
                    <span>{text}</span>
                  </li>
                )
              })}
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10 bg-bay-950 text-navy-muted">
        <div className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-4 text-xs sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>{t('footer.copyright', { year: new Date().getFullYear() })}</p>
          <p>{t('footer.notAffiliated')}</p>
        </div>
      </div>
    </footer>
  )
}
