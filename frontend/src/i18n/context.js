import { createContext, useContext } from 'react'
import { DEFAULT_LOCALE } from './languages'
import { translate } from './translate'

export const I18nContext = createContext({
  locale: DEFAULT_LOCALE,
  setLocale: () => {},
  t: (key, vars) => translate(DEFAULT_LOCALE, key, vars),
})

export function useI18n() {
  return useContext(I18nContext)
}
