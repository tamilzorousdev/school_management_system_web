import type { BadgeTone } from '@/components/ui/badge'
import { toApiError } from '@/lib/api/errors'
import { alerts } from '@/lib/alerts'
import type {
  CrewRole,
  DutyStatus,
  ExpiryKind,
  ExpiryState,
  ExpiryStateCode,
  TransportMode,
} from './api'

export const MODE_LABELS: Record<TransportMode, string> = {
  both: 'Both ways',
  pickup: 'Morning pickup only',
  drop: 'Evening drop only',
}

export const MODE_OPTIONS = (Object.keys(MODE_LABELS) as TransportMode[]).map((value) => ({
  value,
  label: MODE_LABELS[value],
}))

export const ROLE_BADGE: Record<CrewRole, { label: string; tone: BadgeTone }> = {
  driver: { label: 'Driver', tone: 'info' },
  attendant: { label: 'Bus attendant', tone: 'neutral' },
}

export const SHORT_KIND: Record<ExpiryKind, string> = {
  insurance: 'Insurance',
  fitness: 'Fitness',
  puc: 'PUC',
  permit: 'Permit',
  licence: 'Licence',
  badge: 'Badge',
  medical: 'Medical',
  police: 'Police',
}

export const CREW_KINDS: ExpiryKind[] = ['licence', 'badge', 'medical', 'police']

export const DUTY_HINT: Record<DutyStatus, string> = {
  approved: 'Approved for duty',
  pending: 'Not approved yet',
  blocked: 'Documents need renewal',
}

const RANK: Record<ExpiryStateCode, number> = { expired: 0, due_soon: 1, ok: 2, missing: 3 }

export const worstFirst = (items: ExpiryState[]) =>
  [...items].sort(
    (a, b) => RANK[a.state] - RANK[b.state] || (a.days_left ?? 0) - (b.days_left ?? 0)
  )

export const daysText = (days: number) => {
  if (days < 0) return `Expired ${-days} ${-days === 1 ? 'day' : 'days'} ago`
  if (days === 0) return 'Ends today'
  return `Due in ${days} ${days === 1 ? 'day' : 'days'}`
}

export const expiryText = (item: ExpiryState) => {
  if (item.state === 'missing' || item.days_left === null) return 'Not set'
  if (item.state === 'expired') return 'Expired'
  if (item.state === 'due_soon') return daysText(item.days_left)
  return 'OK'
}

export const EXPIRY_TONE: Record<ExpiryStateCode, BadgeTone> = {
  expired: 'danger',
  due_soon: 'warning',
  ok: 'success',
  missing: 'neutral',
}

export const daysTone = (days: number): BadgeTone =>
  days < 0 ? 'danger' : days <= 7 ? 'warning' : 'info'

export function formErrors(error: unknown, codeFields: Record<string, string> = {}) {
  const apiError = toApiError(error)
  const fields: Record<string, string> = Object.fromEntries(
    apiError.fieldErrors.map((item) => [item.field, item.message])
  )
  const field = codeFields[apiError.code]
  if (field) fields[field] = apiError.message
  if (!Object.keys(fields).length) alerts.error(apiError.message)
  return fields
}

export const shortTime = (value: string | null) => value ?? '—'

export const rupees = (value: number) =>
  `₹${value.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`
