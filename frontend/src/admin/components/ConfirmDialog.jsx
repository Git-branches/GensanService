import { AlertTriangle, HelpCircle } from 'lucide-react'
import Modal from './Modal'
import { Button } from './ui'

export default function ConfirmDialog({ open, title, message, confirmLabel, tone = 'primary', busy = false, error, onConfirm, onCancel }) {
  const danger = tone === 'danger'

  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      size="sm"
      busy={busy}
      footer={
        <>
          {/* Destructive actions start with focus on Cancel so a stray Enter doesn't confirm them. */}
          <Button variant="secondary" onClick={onCancel} disabled={busy} data-autofocus={danger ? true : undefined}>
            Cancel
          </Button>
          <Button variant={danger ? 'dangerSolid' : 'primary'} loading={busy} onClick={onConfirm} data-autofocus={danger ? undefined : true}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="flex gap-4">
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
            danger ? 'bg-rose-50 text-rose-600' : 'bg-bay-50 text-bay-700'
          }`}
        >
          {danger ? <AlertTriangle size={20} aria-hidden="true" /> : <HelpCircle size={20} aria-hidden="true" />}
        </span>
        <p className="pt-2 text-sm leading-relaxed text-stone-600">{message}</p>
      </div>
      {error && (
        <p role="alert" className="mt-4 rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-700">
          {error}
        </p>
      )}
    </Modal>
  )
}
