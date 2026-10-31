import { Navigate, Route, Routes, useParams } from 'react-router-dom'
import AdminAuthProvider from './AdminAuthProvider'
import RequireAdmin from './RequireAdmin'
import AdminLoginPage from './pages/AdminLoginPage'
import AdminServicesPage from './pages/AdminServicesPage'
import AdminServiceEditorPage from './pages/AdminServiceEditorPage'
import AdminAgenciesPage from './pages/AdminAgenciesPage'
import AdminOfficesPage from './pages/AdminOfficesPage'
import AdminCategoriesPage from './pages/AdminCategoriesPage'
import AdminFaqPage from './pages/AdminFaqPage'
import AdminGuidePreviewPage from './pages/AdminGuidePreviewPage'
import AdminNoticesPage from './pages/AdminNoticesPage'
import AdminDashboardPage from './pages/AdminDashboardPage'
import AdminReportsPage from './pages/AdminReportsPage'
import AdminActivityPage from './pages/AdminActivityPage'
import AdminUsersPage from './pages/AdminUsersPage'
import AdminAccountPage from './pages/AdminAccountPage'

// Remount the editor when moving between guides (or from "new" to the saved guide) so it starts fresh.
function ServiceEditorRoute() {
  const { id } = useParams()
  return <AdminServiceEditorPage key={id ?? 'new'} />
}

export default function AdminApp() {
  return (
    <AdminAuthProvider>
      <Routes>
        <Route path="login" element={<AdminLoginPage />} />
        <Route element={<RequireAdmin />}>
          <Route index element={<AdminDashboardPage />} />
          <Route path="reports" element={<AdminReportsPage />} />
          <Route path="activity" element={<AdminActivityPage />} />
          <Route path="admins" element={<AdminUsersPage />} />
          <Route path="account" element={<AdminAccountPage />} />
          <Route path="services" element={<AdminServicesPage />} />
          <Route path="services/new" element={<ServiceEditorRoute />} />
          <Route path="services/:id" element={<ServiceEditorRoute />} />
          <Route path="services/:id/preview" element={<AdminGuidePreviewPage />} />
          <Route path="agencies" element={<AdminAgenciesPage />} />
          <Route path="offices" element={<AdminOfficesPage />} />
          <Route path="categories" element={<AdminCategoriesPage />} />
          <Route path="faqs" element={<AdminFaqPage />} />
          <Route path="notices" element={<AdminNoticesPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    </AdminAuthProvider>
  )
}
