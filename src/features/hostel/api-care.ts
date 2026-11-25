import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { api, type Paginated } from '@/lib/api/client'
import { hostelKeys, type Diet, type HostelStudent, type Order } from './api'

export type Meal = 'breakfast' | 'lunch' | 'snacks' | 'dinner'
export type MealMark = 'ate' | 'skipped'
export type MenuSource = 'override' | 'hostel_week' | 'school_week' | 'none'
export type SkipSource = 'parent' | 'warden'
export type SkipStatus = 'active' | 'cancelled'
export type FeedbackRole = 'parent' | 'staff'
export type HealthKind = 'illness' | 'injury' | 'checkup' | 'sick_bay' | 'other'
export type HealthStatus = 'open' | 'closed'
export type DoseStatus = 'given' | 'missed' | 'refused'
export type DoseViewStatus = 'pending' | DoseStatus
export type LaundryStatus = 'collected' | 'sent' | 'returned' | 'closed'

export interface MessMeal {
  meal: Meal
  items: string | null
  non_veg_items: string | null
  source: MenuSource
}

export interface MessWeekDay {
  day_of_week: number
  day_name: string
  meals: MessMeal[]
}

export interface MessWeek {
  hostel_id: number | null
  days: MessWeekDay[]
}

export interface MessMenuEntryInput {
  day_of_week: number
  meal: Meal
  items: string
  non_veg_items?: string | null
}

export interface MessMenuInput {
  hostel_id?: number
  entries: MessMenuEntryInput[]
}

export interface MessOverride {
  id: number
  hostel_id: number | null
  hostel_name: string | null
  menu_date: string
  meal: Meal
  items: string
  non_veg_items: string | null
  note: string | null
  created_at: string
}

export interface MessOverrideInput {
  hostel_id?: number
  menu_date: string
  meal: Meal
  items: string
  non_veg_items?: string | null
  note?: string | null
}

export interface MessDayMeal extends MessMeal {
  note: string | null
}

export interface MessDay {
  date: string
  day_of_week: number
  day_name: string
  hostel_id: number | null
  meals: MessDayMeal[]
}

export interface MessDietCount {
  veg: number
  non_veg: number
  eggetarian: number
}

export interface MessHeadcount {
  hostel_id: number
  date: string
  meal: Meal
  residents: number
  on_leave: number
  skipping: number
  expected: number
  by_diet: MessDietCount
  ate: number
  skipped: number
  unmarked: number
}

export interface MessAttendanceEntry {
  admission_id: number
  student: HostelStudent
  room_no: string | null
  bed_no: string | null
  diet: Diet
  status: MealMark | null
  method: 'manual' | 'qr' | null
  marked_at: string | null
  skip_id: number | null
  on_leave: boolean
}

export interface MessAttendanceCounts {
  total: number
  ate: number
  skipped: number
  unmarked: number
  on_leave: number
  skip_requested: number
}

export interface MessAttendanceSheet {
  hostel_id: number
  date: string
  meal: Meal
  counts: MessAttendanceCounts
  students: MessAttendanceEntry[]
}

export interface MessMarkInput {
  hostel_id: number
  date?: string
  meal: Meal
  entries: { admission_id: number; status: MealMark }[]
}

export interface MessScanInput {
  hostel_id: number
  meal: Meal
  qr: string
}

export interface MessScanResult {
  entry: MessAttendanceEntry
  already_marked: boolean
}

export interface MessSkip {
  id: number
  admission_id: number
  student: HostelStudent
  hostel_name: string
  from_date: string
  to_date: string
  meals: Meal[]
  reason: string | null
  source: SkipSource
  status: SkipStatus
  created_by_name: string | null
  created_at: string
}

export interface MessSkipInput {
  admission_id: number
  from_date: string
  to_date: string
  meals: Meal[]
  reason?: string | null
}

export interface MessFeedback {
  id: number
  hostel_id: number
  hostel_name: string
  admission_id: number | null
  student_name: string | null
  meal_date: string
  meal: Meal
  rating: number
  comment: string | null
  by_role: FeedbackRole
  created_by_name: string | null
  created_at: string
}

export interface MessMealRating {
  meal: Meal
  average: number | null
  count: number
  low: number
}

export interface MessFeedbackSummary {
  from: string
  to: string
  average: number | null
  count: number
  meals: MessMealRating[]
}

export interface HealthLog {
  id: number
  admission_id: number
  student: HostelStudent
  hostel_id: number
  hostel_name: string
  bed: string | null
  kind: HealthKind
  logged_at: string
  symptoms: string
  temperature: number | null
  action_taken: string | null
  doctor_name: string | null
  hospital_visit: boolean
  parent_informed: boolean
  status: HealthStatus
  in_sick_bay: boolean
  sick_bay_from: string | null
  sick_bay_to: string | null
  closed_at: string | null
  logged_by_name: string | null
  created_at: string
}

export interface HealthLogInput {
  admission_id: number
  kind: HealthKind
  logged_at?: string
  symptoms: string
  temperature?: number | null
  action_taken?: string | null
  doctor_name?: string | null
  hospital_visit?: boolean
  sick_bay?: boolean
  notify_parent?: boolean
}

export interface HealthLogPatchInput {
  kind?: HealthKind
  symptoms?: string
  temperature?: number | null
  action_taken?: string | null
  doctor_name?: string | null
  hospital_visit?: boolean
  sick_bay?: boolean
  notify_parent?: boolean
}

export interface HealthLogNoteInput {
  note?: string | null
  notify_parent?: boolean
}

export interface Medication {
  id: number
  admission_id: number
  student: HostelStudent
  hostel_name: string
  bed: string | null
  medicine: string
  dose: string
  times: string[]
  from_date: string
  to_date: string | null
  instructions: string | null
  prescribed_by: string | null
  active: boolean
  created_by_name: string | null
  created_at: string
}

export interface MedicationInput {
  admission_id: number
  medicine: string
  dose: string
  times: string[]
  from_date: string
  to_date?: string | null
  instructions?: string | null
  prescribed_by?: string | null
}

export interface MedicationDue {
  medication_id: number
  admission_id: number
  student: HostelStudent
  bed: string | null
  medicine: string
  dose: string
  instructions: string | null
  dose_date: string
  dose_time: string
  status: DoseViewStatus
  overdue: boolean
  note: string | null
  given_by_name: string | null
  given_at: string | null
}

export interface DoseInput {
  dose_date: string
  dose_time: string
  status: DoseStatus
  note?: string | null
}

export interface Dose {
  id: number
  medication_id: number
  admission_id: number
  dose_date: string
  dose_time: string
  status: DoseStatus
  note: string | null
  given_by_name: string | null
  given_at: string
}

export interface LaundryBatch {
  id: number
  batch_no: string
  hostel_id: number
  hostel_name: string
  collected_on: string
  vendor_name: string | null
  status: LaundryStatus
  sent_on: string | null
  returned_on: string | null
  notes: string | null
  students: number
  items_given: number
  items_returned: number | null
  items_missing: number
  created_by_name: string | null
  created_at: string
}

export interface LaundryItem {
  id: number
  admission_id: number
  student: HostelStudent
  bed: string | null
  items_given: number
  items_returned: number | null
  missing: number
  missing_note: string | null
}

export interface LaundryDetail extends LaundryBatch {
  items: LaundryItem[]
}

export interface LaundryItemInput {
  admission_id: number
  items_given: number
}

export interface LaundryInput {
  hostel_id: number
  collected_on?: string
  vendor_name?: string | null
  notes?: string | null
  items: LaundryItemInput[]
}

export interface LaundrySentInput {
  sent_on?: string
  vendor_name?: string | null
}

export interface LaundryReturnItemInput {
  admission_id: number
  items_returned: number
  missing_note?: string | null
}

export interface LaundryReturnInput {
  returned_on?: string
  items: LaundryReturnItemInput[]
}

export interface LaundryMissingRow {
  batch_id: number
  batch_no: string
  returned_on: string | null
  admission_id: number
  student: HostelStudent
  items_given: number
  items_returned: number
  missing: number
  missing_note: string | null
}

export interface LaundryMissing {
  from: string
  to: string
  batches: number
  items_given: number
  items_missing: number
  rows: LaundryMissingRow[]
}

interface CarePageParams {
  page: number
  limit: number
  search?: string
  sort?: string
  order?: Order
}

export interface MessSlotParams {
  hostel_id: number
  date?: string
  meal: Meal
}

export interface MessDayParams {
  date?: string
  hostel_id?: number
}

export interface MessOverrideParams {
  from?: string
  to?: string
  hostel_id?: number
}

export interface MessSkipListParams extends CarePageParams {
  hostel_id?: number
  admission_id?: number
  active?: boolean
}

export interface MessFeedbackListParams extends CarePageParams {
  hostel_id?: number
  meal?: Meal
  by_role?: FeedbackRole
  max_rating?: number
  from?: string
  to?: string
}

export interface MessFeedbackSummaryParams {
  hostel_id?: number
  from?: string
  to?: string
}

export interface HealthListParams extends CarePageParams {
  hostel_id?: number
  admission_id?: number
  status?: HealthStatus
  kind?: HealthKind
  in_sick_bay?: boolean
}

export interface MedicationListParams extends CarePageParams {
  hostel_id?: number
  admission_id?: number
  active?: boolean
}

export interface MedicationDueParams {
  hostel_id?: number
  date?: string
}

export interface LaundryListParams extends CarePageParams {
  hostel_id?: number
  status?: LaundryStatus
  admission_id?: number
}

export interface LaundryMissingParams {
  hostel_id?: number
  from?: string
  to?: string
}

const BASE = '/admin/hostel'
const root = [...hostelKeys.all, 'care'] as const

export const careKeys = {
  all: root,
  menu: (hostelId?: number) => [...root, 'menu', hostelId ?? null] as const,
  overrides: (params: MessOverrideParams) => [...root, 'overrides', params] as const,
  day: (params: MessDayParams) => [...root, 'day', params] as const,
  headcount: (params: MessSlotParams) => [...root, 'headcount', params] as const,
  attendance: (params: MessSlotParams) => [...root, 'attendance', params] as const,
  skips: (params: MessSkipListParams) => [...root, 'skips', params] as const,
  feedback: (params: MessFeedbackListParams) => [...root, 'feedback', params] as const,
  feedbackSummary: (params: MessFeedbackSummaryParams) =>
    [...root, 'feedback-summary', params] as const,
  healthLogs: (params: HealthListParams) => [...root, 'health', params] as const,
  healthLog: (id: number) => [...root, 'health-log', id] as const,
  medications: (params: MedicationListParams) => [...root, 'medications', params] as const,
  due: (params: MedicationDueParams) => [...root, 'due', params] as const,
  laundry: (params: LaundryListParams) => [...root, 'laundry', params] as const,
  laundryBatch: (id: number) => [...root, 'laundry-batch', id] as const,
  laundryMissing: (params: LaundryMissingParams) => [...root, 'laundry-missing', params] as const,
}

export const careApi = {
  menu: (hostelId?: number) => api.get<MessWeek>(`${BASE}/mess/menu`, { hostel_id: hostelId }),
  saveMenu: (input: MessMenuInput) => api.put<MessWeek>(`${BASE}/mess/menu`, input),
  overrides: (params: MessOverrideParams) =>
    api.get<MessOverride[]>(`${BASE}/mess/overrides`, { ...params }),
  addOverride: (input: MessOverrideInput) =>
    api.post<MessOverride>(`${BASE}/mess/overrides`, input),
  removeOverride: (id: number) => api.delete<null>(`${BASE}/mess/overrides/${id}`),
  day: (params: MessDayParams) => api.get<MessDay>(`${BASE}/mess/day`, { ...params }),
  headcount: (params: MessSlotParams) =>
    api.get<MessHeadcount>(`${BASE}/mess/headcount`, { ...params }),
  attendance: (params: MessSlotParams) =>
    api.get<MessAttendanceSheet>(`${BASE}/mess/attendance`, { ...params }),
  mark: (input: MessMarkInput) =>
    api.post<MessAttendanceSheet>(`${BASE}/mess/attendance/mark`, input),
  scan: (input: MessScanInput) => api.post<MessScanResult>(`${BASE}/mess/attendance/scan`, input),
  skips: (params: MessSkipListParams) =>
    api.get<Paginated<MessSkip>>(`${BASE}/mess/skips`, { ...params }),
  addSkip: (input: MessSkipInput) => api.post<MessSkip>(`${BASE}/mess/skips`, input),
  cancelSkip: (id: number) => api.post<MessSkip>(`${BASE}/mess/skips/${id}/cancel`),
  feedback: (params: MessFeedbackListParams) =>
    api.get<Paginated<MessFeedback>>(`${BASE}/mess/feedback`, { ...params }),
  feedbackSummary: (params: MessFeedbackSummaryParams) =>
    api.get<MessFeedbackSummary>(`${BASE}/mess/feedback/summary`, { ...params }),

  healthLogs: (params: HealthListParams) =>
    api.get<Paginated<HealthLog>>(`${BASE}/health`, { ...params }),
  healthLog: (id: number) => api.get<HealthLog>(`${BASE}/health/${id}`),
  createHealthLog: (input: HealthLogInput) => api.post<HealthLog>(`${BASE}/health`, input),
  patchHealthLog: (id: number, input: HealthLogPatchInput) =>
    api.patch<HealthLog>(`${BASE}/health/${id}`, input),
  discharge: (id: number, input: HealthLogNoteInput) =>
    api.post<HealthLog>(`${BASE}/health/${id}/discharge`, input),
  closeHealthLog: (id: number, input: HealthLogNoteInput) =>
    api.post<HealthLog>(`${BASE}/health/${id}/close`, input),
  medications: (params: MedicationListParams) =>
    api.get<Paginated<Medication>>(`${BASE}/medications`, { ...params }),
  due: (params: MedicationDueParams) =>
    api.get<MedicationDue[]>(`${BASE}/medications/due`, { ...params }),
  addMedication: (input: MedicationInput) => api.post<Medication>(`${BASE}/medications`, input),
  stopMedication: (id: number) => api.post<Medication>(`${BASE}/medications/${id}/stop`),
  recordDose: (id: number, input: DoseInput) =>
    api.post<Dose>(`${BASE}/medications/${id}/doses`, input),

  laundry: (params: LaundryListParams) =>
    api.get<Paginated<LaundryBatch>>(`${BASE}/laundry`, { ...params }),
  laundryMissing: (params: LaundryMissingParams) =>
    api.get<LaundryMissing>(`${BASE}/laundry/missing`, { ...params }),
  laundryBatch: (id: number) => api.get<LaundryDetail>(`${BASE}/laundry/${id}`),
  createLaundry: (input: LaundryInput) => api.post<LaundryDetail>(`${BASE}/laundry`, input),
  laundryItems: (id: number, items: LaundryItemInput[]) =>
    api.put<LaundryDetail>(`${BASE}/laundry/${id}/items`, { items }),
  laundrySent: (id: number, input: LaundrySentInput) =>
    api.post<LaundryDetail>(`${BASE}/laundry/${id}/sent`, input),
  laundryReturned: (id: number, input: LaundryReturnInput) =>
    api.post<LaundryDetail>(`${BASE}/laundry/${id}/returned`, input),
  closeLaundry: (id: number) => api.post<LaundryDetail>(`${BASE}/laundry/${id}/close`),
}

const validId = (id: number) => Number.isFinite(id) && id > 0

export function useMessMenu(hostelId?: number, enabled = true) {
  return useQuery({
    queryKey: careKeys.menu(hostelId),
    queryFn: () => careApi.menu(hostelId),
    enabled,
  })
}

export function useMessOverrides(params: MessOverrideParams, enabled = true) {
  return useQuery({
    queryKey: careKeys.overrides(params),
    queryFn: () => careApi.overrides(params),
    placeholderData: keepPreviousData,
    enabled,
  })
}

export function useMessDay(params: MessDayParams, enabled = true) {
  return useQuery({
    queryKey: careKeys.day(params),
    queryFn: () => careApi.day(params),
    placeholderData: keepPreviousData,
    enabled,
  })
}

export function useMessHeadcount(params: MessSlotParams, enabled = true) {
  return useQuery({
    queryKey: careKeys.headcount(params),
    queryFn: () => careApi.headcount(params),
    placeholderData: keepPreviousData,
    enabled: enabled && validId(params.hostel_id),
  })
}

export function useMessAttendance(params: MessSlotParams, enabled = true) {
  return useQuery({
    queryKey: careKeys.attendance(params),
    queryFn: () => careApi.attendance(params),
    placeholderData: keepPreviousData,
    enabled: enabled && validId(params.hostel_id),
  })
}

export function useMessSkips(params: MessSkipListParams, enabled = true) {
  return useQuery({
    queryKey: careKeys.skips(params),
    queryFn: () => careApi.skips(params),
    placeholderData: keepPreviousData,
    enabled,
  })
}

export function useMessFeedback(params: MessFeedbackListParams, enabled = true) {
  return useQuery({
    queryKey: careKeys.feedback(params),
    queryFn: () => careApi.feedback(params),
    placeholderData: keepPreviousData,
    enabled,
  })
}

export function useMessFeedbackSummary(params: MessFeedbackSummaryParams, enabled = true) {
  return useQuery({
    queryKey: careKeys.feedbackSummary(params),
    queryFn: () => careApi.feedbackSummary(params),
    placeholderData: keepPreviousData,
    enabled,
  })
}

export function useHealthLogs(params: HealthListParams, enabled = true) {
  return useQuery({
    queryKey: careKeys.healthLogs(params),
    queryFn: () => careApi.healthLogs(params),
    placeholderData: keepPreviousData,
    enabled,
  })
}

export function useHealthLog(id: number) {
  return useQuery({
    queryKey: careKeys.healthLog(id),
    queryFn: () => careApi.healthLog(id),
    enabled: validId(id),
  })
}

export function useMedications(params: MedicationListParams, enabled = true) {
  return useQuery({
    queryKey: careKeys.medications(params),
    queryFn: () => careApi.medications(params),
    placeholderData: keepPreviousData,
    enabled,
  })
}

export function useMedicationsDue(params: MedicationDueParams, enabled = true) {
  return useQuery({
    queryKey: careKeys.due(params),
    queryFn: () => careApi.due(params),
    placeholderData: keepPreviousData,
    enabled,
  })
}

export function useLaundryBatches(params: LaundryListParams, enabled = true) {
  return useQuery({
    queryKey: careKeys.laundry(params),
    queryFn: () => careApi.laundry(params),
    placeholderData: keepPreviousData,
    enabled,
  })
}

export function useLaundryBatch(id: number) {
  return useQuery({
    queryKey: careKeys.laundryBatch(id),
    queryFn: () => careApi.laundryBatch(id),
    enabled: validId(id),
  })
}

export function useLaundryMissing(params: LaundryMissingParams, enabled = true) {
  return useQuery({
    queryKey: careKeys.laundryMissing(params),
    queryFn: () => careApi.laundryMissing(params),
    placeholderData: keepPreviousData,
    enabled,
  })
}
