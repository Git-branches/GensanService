import { Link } from 'react-router-dom'
import PageHeader from '../components/PageHeader'
import { usePageTitle } from '../hooks/usePageTitle'
import { useI18n } from '../i18n/context'

export default function NotFoundPage() {
  const { t } = useI18n()
  usePageTitle(t('notFound.pageTitle'))

  return (
    <PageHeader
      kicker={t('notFound.kicker')}
      title={t('notFound.title')}
      description={t('notFound.description')}
    >
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link
          to="/"
          className="inline-flex items-center justify-center rounded-lg bg-bay-700 px-6 py-2.5 font-semibold text-white hover:bg-bay-800"
        >
          {t('notFound.home')}
        </Link>
        <Link
          to="/services"
          className="inline-flex items-center justify-center rounded-lg border border-stone-300 bg-white px-6 py-2.5 font-semibold text-stone-700 hover:bg-stone-50"
        >
          {t('notFound.browse')}
        </Link>
      </div>
    </PageHeader>
  )
}
