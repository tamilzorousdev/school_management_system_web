import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, type Paginated } from '@/lib/api/client'

export type AlumniSource = 'pass_out' | 'converted' | 'registered' | 'self'
export type AlumniStatus = 'active' | 'inactive'
export type AlumniExitType = 'graduated' | 'transferred' | 'withdrawn'
export type OccupationStatus =
  'higher_studies' | 'employed' | 'self_employed' | 'seeking' | 'other' | 'unknown'
export type FinalResult = 'pass' | 'fail'
export type AlumniGender = 'male' | 'female' | 'other'
export type HistoryResult = 'promoted' | 'detained' | 'completed' | 'left' | 'studying'
export type HistorySource = 'system' | 'manual'
export type SubmissionType = 'registration' | 'update'
export type SubmissionStatus = 'pending' | 'approved' | 'rejected'
export type TimelineAction =
  | 'created'
  | 'passed_out'
  | 'converted'
  | 'updated'
  | 'history_updated'
  | 'self_registered'
  | 'self_update_approved'
  | 'status_changed'
  | 'link_issued'
export type FieldChanges = Record<string, [unknown, unknown]>

export interface AlumniRef {
  id: number
  name: string
}

export interface AlumniItem {
  id: number
  alumni_no: string
  student_id: number | null
  source: AlumniSource
  status: AlumniStatus
  first_name: string
  last_name: string | null
  full_name: string
  gender: AlumniGender | null
  photo_file_id: number | null
  photo_url: string | null
  admission_no: string | null
  emis_number: string | null
  batch_year: number
  left_on: string | null
  exit_type: AlumniExitType
  final_class_name: string | null
  final_section_name: string | null
  final_percent: number | null
  final_grade: string | null
  mobile: string | null
  email: string | null
  city: string | null
  occupation_status: OccupationStatus
  institution: string | null
  organization: string | null
  contact_consent: boolean
  reachable: boolean
}

export interface AlumniHistory {
  id: number
  academic_year_name: string
  class_name: string
  section_name: string | null
  roll_no: number | null
  result: HistoryResult | null
  percent: number | null
  grade: string | null
  source: HistorySource
}

export interface AlumniTimeline {
  id: number
  action: TimelineAction
  actor_name: string | null
  changes: FieldChanges | null
  note: string | null
  created_at: string
}

export interface AlumniDetail extends AlumniItem {
  dob: string | null
  admission_date: string | null
  final_academic_year_id: number | null
  final_academic_year_name: string | null
  final_result: FinalResult | null
  tc_no: string | null
  alt_mobile: string | null
  address_line: string | null
  state: string | null
  pincode: string | null
  country: string | null
  linkedin_url: string | null
  course: string | null
  designation: string | null
  notes: string | null
  pending_submissions: number
  profile_updated_at: string | null
  created_at: string
  academic_history: AlumniHistory[]
  timeline: AlumniTimeline[]
}

export interface BatchCount {
  batch_year: number
  count: number
}

export interface AlumniInsights {
  total: number
  active: number
  reachable: number
  latest_batch: BatchCount | null
  pending_submissions: number
  by_occupation: Record<OccupationStatus, number>
  by_batch: BatchCount[]
}

export interface PassOutStudent {
  student_id: number
  full_name: string
  admission_no: string
  section_name: string | null
  percent: number | null
  fee_due: number
}

export interface PassOutPreview {
  academic_year: AlumniRef
  final_class: AlumniRef | null
  will_convert: number
  detained: number
  already_alumni: number
  students: PassOutStudent[]
}

export interface AlumniMatch {
  id: number
  alumni_no: string
  full_name: string
  batch_year: number
  mobile: string | null
}

export interface Submission {
  id: number
  type: SubmissionType
  status: SubmissionStatus
  alumni_id: number | null
  alumni_no: string | null
  name: string
  mobile: string | null
  payload: Record<string, unknown>
  changes: FieldChanges | null
  possible_matches: AlumniMatch[]
  reviewed_by_name: string | null
  reviewed_at: string | null
  review_note: string | null
  created_at: string
}

export interface UpdateLink {
  path: string
  expires_at: string
}

export interface PublicSchool {
  code: string
  name: string
  logo_url: string | null
}

export interface AlumniContactInput {
  mobile?: string | null
  alt_mobile?: string | null
  email?: string | null
  address_line?: string | null
  city?: string | null
  state?: string | null
  pincode?: string | null
  country?: string | null
  linkedin_url?: string | null
  contact_consent?: boolean
  occupation_status?: OccupationStatus
  institution?: string | null
  course?: string | null
  organization?: string | null
  designation?: string | null
}

export interface PublicProfile extends AlumniContactInput {
  school: PublicSchool
  full_name: string
  batch_year: number
  expires_at: string
}

export interface AlumniDetailsInput extends AlumniContactInput {
  last_name?: string | null
  gender?: AlumniGender | null
  dob?: string | null
  admission_no?: string | null
  emis_number?: string | null
  final_class_name?: string | null
}

export interface HistoryRowInput {
  academic_year_name: string
  class_name: string
  section_name?: string | null
  roll_no?: number | null
  result?: HistoryResult | null
  percent?: number | null
  grade?: string | null
}

export interface AlumniProfileInput extends AlumniDetailsInput {
  photo_file_id?: number | null
  admission_date?: string | null
  left_on?: string | null
  exit_type?: AlumniExitType
  final_academic_year_name?: string | null
  final_section_name?: string | null
  final_percent?: number | null
  final_grade?: string | null
  final_result?: FinalResult | null
  tc_no?: string | null
  notes?: string | null
}

export interface UpdateAlumniInput extends AlumniProfileInput {
  first_name?: string
  batch_year?: number
}

export interface PublicRegisterInput extends AlumniDetailsInput {
  first_name: string
  batch_year: number
  website?: string
}

export interface PublicUpdateInput extends AlumniContactInput {
  website?: string
}

export interface AlumniListParams {
  page: number
  limit: number
  search?: string
  batch_year?: number
  source?: AlumniSource
  exit_type?: AlumniExitType
  occupation_status?: OccupationStatus
  status?: AlumniStatus
  reachable?: boolean
  city?: string
  sort?: string
  order?: 'asc' | 'desc'
}

export type AlumniExportParams = Omit<AlumniListParams, 'page' | 'limit'>

export interface SubmissionListParams {
  page: number
  limit: number
  search?: string
  status?: SubmissionStatus
  type?: SubmissionType
  sort?: string
  order?: 'asc' | 'desc'
}

export const alumniKeys = {
  all: ['alumni'] as const,
  list: (params: AlumniListParams) => [...alumniKeys.all, 'list', params] as const,
  insights: () => [...alumniKeys.all, 'insights'] as const,
  batches: () => [...alumniKeys.all, 'batches'] as const,
  detail: (id: number) => [...alumniKeys.all, 'detail', id] as const,
  submissions: (params: SubmissionListParams) =>
    [...alumniKeys.all, 'submissions', params] as const,
  passOut: (yearId: number | null) => [...alumniKeys.all, 'pass-out', yearId] as const,
}

export const publicAlumniKeys = {
  school: (code: string) => ['public-alumni', 'school', code] as const,
  profile: (token: string) => ['public-alumni', 'profile', token] as const,
}

export const alumniApi = {
  list: (params: AlumniListParams) =>
    api.get<Paginated<AlumniItem>>('/admin/alumni', { ...params }),
  insights: () => api.get<AlumniInsights>('/admin/alumni/insights'),
  batches: () => api.get<BatchCount[]>('/admin/alumni/batches'),
  passOutPreview: (yearId: number | null) =>
    api.get<PassOutPreview>('/admin/alumni/pass-out-preview', {
      academic_year_id: yearId ?? undefined,
    }),
  exportPath: '/admin/alumni/export',
  get: (id: number) => api.get<AlumniDetail>(`/admin/alumni/${id}`),
  update: (id: number, input: UpdateAlumniInput) =>
    api.patch<AlumniDetail>(`/admin/alumni/${id}`, input),
  replaceHistory: (id: number, rows: HistoryRowInput[]) =>
    api.put<AlumniDetail>(`/admin/alumni/${id}/academic-history`, { rows }),
  setStatus: (id: number, status: AlumniStatus, note?: string | null) =>
    api.patch<AlumniDetail>(`/admin/alumni/${id}/status`, { status, note: note ?? null }),
  remove: (id: number) => api.delete<unknown>(`/admin/alumni/${id}`),
  issueLink: (id: number) => api.post<UpdateLink>(`/admin/alumni/${id}/update-link`),
  submissions: (params: SubmissionListParams) =>
    api.get<Paginated<Submission>>('/admin/alumni/submissions', { ...params }),
  approve: (id: number, alumniId?: number | null) =>
    api.post<Submission>(`/admin/alumni/submissions/${id}/approve`, {
      alumni_id: alumniId ?? null,
    }),
  reject: (id: number, note: string) =>
    api.post<Submission>(`/admin/alumni/submissions/${id}/reject`, { note }),
}

export const publicAlumniApi = {
  school: (code: string) =>
    api.get<PublicSchool>(`/public/alumni/schools/${encodeURIComponent(code)}`),
  register: (code: string, input: PublicRegisterInput) =>
    api.post<{ id: number }>(`/public/alumni/schools/${encodeURIComponent(code)}/register`, input),
  profile: (token: string) =>
    api.get<PublicProfile>(`/public/alumni/update/${encodeURIComponent(token)}`),
  submitUpdate: (token: string, input: PublicUpdateInput) =>
    api.post<{ id: number }>(`/public/alumni/update/${encodeURIComponent(token)}`, input),
}

export function useAlumni(params: AlumniListParams, enabled = true) {
  return useQuery({
    queryKey: alumniKeys.list(params),
    queryFn: () => alumniApi.list(params),
    placeholderData: keepPreviousData,
    enabled,
  })
}

export function useAlumniInsights() {
  return useQuery({ queryKey: alumniKeys.insights(), queryFn: alumniApi.insights })
}

export function useAlumniBatches() {
  return useQuery({ queryKey: alumniKeys.batches(), queryFn: alumniApi.batches })
}

export function useAlumnus(id: number) {
  return useQuery({
    queryKey: alumniKeys.detail(id),
    queryFn: () => alumniApi.get(id),
    enabled: Number.isFinite(id) && id > 0,
  })
}

export function useAlumniSubmissions(params: SubmissionListParams, enabled = true) {
  return useQuery({
    queryKey: alumniKeys.submissions(params),
    queryFn: () => alumniApi.submissions(params),
    placeholderData: keepPreviousData,
    enabled,
  })
}

export function usePassOutPreview(yearId: number | null, enabled: boolean) {
  return useQuery({
    queryKey: alumniKeys.passOut(yearId),
    queryFn: () => alumniApi.passOutPreview(yearId),
    enabled,
    meta: { silent: true },
  })
}

function useAlumniMutation<TInput, TResult>(
  fn: (input: TInput) => Promise<TResult>,
  silent = true
) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: fn,
    meta: { silent },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: alumniKeys.all })
    },
  })
}

export function useUpdateAlumnus(id: number) {
  return useAlumniMutation((input: UpdateAlumniInput) => alumniApi.update(id, input))
}

export function useReplaceHistory(id: number) {
  return useAlumniMutation((rows: HistoryRowInput[]) => alumniApi.replaceHistory(id, rows))
}

export function useSetAlumniStatus(id: number) {
  return useAlumniMutation(
    (input: { status: AlumniStatus; note?: string | null }) =>
      alumniApi.setStatus(id, input.status, input.note),
    false
  )
}

export function useDeleteAlumnus() {
  return useAlumniMutation(alumniApi.remove, false)
}

export function useIssueUpdateLink() {
  return useMutation({ mutationFn: alumniApi.issueLink, meta: { silent: true } })
}

export function useApproveSubmission() {
  return useAlumniMutation((input: { id: number; alumni_id?: number | null }) =>
    alumniApi.approve(input.id, input.alumni_id)
  )
}

export function useRejectSubmission() {
  return useAlumniMutation((input: { id: number; note: string }) =>
    alumniApi.reject(input.id, input.note)
  )
}

export function usePublicSchool(code: string) {
  return useQuery({
    queryKey: publicAlumniKeys.school(code),
    queryFn: () => publicAlumniApi.school(code),
    meta: { silent: true },
    staleTime: 5 * 60_000,
  })
}

export function usePublicProfile(token: string) {
  return useQuery({
    queryKey: publicAlumniKeys.profile(token),
    queryFn: () => publicAlumniApi.profile(token),
    meta: { silent: true },
    refetchOnWindowFocus: false,
  })
}

export function usePublicRegister(code: string) {
  return useMutation({
    mutationFn: (input: PublicRegisterInput) => publicAlumniApi.register(code, input),
    meta: { silent: true },
  })
}

export function usePublicUpdate(token: string) {
  return useMutation({
    mutationFn: (input: PublicUpdateInput) => publicAlumniApi.submitUpdate(token, input),
    meta: { silent: true },
  })
}
