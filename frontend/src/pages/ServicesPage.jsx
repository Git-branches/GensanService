import { Link, useSearchParams } from 'react-router-dom'
import { ChevronDown, Search, X } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import ServiceCard from '../components/ServiceCard'
import { CardGridSkeleton, EmptyState, ErrorState } from '../components/StateMessage'
import { useFetch } from '../hooks/useFetch'
import { usePageTitle } from '../hooks/usePageTitle'
import { getAgencies, getCategories, getServices } from '../services/api'
import { plural } from '../utils/format'

const FIELD_CLASS =
  'w-full rounded-lg border border-stone-300 bg-white py-2.5 text-base focus:border-bay-500 focus:outline-none focus:ring-2 focus:ring-bay-500/20'

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
  usePageTitle('Service guides')

  const [searchParams, setSearchParams] = useSearchParams()
  const q = searchParams.get('q') || ''
  const categorySlug = searchParams.get('category') || ''
  const agencySlug = searchParams.get('agency') || ''

  const { data: categories } = useFetch(getCategories, [])
  const { data: agencies } = useFetch(getAgencies, [])
  const { data: services, error, loading } = useFetch(
    () => getServices({ q, category: categorySlug, agency: agencySlug }),
    [q, categorySlug, agencySlug]
  )

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
    setParam('q', String(new FormData(event.currentTarget).get('q') || '').trim())
  }

  const activeCategory = categories?.find((category) => category.slug === categorySlug)
  const activeAgency = agencies?.find((agency) => agency.slug === agencySlug)

  const activeFilters = [
    q && { key: 'q', label: `Keyword: ${q}` },
    categorySlug && { key: 'category', label: activeCategory?.name || categorySlug },
    agencySlug && { key: 'agency', label: activeAgency?.acronym || activeAgency?.name || agencySlug },
  ].filter(Boolean)

  return (
    <>
      <PageHeader
        breadcrumbs={[{ to: '/', label: 'Home' }, { label: 'Service guides' }]}
        kicker="Service guides"
        title="Find a government service guide"
        description="Search by keyword, then narrow down by category or agency."
      >
        <form
          role="search"
          onSubmit={handleSearch}
          className="mt-8 grid gap-3 rounded-2xl border border-stone-200 bg-white p-4 shadow-lg shadow-bay-900/5 sm:p-5 lg:grid-cols-[1.6fr_1fr_1fr_auto] lg:items-end"
        >
          <div>
            <label htmlFor="services-q" className="text-sm font-semibold text-stone-700">
              Keyword
            </label>
            <div className="relative mt-1.5">
              <Search size={18} aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                id="services-q"
                key={q}
                name="q"
                type="search"
                defaultValue={q}
                placeholder="e.g. birth certificate"
                className={`${FIELD_CLASS} pl-10 pr-3 placeholder:text-stone-400`}
              />
            </div>
          </div>
          <SelectField id="services-category" label="Category" value={categorySlug} onChange={(v) => setParam('category', v)}>
            <option value="">All categories</option>
            {categories?.map((category) => (
              <option key={category.id} value={category.slug}>
                {category.name}
              </option>
            ))}
          </SelectField>
          <SelectField id="services-agency" label="Agency" value={agencySlug} onChange={(v) => setParam('agency', v)}>
            <option value="">All agencies</option>
            {agencies?.map((agency) => (
              <option key={agency.id} value={agency.slug}>
                {agency.acronym || agency.name}
              </option>
            ))}
          </SelectField>
          <button
            type="submit"
            className="rounded-lg bg-bay-700 px-6 py-2.5 font-semibold text-white transition-colors hover:bg-bay-800"
          >
            Search
          </button>
        </form>
      </PageHeader>

      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-200 pb-4">
          <p aria-live="polite" className="text-lg font-bold text-bay-950">
            {loading ? 'Searching…' : services ? `${plural(services.length, 'guide')} found` : ''}
          </p>

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
                  <span className="sr-only">Remove filter</span>
                </button>
              ))}
              <button
                type="button"
                onClick={clearAll}
                className="px-2 text-sm font-semibold text-stone-600 hover:text-bay-700 hover:underline"
              >
                Clear all
              </button>
            </div>
          )}
        </div>

        <div className="mt-6">
          {loading && <CardGridSkeleton />}
          {error && <ErrorState message={error} />}

          {services && services.length === 0 && (
            <EmptyState
              title="No guides match yet"
              message={
                activeFilters.length
                  ? 'Try a different keyword or remove a filter. New guides are added as they are verified.'
                  : 'No service guides have been published yet.'
              }
            >
              {activeFilters.length > 0 && (
                <button
                  type="button"
                  onClick={clearAll}
                  className="mt-1 rounded-lg bg-bay-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-bay-800"
                >
                  Show all guides
                </button>
              )}
              <Link to="/agencies" className="text-sm font-semibold text-bay-700 hover:underline">
                Browse agencies instead
              </Link>
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
