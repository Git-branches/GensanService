import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Check, ChevronRight, RotateCcw } from 'lucide-react'
import { useI18n } from '../i18n/context'

const storageKey = (slug) => `gsn:checklist:${slug}`

function readSaved(slug) {
  try {
    return JSON.parse(localStorage.getItem(storageKey(slug))) || {}
  } catch {
    return {}
  }
}

function save(slug, value) {
  try {
    localStorage.setItem(storageKey(slug), JSON.stringify(value))
  } catch {
    // Storage can be unavailable (private mode, blocked site data); the checklist still works in memory.
  }
}

export default function Checklist({ slug, requirements }) {
  const { t } = useI18n()
  const [checked, setChecked] = useState(() => readSaved(slug))

  const readyCount = requirements.filter((item) => checked[item.id]).length
  const percent = requirements.length ? Math.round((readyCount / requirements.length) * 100) : 0
  const done = percent === 100

  function update(next) {
    setChecked(next)
    save(slug, next)
  }

  return (
    <div>
      <div className={`rounded-lg p-4 print:hidden ${done ? 'bg-emerald-50' : 'bg-bay-50'}`}>
        <div className="flex items-center justify-between gap-3 text-sm">
          <span className="font-bold text-bay-950">
            {done ? t('checklist.allSet') : t('checklist.ready', { ready: readyCount, total: requirements.length })}
          </span>
          <span className="font-semibold tabular-nums text-stone-600">{percent}%</span>
        </div>
        <div
          role="progressbar"
          aria-label={t('checklist.progress')}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percent}
          className="mt-2.5 h-2.5 overflow-hidden rounded-full bg-white ring-1 ring-inset ring-bay-100"
        >
          <div
            className={`h-full rounded-full transition-all duration-500 ${done ? 'bg-emerald-500' : 'bg-sun-400'}`}
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      <ul className="-mx-5 mt-4 divide-y divide-stone-100 border-y border-stone-100 sm:-mx-6">
        {requirements.map((item) => {
          const isChecked = Boolean(checked[item.id])
          return (
            <li key={item.id}>
              <label
                className={`flex cursor-pointer items-start gap-3 px-5 py-4 transition-colors sm:px-6 ${
                  isChecked ? 'bg-emerald-50/60' : 'bg-white hover:bg-stone-50'
                }`}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => update({ ...checked, [item.id]: !isChecked })}
                  className="peer sr-only"
                />
                <span
                  aria-hidden="true"
                  className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-bay-500 peer-focus-visible:ring-offset-2 ${
                    isChecked ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-stone-400 bg-white'
                  }`}
                >
                  {isChecked && <Check size={14} strokeWidth={3} />}
                </span>
                <span className="min-w-0">
                  <span className={`font-semibold ${isChecked ? 'text-stone-500 line-through' : 'text-stone-900'}`}>
                    {item.requirement_text}
                  </span>
                  {Boolean(item.is_optional) && (
                    <span className="ml-2 rounded bg-sun-50 px-1.5 py-0.5 text-xs font-semibold text-sun-800 ring-1 ring-sun-200">
                      {t('checklist.ifApplicable')}
                    </span>
                  )}
                  {item.notes && <span className="mt-1 block text-base text-stone-600 sm:text-sm">{item.notes}</span>}
                  {item.linked_slug && (
                    <Link
                      to={`/services/${item.linked_slug}`}
                      className="mt-0.5 flex min-h-11 items-center gap-0.5 text-sm font-semibold text-bay-700 hover:underline"
                    >
                      {t('checklist.howToGet')}
                      <span className="sr-only">: {item.linked_title}</span>
                      <ChevronRight size={15} aria-hidden="true" />
                    </Link>
                  )}
                </span>
              </label>
            </li>
          )
        })}
      </ul>

      {readyCount > 0 && (
        <div className="mt-4 print:hidden">
          <button
            type="button"
            onClick={() => update({})}
            className="inline-flex min-h-11 items-center gap-2 rounded-lg px-4 text-sm font-semibold text-stone-600 transition-colors hover:bg-stone-100"
          >
            <RotateCcw size={16} aria-hidden="true" /> {t('checklist.reset')}
          </button>
        </div>
      )}

      <p className="mt-4 text-xs leading-relaxed text-stone-500">
        {t('checklist.note')}
      </p>
    </div>
  )
}
