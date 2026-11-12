import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api/client'

export interface Ref {
  id: number
  name: string
}

export interface SubjectRef extends Ref {
  code: string
}

export interface BellPeriod {
  id: number
  class_id?: number | null
  period_no: number | null
  name: string
  start_time: string
  end_time: string
  is_break: boolean
}

export interface BellPeriodInput {
  name: string
  start_time: string
  end_time: string
  is_break?: boolean
}

export interface Slot {
  id: number
  day_of_week: number
  period_no: number
  section: Ref
  subject: SubjectRef
  teacher: Ref | null
  room: string | null
}

export interface SubjectPlan {
  subject: SubjectRef
  required: number
  scheduled: number
  teacher: Ref | null
}

export interface SectionTimetable {
  section: Ref
  room: string | null
  days: number[]
  periods: BellPeriod[]
  slots: Slot[]
  plan: SubjectPlan[]
}

export interface TeacherTimetable {
  teacher: Ref
  periods: BellPeriod[]
  slots: Slot[]
  periods_per_week: number
}

export interface WorkloadRow {
  teacher: Ref
  department: string | null
  scheduled: number
  assigned: number
  max_periods_per_week: number
  by_day: number[]
  free: number
  overloaded: boolean
}

export interface Workload {
  periods_in_week: number
  average_scheduled: number
  overloaded: number
  unscheduled: number
  teachers: WorkloadRow[]
}

export interface SlotInput {
  day_of_week: number
  period_no: number
  subject_id: number
  teacher_user_id?: number | null
  room?: string | null
}

export const timetableKeys = {
  all: ['timetable'] as const,
  periods: (classId?: number) => [...timetableKeys.all, 'periods', classId ?? 'default'] as const,
  section: (id: number) => [...timetableKeys.all, 'section', id] as const,
  teacher: (id: number) => [...timetableKeys.all, 'teacher', id] as const,
  workload: () => [...timetableKeys.all, 'workload'] as const,
}

export const timetableApi = {
  periods: (classId?: number) =>
    api.get<BellPeriod[]>('/admin/timetable/periods', { class_id: classId }),
  savePeriods: (items: BellPeriodInput[], classId?: number | null) =>
    api.put<BellPeriod[]>('/admin/timetable/periods', { items, class_id: classId }),
  resetClassPeriods: (classId: number) =>
    api.delete<BellPeriod[]>(`/admin/timetable/classes/${classId}/periods`),
  section: (id: number) => api.get<SectionTimetable>(`/admin/timetable/sections/${id}`),
  setSlot: (sectionId: number, input: SlotInput) =>
    api.put<SectionTimetable>(`/admin/timetable/sections/${sectionId}/slots`, input),
  clearSlot: (sectionId: number, dayOfWeek: number, periodNo: number) =>
    api.delete<SectionTimetable>(`/admin/timetable/sections/${sectionId}/slots`, {
      day_of_week: dayOfWeek,
      period_no: periodNo,
    }),
  teacher: (userId: number) => api.get<TeacherTimetable>(`/admin/timetable/teachers/${userId}`),
  workload: () => api.get<Workload>('/admin/timetable/workload'),
}

export function useBellSchedule(classId?: number) {
  return useQuery({
    queryKey: timetableKeys.periods(classId),
    queryFn: () => timetableApi.periods(classId),
  })
}

export function useSectionTimetable(id: number | undefined) {
  return useQuery({
    queryKey: timetableKeys.section(id ?? 0),
    queryFn: () => timetableApi.section(id!),
    enabled: Boolean(id),
    placeholderData: keepPreviousData,
  })
}

export function useTeacherTimetable(userId: number | undefined) {
  return useQuery({
    queryKey: timetableKeys.teacher(userId ?? 0),
    queryFn: () => timetableApi.teacher(userId!),
    enabled: Boolean(userId),
    placeholderData: keepPreviousData,
  })
}

export function useWorkload() {
  return useQuery({ queryKey: timetableKeys.workload(), queryFn: timetableApi.workload })
}

export function useTimetableMutation<TInput, TResult>(fn: (input: TInput) => Promise<TResult>) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: fn,
    meta: { silent: true },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: timetableKeys.all })
    },
  })
}
