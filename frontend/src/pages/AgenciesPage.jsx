import PageHeader from '../components/PageHeader'
import staffImage from '../assets/page-agencies.webp'
import AgencyRow from '../components/AgencyRow'
import { CardGridSkeleton, EmptyState, ErrorState } from '../components/StateMessage'
import { useFetch } from '../hooks/useFetch'
import { usePageTitle } from '../hooks/usePageTitle'
import { getAgencies } from '../services/api'

const GROUPS = [
  { key: 'local', title: 'Local government', match: (agency) => Boolean(agency.is_local_government) },
  { key: 'national', title: 'National government agencies', match: (agency) => !agency.is_local_government },
]

export default function AgenciesPage() {
  usePageTitle('Government agencies')
  const { data: agencies, error, loading } = useFetch(getAgencies, [])

  return (
    <>
      <PageHeader
        breadcrumbs={[{ to: '/', label: 'Home' }, { label: 'Agencies' }]}
        kicker="Agency directory"
        title="Government agencies serving GenSan"
        description="Local and national offices whose services are covered in our guides."
        image={{
          src: staffImage,
          alt: 'Three smiling public service workers',
          width: 800,
          height: 496,
        }}
      />

      <section className="mx-auto max-w-6xl space-y-10 px-4 py-10 sm:px-6 sm:py-14">
        {loading && <CardGridSkeleton count={3} />}
        {error && <ErrorState message={error} />}
        {agencies?.length === 0 && <EmptyState title="No agencies listed yet" />}

        {agencies?.length > 0 &&
          GROUPS.map((group) => {
            const items = agencies.filter(group.match)
            if (items.length === 0) return null
            return (
              <div key={group.key}>
                <h2 className="flex items-center gap-3 text-xl font-extrabold tracking-tight text-bay-950">
                  {group.title}
                  <span className="rounded-md bg-stone-100 px-2 py-0.5 text-sm font-semibold text-stone-600">
                    {items.length}
                  </span>
                </h2>
                <ul className="mt-4 divide-y divide-stone-100 overflow-hidden rounded-xl border border-stone-200 bg-white">
                  {items.map((agency) => (
                    <AgencyRow key={agency.id} agency={agency} />
                  ))}
                </ul>
              </div>
            )
          })}
      </section>
    </>
  )
}
