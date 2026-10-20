import { Route, Routes } from 'react-router-dom'
import Layout from '../components/Layout'
import HomePage from '../pages/HomePage'
import ServicesPage from '../pages/ServicesPage'
import ServiceDetailPage from '../pages/ServiceDetailPage'
import AgenciesPage from '../pages/AgenciesPage'
import AgencyDetailPage from '../pages/AgencyDetailPage'
import OfficesPage from '../pages/OfficesPage'
import NotFoundPage from '../pages/NotFoundPage'

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="services" element={<ServicesPage />} />
        <Route path="services/:slug" element={<ServiceDetailPage />} />
        <Route path="agencies" element={<AgenciesPage />} />
        <Route path="agencies/:slug" element={<AgencyDetailPage />} />
        <Route path="offices" element={<OfficesPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
