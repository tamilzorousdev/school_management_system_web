import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { NewDocument, VerifiableDoc } from '@/components/common/document-list'
import { api, type Paginated } from '@/lib/api/client'
import type { Language } from '@/features/auth/api'

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
}

export interface AssignmentMatrix {
  academic_year: Ref
  teachers: MatrixTeacher[]
  rows: MatrixRow[]
  unassigned: number
}

export interface AssignmentParams {
  academic_year_id?: number
  class_id?: number
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
