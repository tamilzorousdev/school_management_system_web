import type { RosterRow, RosterStatus, StudyMark, SwapStatus } from '../api-duty'
import type { Tone } from '../labels'
import { shiftDate, timeLabel } from './leave-helpers'

export const ROSTER_STATUS: Record<RosterStatus, Tone> = {
  scheduled: { label: 'Not checked in', tone: 'neutral' },
  checked_in: { label: 'On duty', tone: 'info' },
  completed: { label: 'Completed', tone: 'success' },
  absent: { label: 'Absent', tone: 'danger' },
  swapped: { label: 'Swapped', tone: 'neutral' },
}

export const SWAP_STATUS: Record<SwapStatus, Tone> = {
  pending: { label: 'Waiting', tone: 'warning' },
  approved: { label: 'Approved', tone: 'success' },
  rejected: { label: 'Rejected', tone: 'danger' },
  cancelled: { label: 'Cancelled', tone: 'neutral' },
}

export const STUDY_MARK: Record<StudyMark, Tone> = {
  present: { label: 'Present', tone: 'success' },
  absent: { label: 'Absent', tone: 'danger' },
  late: { label: 'Late', tone: 'warning' },
  excused: { label: 'Excused', tone: 'info' },
}

export const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const

export const WEEKDAY_ORDER = [1, 2, 3, 4, 5, 6, 0] as const

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export const weekdayOf = (iso: string) => new Date(`${iso}T00:00:00Z`).getUTCDay()

export const weekStart = (iso: string) => shiftDate(iso, -((weekdayOf(iso) + 6) % 7))

export const datesBetween = (from: string, to: string) => {
  const dates: string[] = []
  for (let day = from; day <= to && dates.length < 400; day = shiftDate(day, 1)) dates.push(day)
  return dates
}

export const dayLabel = (iso: string) => {
  const date = new Date(`${iso}T00:00:00Z`)
  return `${WEEKDAYS[date.getUTCDay()]} ${date.getUTCDate()} ${MONTHS[date.getUTCMonth()]}`
}

export const shiftTime = (start: string, end: string) =>
  `${timeLabel(start.slice(0, 5))} – ${timeLabel(end.slice(0, 5))}`

export const daysText = (days: number[]) => {
  const set = new Set(days.map(Number))
  if (set.size === 7) return 'Every day'
  if (set.size === 5 && [1, 2, 3, 4, 5].every((day) => set.has(day))) return 'Mon – Fri'
  if (set.size === 6 && [1, 2, 3, 4, 5, 6].every((day) => set.has(day))) return 'Mon – Sat'
  return WEEKDAY_ORDER.filter((day) => set.has(day))
    .map((day) => WEEKDAYS[day])
    .join(', ')
}

export type CheckWindow = 'too_early' | 'open' | 'over'

export const CHECK_IN_EARLY_MINUTES = 30

export const checkWindow = (row: RosterRow, now: number): CheckWindow => {
  const start = new Date(row.shift_start_at).getTime()
  const end = new Date(row.shift_end_at).getTime()
  if (now < start - CHECK_IN_EARLY_MINUTES * 60000) return 'too_early'
  if (now > end) return 'over'
  return 'open'
}

export const checkInOpens = (start: string) => {
  const [hours, minutes] = start.slice(0, 5).split(':').map(Number)
  const total = (hours * 60 + minutes - CHECK_IN_EARLY_MINUTES + 1440) % 1440
  const pad = (value: number) => String(value).padStart(2, '0')
  return timeLabel(`${pad(Math.floor(total / 60))}:${pad(total % 60)}`)
}

export const percentTone = (percent: number) =>
  percent >= 90 ? 'success' : percent >= 75 ? 'warning' : 'danger'
