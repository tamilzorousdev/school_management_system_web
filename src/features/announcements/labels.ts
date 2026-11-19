import type { BadgeTone } from '@/components/ui/badge'
import type { AnnouncementAudience, AnnouncementStatus } from './api'

export const ANNOUNCEMENT_STATUS: Record<AnnouncementStatus, { label: string; tone: BadgeTone }> = {
  draft: { label: 'Draft', tone: 'neutral' },
  scheduled: { label: 'Scheduled', tone: 'info' },
  published: { label: 'Published', tone: 'success' },
  archived: { label: 'Archived', tone: 'neutral' },
}

export const AUDIENCE_LABEL: Record<AnnouncementAudience, string> = {
  everyone: 'Everyone (parents and staff)',
  parents: 'All parents',
  staff: 'All staff',
  classes: 'Parents of chosen classes or sections',
  individuals: 'Chosen students and staff',
}

export const MAX_ATTACHMENTS = 5
export const ATTACHMENT_ACCEPT = 'application/pdf,image/jpeg,image/png,image/webp'
export const ATTACHMENT_TYPES = ATTACHMENT_ACCEPT.split(',')

export function toLocalInput(value: string | null): string {
  if (!value) return ''
  const date = new Date(value)
  const offset = date.getTimezoneOffset() * 60_000
  return new Date(date.getTime() - offset).toISOString().slice(0, 16)
}

export function fromLocalInput(value: string): string | null {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  const minutes = -date.getTimezoneOffset()
  const sign = minutes >= 0 ? '+' : '-'
  const pad = (n: number) => String(Math.abs(n)).padStart(2, '0')
  return `${value.length === 16 ? `${value}:00` : value}${sign}${pad(Math.trunc(minutes / 60))}:${pad(minutes % 60)}`
}
