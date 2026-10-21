import { useCallback, useEffect, useState } from 'react'
import { adminApi } from './api'

// Like useFetch, but keeps showing the current rows while reloading (after a save or a filter change).
export function useAdminQuery(fetcher, deps) {
  const [state, setState] = useState({ data: null, error: '', loading: true })
  const [version, setVersion] = useState(0)

  useEffect(() => {
    let active = true
    fetcher()
      .then((data) => {
        if (active) setState({ data, error: '', loading: false })
      })
      .catch((err) => {
        if (active) setState((current) => ({ ...current, error: err.message, loading: false }))
      })
    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, version])

  const reload = useCallback(() => setVersion((v) => v + 1), [])
  return { ...state, reload }
}

export function useAdminList(resource) {
  return useAdminQuery(() => adminApi.list(resource), [resource])
}
