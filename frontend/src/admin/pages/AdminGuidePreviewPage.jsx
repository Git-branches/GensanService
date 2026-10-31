import { useCallback } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Eye } from 'lucide-react'
import ServiceDetailPage from '../../pages/ServiceDetailPage'
import { adminApi } from '../api'

export default function AdminGuidePreviewPage() {
  const { id } = useParams()
  const loadGuide = useCallback(() => adminApi.previewService(id), [id])

  return (
    <div className="-mx-4 -my-6 sm:-mx-6 lg:-mx-8 lg:-my-8">
      <div className="flex flex-wrap items-center justify-between gap-2 bg-bay-900 px-4 py-2.5 text-sm text-white sm:px-6">
        <p className="flex items-center gap-2 font-semibold">
          <Eye size={16} aria-hidden="true" /> Preview. This is how the guide looks to residents.
        </p>
        <Link to={`/admin/services/${id}`} className="inline-flex items-center gap-1 font-semibold hover:underline">
          <ArrowLeft size={15} aria-hidden="true" /> Back to editing
        </Link>
      </div>
      <ServiceDetailPage loadGuide={loadGuide} />
    </div>
  )
}
