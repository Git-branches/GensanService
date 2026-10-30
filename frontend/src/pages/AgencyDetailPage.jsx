import { useParams } from 'react-router-dom'
import { ExternalLink, Mail, MessageCircle, Phone } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import { AgencyPresence, AgencyTypeBadge } from '../components/AgencyCard'
import ServiceCard from '../components/ServiceCard'
import OfficeCard from '../components/OfficeCard'
import { CardGridSkeleton, EmptyState, ErrorState, LoadingState } from '../components/StateMessage'
import { useFetch } from '../hooks/useFetch'
import { usePageTitle } from '../hooks/usePageTitle'
import { useI18n } from '../i18n/context'
import { getAgency, getServices } from '../services/api'

const CONTACT_LINK = 'inline-flex items-center gap-1.5 font-semibold text-bay-700 hover:underline'

// A tel: link only works for one number; "8920-6446 / 8917-8000" stays plain text.
function Hotline({ value, label }) {
  const single = !/[/,;]/.test(value)
  const content = (
    <>
      <Phone size={15} aria-hidden="true" />
      <span className="sr-only">{label}: </span>
      {value}
    </>
  )
  return single ? (
    <a href={`tel:${value.replace(/[^\d+]/g, '')}`} className={CONTACT_LINK}>
      {content}
    </a>
  ) : (
    <span className="inline-flex items-center gap-1.5 font-semibold text-stone-700">{content}</span>
  )
}

function SubHeading({ children, count }) {
  return (
    <h2 className="flex items-center gap-3 text-2xl font-extrabold tracking-tight text-bay-950">
      {children}
      <span className="rounded-md bg-stone-100 px-2 py-0.5 text-sm font-semibold text-stone-600">{count}</span>
    </h2>
  )
}

export default function AgencyDetailPage() {
  const { t } = useI18n()
  const { slug } = useParams()
  const { data: agency, error, loading } = useFetch(() => getAgency(slug), [slug])
  const services = useFetch(() => getServices({ agency: slug }), [slug])
  usePageTitle(agency?.name ?? t('agencyDetail.pageTitle'))

  if (loading) return <LoadingState label={t('agencyDetail.loading')} />
  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <ErrorState message={t('agencyDetail.unavailable')} action={{ to: '/agencies', label: t('agencyDetail.back') }} />
      </div>
    )
  }
  if (!agency) return null

  return (
    <>
      <PageHeader
        breadcrumbs={[
          { to: '/', label: t('common.home') },
          { to: '/agencies', label: t('nav.agencies') },
          { label: agency.acronym || agency.name },
        ]}
        kicker={agency.acronym}
        title={agency.name}
        description={agency.description}
      >
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <AgencyTypeBadge isLocal={Boolean(agency.is_local_government)} />
          <AgencyPresence presence={agency.presence} />
          {agency.official_website && (
            <a
              href={agency.official_website}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg bg-bay-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-bay-800"
            >
              {t('agencyDetail.officialWebsite')} <ExternalLink size={15} aria-hidden="true" />
              <span className="sr-only">{t('common.opensInNewTab')}</span>
            </a>
          )}
        </div>
        {(agency.hotline || agency.email || agency.facebook_url) && (
          <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm">
            {agency.hotline && (
              <li>
                <Hotline value={agency.hotline} label={t('agencyDetail.hotline')} />
              </li>
            )}
            {agency.email && (
              <li>
                <a href={`mailto:${agency.email}`} className={`${CONTACT_LINK} break-all`}>
                  <Mail size={15} aria-hidden="true" />
                  <span className="sr-only">{t('agencyDetail.email')}: </span>
                  {agency.email}
                </a>
              </li>
            )}
            {agency.facebook_url && (
              <li>
                <a href={agency.facebook_url} target="_blank" rel="noopener noreferrer" className={CONTACT_LINK}>
                  <MessageCircle size={15} aria-hidden="true" />
                  {t('agencyDetail.facebook')}
                  <span className="sr-only">{t('common.opensInNewTab')}</span>
                </a>
              </li>
            )}
          </ul>
        )}
      </PageHeader>

      <div className="mx-auto max-w-6xl space-y-12 px-4 py-10 sm:px-6 sm:py-14">
        <section>
          <SubHeading count={services.data?.length ?? 0}>{t('agencyDetail.guides')}</SubHeading>
          <div className="mt-5">
            {services.loading && <CardGridSkeleton count={3} />}
            {services.error && <ErrorState message={t('common.loadError')} />}
            {services.data?.length === 0 && (
              <EmptyState
                title={t('agencyDetail.noGuides')}
                message={t('agencyDetail.noGuidesMessage', { agency: agency.acronym || agency.name })}
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
          <SubHeading count={agency.offices.length}>{t('agencyDetail.offices')}</SubHeading>
          <div className="mt-5">
            {agency.offices.length === 0 ? (
              <EmptyState
                title={t('agencyDetail.noOffices')}
                message={t('agencyDetail.noOfficesMessage')}
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
