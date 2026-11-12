import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api/client'

export interface Ref {
  id: number
  name: string
}

export interface SectionPerformance {
  section_id: number
  class_id: number
  name: string
  class_teacher: string | null
  students: number
  assessed: number
  average_percent: number | null
  pass_percent: number | null
  fail_percent: number | null
  attendance_percent: number | null
  below_average: number
  special_classes: number
}

export interface PerformanceTotals {
  students: number
  assessed: number
  average_percent: number | null
  pass_percent: number | null
  fail_percent: number | null
  attendance_percent: number | null
  below_average: number
}

export interface ClassPerformance {
  academic_year: Ref
  exam: Ref | null
  totals: PerformanceTotals
  sections: SectionPerformance[]
}

export interface WeakSubject {
  subject_id: number
  name: string
  percent: number
  section_percent: number
}

export interface BelowAverageStudent {
  student_id: number
  full_name: string
  roll_no: number | null
  percent: number
  gap: number
  failed_results: number
  attendance_percent: number | null
  weak_subjects: WeakSubject[]
  special_classes: { id: number; title: string }[]
}

export type StudentBand = 'below' | 'average' | 'range'

export interface BandFilter {
  band?: StudentBand
  below?: number
  from?: number
  to?: number
}

export interface BelowAverage {
  section: Ref
  exam: Ref | null
  section_average: number | null
  line: number | null
  band: StudentBand
  from: number | null
  to: number | null
  students: BelowAverageStudent[]
}

export type SpecialKind = 'extra' | 'special'
export type SpecialTiming = 'period' | 'extra_time'
export type DayPart = 'custom' | 'full' | 'morning' | 'afternoon'
export type SpecialStatus = 'present' | 'absent' | 'late'

export interface SpecialClass {
  id: number
  kind: SpecialKind
  timing: SpecialTiming
  title: string
  notes: string | null
  section: Ref
  class_id: number
  subject: Ref | null
  teacher: Ref
  day_of_week: number | null
  day: string
  period_no: number | null
  days: number[]
  start_time: string | null
  end_time: string | null
  start_date: string | null
  end_date: string | null
  day_part: DayPart | null
  when: string
  students: { id: number; name: string; roll_no: number | null }[]
}

export interface SpecialClassInput {
  kind: SpecialKind
  timing: SpecialTiming
  section_id: number
  subject_id: number | null
  teacher_user_id: number
  day_of_week?: number
  period_no?: number
  days?: number[]
  start_time?: string
  end_time?: string
  start_date?: string
  end_date?: string
  day_part?: DayPart
  title: string
  notes: string | null
  student_ids?: number[]
}

export interface SpecialRoster {
  special_class: SpecialClass
  date: string
  runs_today: boolean
  marked: boolean
  students: {
    student_id: number
    full_name: string
    roll_no: number | null
    status: SpecialStatus
  }[]
}

export interface SpecialSettings {
  all: boolean
  classes: Ref[]
}

export const performanceKeys = {
  all: ['performance'] as const,
  classes: (examId?: number, classId?: number) =>
    [...performanceKeys.all, 'classes', examId ?? 0, classId ?? 0] as const,
  below: (sectionId: number, examId?: number, filter: BandFilter = {}) =>
    [...performanceKeys.all, 'below', sectionId, examId ?? 0, filter] as const,
  specials: (filter: { section_id?: number; teacher_user_id?: number } = {}) =>
    [...performanceKeys.all, 'specials', filter] as const,
  roster: (id: number, date: string) => [...performanceKeys.all, 'roster', id, date] as const,
  settings: () => [...performanceKeys.all, 'settings'] as const,
}

export const performanceApi = {
  classes: (examId?: number, classId?: number) =>
    api.get<ClassPerformance>('/admin/performance/classes', { exam_id: examId, class_id: classId }),
  below: (sectionId: number, examId?: number, filter: BandFilter = {}) =>
    api.get<BelowAverage>(`/admin/performance/sections/${sectionId}/below-average`, {
      exam_id: examId,
      ...filter,
    }),
  specials: (filter: { section_id?: number; teacher_user_id?: number } = {}) =>
    api.get<SpecialClass[]>('/admin/special-classes', filter),
  roster: (id: number, date: string) =>
    api.get<SpecialRoster>(`/admin/special-classes/${id}/attendance`, { date }),
  mark: (
    id: number,
    input: { date: string; items: { student_id: number; status: SpecialStatus }[] }
  ) => api.put<SpecialRoster>(`/admin/special-classes/${id}/attendance`, input),
  settings: () => api.get<SpecialSettings>('/admin/special-classes/settings'),
  saveSettings: (classIds: number[] | null) =>
    api.put<SpecialSettings>('/admin/special-classes/settings', { class_ids: classIds }),
  createSpecial: (input: SpecialClassInput) =>
    api.post<SpecialClass>('/admin/special-classes', input),
  updateSpecial: (id: number, input: Partial<SpecialClassInput>) =>
    api.patch<SpecialClass>(`/admin/special-classes/${id}`, input),
  removeSpecial: (id: number) => api.delete<{ id: number }>(`/admin/special-classes/${id}`),
}

export function useClassPerformance(examId?: number, classId?: number) {
  return useQuery({
    queryKey: performanceKeys.classes(examId, classId),
    queryFn: () => performanceApi.classes(examId, classId),
    placeholderData: keepPreviousData,
  })
}

export function useBelowAverage(
  sectionId: number | undefined,
  examId?: number,
  filter: BandFilter = {}
) {
  return useQuery({
    queryKey: performanceKeys.below(sectionId ?? 0, examId, filter),
    queryFn: () => performanceApi.below(sectionId!, examId, filter),
    enabled: Boolean(sectionId),
    placeholderData: keepPreviousData,
  })
}

export function useSpecialClasses(filter: { section_id?: number; teacher_user_id?: number } = {}) {
  return useQuery({
    queryKey: performanceKeys.specials(filter),
    queryFn: () => performanceApi.specials(filter),
    placeholderData: keepPreviousData,
  })
}

export function usePerformanceMutation<TInput, TResult>(fn: (input: TInput) => Promise<TResult>) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: fn,
    meta: { silent: true },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: performanceKeys.all })
      void queryClient.invalidateQueries({ queryKey: ['timetable'] })
    },
  })
}

export function useSpecialRoster(id: number | null, date: string) {
  return useQuery({
    queryKey: performanceKeys.roster(id ?? 0, date),
    queryFn: () => performanceApi.roster(id!, date),
    enabled: Boolean(id),
  })
}

export function useSpecialSettings() {
  return useQuery({ queryKey: performanceKeys.settings(), queryFn: performanceApi.settings })
}
