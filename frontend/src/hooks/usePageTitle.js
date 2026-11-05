import { useEffect } from 'react'

const SITE_NAME = 'Andam GenSan'
let defaultDescription = null

// description replaces the page's search-result summary; pages without one keep the site default.
export function usePageTitle(title, description) {
  useEffect(() => {
    document.title = title ? `${title} · ${SITE_NAME}` : SITE_NAME
  }, [title])

  useEffect(() => {
    const meta = document.querySelector('meta[name="description"]')
    if (!meta) return
    defaultDescription ??= meta.content
    meta.content = description || defaultDescription
  }, [description])
}
