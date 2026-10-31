import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
import Layout from '../components/Layout'
import { LoadingState } from '../components/StateMessage'
import HomePage from '../pages/HomePage'
import ServicesPage from '../pages/ServicesPage'
import ServiceDetailPage from '../pages/ServiceDetailPage'
import AgenciesPage from '../pages/AgenciesPage'
import AgencyDetailPage from '../pages/AgencyDetailPage'
import OfficesPage from '../pages/OfficesPage'
import FaqPage from '../pages/FaqPage'
import PrivacyPage from '../pages/PrivacyPage'
import NotFoundPage from '../pages/NotFoundPage'

// Public pages stay in one file: splitting them was measured at more than twice as slow on mobile data.
// Loaded on demand so public visitors never download the admin code.
const AdminApp = lazy(() => import('../admin/AdminApp'))

export default function AppRoutes() {
  return (
    <Routes>
      <Route
        path="admin/*"
        element={
          <Suspense fallback={<LoadingState label="Loading admin..." fill />}>
            <AdminApp />
          </Suspense>
        }
      />
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="services" element={<ServicesPage />} />
        <Route path="services/:slug" element={<ServiceDetailPage />} />
        <Route path="agencies" element={<AgenciesPage />} />
        <Route path="agencies/:slug" element={<AgencyDetailPage />} />
        <Route path="offices" element={<OfficesPage />} />
        <Route path="faq" element={<FaqPage />} />
        <Route path="privacy" element={<PrivacyPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
