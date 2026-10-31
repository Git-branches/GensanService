import PageHeader from '../components/PageHeader'
import staffImage from '../assets/page-agencies.webp'
import AgencyCard from '../components/AgencyCard'
import { CardGridSkeleton, EmptyState, ErrorState } from '../components/StateMessage'
import { useFetch } from '../hooks/useFetch'
import { usePageTitle } from '../hooks/usePageTitle'
import { useI18n } from '../i18n/context'
import { getAgencies } from '../services/api'

const GROUPS = [
  { key: 'local', title: 'agencies.groupLocal', match: (agency) => Boolean(agency.is_local_government) },
  { key: 'national', title: 'agencies.groupNational', match: (agency) => !agency.is_local_government },
]

export default function AgenciesPage() {
  const { t } = useI18n()
  usePageTitle(t('agencies.pageTitle'))
  const { data: agencies, error, loading } = useFetch(getAgencies, [])

  return (
    <>
      <PageHeader
        breadcrumbs={[{ to: '/', label: t('common.home') }, { label: t('nav.agencies') }]}
        title={t('agencies.heading')}
        description={t('agencies.description')}
        image={{
          src: staffImage,
          alt: t('agencies.heroAlt'),
          width: 800,
          height: 496,
        }}
      />

      <section className="mx-auto max-w-6xl space-y-10 px-4 py-10 sm:px-6 sm:py-14">
        {loading && <CardGridSkeleton count={3} />}
        {error && <ErrorState message={t('common.loadError')} />}
        {agencies?.length === 0 && <EmptyState title={t('agencies.empty')} />}

        {agencies?.length > 0 &&
          GROUPS.map((group) => {
            const items = agencies.filter(group.match)
            if (items.length === 0) return null
            return (
              <div key={group.key}>
                <h2 className="flex items-center gap-3 text-xl font-extrabold tracking-tight text-bay-950">
                  {t(group.title)}
                  <span className="rounded-md bg-stone-100 px-2 py-0.5 text-sm font-semibold text-stone-600">
                    {items.length}
                  </span>
                </h2>
                <ul className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {items.map((agency) => (
                    <li key={agency.id}>
                      <AgencyCard agency={agency} />
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
      </section>
    </>
  )
}
