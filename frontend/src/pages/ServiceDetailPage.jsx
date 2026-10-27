import { Link, useParams } from 'react-router-dom'
import {
  AlertTriangle,
  BadgeCheck,
  CircleCheck,
  Clock,
  ExternalLink,
  Info,
  Landmark,
  LayoutGrid,
  ListChecks,
  ListOrdered,
  MapPin,
  Receipt,
  UserCheck,
} from 'lucide-react'
import PageHeader from '../components/PageHeader'
import Checklist from '../components/Checklist'
import OfficeCard from '../components/OfficeCard'
import VerifiedBadge from '../components/VerifiedBadge'
import ReportIssue from '../components/ReportIssue'
import { ErrorState, LoadingState } from '../components/StateMessage'
import { useFetch } from '../hooks/useFetch'
import { usePageTitle } from '../hooks/usePageTitle'
import { useI18n } from '../i18n/context'
import { getService } from '../services/api'
import { formatDate } from '../utils/format'

function DetailSection({ id, icon: Icon, title, children }) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-title`}
      className="scroll-mt-24 rounded-xl border border-stone-200 bg-white print:border-0"
    >
      <div className="flex items-center gap-3 border-b border-stone-100 px-5 py-4 sm:px-6">
        <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-bay-50 text-bay-700 ring-1 ring-bay-100 print:hidden">
          <Icon size={18} aria-hidden="true" />
        </span>
        <h2 id={`${id}-title`} className="text-xl font-extrabold tracking-tight text-bay-950">
          {title}
        </h2>
      </div>
      <div className="p-5 sm:p-6">{children}</div>
    </section>
  )
}

function Fact({ icon: Icon, label, children }) {
  return (
    <div className="flex gap-3 py-3.5">
      <Icon size={18} aria-hidden="true" className="mt-0.5 shrink-0 text-bay-600" />
      <div className="min-w-0">
        <dt className="text-xs font-bold uppercase tracking-wide text-stone-500">{label}</dt>
        <dd className="mt-0.5 text-sm text-stone-900">{children}</dd>
      </div>
    </div>
  )
}

function AtAGlance({ service }) {
  const { t } = useI18n()

  return (
    <div className="overflow-hidden rounded-xl border border-stone-200 bg-white">
      <h2 className="border-b-4 border-sun-400 bg-bay-900 px-5 py-3 text-base font-bold text-white">{t('detail.atAGlance')}</h2>
      <dl className="divide-y divide-stone-100 px-5">
        <Fact icon={Landmark} label={t('detail.agency')}>
          <Link to={`/agencies/${service.agency_slug}`} className="font-semibold text-bay-700 hover:underline">
            {service.agency_name}
          </Link>
        </Fact>
        <Fact icon={LayoutGrid} label={t('detail.category')}>
          <Link to={`/services?category=${service.category_slug}`} className="font-semibold text-bay-700 hover:underline">
            {service.category_name}
          </Link>
        </Fact>
        {service.fee_description && (
          <Fact icon={Receipt} label={t('detail.fee')}>
            {service.fee_description}
          </Fact>
        )}
        {service.processing_time_description && (
          <Fact icon={Clock} label={t('detail.processing')}>
            {service.processing_time_description}
          </Fact>
        )}
        {service.last_verified_at && (
          <Fact icon={BadgeCheck} label={t('detail.lastVerified')}>
            {formatDate(service.last_verified_at, { year: 'numeric', month: 'long', day: 'numeric' })}
          </Fact>
        )}
      </dl>
      {service.agency_website && (
        <div className="border-t border-stone-100 p-5 print:hidden">
          <a
            href={service.agency_website}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 rounded-lg bg-bay-700 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-bay-800"
          >
            {t('detail.officialWebsite', { agency: service.agency_acronym || t('detail.agencyFallback') })} <ExternalLink size={15} aria-hidden="true" />
            <span className="sr-only">{t('common.opensInNewTab')}</span>
          </a>
        </div>
      )}
    </div>
  )
}

function Sources({ sources }) {
  const { t } = useI18n()
  if (!sources?.length) return null

  return (
    <div className="rounded-xl border border-stone-200 bg-white p-5">
      <h2 className="text-base font-bold text-bay-950">{t('detail.sources')}</h2>
      <ul className="mt-3 space-y-3">
        {sources.map((source) => (
          <li key={source.url}>
            <a
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-bay-700 hover:underline"
            >
              {source.label || source.url} <ExternalLink size={13} aria-hidden="true" />
              <span className="sr-only">{t('common.opensInNewTab')}</span>
            </a>
            {source.verified_at && (
              <span className="block text-xs text-stone-500">{t('detail.checked', { date: formatDate(source.verified_at) })}</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}

function Reminder({ agencyAcronym }) {
  const { t } = useI18n()

  return (
    <div className="rounded-xl border border-sun-200 border-l-[6px] border-l-sun-400 bg-sun-50 p-5 text-sm text-stone-700">
      <p className="flex items-center gap-2 font-bold text-bay-950">
        <AlertTriangle size={17} aria-hidden="true" className="text-sun-700" /> {t('detail.doubleCheck')}
      </p>
      <p className="mt-2 leading-relaxed">
        {t('detail.doubleCheckText', { agency: agencyAcronym || t('detail.theAgency') })}
      </p>
    </div>
  )
}

export default function ServiceDetailPage() {
  const { t } = useI18n()
  const { slug } = useParams()
  const { data: service, error, loading } = useFetch(() => getService(slug), [slug])
  usePageTitle(service?.title ?? t('detail.pageTitle'))

  if (loading) return <LoadingState label={t('detail.loading')} />
  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <ErrorState message={t('detail.unavailable')} action={{ to: '/services', label: t('detail.back') }} />
      </div>
    )
  }
  if (!service) return null

  const sections = [
    service.description && { id: 'about', label: t('detail.about') },
    service.eligibility?.length && { id: 'eligibility', label: t('detail.eligibility') },
    service.requirements?.length && { id: 'checklist', label: t('detail.checklist') },
    service.steps?.length && { id: 'steps', label: t('detail.steps') },
    service.offices?.length && { id: 'offices', label: t('detail.whereToGo') },
  ].filter(Boolean)

  return (
    <>
      <PageHeader
        breadcrumbs={[
          { to: '/', label: t('common.home') },
          { to: '/services', label: t('nav.services') },
          { to: `/services?category=${service.category_slug}`, label: service.category_name },
        ]}
        kicker={[service.agency_acronym, service.agency_name].filter(Boolean).join(' — ')}
        title={service.title}
        description={service.summary}
      >
        <div className="mt-5 flex flex-wrap gap-2">
          <span className="inline-flex items-center rounded-md bg-white px-2 py-1 text-xs font-semibold text-stone-700 ring-1 ring-stone-200">
            {service.category_name}
          </span>
          <VerifiedBadge date={service.last_verified_at} label={t('detail.lastVerified')} />
        </div>
      </PageHeader>

      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8">
          <div className="space-y-6 lg:col-span-8">
            <div className="lg:hidden">
              <AtAGlance service={service} />
            </div>

            {service.description && (
              <DetailSection id="about" icon={Info} title={t('detail.about')}>
                <p className="leading-relaxed text-stone-700">{service.description}</p>
              </DetailSection>
            )}

            {service.eligibility?.length > 0 && (
              <DetailSection id="eligibility" icon={UserCheck} title={t('detail.eligibility')}>
                <ul className="space-y-3">
                  {service.eligibility.map((condition) => (
                    <li key={condition} className="flex gap-3 text-stone-700">
                      <CircleCheck size={20} aria-hidden="true" className="mt-0.5 shrink-0 text-emerald-600" />
                      <span className="leading-relaxed">{condition}</span>
                    </li>
                  ))}
                </ul>
              </DetailSection>
            )}

            {service.requirements?.length > 0 && (
              <DetailSection id="checklist" icon={ListChecks} title={t('detail.checklist')}>
                <Checklist key={service.slug} slug={service.slug} requirements={service.requirements} />
              </DetailSection>
            )}

            {service.steps?.length > 0 && (
              <DetailSection id="steps" icon={ListOrdered} title={t('detail.steps')}>
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
                        <h3 className="font-bold text-bay-950">{step.title}</h3>
                        {step.instructions && <p className="mt-1 leading-relaxed text-stone-600">{step.instructions}</p>}
                      </div>
                    </li>
                  ))}
                </ol>
              </DetailSection>
            )}

            {service.offices?.length > 0 && (
              <DetailSection id="offices" icon={MapPin} title={t('detail.whereToGo')}>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {service.offices.map((office) => (
                    <OfficeCard key={office.id} office={office} showAgency={false} />
                  ))}
                </div>
              </DetailSection>
            )}

            <div className="space-y-4 lg:hidden">
              <Sources sources={service.sources} />
              <Reminder agencyAcronym={service.agency_acronym} />
              <ReportIssue slug={service.slug} serviceTitle={service.title} />
            </div>
          </div>

          <aside className="hidden lg:col-span-4 lg:block">
            <div className="space-y-4 lg:sticky lg:top-24">
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
              <ReportIssue slug={service.slug} serviceTitle={service.title} />
            </div>
          </aside>
        </div>
      </div>
    </>
  )
}
