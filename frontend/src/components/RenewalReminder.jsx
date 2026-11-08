import { useId, useState } from 'react'
import { BellRing, CalendarPlus, Download, ExternalLink } from 'lucide-react'
import { useI18n } from '../i18n/context'
import { formatDate } from '../utils/format'

const LONG_DATE = { year: 'numeric', month: 'long', day: 'numeric' }

const DAYS_BEFORE = 14

// Dates stay as calendar days ("2027-01-20"), so the phone's time zone never shifts them.
function addDays(iso, days) {
  const date = new Date(`${iso}T00:00:00Z`)
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}
const compact = (iso) => iso.replaceAll('-', '')
const todayIso = () => {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

// RFC 5545 text: escape backslashes, commas, semicolons, and new lines.
const icsText = (text) => text.replace(/[\\,;]/g, (match) => `\\${match}`).replace(/\n/g, '\\n')

function icsFile({ title, details, day, slug }) {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Andam GenSan//Renewal reminder//EN',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:${slug}-${compact(day)}@andam-gensan`,
    `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').slice(0, 15)}Z`,
    `DTSTART;VALUE=DATE:${compact(day)}`,
    `DTEND;VALUE=DATE:${compact(addDays(day, 1))}`,
    `SUMMARY:${icsText(title)}`,
    `DESCRIPTION:${icsText(details)}`,
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    `DESCRIPTION:${icsText(title)}`,
    'TRIGGER:PT9H',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ]
  return `${lines.join('\r\n')}\r\n`
}

// Made on this device: nothing is sent to Andam GenSan. The resident enters their own expiry date,
// so the guide never has to state a deadline the official sources do not give.
export default function RenewalReminder({ title, slug }) {
  const { t, locale } = useI18n()
  const id = useId()
  const [expiry, setExpiry] = useState('')
  const today = todayIso()
  const valid = expiry > today
  const remindOn = valid ? (addDays(expiry, -DAYS_BEFORE) > today ? addDays(expiry, -DAYS_BEFORE) : today) : null

  const eventTitle = t('reminder.eventTitle', { title })
  const details = t('reminder.eventDetails', { title, date: expiry ? formatDate(expiry, LONG_DATE, locale) : '', url: `${window.location.origin}/services/${slug}` })
  const googleUrl = remindOn
    ? `https://calendar.google.com/calendar/render?${new URLSearchParams({
        action: 'TEMPLATE',
        text: eventTitle,
        dates: `${compact(remindOn)}/${compact(addDays(remindOn, 1))}`,
        details,
      })}`
    : null

  function download() {
    const blob = new Blob([icsFile({ title: eventTitle, details, day: remindOn, slug })], { type: 'text/calendar;charset=utf-8' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `renew-${slug}.ics`
    link.click()
    setTimeout(() => URL.revokeObjectURL(link.href), 1000)
  }

  const button = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold transition-colors'

  return (
    <section aria-labelledby={`${id}-title`} className="rounded-xl border border-stone-200 bg-white p-5 sm:p-6">
      <div className="flex items-center gap-3">
        <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-bay-50 text-bay-700 ring-1 ring-bay-100">
          <BellRing size={18} aria-hidden="true" />
        </span>
        <h2 id={`${id}-title`} className="text-xl font-extrabold tracking-tight text-bay-950">{t('reminder.title')}</h2>
      </div>
      <p className="mt-3 max-w-xl text-stone-700">{t('reminder.intro', { days: DAYS_BEFORE })}</p>

      <label htmlFor={`${id}-date`} className="mt-4 block text-sm font-semibold text-stone-800">{t('reminder.expiry')}</label>
      <input
        id={`${id}-date`}
        type="date"
        min={addDays(today, 1)}
        value={expiry}
        onChange={(event) => setExpiry(event.target.value)}
        aria-describedby={`${id}-hint`}
        className="mt-1.5 w-full max-w-60 rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-base focus:border-bay-500 focus:outline-none focus:ring-2 focus:ring-bay-500/20"
      />
      <p id={`${id}-hint`} className="mt-1.5 text-sm text-stone-600">
        {expiry && !valid ? t('reminder.pastDate') : remindOn ? t('reminder.remindOn', { date: formatDate(remindOn, LONG_DATE, locale) }) : t('reminder.hint')}
      </p>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <a
          href={googleUrl ?? undefined}
          aria-disabled={!googleUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(event) => !googleUrl && event.preventDefault()}
          className={`${button} bg-bay-700 text-white hover:bg-bay-800 aria-disabled:pointer-events-none aria-disabled:opacity-50`}
        >
          <CalendarPlus size={16} aria-hidden="true" /> {t('reminder.google')} <ExternalLink size={14} aria-hidden="true" />
          <span className="sr-only">{t('common.opensInNewTab')}</span>
        </a>
        <button type="button" disabled={!remindOn} onClick={download} className={`${button} border border-stone-300 text-stone-700 hover:bg-stone-50 disabled:opacity-50`}>
          <Download size={16} aria-hidden="true" /> {t('reminder.download')}
        </button>
      </div>
      <p className="mt-3 text-xs text-stone-500">{t('reminder.privacy')}</p>
    </section>
  )
}
