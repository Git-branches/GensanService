import { ChevronDown, Languages } from 'lucide-react'
import { useI18n } from '../i18n/context'
import { LANGUAGES } from '../i18n/languages'

export default function LanguageSwitcher() {
  const { locale, setLocale, t } = useI18n()
  // A hidden language opened with ?lang= stays listed so the select shows what is in use.
  const options = LANGUAGES.filter((language) => language.enabled || language.code === locale)

  return (
    <label className="relative flex items-center gap-1.5 text-stone-700">
      <Languages size={14} aria-hidden="true" className="shrink-0 text-bay-600" />
      <span className="sr-only">{t('common.language')}</span>
      <select
        value={locale}
        onChange={(event) => setLocale(event.target.value)}
        className="min-h-11 cursor-pointer appearance-none rounded-md bg-transparent py-1 pr-5 pl-0.5 text-base font-semibold text-stone-700 hover:text-bay-700 focus-visible:outline-2 focus-visible:outline-bay-600 sm:min-h-8 sm:text-xs"
      >
        {options.map((language) => (
          <option key={language.code} value={language.code} lang={language.htmlLang ?? undefined}>
            {language.label}
          </option>
        ))}
      </select>
      <ChevronDown size={12} aria-hidden="true" className="pointer-events-none absolute right-0.5 text-stone-500" />
    </label>
  )
}
