import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, type Paginated } from '@/lib/api/client'
import { downloadFile } from '@/lib/files'

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'half_day' | 'leave' | 'od'
export type StudentLeaveStatus = 'pending' | 'approved' | 'rejected' | 'cancelled'
export type StaffAttendanceStatus = 'present' | 'late' | 'half_day' | 'absent'
export type StaffBoardStatus = StaffAttendanceStatus | 'on_leave' | 'not_checked_in'
export type PunchSource = 'app' | 'biometric' | 'manual'
export type StaffLeaveStatus =
  'pending_hod' | 'pending_principal' | 'approved' | 'rejected' | 'cancelled'
export type Decision = 'approved' | 'rejected'

export interface Ref {
  id: number
  name: string
}

export interface AttendanceSummary {
  total: number
  present: number
  absent: number
  late: number
  half_day: number
  leave: number
  od?: number
  percent: number | null
}

export type AttendanceSessionName = 'morning' | 'afternoon'
export type AttendanceMode = 'session' | 'period'

export interface AttendanceSlot {
  session: AttendanceSessionName
  period?: number
}

const ORDINAL_ENDINGS: Record<number, string> = { 1: 'st', 2: 'nd', 3: 'rd' }

export const ordinal = (value: number) =>
  `${value}${value % 100 >= 11 && value % 100 <= 13 ? 'th' : (ORDINAL_ENDINGS[value % 10] ?? 'th')}`

export const slotParams = (slot: AttendanceSlot) =>
  slot.period ? { period: slot.period } : { session: slot.session }

export const slotKey = (slot: AttendanceSlot) => (slot.period ? `p${slot.period}` : slot.session)

export function slotText(
  mode: AttendanceMode | undefined,
  slot: { session: AttendanceSessionName; period?: number }
) {
  if (mode === 'period' && slot.period) return `${ordinal(slot.period)} period`
  return slot.session === 'morning' ? 'Morning (1st period)' : 'Afternoon (5th period)'
}

export interface BoardSection extends AttendanceSummary {
  section_id: number
  name: string
  class_teacher: string | null
  class_teacher_id: number | null
  marked: boolean
  missed: boolean
  holiday: string | null
  morning_marked: boolean
  afternoon_marked: boolean
  taken_by: string | null
  taken_at: string | null
}

export interface AttendanceBoard {
  date: string
  mode: AttendanceMode
  session: AttendanceSessionName
  period: number
  working_day: boolean
  holiday: string | null
  summary: AttendanceSummary
  sections_total: number
  sections_not_marked: number
  sections_missed: number
  opens_at: string | null
  closes_at: string | null
  grace_minutes: number
  below_75: number
  leave_pending: number
  sections: BoardSection[]
}

export interface MissedSession {
  date: string
  session: AttendanceSessionName
  period: number
  section_id: number
  section: string
  still_not_marked: boolean
}

export interface MissedTeacher {
  teacher_id: number | null
  teacher: string
  missed: number
  sessions: MissedSession[]
}

export interface MissedReport {
  month: string
  grace_minutes: number
  total_missed: number
  teachers: MissedTeacher[]
}

export interface RosterStudent {
  student_id: number
  full_name: string
  admission_no: string
  roll_no: number | null
  status: AttendanceStatus
  remarks: string | null
  on_leave: boolean
  on_duty?: boolean
  od_reason?: string | null
}

export interface Roster {
  section: Ref
  date: string
  mode: AttendanceMode
  session: AttendanceSessionName
  period: number
  open: boolean
  opens_at: string | null
  working_day: boolean
  holiday: string | null
  marked: boolean
  taken_by: Ref | null
  taken_at: string | null
  summary: AttendanceSummary
  students: RosterStudent[]
}

export interface MarkItem {
  student_id: number
  status: AttendanceStatus
  remarks?: string | null
}

export interface MarkInput {
  date: string
  session: AttendanceSessionName
  period?: number
  subject_id?: number | null
  items: MarkItem[]
}

export interface SectionReportRow {
  student_id: number
  full_name: string
  roll_no: number | null
  present: number
  absent: number
  late: number
  half_day: number
  leave: number
  percent: number | null
}

export interface SectionReport {
  month: string
  working_days: number
  marked_days: number
  students: SectionReportRow[]
}

export interface ClassReportSection {
  section_id: number
  name: string
  students: number
  marked_days: number
  percent: number | null
  below_75: number
}

export interface ClassReport {
  month: string
  class: Ref
  working_days: number
  students: number
  percent: number | null
  below_75: number
  sections: ClassReportSection[]
}

export interface StudentLeave {
  id: number
  student: Ref
  class_section: string | null
  from_date: string
  to_date: string
  days: number
  half_day: 'morning' | 'afternoon' | null
  reason: string
  file_id: number | null
  status: StudentLeaveStatus
  requested_by: Ref | null
  decided_by: Ref | null
  decided_at: string | null
  decision_note: string | null
  created_at: string
}

export interface StaffDay {
  date: string
  status: StaffBoardStatus
  check_in_at: string | null
  check_out_at: string | null
  check_in_distance_m: number | null
  source: PunchSource | null
  remarks: string | null
}

export interface StaffBoardRow extends StaffDay {
  user_id: number
  staff_id: number
  name: string
  designation: string
  department: string | null
}

export interface StaffBoard {
  date: string
  reporting_time: string
  total: number
  present: number
  late: number
  on_leave: number
  not_checked_in: number
  staff: StaffBoardRow[]
  page: number
  limit: number
  filtered_total: number
  total_pages: number
  has_next: boolean
}

export interface StaffBoardParams {
  date: string
  page?: number
  limit?: number
  search?: string
  status?: StaffBoardStatus
}

export interface BulkSkip {
  id: number
  name: string
  reason: string
}

export interface BulkStaffInput {
  date: string
  user_ids?: number[]
  all_not_checked_in?: boolean
  status: StaffAttendanceStatus
  check_in_at?: string | null
  check_out_at?: string | null
  remarks?: string | null
}

export interface BulkStaffResult {
  date: string
  marked: number
  skipped: BulkSkip[]
}

export interface BulkSectionInput {
  date: string
  session: AttendanceSessionName
  period?: number
  section_ids?: number[]
  status: AttendanceStatus
  remarks?: string | null
  overwrite?: boolean
}

export interface BulkSectionResult {
  date: string
  marked: number
  students: number
  skipped: BulkSkip[]
}

export interface ManualMarkInput {
  date: string
  status: StaffAttendanceStatus
  check_in_at?: string | null
  check_out_at?: string | null
  remarks: string
}

export interface LeaveType {
  id: number
  code: string
  name: string
  days_per_year: number
  is_paid: boolean
  is_active: boolean
}

export interface LeaveBalance {
  leave_type: LeaveType
  allowed: number | null
  used: number
  pending: number
  remaining: number | null
}

export interface StaffLeave {
  id: number
  staff: Ref
  department: string | null
  leave_type: LeaveType
  from_date: string
  to_date: string
  half_day: boolean
  days: number
  reason: string
  status: StaffLeaveStatus
  hod: Ref | null
  hod_note: string | null
  principal: Ref | null
  principal_note: string | null
  created_at: string
}

export interface LeaveListParams {
  page: number
  limit: number
  search?: string
  section_id?: number
  user_id?: number
}

export interface StudentLeaveParams extends LeaveListParams {
  status?: StudentLeaveStatus
}

export interface StaffLeaveParams extends LeaveListParams {
  status?: StaffLeaveStatus | 'waiting'
}

export interface DecisionInput {
  status: Decision
  note?: string | null
}

export const attendanceKeys = {
  all: ['attendance'] as const,
  board: (date: string, slot: AttendanceSlot = { session: 'morning' }) =>
    [...attendanceKeys.all, 'board', date, slotKey(slot)] as const,
  roster: (sectionId: number, date: string, slot: AttendanceSlot) =>
    [...attendanceKeys.all, 'roster', sectionId, date, slotKey(slot)] as const,
  classReport: (classId: number, month: string) =>
    [...attendanceKeys.all, 'class-report', classId, month] as const,
  report: (sectionId: number, month: string) =>
    [...attendanceKeys.all, 'report', sectionId, month] as const,
  missed: (month: string) => [...attendanceKeys.all, 'missed', month] as const,
  studentLeaves: (params: StudentLeaveParams) =>
    [...attendanceKeys.all, 'student-leaves', params] as const,
  staffBoard: (params: StaffBoardParams) => [...attendanceKeys.all, 'staff-board', params] as const,
  staffLeaves: (params: StaffLeaveParams) =>
    [...attendanceKeys.all, 'staff-leaves', params] as const,
  balances: (userId: number) => [...attendanceKeys.all, 'balances', userId] as const,
}

export const attendanceApi = {
  board: (date: string, slot: AttendanceSlot = { session: 'morning' }) =>
    api.get<AttendanceBoard>('/admin/attendance/board', { date, ...slotParams(slot) }),
  roster: (sectionId: number, date: string, slot: AttendanceSlot) =>
    api.get<Roster>(`/admin/attendance/sections/${sectionId}`, { date, ...slotParams(slot) }),
  classReport: (classId: number, month: string) =>
    api.get<ClassReport>(`/admin/attendance/classes/${classId}/report`, { month }),
  missed: (month: string) => api.get<MissedReport>('/admin/attendance/missed', { month }),
  downloadSectionReport: (sectionId: number, month: string, name: string) =>
    downloadFile(
      `/admin/attendance/sections/${sectionId}/report/xlsx`,
      `Attendance-${name}-${month}.xlsx`,
      {
        month,
      }
    ),
  downloadClassReport: (classId: number, month: string, name: string) =>
    downloadFile(
      `/admin/attendance/classes/${classId}/report/xlsx`,
      `Attendance-Class-${name}-${month}.xlsx`,
      {
        month,
      }
    ),
  mark: (sectionId: number, input: MarkInput) =>
    api.put<Roster>(`/admin/attendance/sections/${sectionId}`, input),
  report: (sectionId: number, month: string) =>
    api.get<SectionReport>(`/admin/attendance/sections/${sectionId}/report`, { month }),
  studentLeaves: (params: StudentLeaveParams) =>
    api.get<Paginated<StudentLeave>>('/admin/student-leaves', { ...params }),
  decideStudentLeave: (id: number, input: DecisionInput) =>
    api.post<StudentLeave>(`/admin/student-leaves/${id}/decision`, input),
  staffBoard: (params: StaffBoardParams) =>
    api.get<StaffBoard>('/admin/staff-attendance/board', { ...params }),
  bulkStaff: (input: BulkStaffInput) =>
    api.put<BulkStaffResult>('/admin/staff-attendance/bulk', input),
  bulkSections: (input: BulkSectionInput) =>
    api.put<BulkSectionResult>('/admin/attendance/bulk', input),
  correctStaff: (userId: number, input: ManualMarkInput) =>
    api.put<StaffDay>(`/admin/staff-attendance/${userId}`, input),
  staffLeaves: (params: StaffLeaveParams) =>
    api.get<Paginated<StaffLeave>>('/admin/staff-leaves', { ...params }),
  balances: (userId: number) => api.get<LeaveBalance[]>(`/admin/staff-leaves/balances/${userId}`),
  decideStaffLeave: (id: number, input: DecisionInput) =>
    api.post<StaffLeave>(`/admin/staff-leaves/${id}/decision`, input),
}

export function useAttendanceBoard(date: string, slot: AttendanceSlot = { session: 'morning' }) {
  return useQuery({
    queryKey: attendanceKeys.board(date, slot),
    queryFn: () => attendanceApi.board(date, slot),
    placeholderData: keepPreviousData,
  })
}

export function useMissedReport(month: string, enabled: boolean) {
  return useQuery({
    queryKey: attendanceKeys.missed(month),
    queryFn: () => attendanceApi.missed(month),
    enabled,
    placeholderData: keepPreviousData,
  })
}

export function useClassReport(classId: number | undefined, month: string) {
  return useQuery({
    queryKey: attendanceKeys.classReport(classId ?? 0, month),
    queryFn: () => attendanceApi.classReport(classId!, month),
    enabled: Boolean(classId),
    placeholderData: keepPreviousData,
  })
}

export function useRoster(sectionId: number | null, date: string, slot: AttendanceSlot) {
  return useQuery({
    queryKey: attendanceKeys.roster(sectionId ?? 0, date, slot),
    queryFn: () => attendanceApi.roster(sectionId!, date, slot),
    enabled: Boolean(sectionId),
    staleTime: 0,
  })
}

export function useSectionReport(sectionId: number | null, month: string, enabled = true) {
  return useQuery({
    queryKey: attendanceKeys.report(sectionId ?? 0, month),
    queryFn: () => attendanceApi.report(sectionId!, month),
    enabled: Boolean(sectionId) && enabled,
    placeholderData: keepPreviousData,
  })
}

export function useStudentLeaves(params: StudentLeaveParams) {
  return useQuery({
    queryKey: attendanceKeys.studentLeaves(params),
    queryFn: () => attendanceApi.studentLeaves(params),
    placeholderData: keepPreviousData,
  })
}

export function useStaffBoard(params: StaffBoardParams) {
  return useQuery({
    queryKey: attendanceKeys.staffBoard(params),
    queryFn: () => attendanceApi.staffBoard(params),
    placeholderData: keepPreviousData,
  })
}

export function useStaffLeaves(params: StaffLeaveParams) {
  return useQuery({
    queryKey: attendanceKeys.staffLeaves(params),
    queryFn: () => attendanceApi.staffLeaves(params),
    placeholderData: keepPreviousData,
  })
}

export function useLeaveBalances(userId: number | null) {
  return useQuery({
    queryKey: attendanceKeys.balances(userId ?? 0),
    queryFn: () => attendanceApi.balances(userId!),
    enabled: Boolean(userId),
    meta: { silent: true },
  })
}

export function useAttendanceMutation<TInput, TResult>(fn: (input: TInput) => Promise<TResult>) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: fn,
    meta: { silent: true },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: attendanceKeys.all })
    },
  })
}
