import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api/client'
import type { HostelStudent } from './api'

export type ExportableReport = 'occupancy' | 'attendance' | 'leaves' | 'fees' | 'discipline'

export interface ReportParams {
  hostel_id?: number
  from?: string
  to?: string
  top?: number
}

export type SnapshotParams = Pick<ReportParams, 'hostel_id' | 'top'>

export interface ReportPeriod {
  from: string
  to: string
  days: number
}

export interface ReportCount {
  key: string
  count: number
}

export interface ReportAmount {
  key: string
  count: number
  amount: number
}

export interface SummaryReport {
  period: ReportPeriod
  residents: number
  beds: number
  occupied_beds: number
  occupancy_percent: number | null
  attendance_percent: number | null
  open_leaves: number
  out_now: number
  late_returns: number
  outstanding_fees: number
  residents_with_dues: number
  open_complaints: number
  open_tickets: number
  discipline_cases: number
  sick_bay_now: number
  visitors_inside: number
}

export interface OccupancyCounts {
  rooms: number
  beds: number
  occupied: number
  vacant: number
  reserved: number
  blocked: number
  maintenance: number
  occupancy_percent: number | null
}

export interface OccupancyBlock extends OccupancyCounts {
  block_id: number | null
  block_name: string | null
}

export interface OccupancyHostel extends OccupancyCounts {
  hostel_id: number
  hostel_name: string
  blocks: OccupancyBlock[]
}

export interface OccupancyRoomType {
  room_type_id: number
  room_type_name: string
  rooms: number
  beds: number
  occupied: number
  occupancy_percent: number | null
}

export interface OccupancyReport {
  as_of: string
  totals: OccupancyCounts
  hostels: OccupancyHostel[]
  room_types: OccupancyRoomType[]
}

export interface AttendanceCounts {
  total: number
  present: number
  late: number
  absent: number
  away: number
  sick: number
  present_percent: number | null
}

export interface AttendanceSlot extends AttendanceCounts {
  slot: 'morning' | 'evening' | 'night'
}

export interface AttendanceDay {
  date: string
  roll_calls: number
  present: number
  absent: number
  present_percent: number | null
}

export interface ReportResident {
  admission_id: number
  student: HostelStudent
  hostel_name: string
}

export interface AttendanceResident extends ReportResident {
  absent: number
  late: number
  marked: number
}

export interface AttendanceReport {
  period: ReportPeriod
  totals: AttendanceCounts
  slots: AttendanceSlot[]
  days: AttendanceDay[]
  top_absentees: AttendanceResident[]
}

export interface LateResident extends ReportResident {
  late_returns: number
  total_late_minutes: number
  max_late_minutes: number
}

export interface LateReturns {
  count: number
  average_late_minutes: number | null
  max_late_minutes: number | null
  residents: LateResident[]
}

export interface LeavesReport {
  period: ReportPeriod
  total: number
  outings: number
  overnight_leaves: number
  parent_initiated: number
  warden_initiated: number
  office_initiated: number
  by_kind: ReportCount[]
  by_status: ReportCount[]
  by_source: ReportCount[]
  open_now: number
  out_now: number
  late_returns: LateReturns
}

export interface VisitDay {
  date: string
  visits: number
  people: number
  denied: number
}

export interface VisitorsReport {
  period: ReportPeriod
  visits: number
  people: number
  denied: number
  unknown_visitors: number
  inside_now: number
  average_visit_minutes: number | null
  by_relation: ReportCount[]
  by_day: VisitDay[]
}

export interface FeesTotals {
  billed: number
  collected: number
  outstanding: number
  collection_percent: number | null
  residents_with_dues: number
}

export interface FeesHostel extends FeesTotals {
  hostel_id: number
  hostel_name: string
  residents_billed: number
}

export interface FeesDeposits {
  billed: number
  held: number
  held_count: number
  settled: number
  settled_count: number
  deductions: number
  refunded: number
  unpaid: number
}

export interface FeesDueResident extends ReportResident {
  admission_status: string
  billed: number
  paid: number
  balance: number
}

export interface FeesReport {
  academic_year: string | null
  totals: FeesTotals
  hostels: FeesHostel[]
  deposits: FeesDeposits
  top_dues: FeesDueResident[]
}

export interface FinesSummary {
  count: number
  amount: number
  by_status: ReportAmount[]
}

export interface RepeatResident extends ReportResident {
  cases: number
  major_or_critical: number
  last_incident_on: string
  categories: string[]
}

export interface DisciplineReport {
  period: ReportPeriod
  total: number
  open: number
  by_category: ReportCount[]
  by_severity: ReportCount[]
  by_status: ReportCount[]
  by_month: ReportCount[]
  actions: ReportCount[]
  fines: FinesSummary
  repeat_residents: RepeatResident[]
}

export interface ComplaintsSummary {
  total: number
  open: number
  resolved: number
  by_category: ReportCount[]
  by_status: ReportCount[]
  average_resolution_hours: number | null
  sla_met_percent: number | null
  average_rating: number | null
  rated: number
}

export interface MaintenanceSummary {
  total: number
  open: number
  done: number
  by_category: ReportCount[]
  by_status: ReportCount[]
  total_cost: number
  average_days_to_done: number | null
  rooms_blocked_now: number
}

export interface ComplaintsReport {
  period: ReportPeriod
  complaints: ComplaintsSummary
  maintenance: MaintenanceSummary
}

export interface MessMeal {
  meal: 'breakfast' | 'lunch' | 'snacks' | 'dinner'
  ate: number
  skipped: number
  ate_percent: number | null
  skip_requests: number
  feedback_count: number
  feedback_average: number | null
}

export interface MessReport {
  period: ReportPeriod
  meals: MessMeal[]
  ate: number
  skipped: number
  feedback_count: number
  feedback_average: number | null
  meal_skips: number
  meal_skips_by_source: ReportCount[]
}

export interface DosesSummary {
  given: number
  missed: number
  refused: number
  given_percent: number | null
}

export interface HealthReport {
  period: ReportPeriod
  total_logs: number
  by_kind: ReportCount[]
  hospital_visits: number
  sick_bay_admissions: number
  average_sick_bay_hours: number | null
  sick_bay_now: number
  doses: DosesSummary
}

const BASE = '/admin/hostel/reports'

export const reportExportPath = (report: ExportableReport) => `${BASE}/${report}/export`

export const reportKeys = {
  all: ['hostel', 'reports'] as const,
  report: (report: string, params: ReportParams) => [...reportKeys.all, report, params] as const,
}

export const reportsApi = {
  summary: (p: ReportParams) => api.get<SummaryReport>(`${BASE}/summary`, { ...p }),
  occupancy: (p: SnapshotParams) => api.get<OccupancyReport>(`${BASE}/occupancy`, { ...p }),
  attendance: (p: ReportParams) => api.get<AttendanceReport>(`${BASE}/attendance`, { ...p }),
  leaves: (p: ReportParams) => api.get<LeavesReport>(`${BASE}/leaves`, { ...p }),
  visitors: (p: ReportParams) => api.get<VisitorsReport>(`${BASE}/visitors`, { ...p }),
  fees: (p: SnapshotParams) => api.get<FeesReport>(`${BASE}/fees`, { ...p }),
  discipline: (p: ReportParams) => api.get<DisciplineReport>(`${BASE}/discipline`, { ...p }),
  complaints: (p: ReportParams) => api.get<ComplaintsReport>(`${BASE}/complaints`, { ...p }),
  mess: (p: ReportParams) => api.get<MessReport>(`${BASE}/mess`, { ...p }),
  health: (p: ReportParams) => api.get<HealthReport>(`${BASE}/health`, { ...p }),
}

function useReport<T>(
  report: string,
  params: ReportParams,
  fetcher: (p: ReportParams) => Promise<T>,
  enabled: boolean
) {
  return useQuery({
    queryKey: reportKeys.report(report, params),
    queryFn: () => fetcher(params),
    placeholderData: keepPreviousData,
    enabled,
    meta: { silent: true },
  })
}

export function useSummaryReport(params: ReportParams, enabled = true) {
  return useReport('summary', params, reportsApi.summary, enabled)
}

export function useOccupancyReport(params: SnapshotParams, enabled = true) {
  return useReport('occupancy', params, reportsApi.occupancy, enabled)
}

export function useAttendanceReport(params: ReportParams, enabled = true) {
  return useReport('attendance', params, reportsApi.attendance, enabled)
}

export function useLeavesReport(params: ReportParams, enabled = true) {
  return useReport('leaves', params, reportsApi.leaves, enabled)
}

export function useVisitorsReport(params: ReportParams, enabled = true) {
  return useReport('visitors', params, reportsApi.visitors, enabled)
}

export function useFeesReport(params: SnapshotParams, enabled = true) {
  return useReport('fees', params, reportsApi.fees, enabled)
}

export function useDisciplineReport(params: ReportParams, enabled = true) {
  return useReport('discipline', params, reportsApi.discipline, enabled)
}

export function useComplaintsReport(params: ReportParams, enabled = true) {
  return useReport('complaints', params, reportsApi.complaints, enabled)
}

export function useMessReport(params: ReportParams, enabled = true) {
  return useReport('mess', params, reportsApi.mess, enabled)
}

export function useHealthReport(params: ReportParams, enabled = true) {
  return useReport('health', params, reportsApi.health, enabled)
}
