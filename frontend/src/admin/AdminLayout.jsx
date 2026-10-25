import { useState } from 'react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import {
  ExternalLink,
  FileText,
  Flag,
  History,
  KeyRound,
  Landmark,
  LayoutDashboard,
  LayoutGrid,
  LogOut,
  MapPin,
  Menu,
  ShieldAlert,
  Users,
  X,
} from 'lucide-react'
import { LogoMark } from '../components/Logo'
import { ROLE_LABELS, isSuperAdmin, useAdminAuth } from './auth'

const NAV_GROUPS = [
  {
    label: null,
    items: [
      { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
      { to: '/admin/reports', label: 'Reports', icon: Flag },
    ],
  },
  {
    label: 'Content',
    items: [
      { to: '/admin/services', label: 'Service guides', icon: FileText },
      { to: '/admin/agencies', label: 'Agencies', icon: Landmark },
      { to: '/admin/offices', label: 'Offices', icon: MapPin },
      { to: '/admin/categories', label: 'Categories', icon: LayoutGrid },
    ],
  },
  {
    label: 'System',
    items: [
      { to: '/admin/activity', label: 'Activity log', icon: History },
      { to: '/admin/admins', label: 'Admin accounts', icon: Users, superAdminOnly: true },
    ],
  },
]

function Sidebar({ admin, onNavigate }) {
  return (
    <nav aria-label="Admin" className="flex h-full flex-col overflow-y-auto p-4">
      <Link to="/admin" onClick={onNavigate} className="mb-6 flex items-center gap-3 px-2 py-1">
        <LogoMark className="h-9 w-9" />
        <span className="leading-tight">
          <span className="block font-extrabold tracking-tight text-white">Andam GenSan</span>
          <span className="block text-xs font-semibold uppercase tracking-wide text-sun-300">Admin</span>
        </span>
      </Link>

      <div className="space-y-5">
        {NAV_GROUPS.map((group) => (
          <div key={group.label ?? 'main'} className="space-y-1">
            {group.label && <p className="px-3 pb-1 text-[11px] font-bold uppercase tracking-wider text-bay-300/70">{group.label}</p>}
            {group.items
              .filter((item) => !item.superAdminOnly || isSuperAdmin(admin))
              .map(({ to, label, icon: Icon, end }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
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
          </div>
        ))}
      </div>

      <a
        href="/"
        target="_blank"
        rel="noopener noreferrer"
        className="mt-auto flex items-center gap-3 rounded-lg px-3 py-2.5 pt-6 text-sm font-medium text-bay-200 hover:bg-white/5 hover:text-white"
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
        <Sidebar admin={admin} />
      </aside>

      {menuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button type="button" aria-label="Close menu" className="absolute inset-0 bg-bay-950/50" onClick={() => setMenuOpen(false)} />
          <aside className="relative h-full w-64 bg-bay-950">
            <Sidebar admin={admin} onNavigate={() => setMenuOpen(false)} />
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

        <div className="flex items-center gap-2">
          <Link to="/admin/account" className="rounded-lg px-2 py-1 text-right leading-tight hover:bg-stone-100" title="My account">
            <span className="block text-sm font-semibold text-bay-950">{admin?.name}</span>
            <span className="block text-xs text-stone-500">{ROLE_LABELS[admin?.role] || admin?.role}</span>
          </Link>
          <Link
            to="/admin/account"
            aria-label="Change password"
            title="Change password"
            className="hidden h-9 w-9 items-center justify-center rounded-lg text-stone-500 hover:bg-stone-100 hover:text-bay-700 sm:inline-flex"
          >
            <KeyRound size={17} />
          </Link>
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

      {admin?.uses_default_password && (
        <div role="alert" className="flex flex-wrap items-center gap-x-3 gap-y-1 bg-rose-600 px-4 py-2.5 text-sm text-white sm:px-6">
          <ShieldAlert size={17} aria-hidden="true" className="shrink-0" />
          <span className="font-semibold">You're still using the default password, which is published in the project files.</span>
          <Link to="/admin/account" className="font-bold underline underline-offset-2 hover:text-rose-100">
            Change it now
          </Link>
        </div>
      )}

      <main className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <Outlet />
      </main>
    </div>
  )
}
