import type { DoseViewStatus, HealthKind, HealthStatus } from '../api-care'
import type { Tone } from '../labels'

export const HEALTH_KIND: Record<HealthKind, string> = {
  illness: 'Illness',
  injury: 'Injury',
  checkup: 'Check-up',
  sick_bay: 'Sick bay rest',
  other: 'Other',
}

export const HEALTH_STATUS: Record<HealthStatus, Tone> = {
  open: { label: 'Open', tone: 'warning' },
  closed: { label: 'Closed', tone: 'neutral' },
}

export const DOSE_STATUS: Record<DoseViewStatus, Tone> = {
  pending: { label: 'Due', tone: 'neutral' },
  given: { label: 'Given', tone: 'success' },
  missed: { label: 'Missed', tone: 'danger' },
  refused: { label: 'Refused', tone: 'warning' },
}

export const DOSE_BACK_DAYS = 2

export const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/

export const numberOrNull = (value: string) => {
  const text = value.trim()
  if (!text) return null
  const parsed = Number(text)
  return Number.isFinite(parsed) ? parsed : null
}
