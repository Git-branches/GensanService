import { useId, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertCircle, CheckCircle2, Flag, Loader2 } from 'lucide-react'
import Modal from './Modal'
import { reportIssue } from '../services/api'
import { REPORT_REASONS } from '../utils/reports'
import { useI18n } from '../i18n/context'

const FIELD =
  'w-full rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-base text-stone-900 placeholder:text-stone-500 focus:border-bay-500 focus:outline-none focus:ring-2 focus:ring-bay-500/20 aria-[invalid=true]:border-red-400 sm:text-sm'

const EMPTY = { reason: '', message: '', email: '', website: '' }

// The API answers in English, so its field errors are swapped for translated messages.
const FIELD_ERRORS = ['reason', 'message', 'email']

function translateErrors(details, t) {
  return Object.fromEntries(
    Object.keys(details).map((field) => [field, FIELD_ERRORS.includes(field) ? t(`report.errors.${field}`) : details[field]]),
  )
}

function errorMessage(err, t) {
  if (err.status === 422) return t('report.errors.fix')
  if (err.status === 429) return t('report.errors.rateLimit')
  return t('common.errorGeneric')
}

function ReportForm({ slug, serviceTitle, onClose }) {
  const { t } = useI18n()
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
      setErrors(translateErrors(err.details || {}, t))
      setError(errorMessage(err, t))
    } finally {
      setSending(false)
    }
  }

  if (sent) {
    return (
      <Modal
        open
        onClose={onClose}
        title={t('report.thanksTitle')}
        size="sm"
        footer={
          <button type="button" data-autofocus onClick={onClose} className="min-h-11 rounded-lg bg-bay-700 px-5 text-sm font-semibold text-white hover:bg-bay-800">
            {t('common.close')}
          </button>
        }
      >
        <p className="flex gap-3 text-sm leading-relaxed text-stone-600">
          <CheckCircle2 size={22} aria-hidden="true" className="shrink-0 text-emerald-600" />
          {t('report.thanksText')}
        </p>
      </Modal>
    )
  }

  return (
    <Modal
      open
      onClose={onClose}
      busy={sending}
      title={t('report.title')}
      description={serviceTitle}
      footer={
        <>
          <button type="button" onClick={onClose} disabled={sending} className="min-h-11 rounded-lg border border-stone-300 bg-white px-4 text-sm font-semibold text-stone-700 hover:bg-stone-50">
            {t('common.cancel')}
          </button>
          <button
            type="submit"
            form={formId}
            disabled={sending}
            className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-bay-700 px-4 text-sm font-semibold text-white hover:bg-bay-800 disabled:opacity-60"
          >
            {sending && <Loader2 size={15} className="animate-spin" aria-hidden="true" />}
            {t('report.send')}
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

        <fieldset aria-describedby={errors.reason ? `${formId}-reason-error` : undefined}>
          <legend className="text-sm font-semibold text-stone-700">{t('report.whatsWrong')}</legend>
          <div className="mt-2 grid gap-2">
            {REPORT_REASONS.map((reason, index) => (
              <label
                key={reason.value}
                className={`flex min-h-11 cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${
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
                {t(`report.reasons.${reason.value}`)}
              </label>
            ))}
          </div>
          {errors.reason && <p id={`${formId}-reason-error`} className="mt-1 text-xs font-medium text-red-600">{errors.reason}</p>}
        </fieldset>

        <div>
          <label htmlFor={`${formId}-message`} className="text-sm font-semibold text-stone-700">
            {t('report.details')} <span className="text-red-600">*</span>
          </label>
          <p id={`${formId}-message-hint`} className="text-xs text-stone-500">{t('report.detailsHint')}</p>
          <textarea
            id={`${formId}-message`}
            rows={4}
            maxLength={2000}
            value={values.message}
            aria-invalid={Boolean(errors.message)}
            aria-describedby={`${formId}-message-hint${errors.message ? ` ${formId}-message-error` : ''}`}
            onChange={(e) => set({ message: e.target.value })}
            className={`${FIELD} mt-1.5`}
          />
          {errors.message && <p id={`${formId}-message-error`} className="mt-1 text-xs font-medium text-red-600">{errors.message}</p>}
        </div>

        <div>
          <label htmlFor={`${formId}-email`} className="text-sm font-semibold text-stone-700">
            {t('report.email')} <span className="font-normal text-stone-500">{t('report.optional')}</span>
          </label>
          <p id={`${formId}-email-hint`} className="text-xs text-stone-500">{t('report.emailHint')}</p>
          <input
            id={`${formId}-email`}
            type="email"
            maxLength={150}
            value={values.email}
            aria-invalid={Boolean(errors.email)}
            aria-describedby={`${formId}-email-hint${errors.email ? ` ${formId}-email-error` : ''}`}
            onChange={(e) => set({ email: e.target.value })}
            className={`${FIELD} mt-1.5`}
          />
          {errors.email && <p id={`${formId}-email-error`} className="mt-1 text-xs font-medium text-red-600">{errors.email}</p>}
        </div>

        {/* Spam trap: hidden from people, filled in by bots. */}
        <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
          <label htmlFor={`${formId}-website`}>Website</label>
          <input id={`${formId}-website`} tabIndex={-1} autoComplete="off" value={values.website} onChange={(e) => set({ website: e.target.value })} />
        </div>

        <p className="text-xs text-stone-500">
          {t('report.privacyNote')}{' '}
          <Link to="/privacy" target="_blank" className="font-semibold text-bay-700 underline">
            {t('report.privacyLink')}
          </Link>
        </p>
      </form>
    </Modal>
  )
}

export default function ReportIssue({ slug, serviceTitle }) {
  const { t } = useI18n()
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex min-h-11 items-center gap-2 rounded-md text-sm font-semibold text-bay-700 underline-offset-4 transition-colors hover:text-bay-900 hover:underline print:hidden"
      >
        <Flag size={16} aria-hidden="true" /> {t('report.button')}
      </button>
      {open && <ReportForm slug={slug} serviceTitle={serviceTitle} onClose={() => setOpen(false)} />}
    </>
  )
}
