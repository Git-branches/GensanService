import { Link } from 'react-router-dom'
import PageHeader from '../components/PageHeader'
import { usePageTitle } from '../hooks/usePageTitle'

export default function NotFoundPage() {
  usePageTitle('Page not found')

  return (
    <PageHeader
      kicker="Error 404"
      title="We couldn't find that page"
      description="The page may have moved, or the link may be incorrect."
    >
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link
          to="/"
          className="inline-flex items-center justify-center rounded-lg bg-bay-700 px-6 py-2.5 font-semibold text-white hover:bg-bay-800"
        >
          Back to home
        </Link>
        <Link
          to="/services"
          className="inline-flex items-center justify-center rounded-lg border border-stone-300 bg-white px-6 py-2.5 font-semibold text-stone-700 hover:bg-stone-50"
        >
          Browse service guides
        </Link>
      </div>
    </PageHeader>
  )
}
