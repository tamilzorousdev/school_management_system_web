import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { api, type Paginated } from '@/lib/api/client'
import type { HostelStudent, Order } from './api'

export type RosterStatus = 'scheduled' | 'checked_in' | 'completed' | 'absent' | 'swapped'
export type SwapStatus = 'pending' | 'approved' | 'rejected' | 'cancelled'
export type StudyMark = 'present' | 'absent' | 'late' | 'excused'
export type HallStatus = 'open' | 'closed'

export interface DutyShift {
  id: number
  name: string
  start_time: string
  end_time: string
  is_night: boolean
  crosses_midnight: boolean
  active: boolean
}

export interface DutyShiftInput {
  name: string
  start_time: string
  end_time: string
  is_night?: boolean
  active?: boolean
}

export interface RosterRow {
  id: number
  hostel_id: number
  hostel_name: string
  block_id: number | null
  block_name: string | null
  duty_date: string
  shift_id: number
  shift_name: string
  start_time: string
  end_time: string
  is_night: boolean
  user_id: number
  user_name: string
  user_mobile: string | null
  note: string | null
  status: RosterStatus
  shift_start_at: string
  shift_end_at: string
  check_in_at: string | null
  check_out_at: string | null
  late_minutes: number | null
  running_late: boolean
  swap_pending: boolean
}

export interface RosterEntryInput {
  hostel_id: number
  block_id?: number | null
  duty_date: string
  shift_id: number
  user_id: number
  note?: string | null
}

export interface RosterParams {
  hostel_id?: number
  user_id?: number
  from?: string
  to?: string
}

export interface DateRange {
  from?: string
  to?: string
}

export interface Swap {
  id: number
  roster_id: number
  duty_date: string
  shift_name: string
  start_time: string
  end_time: string
  hostel_name: string
  from_user_id: number
  from_user_name: string
  to_user_id: number
  to_user_name: string
  reason: string | null
  status: SwapStatus
  decided_by_name: string | null
  decided_at: string | null
  created_at: string
}

export interface SwapInput {
  to_user_id: number
  reason?: string | null
}

export interface SwapListParams {
  page: number
  limit: number
  status?: SwapStatus
  mine?: boolean
  sort?: string
  order?: Order
}

export interface NightRound {
  id: number
  hostel_id: number
  hostel_name: string
  block_id: number | null
  block_name: string | null
  user_id: number
  user_name: string
  round_at: string
  all_ok: boolean
  issues: string | null
}

export interface NightRoundInput {
  hostel_id: number
  block_id?: number | null
  all_ok: boolean
  issues?: string | null
}

export interface RoundParams {
  hostel_id?: number
  date?: string
}

export interface DutyReportParams {
  hostel_id?: number
  from?: string
  to?: string
}

export interface DutyReportRow {
  user_id: number
  user_name: string
  scheduled: number
  attended: number
  late: number
  absent: number
  average_late_minutes: number
}

export interface StudySchedule {
  id: number
  hostel_id: number
  hostel_name: string
  block_id: number | null
  block_name: string | null
  hall_id: number | null
  hall_name: string | null
  name: string
  days: number[]
  start_time: string
  end_time: string
  supervisor_user_id: number | null
  supervisor_name: string | null
  active: boolean
}

export interface StudyScheduleInput {
  hostel_id: number
  block_id?: number | null
  hall_id?: number | null
  name: string
  days: number[]
  start_time: string
  end_time: string
  supervisor_user_id?: number | null
  active?: boolean
}

export type StudySchedulePatch = Partial<Omit<StudyScheduleInput, 'hostel_id'>>

export interface StudyScheduleParams {
  hostel_id?: number
  active?: boolean
}

export interface StudyCounts {
  total: number
  marked: number
  unmarked: number
  present: number
  absent: number
  late: number
  excused: number
}

export interface StudyToday extends StudySchedule {
  date: string
  counts: StudyCounts
}

export interface StudySheetParams {
  schedule_id: number
  date?: string
}

export interface StudySheetEntry {
  admission_id: number
  student: HostelStudent
  block_name: string | null
  room_no: string | null
  bed_no: string | null
  seat_no: string | null
  status: StudyMark | null
  suggested_status: StudyMark | null
  note: string | null
  marked_at: string | null
}

export interface StudySheet {
  schedule: StudySchedule
  date: string
  runs_on_date: boolean
  counts: StudyCounts
  students: StudySheetEntry[]
}

export interface StudyMarkInput {
  schedule_id: number
  date?: string
  entries: { admission_id: number; status: StudyMark; note?: string | null }[]
}

export interface StudyReportParams {
  page: number
  limit: number
  search?: string
  sort?: string
  order?: Order
  hostel_id?: number
  from?: string
  to?: string
}

export interface StudyReportRow {
  admission_id: number
  student: HostelStudent
  hostel_name: string
  sessions: number
  present: number
  late: number
  absent: number
  excused: number
  percent: number
}

export interface StudyHistoryItem {
  date: string
  schedule_id: number
  schedule_name: string
  start_time: string
  end_time: string
  status: StudyMark
  note: string | null
  marked_at: string
}

export interface StudyHall {
  id: number
  hostel_id: number
  hostel_name: string
  name: string
  location: string | null
  capacity: number
  supervisor_user_id: number | null
  supervisor_name: string | null
  status: HallStatus
  notes: string | null
  seats_active: number
  seats_taken: number
  seats_free: number
}

export interface StudyHallInput {
  hostel_id: number
  name: string
  location?: string | null
  capacity: number
  supervisor_user_id?: number | null
  status?: HallStatus
  notes?: string | null
}

export type StudyHallPatch = Partial<Omit<StudyHallInput, 'hostel_id'>>

export interface Seat {
  id: number
  seat_no: string
  active: boolean
  allocation_id: number | null
  admission_id: number | null
  student: HostelStudent | null
  since: string | null
}

export interface SeatMap {
  hall: StudyHall
  seats: Seat[]
}

export interface SeatAllocateInput {
  seat_id: number
  admission_id: number
}

export interface AutoAssignInput {
  admission_ids?: number[]
  block_id?: number
}

export interface AutoAssignResult {
  assigned: { admission_id: number; student_name: string; seat_id: number; seat_no: string }[]
  skipped: { admission_id: number; student_name: string | null; reason: string }[]
}

const BASE = '/admin/hostel'

export const dutyKeys = {
  all: ['hostel', 'duty'] as const,
  shifts: (active?: boolean) => [...dutyKeys.all, 'shifts', active ?? null] as const,
  roster: (params: RosterParams) => [...dutyKeys.all, 'roster', params] as const,
  today: (hostelId?: number) => [...dutyKeys.all, 'today', hostelId ?? null] as const,
  mine: (params: DateRange) => [...dutyKeys.all, 'mine', params] as const,
  swaps: (params: SwapListParams) => [...dutyKeys.all, 'swaps', params] as const,
  rounds: (params: RoundParams) => [...dutyKeys.all, 'rounds', params] as const,
  report: (params: DutyReportParams) => [...dutyKeys.all, 'report', params] as const,
}

export const studyKeys = {
  all: ['hostel', 'study'] as const,
  schedules: (params: StudyScheduleParams) => [...studyKeys.all, 'schedules', params] as const,
  today: (hostelId?: number) => [...studyKeys.all, 'today', hostelId ?? null] as const,
  sheet: (params: StudySheetParams) => [...studyKeys.all, 'sheet', params] as const,
  report: (params: StudyReportParams) => [...studyKeys.all, 'report', params] as const,
  history: (admissionId: number, params: DateRange) =>
    [...studyKeys.all, 'history', admissionId, params] as const,
  halls: (hostelId?: number) => [...studyKeys.all, 'halls', hostelId ?? null] as const,
  seats: (hallId: number) => [...studyKeys.all, 'seats', hallId] as const,
}

export const dutyApi = {
  shifts: (active?: boolean) => api.get<DutyShift[]>(`${BASE}/duty/shifts`, { active }),
  createShift: (input: DutyShiftInput) => api.post<DutyShift>(`${BASE}/duty/shifts`, input),
  updateShift: (id: number, input: Partial<DutyShiftInput>) =>
    api.patch<DutyShift>(`${BASE}/duty/shifts/${id}`, input),
  removeShift: (id: number) => api.delete<unknown>(`${BASE}/duty/shifts/${id}`),
  roster: (params: RosterParams) => api.get<RosterRow[]>(`${BASE}/duty/roster`, { ...params }),
  addRoster: (entries: RosterEntryInput[]) =>
    api.post<RosterRow[]>(`${BASE}/duty/roster`, { entries }),
  removeDuty: (id: number) => api.delete<unknown>(`${BASE}/duty/roster/${id}`),
  markAbsent: (id: number) => api.post<RosterRow>(`${BASE}/duty/roster/${id}/absent`),
  today: (hostelId?: number) => api.get<RosterRow[]>(`${BASE}/duty/today`, { hostel_id: hostelId }),
  mine: (params: DateRange) => api.get<RosterRow[]>(`${BASE}/duty/mine`, { ...params }),
  checkIn: (id: number) => api.post<RosterRow>(`${BASE}/duty/roster/${id}/check-in`),
  checkOut: (id: number) => api.post<RosterRow>(`${BASE}/duty/roster/${id}/check-out`),
  requestSwap: (id: number, input: SwapInput) =>
    api.post<Swap>(`${BASE}/duty/roster/${id}/swap`, input),
  swaps: (params: SwapListParams) => api.get<Paginated<Swap>>(`${BASE}/duty/swaps`, { ...params }),
  approveSwap: (id: number) => api.post<Swap>(`${BASE}/duty/swaps/${id}/approve`),
  rejectSwap: (id: number) => api.post<Swap>(`${BASE}/duty/swaps/${id}/reject`),
  cancelSwap: (id: number) => api.post<Swap>(`${BASE}/duty/swaps/${id}/cancel`),
  addRound: (input: NightRoundInput) => api.post<NightRound>(`${BASE}/duty/rounds`, input),
  rounds: (params: RoundParams) => api.get<NightRound[]>(`${BASE}/duty/rounds`, { ...params }),
  report: (params: DutyReportParams) =>
    api.get<DutyReportRow[]>(`${BASE}/duty/report`, { ...params }),
}

export const studyApi = {
  schedules: (params: StudyScheduleParams) =>
    api.get<StudySchedule[]>(`${BASE}/study/schedules`, { ...params }),
  createSchedule: (input: StudyScheduleInput) =>
    api.post<StudySchedule>(`${BASE}/study/schedules`, input),
  updateSchedule: (id: number, input: StudySchedulePatch) =>
    api.patch<StudySchedule>(`${BASE}/study/schedules/${id}`, input),
  removeSchedule: (id: number) => api.delete<unknown>(`${BASE}/study/schedules/${id}`),
  today: (hostelId?: number) =>
    api.get<StudyToday[]>(`${BASE}/study/today`, { hostel_id: hostelId }),
  sheet: (params: StudySheetParams) => api.get<StudySheet>(`${BASE}/study/sheet`, { ...params }),
  mark: (input: StudyMarkInput) => api.post<StudySheet>(`${BASE}/study/mark`, input),
  report: (params: StudyReportParams) =>
    api.get<Paginated<StudyReportRow>>(`${BASE}/study/report`, { ...params }),
  history: (admissionId: number, params: DateRange) =>
    api.get<StudyHistoryItem[]>(`${BASE}/admissions/${admissionId}/study`, { ...params }),
  halls: (hostelId?: number) =>
    api.get<StudyHall[]>(`${BASE}/study/halls`, { hostel_id: hostelId }),
  createHall: (input: StudyHallInput) => api.post<StudyHall>(`${BASE}/study/halls`, input),
  updateHall: (id: number, input: StudyHallPatch) =>
    api.patch<StudyHall>(`${BASE}/study/halls/${id}`, input),
  removeHall: (id: number) => api.delete<unknown>(`${BASE}/study/halls/${id}`),
  seats: (hallId: number) => api.get<SeatMap>(`${BASE}/study/halls/${hallId}/seats`),
  allocate: (hallId: number, input: SeatAllocateInput) =>
    api.post<SeatMap>(`${BASE}/study/halls/${hallId}/allocate`, input),
  release: (allocationId: number) =>
    api.post<SeatMap>(`${BASE}/study/seat-allocations/${allocationId}/release`),
  autoAssign: (hallId: number, input: AutoAssignInput) =>
    api.post<AutoAssignResult>(`${BASE}/study/halls/${hallId}/auto-assign`, input),
}

const validId = (id: number) => Number.isFinite(id) && id > 0

export function useDutyShifts(active?: boolean, enabled = true) {
  return useQuery({
    queryKey: dutyKeys.shifts(active),
    queryFn: () => dutyApi.shifts(active),
    enabled,
  })
}

export function useRoster(params: RosterParams, enabled = true) {
  return useQuery({
    queryKey: dutyKeys.roster(params),
    queryFn: () => dutyApi.roster(params),
    placeholderData: keepPreviousData,
    enabled,
  })
}

export function useDutyToday(hostelId?: number, enabled = true) {
  return useQuery({
    queryKey: dutyKeys.today(hostelId),
    queryFn: () => dutyApi.today(hostelId),
    placeholderData: keepPreviousData,
    enabled,
  })
}

export function useMyDuties(params: DateRange = {}, enabled = true) {
  return useQuery({
    queryKey: dutyKeys.mine(params),
    queryFn: () => dutyApi.mine(params),
    enabled,
  })
}

export function useSwaps(params: SwapListParams, enabled = true) {
  return useQuery({
    queryKey: dutyKeys.swaps(params),
    queryFn: () => dutyApi.swaps(params),
    placeholderData: keepPreviousData,
    enabled,
  })
}

export function useRounds(params: RoundParams, enabled = true) {
  return useQuery({
    queryKey: dutyKeys.rounds(params),
    queryFn: () => dutyApi.rounds(params),
    placeholderData: keepPreviousData,
    enabled,
  })
}

export function useDutyReport(params: DutyReportParams, enabled = true) {
  return useQuery({
    queryKey: dutyKeys.report(params),
    queryFn: () => dutyApi.report(params),
    placeholderData: keepPreviousData,
    enabled,
  })
}

export function useStudySchedules(params: StudyScheduleParams, enabled = true) {
  return useQuery({
    queryKey: studyKeys.schedules(params),
    queryFn: () => studyApi.schedules(params),
    placeholderData: keepPreviousData,
    enabled,
  })
}

export function useStudyToday(hostelId?: number, enabled = true) {
  return useQuery({
    queryKey: studyKeys.today(hostelId),
    queryFn: () => studyApi.today(hostelId),
    placeholderData: keepPreviousData,
    enabled,
  })
}

export function useStudySheet(params: StudySheetParams, enabled = true) {
  return useQuery({
    queryKey: studyKeys.sheet(params),
    queryFn: () => studyApi.sheet(params),
    enabled: enabled && validId(params.schedule_id),
  })
}

export function useStudyReport(params: StudyReportParams, enabled = true) {
  return useQuery({
    queryKey: studyKeys.report(params),
    queryFn: () => studyApi.report(params),
    placeholderData: keepPreviousData,
    enabled,
  })
}

export function useStudyHistory(admissionId: number, params: DateRange = {}, enabled = true) {
  return useQuery({
    queryKey: studyKeys.history(admissionId, params),
    queryFn: () => studyApi.history(admissionId, params),
    enabled: enabled && validId(admissionId),
  })
}

export function useStudyHalls(hostelId?: number, enabled = true) {
  return useQuery({
    queryKey: studyKeys.halls(hostelId),
    queryFn: () => studyApi.halls(hostelId),
    enabled,
  })
}

export function useSeatMap(hallId: number, enabled = true) {
  return useQuery({
    queryKey: studyKeys.seats(hallId),
    queryFn: () => studyApi.seats(hallId),
    enabled: enabled && validId(hallId),
  })
}
