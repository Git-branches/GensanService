import { Link } from 'react-router-dom'
import { AlertTriangle, ArrowRight, CheckCircle2, FileText, Flag, MapPin, PenLine } from 'lucide-react'
import { usePageTitle } from '../../hooks/usePageTitle'
import { formatDate } from '../../utils/format'
import { reasonLabel } from '../../utils/reports'
import { adminApi } from '../api'
import { describeActivity, timeAgo } from '../activity'
import { useAdminAuth } from '../auth'
import { useAdminQuery } from '../useAdminList'
import { PageTitle, SURFACE, StatusBadge } from '../components/ui'

function StatCard({ label, value, icon: Icon, tone, to, hint }) {
  const tones = {
    bay: 'bg-bay-50 text-bay-700',
    green: 'bg-emerald-50 text-emerald-700',
    sun: 'bg-sun-50 text-sun-700',
    rose: 'bg-rose-50 text-rose-700',
  }
  return (
    <Link to={to} className={`group flex items-start gap-4 p-5 transition-shadow hover:shadow-md ${SURFACE}`}>
      <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${tones[tone]}`}>
        <Icon size={21} aria-hidden="true" />
      </span>
      <span className="min-w-0">
        <span className="block text-3xl font-extrabold tabular-nums leading-none text-bay-950">{value}</span>
        <span className="mt-1.5 block text-sm font-semibold text-stone-700">{label}</span>
        {hint && <span className="block text-xs text-stone-500">{hint}</span>}
      </span>
    </Link>
  )
}

function Panel({ title, action, children }) {
  return (
    <section className={`p-5 ${SURFACE}`}>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-bold text-bay-950">{title}</h2>
        {action && (
          <Link to={action.to} className="group inline-flex items-center gap-1 text-sm font-semibold text-bay-700 hover:underline">
            {action.label} <ArrowRight size={15} aria-hidden="true" className="transition-transform group-hover:translate-x-0.5" />
          </Link>
        )}
      </div>
      <div className="mt-3">{children}</div>
    </section>
  )
}

function EmptyLine({ children }) {
  return (
    <p className="flex items-center gap-2 rounded-lg bg-stone-50 px-3 py-3 text-sm text-stone-500">
      <CheckCircle2 size={16} aria-hidden="true" className="text-emerald-600" /> {children}
    </p>
  )
}

export default function AdminDashboardPage() {
  usePageTitle('Dashboard · Admin')
  const { admin } = useAdminAuth()
  const { data, error } = useAdminQuery(adminApi.dashboard, [])

  if (error) return <p className="text-sm text-red-600">{error}</p>
  if (!data) {
    return (
      <div className="mx-auto grid max-w-6xl animate-pulse gap-4 sm:grid-cols-2 xl:grid-cols-4" role="status" aria-label="Loading">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className={`h-28 ${SURFACE}`} />
        ))}
      </div>
    )
  }

  const { counts } = data

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageTitle title={`Welcome back, ${admin?.name?.split(' ')[0] ?? ''}`} description="Here's what needs attention across the guides." />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Published guides" value={counts.published} icon={FileText} tone="green" to="/admin/services" hint={`${counts.draft} draft${counts.draft === 1 ? '' : 's'} · ${counts.archived} archived`} />
        <StatCard label="Need re-verification" value={counts.needs_review} icon={AlertTriangle} tone="sun" to="/admin/services" hint="Not checked in 6+ months" />
        <StatCard label="Open reports" value={counts.open_reports} icon={Flag} tone="rose" to="/admin/reports" hint="From residents" />
        <StatCard label="Unverified offices" value={counts.unverified_offices} icon={MapPin} tone="bay" to="/admin/offices" hint="Details not yet confirmed" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Open reports" action={{ to: '/admin/reports', label: 'All reports' }}>
          {data.open_reports.length === 0 ? (
            <EmptyLine>No open reports.</EmptyLine>
          ) : (
            <ul className="space-y-1">
              {data.open_reports.map((report) => (
                <li key={report.id}>
                  <Link to="/admin/reports" className="block rounded-lg px-3 py-2.5 hover:bg-stone-50">
                    <span className="block text-sm font-semibold text-bay-900">{report.service_title}</span>
                    <span className="block text-xs text-stone-500">
                      {reasonLabel(report.reason)} · {timeAgo(report.created_at)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Needs re-verification" action={{ to: '/admin/services', label: 'All guides' }}>
          {data.needs_review.length === 0 ? (
            <EmptyLine>Every guide was verified in the last 6 months.</EmptyLine>
          ) : (
            <ul className="space-y-1">
              {data.needs_review.map((service) => (
                <li key={service.id}>
                  <Link to={`/admin/services/${service.id}`} className="flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 hover:bg-stone-50">
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-bay-900">{service.title}</span>
                      <span className="block text-xs text-stone-500">
                        {service.agency_acronym} · {service.last_verified_at ? `Last verified ${formatDate(service.last_verified_at)}` : 'Never verified'}
                      </span>
                    </span>
                    <StatusBadge status={service.status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Drafts in progress" action={{ to: '/admin/services', label: 'All guides' }}>
          {data.drafts.length === 0 ? (
            <EmptyLine>No drafts waiting to be published.</EmptyLine>
          ) : (
            <ul className="space-y-1">
              {data.drafts.map((draft) => (
                <li key={draft.id}>
                  <Link to={`/admin/services/${draft.id}`} className="flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-stone-50">
                    <PenLine size={16} aria-hidden="true" className="shrink-0 text-stone-400" />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-bay-900">{draft.title}</span>
                      <span className="block text-xs text-stone-500">
                        {draft.agency_acronym} · edited {timeAgo(draft.updated_at)}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Recent activity" action={{ to: '/admin/activity', label: 'Activity log' }}>
          {data.recent_activity.length === 0 ? (
            <EmptyLine>No activity yet.</EmptyLine>
          ) : (
            <ul className="space-y-3">
              {data.recent_activity.map((item) => (
                <li key={item.id} className="flex gap-3 px-1 text-sm">
                  <span aria-hidden="true" className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-bay-300" />
                  <span>
                    <span className="font-semibold text-bay-950">{item.admin_name}</span>{' '}
                    <span className="text-stone-700">{describeActivity(item)}</span>
                    <span className="block text-xs text-stone-400">{timeAgo(item.created_at)}</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  )
}
