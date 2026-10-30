import { useState } from 'react'
import { Search } from 'lucide-react'
import FaqItem from '../components/FaqItem'
import PageHeader from '../components/PageHeader'
import { CardGridSkeleton, EmptyState, ErrorState } from '../components/StateMessage'
import { useFetch } from '../hooks/useFetch'
import { usePageTitle } from '../hooks/usePageTitle'
import { useI18n } from '../i18n/context'
import { getFaqs } from '../services/api'

const CATEGORIES = ['about', 'guides', 'directory', 'accuracy']

export default function FaqPage() {
  const { t, locale } = useI18n()
  usePageTitle(t('faq.pageTitle'))
  const { data: faqs, error, loading } = useFetch(() => getFaqs(locale), [locale])
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('')

  const needle = query.trim().toLowerCase()
  const visible = (faqs ?? []).filter(
    (faq) => (!category || faq.category === category) && (!needle || `${faq.question} ${faq.answer}`.toLowerCase().includes(needle)),
  )

  return (
    <>
      <PageHeader
        breadcrumbs={[{ to: '/', label: t('common.home') }, { label: t('faq.pageTitle') }]}
        kicker={t('faq.kicker')}
        title={t('faq.pageTitle')}
        description={t('faq.description')}
      />

      <section className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
        <label htmlFor="faq-q" className="text-sm font-semibold text-stone-700">{t('faq.search')}</label>
        <div className="relative mt-1.5">
          <Search size={18} aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            id="faq-q"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="w-full rounded-lg border border-stone-300 bg-white py-2.5 pl-10 pr-3 text-base focus:border-bay-500 focus:outline-none focus:ring-2 focus:ring-bay-500/20"
          />
        </div>

        <div role="group" aria-label={t('faq.filter')} className="mt-4 flex flex-wrap gap-2">
          {['', ...CATEGORIES].map((value) => (
            <button
              key={value || 'all'}
              type="button"
              aria-pressed={category === value}
              onClick={() => setCategory(value)}
              className={`rounded-md px-3 py-1.5 text-sm font-semibold transition-colors ${
                category === value ? 'bg-bay-900 text-white' : 'bg-white text-stone-700 ring-1 ring-stone-200 hover:bg-stone-50'
              }`}
            >
              {value ? t(`faq.categories.${value}`) : t('faq.all')}
            </button>
          ))}
        </div>

        <div className="mt-6">
          {loading && <CardGridSkeleton count={2} className="" />}
          {error && <ErrorState message={t('common.loadError')} />}
          {faqs && visible.length === 0 && <EmptyState title={t('faq.empty')} />}
          {visible.length > 0 && (
            <div className="divide-y divide-stone-200 border-y border-stone-200">
              {visible.map((faq) => (
                <FaqItem key={faq.id} faq={faq} />
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  )
}
