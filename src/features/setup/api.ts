import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, type Paginated } from '@/lib/api/client'
import type { IdCardDesign } from '@/lib/id-card-design'
import type { IdCardLayout } from '@/lib/id-card-layout'

export interface Term {
  id: number
  name: string
  start_date: string
  end_date: string
  sort_order: number
}

export interface AcademicYear {
  id: number
  name: string
  start_date: string
  end_date: string
  is_current: boolean
  terms: Term[]
}

export interface PersonRef {
  id: number
  name: string
}

export interface Section {
  id: number
  class_id: number
  class_name: string
  name: string
  room: string | null
  capacity: number
  class_teacher: PersonRef | null
  student_count: number
}

export interface SchoolClass {
  id: number
  name: string
  grade_level: number
  student_count: number
  sections: Section[]
}

export type SubjectType = 'theory' | 'practical' | 'language' | 'activity'

export interface Subject {
  id: number
  code: string
  name: string
  type: SubjectType
  class_count: number
}

export interface ClassSubject {
  subject_id: number
  code: string
  name: string
  type: SubjectType
  periods_per_week: number
  is_optional: boolean
}

export type HolidayType = 'holiday' | 'emergency_closure' | 'event'

export interface Holiday {
  id: number
  date: string
  end_date: string | null
  name: string
  type: HolidayType
  days: number
}

export interface SetupSummary {
  current_year: AcademicYear | null
  classes: number
  sections: number
  subjects: number
  sections_without_teacher: number
  next_holiday: Holiday | null
}

export type DiaryReviewMode = 'all' | 'remarks' | 'none'

export interface SchoolProfile {
  id: number
  name: string
  code: string
  board: 'CBSE' | 'STATE' | 'ICSE' | 'OTHER' | null
  address: string | null
  city: string | null
  state: string | null
  pincode: string | null
  phone: string | null
  emergency_phone: string | null
  email: string | null
  latitude: number | null
  longitude: number | null
  geofence_radius_m: number
  staff_reporting_time: string
  attendance_grace_minutes: number
  attendance_mode: 'session' | 'period'
  diary_review_mode: DiaryReviewMode
  chat_office_start: string
  chat_office_end: string
  logo_file_id: number | null
  logo_url: string | null
  signature_file_id: number | null
  signature_url: string | null
  seal_file_id: number | null
  seal_url: string | null
  id_card_design?: IdCardDesign | null
  id_card_front_file_id?: number | null
  id_card_front_url?: string | null
  id_card_back_file_id?: number | null
  id_card_back_url?: string | null
  id_card_layout?: IdCardLayout | null
  timezone: string
  is_active: boolean
  student_count: number
  user_count: number
  created_at: string
}

export const setupKeys = {
  all: ['setup'] as const,
  summary: () => [...setupKeys.all, 'summary'] as const,
  school: () => [...setupKeys.all, 'school'] as const,
  years: () => [...setupKeys.all, 'years'] as const,
  classes: () => [...setupKeys.all, 'classes'] as const,
  sections: (classId?: number, yearId?: number) =>
    [...setupKeys.all, 'sections', classId ?? 'all', yearId ?? 'current'] as const,
  subjects: (search?: string) => [...setupKeys.all, 'subjects', search ?? ''] as const,
  classSubjects: (classId: number) => [...setupKeys.all, 'class-subjects', classId] as const,
  holidays: () => [...setupKeys.all, 'holidays'] as const,
  teachers: () => [...setupKeys.all, 'teachers'] as const,
}

export const setupApi = {
  summary: () => api.get<SetupSummary>('/admin/setup/summary'),
  school: () => api.get<SchoolProfile>('/admin/school'),
  updateSchool: (input: Partial<SchoolProfile>) => api.patch<SchoolProfile>('/admin/school', input),
  years: () => api.get<AcademicYear[]>('/admin/academic-years'),
  createYear: (input: {
    name: string
    start_date: string
    end_date: string
    is_current?: boolean
  }) => api.post<AcademicYear>('/admin/academic-years', input),
  updateYear: (
    id: number,
    input: Partial<{ name: string; start_date: string; end_date: string; is_current: boolean }>
  ) => api.patch<AcademicYear>(`/admin/academic-years/${id}`, input),
  removeYear: (id: number) => api.delete<{ id: number }>(`/admin/academic-years/${id}`),
  addTerm: (yearId: number, input: { name: string; start_date: string; end_date: string }) =>
    api.post<AcademicYear>(`/admin/academic-years/${yearId}/terms`, input),
  updateTerm: (id: number, input: { name: string; start_date: string; end_date: string }) =>
    api.patch<AcademicYear>(`/admin/terms/${id}`, input),
  removeTerm: (id: number) => api.delete<{ id: number }>(`/admin/terms/${id}`),
  classes: () => api.get<SchoolClass[]>('/admin/classes'),
  createClass: (input: { name: string; grade_level: number }) =>
    api.post<SchoolClass>('/admin/classes', input),
  standardClasses: () => api.post<SchoolClass[]>('/admin/classes/standard'),
  removeClass: (id: number) => api.delete<{ id: number }>(`/admin/classes/${id}`),
  sections: (classId?: number, yearId?: number) =>
    api.get<Section[]>('/admin/sections', { class_id: classId, academic_year_id: yearId }),
  createSection: (input: SectionInput) => api.post<Section>('/admin/sections', input),
  updateSection: (id: number, input: Partial<SectionInput>) =>
    api.patch<Section>(`/admin/sections/${id}`, input),
  removeSection: (id: number) => api.delete<{ id: number }>(`/admin/sections/${id}`),
  teachers: () => api.get<PersonRef[]>('/admin/setup/teachers'),
  subjects: (search?: string) =>
    api.get<Paginated<Subject>>('/admin/subjects', { page: 1, limit: 100, search }),
  createSubject: (input: { code: string; name: string; type: SubjectType }) =>
    api.post<Subject>('/admin/subjects', input),
  updateSubject: (id: number, input: { code: string; name: string; type: SubjectType }) =>
    api.patch<Subject>(`/admin/subjects/${id}`, input),
  removeSubject: (id: number) => api.delete<{ id: number }>(`/admin/subjects/${id}`),
  classSubjects: (classId: number) => api.get<ClassSubject[]>(`/admin/classes/${classId}/subjects`),
  setClassSubjects: (
    classId: number,
    items: { subject_id: number; periods_per_week: number; is_optional: boolean }[]
  ) => api.put<ClassSubject[]>(`/admin/classes/${classId}/subjects`, { items }),
  holidays: () => api.get<Holiday[]>('/admin/holidays'),
  createHoliday: (input: HolidayInput) => api.post<Holiday>('/admin/holidays', input),
  updateHoliday: (id: number, input: HolidayInput) =>
    api.patch<Holiday>(`/admin/holidays/${id}`, input),
  removeHoliday: (id: number) => api.delete<{ id: number }>(`/admin/holidays/${id}`),
}

export interface SectionInput {
  class_id: number
  name: string
  room?: string | null
  capacity?: number
  class_teacher_user_id?: number | null
  academic_year_id?: number
}

export interface HolidayInput {
  date: string
  end_date?: string | null
  name: string
  type: HolidayType
}

export function useSetupSummary() {
  return useQuery({ queryKey: setupKeys.summary(), queryFn: setupApi.summary })
}

export function useSchoolProfile() {
  return useQuery({ queryKey: setupKeys.school(), queryFn: setupApi.school })
}

export function useAcademicYears() {
  return useQuery({ queryKey: setupKeys.years(), queryFn: setupApi.years })
}

export function useClasses(enabled = true) {
  return useQuery({
    queryKey: setupKeys.classes(),
    queryFn: setupApi.classes,
    enabled,
    meta: { silent: true },
  })
}

export function useSections(classId?: number, enabled = true, yearId?: number) {
  return useQuery({
    queryKey: setupKeys.sections(classId, yearId),
    queryFn: () => setupApi.sections(classId, yearId),
    enabled,
    meta: { silent: true },
  })
}

export function useTeachers() {
  return useQuery({ queryKey: setupKeys.teachers(), queryFn: setupApi.teachers, staleTime: 60_000 })
}

export function useSubjects(search?: string) {
  return useQuery({
    queryKey: setupKeys.subjects(search),
    queryFn: () => setupApi.subjects(search),
    placeholderData: keepPreviousData,
  })
}

export function useClassSubjects(classId: number | null) {
  return useQuery({
    queryKey: setupKeys.classSubjects(classId ?? 0),
    queryFn: () => setupApi.classSubjects(classId!),
    enabled: Boolean(classId),
  })
}

export function useHolidays() {
  return useQuery({ queryKey: setupKeys.holidays(), queryFn: setupApi.holidays })
}

export function useSetupMutation<TInput, TResult>(fn: (input: TInput) => Promise<TResult>) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: fn,
    meta: { silent: true },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: setupKeys.all })
      void queryClient.invalidateQueries({ queryKey: ['me'] })
      void queryClient.invalidateQueries({ queryKey: ['students'] })
    },
  })
}
