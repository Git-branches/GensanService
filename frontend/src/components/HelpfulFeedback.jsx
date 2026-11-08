import { useId, useState } from 'react'
import { CircleCheck, ThumbsDown, ThumbsUp } from 'lucide-react'
import { useI18n } from '../i18n/context'
import { sendFeedback } from '../services/api'

const STORAGE_KEY = 'andam-feedback'
const REASONS = ['outdated', 'missing', 'unclear', 'other']

function answered() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}
  } catch {
    return {}
  }
}

function remember(slug) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...answered(), [slug]: true }))
  } catch {
    // Without storage the question simply shows again next time.
  }
}

const CHOICE = 'inline-flex min-h-11 items-center gap-2 rounded-lg border border-stone-300 bg-white px-4 text-sm font-semibold text-stone-700 transition-colors hover:border-bay-300 hover:bg-bay-50 hover:text-bay-800 disabled:opacity-60'

// Anonymous: the guide's daily total goes up by one. This browser remembers it answered, so it asks once.
export default function HelpfulFeedback({ slug }) {
  const { t } = useI18n()
  const titleId = useId()
  // ask -> (No) reason -> done, or ask -> (Yes) done.
  const [view, setView] = useState(() => (answered()[slug] ? 'done' : 'ask'))
  const [reason, setReason] = useState('')
  const [sending, setSending] = useState(false)
  const [failed, setFailed] = useState(false)

  async function send(helpful, why) {
    setSending(true)
    setFailed(false)
    try {
      await sendFeedback(slug, helpful, why)
      remember(slug)
      setView('done')
    } catch {
      setFailed(true)
    } finally {
      setSending(false)
    }
  }

  if (view === 'done') {
    return (
      <p role="status" className="flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-5 py-4 text-sm font-semibold text-emerald-800">
        <CircleCheck size={18} aria-hidden="true" className="shrink-0 text-emerald-600" /> {t('feedback.thanks')}
      </p>
    )
  }

  return (
    <section aria-labelledby={titleId} className="rounded-xl border border-stone-200 bg-white px-5 py-4">
      {view === 'ask' ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id={titleId} className="text-base font-bold text-bay-950">{t('feedback.question')}</h2>
          <div className="flex gap-2">
            <button type="button" disabled={sending} onClick={() => send(true)} className={CHOICE}>
              <ThumbsUp size={16} aria-hidden="true" /> {t('feedback.yes')}
            </button>
            <button type="button" disabled={sending} onClick={() => setView('reason')} className={CHOICE}>
              <ThumbsDown size={16} aria-hidden="true" /> {t('feedback.no')}
            </button>
          </div>
        </div>
      ) : (
        <form
          onSubmit={(event) => {
            event.preventDefault()
            send(false, reason)
          }}
        >
          <fieldset>
            <legend id={titleId} className="text-base font-bold text-bay-950">{t('feedback.whatWasWrong')}</legend>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {REASONS.map((value) => (
                <label key={value} className="flex min-h-11 cursor-pointer items-center gap-2.5 rounded-lg border border-stone-200 px-3 text-sm text-stone-800 has-checked:border-bay-400 has-checked:bg-bay-50">
                  <input type="radio" name={`${titleId}-reason`} value={value} checked={reason === value} onChange={() => setReason(value)} className="h-4 w-4 accent-bay-700" />
                  {t(`feedback.reasons.${value}`)}
                </label>
              ))}
            </div>
          </fieldset>
          <p className="mt-3 text-sm text-stone-600">{t('feedback.reportHint')}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="submit" disabled={sending} className="inline-flex min-h-11 items-center rounded-lg bg-bay-700 px-4 text-sm font-semibold text-white transition-colors hover:bg-bay-800 disabled:opacity-60">
              {t('feedback.send')}
            </button>
            <button type="button" disabled={sending} onClick={() => { setView('ask'); setFailed(false) }} className="inline-flex min-h-11 items-center rounded-lg px-4 text-sm font-semibold text-stone-600 transition-colors hover:bg-stone-100">
              {t('common.cancel')}
            </button>
          </div>
        </form>
      )}
      {failed && <p role="alert" className="mt-3 text-sm text-red-700">{t('feedback.failed')}</p>}
    </section>
  )
}
