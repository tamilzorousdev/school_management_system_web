import type { BadgeTone } from '@/components/ui/badge'
import type { PickerAudience } from './audience'
import type {
  BroadcastState,
  BroadcastStatus,
  ExpiryUnit,
  DeliveryStatus,
  EmergencyCategory,
  EmergencySeverity,
} from './api'

export const CATEGORY_LABEL: Record<EmergencyCategory, string> = {
  weather: 'Weather',
  school_closed: 'School closed',
  security: 'Security',
  health: 'Health',
  transport: 'Transport',
  all_clear: 'All clear',
  other: 'Other',
}

export const SEVERITY: Record<EmergencySeverity, { label: string; tone: BadgeTone }> = {
  info: { label: 'Info', tone: 'info' },
  warning: { label: 'Warning', tone: 'warning' },
  critical: { label: 'Critical', tone: 'danger' },
}

export const BROADCAST_STATUS: Record<BroadcastStatus, { label: string; tone: BadgeTone }> = {
  pending_approval: { label: 'Waiting for approval', tone: 'warning' },
  scheduled: { label: 'Scheduled', tone: 'info' },
  sending: { label: 'Sending', tone: 'warning' },
  sent: { label: 'Sent', tone: 'success' },
  partly_failed: { label: 'Partly failed', tone: 'danger' },
  rejected: { label: 'Rejected', tone: 'danger' },
  cancelled: { label: 'Cancelled', tone: 'neutral' },
}

export const BROADCAST_STATE: Record<BroadcastState, { label: string; tone: BadgeTone }> = {
  pending_approval: { label: 'Waiting for approval', tone: 'warning' },
  scheduled: { label: 'Scheduled', tone: 'info' },
  active: { label: 'On screen', tone: 'success' },
  expired: { label: 'Expired', tone: 'neutral' },
  ended: { label: 'Ended', tone: 'neutral' },
  rejected: { label: 'Rejected', tone: 'danger' },
  cancelled: { label: 'Cancelled', tone: 'neutral' },
}

export const STATE_OPTIONS = (Object.keys(BROADCAST_STATE) as BroadcastState[]).map((value) => ({
  value,
  label: BROADCAST_STATE[value].label,
}))

export const EXPIRY_UNITS: { value: ExpiryUnit; label: string }[] = [
  { value: 'seconds', label: 'Seconds' },
  { value: 'minutes', label: 'Minutes' },
  { value: 'hours', label: 'Hours' },
  { value: 'days', label: 'Days' },
  { value: 'months', label: 'Months' },
  { value: 'years', label: 'Years' },
]

export const END_REASON_LABEL: Record<string, string> = {
  expired: 'Time ran out',
  ended: 'Ended by the school',
  all_clear: 'Ended by an all clear',
}

export const DELIVERY: Record<DeliveryStatus, { label: string; tone: BadgeTone }> = {
  pending: { label: 'Waiting', tone: 'neutral' },
  sending: { label: 'Sending', tone: 'warning' },
  sent: { label: 'Sent', tone: 'success' },
  failed: { label: 'Failed', tone: 'danger' },
  skipped: { label: 'Not sent', tone: 'neutral' },
  none: { label: '—', tone: 'neutral' },
}

export const AUDIENCE_OPTIONS: { value: PickerAudience; label: string }[] = [
  { value: 'everyone', label: 'Everyone' },
  { value: 'parents', label: 'All parents' },
  { value: 'staff', label: 'All staff' },
  { value: 'classes', label: 'Classes' },
  { value: 'sections', label: 'Sections' },
]
