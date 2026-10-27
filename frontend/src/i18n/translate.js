import en from './locales/en'
import ceb from './locales/ceb'
import fil from './locales/fil'
import hil from './locales/hil'
import blaan from './locales/blaan'
import mdh from './locales/mdh'
import mrw from './locales/mrw'

const MESSAGES = { en, ceb, fil, hil, blaan, mdh, mrw }

function lookup(messages, key) {
  return key.split('.').reduce((node, part) => (node == null ? undefined : node[part]), messages)
}

function isPlural(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value) && 'one' in value && 'other' in value
}

// Looks up `key` in the locale, falling back to English, then to the key itself so a missing
// string is visible instead of blank. Replaces {name} placeholders with values from `vars`.
export function translate(locale, key, vars) {
  let value = lookup(MESSAGES[locale], key)
  if (value === undefined || value === '') value = lookup(en, key)
  if (value === undefined) return key

  if (isPlural(value)) value = vars?.count === 1 ? value.one : value.other
  if (typeof value !== 'string' || !vars) return value

  return value.replace(/\{(\w+)\}/g, (match, name) => (name in vars ? String(vars[name]) : match))
}
