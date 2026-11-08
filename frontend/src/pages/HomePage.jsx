import { useMemo, useState, useSyncExternalStore } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  BadgeCheck,
  BookOpenText,
  Info,
  Link2,
  Lock,
  RefreshCw,
  Search,
} from 'lucide-react'
import faqScene from '../assets/illust-faq-scene.svg'
import BayPattern from '../components/BayPattern'
import HeroPhoto from '../components/HeroPhoto'
import SectionHeading from '../components/SectionHeading'
import CategoryTile from '../components/CategoryTile'
import AgencyCard from '../components/AgencyCard'
import FaqItem from '../components/FaqItem'
import ServiceCard from '../components/ServiceCard'
import { CardGridSkeleton, EmptyState, ErrorState } from '../components/StateMessage'
import { useFetch } from '../hooks/useFetch'
import { useI18n } from '../i18n/context'
import { usePageTitle } from '../hooks/usePageTitle'
import { getAgencies, getCategories, getFaqs, getLifeEvents, getServices } from '../services/api'
import { getRecentlyViewed, recentlyViewedSnapshot } from '../utils/deviceHistory'

// Icons for home.accuracy.points and home.reminders.items, in the same order as the messages.
const ACCURACY_ICONS = [Link2, BadgeCheck, BookOpenText]
const REMINDER_ICONS = [Info, RefreshCw, Lock]

const FAQ_PREVIEW = 3

const neverChanges = () => () => {}
const nothingViewed = () => ''

// Same tile for both columns of the "Our approach" section; each column adds its own tint.
const ICON_TILE = 'inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ring-1'

function HowItWorks() {
  const { t } = useI18n()
  const steps = t('home.how.steps')

  return (
    <section className="bg-bay-900 py-14 text-white sm:py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading
          tone="dark"
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
  const { t, locale } = useI18n()
  usePageTitle(null)

  const categories = useFetch(getCategories, [])
  const agencies = useFetch(getAgencies, [])
  const recent = useFetch(() => getServices({ sort: 'recent', limit: 6 }), [])
  const popular = useFetch(() => getServices({ sort: 'popular', limit: 3 }), [])
  const faqs = useFetch(() => getFaqs(locale), [locale])
  const lifeEvents = useFetch(getLifeEvents, [])
  // Empty on pre-built pages, which know nothing about this device.
  const viewedText = useSyncExternalStore(neverChanges, recentlyViewedSnapshot, nothingViewed)
  const viewed = useMemo(() => (viewedText ? getRecentlyViewed() : []), [viewedText])

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

            <div className="mt-8 flex">
              <Link
                to="/services"
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-bay-700 px-6 py-3 font-semibold text-white transition-colors hover:bg-bay-800"
              >
                <Search size={18} aria-hidden="true" /> {t('home.findGuide')}
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

      <section aria-labelledby="browse-guides-title" className="bg-white py-14 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2 id="browse-guides-title" className="text-2xl font-extrabold tracking-tight text-bay-950 sm:text-3xl">{t('home.directory.browseLabel')}</h2>
            <Link
              to="/agencies"
              className="group inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-bay-700 hover:text-bay-800 hover:underline"
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

      {lifeEvents.data?.length > 0 && (
        <section id="life-events" aria-labelledby="life-events-title" className="scroll-mt-20 border-t border-stone-200 bg-mist py-14 sm:py-16">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="max-w-2xl">
              <h2 id="life-events-title" className="text-2xl font-extrabold tracking-tight text-bay-950 sm:text-3xl">{t('home.lifeEvents.title')}</h2>
              <p className="mt-2 text-stone-600">{t('home.lifeEvents.description')}</p>
            </div>
            <ul className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2">
              {lifeEvents.data.map((event) => (
                <li key={event.slug}>
                  <Link
                    to={`/life-events/${event.slug}`}
                    className="group flex h-full flex-col rounded-xl border border-stone-200 bg-white p-5 transition-colors hover:border-bay-300 sm:p-6"
                  >
                    <span className="text-xs font-bold uppercase tracking-wide text-sun-700">{t('home.lifeEvents.steps', { count: event.step_count })}</span>
                    <span lang="en" className="mt-1.5 text-lg font-bold leading-snug text-bay-950 group-hover:text-bay-700">{event.title}</span>
                    {event.summary && <span lang="en" className="mt-1.5 leading-relaxed text-stone-600">{event.summary}</span>}
                    <span className="mt-auto inline-flex items-center gap-1.5 pt-4 text-sm font-semibold text-bay-700">
                      {t('home.lifeEvents.open')} <ArrowRight size={16} aria-hidden="true" className="transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {popular.data?.length > 0 && (
        <section className="pt-14 sm:pt-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <SectionHeading title={t('home.popular.title')} description={t('home.popular.description')} />
            <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {popular.data.map((service) => (
                <ServiceCard key={service.id} service={service} />
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="py-14 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          {viewed.length > 0 && (
            <div className="mb-10">
              <h2 className="text-sm font-bold text-stone-700">{t('home.viewed.title')}</h2>
              <ul className="mt-1 flex flex-wrap gap-x-5 text-sm">
                {viewed.map((guide) => (
                  <li key={guide.slug}>
                    <Link to={`/services/${guide.slug}`} className="inline-flex min-h-11 items-center font-semibold text-bay-700 hover:underline">{guide.title}</Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <SectionHeading
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
            <SectionHeading title={t('home.accuracy.title')} />
            <ul className="mt-8 space-y-6">
              {t('home.accuracy.points').map(({ title, text }, index) => {
                const Icon = ACCURACY_ICONS[index]
                return (
                <li key={title} className="flex items-start gap-4">
                  <span className={`${ICON_TILE} bg-bay-50 text-bay-700 ring-bay-100`}>
                    <Icon size={20} aria-hidden="true" />
                  </span>
                  <span className="pt-0.5">
                    <span className="block font-bold text-bay-950">{title}</span>
                    <span className="mt-0.5 block leading-relaxed text-stone-600">{text}</span>
                  </span>
                </li>
                )
              })}
            </ul>
          </div>

          <section aria-labelledby="home-reminders-title" className="self-start rounded-r-xl border-l-4 border-sun-400 bg-sun-50/60 p-6 sm:p-8">
            <h2 id="home-reminders-title" className="text-xl font-extrabold text-bay-950">{t('home.reminders.title')}</h2>
            <ul className="mt-6 space-y-5">
              {t('home.reminders.items').map(({ lead, text }, index) => {
                const Icon = REMINDER_ICONS[index]
                return (
                  <li key={lead} className="flex items-start gap-4">
                    <span className={`${ICON_TILE} bg-white text-sun-700 ring-sun-200`}>
                      <Icon size={20} aria-hidden="true" />
                    </span>
                    <p className="pt-0.5 leading-relaxed text-stone-700">
                      <strong className="font-bold text-bay-950">{lead}</strong> {text}
                    </p>
                  </li>
                )
              })}
            </ul>
          </section>
        </div>
      </section>

      {faqs.data?.length > 0 && (
        <section className="relative overflow-hidden py-14 sm:py-20">
          <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-4 sm:px-6 lg:grid-cols-12">
            <div className="relative z-10 lg:col-span-7">
              <SectionHeading title={t('home.faq.title')} action={{ to: '/faq', label: t('home.faq.all') }} />
              <div className="mt-6 divide-y divide-stone-200 border-y border-stone-200">
                {faqs.data.slice(0, FAQ_PREVIEW).map((faq) => (
                  <FaqItem key={faq.id} faq={faq} />
                ))}
              </div>
            </div>

          </div>

          {/* Larger screens only: the FAQ page's scene stands on the footer's gold line and fades out toward the questions. */}
          <img
            src={faqScene}
            alt=""
            width="1400"
            height="420"
            loading="lazy"
            draggable="false"
            className="pointer-events-none absolute right-0 bottom-0 hidden h-[78%] w-[46%] max-w-225 select-none object-cover object-right-bottom mask-[linear-gradient(to_right,transparent,black_30%)] lg:block"
          />
        </section>
      )}
    </>
  )
}
