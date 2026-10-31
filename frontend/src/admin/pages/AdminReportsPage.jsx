import { useCallback, useState } from 'react'
import { Link } from 'react-router-dom'
import { ExternalLink, Eye, Mail, Pencil } from 'lucide-react'
import { usePageTitle } from '../../hooks/usePageTitle'
import { REPORT_REASONS, reasonLabel } from '../../utils/reports'
import { adminApi } from '../api'
import { timeAgo } from '../activity'
import { canEditContent, useAdminAuth } from '../auth'
import { useAdminQuery } from '../useAdminList'
import FormModal from '../components/FormModal'
import { DataTable } from '../components/ResourceTable'
import Toast from '../components/Toast'
import { Field, IconAction, PageTitle, SURFACE, inputClass } from '../components/ui'

const TABS = [
  { value: 'open', label: 'Open' },
  { value: 'pending', label: 'Pending' },
  { value: 'reviewing', label: 'Under review' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'dismissed', label: 'Rejected' },
  { value: '', label: 'All' },
]

const STATUS = {
  pending: { label: 'Pending', className: 'bg-rose-50 text-rose-700', dot: 'bg-rose-500' },
  reviewing: { label: 'Under review', className: 'bg-sun-50 text-sun-800', dot: 'bg-sun-500' },
  resolved: { label: 'Resolved', className: 'bg-emerald-50 text-emerald-700', dot: 'bg-emerald-500' },
  dismissed: { label: 'Rejected', className: 'bg-stone-100 text-stone-600', dot: 'bg-stone-400' },
}

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending', hint: 'Not looked at yet' },
  { value: 'reviewing', label: 'Under review', hint: 'Checking official sources' },
  { value: 'resolved', label: 'Resolved', hint: 'Guide was corrected' },
  { value: 'dismissed', label: 'Rejected', hint: 'Guide was already correct, or spam' },
]

function ReportStatus({ status }) {
  const style = STATUS[status]
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ${style.className}`}>
      <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
      {style.label}
    </span>
  )
}

function ReviewModal({ report, canEditGuides, onClose, onSaved }) {
  return (
    <FormModal
      title="Review report"
      description={`Received ${timeAgo(report.created_at)}`}
      initialValues={{ status: report.status === 'pending' ? 'reviewing' : report.status, admin_note: report.admin_note ?? '', resolution: report.resolution ?? '' }}
      submitLabel="Save review"
      onClose={onClose}
      onSaved={onSaved}
      onSubmit={(values) => adminApi.updateReport(report.id, values)}
    >
      {(values, set, errors) => (
        <>
          <div className="space-y-3 rounded-xl bg-stone-50 p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-stone-500">Guide</p>
                <p className="font-semibold text-bay-950">{report.service_title}</p>
              </div>
              <div className="flex gap-1">
                {canEditGuides && (
                  <IconAction label="Edit this guide" to={`/admin/services/${report.service_id}`}>
                    <Pencil size={16} />
                  </IconAction>
                )}
                {report.service_status === 'published' && (
                  <IconAction label="View live guide" href={`/services/${report.service_slug}`}>
                    <ExternalLink size={16} />
                  </IconAction>
                )}
              </div>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-stone-500">Problem</p>
              <p className="text-sm font-semibold text-stone-800">{reasonLabel(report.reason)}</p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-stone-500">Details from the resident</p>
              <p className="whitespace-pre-line text-sm leading-relaxed text-stone-700">{report.message}</p>
            </div>
            {report.reporter_email && (
              <a href={`mailto:${report.reporter_email}`} className="inline-flex items-center gap-1.5 text-sm font-semibold text-bay-700 hover:underline">
                <Mail size={15} aria-hidden="true" /> {report.reporter_email}
              </a>
            )}
          </div>

          <fieldset>
            <legend className="text-sm font-semibold text-stone-700">Status</legend>
            <div className="mt-1.5 grid gap-2 sm:grid-cols-2">
              {STATUS_OPTIONS.map((option) => (
                <label
                  key={option.value}
                  className={`flex cursor-pointer items-start gap-2.5 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                    values.status === option.value ? 'bg-bay-50 ring-2 ring-bay-500' : 'bg-stone-50 hover:bg-stone-100'
                  }`}
                >
                  <input type="radio" name="report-status" checked={values.status === option.value} onChange={() => set({ status: option.value })} className="mt-0.5 accent-bay-700" />
                  <span>
                    <span className="block font-semibold text-stone-800">{option.label}</span>
                    <span className="block text-xs text-stone-500">{option.hint}</span>
                  </span>
                </label>
              ))}
            </div>
            {errors.status && <p className="mt-1 text-xs font-medium text-red-600">{errors.status}</p>}
          </fieldset>

          <Field id="report-note" label="Internal note" hint="Only visible to admins. Notes while you check the report." error={errors.admin_note}>
            <textarea id="report-note" rows={2} maxLength={1000} value={values.admin_note} onChange={(e) => set({ admin_note: e.target.value })} className={inputClass} />
          </Field>

          <Field id="report-resolution" label="Resolution" hint="Only visible to admins. What was changed, or why it was rejected." error={errors.resolution}>
            <textarea id="report-resolution" rows={2} maxLength={1000} value={values.resolution} onChange={(e) => set({ resolution: e.target.value })} className={inputClass} />
          </Field>
        </>
      )}
    </FormModal>
  )
}

export default function AdminReportsPage() {
  usePageTitle('Reports · Admin')
  const { admin } = useAdminAuth()
  const [tab, setTab] = useState('open')
  const [reviewing, setReviewing] = useState(null)
  const [toast, setToast] = useState('')
  const dismissToast = useCallback(() => setToast(''), [])
  const { data, error, loading, reload } = useAdminQuery(() => adminApi.reports(tab), [tab])
  const [reason, setReason] = useState('')
  const rows = data?.reports.filter((report) => !reason || report.reason === reason)

  const counts = data?.counts
  const tabCount = (value) => {
    if (!counts) return null
    if (value === 'open') return counts.pending + counts.reviewing
    if (value === '') return Object.values(counts).reduce((a, b) => a + b, 0)
    return counts[value]
  }

  const columns = [
    {
      key: 'guide',
      label: 'Report',
      render: (r) => (
        <>
          <span className="block font-semibold text-bay-900">{r.service_title}</span>
          <span className="block text-xs font-semibold text-stone-600">{reasonLabel(r.reason)}</span>
          <span className="mt-0.5 line-clamp-1 block text-xs text-stone-500">{r.message}</span>
        </>
      ),
    },
    { key: 'status', label: 'Status', className: 'md:w-36', render: (r) => <ReportStatus status={r.status} /> },
    {
      key: 'received',
      label: 'Received',
      hideBelow: 'lg',
      className: 'whitespace-nowrap md:w-36',
      render: (r) => <span className="text-stone-600">{timeAgo(r.created_at)}</span>,
    },
    {
      key: 'handled',
      label: 'Handled by',
      hideBelow: 'xl',
      className: 'whitespace-nowrap',
      render: (r) => <span className="text-stone-600">{r.resolved_by_name ?? '—'}</span>,
    },
    {
      key: 'actions',
      label: <span className="sr-only">Actions</span>,
      className: 'md:w-px',
      render: (r) => (
        <div className="flex md:justify-end">
          <IconAction label={`Review report on ${r.service_title}`} onClick={() => setReviewing(r)}>
            <Eye size={16} />
          </IconAction>
        </div>
      ),
    },
  ]

  return (
    <div className="mx-auto max-w-6xl">
      <PageTitle title="Reports" description="Corrections sent by residents from the guide pages. Check each one against official sources." />

      <div className={`mt-6 flex flex-wrap items-center gap-3 p-3 ${SURFACE}`}>
        <div role="group" aria-label="Filter reports" className="flex flex-wrap gap-1 rounded-lg bg-stone-100 p-1">
          {TABS.map((option) => (
            <button
              key={option.value}
              type="button"
              aria-pressed={tab === option.value}
              onClick={() => setTab(option.value)}
              className={`inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-semibold transition-colors ${
                tab === option.value ? 'bg-white text-bay-800 shadow-sm' : 'text-stone-600 hover:text-stone-800'
              }`}
            >
              {option.label}
              {tabCount(option.value) !== null && (
                <span className="rounded-full bg-stone-200/70 px-1.5 text-xs tabular-nums text-stone-600">{tabCount(option.value)}</span>
              )}
            </button>
          ))}
        </div>
        <label className="sr-only" htmlFor="report-reason">Issue type</label>
        <select id="report-reason" value={reason} onChange={(e) => setReason(e.target.value)} className={`${inputClass} w-auto`}>
          <option value="">All issue types</option>
          {REPORT_REASONS.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </div>

      <DataTable
        loading={loading}
        error={error}
        rows={rows}
        columns={columns}
        emptyText={tab === 'open' ? 'No open reports. Nice work!' : 'No reports here.'}
      />

      <p className="mt-4 text-xs text-stone-500">
        Reports come from the "Report incorrect information" button on each <Link to="/admin/services" className="underline">service guide</Link>.
      </p>

      {reviewing && (
        <ReviewModal
          report={reviewing}
          canEditGuides={canEditContent(admin)}
          onClose={() => setReviewing(null)}
          onSaved={() => {
            setReviewing(null)
            setToast('Report updated.')
            reload()
          }}
        />
      )}
      <Toast message={toast} onDismiss={dismissToast} />
    </div>
  )
}
