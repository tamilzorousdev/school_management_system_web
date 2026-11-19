import type { BadgeTone } from '@/components/ui/badge'
import type { EventStatus, ResponseFilter, SchoolEvent } from './api'

export const EVENT_STATUS: Record<EventStatus, { label: string; tone: BadgeTone }> = {
  draft: { label: 'Draft', tone: 'neutral' },
  published: { label: 'Published', tone: 'success' },
  cancelled: { label: 'Cancelled', tone: 'danger' },
}

export const RESPONSE_LABEL: Record<ResponseFilter, { label: string; tone: BadgeTone }> = {
  attending: { label: 'Attending', tone: 'success' },
  maybe: { label: 'Maybe', tone: 'warning' },
  not_attending: { label: 'Not attending', tone: 'danger' },
  no_response: { label: 'No reply', tone: 'neutral' },
}

export function eventTime(event: Pick<SchoolEvent, 'start_time' | 'end_time'>): string {
  if (!event.start_time) return 'All day'
  return event.end_time ? `${event.start_time} – ${event.end_time}` : event.start_time
}
