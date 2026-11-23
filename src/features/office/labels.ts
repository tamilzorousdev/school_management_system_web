import type { BadgeTone } from '@/components/ui/badge'
import type {
  AttendanceToday,
  PendingKind,
  SchoolBoard,
  SectionStudentFilter,
  TimelineType,
} from './api'

const rupeeFormat = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
})

export const rupees = (value: number | null | undefined) => rupeeFormat.format(value ?? 0)

export const percent = (value: number | null | undefined) =>
  value === null || value === undefined ? '—' : `${Number(value.toFixed(1))}%`

export const className = (name: string) => (/^\d+$/.test(name) ? `Class ${name}` : name)

export const gradeLabel = (grade: number) =>
  grade === -1 ? 'LKG' : grade === 0 ? 'UKG' : grade < -1 ? `Pre-KG ${grade}` : `Class ${grade}`

export const GRADE_OPTIONS = Array.from({ length: 14 }, (_, index) => index - 1).map((grade) => ({
  value: String(grade),
  label: gradeLabel(grade),
}))

export const BOARD_LABEL: Record<SchoolBoard, string> = {
  CBSE: 'CBSE',
  STATE: 'State board',
  ICSE: 'ICSE',
  OTHER: 'Other',
}

export const BOARD_OPTIONS = (Object.keys(BOARD_LABEL) as SchoolBoard[]).map((value) => ({
  value,
  label: BOARD_LABEL[value],
}))

export const attendanceLine = (attendance: AttendanceToday) =>
  attendance.sections_total
    ? `${attendance.sections_marked}/${attendance.sections_total} marked`
    : 'No sections'

export const attendanceTone = (attendance: AttendanceToday): BadgeTone =>
  !attendance.sections_total
    ? 'neutral'
    : attendance.sections_marked === attendance.sections_total
      ? 'success'
      : attendance.sections_marked === 0
        ? 'danger'
        : 'warning'

export const FILTER_OPTIONS: { value: SectionStudentFilter; label: string }[] = [
  { value: 'absent_today', label: 'Absent today' },
  { value: 'fee_due', label: 'Fee due' },
  { value: 'low_attendance', label: 'Low attendance' },
]

export const TODAY_STATUS: Record<string, { label: string; tone: BadgeTone }> = {
  present: { label: 'Present', tone: 'success' },
  absent: { label: 'Absent', tone: 'danger' },
  late: { label: 'Late', tone: 'warning' },
  half_day: { label: 'Half day', tone: 'warning' },
  leave: { label: 'Leave', tone: 'info' },
  od: { label: 'On duty', tone: 'info' },
}

export const STUDENT_FLAG: Record<string, { label: string; tone: BadgeTone }> = {
  fee_due: { label: 'Fee due', tone: 'warning' },
  low_attendance: { label: 'Low attendance', tone: 'danger' },
  health_alert: { label: 'Health alert', tone: 'danger' },
  pass_on_hold: { label: 'Bus pass on hold', tone: 'warning' },
}

export const flagTone = (code: string): BadgeTone => STUDENT_FLAG[code]?.tone ?? 'neutral'

export const AO_FLAG: Record<string, { label: string; tone: BadgeTone }> = {
  inactive: { label: 'Inactive', tone: 'neutral' },
  overdue_approvals: { label: 'Overdue approvals', tone: 'danger' },
  attendance_not_marked: { label: 'Attendance not marked', tone: 'warning' },
}

export const TIMELINE_LABEL: Record<TimelineType, string> = {
  admission: 'Admission',
  enrolment: 'Enrolment',
  attendance: 'Attendance',
  leave: 'Leave',
  fee_invoice: 'Fee invoice',
  fee_payment: 'Fee payment',
  exam: 'Exam',
  gate: 'Gate pass',
  behaviour: 'Behaviour',
  achievement: 'Achievement',
  transport: 'Transport',
  document: 'Document',
  library: 'Library',
}

export const TIMELINE_OPTIONS = (Object.keys(TIMELINE_LABEL) as TimelineType[]).map((value) => ({
  value,
  label: TIMELINE_LABEL[value],
}))

export const PENDING_LABEL: Record<PendingKind, string> = {
  gate_pass: 'Gate pass',
  fee_request: 'Fee request',
  student_leave: 'Student leave',
  grievance: 'Grievance',
}

export const DOCUMENT_STATUS: Record<string, { label: string; tone: BadgeTone }> = {
  verified: { label: 'Verified', tone: 'success' },
  pending: { label: 'Pending', tone: 'warning' },
  rejected: { label: 'Rejected', tone: 'danger' },
}

export const ageLabel = (hours: number) =>
  hours < 1 ? 'Under 1 h' : hours < 48 ? `${Math.round(hours)} h` : `${Math.floor(hours / 24)} d`
