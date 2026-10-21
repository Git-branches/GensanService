import { useState } from 'react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { ExternalLink, FileText, Landmark, LayoutGrid, LogOut, MapPin, Menu, X } from 'lucide-react'
import { LogoMark } from '../components/Logo'
import { ROLE_LABELS, useAdminAuth } from './auth'

const NAV_ITEMS = [
  { to: '/admin/services', label: 'Service guides', icon: FileText },
  { to: '/admin/agencies', label: 'Agencies', icon: Landmark },
  { to: '/admin/offices', label: 'Offices', icon: MapPin },
  { to: '/admin/categories', label: 'Categories', icon: LayoutGrid },
]

function Sidebar({ onNavigate }) {
  return (
    <nav aria-label="Admin" className="flex h-full flex-col gap-1 p-4">
      <Link to="/admin" onClick={onNavigate} className="mb-6 flex items-center gap-3 px-2 py-1">
        <LogoMark className="h-9 w-9" />
        <span className="leading-tight">
          <span className="block font-extrabold tracking-tight text-white">Andam GenSan</span>
          <span className="block text-xs font-semibold uppercase tracking-wide text-sun-300">Admin</span>
        </span>
      </Link>

      {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          onClick={onNavigate}
          className={({ isActive }) =>
            `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors ${
              isActive ? 'bg-white/10 text-white' : 'text-bay-100 hover:bg-white/5 hover:text-white'
            }`
          }
        >
          <Icon size={18} aria-hidden="true" />
          {label}
        </NavLink>
      ))}

      <a
        href="/"
        target="_blank"
        rel="noopener noreferrer"
        className="mt-auto flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-bay-200 hover:bg-white/5 hover:text-white"
      >
        <ExternalLink size={17} aria-hidden="true" /> View public site
      </a>
    </nav>
  )
}

export default function AdminLayout() {
  const { admin, logout } = useAdminAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const [signingOut, setSigningOut] = useState(false)

  async function handleLogout() {
    setSigningOut(true)
    await logout()
  }

  return (
    <div className="min-h-screen bg-stone-50 lg:pl-64">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 bg-bay-950 lg:block">
        <Sidebar />
      </aside>

      {menuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button type="button" aria-label="Close menu" className="absolute inset-0 bg-bay-950/50" onClick={() => setMenuOpen(false)} />
          <aside className="relative h-full w-64 bg-bay-950">
            <Sidebar onNavigate={() => setMenuOpen(false)} />
          </aside>
        </div>
      )}

      <header className="sticky top-0 z-20 flex items-center justify-between gap-4 bg-white/90 px-4 py-3 shadow-sm shadow-stone-900/5 backdrop-blur sm:px-6">
        <button
          type="button"
          className="rounded-lg p-2 text-stone-700 hover:bg-stone-100 lg:hidden"
          aria-label="Open menu"
          onClick={() => setMenuOpen(true)}
        >
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
        <p className="hidden text-sm text-stone-500 lg:block">Content management</p>

        <div className="flex items-center gap-3">
          <div className="text-right leading-tight">
            <p className="text-sm font-semibold text-bay-950">{admin?.name}</p>
            <p className="text-xs text-stone-500">{ROLE_LABELS[admin?.role] || admin?.role}</p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            disabled={signingOut}
            className="inline-flex items-center gap-1.5 rounded-lg border border-stone-300 px-3 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-50 disabled:opacity-60"
          >
            <LogOut size={16} aria-hidden="true" /> Sign out
          </button>
        </div>
      </header>

      <main className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <Outlet />
      </main>
    </div>
  )
}
