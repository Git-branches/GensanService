import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { I18nContext } from './context'
import { DEFAULT_LOCALE, findLanguage, LANGUAGES } from './languages'
import { translate } from './translate'

const STORAGE_KEY = 'andam-gensan-language'

function readStored() {
  try {
    return localStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

function store(code) {
  try {
    localStorage.setItem(STORAGE_KEY, code)
  } catch {
    // Private mode or blocked storage: the choice just lasts for this visit.
  }
}

// ?lang= wins (and can open a hidden language for translators), then the saved choice,
// then the browser language if it is one we offer, then English.
// frontend/index.html repeats this check, so keep the two in step.
function initialLocale() {
  const fromUrl = new URLSearchParams(window.location.search).get('lang')
  if (findLanguage(fromUrl)) return fromUrl

  const stored = findLanguage(readStored())
  if (stored?.enabled) return stored.code

  const browser = (navigator.languages ?? [navigator.language]).map((tag) => tag?.split('-')[0])
  const match = LANGUAGES.find((language) => language.enabled && browser.includes(language.htmlLang))
  return match?.code ?? DEFAULT_LOCALE
}

// serverLocale is set when pages are pre-built, where there is no browser to read from.
export default function I18nProvider({ serverLocale, children }) {
  const [chosen, setChosen] = useState(() => serverLocale ?? initialLocale())
  const { pathname } = useLocation()
  // The admin panel stays in English whatever the visitor picked.
  const locale = pathname.startsWith('/admin') ? DEFAULT_LOCALE : chosen

  const setLocale = useCallback((code) => {
    if (!findLanguage(code)) return
    setChosen(code)
    store(code)
  }, [])

  useEffect(() => {
    document.documentElement.lang = findLanguage(locale)?.htmlLang ?? 'en'
  }, [locale])

  const value = useMemo(
    () => ({ locale, setLocale, t: (key, vars) => translate(locale, key, vars) }),
    [locale, setLocale],
  )

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}
