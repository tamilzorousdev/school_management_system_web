import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, type Paginated } from '@/lib/api/client'
import type { Language } from '@/features/auth/api'

export type Gender = 'male' | 'female' | 'other'
export type Relation = 'father' | 'mother' | 'guardian' | 'grandparent' | 'sibling' | 'other'
export type StudentStatus = 'active' | 'transferred' | 'withdrawn' | 'alumni'
export type AdmissionStatus = 'applied' | 'approved' | 'rejected' | 'enrolled'
export type BloodGroup = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-'

export interface Ref {
  id: number
  name: string
}

export interface GuardianSummary {
  id: number
  name: string
  mobile: string
  relation: Relation
  is_primary: boolean
}

export interface StudentListItem {
  id: number
  admission_no: string
  first_name: string
  last_name: string | null
  full_name: string
  gender: Gender
  dob: string
  age: number
  status: StudentStatus
  house: string | null
  admission_date: string
  years_in_school: number
  class: Ref | null
  section: Ref | null
  roll_no: number | null
  photo_file_id: number | null
  photo_url?: string | null
  guardians: GuardianSummary[]
  sibling_count: number
}

export interface StudentDetail extends StudentListItem {
  blood_group: BloodGroup | null
  address_line: string | null
  city: string | null
  pincode: string | null
  previous_school: string | null
  identification_marks: string | null
  guardian_details: (GuardianSummary & {
    email: string | null
    occupation: string | null
    qualification: string | null
    can_pickup: boolean
    receives_alerts: boolean
    on_app: boolean
  })[]
  siblings: { id: number; full_name: string; class_section: string | null }[]
  history: {
    academic_year: string
    class_name: string
    section_name: string | null
    roll_no: number | null
    status: string
    is_current: boolean
  }[]
  emergency_contacts: { id: number; name: string; relation: string; mobile: string }[]
}

export interface StudentInsights {
  total: number
  new_this_month: number
  without_section: number
  with_siblings: number
  boys: number
  girls: number
}

export interface GuardianInput {
  name: string
  mobile: string
  relation: Relation
  email?: string | null
  occupation?: string | null
  qualification?: string | null
  is_primary?: boolean
  can_pickup?: boolean
  receives_alerts?: boolean
  language?: Language
}

export interface StudentInput {
  first_name: string
  last_name?: string | null
  dob: string
  gender: Gender
  blood_group?: BloodGroup | null
  house?: string | null
  address_line?: string | null
  city?: string | null
  pincode?: string | null
  previous_school?: string | null
  identification_marks?: string | null
  is_specially_abled?: boolean
  disability_category?: string | null
  disability_percentage?: number | null
  is_adopted?: boolean
  admission_no?: string
  admission_date?: string
  class_id: number
  section_id?: number | null
  photo_file_id?: number | null
  guardians: GuardianInput[]
}

export interface StudentListParams {
  page: number
  limit: number
  search?: string
  class_id?: number
  section_id?: number
  gender?: Gender
  status?: StudentStatus
  no_section?: boolean
  has_siblings?: boolean
  new_this_month?: boolean
  sort?: string
  order?: 'asc' | 'desc'
}

export interface GuardianChild {
  id: number
  full_name: string
  class_section: string | null
  relation: Relation
  admission_date: string
  years_in_school: number
}

export interface GuardianListItem {
  id: number
  name: string
  mobile: string
  email: string | null
  occupation: string | null
  qualification: string | null
  language: Language | null
  on_app: boolean
  last_login_at: string | null
  children_count: number
  children: GuardianChild[]
}

export interface GuardianDetail extends GuardianListItem {
  alt_mobile: string | null
  address_line: string | null
  city: string | null
  pincode: string | null
  co_guardians: { id: number; name: string; mobile: string; relation: Relation }[]
}

export interface GuardianInsights {
  total: number
  on_app: number
  multiple_children: number
  tamil: number
}

export interface GuardianListParams {
  page: number
  limit: number
  search?: string
  on_app?: boolean
  multiple_children?: boolean
  language?: Language
  sort?: string
  order?: 'asc' | 'desc'
}

export interface Admission {
  id: number
  application_no: string
  status: AdmissionStatus
  class: Ref
  academic_year: Ref
  first_name: string
  last_name: string | null
  full_name: string
  dob: string
  gender: Gender
  guardian_name: string
  guardian_mobile: string
  guardian_relation: Relation
  guardian_email: string | null
  previous_school: string | null
  identification_marks: string | null
  notes: string | null
  decision_note: string | null
  decided_at: string | null
  student_id: number | null
  admission_no: string | null
  created_at: string
}

export interface AdmissionInsights {
  applied: number
  approved: number
  rejected: number
  enrolled: number
}

export interface AdmissionInput {
  class_id: number
  first_name: string
  last_name?: string | null
  dob: string
  gender: Gender
  guardian_name: string
  guardian_mobile: string
  guardian_relation: Relation
  guardian_email?: string | null
  previous_school?: string | null
  identification_marks?: string | null
  notes?: string | null
}

export interface AdmissionListParams {
  page: number
  limit: number
  search?: string
  status?: AdmissionStatus
  class_id?: number
  sort?: string
  order?: 'asc' | 'desc'
}

export const studentKeys = {
  all: ['students'] as const,
  list: (params: StudentListParams) => [...studentKeys.all, 'list', params] as const,
  insights: () => [...studentKeys.all, 'insights'] as const,
  detail: (id: number) => [...studentKeys.all, 'detail', id] as const,
  guardians: (params: GuardianListParams) => [...studentKeys.all, 'guardians', params] as const,
  guardianInsights: () => [...studentKeys.all, 'guardian-insights'] as const,
  guardian: (id: number) => [...studentKeys.all, 'guardian', id] as const,
  admissions: (params: AdmissionListParams) => [...studentKeys.all, 'admissions', params] as const,
  admissionInsights: () => [...studentKeys.all, 'admission-insights'] as const,
}

export const studentsApi = {
  list: (params: StudentListParams) =>
    api.get<Paginated<StudentListItem>>('/admin/students', { ...params }),
  insights: () => api.get<StudentInsights>('/admin/students/insights'),
  get: (id: number) => api.get<StudentDetail>(`/admin/students/${id}`),
  create: (input: StudentInput) => api.post<StudentDetail>('/admin/students', input),
  update: (id: number, input: Partial<StudentInput> & { status?: StudentStatus }) =>
    api.patch<StudentDetail>(`/admin/students/${id}`, input),
  enrollment: (
    id: number,
    input: { class_id: number; section_id: number | null; roll_no: number | null }
  ) => api.put<StudentDetail>(`/admin/students/${id}/enrollment`, input),
  addGuardian: (id: number, input: GuardianInput) =>
    api.post<StudentDetail>(`/admin/students/${id}/guardians`, input),
  updateGuardianLink: (
    id: number,
    guardianId: number,
    input: Partial<Omit<GuardianInput, 'name' | 'mobile'>>
  ) => api.patch<StudentDetail>(`/admin/students/${id}/guardians/${guardianId}`, input),
  removeGuardian: (id: number, guardianId: number) =>
    api.delete<StudentDetail>(`/admin/students/${id}/guardians/${guardianId}`),
  remove: (id: number) => api.delete<{ id: number }>(`/admin/students/${id}`),
  rollNumbers: (sectionId: number, order: 'name' | 'admission_no' | 'gender_name') =>
    api.post<{ section_id: number; assigned: number }>(
      `/admin/sections/${sectionId}/roll-numbers`,
      { order }
    ),
  guardians: (params: GuardianListParams) =>
    api.get<Paginated<GuardianListItem>>('/admin/guardians', { ...params }),
  guardianInsights: () => api.get<GuardianInsights>('/admin/guardians/insights'),
  guardian: (id: number) => api.get<GuardianDetail>(`/admin/guardians/${id}`),
  updateGuardian: (
    id: number,
    input: Partial<
      GuardianInput & {
        alt_mobile: string | null
        address_line: string | null
        city: string | null
        pincode: string | null
      }
    >
  ) => api.patch<GuardianDetail>(`/admin/guardians/${id}`, input),
  admissions: (params: AdmissionListParams) =>
    api.get<Paginated<Admission>>('/admin/admissions', { ...params }),
  admissionInsights: () => api.get<AdmissionInsights>('/admin/admissions/insights'),
  createAdmission: (input: AdmissionInput) => api.post<Admission>('/admin/admissions', input),
  approve: (id: number, note?: string) =>
    api.post<Admission>(`/admin/admissions/${id}/approve`, { note: note || null }),
  reject: (id: number, note?: string) =>
    api.post<Admission>(`/admin/admissions/${id}/reject`, { note: note || null }),
  enrol: (id: number, input: { section_id: number | null; language?: Language }) =>
    api.post<Admission>(`/admin/admissions/${id}/enrol`, input),
  removeAdmission: (id: number) => api.delete<{ id: number }>(`/admin/admissions/${id}`),
}

export function useStudents(params: StudentListParams, enabled = true) {
  return useQuery({
    queryKey: studentKeys.list(params),
    queryFn: () => studentsApi.list(params),
    placeholderData: keepPreviousData,
    enabled,
  })
}

export function useStudentInsights() {
  return useQuery({ queryKey: studentKeys.insights(), queryFn: studentsApi.insights })
}

export function useStudent(id: number | null) {
  return useQuery({
    queryKey: studentKeys.detail(id ?? 0),
    queryFn: () => studentsApi.get(id!),
    enabled: Boolean(id),
  })
}

export function useGuardians(params: GuardianListParams) {
  return useQuery({
    queryKey: studentKeys.guardians(params),
    queryFn: () => studentsApi.guardians(params),
    placeholderData: keepPreviousData,
  })
}

export function useGuardianInsights() {
  return useQuery({
    queryKey: studentKeys.guardianInsights(),
    queryFn: studentsApi.guardianInsights,
  })
}

export function useGuardian(id: number | null) {
  return useQuery({
    queryKey: studentKeys.guardian(id ?? 0),
    queryFn: () => studentsApi.guardian(id!),
    enabled: Boolean(id),
  })
}

export function useAdmissions(params: AdmissionListParams) {
  return useQuery({
    queryKey: studentKeys.admissions(params),
    queryFn: () => studentsApi.admissions(params),
    placeholderData: keepPreviousData,
  })
}

export function useAdmissionInsights() {
  return useQuery({
    queryKey: studentKeys.admissionInsights(),
    queryFn: studentsApi.admissionInsights,
  })
}

export function useStudentMutation<TInput, TResult>(fn: (input: TInput) => Promise<TResult>) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: fn,
    meta: { silent: true },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: studentKeys.all })
      void queryClient.invalidateQueries({ queryKey: ['setup'] })
      void queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })
}
