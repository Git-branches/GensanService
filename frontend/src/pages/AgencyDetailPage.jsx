import { useParams } from 'react-router-dom'
import { ExternalLink } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import { AgencyTypeBadge } from '../components/AgencyRow'
import ServiceCard from '../components/ServiceCard'
import OfficeCard from '../components/OfficeCard'
import { CardGridSkeleton, EmptyState, ErrorState, LoadingState } from '../components/StateMessage'
import { useFetch } from '../hooks/useFetch'
import { usePageTitle } from '../hooks/usePageTitle'
import { getAgency, getServices } from '../services/api'

function SubHeading({ children, count }) {
  return (
    <h2 className="flex items-center gap-3 text-2xl font-extrabold tracking-tight text-bay-950">
      {children}
      <span className="rounded-md bg-stone-100 px-2 py-0.5 text-sm font-semibold text-stone-600">{count}</span>
    </h2>
  )
}

export default function AgencyDetailPage() {
  const { slug } = useParams()
  const { data: agency, error, loading } = useFetch(() => getAgency(slug), [slug])
  const services = useFetch(() => getServices({ agency: slug }), [slug])
  usePageTitle(agency?.name ?? 'Agency')

  if (loading) return <LoadingState label="Loading agency..." />
  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <ErrorState message={error} action={{ to: '/agencies', label: 'Back to all agencies' }} />
      </div>
    )
  }
  if (!agency) return null

  return (
    <>
      <PageHeader
        breadcrumbs={[
          { to: '/', label: 'Home' },
          { to: '/agencies', label: 'Agencies' },
          { label: agency.acronym || agency.name },
        ]}
        kicker={agency.acronym}
        title={agency.name}
        description={agency.description}
      >
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <AgencyTypeBadge isLocal={Boolean(agency.is_local_government)} />
          {agency.official_website && (
            <a
              href={agency.official_website}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg bg-bay-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-bay-800"
            >
              Official website <ExternalLink size={15} aria-hidden="true" />
              <span className="sr-only">(opens in a new tab)</span>
            </a>
          )}
        </div>
      </PageHeader>

      <div className="mx-auto max-w-6xl space-y-12 px-4 py-10 sm:px-6 sm:py-14">
        <section>
          <SubHeading count={services.data?.length ?? 0}>Service guides</SubHeading>
          <div className="mt-5">
            {services.loading && <CardGridSkeleton count={3} />}
            {services.error && <ErrorState message={services.error} />}
            {services.data?.length === 0 && (
              <EmptyState
                title="No guides yet"
                message={`Guides for ${agency.acronym || agency.name} will appear here once they are verified.`}
              />
            )}
            {services.data?.length > 0 && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {services.data.map((service) => (
                  <ServiceCard key={service.id} service={service} />
                ))}
              </div>
            )}
          </div>
        </section>

        <section>
          <SubHeading count={agency.offices.length}>Offices in General Santos</SubHeading>
          <div className="mt-5">
            {agency.offices.length === 0 ? (
              <EmptyState
                title="No offices listed yet"
                message="Office details are added only after their address and hours have been verified."
              />
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {agency.offices.map((office) => (
                  <OfficeCard key={office.id} office={office} showAgency={false} />
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </>
  )
}
