// Languages the public site can be shown in. A language stays hidden from the switcher until
// `enabled` is true; hidden ones can still be previewed with ?lang=<code> while they are translated.
// `htmlLang` is the BCP 47 tag set on <html>; null means it is not confirmed yet, so English is used.
export const LANGUAGES = [
  { code: 'en', label: 'English', htmlLang: 'en', enabled: true },
  { code: 'ceb', label: 'Bisaya', htmlLang: 'ceb', enabled: true },
  { code: 'fil', label: 'Filipino', htmlLang: 'fil', enabled: true },
  { code: 'hil', label: 'Hiligaynon', htmlLang: 'hil', enabled: true },
  // Koronadal Blaan (bpr) and Sarangani Blaan (bps) differ; set the tag once the translator confirms which.
  { code: 'blaan', label: 'Blaan', htmlLang: null, enabled: false },
  { code: 'mdh', label: 'Maguindanaon', htmlLang: 'mdh', enabled: false },
  { code: 'mrw', label: 'Maranao', htmlLang: 'mrw', enabled: false },
]

export const DEFAULT_LOCALE = 'en'

export function findLanguage(code) {
  return LANGUAGES.find((language) => language.code === code)
}
