import PageHeader from '../components/PageHeader'
import { usePageTitle } from '../hooks/usePageTitle'
import { useI18n } from '../i18n/context'

export default function PrivacyPage() {
  const { t } = useI18n()
  usePageTitle(t('privacy.pageTitle'))

  return (
    <>
      <PageHeader
        breadcrumbs={[{ to: '/', label: t('common.home') }, { label: t('privacy.pageTitle') }]}
        meta={t('privacy.updated')}
        title={t('privacy.pageTitle')}
        description={t('privacy.intro')}
      />
      <section className="mx-auto max-w-3xl space-y-8 px-4 py-10 sm:px-6 sm:py-14">
        {t('privacy.sections').map((section) => (
          <div key={section.heading}>
            <h2 className="text-xl font-extrabold tracking-tight text-bay-950">{section.heading}</h2>
            {section.paragraphs.map((text) => (
              <p key={text} className="mt-2 leading-relaxed text-stone-700">{text}</p>
            ))}
          </div>
        ))}
      </section>
    </>
  )
}
