import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { usePageTitle } from '../../hooks/usePageTitle'
import { adminApi } from '../api'
import { ACTIVITY_TYPES, describeActivity, timeAgo } from '../activity'
import { useAdminQuery } from '../useAdminList'
import { DataTable } from '../components/ResourceTable'
import { Button, PageTitle, SURFACE, inputClass } from '../components/ui'

export default function AdminActivityPage() {
  usePageTitle('Activity log · Admin')
  const [type, setType] = useState('')
  const [adminId, setAdminId] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [page, setPage] = useState(1)
  const { data, error, loading } = useAdminQuery(() => adminApi.activity({ page, type, adminId, from, to }), [page, type, adminId, from, to])

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.per_page)) : 1

  function changeFilter(setter) {
    return (event) => {
      setter(event.target.value)
      setPage(1)
    }
  }

  const columns = [
    {
      key: 'what',
      label: 'Activity',
      render: (item) => (
        <span className="text-sm">
          <span className="font-semibold text-bay-950">{item.admin_name ?? 'Someone'}</span> <span className="text-stone-700">{describeActivity(item)}</span>
        </span>
      ),
    },
    {
      key: 'when',
      label: 'When',
      className: 'whitespace-nowrap md:w-44',
      render: (item) => (
        <time dateTime={item.created_at.replace(' ', 'T')} title={item.created_at} className="text-stone-600">
          {timeAgo(item.created_at)}
        </time>
      ),
    },
    { key: 'ip', label: 'IP address', hideBelow: 'xl', className: 'whitespace-nowrap md:w-40', render: (item) => <span className="font-mono text-xs text-stone-500">{item.ip_address}</span> },
  ]

  return (
    <div className="mx-auto max-w-6xl">
      <PageTitle title="Activity log" description="A record of every sign-in and change made in the admin panel." />

      <div className={`mt-6 flex flex-wrap items-center gap-3 p-3 ${SURFACE}`}>
        <label className="sr-only" htmlFor="activity-type">Activity type</label>
        <select id="activity-type" value={type} onChange={changeFilter(setType)} className={`${inputClass} w-auto min-w-48`}>
          {ACTIVITY_TYPES.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <label className="sr-only" htmlFor="activity-admin">Admin</label>
        <select id="activity-admin" value={adminId} onChange={changeFilter(setAdminId)} className={`${inputClass} w-auto min-w-48`}>
          <option value="">All admins</option>
          {data?.admins.map((admin) => (
            <option key={admin.id} value={admin.id}>
              {admin.name}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-sm text-stone-600">
          From
          <input type="date" value={from} onChange={changeFilter(setFrom)} className={`${inputClass} w-auto`} />
        </label>
        <label className="flex items-center gap-2 text-sm text-stone-600">
          To
          <input type="date" value={to} onChange={changeFilter(setTo)} className={`${inputClass} w-auto`} />
        </label>
        {data && <p className="ml-auto px-2 text-sm text-stone-500">{data.total} entries</p>}
      </div>

      <DataTable loading={loading} error={error} rows={data?.items} columns={columns} emptyText="No activity matches these filters." />

      {data && totalPages > 1 && (
        <nav aria-label="Pagination" className="mt-4 flex items-center justify-between gap-3">
          <Button variant="secondary" disabled={page <= 1 || loading} onClick={() => setPage((p) => p - 1)}>
            <ChevronLeft size={16} aria-hidden="true" /> Newer
          </Button>
          <p className="text-sm text-stone-600">
            Page {page} of {totalPages}
          </p>
          <Button variant="secondary" disabled={page >= totalPages || loading} onClick={() => setPage((p) => p + 1)}>
            Older <ChevronRight size={16} aria-hidden="true" />
          </Button>
        </nav>
      )}
    </div>
  )
}
