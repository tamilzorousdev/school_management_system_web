import type { BadgeTone } from '@/components/ui/badge'
import type { MeetingParty, MeetingResponse, MeetingStatus } from './api'

export const MEETING_RESPONSE: Record<MeetingResponse, { label: string; tone: BadgeTone }> = {
  pending: { label: 'Reply pending', tone: 'neutral' },
  accepted: { label: 'Accepted', tone: 'success' },
  declined: { label: 'Declined', tone: 'danger' },
}

export const MEETING_STATUS: Record<MeetingStatus, { label: string; tone: BadgeTone }> = {
  scheduled: { label: 'Scheduled', tone: 'info' },
  in_progress: { label: 'In progress', tone: 'success' },
  time_exceeded: { label: 'Over time', tone: 'warning' },
  completed: { label: 'Completed', tone: 'neutral' },
  missed: { label: 'Missed', tone: 'warning' },
  cancelled: { label: 'Cancelled', tone: 'danger' },
}

export const isLive = (status: MeetingStatus) =>
  status === 'in_progress' || status === 'time_exceeded'

export const END_REASON: Record<'host_ended' | 'empty' | 'time_up', string> = {
  host_ended: 'Ended by the teacher',
  empty: 'Closed after everyone left',
  time_up: 'Closed when the time was up',
}

export const LEAVE_REASON: Record<string, string> = {
  left: 'left',
  rejoined: 'rejoined',
  meeting_ended: 'meeting ended',
  network: 'network drop',
  timeout: 'connection timed out',
  token_expired: 'token expired',
  removed: 'removed',
}

export const PARTY_LABEL: Record<MeetingParty, string> = {
  teacher: 'Teacher',
  parent: 'Parent',
}

export function durationLabel(minutes: number | null) {
  if (minutes === null) return '—'
  if (minutes < 60) return `${minutes} min`
  return `${Math.floor(minutes / 60)} h ${minutes % 60} min`
}
