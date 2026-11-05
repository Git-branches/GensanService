import { useState } from 'react'
import { CircleAlert } from 'lucide-react'
import Modal from './Modal'
import { useI18n } from '../i18n/context'

const SEEN_KEY = 'andam-seen-emergencies'

function readSeen() {
  try {
    const value = JSON.parse(sessionStorage.getItem(SEEN_KEY))
    return Array.isArray(value) ? value : []
  } catch {
    return []
  }
}

function markSeen(id) {
  try {
    sessionStorage.setItem(SEEN_KEY, JSON.stringify([...readSeen(), id]))
  } catch {
    // Storage can be blocked; the notice would then show again on the next page.
  }
}

// An emergency notice opens as a popup once per visit, so it is hard to miss. Other notices stay as a bar.
// Notices are written by admins in one language, so only the label is translated.
export default function EmergencyNotice({ notices }) {
  const { t } = useI18n()
  const [seen, setSeen] = useState(readSeen)
  const notice = notices.find((item) => !seen.includes(item.id))
  if (!notice) return null

  function close() {
    markSeen(notice.id)
    setSeen((ids) => [...ids, notice.id])
  }

  return (
    <Modal
      open
      onClose={close}
      title={notice.title}
      description={t('notices.emergency')}
      size="sm"
      footer={
        <button
          type="button"
          onClick={close}
          data-autofocus
          className="inline-flex min-h-11 items-center justify-center rounded-lg bg-bay-700 px-5 text-sm font-semibold text-white transition-colors hover:bg-bay-800"
        >
          {t('common.close')}
        </button>
      }
    >
      <div role="alert" className="flex items-start gap-3">
        <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-rose-50 text-rose-700 ring-1 ring-rose-200">
          <CircleAlert size={20} aria-hidden="true" />
        </span>
        <p className="pt-1.5 text-base leading-relaxed text-stone-700">{notice.message}</p>
      </div>
    </Modal>
  )
}
