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

export interface BelowAverage {
  section: Ref
  exam: Ref | null
  section_average: number | null
  line: number | null
  students: BelowAverageStudent[]
}

export interface SpecialClass {
  id: number
  title: string
  notes: string | null
  section: Ref
  subject: Ref | null
  teacher: Ref
  day_of_week: number
  day: string
  period_no: number
  start_time: string | null
  end_time: string | null
  students: { id: number; name: string; roll_no: number | null }[]
}

export interface SpecialClassInput {
  section_id: number
  subject_id: number | null
  teacher_user_id: number
  day_of_week: number
  period_no: number
  title: string
  notes: string | null
  student_ids: number[]
}

export const performanceKeys = {
  all: ['performance'] as const,
  classes: (examId?: number, classId?: number) =>
    [...performanceKeys.all, 'classes', examId ?? 0, classId ?? 0] as const,
  below: (sectionId: number, examId?: number, below?: number) =>
    [...performanceKeys.all, 'below', sectionId, examId ?? 0, below ?? 0] as const,
  specials: (sectionId?: number) => [...performanceKeys.all, 'specials', sectionId ?? 0] as const,
}

export const performanceApi = {
  classes: (examId?: number, classId?: number) =>
    api.get<ClassPerformance>('/admin/performance/classes', { exam_id: examId, class_id: classId }),
  below: (sectionId: number, examId?: number, below?: number) =>
    api.get<BelowAverage>(`/admin/performance/sections/${sectionId}/below-average`, {
      exam_id: examId,
      below,
    }),
  specials: (sectionId?: number) =>
    api.get<SpecialClass[]>('/admin/special-classes', { section_id: sectionId }),
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

export function useBelowAverage(sectionId: number | undefined, examId?: number, below?: number) {
  return useQuery({
    queryKey: performanceKeys.below(sectionId ?? 0, examId, below),
    queryFn: () => performanceApi.below(sectionId!, examId, below),
    enabled: Boolean(sectionId),
    placeholderData: keepPreviousData,
  })
}

export function useSpecialClasses(sectionId?: number) {
  return useQuery({
    queryKey: performanceKeys.specials(sectionId),
    queryFn: () => performanceApi.specials(sectionId),
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
