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
]

function desktopLinkClass({ isActive }) {
  return `relative px-3 py-5 text-sm font-semibold transition-colors after:absolute after:inset-x-3 after:bottom-0 after:h-[3px] after:rounded-t-full ${
    isActive ? 'text-bay-700 after:bg-sun-400' : 'text-stone-600 after:bg-transparent hover:text-bay-700'
  }`
}

export default function Header() {
  const { t } = useI18n()
  const [menuOpen, setMenuOpen] = useState(false)
  const closeMenu = () => setMenuOpen(false)

  return (
    <>
      <div className="border-b border-stone-200 bg-white text-xs text-stone-600 print:hidden">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-2 sm:px-6">
          <p className="flex items-center gap-1.5">
            <Info size={14} aria-hidden="true" className="shrink-0 text-bay-600" />
            <span>
              {t('topbar.independent')}<span className="hidden sm:inline">{t('topbar.notOfficial')}</span>
            </span>
          </p>
          <div className="flex items-center gap-4">
            <p className="hidden items-center gap-1.5 text-stone-700 sm:flex">
              <Clock size={14} aria-hidden="true" className="shrink-0 text-bay-600" />
              <PhilippineTime />
            </p>
            <LanguageSwitcher />
          </div>
        </div>
      </div>

      <header className="sticky top-0 z-40 border-b border-stone-200 bg-white/95 backdrop-blur print:hidden">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link to="/" onClick={closeMenu} aria-label={t('nav.homeLink')} className="py-3">
            <Logo subtitle={t('logo.subtitle')} />
          </Link>

          <nav aria-label={t('nav.main')} className="hidden items-center md:flex">
            {NAV_LINKS.map((link) => (
              <NavLink key={link.to} to={link.to} end={link.end} className={desktopLinkClass}>
                {t(link.label)}
              </NavLink>
            ))}
          </nav>

          <Link
            to="/services"
            className="hidden items-center gap-2 rounded-lg border border-bay-200 px-4 py-2 text-sm font-semibold text-bay-700 transition-colors hover:border-bay-300 hover:bg-bay-50 lg:inline-flex"
          >
            <Search size={16} aria-hidden="true" /> {t('nav.searchGuides')}
          </Link>

          <button
            type="button"
            className="rounded-lg p-2 text-stone-700 hover:bg-stone-100 md:hidden"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label={menuOpen ? t('nav.closeMenu') : t('nav.openMenu')}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {menuOpen && (
          <nav id="mobile-menu" aria-label={t('nav.main')} className="border-t border-stone-200 bg-white px-4 py-3 md:hidden">
            <ul className="space-y-1">
              {NAV_LINKS.map((link) => (
                <li key={link.to}>
                  <NavLink
                    to={link.to}
                    end={link.end}
                    onClick={closeMenu}
                    className={({ isActive }) =>
                      `flex items-center rounded-lg border-l-4 px-4 py-3 text-base font-semibold ${
                        isActive
                          ? 'border-sun-400 bg-bay-50 text-bay-800'
                          : 'border-transparent text-stone-700 hover:bg-stone-50'
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
