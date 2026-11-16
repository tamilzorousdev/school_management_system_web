import type { BadgeTone } from '@/components/ui/badge'
import type {
  BroadcastStatus,
  DeliveryStatus,
  EmergencyAudience,
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
  sending: { label: 'Sending', tone: 'warning' },
  sent: { label: 'Sent', tone: 'success' },
  partly_failed: { label: 'Partly failed', tone: 'danger' },
}

export const DELIVERY: Record<DeliveryStatus, { label: string; tone: BadgeTone }> = {
  pending: { label: 'Waiting', tone: 'neutral' },
  sending: { label: 'Sending', tone: 'warning' },
  sent: { label: 'Sent', tone: 'success' },
  failed: { label: 'Failed', tone: 'danger' },
  skipped: { label: 'Not sent', tone: 'neutral' },
  none: { label: '—', tone: 'neutral' },
}

export const AUDIENCE_OPTIONS: { value: EmergencyAudience; label: string }[] = [
  { value: 'everyone', label: 'Everyone' },
  { value: 'parents', label: 'All parents' },
  { value: 'staff', label: 'All staff' },
  { value: 'classes', label: 'Classes' },
  { value: 'sections', label: 'Sections' },
]
