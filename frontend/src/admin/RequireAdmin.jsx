import { Navigate, useLocation } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useAdminAuth } from './auth'
import AdminLayout from './AdminLayout'

export default function RequireAdmin() {
  const { status } = useAdminAuth()
  const location = useLocation()

  if (status === 'loading') {
    return (
      <div role="status" className="flex min-h-screen items-center justify-center gap-2 text-stone-600">
        <Loader2 className="animate-spin text-bay-600" size={20} aria-hidden="true" /> Checking your session...
      </div>
    )
  }

  if (status === 'signedOut') {
    return <Navigate to="/admin/login" replace state={{ from: location.pathname + location.search }} />
  }

  return <AdminLayout />
}
