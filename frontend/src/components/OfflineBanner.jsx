import { useSyncExternalStore } from 'react'
import { WifiOff } from 'lucide-react'
import { useI18n } from '../i18n/context'

function subscribe(onChange) {
  window.addEventListener('online', onChange)
  window.addEventListener('offline', onChange)
  return () => {
    window.removeEventListener('online', onChange)
    window.removeEventListener('offline', onChange)
  }
}

// Shown while the phone has no connection. Pre-built pages assume a connection.
export default function OfflineBanner() {
  const { t } = useI18n()
  const online = useSyncExternalStore(subscribe, () => navigator.onLine, () => true)
  if (online) return null

  return (
    <div role="status" className="border-b border-bay-900 bg-bay-950 text-white print:hidden">
      <p className="mx-auto flex max-w-6xl items-start gap-2.5 px-4 py-2.5 text-sm sm:px-6">
        <WifiOff size={17} aria-hidden="true" className="mt-0.5 shrink-0 text-sun-300" />
        <span>{t('offline.banner')}</span>
      </p>
    </div>
  )
}
