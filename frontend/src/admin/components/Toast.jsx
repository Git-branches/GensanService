import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { CheckCircle2, X } from 'lucide-react'

export default function Toast({ message, onDismiss }) {
  useEffect(() => {
    if (!message) return undefined
    const id = setTimeout(onDismiss, 4000)
    return () => clearTimeout(id)
  }, [message, onDismiss])

  if (!message) return null

  return createPortal(
    <div
      role="status"
      className="fixed bottom-5 right-5 z-[60] flex max-w-sm items-start gap-3 rounded-xl bg-bay-950 px-4 py-3 text-sm text-white shadow-2xl shadow-bay-950/40 motion-safe:animate-modal-in"
    >
      <CheckCircle2 size={18} aria-hidden="true" className="mt-0.5 shrink-0 text-emerald-400" />
      <span className="flex-1">{message}</span>
      <button type="button" onClick={onDismiss} aria-label="Dismiss" className="rounded p-0.5 text-bay-200 hover:text-white">
        <X size={16} />
      </button>
    </div>,
    document.body
  )
}
