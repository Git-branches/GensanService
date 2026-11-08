import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Check, ChevronRight, ExternalLink, Info, Lock, RefreshCw, RotateCcw, Undo2 } from 'lucide-react'
import AgencyLogo from '../components/AgencyLogo'
import PageHeader from '../components/PageHeader'
import VerificationBadge from '../components/VerificationBadge'
import { ErrorState, LoadingState } from '../components/StateMessage'
import { useFetch } from '../hooks/useFetch'
import { usePageTitle } from '../hooks/usePageTitle'
import { useI18n } from '../i18n/context'
import { getLifeEvent } from '../services/api'

const storageKey = (slug) => `andam-life-event:${slug}`

function readDone(slug) {
  try {
    return JSON.parse(localStorage.getItem(storageKey(slug))) || {}
  } catch {
    return {}
  }
}

function saveDone(slug, value) {
  try {
    localStorage.setItem(storageKey(slug), JSON.stringify(value))
  } catch {
    // Without storage, progress lasts until the page is closed.
  }
}

const REMINDER_ICONS = [Info, RefreshCw, Lock]

function Step({ step, number, done, onToggle }) {
  const { t } = useI18n()
  const checkboxId = `life-step-${step.id}`

  return (
    <li className="relative flex gap-4">
      <span
        className={`relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-extrabold ${
          done ? 'bg-emerald-600 text-white' : 'bg-bay-700 text-sun-300'
        }`}
      >
        {done ? <Check size={18} strokeWidth={3} aria-hidden="true" /> : number}
      </span>

      <div className={`min-w-0 flex-1 rounded-xl border bg-white p-4 sm:p-5 ${done ? 'border-emerald-200' : 'border-stone-200'}`}>
        <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
          <h2 lang="en" className={`text-lg font-bold leading-snug ${done ? 'text-stone-500' : 'text-bay-950'}`}>
            <span className="sr-only">{t('lifeEvent.stepNumber', { number })}: </span>
            {step.title}
          </h2>
          {step.is_optional && (
            <span className="rounded bg-sun-50 px-1.5 py-0.5 text-xs font-semibold text-sun-800 ring-1 ring-sun-200">{t('checklist.ifApplicable')}</span>
          )}
        </div>
        {step.note && <p lang="en" className="mt-1.5 leading-relaxed text-stone-700">{step.note}</p>}

        {step.guide_slug ? (
          <Link
            to={`/services/${step.guide_slug}`}
            className="group mt-3 flex items-center gap-3 rounded-lg bg-bay-50 p-3 ring-1 ring-bay-100 transition-colors hover:bg-bay-100"
          >
            <AgencyLogo
              agency={{ name: step.agency_name, acronym: step.agency_acronym, logo_url: step.agency_logo_url, is_local_government: step.agency_is_local }}
              size="sm"
            />
            <span className="min-w-0 flex-1">
              <span className="block text-xs font-bold uppercase tracking-wide text-stone-500">{t('lifeEvent.openGuide')}</span>
              <span lang="en" className="block font-semibold text-bay-800 group-hover:underline">{step.guide_title}</span>
            </span>
            <ChevronRight size={18} aria-hidden="true" className="shrink-0 text-bay-600" />
          </Link>
        ) : (
          <p className="mt-3 text-sm text-stone-600">
            <span className="font-semibold text-stone-700">{t('lifeEvent.noGuide')}</span>
            {step.source_url && (
              <>
                {' '}
                <a href={step.source_url} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-1 font-semibold text-bay-700 hover:underline">
                  {t('lifeEvent.source')} <ExternalLink size={13} aria-hidden="true" />
                  <span className="sr-only">{t('common.opensInNewTab')}</span>
                </a>
              </>
            )}
          </p>
        )}

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-stone-100 pt-3">
          {step.guide_slug && <VerificationBadge status={step.guide_verification_status} />}
          <label htmlFor={checkboxId} className="ml-auto inline-flex min-h-11 cursor-pointer items-center gap-2.5 text-sm font-semibold text-stone-700">
            <input id={checkboxId} type="checkbox" checked={done} onChange={onToggle} className="peer sr-only" />
            <span
              aria-hidden="true"
              className={`flex h-5 w-5 items-center justify-center rounded border-2 transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-bay-500 peer-focus-visible:ring-offset-2 ${
                done ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-stone-400 bg-white'
              }`}
            >
              {done && <Check size={14} strokeWidth={3} />}
            </span>
            {t('lifeEvent.markDone')}
          </label>
        </div>
      </div>
    </li>
  )
}

// Progress lives on this device only, like the guide checklists.
function Steps({ slug, steps }) {
  const { t } = useI18n()
  const [done, setDone] = useState(() => readDone(slug))
  const [beforeReset, setBeforeReset] = useState(null)

  const required = steps.filter((step) => !step.is_optional)
  const counted = required.length ? required : steps
  const doneCount = counted.filter((step) => done[step.id]).length
  const percent = counted.length ? Math.round((doneCount / counted.length) * 100) : 0
  const allDone = percent === 100

  function update(value) {
    setDone(value)
    saveDone(slug, value)
    setBeforeReset(null)
  }

  return (
    <>
      <div className={`sticky top-[4.25rem] z-20 rounded-lg p-4 lg:static ${allDone ? 'bg-emerald-50' : 'bg-bay-50'}`}>
        <div className="flex items-center justify-between gap-3 text-sm">
          <span aria-live="polite" className="font-bold text-bay-950">
            {allDone ? t('lifeEvent.allDone') : t('lifeEvent.progress', { done: doneCount, total: counted.length })}
          </span>
          <span className="font-semibold tabular-nums text-stone-600">{percent}%</span>
        </div>
        <div
          role="progressbar"
          aria-label={t('lifeEvent.progressLabel')}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percent}
          className="mt-2.5 h-2.5 overflow-hidden rounded-full bg-white ring-1 ring-inset ring-bay-100"
        >
          <div className={`h-full rounded-full transition-all duration-500 ${allDone ? 'bg-emerald-500' : 'bg-sun-400'}`} style={{ width: `${percent}%` }} />
        </div>
      </div>

      <ol className="relative mt-6 space-y-5">
        <span aria-hidden="true" className="absolute bottom-6 left-[1.1rem] top-6 w-0.5 bg-bay-100" />
        {steps.map((step, index) => (
          <Step key={step.id} step={step} number={index + 1} done={Boolean(done[step.id])} onToggle={() => update({ ...done, [step.id]: !done[step.id] })} />
        ))}
      </ol>

      {(Object.values(done).some(Boolean) || beforeReset) && (
        <button
          type="button"
          onClick={() => {
            if (beforeReset) return update(beforeReset)
            const previous = done
            update({})
            setBeforeReset(previous)
          }}
          className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-lg px-4 text-sm font-semibold text-stone-600 transition-colors hover:bg-stone-100"
        >
          {beforeReset ? <Undo2 size={16} aria-hidden="true" /> : <RotateCcw size={16} aria-hidden="true" />}
          {beforeReset ? t('checklist.undo') : t('checklist.reset')}
        </button>
      )}
      <p className="mt-4 text-sm leading-relaxed text-stone-600">{t('lifeEvent.deviceNote')}</p>
    </>
  )
}

export default function LifeEventPage() {
  const { t } = useI18n()
  const { slug } = useParams()
  const { data: event, error, loading } = useFetch(() => getLifeEvent(slug), [slug])
  usePageTitle(event?.title ?? t('lifeEvent.pageTitle'), event?.summary)

  if (loading) return <LoadingState label={t('lifeEvent.loading')} fill />
  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <ErrorState message={t('lifeEvent.unavailable')} action={{ to: '/', label: t('notFound.home') }} />
      </div>
    )
  }
  if (!event) return null

  return (
    <>
      <PageHeader
        breadcrumbs={[{ to: '/', label: t('common.home') }, { label: t('lifeEvent.breadcrumb') }]}
        title={event.title}
        description={event.summary}
        contentLang="en"
        compact
      >
        {event.description && <p lang="en" className="mt-3 max-w-2xl text-sm text-stone-600">{event.description}</p>}
      </PageHeader>

      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-10">
        <Steps key={slug} slug={slug} steps={event.steps} />

        <section aria-labelledby="life-event-reminders" className="mt-10 rounded-r-xl border-l-4 border-sun-400 bg-sun-50/60 p-5">
          <h2 id="life-event-reminders" className="text-base font-bold text-bay-950">{t('detail.doubleCheck')}</h2>
          <ul className="mt-4 space-y-3.5">
            {t('detail.reminders', { agency: t('detail.theAgency') }).map(({ lead, text }, index) => {
              const Icon = REMINDER_ICONS[index]
              return (
                <li key={lead} className="flex items-start gap-3">
                  <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-sun-700 ring-1 ring-sun-200">
                    <Icon size={16} aria-hidden="true" />
                  </span>
                  <p className="pt-1 text-base leading-relaxed text-stone-700 sm:text-sm">
                    <strong className="font-bold text-bay-950">{lead}</strong> {text}
                  </p>
                </li>
              )
            })}
          </ul>
        </section>
      </div>
    </>
  )
}
