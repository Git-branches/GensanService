import { Navigate, Route, Routes, useParams } from 'react-router-dom'
import AdminAuthProvider from './AdminAuthProvider'
import RequireAdmin from './RequireAdmin'
import AdminLoginPage from './pages/AdminLoginPage'
import AdminServicesPage from './pages/AdminServicesPage'
import AdminServiceEditorPage from './pages/AdminServiceEditorPage'
import AdminAgenciesPage from './pages/AdminAgenciesPage'
import AdminOfficesPage from './pages/AdminOfficesPage'
import AdminCategoriesPage from './pages/AdminCategoriesPage'

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
          <Route index element={<Navigate to="services" replace />} />
          <Route path="services" element={<AdminServicesPage />} />
          <Route path="services/new" element={<ServiceEditorRoute />} />
          <Route path="services/:id" element={<ServiceEditorRoute />} />
          <Route path="agencies" element={<AdminAgenciesPage />} />
          <Route path="offices" element={<AdminOfficesPage />} />
          <Route path="categories" element={<AdminCategoriesPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    </AdminAuthProvider>
  )
}
