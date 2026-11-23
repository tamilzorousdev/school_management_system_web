import {
  keepPreviousData,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { api, http, type ApiEnvelope, type Paginated } from '@/lib/api/client'

export interface IdName {
  id: number
  name: string
}

export type SchoolBoard = 'CBSE' | 'STATE' | 'ICSE' | 'OTHER'
export type SectionStudentFilter = 'all' | 'absent_today' | 'fee_due' | 'low_attendance'
export type SectionStudentSort = 'roll_no' | 'name' | 'attendance' | 'fee_due' | 'last_exam'
export type TimelineType =
  | 'admission'
  | 'enrolment'
  | 'attendance'
  | 'leave'
  | 'fee_invoice'
  | 'fee_payment'
  | 'exam'
  | 'gate'
  | 'behaviour'
  | 'achievement'
  | 'transport'
  | 'document'
  | 'library'
export type PendingKind = 'gate_pass' | 'fee_request' | 'student_leave' | 'grievance'

export interface OfficeMe {
  is_limited: boolean
  is_head_ao: boolean
  can_monitor: boolean
  wings: IdName[]
  today: string
}

export interface AttendanceToday {
  sections_marked: number
  sections_total: number
  present: number
  absent: number
  percent: number | null
}

interface CountsBlock {
  class_count: number
  section_count: number
  student_count: number
  boys: number
  girls: number
  attendance: AttendanceToday
  fee_due: number
  pending_gate_passes: number
}

export interface WingCard extends CountsBlock {
  id: number
  name: string
  range_label: string
  board: SchoolBoard | null
  aos: IdName[]
}

export interface OfficeWings {
  wings: WingCard[]
  unassigned_classes: IdName[]
}

export interface ClassCard {
  id: number
  name: string
  grade_level: number
  section_count: number
  student_count: number
  boys: number
  girls: number
  class_teachers: string[]
  attendance: AttendanceToday
  fee_due: number
  pending_gate_passes: number
  last_exam_average: number | null
}

export interface WingClasses {
  wing: IdName
  classes: ClassCard[]
}

export interface Topper {
  student_id: number
  name: string
  percent: number
  rank: number
}

export interface SectionCard {
  id: number
  name: string
  class_section: string
  class_teacher: IdName | null
  student_count: number
  boys: number
  girls: number
  attendance: AttendanceToday
  fee_defaulters: number
  fee_due: number
  pending_gate_passes: number
  last_exam: IdName | null
  last_exam_average: number | null
  toppers: Topper[]
}

export interface ClassSections {
  class: IdName
  wing: IdName | null
  sections: SectionCard[]
}

export interface TransportRef {
  route: string
  stop: string | null
  pass_status: string | null
}

export interface SectionStudent {
  id: number
  name: string
  admission_no: string
  roll_no: number | null
  gender: string | null
  photo_url: string | null
  today: string | null
  attendance_percent: number | null
  fee_due: number
  fee_status: 'paid' | 'due' | 'none'
  last_exam_percent: number | null
  rank: number | null
  transport: TransportRef | null
  flags: string[]
}

export interface SectionStudents extends Paginated<SectionStudent> {
  section: SectionCard
}

export interface Flag {
  code: string
  label: string
}

export interface GuardianRef {
  id: number
  name: string
  relation: string | null
  mobile: string | null
  is_primary: boolean
  can_pickup: boolean
}

export interface StudentBasics {
  id: number
  name: string
  admission_no: string
  photo_url: string | null
  dob: string | null
  gender: string | null
  blood_group: string | null
  admission_date: string | null
  status: string
  house: string | null
  address: string | null
}

export interface CurrentPlacement {
  academic_year: string
  class_id: number
  section_id: number
  class_section: string
  roll_no: number | null
  class_teacher: IdName | null
  wing: IdName | null
}

export interface AttendanceSummary {
  days: number
  present: number
  absent: number
  late: number
  leave: number
  half_day: number
  percent: number | null
}

export interface FeeSummary {
  total: number
  paid: number
  balance: number
  overdue: number
  invoices: number
}

export interface ExamLine {
  exam_id: number
  exam_name: string
  total: number
  max_total: number
  percent: number | null
  grade: string | null
  result: string | null
  section_rank: number | null
  section_size: number
  class_rank: number | null
  class_size: number
}

export interface YearLine {
  academic_year: string
  class_section: string
  roll_no: number | null
  status: string
}

export interface StudentCounts {
  behaviour_notes: number
  achievements: number
  gate_passes: number
  documents: number
  library_books_out: number
  leave_requests: number
}

export interface HealthBrief {
  allergies: string | null
  conditions: string | null
  medications: string | null
  last_checkup_on: string | null
}

export interface Student360 {
  student: StudentBasics
  current: CurrentPlacement | null
  guardians: GuardianRef[]
  transport: TransportRef | null
  flags: Flag[]
  attendance: AttendanceSummary
  fees: FeeSummary
  exams: ExamLine[]
  years: YearLine[]
  counts: StudentCounts
  health: HealthBrief | null
  report_card_pdf_path: string | null
}

export interface TimelineItem {
  at: string
  type: TimelineType
  title: string
  detail: string | null
  ref_id: number | null
}

export interface WingInput {
  name: string
  from_grade: number
  to_grade: number
  class_ids?: number[] | null
  board?: SchoolBoard | null
  sort_order?: number
}

export interface AoWingInput {
  wing_id: number
  valid_from?: string | null
  valid_to?: string | null
  note?: string | null
}

export interface WingAo {
  id: number
  name: string
  valid_from: string | null
  valid_to: string | null
}

export interface WingSetup {
  id: number
  name: string
  from_grade: number
  to_grade: number
  class_ids: number[] | null
  board: SchoolBoard | null
  sort_order: number
  range_label: string
  classes: IdName[]
  aos: WingAo[]
}

export interface SetupClass {
  id: number
  name: string
  grade_level: number
  wing_id: number | null
}

export interface AoWingLink {
  wing_id: number
  name: string
  valid_from: string | null
  valid_to: string | null
  active: boolean
  note: string | null
}

export interface SetupAo {
  id: number
  name: string
  mobile: string
  wings: AoWingLink[]
  is_head: boolean
}

export interface WingSetupPage {
  wings: WingSetup[]
  classes: SetupClass[]
  aos: SetupAo[]
}

export interface PendingCounts {
  gate_passes: number
  fee_requests: number
  leave_requests: number
  grievances: number
  total: number
  overdue: number
}

export interface AoCard {
  user: IdName
  mobile: string
  wings: IdName[]
  is_head: boolean
  last_active_at: string | null
  inactive: boolean
  pending: PendingCounts
  fees_collected_today: number
  fees_collected_month: number
  fee_due: number
  attendance: AttendanceToday
  flags: string[]
}

export interface MonitorSummary {
  pending: PendingCounts
  fees_today: number
  fees_month: number
  attendance: AttendanceToday
  open_grievances: number
  unassigned_wings: IdName[]
}

export interface Monitor {
  summary: MonitorSummary
  aos: AoCard[]
}

export interface PendingItem {
  kind: PendingKind
  id: number
  title: string
  student: string | null
  class_section: string | null
  created_at: string
  age_hours: number
  overdue: boolean
}

export interface ActivityItem {
  at: string
  kind: string
  title: string
  detail: string | null
}

export interface AoDetail {
  card: AoCard
  pending: PendingItem[]
  activity: ActivityItem[]
}

export interface RemindResult {
  pending: number
  message: string
}

export interface Defaulter {
  student_id: number
  name: string
  class_section: string | null
  due: number
}

export interface DashboardFees {
  collected_today: number
  collected_month: number
  due: number
  defaulters: number
  top_defaulters: Defaulter[]
}

export interface ClassExam {
  class_id: number
  class_name: string
  exam: IdName
  average: number
  toppers: Topper[]
}

export interface DashboardAlerts {
  low_attendance: number
  passes_on_hold: number
  health_alerts: number
}

export interface OdStudent {
  id: number
  student_id: number
  name: string
  class_section: string | null
  sport_name: string
  title: string
  from_date: string
  to_date: string
  session: string | null
  venue: string | null
}

export interface OdToday {
  count: number
  students: OdStudent[]
}

export interface TeachersToday {
  total: number
  present: number
  late: number
  on_leave: number
  not_checked_in: number
}

export interface NotBoarded {
  student_id: number
  name: string
  class_section: string | null
  route: string
}

export interface BusesToday {
  buses: number
  reached: number
  running: number
  not_started: number
  late: number
  students: number
  not_boarded: NotBoarded[]
}

export type MyCheckInStatus =
  'present' | 'late' | 'half_day' | 'absent' | 'on_leave' | 'not_checked_in'

export interface MyCheckIn {
  date: string
  status: MyCheckInStatus
  check_in_at: string | null
  check_out_at: string | null
  check_in_distance_m: number | null
  source: string | null
  remarks: string | null
  reporting_time: string
  geofence_radius_m: number
  school_latitude: number | null
  school_longitude: number | null
  geofence_ready: boolean
  can_check_in: boolean
  can_check_out: boolean
}

export interface CheckInLocation {
  lat: number
  lng: number
  accuracy_m?: number
}

export interface OfficeDashboard {
  me: OfficeMe
  attendance: AttendanceToday
  students: number
  staff_on_leave: number
  fees: DashboardFees
  pending: PendingCounts
  pending_items: PendingItem[]
  exams: ClassExam[]
  alerts: DashboardAlerts
  aos: AoCard[] | null
  od_today: OdToday
  teachers: TeachersToday
  buses: BusesToday
}

export interface StudentDocument {
  id: number
  type: string
  title: string
  status: string
  remarks: string | null
  created_at: string
  verified_at: string | null
  mime_type: string | null
  url: string | null
  thumbnail_url: string | null
}

export interface SectionStudentParams {
  page?: number
  limit?: number
  search?: string
  filter?: SectionStudentFilter
  sort?: SectionStudentSort
  order?: 'asc' | 'desc'
}

const base = '/admin/office'
const silent = { silent: true }

export const officeKeys = {
  all: ['office'] as const,
  me: () => [...officeKeys.all, 'me'] as const,
  dashboard: () => [...officeKeys.all, 'dashboard'] as const,
  checkIn: () => [...officeKeys.all, 'check-in'] as const,
  wings: () => [...officeKeys.all, 'wings'] as const,
  wingClasses: (id: number) => [...officeKeys.all, 'wing', id] as const,
  classSections: (id: number) => [...officeKeys.all, 'class', id] as const,
  sectionStudents: (id: number, params: SectionStudentParams) =>
    [...officeKeys.all, 'section', id, params] as const,
  student: (id: number) => [...officeKeys.all, 'student', id] as const,
  documents: (id: number) => [...officeKeys.all, 'student', id, 'documents'] as const,
  timeline: (id: number, type?: TimelineType) =>
    [...officeKeys.all, 'student', id, 'timeline', type ?? 'all'] as const,
  setup: () => [...officeKeys.all, 'setup'] as const,
  monitor: () => [...officeKeys.all, 'monitor'] as const,
  ao: (id: number) => [...officeKeys.all, 'monitor', 'ao', id] as const,
}

export const officeApi = {
  me: () => api.get<OfficeMe>(`${base}/me`),
  dashboard: () => api.get<OfficeDashboard>(`${base}/dashboard`),
  myCheckIn: () => api.get<MyCheckIn>('/me/staff/check-in'),
  checkIn: (location: CheckInLocation) => api.post<MyCheckIn>('/me/staff/check-in', location),
  checkOut: (location: CheckInLocation) => api.post<MyCheckIn>('/me/staff/check-out', location),
  wings: () => api.get<OfficeWings>(`${base}/wings`),
  wingClasses: (id: number) => api.get<WingClasses>(`${base}/wings/${id}/classes`),
  classSections: (id: number) => api.get<ClassSections>(`${base}/classes/${id}/sections`),
  sectionStudents: (id: number, params: SectionStudentParams) =>
    api.get<SectionStudents>(`${base}/sections/${id}/students`, { ...params }),
  student: (id: number) => api.get<Student360>(`${base}/students/${id}`),
  documents: (id: number) => api.get<StudentDocument[]>(`${base}/students/${id}/documents`),
  timeline: (id: number, params: { type?: TimelineType; page?: number; limit?: number }) =>
    api.get<Paginated<TimelineItem>>(`${base}/students/${id}/timeline`, { ...params }),
  setup: () => api.get<WingSetupPage>(`${base}/wing-setup`),
  addWing: (input: WingInput) => api.post<WingSetupPage>(`${base}/wing-setup/wings`, input),
  updateWing: (id: number, input: Partial<WingInput>) =>
    api.patch<WingSetupPage>(`${base}/wing-setup/wings/${id}`, input),
  removeWing: (id: number) => api.delete<WingSetupPage>(`${base}/wing-setup/wings/${id}`),
  setAoWings: (userId: number, wings: AoWingInput[]) =>
    api.put<WingSetupPage>(`${base}/wing-setup/aos/${userId}`, { wings }),
  monitor: () => api.get<Monitor>(`${base}/monitor`),
  aoDetail: (userId: number) => api.get<AoDetail>(`${base}/monitor/aos/${userId}`),
  remind: (userId: number) =>
    http
      .post<ApiEnvelope<{ pending: number }>>(`${base}/monitor/aos/${userId}/remind`)
      .then(({ data }): RemindResult => ({ ...data.data, message: data.message })),
}

export function useOfficeMe(enabled = true) {
  return useQuery({
    queryKey: officeKeys.me(),
    queryFn: officeApi.me,
    enabled,
    staleTime: 60_000,
    meta: { silent: true },
  })
}

export function useOfficeDashboard() {
  return useQuery({
    meta: silent,
    queryKey: officeKeys.dashboard(),
    queryFn: officeApi.dashboard,
  })
}

export function useMyCheckIn() {
  return useQuery({
    meta: silent,
    queryKey: officeKeys.checkIn(),
    queryFn: officeApi.myCheckIn,
    retry: false,
    staleTime: 30_000,
  })
}

export function useStudentDocuments(id: number) {
  return useQuery({
    meta: silent,
    queryKey: officeKeys.documents(id),
    queryFn: () => officeApi.documents(id),
  })
}

export function useOfficeWings() {
  return useQuery({
    meta: silent,
    queryKey: officeKeys.wings(),
    queryFn: officeApi.wings,
  })
}

export function useWingClasses(id: number | undefined) {
  return useQuery({
    meta: silent,
    queryKey: officeKeys.wingClasses(id ?? 0),
    queryFn: () => officeApi.wingClasses(id ?? 0),
    enabled: Boolean(id),
  })
}

export function useClassSections(id: number | undefined) {
  return useQuery({
    meta: silent,
    queryKey: officeKeys.classSections(id ?? 0),
    queryFn: () => officeApi.classSections(id ?? 0),
    enabled: Boolean(id),
  })
}

export function useSectionStudents(id: number | undefined, params: SectionStudentParams) {
  return useQuery({
    meta: silent,
    queryKey: officeKeys.sectionStudents(id ?? 0, params),
    queryFn: () => officeApi.sectionStudents(id ?? 0, params),
    enabled: Boolean(id),
    placeholderData: keepPreviousData,
  })
}

export function useStudent360(id: number) {
  return useQuery({
    meta: silent,
    queryKey: officeKeys.student(id),
    queryFn: () => officeApi.student(id),
  })
}

const TIMELINE_LIMIT = 20

export function useStudentTimeline(id: number, type: TimelineType | undefined, enabled: boolean) {
  return useInfiniteQuery({
    meta: silent,
    queryKey: officeKeys.timeline(id, type),
    queryFn: ({ pageParam }) =>
      officeApi.timeline(id, { type, page: pageParam, limit: TIMELINE_LIMIT }),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.has_next ? last.page + 1 : undefined),
    enabled,
  })
}

export function useWingSetup() {
  return useQuery({
    meta: silent,
    queryKey: officeKeys.setup(),
    queryFn: officeApi.setup,
  })
}

export function useMonitor(enabled = true) {
  return useQuery({
    meta: silent,
    queryKey: officeKeys.monitor(),
    queryFn: officeApi.monitor,
    enabled,
  })
}

export function useAoDetail(userId: number | undefined) {
  return useQuery({
    meta: silent,
    queryKey: officeKeys.ao(userId ?? 0),
    queryFn: () => officeApi.aoDetail(userId ?? 0),
    enabled: Boolean(userId),
  })
}

export function useOfficeMutation<TInput, TResult>(fn: (input: TInput) => Promise<TResult>) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: fn,
    meta: { silent: true },
    onSuccess: (result) => {
      if (result && typeof result === 'object' && 'aos' in result && 'classes' in result)
        queryClient.setQueryData(officeKeys.setup(), result)
      void queryClient.invalidateQueries({ queryKey: officeKeys.all })
    },
  })
}
