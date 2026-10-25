import { ROLE_LABELS } from './auth'

const STATUS_WORDS = {
  draft: 'draft',
  published: 'published',
  archived: 'archived',
  pending: 'pending',
  reviewing: 'reviewing',
  resolved: 'resolved',
  dismissed: 'dismissed',
}

const ACTIONS = {
  'auth.login': () => 'signed in',
  'auth.logout': () => 'signed out',
  'auth.password_changed': () => 'changed their password',
  'service.created': (d) => `created the guide "${d.title}"`,
  'service.updated': (d) => `edited the guide "${d.title}"`,
  'service.status_changed': (d) => `changed "${d.title}" from ${STATUS_WORDS[d.from] ?? d.from} to ${STATUS_WORDS[d.to] ?? d.to}`,
  'agency.created': (d) => `added the agency "${d.name}"`,
  'agency.updated': (d) => `edited the agency "${d.name}"`,
  'office.created': (d) => `added the office "${d.name}"`,
  'office.updated': (d) => `edited the office "${d.name}"`,
  'category.created': (d) => `added the category "${d.name}"`,
  'category.updated': (d) => `edited the category "${d.name}"`,
  'report.status_changed': (d) => `marked a report on "${d.service}" as ${STATUS_WORDS[d.to] ?? d.to}`,
  'admin.created': (d) => `added the admin ${d.email} (${ROLE_LABELS[d.role] ?? d.role})`,
  'admin.updated': (d) => `updated the admin ${d.email}${d.active === false ? ' (deactivated)' : ''}`,
  'admin.password_reset': (d) => `reset the password for ${d.email}`,
}

export function describeActivity(item) {
  const describe = ACTIONS[item.action]
  return describe ? describe(item.details ?? {}) : item.action
}

export const ACTIVITY_TYPES = [
  { value: '', label: 'All activity' },
  { value: 'service', label: 'Service guides' },
  { value: 'report', label: 'Reports' },
  { value: 'agency', label: 'Agencies' },
  { value: 'office', label: 'Offices' },
  { value: 'category', label: 'Categories' },
  { value: 'admin', label: 'Admin accounts' },
  { value: 'auth', label: 'Sign-ins' },
]

export function timeAgo(value) {
  const date = new Date(value.replace(' ', 'T'))
  const seconds = Math.round((Date.now() - date.getTime()) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.round(seconds / 60)
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours} hr ago`
  const days = Math.round(hours / 24)
  if (days < 7) return `${days} day${days === 1 ? '' : 's'} ago`
  return date.toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })
}
