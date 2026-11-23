import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { NewDocument, VerifiableDoc } from '@/components/common/document-list'
import { api, type Paginated } from '@/lib/api/client'
import type { Language } from '@/features/auth/api'
import type { AppraisalStatus, OverallRating } from './search'

export type StaffType = 'teaching' | 'non_teaching'
export type StaffStatus = 'active' | 'on_leave' | 'resigned'
export type StaffGender = 'male' | 'female' | 'other'
export type StaffRoleCode =
  'PRINCIPAL' | 'AO' | 'HOD' | 'TEACHER' | 'TRANSPORT_INCHARGE' | 'DRIVER' | 'ATTENDANT' | 'ADMIN'
export type AttentionReason =
  | 'documents_pending'
  | 'document_rejected'
  | 'no_documents'
  | 'bank_missing'
  | 'no_classes'
  | 'overloaded'
export type StaffDocumentType =
  | 'id_proof'
  | 'address_proof'
  | 'degree_certificate'
  | 'experience_letter'
  | 'police_verification'
  | 'medical_fitness'
  | 'driving_licence'
  | 'psv_badge'
  | 'photo'
  | 'other'

export interface Ref {
  id: number
  name: string
}

export interface StaffListItem {
  id: number
  user_id: number
  employee_no: string
  name: string
  mobile: string
  email: string | null
  photo_file_id: number | null
  photo_url: string | null
  roles: { code: string; name: string }[]
  staff_type: StaffType
  designation: string
  department: string | null
  status: StaffStatus
  joining_date: string
  experience_years: number
  load_periods: number
  max_periods_per_week: number
  sections_count: number
  class_teacher_of: Ref[]
  attention: AttentionReason[]
  on_app: boolean
}

export interface Qualification {
  id: number
  degree: string
  specialization: string | null
  institution: string | null
  year_completed: number | null
}

export interface BankSummary {
  id?: number
  account_holder: string | null
  bank_name: string | null
  ifsc: string | null
  account_masked: string | null
  pan_masked: string | null
  complete: boolean
  is_primary?: boolean
}

export interface BankDetails {
  id?: number
  account_holder: string | null
  bank_name: string | null
  ifsc: string | null
  account_no: string | null
  pan: string | null
  account_masked?: string | null
  pan_masked?: string | null
  is_primary?: boolean
}

export interface TeachingAssignment {
  id: number
  section: Ref
  subject: Ref
  periods_per_week: number
}

export interface StaffDetail extends StaffListItem {
  language: Language
  gender: StaffGender | null
  dob: string | null
  prior_experience_years: number
  address: string | null
  emergency_contact_name: string | null
  emergency_contact_mobile: string | null
  left_on: string | null
  qualifications: Qualification[]
  documents: VerifiableDoc[]
  bank: BankSummary
  banks?: BankSummary[]
  assignments: TeachingAssignment[]
}

export interface StaffInsights {
  total_teachers: number
  average_load: number
  class_teachers: number
  need_attention: number
  total_staff: number
  overloaded: number
}

export interface QualificationInput {
  degree: string
  specialization?: string | null
  institution?: string | null
  year_completed?: number | null
}

export interface StaffProfileInput {
  name: string
  mobile: string
  email?: string | null
  language?: Language
  role_codes: StaffRoleCode[]
  staff_type: StaffType
  designation: string
  department?: string | null
  gender?: StaffGender | null
  dob?: string | null
  joining_date?: string
  prior_experience_years?: number
  max_periods_per_week?: number
  address?: string | null
  emergency_contact_name?: string | null
  emergency_contact_mobile?: string | null
  employee_no?: string
  photo_file_id?: number | null
}

export interface CreateStaffInput extends StaffProfileInput {
  qualifications?: QualificationInput[]
  send_invite?: boolean
}

export interface UpdateStaffInput extends Partial<StaffProfileInput> {
  status?: StaffStatus
  left_on?: string | null
}

export interface BankInput {
  id?: number
  account_holder: string
  bank_name: string
  ifsc: string
  account_no: string
  pan?: string | null
  is_primary?: boolean
}

export interface StaffListParams {
  page: number
  limit: number
  search?: string
  sort?: string
  order?: 'asc' | 'desc'
  staff_type?: StaffType
  status?: StaffStatus
  department?: string
  role?: StaffRoleCode
  class_teacher?: boolean
  needs_attention?: boolean
  overloaded?: boolean
}

export interface MatrixTeacher {
  user_id: number
  name: string
  department: string | null
  load_periods: number
  max_periods_per_week: number
}

export interface MatrixCell {
  subject_id: number
  subject_name: string
  subject_code: string
  assignment_id: number | null
  teacher_user_id: number | null
  teacher_name: string | null
  periods_per_week: number | null
}

export interface MatrixRow {
  section_id: number
  class_id: number
  class_name: string
  section_name: string
  class_teacher: string | null
  cells: MatrixCell[]
  periods_total: number
}

export interface AssignmentWeek {
  start: string
  end: string
  is_current: boolean
  read_only: boolean
  changes: number
}

export interface AssignmentMatrix {
  academic_year: Ref
  teachers: MatrixTeacher[]
  rows: MatrixRow[]
  unassigned: number
  class_periods_per_week: number
  week: AssignmentWeek
}

export interface AssignmentParams {
  academic_year_id?: number
  class_id?: number
  week?: string
}

export interface AssignmentChange {
  id: number
  week_start: string
  section: Ref
  subject: Ref
  from_teacher: Ref | null
  to_teacher: Ref | null
  from_periods: number | null
  to_periods: number | null
  changed_by: Ref | null
  at: string
  summary: string
}

export interface AssignmentItem {
  section_id: number
  subject_id: number
  teacher_user_id: number | null
  periods_per_week?: number
}

export const staffKeys = {
  all: ['staff'] as const,
  list: (params: StaffListParams) => [...staffKeys.all, 'list', params] as const,
  insights: () => [...staffKeys.all, 'insights'] as const,
  detail: (id: number) => [...staffKeys.all, 'detail', id] as const,
  bank: (id: number) => [...staffKeys.all, 'bank', id] as const,
  assignments: (params: AssignmentParams) => [...staffKeys.all, 'assignments', params] as const,
  assignmentChanges: (week: string) => [...staffKeys.all, 'assignment-changes', week] as const,
}

export const staffApi = {
  list: (params: StaffListParams) =>
    api.get<Paginated<StaffListItem>>('/admin/staff', { ...params }),
  insights: () => api.get<StaffInsights>('/admin/staff/insights'),
  get: (id: number) => api.get<StaffDetail>(`/admin/staff/${id}`),
  create: (input: CreateStaffInput) => api.post<StaffDetail>('/admin/staff', input),
  update: (id: number, input: UpdateStaffInput) =>
    api.patch<StaffDetail>(`/admin/staff/${id}`, input),
  remove: (id: number) => api.delete<{ id: number }>(`/admin/staff/${id}`),
  qualifications: (id: number, items: QualificationInput[]) =>
    api.put<StaffDetail>(`/admin/staff/${id}/qualifications`, { items }),
  addDocument: (id: number, input: NewDocument) =>
    api.post<StaffDetail>(`/admin/staff/${id}/documents`, {
      type: input.type,
      title: input.title,
      file_id: input.file_id,
    }),
  verifyDocument: (
    id: number,
    documentId: number,
    status: 'verified' | 'rejected',
    remarks: string | null
  ) =>
    api.post<StaffDetail>(`/admin/staff/${id}/documents/${documentId}/verify`, {
      status,
      ...(remarks ? { remarks } : {}),
    }),
  removeDocument: (id: number, documentId: number) =>
    api.delete<StaffDetail>(`/admin/staff/${id}/documents/${documentId}`),
  bank: (id: number) => api.get<BankDetails[]>(`/admin/staff/${id}/bank`),
  saveBank: (id: number, input: BankInput | BankInput[] | { accounts: BankInput[] }) =>
    api.put<StaffDetail>(
      `/admin/staff/${id}/bank`,
      Array.isArray(input)
        ? { accounts: input }
        : 'accounts' in input
          ? input
          : { accounts: [input] }
    ),
  setPrimaryBank: (id: number, bankId: number) =>
    api.patch<StaffDetail>(`/admin/staff/${id}/bank/${bankId}/primary`),
  removeBank: (id: number, bankId: number) =>
    api.delete<StaffDetail>(`/admin/staff/${id}/bank/${bankId}`),
  assignments: (params: AssignmentParams) =>
    api.get<AssignmentMatrix>('/admin/teacher-assignments', { ...params }),
  assignmentChanges: (week: string) =>
    api.get<AssignmentChange[]>('/admin/teacher-assignments/changes', { week }),
  saveAssignments: (input: { academic_year_id?: number; items: AssignmentItem[] }) =>
    api.put<AssignmentMatrix>('/admin/teacher-assignments', input),
}

export function useStaffList(params: StaffListParams) {
  return useQuery({
    queryKey: staffKeys.list(params),
    queryFn: () => staffApi.list(params),
    placeholderData: keepPreviousData,
  })
}

export function useStaffInsights() {
  return useQuery({ queryKey: staffKeys.insights(), queryFn: staffApi.insights })
}

export function useStaff(id: number | null) {
  return useQuery({
    queryKey: staffKeys.detail(id ?? 0),
    queryFn: () => staffApi.get(id!),
    enabled: Boolean(id),
  })
}

export function useStaffBank(id: number, enabled: boolean) {
  return useQuery({
    queryKey: staffKeys.bank(id),
    queryFn: () => staffApi.bank(id),
    enabled,
    staleTime: 0,
    gcTime: 0,
  })
}

export function useAssignments(params: AssignmentParams) {
  return useQuery({
    queryKey: staffKeys.assignments(params),
    queryFn: () => staffApi.assignments(params),
    placeholderData: keepPreviousData,
  })
}

export function useAssignmentChanges(week: string | null) {
  return useQuery({
    queryKey: staffKeys.assignmentChanges(week ?? ''),
    queryFn: () => staffApi.assignmentChanges(week!),
    enabled: Boolean(week),
  })
}

export function useStaffMutation<TInput, TResult>(fn: (input: TInput) => Promise<TResult>) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: fn,
    meta: { silent: true },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: staffKeys.all })
      void queryClient.invalidateQueries({ queryKey: ['setup'] })
    },
  })
}

export interface KraScoreItem {
  kra_id?: number
  code: string
  title: string
  weightage: number
  score: number
  remarks?: string | null
}

export interface KraConfig {
  id: number
  school_id: number
  academic_year_id: number | null
  code: string
  title: string
  description: string | null
  category: 'academics' | 'pedagogy' | 'administrative' | 'extracurricular' | 'general'
  weightage_percent: number
  min_score: number
  max_score: number
  applicable_to: 'all' | 'teaching' | 'non_teaching' | 'leadership'
  sort_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface CreateKraConfigInput {
  code: string
  title: string
  description?: string
  category?: 'academics' | 'pedagogy' | 'administrative' | 'extracurricular' | 'general'
  weightage_percent: number
  min_score?: number
  max_score?: number
  applicable_to?: 'all' | 'teaching' | 'non_teaching' | 'leadership'
  sort_order?: number
}

export interface UpdateKraConfigInput {
  title?: string
  description?: string
  category?: 'academics' | 'pedagogy' | 'administrative' | 'extracurricular' | 'general'
  weightage_percent?: number
  min_score?: number
  max_score?: number
  applicable_to?: 'all' | 'teaching' | 'non_teaching' | 'leadership'
  sort_order?: number
  is_active?: boolean
}

export interface BulkUpdateKraItem {
  id: number
  weightage_percent: number
  sort_order?: number
  is_active?: boolean
}

export interface StaffAppraisal {
  id: number
  academic_year_id: number
  staff_id: number
  user_id: number
  staff: { id: number; name: string }
  employee_no: string
  designation: string
  department: string | null
  reviewer: { id: number; name: string }
  period: string
  review_date: string
  status: AppraisalStatus
  teaching_effectiveness: number
  student_outcomes: number
  classroom_management: number
  professional_conduct: number
  extracurricular_contribution: number
  overall_score: number
  overall_rating: OverallRating
  kra_scores?: KraScoreItem[] | null
  appeal_status?: 'none' | 'pending' | 'resolved' | 'rejected'
  appeal_reason?: string | null
  appeal_requested_hike?: number | null
  appeal_feedback?: string | null
  appealed_at?: string | null
  appeal_resolved_at?: string | null
  appeal_resolved_by?: number | null
  strengths: string | null
  areas_for_improvement: string | null
  goals_next_period: string | null
  reviewer_remarks: string | null
  staff_remarks: string | null
  expected_increment_percent: number | null
  hike_justification: string | null
  recommendation: 'increment' | 'promotion' | 'retention' | 'pip'
  increment_percent: number
  finalized_at: string | null
  created_at: string
}

export interface AppraisalListParams {
  page?: number
  limit?: number
  search?: string
  status?: AppraisalStatus
  rating?: OverallRating
  academic_year_id?: number
  staff_id?: number
}

export interface TeachingAssignmentSummary {
  id: number
  class_name: string
  section_name: string
  subject_name: string
  periods_per_week: number
}

export interface RecentHomeworkItem {
  id: number
  title: string
  due_date: string | null
  created_at: string
  subject_name: string | null
  class_section: string | null
}

export interface StaffPerformanceMetrics {
  staff_id: number
  user_id: number
  name: string
  attendance_percentage: number
  present_days: number
  absent_days: number
  total_working_days: number
  assigned_periods_per_week: number
  total_sections_taught: number
  diary_entries_count: number
  homework_count: number
  student_pass_percentage: number | null
  student_fail_percentage: number | null
  passed_students: number
  failed_students: number
  total_students_evaluated: number
  average_student_marks: number | null
  parent_rating_average: number | null
  parent_rating_count: number
  student_feedback_average: number | null
  student_feedback_count: number
  teaching_assignments: TeachingAssignmentSummary[]
  recent_homework: RecentHomeworkItem[]
}

export const appraisalsApi = {
  list: (params: AppraisalListParams) =>
    api.get<Paginated<StaffAppraisal>>('/admin/staff-appraisals', { ...params }),
  get: (id: number) => api.get<StaffAppraisal>(`/admin/staff-appraisals/${id}`),
  metrics: (staffId: number, yearId?: number) =>
    api.get<StaffPerformanceMetrics>(`/admin/staff-appraisals/staff/${staffId}/metrics`, {
      academic_year_id: yearId,
    }),
  create: (input: Record<string, unknown>) =>
    api.post<StaffAppraisal>('/admin/staff-appraisals', input),
  bulkImport: (inputs: Record<string, unknown>[]) =>
    api.post<StaffAppraisal[]>('/admin/staff-appraisals/bulk', inputs),
  update: (id: number, input: Record<string, unknown>) =>
    api.put<StaffAppraisal>(`/admin/staff-appraisals/${id}`, input),
  finalize: (id: number) =>
    api.post<StaffAppraisal>(`/admin/staff-appraisals/${id}/finalize`),
  appeal: (id: number, input: { reason: string; requested_hike?: number }) =>
    api.post<StaffAppraisal>(`/admin/staff-appraisals/${id}/appeal`, input),
  resolveAppeal: (
    id: number,
    input: {
      decision: 'accept' | 'reject'
      revised_rating?: OverallRating
      revised_hike?: number
      feedback: string
    },
  ) => api.post<StaffAppraisal>(`/admin/staff-appraisals/${id}/resolve-appeal`, input),
}

export const kraConfigsApi = {
  list: () => api.get<KraConfig[]>('/admin/staff-kra-configs'),
  create: (input: CreateKraConfigInput) =>
    api.post<KraConfig>('/admin/staff-kra-configs', input),
  update: (id: number, input: UpdateKraConfigInput) =>
    api.put<KraConfig>(`/admin/staff-kra-configs/${id}`, input),
  bulkUpdate: (items: BulkUpdateKraItem[]) =>
    api.put<KraConfig[]>('/admin/staff-kra-configs/bulk', { items }),
  delete: (id: number) =>
    api.delete<boolean>(`/admin/staff-kra-configs/${id}`),
  resetDefaults: () =>
    api.post<KraConfig[]>('/admin/staff-kra-configs/reset-defaults'),
}

export const kraKeys = {
  all: ['kra-configs'] as const,
  list: () => [...kraKeys.all, 'list'] as const,
}

export function useKraConfigs() {
  return useQuery({
    queryKey: kraKeys.list(),
    queryFn: () => kraConfigsApi.list(),
  })
}

export const appraisalKeys = {
  all: ['appraisals'] as const,
  list: (p: AppraisalListParams) => [...appraisalKeys.all, 'list', p] as const,
  detail: (id: number) => [...appraisalKeys.all, 'detail', id] as const,
  metrics: (staffId: number, yearId?: number) =>
    [...appraisalKeys.all, 'metrics', staffId, yearId] as const,
}

export function useAppraisalsList(params: AppraisalListParams) {
  return useQuery({
    queryKey: appraisalKeys.list(params),
    queryFn: () => appraisalsApi.list(params),
    placeholderData: keepPreviousData,
  })
}

export function useAppraisalDetail(id: number | null) {
  return useQuery({
    queryKey: appraisalKeys.detail(id ?? 0),
    queryFn: () => appraisalsApi.get(id!),
    enabled: Boolean(id),
  })
}

export function useTeacherMetrics(staffId: number | null, yearId?: number) {
  return useQuery({
    queryKey: appraisalKeys.metrics(staffId ?? 0, yearId),
    queryFn: () => appraisalsApi.metrics(staffId!, yearId),
    enabled: Boolean(staffId),
  })
}

export function useAppraisalMutation<TInput, TResult>(fn: (input: TInput) => Promise<TResult>) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: fn,
    meta: { silent: true },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: appraisalKeys.all })
    },
  })
}
