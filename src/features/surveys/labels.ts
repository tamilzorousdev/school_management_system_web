import {
  AlignLeft,
  CalendarDays,
  CircleDot,
  Hash,
  ListChecks,
  Star,
  TextCursorInput,
  type LucideIcon,
} from 'lucide-react'
import type { BadgeTone } from '@/components/ui/badge'
import type { QuestionType, ResultRole, SurveyStatus } from './api'

export const STATUS: Record<SurveyStatus, { label: string; tone: BadgeTone }> = {
  draft: { label: 'Draft', tone: 'neutral' },
  scheduled: { label: 'Scheduled', tone: 'info' },
  open: { label: 'Open', tone: 'success' },
  closed: { label: 'Closed', tone: 'warning' },
}

export const STATUS_TABS: { value: SurveyStatus; label: string }[] = [
  { value: 'open', label: 'Open' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'draft', label: 'Drafts' },
  { value: 'closed', label: 'Closed' },
]

export const QUESTION_TYPES: Record<
  QuestionType,
  { label: string; hint: string; icon: LucideIcon }
> = {
  single_choice: { label: 'One choice', hint: 'Pick one option', icon: CircleDot },
  multi_choice: { label: 'Many choices', hint: 'Pick one or more options', icon: ListChecks },
  rating: { label: 'Rating', hint: '1 to 5 stars', icon: Star },
  short_text: { label: 'Short answer', hint: 'A few words', icon: TextCursorInput },
  long_text: { label: 'Long answer', hint: 'A paragraph', icon: AlignLeft },
  date: { label: 'Date', hint: 'A day on the calendar', icon: CalendarDays },
  number: { label: 'Number', hint: 'A whole or decimal number', icon: Hash },
}

export const QUESTION_TYPE_OPTIONS = (Object.keys(QUESTION_TYPES) as QuestionType[]).map(
  (value) => ({ value, label: QUESTION_TYPES[value].label, hint: QUESTION_TYPES[value].hint })
)

export const ROLE_OPTIONS: { value: ResultRole; label: string }[] = [
  { value: 'parent', label: 'Parents' },
  { value: 'staff', label: 'Staff' },
]

export const ROLE_LABEL: Record<'parent' | 'staff' | 'both', string> = {
  parent: 'Parent',
  staff: 'Staff',
  both: 'Parent and staff',
}

export const MIN_OPTIONS = 2
export const MAX_OPTIONS = 10

export const isChoice = (type: QuestionType) => type === 'single_choice' || type === 'multi_choice'

export const pct = (value: number | null | undefined) =>
  value === null || value === undefined ? '—' : `${value}%`

const pad = (value: number) => String(value).padStart(2, '0')

export function localParts(value: string | Date | null): { date: string; time: string } {
  if (!value) return { date: '', time: '' }
  const date = new Date(value)
  return {
    date: `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`,
    time: `${pad(date.getHours())}:${pad(date.getMinutes())}`,
  }
}

export function fromLocalParts(date: string, time: string): string | null {
  if (!date || !time) return null
  const local = new Date(`${date}T${time}:00`)
  if (Number.isNaN(local.getTime())) return null
  const minutes = -local.getTimezoneOffset()
  const sign = minutes >= 0 ? '+' : '-'
  return `${date}T${time}:00${sign}${pad(Math.trunc(Math.abs(minutes) / 60))}:${pad(Math.abs(minutes) % 60)}`
}

export function daysFromNow(days: number, hour = 18): Date {
  const date = new Date()
  date.setDate(date.getDate() + days)
  date.setHours(hour, 0, 0, 0)
  return date
}
