import type { BadgeTone } from '@/components/ui/badge'
import { config } from '@/config/env'
import type {
  AttendanceStatus,
  PunchSource,
  StaffAttendanceStatus,
  StaffBoardStatus,
  StaffLeaveStatus,
  StudentLeaveStatus,
} from './api'

export const ATTENDANCE_STATUS: Record<
  AttendanceStatus,
  { label: string; short: string; tone: BadgeTone }
> = {
  present: { label: 'Present', short: 'P', tone: 'success' },
  absent: { label: 'Absent', short: 'A', tone: 'danger' },
  late: { label: 'Late', short: 'L', tone: 'warning' },
  half_day: { label: 'Half day', short: 'HD', tone: 'info' },
  leave: { label: 'Leave', short: 'Leave', tone: 'neutral' },
  od: { label: 'On Duty', short: 'OD', tone: 'info' },
}

export const ATTENDANCE_STATUSES = Object.keys(ATTENDANCE_STATUS) as AttendanceStatus[]

export const STAFF_DAY_STATUS: Record<StaffBoardStatus, { label: string; tone: BadgeTone }> = {
  present: { label: 'Present', tone: 'success' },
  late: { label: 'Late', tone: 'warning' },
  half_day: { label: 'Half day', tone: 'info' },
  absent: { label: 'Absent', tone: 'danger' },
  on_leave: { label: 'On leave', tone: 'neutral' },
  not_checked_in: { label: 'Not checked in', tone: 'neutral' },
}

export const MANUAL_STATUSES: StaffAttendanceStatus[] = ['present', 'late', 'half_day', 'absent']

export const SOURCE_LABELS: Record<PunchSource, string> = {
  app: 'App',
  biometric: 'Biometric',
  manual: 'Manual',
}

export const STUDENT_LEAVE_STATUS: Record<StudentLeaveStatus, { label: string; tone: BadgeTone }> =
  {
    pending: { label: 'Waiting', tone: 'warning' },
    approved: { label: 'Approved', tone: 'success' },
    rejected: { label: 'Rejected', tone: 'danger' },
    cancelled: { label: 'Cancelled', tone: 'neutral' },
  }

export const STAFF_LEAVE_STATUS: Record<StaffLeaveStatus, { label: string; tone: BadgeTone }> = {
  pending_hod: { label: 'Waiting for HOD', tone: 'warning' },
  pending_principal: { label: 'Waiting for principal', tone: 'warning' },
  approved: { label: 'Approved', tone: 'success' },
  rejected: { label: 'Rejected', tone: 'danger' },
  cancelled: { label: 'Cancelled', tone: 'neutral' },
}

export const today = () => new Date().toLocaleDateString('en-CA', { timeZone: config.timeZone })

export const shiftDate = (date: string, days: number) => {
  const value = new Date(`${date}T00:00:00Z`)
  value.setUTCDate(value.getUTCDate() + days)
  return value.toISOString().slice(0, 10)
}

export const weekdayOf = (date: string) =>
  new Date(`${date}T00:00:00Z`).toLocaleDateString('en-IN', {
    weekday: 'long',
    timeZone: 'UTC',
  })

export const recentMonths = (count = 12) => {
  const [year, month] = today().split('-').map(Number)
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(Date.UTC(year, month - 1 - index, 1))
    return {
      value: date.toISOString().slice(0, 7),
      label: date.toLocaleDateString('en-IN', { month: 'long', year: 'numeric', timeZone: 'UTC' }),
    }
  })
}

const clock = new Intl.DateTimeFormat('en-GB', {
  timeZone: config.timeZone,
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
})

export const clockTime = (value: string | null) => (value ? clock.format(new Date(value)) : '')

export const toZonedIso = (date: string, time: string) => `${date}T${time}:00+05:30`

export const percentLabel = (value: number | null) => (value === null ? '—' : `${value}%`)

export const percentTone = (value: number | null): BadgeTone =>
  value === null ? 'neutral' : value >= 90 ? 'success' : value >= 75 ? 'warning' : 'danger'

export const dayOffText = (holiday: string | null) =>
  holiday
    ? `Holiday: ${holiday}. Attendance is not taken on this date.`
    : 'Not a school day. Attendance is not taken on this date.'

export const studentsText = (count: number) => `${count} ${count === 1 ? 'student' : 'students'}`
