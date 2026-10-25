import { useCallback, useEffect, useMemo, useState } from 'react'
import { AdminAuthContext } from './auth'
import { adminApi, setCsrfToken, setUnauthorizedHandler } from './api'

const SIGNED_OUT = { status: 'signedOut', admin: null }

export default function AdminAuthProvider({ children }) {
  const [state, setState] = useState({ status: 'loading', admin: null })

  useEffect(() => {
    let active = true
    setUnauthorizedHandler(() => {
      setCsrfToken(null)
      setState(SIGNED_OUT)
    })

    adminApi
      .me()
      .then((data) => {
        if (!active) return
        setCsrfToken(data.csrf_token)
        setState({ status: 'signedIn', admin: data.admin })
      })
      .catch(() => {
        if (active) setState(SIGNED_OUT)
      })

    return () => {
      active = false
      setUnauthorizedHandler(null)
    }
  }, [])

  const login = useCallback(async (email, password) => {
    const data = await adminApi.login(email, password)
    setCsrfToken(data.csrf_token)
    setState({ status: 'signedIn', admin: data.admin })
  }, [])

  const logout = useCallback(async () => {
    try {
      await adminApi.logout()
    } finally {
      setCsrfToken(null)
      setState(SIGNED_OUT)
    }
  }, [])

  const changePassword = useCallback(async (currentPassword, newPassword) => {
    const data = await adminApi.changePassword(currentPassword, newPassword)
    // The server issues a new session (and CSRF token) after a password change.
    setCsrfToken(data.csrf_token)
    setState((current) => ({ ...current, admin: { ...current.admin, uses_default_password: false } }))
  }, [])

  const value = useMemo(() => ({ ...state, login, logout, changePassword }), [state, login, logout, changePassword])

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>
}
