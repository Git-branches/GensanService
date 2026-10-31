import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Header from './Header'
import Footer from './Footer'
import NoticeBanner from './NoticeBanner'
import { useFetch } from '../hooks/useFetch'
import { useI18n } from '../i18n/context'
import { getAnnouncements } from '../services/api'

export default function Layout() {
  const { pathname } = useLocation()
  const { t } = useI18n()
  const { data: notices } = useFetch(getAnnouncements, [])
  const fullPage = notices?.find((notice) => notice.full_page)

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-sun-300 focus:px-5 focus:py-2.5 focus:text-sm focus:font-bold focus:text-bay-950 focus:shadow-lg"
      >
        {t('common.skipToContent')}
      </a>
      <Header />
      {notices?.filter((notice) => !notice.full_page).map((notice) => (
        <NoticeBanner key={notice.id} notice={notice} />
      ))}
      <main id="main" tabIndex={-1} className="flex-1 focus:outline-none">
        {fullPage ? (
          <section className="mx-auto max-w-2xl px-4 py-20 text-center sm:px-6">
            <h1 className="text-3xl font-extrabold tracking-tight text-bay-950">{fullPage.title}</h1>
            <p className="mt-3 text-lg leading-relaxed text-stone-600">{fullPage.message}</p>
          </section>
        ) : (
          <Outlet />
        )}
      </main>
      <Footer />
    </div>
  )
}
