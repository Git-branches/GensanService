import { useId, useState } from 'react'
import { AlertCircle, CheckCircle2, Flag, Loader2 } from 'lucide-react'
import Modal from './Modal'
import { reportIssue } from '../services/api'
import { REPORT_REASONS } from '../utils/reports'

const FIELD =
  'w-full rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:border-bay-500 focus:outline-none focus:ring-2 focus:ring-bay-500/20 aria-[invalid=true]:border-red-400'

const EMPTY = { reason: '', message: '', email: '', website: '' }

function ReportForm({ slug, serviceTitle, onClose }) {
  const formId = useId()
  const [values, setValues] = useState(EMPTY)
  const [errors, setErrors] = useState({})
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  const set = (patch) => setValues((current) => ({ ...current, ...patch }))

  async function handleSubmit(event) {
    event.preventDefault()
    setSending(true)
    setErrors({})
    setError('')
    try {
      await reportIssue(slug, values)
      setSent(true)
    } catch (err) {
      setErrors(err.details || {})
      setError(err.message)
    } finally {
      setSending(false)
    }
  }

  if (sent) {
    return (
      <Modal
        open
        onClose={onClose}
        title="Thank you for the report"
        size="sm"
        footer={
          <button type="button" data-autofocus onClick={onClose} className="rounded-lg bg-bay-700 px-5 py-2 text-sm font-semibold text-white hover:bg-bay-800">
            Close
          </button>
        }
      >
        <p className="flex gap-3 text-sm leading-relaxed text-stone-600">
          <CheckCircle2 size={22} aria-hidden="true" className="shrink-0 text-emerald-600" />
          Our editors will check this guide against official sources and update it if needed.
        </p>
      </Modal>
    )
  }

  return (
    <Modal
      open
      onClose={onClose}
      busy={sending}
      title="Report incorrect information"
      description={serviceTitle}
      footer={
        <>
          <button type="button" onClick={onClose} disabled={sending} className="rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-50">
            Cancel
          </button>
          <button
            type="submit"
            form={formId}
            disabled={sending}
            className="inline-flex items-center gap-2 rounded-lg bg-bay-700 px-4 py-2 text-sm font-semibold text-white hover:bg-bay-800 disabled:opacity-60"
          >
            {sending && <Loader2 size={15} className="animate-spin" aria-hidden="true" />}
            Send report
          </button>
        </>
      }
    >
      <form id={formId} onSubmit={handleSubmit} noValidate className="space-y-4">
        {error && (
          <p role="alert" className="flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-700">
            <AlertCircle size={17} aria-hidden="true" className="mt-0.5 shrink-0" />
            {error}
          </p>
        )}

        <fieldset>
          <legend className="text-sm font-semibold text-stone-700">What is wrong?</legend>
          <div className="mt-2 grid gap-2">
            {REPORT_REASONS.map((reason, index) => (
              <label
                key={reason.value}
                className={`flex cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${
                  values.reason === reason.value ? 'bg-bay-50 ring-2 ring-bay-500' : 'bg-stone-50 hover:bg-stone-100'
                }`}
              >
                <input
                  type="radio"
                  name="reason"
                  value={reason.value}
                  checked={values.reason === reason.value}
                  onChange={() => set({ reason: reason.value })}
                  data-autofocus={index === 0 ? true : undefined}
                  className="accent-bay-700"
                />
                {reason.label}
              </label>
            ))}
          </div>
          {errors.reason && <p className="mt-1 text-xs font-medium text-red-600">{errors.reason}</p>}
        </fieldset>

        <div>
          <label htmlFor={`${formId}-message`} className="text-sm font-semibold text-stone-700">
            Details <span className="text-red-600">*</span>
          </label>
          <p className="text-xs text-stone-500">What should it say instead? Mention where you saw the correct information.</p>
          <textarea
            id={`${formId}-message`}
            rows={4}
            maxLength={2000}
            value={values.message}
            aria-invalid={Boolean(errors.message)}
            onChange={(e) => set({ message: e.target.value })}
            className={`${FIELD} mt-1.5`}
          />
          {errors.message && <p className="mt-1 text-xs font-medium text-red-600">{errors.message}</p>}
        </div>

        <div>
          <label htmlFor={`${formId}-email`} className="text-sm font-semibold text-stone-700">
            Your email <span className="font-normal text-stone-500">(optional)</span>
          </label>
          <p className="text-xs text-stone-500">Only used if our editors need to ask you a follow-up question.</p>
          <input
            id={`${formId}-email`}
            type="email"
            maxLength={150}
            value={values.email}
            aria-invalid={Boolean(errors.email)}
            onChange={(e) => set({ email: e.target.value })}
            className={`${FIELD} mt-1.5`}
          />
          {errors.email && <p className="mt-1 text-xs font-medium text-red-600">{errors.email}</p>}
        </div>

        {/* Spam trap: hidden from people, filled in by bots. */}
        <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
          <label htmlFor={`${formId}-website`}>Website</label>
          <input id={`${formId}-website`} tabIndex={-1} autoComplete="off" value={values.website} onChange={(e) => set({ website: e.target.value })} />
        </div>

        <p className="text-xs text-stone-500">Please don't include personal details such as ID numbers, passwords, or OTPs.</p>
      </form>
    </Modal>
  )
}

export default function ReportIssue({ slug, serviceTitle }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-stone-700 ring-1 ring-stone-200 transition-colors hover:bg-stone-50 hover:text-bay-700 print:hidden"
      >
        <Flag size={16} aria-hidden="true" /> Report incorrect information
      </button>
      {open && <ReportForm slug={slug} serviceTitle={serviceTitle} onClose={() => setOpen(false)} />}
    </>
  )
}
