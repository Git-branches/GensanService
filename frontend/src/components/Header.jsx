import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { Clock, Info, Menu, Search, X } from 'lucide-react'
import Logo from './Logo'
import PhilippineTime from './PhilippineTime'

const NAV_LINKS = [
  { to: '/', label: 'Home', end: true },
  { to: '/services', label: 'Service guides' },
  { to: '/agencies', label: 'Agencies' },
  { to: '/offices', label: 'Offices' },
]

function desktopLinkClass({ isActive }) {
  return `relative px-3 py-5 text-sm font-semibold transition-colors after:absolute after:inset-x-3 after:bottom-0 after:h-[3px] after:rounded-t-full ${
    isActive ? 'text-bay-700 after:bg-sun-400' : 'text-stone-600 after:bg-transparent hover:text-bay-700'
  }`
}

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false)
  const closeMenu = () => setMenuOpen(false)

  return (
    <>
      <div className="border-b border-stone-200 bg-white text-xs text-stone-600 print:hidden">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-2 sm:px-6">
          <p className="flex items-center gap-1.5">
            <Info size={14} aria-hidden="true" className="shrink-0 text-bay-600" />
            <span>
              Independent guide<span className="hidden sm:inline"> — not an official government website</span>
            </span>
          </p>
          <p className="flex items-center gap-1.5 text-stone-700">
            <Clock size={14} aria-hidden="true" className="shrink-0 text-bay-600" />
            <PhilippineTime />
          </p>
        </div>
      </div>

      <header className="sticky top-0 z-40 border-b border-stone-200 bg-white/95 backdrop-blur print:hidden">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link to="/" onClick={closeMenu} aria-label="Andam GenSan home" className="py-3">
            <Logo subtitle="Be ready before you go · General Santos City" />
          </Link>

          <nav aria-label="Main" className="hidden items-center md:flex">
            {NAV_LINKS.map((link) => (
              <NavLink key={link.to} to={link.to} end={link.end} className={desktopLinkClass}>
                {link.label}
              </NavLink>
            ))}
          </nav>

          <Link
            to="/services"
            className="hidden items-center gap-2 rounded-lg border border-bay-200 px-4 py-2 text-sm font-semibold text-bay-700 transition-colors hover:border-bay-300 hover:bg-bay-50 lg:inline-flex"
          >
            <Search size={16} aria-hidden="true" /> Search guides
          </Link>

          <button
            type="button"
            className="rounded-lg p-2 text-stone-700 hover:bg-stone-100 md:hidden"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {menuOpen && (
          <nav id="mobile-menu" aria-label="Main" className="border-t border-stone-200 bg-white px-4 py-3 md:hidden">
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
                    {link.label}
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
