// Anonymous page counts for the admin analytics page: the page type, language, and screen size only.
// No cookies, IP addresses, or visitor IDs. Browsers asking not to be tracked are not counted.
const PAGES = [
  [/^\/$/, 'home'],
  [/^\/services\/?$/, 'services'],
  [/^\/services\/[^/]+$/, 'guide'],
  [/^\/agencies\/?$/, 'agencies'],
  [/^\/agencies\/[^/]+$/, 'agency'],
  [/^\/offices\/?$/, 'offices'],
  [/^\/faq\/?$/, 'faq'],
  [/^\/privacy\/?$/, 'privacy'],
]

let lastCounted = ''

function optedOut() {
  return navigator.doNotTrack === '1' || window.doNotTrack === '1' || navigator.globalPrivacyControl === true
}

export function countPageView(pathname, locale) {
  // One count per address change, even when React runs an effect twice.
  if (pathname === lastCounted || optedOut()) return
  lastCounted = pathname

  const page = PAGES.find(([pattern]) => pattern.test(pathname))?.[1] ?? 'not_found'
  const width = window.innerWidth
  const device = width < 640 ? 'phone' : width < 1024 ? 'tablet' : 'desktop'
  const body = JSON.stringify({ page, locale, device })

  if (navigator.sendBeacon?.('/api/analytics/view', new Blob([body], { type: 'application/json' }))) return
  fetch('/api/analytics/view', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, keepalive: true }).catch(() => {})
}
