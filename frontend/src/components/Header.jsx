import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { Clock, Info, Menu, Search, X } from 'lucide-react'
import Logo from './Logo'
import LanguageSwitcher from './LanguageSwitcher'
import PhilippineTime from './PhilippineTime'
import { useI18n } from '../i18n/context'

const NAV_LINKS = [
  { to: '/', label: 'common.home', end: true },
  { to: '/services', label: 'nav.services' },
  { to: '/agencies', label: 'nav.agencies' },
  { to: '/offices', label: 'nav.offices' },
  { to: '/faq', label: 'nav.faq' },
]

// Gold outline for keyboard focus on the navy bar.
const FOCUS_RING = 'focus-visible:outline-2 focus-visible:outline-navy-active'

function desktopLinkClass({ isActive }) {
  return `relative whitespace-nowrap px-3 py-5 text-sm font-semibold transition-colors after:absolute after:inset-x-3 after:bottom-0 after:h-[3px] after:rounded-t-full focus-visible:outline-offset-[-4px] ${FOCUS_RING} ${
    isActive ? 'text-navy-active after:bg-navy-active' : 'text-white/85 after:bg-transparent hover:text-white'
  }`
}

export default function Header() {
  const { t } = useI18n()
  const [menuOpen, setMenuOpen] = useState(false)
  const closeMenu = () => setMenuOpen(false)

  return (
    <>
      <div className="border-t-[3px] border-b border-t-gold-line border-b-line bg-mist text-xs text-ink print:hidden">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-2 sm:px-6">
          <p className="flex items-center gap-1.5">
            <Info size={14} aria-hidden="true" className="shrink-0 text-bay-700" />
            <span>
              {t('topbar.independent')}<span className="hidden sm:inline">{t('topbar.notOfficial')}</span>
            </span>
          </p>
          <div className="flex items-center gap-4">
            <p className="hidden items-center gap-1.5 sm:flex">
              <Clock size={14} aria-hidden="true" className="shrink-0 text-bay-700" />
              <PhilippineTime />
            </p>
            <LanguageSwitcher />
          </div>
        </div>
      </div>

      <header className="sticky top-0 z-40 bg-navy print:hidden">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link
            to="/"
            onClick={closeMenu}
            aria-label={t('nav.homeLink')}
            className={`rounded-md py-3 focus-visible:outline-offset-2 ${FOCUS_RING}`}
          >
            <Logo subtitle={t('logo.subtitle')} tone="dark" />
          </Link>

          <nav aria-label={t('nav.main')} className="hidden shrink-0 items-center md:flex">
            {NAV_LINKS.map((link) => (
              <NavLink key={link.to} to={link.to} end={link.end} className={desktopLinkClass}>
                {t(link.label)}
              </NavLink>
            ))}
          </nav>

          <Link
            to="/services"
            className={`hidden shrink-0 items-center gap-2 whitespace-nowrap rounded-lg border border-white/30 bg-transparent px-4 py-2 text-sm font-semibold text-white transition-colors hover:border-navy-active hover:text-navy-active focus-visible:outline-offset-2 lg:inline-flex ${FOCUS_RING}`}
          >
            <Search size={16} aria-hidden="true" /> {t('nav.searchGuides')}
          </Link>

          <button
            type="button"
            className={`rounded-lg p-2 text-white transition-colors hover:bg-white/10 md:hidden ${FOCUS_RING}`}
            onClick={() => setMenuOpen((open) => !open)}
            aria-label={menuOpen ? t('nav.closeMenu') : t('nav.openMenu')}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {menuOpen && (
          <nav id="mobile-menu" aria-label={t('nav.main')} className="border-t border-white/10 bg-navy px-4 py-3 md:hidden">
            <ul className="space-y-1">
              {NAV_LINKS.map((link) => (
                <li key={link.to}>
                  <NavLink
                    to={link.to}
                    end={link.end}
                    onClick={closeMenu}
                    className={({ isActive }) =>
                      `flex items-center rounded-lg border-l-4 px-4 py-3 text-base font-semibold ${FOCUS_RING} ${
                        isActive
                          ? 'border-navy-active bg-white/5 text-navy-active'
                          : 'border-transparent text-white/90 hover:bg-white/5 hover:text-white'
                      }`
                    }
                  >
                    {t(link.label)}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </header>
    </>
  )
}
