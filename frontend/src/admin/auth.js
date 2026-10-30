import { createContext, useContext } from 'react'

export const AdminAuthContext = createContext(null)

export function useAdminAuth() {
  return useContext(AdminAuthContext)
}

export const ROLE_LABELS = {
  super_admin: 'Super admin',
  editor: 'Editor',
  reviewer: 'Reviewer',
}

export function isSuperAdmin(admin) {
  return admin?.role === 'super_admin'
}

export function canEditContent(admin) {
  return admin?.role === 'super_admin' || admin?.role === 'editor'
}

export function canReview(admin) {
  return admin?.role === 'super_admin' || admin?.role === 'reviewer'
}
