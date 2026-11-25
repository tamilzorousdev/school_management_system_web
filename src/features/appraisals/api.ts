import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, http, type ApiEnvelope, type Paginated } from '@/lib/api/client'

export interface Ref {
  id: number
  name: string
}

export type StaffTypeRule = 'teaching' | 'non_teaching'
export type KraCategory = 'academics' | 'pedagogy' | 'administrative' | 'extracurricular' | 'general'
export type ScoringMode = 'manual' | 'auto'
export type AutoMetric =
  | 'attendance_percent'
  | 'exam_pass_percent'
  | 'parent_rating'
  | 'parent_good_behaviour_percent'
  | 'homework_count'
  | 'driver_rating'
export type CycleStatus = 'draft' | 'scheduled' | 'open' | 'closed'
export type Stage =
  | 'self_pending'
  | 'hod_pending'
  | 'principal_pending'
  | 'published'
  | 'appealed'
  | 'completed'
export type Rating =
  | 'outstanding'
  | 'exceeds_expectations'
  | 'meets_expectations'
  | 'needs_improvement'
  | 'unsatisfactory'
export type Recommendation = 'increment' | 'promotion' | 'retention' | 'pip'
export type AppealStatus = 'pending' | 'accepted' | 'rejected'
export type IncrementBands = Record<Rating, number>

export interface GroupRules {
  staff_types: StaffTypeRule[]
  departments: string[]
  designations: string[]
  roles: string[]
}

export interface Kra {
  id: number
  code: string
  title: string
  description: string | null
  category: KraCategory
  weightage_percent: number
  max_score: number
  scoring_mode: ScoringMode
  auto_metric: AutoMetric | null
  auto_target: number | null
  sort_order: number
}

export interface KraInput {
  code: string
  title: string
  description?: string | null
  category: KraCategory
  weightage_percent: number
  max_score: number
  scoring_mode: ScoringMode
  auto_metric?: AutoMetric | null
  auto_target?: number | null
}

export interface AppraisalGroup {
  id: number
  academic_year_id: number
  name: string
  description: string | null
  rules: GroupRules
  is_default: boolean
  sort_order: number
  is_active: boolean
  member_count: number
  weight_total: number
  kras: Kra[]
}

export interface GroupInput {
  name: string
  description?: string | null
  rules: GroupRules
  is_default: boolean
  sort_order: number
  starter_kras?: 'teaching' | 'staff' | 'none'
  is_active?: boolean
}

export interface GroupMember {
  staff_id: number
  user_id: number
  name: string
  employee_no: string
  designation: string
  department: string | null
  staff_type: string
  reason: 'rules' | 'included' | 'default'
  also_matches: Ref[]
}

export interface GroupMembers {
  group_id: number
  members: GroupMember[]
  elsewhere: GroupMember[]
  include_staff_ids: number[]
  exclude_staff_ids: number[]
}

export interface StageCounts {
  total: number
  self_pending: number
  hod_pending: number
  principal_pending: number
  published: number
  appealed: number
  completed: number
  self_missed: number
}

export interface Cycle {
  id: number
  academic_year_id: number
  title: string
  description: string | null
  groups: Ref[]
  self_opens_at: string | null
  self_due_at: string
  hod_due_at: string
  final_due_at: string
  appeal_days: number
  increment_bands: IncrementBands
  status: CycleStatus
  is_legacy: boolean
  opened_at: string | null
  closed_at: string | null
  counts: StageCounts
}

export interface CycleInput {
  title: string
  description?: string | null
  group_ids: number[]
  self_opens_at?: string | null
  self_due_at: string
  hod_due_at: string
  final_due_at: string
  appeal_days: number
  increment_bands: IncrementBands
}

export interface CycleInsights {
  counts: StageCounts
  average_final_percent: number | null
  ratings: { rating: Rating; count: number }[]
  appeals_pending: number
}

export interface StaffRef {
  staff_id: number
  user_id: number
  name: string
  employee_no: string
  designation: string
  department: string | null
}

export interface AppraisalItem {
  id: number
  cycle: Ref
  staff: StaffRef
  group: Ref
  hod: Ref | null
  stage: Stage
  self_missed: boolean
  self_percent: number | null
  hod_percent: number | null
  final_percent: number | null
  rating: Rating | null
  increment_percent: number | null
  published_at: string | null
  due_at: string | null
}

export interface Score {
  id: number
  kra_id: number | null
  code: string
  title: string
  description: string | null
  weightage_percent: number
  max_score: number
  scoring_mode: ScoringMode
  auto_metric: AutoMetric | null
  auto_target: number | null
  auto_value: number | null
  auto_score: number | null
  self_score: number | null
  self_comment: string | null
  hod_score: number | null
  hod_comment: string | null
  final_score: number | null
  override_reason: string | null
  final_percent: number | null
}

export interface Appeal {
  id: number
  appraisal_id: number
  staff: StaffRef
  cycle_title: string
  reason: string
  requested_increment: number | null
  status: AppealStatus
  decision_note: string | null
  decided_by: Ref | null
  decided_at: string | null
  created_at: string
}

export interface AppraisalDetail extends AppraisalItem {
  academic_year_id: number
  self_due_at: string
  hod_due_at: string
  final_due_at: string
  self_submitted_at: string | null
  hod_submitted_at: string | null
  acknowledged_at: string | null
  appeal_until: string | null
  recommendation: Recommendation | null
  suggested_increment: number | null
  expected_increment_percent: number | null
  hike_justification: string | null
  strengths: string | null
  improvements: string | null
  goals: string | null
  hod_remarks: string | null
  principal_remarks: string | null
  staff_remarks: string | null
  scores: Score[]
  evidence: { id: number; file_id: number; score_id: number | null; name: string; url: string | null }[]
  appeals: Appeal[]
}

export interface FinalScoreInput {
  kra_id: number
  score: number
  override_reason?: string | null
}

export interface FinalInput {
  scores?: FinalScoreInput[]
  recommendation?: Recommendation
  increment_percent?: number | null
  strengths?: string | null
  improvements?: string | null
  goals?: string | null
  principal_remarks?: string | null
}

export interface Dossier {
  user_id: number
  academic_year_id: number
  metrics: Record<AutoMetric, number | null>
  attendance: { marked_days: number; present: number; late: number; half_day: number; absent: number }
  workload: {
    periods_per_week: number
    sections: number
    classes: {
      section_id: number
      section: string
      subject: string
      periods_per_week: number
      papers: number
      pass_percent: number | null
      average_percent: number | null
    }[]
  }
  homework: { count: number; recent: { id: number; title: string; section: string | null; published_at: string }[] }
  ratings: { parent_average: number | null; parent_count: number; good_behaviour_percent: number | null }
  driver: { average: number | null; count: number }
}

export interface AppraisalListParams {
  page: number
  limit: number
  search?: string
  cycle_id?: number
  group_id?: number
  stage?: Stage
  sort?: string
  order?: 'asc' | 'desc'
}

export interface Saved<T> {
  data: T
  message: string
}

const write = <T>(method: 'post' | 'patch' | 'put' | 'delete', url: string, body?: unknown) =>
  http
    .request<ApiEnvelope<T>>({ method, url, data: body })
    .then(({ data }): Saved<T> => ({ data: data.data, message: data.message }))

export const appraisalKeys = {
  all: ['appraisals'] as const,
  groups: () => [...appraisalKeys.all, 'groups'] as const,
  members: (id: number) => [...appraisalKeys.all, 'members', id] as const,
  cycles: () => [...appraisalKeys.all, 'cycles'] as const,
  insights: (id: number) => [...appraisalKeys.all, 'insights', id] as const,
  list: (params: AppraisalListParams) => [...appraisalKeys.all, 'list', params] as const,
  detail: (id: number) => [...appraisalKeys.all, 'detail', id] as const,
  dossier: (staffId: number, yearId?: number) => [...appraisalKeys.all, 'dossier', staffId, yearId] as const,
  appeals: (status?: AppealStatus) => [...appraisalKeys.all, 'appeals', status] as const,
}

export const appraisalsApi = {
  groups: () => api.get<AppraisalGroup[]>('/admin/appraisal-groups'),
  createGroup: (input: GroupInput) => write<AppraisalGroup>('post', '/admin/appraisal-groups', input),
  updateGroup: ({ id, ...input }: Partial<GroupInput> & { id: number }) =>
    write<AppraisalGroup>('patch', `/admin/appraisal-groups/${id}`, input),
  removeGroup: (id: number) => write<null>('delete', `/admin/appraisal-groups/${id}`),
  members: (id: number) => api.get<GroupMembers>(`/admin/appraisal-groups/${id}/members`),
  setMembers: ({ id, ...input }: { id: number; include_staff_ids: number[]; exclude_staff_ids: number[] }) =>
    write<GroupMembers>('put', `/admin/appraisal-groups/${id}/members`, input),
  setKras: ({ id, kras }: { id: number; kras: KraInput[] }) =>
    write<AppraisalGroup>('put', `/admin/appraisal-groups/${id}/kras`, { kras }),
  copyYear: (input: { from_academic_year_id: number; to_academic_year_id: number }) =>
    write<{ copied: number; skipped: number }>('post', '/admin/appraisal-groups/copy-year', input),
  cycles: () => api.get<Paginated<Cycle>>('/admin/appraisal-cycles', { page: 1, limit: 100 }),
  createCycle: (input: CycleInput) => write<Cycle>('post', '/admin/appraisal-cycles', input),
  updateCycle: ({ id, ...input }: Partial<CycleInput> & { id: number }) =>
    write<Cycle>('patch', `/admin/appraisal-cycles/${id}`, input),
  removeCycle: (id: number) => write<null>('delete', `/admin/appraisal-cycles/${id}`),
  openCycle: (id: number) => write<Cycle>('post', `/admin/appraisal-cycles/${id}/open`),
  closeCycle: (id: number) => write<Cycle>('post', `/admin/appraisal-cycles/${id}/close`),
  extendCycle: ({ id, ...input }: { id: number; self_due_at?: string; hod_due_at?: string; final_due_at?: string }) =>
    write<Cycle>('post', `/admin/appraisal-cycles/${id}/extend`, input),
  remindCycle: (id: number) => write<{ reminded: number }>('post', `/admin/appraisal-cycles/${id}/remind`),
  insights: (id: number) => api.get<CycleInsights>(`/admin/appraisal-cycles/${id}/insights`),
  exportUrl: (id: number) => `/admin/appraisal-cycles/${id}/export`,
  list: (params: AppraisalListParams) => api.get<Paginated<AppraisalItem>>('/admin/appraisals', { ...params }),
  detail: (id: number) => api.get<AppraisalDetail>(`/admin/appraisals/${id}`),
  dossier: (staffId: number, yearId?: number) =>
    api.get<Dossier>(`/admin/appraisals/staff/${staffId}/dossier`, yearId ? { academic_year_id: yearId } : undefined),
  saveFinal: ({ id, ...input }: FinalInput & { id: number }) =>
    write<AppraisalDetail>('put', `/admin/appraisals/${id}/final`, input),
  publish: (id: number) => write<AppraisalDetail>('post', `/admin/appraisals/${id}/publish`),
  publishMany: (ids: number[]) =>
    write<{ published: number; skipped: number[] }>('post', '/admin/appraisals/publish', { ids }),
  appeals: (status?: AppealStatus) =>
    api.get<Paginated<Appeal>>('/admin/appraisals/appeals', { page: 1, limit: 100, status }),
  decideAppeal: ({
    id,
    ...input
  }: {
    id: number
    decision: 'accept' | 'reject'
    note: string
    scores?: FinalScoreInput[]
    increment_percent?: number | null
  }) => write<Appeal>('post', `/admin/appraisals/appeals/${id}/decide`, input),
}

export function useAppraisalGroups() {
  return useQuery({ queryKey: appraisalKeys.groups(), queryFn: appraisalsApi.groups })
}

export function useGroupMembers(id: number | null) {
  return useQuery({
    queryKey: appraisalKeys.members(id ?? 0),
    queryFn: () => appraisalsApi.members(id!),
    enabled: Boolean(id),
  })
}

export function useCycles() {
  return useQuery({ queryKey: appraisalKeys.cycles(), queryFn: appraisalsApi.cycles })
}

export function useCycleInsights(id: number | undefined) {
  return useQuery({
    queryKey: appraisalKeys.insights(id ?? 0),
    queryFn: () => appraisalsApi.insights(id!),
    enabled: Boolean(id),
  })
}

export function useAppraisals(params: AppraisalListParams) {
  return useQuery({
    queryKey: appraisalKeys.list(params),
    queryFn: () => appraisalsApi.list(params),
    placeholderData: keepPreviousData,
  })
}

export function useAppraisal(id: number | null) {
  return useQuery({
    queryKey: appraisalKeys.detail(id ?? 0),
    queryFn: () => appraisalsApi.detail(id!),
    enabled: Boolean(id),
  })
}

export function useDossier(staffId: number | null, yearId?: number) {
  return useQuery({
    queryKey: appraisalKeys.dossier(staffId ?? 0, yearId),
    queryFn: () => appraisalsApi.dossier(staffId!, yearId),
    enabled: Boolean(staffId),
  })
}

export function useAppeals(status?: AppealStatus) {
  return useQuery({ queryKey: appraisalKeys.appeals(status), queryFn: () => appraisalsApi.appeals(status) })
}

export function useAppraisalMutation<TInput, TResult>(fn: (input: TInput) => Promise<TResult>) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: fn,
    meta: { silent: true },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: appraisalKeys.all }),
  })
}
