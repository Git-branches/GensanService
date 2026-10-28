import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  BadgeCheck,
  BookOpenText,
  ChevronDown,
  Info,
  KeyRound,
  Link2,
  RefreshCw,
  Search,
  ShieldAlert,
} from 'lucide-react'
import BayPattern from '../components/BayPattern'
import HeroPhoto from '../components/HeroPhoto'
import SectionHeading from '../components/SectionHeading'
import { Kicker } from '../components/PageHeader'
import CategoryTile from '../components/CategoryTile'
import AgencyCard from '../components/AgencyCard'
import ServiceCard from '../components/ServiceCard'
import { CardGridSkeleton, EmptyState, ErrorState } from '../components/StateMessage'
import { useFetch } from '../hooks/useFetch'
import { useI18n } from '../i18n/context'
import { usePageTitle } from '../hooks/usePageTitle'
import { getAgencies, getCategories, getServices, getStats } from '../services/api'

// Icons for home.accuracy.points and home.reminders.items, in the same order as the messages.
const ACCURACY_ICONS = [Link2, BadgeCheck, BookOpenText]
const REMINDER_ICONS = [ShieldAlert, RefreshCw, KeyRound]

function GuideSearch({ categories, quickPicks }) {
  const { t } = useI18n()
  const navigate = useNavigate()

  function handleSubmit(event) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const params = new URLSearchParams()
    const q = String(form.get('q') || '').trim()
    const category = String(form.get('category') || '')
    if (q) params.set('q', q)
    if (category) params.set('category', category)
    const query = params.toString()
    navigate(`/services${query ? `?${query}` : ''}`)
  }

  return (
    <form
      role="search"
      onSubmit={handleSubmit}
      className="rounded-2xl border border-stone-200 bg-white p-4 shadow-lg shadow-bay-900/5 sm:p-5"
    >
      <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end md:grid-cols-[1.6fr_1fr_auto]">
        <div className="sm:col-span-2 md:col-span-1">
          <label htmlFor="hero-q" className="text-sm font-semibold text-stone-700">
            {t('home.directory.whatDoYouNeed')}
          </label>
          <div className="relative mt-1.5">
            <Search size={18} aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              id="hero-q"
              name="q"
              type="search"
              placeholder={t('common.searchPlaceholder')}
              className="w-full rounded-lg border border-stone-300 bg-white py-3 pl-10 pr-3 text-base placeholder:text-stone-400 focus:border-bay-500 focus:outline-none focus:ring-2 focus:ring-bay-500/20"
            />
          </div>
        </div>
        <div>
          <label htmlFor="hero-category" className="text-sm font-semibold text-stone-700">
            {t('common.category')}
          </label>
          <div className="relative mt-1.5">
            <select
              id="hero-category"
              name="category"
              defaultValue=""
              className="w-full cursor-pointer appearance-none rounded-lg border border-stone-300 bg-white py-3 pl-3 pr-9 text-base focus:border-bay-500 focus:outline-none focus:ring-2 focus:ring-bay-500/20"
            >
              <option value="">{t('common.allCategories')}</option>
              {categories?.map((category) => (
                <option key={category.id} value={category.slug}>
                  {category.name}
                </option>
              ))}
            </select>
            <ChevronDown size={16} aria-hidden="true" className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-stone-500" />
          </div>
        </div>
        <button
          type="submit"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-bay-700 px-6 py-3 font-semibold text-white transition-colors hover:bg-bay-800"
        >
          {t('home.directory.searchGuides')}
        </button>
      </div>

      {quickPicks.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-stone-100 pt-4 text-sm">
          <span className="font-medium text-stone-500">{t('home.directory.popularAgencies')}</span>
          {quickPicks.map((agency) => (
            <Link
              key={agency.id}
              to={`/services?agency=${agency.slug}`}
              className="rounded-md bg-bay-50 px-2.5 py-1 font-semibold text-bay-800 ring-1 ring-bay-100 transition-colors hover:bg-bay-100"
            >
              {agency.acronym}
            </Link>
          ))}
        </div>
      )}
    </form>
  )
}

function HowItWorks() {
  const { t } = useI18n()
  const steps = t('home.how.steps')

  return (
    <section className="bg-bay-900 py-14 text-white sm:py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading
          tone="dark"
          kicker={t('home.how.kicker')}
          title={t('home.how.title')}
          description={t('home.how.description')}
        />
        <ol className="mt-10 grid gap-8 md:grid-cols-3 md:gap-6">
          {steps.map((step, index) => (
            <li key={step.title} className="flex gap-4 md:flex-col">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sun-400 text-lg font-extrabold text-bay-950">
                {index + 1}
              </span>
              <span>
                <span className="block text-lg font-bold">{step.title}</span>
                <span className="mt-1 block text-bay-100">{step.text}</span>
              </span>
            </li>
          ))}
        </ol>
        <Link
          to="/services"
          className="mt-10 inline-flex items-center gap-2 rounded-lg bg-white px-5 py-2.5 text-sm font-bold text-bay-800 transition-colors hover:bg-sun-100"
        >
          {t('home.how.startBrowsing')} <ArrowRight size={16} aria-hidden="true" />
        </Link>
      </div>
    </section>
  )
}

function BrowseTabs({ categories, agencies, loading, error }) {
  const { t } = useI18n()
  const [tab, setTab] = useState('category')
  const tabs = [
    { id: 'category', label: t('home.directory.byCategory') },
    { id: 'agency', label: t('home.directory.byAgency') },
  ]

  return (
    <div className="mt-5">
      <div role="tablist" aria-label={t('home.directory.browseLabel')} className="flex gap-1 border-b border-stone-200">
        {tabs.map((item) => (
          <button
            key={item.id}
            id={`tab-${item.id}`}
            type="button"
            role="tab"
            aria-selected={tab === item.id}
            aria-controls={`panel-${item.id}`}
            onClick={() => setTab(item.id)}
            className={`-mb-px border-b-[3px] px-4 py-3 text-sm font-bold transition-colors ${
              tab === item.id
                ? 'border-sun-400 text-bay-800'
                : 'border-transparent text-stone-500 hover:text-bay-700'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {loading && <CardGridSkeleton count={3} />}
        {error && <ErrorState message={t('common.loadError')} />}

        {tab === 'category' && categories && (
          <div id="panel-category" role="tabpanel" aria-labelledby="tab-category" className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((category, index) => (
              <CategoryTile key={category.id} category={category} index={index} />
            ))}
          </div>
        )}

        {tab === 'agency' && agencies && (
          <div id="panel-agency" role="tabpanel" aria-labelledby="tab-agency">
            <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {agencies.map((agency) => (
                <li key={agency.id}>
                  <AgencyCard agency={agency} />
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}

export default function HomePage() {
  const { t } = useI18n()
  usePageTitle(null)

  const categories = useFetch(getCategories, [])
  const agencies = useFetch(getAgencies, [])
  const { data: stats } = useFetch(getStats, [])
  const recent = useFetch(() => getServices({ sort: 'recent', limit: 6 }), [])

  const quickPicks = (agencies.data ?? [])
    .filter((agency) => agency.acronym)
    .sort((a, b) => b.service_count - a.service_count || a.name.localeCompare(b.name))
    .slice(0, 5)

  const statItems = stats
    ? [
        { value: stats.services, label: t('home.directory.statGuides') },
        { value: stats.agencies, label: t('home.directory.statAgencies') },
        { value: stats.offices, label: t('home.directory.statOffices') },
      ]
    : []

  return (
    <>
      <section className="relative overflow-hidden border-b border-bay-100 bg-gradient-to-br from-bay-50 via-white to-sun-50/70">
        <BayPattern className="text-bay-200/70" />
        <div className="relative mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-12 lg:gap-10 lg:py-12">
          <div className="lg:col-span-5">
            <p className="inline-flex items-center gap-2 rounded-md bg-white px-3 py-1.5 text-xs font-semibold text-stone-600 ring-1 ring-stone-200">
              <Info size={14} aria-hidden="true" className="text-bay-600" />
              {t('home.badge')}
            </p>
            <h1 className="mt-5 text-4xl font-extrabold leading-[1.1] tracking-tight text-bay-950 sm:text-5xl">
              {t('home.titleStart')}{' '}
              <span className="relative whitespace-nowrap text-bay-600">
                {t('home.titleHighlight')}
                <span aria-hidden="true" className="absolute inset-x-0 -bottom-1 h-1.5 rounded-full bg-sun-400" />
              </span>{' '}
              {t('home.titleEnd')}
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-stone-600">
              {t('home.intro')}
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href="#find-a-guide"
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-bay-700 px-6 py-3 font-semibold text-white transition-colors hover:bg-bay-800 lg:px-5 xl:px-6"
              >
                <Search size={18} aria-hidden="true" /> {t('home.findGuide')}
              </a>
              <Link
                to="/agencies"
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-stone-300 bg-white px-6 py-3 font-semibold text-stone-700 transition-colors hover:bg-stone-50 lg:px-5 xl:px-6"
              >
                {t('home.browseAgencies')} <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </div>

            <p className="mt-6 flex items-center gap-2 text-sm text-stone-600">
              <BadgeCheck size={17} aria-hidden="true" className="shrink-0 text-emerald-600" />
              {t('home.verifiedNote')}
            </p>
          </div>

          {/* Below xl: negative bottom margin cancels the section padding so the photo sits on the hero's bottom edge.
              xl+: pinned bottom-right, ~1rem from the viewport edge, but never more than 12rem past the container. */}
          <div className="-mb-12 self-end sm:-mb-16 lg:col-span-7 lg:-mb-12 xl:absolute xl:bottom-0 xl:right-[max(calc(1rem-(100vw-72rem)/2),-12rem)] xl:m-0 xl:w-[min(52vw,46rem)]">
            <HeroPhoto />
          </div>
        </div>
      </section>

      <HowItWorks />

      <section id="find-a-guide" aria-labelledby="find-a-guide-title" className="scroll-mt-20 bg-white py-14 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid gap-8 lg:grid-cols-12 lg:items-end lg:gap-10">
            <div className="lg:col-span-9">
              <Kicker>{t('home.directory.kicker')}</Kicker>
              <h2
                id="find-a-guide-title"
                className="mt-2 text-2xl font-extrabold tracking-tight text-bay-950 sm:text-3xl"
              >
                {t('home.directory.title')}
              </h2>
              <p className="mt-2 text-stone-600">{t('home.directory.description')}</p>
              <div className="mt-6">
                <GuideSearch categories={categories.data} quickPicks={quickPicks} />
              </div>
            </div>

            {statItems.length > 0 && (
              <dl className="grid grid-cols-3 gap-4 lg:col-span-3 lg:grid-cols-1 lg:gap-5 lg:border-l lg:border-stone-200 lg:pl-8">
                {statItems.map((item) => (
                  <div key={item.label} className="flex flex-col border-l-4 border-sun-400 pl-3">
                    <dt className="text-sm text-stone-600">{item.label}</dt>
                    <dd className="order-first text-3xl font-extrabold tabular-nums text-bay-900">{item.value}</dd>
                  </div>
                ))}
              </dl>
            )}
          </div>

          <div className="mt-14 flex flex-wrap items-end justify-between gap-4 border-t border-stone-200 pt-10">
            <h3 className="text-xl font-extrabold tracking-tight text-bay-950">{t('home.directory.orBrowse')}</h3>
            <Link
              to="/agencies"
              className="group inline-flex items-center gap-1.5 text-sm font-semibold text-bay-700 hover:text-bay-800 hover:underline"
            >
              {t('home.directory.allAgencies')}
              <ArrowRight size={16} aria-hidden="true" className="transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
          <BrowseTabs
            categories={categories.data}
            agencies={agencies.data}
            loading={categories.loading || agencies.loading}
            error={categories.error || agencies.error}
          />
        </div>
      </section>

      <section className="py-14 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <SectionHeading
            kicker={t('home.recent.kicker')}
            title={t('home.recent.title')}
            description={t('home.recent.description')}
            action={{ to: '/services', label: t('home.recent.allGuides') }}
          />
          <div className="mt-8">
            {recent.loading && <CardGridSkeleton count={3} />}
            {recent.error && <ErrorState message={t('common.loadError')} />}
            {recent.data?.length === 0 && <EmptyState title={t('home.recent.empty')} />}
            {recent.data?.length > 0 && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {recent.data.map((service) => (
                  <ServiceCard key={service.id} service={service} />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="border-t border-stone-200 bg-white py-14 sm:py-20">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:gap-14">
          <div>
            <SectionHeading kicker={t('home.accuracy.kicker')} title={t('home.accuracy.title')} />
            <ul className="mt-8 space-y-6">
              {t('home.accuracy.points').map(({ title, text }, index) => {
                const Icon = ACCURACY_ICONS[index]
                return (
                <li key={title} className="flex gap-4">
                  <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-bay-50 text-bay-700 ring-1 ring-bay-100">
                    <Icon size={21} aria-hidden="true" />
                  </span>
                  <span>
                    <span className="block font-bold text-bay-950">{title}</span>
                    <span className="mt-0.5 block text-stone-600">{text}</span>
                  </span>
                </li>
                )
              })}
            </ul>
          </div>

          <aside className="self-start rounded-xl border border-sun-200 border-l-[6px] border-l-sun-400 bg-sun-50 p-6 sm:p-8">
            <h2 className="text-xl font-extrabold text-bay-950">{t('home.reminders.title')}</h2>
            <ul className="mt-5 space-y-4">
              {t('home.reminders.items').map((text, index) => {
                const Icon = REMINDER_ICONS[index]
                return (
                  <li key={text} className="flex gap-3 text-stone-700">
                    <Icon size={19} aria-hidden="true" className="mt-0.5 shrink-0 text-sun-700" />
                    <span className="leading-relaxed">{text}</span>
                  </li>
                )
              })}
            </ul>
          </aside>
        </div>
      </section>
    </>
  )
}
