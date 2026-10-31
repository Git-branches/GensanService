import { useState } from 'react'
import { ChevronDown, Search } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import officeStaffImage from '../assets/page-offices.webp'
import OfficeCard from '../components/OfficeCard'
import { CardGridSkeleton, EmptyState, ErrorState } from '../components/StateMessage'
import { useFetch } from '../hooks/useFetch'
import { usePageTitle } from '../hooks/usePageTitle'
import { useI18n } from '../i18n/context'
import { getOffices } from '../services/api'

const FIELD_CLASS =
  'w-full rounded-lg border border-stone-300 bg-white py-2.5 text-base focus:border-bay-500 focus:outline-none focus:ring-2 focus:ring-bay-500/20'

export default function OfficesPage() {
  const { t } = useI18n()
  usePageTitle(t('offices.pageTitle'))
  const [query, setQuery] = useState('')
  const [agencySlug, setAgencySlug] = useState('')
  const { data: offices, error, loading } = useFetch(getOffices, [])

  const agencyOptions = [...new Map((offices ?? []).map((office) => [office.agency_slug, office])).values()]

  const needle = query.trim().toLowerCase()
  const visible = (offices ?? []).filter((office) => {
    if (agencySlug && office.agency_slug !== agencySlug) return false
    if (!needle) return true
    return [office.name, office.address, office.barangay, office.agency_name, office.agency_acronym]
      .filter(Boolean)
      .some((value) => value.toLowerCase().includes(needle))
  })

  return (
    <>
      <PageHeader
        breadcrumbs={[{ to: '/', label: t('common.home') }, { label: t('nav.offices') }]}
        title={t('offices.heading')}
        description={t('offices.description')}
        image={{
          src: officeStaffImage,
          alt: t('offices.heroAlt'),
          width: 732,
          height: 489,
        }}
      >
        <div className="mt-8 grid gap-3 rounded-2xl border border-stone-200 bg-white p-4 shadow-lg shadow-bay-900/5 sm:grid-cols-[1.6fr_1fr] sm:p-5">
          <div>
            <label htmlFor="offices-q" className="text-sm font-semibold text-stone-700">
              {t('offices.filter')}
            </label>
            <div className="relative mt-1.5">
              <Search size={18} aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-500" />
              <input
                id="offices-q"
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t('offices.filterPlaceholder')}
                className={`${FIELD_CLASS} pl-10 pr-3 placeholder:text-stone-500`}
              />
            </div>
          </div>
          <div>
            <label htmlFor="offices-agency" className="text-sm font-semibold text-stone-700">
              {t('common.agency')}
            </label>
            <div className="relative mt-1.5">
              <select
                id="offices-agency"
                value={agencySlug}
                onChange={(event) => setAgencySlug(event.target.value)}
                className={`${FIELD_CLASS} cursor-pointer appearance-none pl-3 pr-9`}
              >
                <option value="">{t('common.allAgencies')}</option>
                {agencyOptions.map((office) => (
                  <option key={office.agency_slug} value={office.agency_slug}>
                    {office.agency_acronym || office.agency_name}
                  </option>
                ))}
              </select>
              <ChevronDown size={16} aria-hidden="true" className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-stone-500" />
            </div>
          </div>
        </div>
      </PageHeader>

      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        {offices && (
          <h2 aria-live="polite" className="mb-6 border-b border-stone-200 pb-4 text-lg font-bold text-bay-950">
            {t('common.officesCount', { count: visible.length })}
          </h2>
        )}
        {loading && <CardGridSkeleton count={3} />}
        {error && <ErrorState message={t('common.loadError')} />}
        {offices && visible.length === 0 && (
          <EmptyState
            title={offices.length ? t('offices.emptyFiltered') : t('offices.empty')}
            message={t('offices.emptyMessage')}
          />
        )}
        {visible.length > 0 && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {visible.map((office) => (
              <OfficeCard key={office.id} office={office} />
            ))}
          </div>
        )}
      </section>
    </>
  )
}
