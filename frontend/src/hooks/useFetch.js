import { useEffect, useState } from 'react'

export function useFetch(fetcher, deps = []) {
  const [prevDeps, setPrevDeps] = useState(deps)
  const [state, setState] = useState({ data: null, error: null, loading: true })

  const depsChanged = deps.some((dep, index) => dep !== prevDeps[index])
  if (depsChanged) {
    setPrevDeps(deps)
    setState({ data: null, error: null, loading: true })
  }

  useEffect(() => {
    let active = true

    fetcher()
      .then((result) => {
        if (active) setState({ data: result, error: null, loading: false })
      })
      .catch((err) => {
        if (active) setState({ data: null, error: err.message || 'Something went wrong', loading: false })
      })

    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return state
}
