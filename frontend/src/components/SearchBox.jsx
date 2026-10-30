import { useEffect, useId, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Clock, FileText, FolderOpen, Landmark, MapPin } from 'lucide-react'
import { useI18n } from '../i18n/context'
import { search } from '../services/api'
import { addRecentSearch, clearRecentSearches, getRecentSearches } from '../utils/deviceHistory'

const MIN_LENGTH = 2
const PER_GROUP = 4

function suggestionsFrom(data, t) {
  return [
    ...data.services.slice(0, PER_GROUP).map((item) => ({
      key: `guide-${item.slug}`, group: t('search.guides'), icon: FileText, label: item.title, detail: item.agency_acronym, to: `/services/${item.slug}`,
    })),
    ...data.agencies.slice(0, PER_GROUP).map((item) => ({
      key: `agency-${item.slug}`, group: t('search.agencies'), icon: Landmark, label: item.name, detail: item.acronym, to: `/agencies/${item.slug}`,
    })),
    ...data.offices.slice(0, PER_GROUP).map((item) => ({
      key: `office-${item.id}`, group: t('search.offices'), icon: MapPin, label: item.name, detail: item.barangay, to: `/agencies/${item.agency_slug}`,
    })),
    ...data.categories.slice(0, PER_GROUP).map((item) => ({
      key: `category-${item.slug}`, group: t('search.categories'), icon: FolderOpen, label: item.name, to: `/services?category=${item.slug}`,
    })),
  ]
}

// A search field with suggestions, following the ARIA combobox pattern. It stays a plain form
// input: pressing Enter with nothing highlighted submits the surrounding form.
export default function SearchBox({ id, name = 'q', defaultValue = '', placeholder, className }) {
  const { t } = useI18n()
  const navigate = useNavigate()
  const listId = useId()
  const [value, setValue] = useState(defaultValue)
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)
  const [found, setFound] = useState(null)
  const [recents, setRecents] = useState(getRecentSearches)

  const query = value.trim()
  const searching = query.length >= MIN_LENGTH

  useEffect(() => {
    if (!searching) return undefined
    let current = true
    const timer = setTimeout(() => {
      search(query)
        .then((data) => current && setFound({ query, data }))
        .catch(() => {})
    }, 200)
    return () => {
      current = false
      clearTimeout(timer)
    }
  }, [query, searching])

  const data = found?.query === query ? found.data : null
  const options = searching
    ? data ? suggestionsFrom(data, t) : []
    : query === '' ? recents.map((text) => ({ key: `recent-${text}`, group: t('search.recent'), icon: Clock, label: text, to: `/services?q=${encodeURIComponent(text)}` })) : []
  const showNoMatches = searching && data && options.length === 0
  const expanded = open && (options.length > 0 || showNoMatches)

  function choose(option) {
    addRecentSearch(option.to.startsWith('/services?q=') ? option.label : query)
    setOpen(false)
    setActive(-1)
    navigate(option.to)
  }

  function handleKeyDown(event) {
    if (event.key === 'Escape') {
      // Browsers clear search fields on Escape; while the list is open it should only close the list.
      if (expanded) event.preventDefault()
      setOpen(false)
      setActive(-1)
    } else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      setOpen(true)
      if (options.length === 0) return
      const step = event.key === 'ArrowDown' ? 1 : -1
      setActive((index) => (index + step + options.length + (index < 0 && step < 0 ? 1 : 0)) % options.length)
    } else if (event.key === 'Enter') {
      if (expanded && active >= 0) {
        event.preventDefault()
        choose(options[active])
      } else {
        setOpen(false)
      }
    }
  }

  return (
    <>
      <input
        id={id}
        name={name}
        type="search"
        role="combobox"
        autoComplete="off"
        aria-autocomplete="list"
        aria-expanded={expanded}
        aria-controls={listId}
        aria-activedescendant={expanded && active >= 0 ? `${listId}-${active}` : undefined}
        value={value}
        placeholder={placeholder}
        onChange={(event) => {
          setValue(event.target.value)
          setActive(-1)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={handleKeyDown}
        className={className}
      />
      {expanded && (
        // Pressing inside the list must not blur the input, or it would close before the click lands.
        <div onMouseDown={(event) => event.preventDefault()} className="absolute inset-x-0 top-full z-30 mt-1 overflow-hidden rounded-xl border border-stone-200 bg-white shadow-lg shadow-bay-900/10">
          {showNoMatches && <p className="px-4 py-3 text-sm text-stone-500">{t('search.noMatches')}</p>}
          <ul id={listId} role="listbox" aria-label={t('search.suggestions')} className="max-h-80 overflow-y-auto py-1">
            {options.map((option, index) => {
              const Icon = option.icon
              const firstInGroup = index === 0 || options[index - 1].group !== option.group
              return (
                <li
                  key={option.key}
                  id={`${listId}-${index}`}
                  role="option"
                  aria-selected={index === active}
                  onClick={() => choose(option)}
                  className={`cursor-pointer px-4 py-2 text-left text-sm ${index === active ? 'bg-bay-50' : 'hover:bg-stone-50'}`}
                >
                  {firstInGroup && <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-stone-500">{option.group}</span>}
                  <span className="flex items-center gap-2.5">
                    <Icon size={15} aria-hidden="true" className="shrink-0 text-bay-600" />
                    <span className="min-w-0 flex-1 truncate font-medium text-stone-900">{option.label}</span>
                    {option.detail && <span className="shrink-0 text-xs text-stone-500">{option.detail}</span>}
                  </span>
                </li>
              )
            })}
          </ul>
          {!searching && options.length > 0 && (
            <button
              type="button"
              onClick={() => {
                clearRecentSearches()
                setRecents([])
              }}
              className="w-full border-t border-stone-100 px-4 py-2 text-left text-xs font-semibold text-stone-600 hover:bg-stone-50"
            >
              {t('search.clearRecent')}
            </button>
          )}
        </div>
      )}
    </>
  )
}
