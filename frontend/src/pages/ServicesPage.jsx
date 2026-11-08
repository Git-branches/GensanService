import { Link, useSearchParams } from 'react-router-dom'
import { ChevronDown, Search, X } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import headerIllustration from '../assets/illust-services.svg'
import SearchBox from '../components/SearchBox'
import ServiceCard from '../components/ServiceCard'
import { CardGridSkeleton, EmptyState, ErrorState } from '../components/StateMessage'
import { useFetch } from '../hooks/useFetch'
import { usePageTitle } from '../hooks/usePageTitle'
import { getAgencies, getCategories, getServices, getStats, search } from '../services/api'
import { addRecentSearch } from '../utils/deviceHistory'
import { useI18n } from '../i18n/context'

const FIELD_CLASS =
  'w-full rounded-lg border border-stone-300 bg-white py-3 text-base focus:border-bay-500 focus:outline-none focus:ring-2 focus:ring-bay-500/20'

function SelectField({ id, label, value, onChange, children }) {
  return (
    <div>
      <label htmlFor={id} className="text-sm font-semibold text-stone-700">
        {label}
      </label>
      <div className="relative mt-1.5">
        <select
          id={id}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={`${FIELD_CLASS} cursor-pointer appearance-none pl-3 pr-9`}
        >
          {children}
        </select>
        <ChevronDown size={16} aria-hidden="true" className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-stone-500" />
      </div>
    </div>
  )
}

export default function ServicesPage() {
  const { t } = useI18n()
  usePageTitle(t('services.pageTitle'))

  const [searchParams, setSearchParams] = useSearchParams()
  const q = searchParams.get('q') || ''
  const categorySlug = searchParams.get('category') || ''
  const agencySlug = searchParams.get('agency') || ''

  const { data: categories } = useFetch(getCategories, [])
  const { data: agencies } = useFetch(getAgencies, [])
  const { data: stats } = useFetch(getStats, [])
  const { data: services, error, loading } = useFetch(
    () => getServices({ q, category: categorySlug, agency: agencySlug }),
    [q, categorySlug, agencySlug]
  )
  const { data: matches } = useFetch(() => (q ? search(q) : Promise.resolve(null)), [q])
  const { data: suggestions } = useFetch(() => getServices({ sort: 'recent', limit: 4 }), [])

  function setParam(key, value) {
    const next = new URLSearchParams(searchParams)
    if (value) next.set(key, value)
    else next.delete(key)
    setSearchParams(next)
  }

  function clearAll() {
    setSearchParams(new URLSearchParams())
  }

  function handleSearch(event) {
    event.preventDefault()
    const text = String(new FormData(event.currentTarget).get('q') || '').trim()
    addRecentSearch(text)
    setParam('q', text)
  }

  // The agencies with the most guides, as one-tap filters.
  const quickPicks = (agencies ?? [])
    .filter((agency) => agency.acronym)
    .sort((a, b) => b.service_count - a.service_count || a.name.localeCompare(b.name))
    .slice(0, 5)

  const statItems = stats
    ? [
        { value: stats.services, label: t('services.process.statGuides') },
        { value: stats.agencies, label: t('services.process.statAgencies') },
        { value: stats.offices, label: t('services.process.statOffices') },
      ]
    : []

  const activeCategory = categories?.find((category) => category.slug === categorySlug)
  const activeAgency = agencies?.find((agency) => agency.slug === agencySlug)

  const activeFilters = [
    q && { key: 'q', label: t('services.keywordFilter', { q }) },
    categorySlug && { key: 'category', label: activeCategory?.name || categorySlug },
    agencySlug && { key: 'agency', label: activeAgency?.acronym || activeAgency?.name || agencySlug },
  ].filter(Boolean)

  return (
    <>
      <PageHeader
        breadcrumbs={[{ to: '/', label: t('common.home') }, { label: t('services.pageTitle') }]}
        title={t('services.heading')}
        description={t('services.description')}
        image={{
          src: headerIllustration,
          alt: '',
          width: 1400,
          height: 420,
          scene: true,
        }}
      />

      <section aria-labelledby="process-title" className="border-b border-stone-200 bg-white py-10 sm:py-14">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 sm:px-6 lg:grid-cols-12 lg:items-end lg:gap-10">
          <div className="lg:col-span-9">
            <h2 id="process-title" className="text-2xl font-extrabold tracking-tight text-bay-950 sm:text-3xl">{t('services.process.title')}</h2>
            <p className="mt-2 text-stone-600">{t('services.process.description')}</p>

            <form role="search" onSubmit={handleSearch} className="mt-6 rounded-2xl border border-stone-200 bg-white p-4 shadow-lg shadow-bay-900/5 sm:p-5">
              <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end md:grid-cols-[1.6fr_1fr_auto]">
                <div className="sm:col-span-2 md:col-span-1">
                  <label htmlFor="services-q" className="text-sm font-semibold text-stone-700">
                    {t('services.process.whatDoYouNeed')}
                  </label>
                  <div className="relative mt-1.5">
                    <Search size={18} aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-500" />
                    <SearchBox
                      key={q}
                      id="services-q"
                      defaultValue={q}
                      placeholder={t('common.searchPlaceholder')}
                      className={`${FIELD_CLASS} pl-10 pr-3 placeholder:text-stone-500`}
                    />
                  </div>
                </div>
                <SelectField id="services-category" label={t('common.category')} value={categorySlug} onChange={(v) => setParam('category', v)}>
                  <option value="">{t('common.allCategories')}</option>
                  {categories?.map((category) => (
                    <option key={category.id} value={category.slug}>
                      {category.name}
                    </option>
                  ))}
                </SelectField>
                <button
                  type="submit"
                  className="inline-flex min-h-11 items-center justify-center rounded-lg bg-bay-700 px-6 py-3 font-semibold text-white transition-colors hover:bg-bay-800"
                >
                  {t('services.process.searchGuides')}
                </button>
              </div>

              {quickPicks.length > 0 && (
                <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-stone-100 pt-4 text-sm">
                  <span className="font-medium text-stone-500">{t('services.process.popularAgencies')}</span>
                  {quickPicks.map((agency) => {
                    const active = agency.slug === agencySlug
                    return (
                      <button
                        key={agency.id}
                        type="button"
                        aria-pressed={active}
                        onClick={() => setParam('agency', active ? '' : agency.slug)}
                        className={`inline-flex min-h-11 items-center rounded-md px-3 font-semibold ring-1 transition-colors ${
                          active ? 'bg-bay-700 text-white ring-bay-700' : 'bg-bay-50 text-bay-800 ring-bay-100 hover:bg-bay-100'
                        }`}
                      >
                        {agency.acronym}
                      </button>
                    )
                  })}
                </div>
              )}
            </form>
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
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-200 pb-4">
          <h2 aria-live="polite" className="text-lg font-bold text-bay-950">
            {loading ? t('services.searching') : services ? t('services.found', { count: services.length }) : ''}
          </h2>

          {activeFilters.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              {activeFilters.map((filter) => (
                <button
                  key={filter.key}
                  type="button"
                  onClick={() => setParam(filter.key, '')}
                  className="inline-flex items-center gap-1.5 rounded-md bg-bay-50 py-1 pl-2.5 pr-1.5 text-sm font-semibold text-bay-800 ring-1 ring-bay-100 hover:bg-bay-100"
                >
                  {filter.label}
                  <X size={14} aria-hidden="true" />
                  <span className="sr-only">{t('services.removeFilter')}</span>
                </button>
              ))}
              <button
                type="button"
                onClick={clearAll}
                className="px-2 text-sm font-semibold text-stone-600 hover:text-bay-700 hover:underline"
              >
                {t('services.clearAll')}
              </button>
            </div>
          )}
        </div>

        {(matches?.agencies.length > 0 || matches?.offices.length > 0) && (
          <div className="mt-5 flex flex-wrap gap-x-8 gap-y-3 text-sm">
            {matches.agencies.length > 0 && (
              <div>
                <p className="font-semibold text-stone-600">{t('services.matchingAgencies')}</p>
                <ul className="mt-1 flex flex-wrap gap-x-4 gap-y-1">
                  {matches.agencies.map((agency) => (
                    <li key={agency.slug}>
                      <Link to={`/agencies/${agency.slug}`} className="font-semibold text-bay-700 hover:underline">{agency.name}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {matches.offices.length > 0 && (
              <div>
                <p className="font-semibold text-stone-600">{t('services.matchingOffices')}</p>
                <ul className="mt-1 flex flex-wrap gap-x-4 gap-y-1">
                  {matches.offices.map((office) => (
                    <li key={office.id}>
                      <Link to={`/agencies/${office.agency_slug}`} className="font-semibold text-bay-700 hover:underline">{office.name}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        <div className="mt-6">
          {loading && <CardGridSkeleton />}
          {error && <ErrorState message={t('common.loadError')} />}

          {services && services.length === 0 && (
            <EmptyState
              title={t('services.emptyTitle')}
              message={
                activeFilters.length ? t('services.emptyFiltered') : t('services.emptyNone')
              }
            >
              {activeFilters.length > 0 && (
                <button
                  type="button"
                  onClick={clearAll}
                  className="mt-1 rounded-lg bg-bay-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-bay-800"
                >
                  {t('services.showAll')}
                </button>
              )}
              <Link to="/agencies" className="text-sm font-semibold text-bay-700 hover:underline">
                {t('services.browseAgenciesInstead')}
              </Link>
              {suggestions?.length > 0 && (
                <div className="mt-4 text-sm">
                  <p className="font-semibold text-stone-600">{t('services.tryThese')}</p>
                  <ul className="mt-1 space-y-1">
                    {suggestions.map((guide) => (
                      <li key={guide.id}>
                        <Link to={`/services/${guide.slug}`} className="font-medium text-bay-700 hover:underline">{guide.title}</Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </EmptyState>
          )}

          {services && services.length > 0 && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {services.map((service) => (
                <ServiceCard key={service.id} service={service} />
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  )
}
