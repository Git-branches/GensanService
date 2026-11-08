import { useEffect, useId, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import {
  BadgeCheck,
  CircleCheck,
  Clock,
  CloudDownload,
  Copy,
  ExternalLink,
  History,
  Info,
  Landmark,
  LayoutGrid,
  Link2,
  ListChecks,
  ListOrdered,
  Lock,
  MapPin,
  PhilippinePeso,
  RefreshCw,
  Share2,
  UserCheck,
} from 'lucide-react'
import PageHeader from '../components/PageHeader'
import Checklist from '../components/Checklist'
import OfficeCard from '../components/OfficeCard'
import VerificationBadge from '../components/VerificationBadge'
import ReportIssue from '../components/ReportIssue'
import HelpfulFeedback from '../components/HelpfulFeedback'
import RenewalReminder from '../components/RenewalReminder'
import ServiceCard from '../components/ServiceCard'
import { ErrorState, LoadingState } from '../components/StateMessage'
import { useFetch } from '../hooks/useFetch'
import { usePageTitle } from '../hooks/usePageTitle'
import { useI18n } from '../i18n/context'
import { getService, recordView } from '../services/api'
import { addRecentlyViewed, isFirstViewThisVisit } from '../utils/deviceHistory'
import { formatDate } from '../utils/format'
import { isSaved, offlineSupported, saveGuideOffline } from '../utils/offline'

// bare leaves off the card for sections whose content is already made of cards.
function DetailSection({ id, icon: Icon, title, bare = false, children }) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-title`}
      className={`scroll-mt-24 ${bare ? '' : 'rounded-xl border border-stone-200 bg-white print:border-0'}`}
    >
      <div className={`flex items-center gap-3 ${bare ? 'pb-4' : 'border-b border-stone-100 px-5 py-4 sm:px-6'}`}>
        <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-bay-50 text-bay-700 ring-1 ring-bay-100 print:hidden">
          <Icon size={18} aria-hidden="true" />
        </span>
        <h2 id={`${id}-title`} className="text-xl font-extrabold tracking-tight text-bay-950">
          {title}
        </h2>
      </div>
      <div className={bare ? '' : 'p-5 sm:p-6'}>{children}</div>
    </section>
  )
}

function Fact({ icon: Icon, label, children }) {
  return (
    <div className="relative py-3.5 pl-7.5">
      <dt className="text-xs font-bold uppercase tracking-wide text-stone-500">
        <Icon size={18} aria-hidden="true" className="absolute left-0 top-4 text-bay-600" />
        {label}
      </dt>
      <dd className="mt-0.5 text-base text-stone-900 sm:text-sm">{children}</dd>
    </div>
  )
}

function AtAGlance({ service }) {
  const { t, locale } = useI18n()

  return (
    <div className="overflow-hidden rounded-xl border border-stone-200 bg-white">
      <h2 className="border-b border-stone-100 px-5 py-3 text-base font-bold text-bay-950">{t('detail.atAGlance')}</h2>
      <dl className="divide-y divide-stone-100 px-5">
        <Fact icon={Landmark} label={t('detail.agency')}>
          <Link to={`/agencies/${service.agency_slug}`} className="inline-block min-h-6 font-semibold text-bay-700 hover:underline">
            {service.agency_name}
          </Link>
        </Fact>
        <Fact icon={LayoutGrid} label={t('detail.category')}>
          <Link to={`/services?category=${service.category_slug}`} className="inline-block min-h-6 font-semibold text-bay-700 hover:underline">
            {service.category_name}
          </Link>
        </Fact>
        <Fact icon={Clock} label={t('detail.processing')}>
          {service.processing_time_description || <span className="text-stone-500">{t('common.notYetVerified')}</span>}
        </Fact>
        {service.last_verified_at && (
          <Fact icon={BadgeCheck} label={service.verification_status === 'verified' ? t('detail.lastVerified') : t('detail.lastChecked')}>
            {formatDate(service.last_verified_at, { year: 'numeric', month: 'long', day: 'numeric' }, locale)}
          </Fact>
        )}
      </dl>
      {service.agency_website && (
        <div className="border-t border-stone-100 p-5 print:hidden">
          <a
            href={service.agency_website}
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-h-11 items-center justify-center gap-2 rounded-lg border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-700 transition-colors hover:bg-stone-50"
          >
            {t('detail.officialWebsite', { agency: service.agency_acronym || t('detail.agencyFallback') })} <ExternalLink size={15} aria-hidden="true" />
            <span className="sr-only">{t('common.opensInNewTab')}</span>
          </a>
        </div>
      )}
    </div>
  )
}

const ACTION_BUTTON = 'inline-flex min-h-11 items-center gap-1.5 rounded-md text-sm font-semibold text-bay-700 underline-offset-4 hover:underline'

function useCopy() {
  const { t } = useI18n()
  const [notice, setNotice] = useState('')

  async function copy(text, success) {
    try {
      await navigator.clipboard.writeText(text)
      setNotice(success)
    } catch {
      setNotice(t('detail.copyFailed'))
    }
  }

  return [notice, copy]
}

// Stores the guide on this phone now, so it opens without signal. Shown only where offline support works.
// Guide pages are drawn in the browser, so these checks can run on the first render.
function SaveOffline({ slug }) {
  const { t } = useI18n()
  const [supported] = useState(offlineSupported)
  const [state, setState] = useState(() => (isSaved(slug) ? 'saved' : 'idle'))

  if (!supported) return null

  async function save() {
    setState('saving')
    try {
      await saveGuideOffline(slug)
      setState('saved')
    } catch {
      setState('failed')
    }
  }

  if (state === 'saved') {
    return (
      <span className="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-emerald-700">
        <CircleCheck size={15} aria-hidden="true" /> {t('offline.saved')}
      </span>
    )
  }

  return (
    <>
      <button type="button" onClick={save} disabled={state === 'saving'} className={`${ACTION_BUTTON} disabled:opacity-60`}>
        <CloudDownload size={15} aria-hidden="true" /> {state === 'saving' ? t('offline.saving') : t('offline.save')}
      </button>
      {state === 'failed' && <span role="status" className="text-sm text-red-700">{t('offline.saveFailed')}</span>}
    </>
  )
}

function GuideActions({ title, slug }) {
  const { t } = useI18n()
  const [notice, copy] = useCopy()
  const url = window.location.href.split('?')[0]

  async function share() {
    try {
      await navigator.share({ title, url })
    } catch {
      // The person closed the share sheet.
    }
  }

  return (
    <div className="mt-1 flex flex-wrap items-center gap-x-5 print:hidden sm:mt-2">
      {typeof navigator.share === 'function' && (
        <button type="button" onClick={share} className={ACTION_BUTTON}>
          <Share2 size={15} aria-hidden="true" /> {t('detail.share')}
        </button>
      )}
      <button type="button" onClick={() => copy(url, t('detail.linkCopied'))} className={ACTION_BUTTON}>
        <Link2 size={15} aria-hidden="true" /> {t('detail.copyLink')}
      </button>
      {slug && <SaveOffline key={slug} slug={slug} />}
      <span role="status" className="text-sm text-stone-600">{notice}</span>
    </div>
  )
}

function Sources({ id, sources }) {
  const { t, locale } = useI18n()
  const [notice, copy] = useCopy()
  if (!sources?.length) return null

  return (
    <div id={id} className="scroll-mt-24 rounded-xl border border-stone-200 bg-white p-5">
      <h2 className="text-base font-bold text-bay-950">{t('detail.sources')}</h2>
      <ul className="mt-2 space-y-1">
        {sources.map((source) => (
          <li key={source.url}>
            <a
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-bay-700 hover:underline"
            >
              {source.label || source.url} <ExternalLink size={13} aria-hidden="true" />
              <span className="sr-only">{t('common.opensInNewTab')}</span>
            </a>
            {source.verified_at && (
              <span className="block text-xs text-stone-500">{t('detail.checked', { date: formatDate(source.verified_at, undefined, locale) })}</span>
            )}
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={() => copy(sources.map((source) => source.url).join('\n'), t('detail.sourcesCopied'))}
        className={`${ACTION_BUTTON} mt-3 print:hidden`}
      >
        <Copy size={14} aria-hidden="true" /> {t('detail.copySources')}
      </button>
      <span role="status" className="ml-3 text-sm text-stone-600">{notice}</span>
    </div>
  )
}

// Lets a phone call a number in a step, such as "hotline 1455".
function StepText({ text }) {
  return text.split(/(?<=hotline )(\d{3,})/i).map((part, index) =>
    index % 2 ? (
      <a key={part} href={`tel:${part}`} className="inline-block min-h-6 font-semibold text-bay-700 underline underline-offset-2">{part}</a>
    ) : (
      part
    ),
  )
}

// Icons for detail.reminders, in the same order: disclaimer, changing details, account safety.
const REMINDER_ICONS = [Info, RefreshCw, Lock]

function Reminder({ agencyAcronym }) {
  const { t } = useI18n()
  const titleId = useId()
  const items = t('detail.reminders', { agency: agencyAcronym || t('detail.theAgency') })

  return (
    <section aria-labelledby={titleId} className="rounded-r-xl border-l-4 border-sun-400 bg-sun-50/60 p-5">
      <h2 id={titleId} className="text-base font-bold text-bay-950">{t('detail.doubleCheck')}</h2>
      <ul className="mt-4 space-y-3.5">
        {items.map(({ lead, text }, index) => {
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
  )
}

// loadGuide is set by the admin preview, which shows a guide residents may not see yet.
export default function ServiceDetailPage({ loadGuide }) {
  const { t, locale } = useI18n()
  const { slug } = useParams()
  const { hash } = useLocation()
  const { data: service, error, loading } = useFetch(() => (loadGuide ? loadGuide() : getService(slug)), [slug, loadGuide])
  const preview = Boolean(loadGuide)
  usePageTitle(service?.title ?? t('detail.pageTitle'), service?.summary)

  useEffect(() => {
    if (!service || preview) return
    addRecentlyViewed({ slug: service.slug, title: service.title })
    if (isFirstViewThisVisit(service.slug)) recordView(service.slug).catch(() => {})
  }, [service, preview])

  // The section a link points to only exists once the guide has loaded.
  useEffect(() => {
    if (service && hash) document.getElementById(hash.slice(1))?.scrollIntoView()
  }, [service, hash])

  if (loading) return <LoadingState label={t('detail.loading')} fill />
  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <ErrorState message={t('detail.unavailable')} action={{ to: '/services', label: t('detail.back') }} />
      </div>
    )
  }
  if (!service) return null

  const sections = [
    service.requirements?.length && { id: 'checklist', label: t('detail.checklist') },
    service.eligibility?.length && { id: 'eligibility', label: t('detail.eligibility') },
    service.steps?.length && { id: 'steps', label: t('detail.steps') },
    service.offices?.length && { id: 'offices', label: t('detail.whereToGo') },
    service.description && { id: 'about', label: t('detail.about') },
    service.updates?.length && { id: 'updates', label: t('detail.updates') },
  ].filter(Boolean)

  // Phones jump straight past the checklist, which is already on screen.
  const phoneSections = [
    ...sections.filter((section) => section.id !== 'checklist'),
    { id: 'facts', label: t('detail.atAGlance') },
    service.sources?.length && { id: 'sources', label: t('detail.sources') },
  ].filter(Boolean)

  const afterChecklist = sections.filter((section) => section.id === 'steps' || section.id === 'offices')

  return (
    <>
      <PageHeader
        breadcrumbs={[
          { to: '/', label: t('common.home') },
          { to: '/services', label: t('nav.services') },
          { to: `/services?category=${service.category_slug}`, label: service.category_name },
        ]}
        meta={[service.agency_acronym, service.agency_name].filter(Boolean).join(' — ')}
        title={service.title}
        description={service.summary}
        contentLang="en"
        compact
      >
        <div className="mt-3 sm:mt-4">
          <VerificationBadge status={service.verification_status} date={service.last_verified_at} />
        </div>
        {service.verification_status !== 'verified' && (
          <p className="mt-2 max-w-2xl text-sm text-stone-600">{t('detail.verificationNote')}</p>
        )}
        {locale !== 'en' && <p className="mt-2 max-w-2xl text-sm font-semibold text-stone-700">{t('detail.englishNotice')}</p>}
        {!preview && <GuideActions title={service.title} slug={service.slug} />}
        <nav aria-label={t('detail.onThisPage')} className="-mx-4 mt-1 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:mt-2 sm:flex-wrap sm:px-0 lg:hidden print:hidden">
          {phoneSections.map((section) => (
            <a
              key={section.id}
              href={`#${section.id}`}
              className="inline-flex min-h-11 shrink-0 items-center rounded-lg bg-white px-3 text-sm font-semibold text-bay-700 ring-1 ring-bay-100 transition-colors hover:bg-bay-50"
            >
              {section.label}
            </a>
          ))}
        </nav>
      </PageHeader>

      <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6 sm:py-12">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8">
          <div className="space-y-6 lg:col-span-8">
            {service.requirements?.length > 0 && (
              <DetailSection id="checklist" icon={ListChecks} title={t('detail.checklist')}>
                <p className="mb-4 flex items-start gap-2 text-stone-900">
                  <PhilippinePeso size={18} aria-hidden="true" className="mt-1 shrink-0 text-bay-600" />
                  <span>
                    <strong className="font-bold">{t('detail.fee')}:</strong>{' '}
                    {service.fee_description ? <span lang="en">{service.fee_description}</span> : <span className="text-stone-500">{t('common.notYetVerified')}</span>}
                  </span>
                </p>
                <Checklist
                  key={service.slug}
                  slug={service.slug}
                  requirements={service.requirements}
                  next={afterChecklist.map((section) => ({ href: `#${section.id}`, label: section.label }))}
                />
              </DetailSection>
            )}

            {service.eligibility?.length > 0 && (
              <DetailSection id="eligibility" icon={UserCheck} title={t('detail.eligibility')}>
                <ul className="space-y-3">
                  {service.eligibility.map((condition) => (
                    <li key={condition} className="flex gap-3 text-stone-700">
                      <CircleCheck size={20} aria-hidden="true" className="mt-0.5 shrink-0 text-emerald-600" />
                      <span lang="en" className="leading-relaxed">{condition}</span>
                    </li>
                  ))}
                </ul>
              </DetailSection>
            )}

            {service.steps?.length > 0 && (
              <DetailSection id="steps" icon={ListOrdered} title={t('detail.steps')}>
                {service.agency_website && (
                  <a
                    href={service.agency_website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mb-3 inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-bay-700 hover:underline print:hidden"
                  >
                    {t('detail.officialWebsite', { agency: service.agency_acronym || t('detail.agencyFallback') })} <ExternalLink size={14} aria-hidden="true" />
                    <span className="sr-only">{t('common.opensInNewTab')}</span>
                  </a>
                )}
                <ol className="space-y-6">
                  {service.steps.map((step, index) => (
                    <li key={step.step_number} className="relative flex gap-4">
                      {index < service.steps.length - 1 && (
                        <span aria-hidden="true" className="absolute -bottom-6 left-[1.1rem] top-10 w-0.5 bg-bay-100" />
                      )}
                      <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-bay-700 text-sm font-extrabold text-sun-300">
                        {step.step_number}
                      </span>
                      <div className="pt-1">
                        <h3 lang="en" className="font-bold text-bay-950">{step.title}</h3>
                        {step.instructions && <p lang="en" className="mt-1 leading-relaxed text-stone-600"><StepText text={step.instructions} /></p>}
                      </div>
                    </li>
                  ))}
                </ol>
              </DetailSection>
            )}

            {service.offices?.length > 0 && (
              <DetailSection id="offices" icon={MapPin} title={t('detail.whereToGo')}>
                <div className="divide-y divide-stone-100 [&>*]:py-6 [&>*:first-child]:pt-0 [&>*:last-child]:pb-0">
                  {service.offices.map((office) => (
                    <OfficeCard
                      key={office.id}
                      office={{ ...office, agency_name: service.agency_name, agency_acronym: service.agency_acronym, agency_logo_url: service.agency_logo_url, agency_is_local: service.agency_is_local }}
                      showAgency={false}
                      embedded
                    />
                  ))}
                </div>
              </DetailSection>
            )}

            {Boolean(service.renewal_reminder) && <RenewalReminder title={service.title} slug={service.slug} />}

            <div id="facts" className="scroll-mt-24 lg:hidden">
              <AtAGlance service={service} />
            </div>

            {service.description && (
              <DetailSection id="about" icon={Info} title={t('detail.about')}>
                <p lang="en" className="max-w-xl leading-relaxed text-stone-700">{service.description}</p>
              </DetailSection>
            )}

            {service.updates?.length > 0 && (
              <DetailSection id="updates" icon={History} title={t('detail.updates')}>
                <ol className="space-y-3">
                  {service.updates.map((update, index) => (
                    <li key={`${update.date}-${index}`} className="flex flex-col gap-0.5 sm:flex-row sm:gap-4">
                      <time dateTime={update.date} className="shrink-0 text-sm font-bold text-bay-800 sm:w-32">
                        {formatDate(update.date, { year: 'numeric', month: 'short', day: 'numeric' }, locale)}
                      </time>
                      <p lang="en" className="leading-relaxed text-stone-700">{update.note}</p>
                    </li>
                  ))}
                </ol>
              </DetailSection>
            )}

            {!preview && <HelpfulFeedback key={service.slug} slug={service.slug} />}

            <div className="space-y-4 lg:hidden">
              <Sources id="sources" sources={service.sources} />
              <Reminder agencyAcronym={service.agency_acronym} />
              {!preview && <ReportIssue slug={service.slug} serviceTitle={service.title} />}
            </div>
          </div>

          <aside className="hidden lg:col-span-4 lg:block">
            <div className="space-y-4">
              <AtAGlance service={service} />

              {sections.length > 1 && (
                <nav aria-label={t('detail.onThisPage')} className="rounded-xl border border-stone-200 bg-white p-5 print:hidden">
                  <p className="text-xs font-bold uppercase tracking-wide text-stone-500">{t('detail.onThisPage')}</p>
                  <ul className="mt-2 space-y-0.5 border-l-2 border-stone-100">
                    {sections.map((section) => (
                      <li key={section.id}>
                        <a
                          href={`#${section.id}`}
                          className="-ml-0.5 block border-l-2 border-transparent px-3 py-1.5 text-sm text-stone-700 hover:border-sun-400 hover:text-bay-700"
                        >
                          {section.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </nav>
              )}

              <Sources sources={service.sources} />
              <Reminder agencyAcronym={service.agency_acronym} />
              {!preview && <ReportIssue slug={service.slug} serviceTitle={service.title} />}
            </div>
          </aside>
        </div>

        {service.related?.length > 0 && (
          <section aria-labelledby="related-title" className="mt-12 print:hidden">
            <h2 id="related-title" className="text-xl font-extrabold tracking-tight text-bay-950">{t('detail.related')}</h2>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {service.related.map((guide) => (
                <ServiceCard key={guide.slug} service={guide} />
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  )
}
