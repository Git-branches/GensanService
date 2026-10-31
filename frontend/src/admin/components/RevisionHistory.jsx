import { useState } from 'react'
import { AlertCircle, History } from 'lucide-react'
import Modal from '../../components/Modal'
import { adminApi } from '../api'
import { timeAgo } from '../activity'
import { useAdminQuery } from '../useAdminList'
import { Button, Card } from './ui'
import ConfirmDialog from './ConfirmDialog'

// Turns a guide into labeled text, so two versions can be compared field by field.
function describe(guide) {
  const lines = (items, format) => items.map(format).join('\n')
  return [
    ['Title', guide.title],
    ['Summary', guide.summary],
    ['Description', guide.description],
    ['Search keywords', guide.search_keywords],
    ['Fee', guide.fee_description],
    ['Processing time', guide.processing_time_description],
    ['Who can apply', lines(guide.eligibility, (text) => text)],
    ['Document checklist', lines(guide.requirements, (r) => [r.requirement_text, r.notes].filter(Boolean).join(': '))],
    ['Application steps', lines(guide.steps, (s, i) => `${i + 1}. ${[s.title, s.instructions].filter(Boolean).join(': ')}`)],
    ['Official sources', lines(guide.sources, (s) => [s.label, s.url].filter(Boolean).join(': '))],
  ]
}

function differences(older, current) {
  const now = new Map(describe(current))
  return describe(older)
    .map(([label, before]) => ({ label, before: before ?? '', after: now.get(label) ?? '' }))
    .filter((row) => row.before !== row.after)
}

function Compare({ service, revision, canRestore, onClose, onRestored }) {
  const [confirming, setConfirming] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const rows = revision.data ? differences(revision.data.snapshot, service) : []

  async function restore() {
    setBusy(true)
    setError('')
    try {
      onRestored(await adminApi.restoreRevision(service.id, revision.id))
    } catch (err) {
      setError(err.message)
      setConfirming(false)
      setBusy(false)
    }
  }

  return (
    <>
      <Modal
        open
        onClose={onClose}
        size="lg"
        title="Compare with the current guide"
        description={`Saved ${timeAgo(revision.created_at)}${revision.admin_name ? ` by ${revision.admin_name}` : ''}`}
        footer={
          <>
            <Button variant="secondary" onClick={onClose}>Close</Button>
            {canRestore && <Button disabled={!revision.data} onClick={() => setConfirming(true)}>Restore this version</Button>}
          </>
        }
      >
        {error && (
          <p role="alert" className="mb-4 flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-700">
            <AlertCircle size={17} aria-hidden="true" className="mt-0.5 shrink-0" />
            {error}
          </p>
        )}
        {!revision.data && <p role="status" className="text-sm text-stone-500">Loading this version...</p>}
        {revision.data && rows.length === 0 && <p className="text-sm text-stone-600">This version has the same content as the current guide.</p>}
        <div className="space-y-4">
          {rows.map((row) => (
            <div key={row.label}>
              <p className="text-sm font-bold text-bay-950">{row.label}</p>
              <div className="mt-1 grid gap-2 sm:grid-cols-2">
                <div className="min-w-0 rounded-lg bg-stone-100 p-3">
                  <p className="text-xs font-bold uppercase tracking-wide text-stone-500">This version</p>
                  <p className="mt-1 whitespace-pre-wrap break-words text-sm text-stone-800">{row.before || 'Empty'}</p>
                </div>
                <div className="min-w-0 rounded-lg bg-bay-50 p-3">
                  <p className="text-xs font-bold uppercase tracking-wide text-bay-700">Current</p>
                  <p className="mt-1 whitespace-pre-wrap break-words text-sm text-stone-800">{row.after || 'Empty'}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Modal>
      <ConfirmDialog
        open={confirming}
        title="Restore this version?"
        message={`The guide's content goes back to this version${service.status === 'published' ? ', and residents will see it right away' : ''}. The current content is kept in the history, and a verified guide goes back to Needs review.`}
        confirmLabel="Restore"
        tone="primary"
        busy={busy}
        onConfirm={restore}
        onCancel={() => setConfirming(false)}
      />
    </>
  )
}

export default function RevisionHistory({ service, canRestore, onRestored }) {
  const { data: revisions, error } = useAdminQuery(() => adminApi.serviceRevisions(service.id), [service.id, service.updated_at])
  const [open, setOpen] = useState(null)

  async function compare(revision) {
    setOpen({ ...revision, data: null })
    const data = await adminApi.serviceRevision(service.id, revision.id)
    setOpen((current) => (current?.id === revision.id ? { ...current, data } : current))
  }

  return (
    <Card title="Version history" description="Every saved change keeps the version before it.">
      {error && <p className="text-sm text-red-600">{error}</p>}
      {revisions?.length === 0 && <p className="text-sm text-stone-500">No earlier versions yet. One is kept each time this guide is changed.</p>}
      {revisions?.length > 0 && (
        <ul className="divide-y divide-stone-100">
          {revisions.map((revision) => (
            <li key={revision.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
              <span className="min-w-0">
                <span className="flex items-center gap-2 text-sm font-semibold text-bay-950">
                  <History size={15} aria-hidden="true" className="shrink-0 text-stone-500" />
                  {revision.change_summary || 'Guide changed'}
                </span>
                <span className="block text-xs text-stone-500">
                  {timeAgo(revision.created_at)}
                  {revision.admin_name ? ` by ${revision.admin_name}` : ''}
                </span>
              </span>
              <Button variant="secondary" onClick={() => compare(revision)}>Compare</Button>
            </li>
          ))}
        </ul>
      )}
      {open && (
        <Compare
          service={service}
          revision={open}
          canRestore={canRestore}
          onClose={() => setOpen(null)}
          onRestored={(restored) => {
            setOpen(null)
            onRestored(restored)
          }}
        />
      )}
    </Card>
  )
}
