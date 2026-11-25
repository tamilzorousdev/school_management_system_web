import type { BadgeTone } from '@/components/ui/badge'
import { toApiError } from '@/lib/api/errors'
import type { SosCounts, SosEntry, SosKind, SosMark, SosStatus } from '../api-safety'
import type { Tone } from '../labels'

export const SOS_KIND: Record<SosKind, string> = {
  fire: 'Fire',
  medical: 'Medical emergency',
  security: 'Security threat',
  missing_student: 'Missing student',
  natural_disaster: 'Natural disaster',
  drill: 'Drill',
  other: 'Other',
}

export const SOS_STATUS: Record<SosStatus, Tone> = {
  open: { label: 'Open', tone: 'danger' },
  resolved: { label: 'Resolved', tone: 'success' },
  cancelled: { label: 'Cancelled', tone: 'neutral' },
}

export const SOS_MARK: Record<SosMark, Tone> = {
  safe: { label: 'Safe', tone: 'success' },
  missing: { label: 'Missing', tone: 'danger' },
  injured: { label: 'Injured', tone: 'warning' },
  away: { label: 'Away', tone: 'info' },
}

export const SOS_MARKS: SosMark[] = ['safe', 'missing', 'injured', 'away']

export const SOS_COUNT_KEYS: { key: keyof SosCounts; label: string; tone: BadgeTone }[] = [
  { key: 'safe', label: 'Safe', tone: 'success' },
  { key: 'missing', label: 'Missing', tone: 'danger' },
  { key: 'injured', label: 'Injured', tone: 'warning' },
  { key: 'away', label: 'Away', tone: 'info' },
  { key: 'unmarked', label: 'Not marked', tone: 'neutral' },
]

export const MARK_BATCH = 500

const SAFETY_ERRORS: Record<string, string> = {
  HOSTEL_SOS_CLOSED: 'This alert is already closed, so the headcount cannot change.',
  HOSTEL_NOT_RESIDENT:
    'Some of these students no longer stay in this hostel. Refresh the list and try again.',
  HOSTEL_SOS_NOT_FOUND: 'This alert no longer exists.',
  HOSTEL_NOT_FOUND: 'This hostel no longer exists.',
}

export const safetyErrorMessage = (error: unknown) => {
  const apiError = toApiError(error)
  return SAFETY_ERRORS[apiError.code] ?? apiError.message
}

export interface SosGroup {
  key: string
  title: string
  missing: boolean
  entries: SosEntry[]
}

export function groupEntries(entries: SosEntry[]) {
  const missing = entries.filter((entry) => entry.status === 'missing')
  const groups = new Map<string, SosGroup>()
  entries.forEach((entry) => {
    if (entry.status === 'missing') return
    const title =
      [entry.block_name, entry.room_no ? `Room ${entry.room_no}` : null]
        .filter(Boolean)
        .join(' · ') || 'No room'
    const group = groups.get(title) ?? { key: title, title, missing: false, entries: [] }
    group.entries.push(entry)
    groups.set(title, group)
  })
  const ordered = [...groups.values()]
  return missing.length
    ? [{ key: '__missing', title: 'Missing', missing: true, entries: missing }, ...ordered]
    : ordered
}

export const percentOf = (part: number, whole: number) =>
  whole > 0 ? Math.round((part / whole) * 100) : 0
