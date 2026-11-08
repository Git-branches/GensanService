// Fails when a language shown in the switcher is missing a string that English has. Hidden languages
// are listed but do not fail, since translators are still working on them.
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { LANGUAGES } from '../src/i18n/languages.js'

const here = dirname(fileURLToPath(import.meta.url))
const localesDir = join(here, '..', 'src', 'i18n', 'locales')

const load = async (code) => (await import(pathToFileURL(join(localesDir, `${code}.js`)).href)).default

// Walks objects and arrays, so a missing paragraph or a shorter list is noticed too.
function leafKeys(value, prefix = '') {
  if (Array.isArray(value)) return value.flatMap((item, index) => leafKeys(item, `${prefix}[${index}]`))
  if (value && typeof value === 'object') {
    return Object.entries(value).flatMap(([key, item]) => leafKeys(item, prefix ? `${prefix}.${key}` : key))
  }
  return [prefix]
}

const english = new Set(leafKeys(await load('en')))
let failed = false

for (const language of LANGUAGES) {
  if (language.code === 'en') continue
  const present = new Set(leafKeys(await load(language.code)))
  const missing = [...english].filter((key) => !present.has(key))
  const extra = [...present].filter((key) => !english.has(key))

  if (!missing.length && !extra.length) {
    console.log(`${language.code}: complete`)
    continue
  }

  console.log(`${language.code}: ${missing.length} missing${extra.length ? `, ${extra.length} not in English` : ''}`)
  if (language.enabled) {
    failed = true
    for (const key of missing.slice(0, 20)) console.log(`  - ${key}`)
    if (missing.length > 20) console.log(`  ... and ${missing.length - 20} more`)
  }
}

if (failed) {
  console.error('English strings are missing from a language shown in the switcher.')
  process.exit(1)
}
