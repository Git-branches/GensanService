// Things remembered only in this browser, never sent to the server.
const SEARCHES_KEY = 'andam-recent-searches'
const VIEWED_KEY = 'andam-recently-viewed'
const MAX_SEARCHES = 5
const MAX_VIEWED = 6

function read(key) {
  try {
    const value = JSON.parse(localStorage.getItem(key))
    return Array.isArray(value) ? value : []
  } catch {
    return []
  }
}

function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Storage can be unavailable (private mode, blocked site data); the site works without it.
  }
}

export const getRecentSearches = () => read(SEARCHES_KEY)

export function addRecentSearch(query) {
  const text = query.trim()
  if (text.length < 2) return
  const others = read(SEARCHES_KEY).filter((item) => item.toLowerCase() !== text.toLowerCase())
  write(SEARCHES_KEY, [text, ...others].slice(0, MAX_SEARCHES))
}

export const clearRecentSearches = () => write(SEARCHES_KEY, [])

export const getRecentlyViewed = () => read(VIEWED_KEY)

export function addRecentlyViewed(guide) {
  const others = read(VIEWED_KEY).filter((item) => item.slug !== guide.slug)
  write(VIEWED_KEY, [guide, ...others].slice(0, MAX_VIEWED))
}

// True the first time a guide is opened in this browser tab, so a reload isn't counted again.
export function isFirstViewThisVisit(slug) {
  try {
    const key = `andam-viewed:${slug}`
    if (sessionStorage.getItem(key)) return false
    sessionStorage.setItem(key, '1')
    return true
  } catch {
    return false
  }
}
