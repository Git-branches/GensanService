import { CircleAlert, Info, Wrench } from 'lucide-react'
import { useI18n } from '../i18n/context'

const STYLES = {
  info: { icon: Info, tone: 'bg-bay-50 text-bay-950' },
  maintenance: { icon: Wrench, tone: 'bg-sun-100 text-bay-950' },
  emergency: { icon: CircleAlert, tone: 'bg-rose-700 text-white' },
}

// Notices are written by admins in one language, so only the label is translated.
export default function NoticeBanner({ notice }) {
  const { t } = useI18n()
  const { icon: Icon, tone } = STYLES[notice.type] ?? STYLES.info

  return (
    <div role={notice.type === 'emergency' ? 'alert' : 'status'} className={`${tone} print:hidden`}>
      <div className="mx-auto flex max-w-6xl items-start gap-2.5 px-4 py-2.5 text-sm sm:px-6">
        <Icon size={18} aria-hidden="true" className="mt-0.5 shrink-0" />
        <p className="min-w-0">
          <strong className="font-bold">{t(`notices.${STYLES[notice.type] ? notice.type : 'info'}`)}: {notice.title}.</strong> {notice.message}
        </p>
      </div>
    </div>
  )
}
