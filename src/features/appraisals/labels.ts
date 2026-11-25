import type { BadgeTone } from '@/components/ui/badge'
import type {
  AutoMetric,
  CycleStatus,
  IncrementBands,
  KraCategory,
  Rating,
  Recommendation,
  Stage,
  StaffTypeRule,
} from './api'

export const STAGE: Record<Stage, { label: string; tone: BadgeTone }> = {
  self_pending: { label: 'Self-appraisal', tone: 'neutral' },
  hod_pending: { label: 'With HOD', tone: 'info' },
  principal_pending: { label: 'With Principal', tone: 'warning' },
  published: { label: 'Published', tone: 'success' },
  appealed: { label: 'Appealed', tone: 'danger' },
  completed: { label: 'Completed', tone: 'success' },
}

export const STAGE_OPTIONS = (Object.keys(STAGE) as Stage[]).map((value) => ({
  value,
  label: STAGE[value].label,
}))

export const CYCLE_STATUS: Record<CycleStatus, { label: string; tone: BadgeTone }> = {
  draft: { label: 'Draft', tone: 'neutral' },
  scheduled: { label: 'Scheduled', tone: 'info' },
  open: { label: 'Open', tone: 'success' },
  closed: { label: 'Closed', tone: 'warning' },
}

export const RATING: Record<Rating, { label: string; tone: BadgeTone; from: number }> = {
  outstanding: { label: 'Outstanding', tone: 'success', from: 92 },
  exceeds_expectations: { label: 'Exceeds expectations', tone: 'info', from: 76 },
  meets_expectations: { label: 'Meets expectations', tone: 'neutral', from: 60 },
  needs_improvement: { label: 'Needs improvement', tone: 'warning', from: 40 },
  unsatisfactory: { label: 'Unsatisfactory', tone: 'danger', from: 0 },
}

export const RATINGS = Object.keys(RATING) as Rating[]

export const RECOMMENDATION: Record<Recommendation, string> = {
  increment: 'Increment',
  promotion: 'Promotion',
  retention: 'Retention bonus',
  pip: 'Improvement plan (PIP)',
}

export const CATEGORY: Record<KraCategory, string> = {
  academics: 'Academics',
  pedagogy: 'Teaching',
  administrative: 'Administration',
  extracurricular: 'Activities',
  general: 'General',
}

export const METRIC: Record<AutoMetric, { label: string; unit: string; target: number }> = {
  attendance_percent: { label: 'Attendance %', unit: '%', target: 100 },
  exam_pass_percent: { label: 'Exam pass % of my classes', unit: '%', target: 100 },
  parent_rating: { label: 'Average parent rating', unit: '★', target: 5 },
  parent_good_behaviour_percent: { label: 'Parents marking behaviour good', unit: '%', target: 100 },
  homework_count: { label: 'Homework given', unit: '', target: 60 },
  driver_rating: { label: 'Average driver rating', unit: '★', target: 5 },
}

export const STAFF_TYPE: Record<StaffTypeRule, string> = {
  teaching: 'Teaching',
  non_teaching: 'Non-teaching',
}

export const ROLE_OPTIONS = [
  'TEACHER',
  'HOD',
  'PRINCIPAL',
  'AO',
  'ACCOUNTANT',
  'LIBRARIAN',
  'DRIVER',
  'ATTENDANT',
  'TRANSPORT_INCHARGE',
  'GATE_INCHARGE',
  'STORE_KEEPER',
].map((code) => ({ value: code, label: code.charAt(0) + code.slice(1).toLowerCase().replace(/_/g, ' ') }))

export const DEFAULT_BANDS: IncrementBands = {
  outstanding: 12,
  exceeds_expectations: 10,
  meets_expectations: 7,
  needs_improvement: 3,
  unsatisfactory: 0,
}

export const pct = (value: number | null | undefined) => (value === null || value === undefined ? '—' : `${value}%`)

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

export const fieldMap = (errors: { field: string; message: string }[]) =>
  Object.fromEntries(errors.map((error) => [error.field, error.message]))
