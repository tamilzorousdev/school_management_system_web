import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, type Paginated } from '@/lib/api/client'

export interface Ref {
  id: number
  name: string
}

export interface Period {
  start: string
  end: string
}

export type Behaviour = 'good' | 'bad'

export const RATING_MONTHS = [1, 2, 3, 6, 12] as const

export interface FeedbackSettings {
  teacher_rating_enabled: boolean
  teacher_rating_months: number
  student_feedback_enabled: boolean
  cycle: Period | null
  term: (Period & { id: number; name: string }) | null
}

export interface RatingSummary {
  ratings: number
  average_stars: number | null
  good: number
  bad: number
  good_percent: number | null
}

export interface RankingRow extends RatingSummary {
  rank: number | null
  teacher_user_id: number
  name: string
  designation: string | null
}

export interface Rating {
  id: number
  teacher: Ref
  parent: Ref
  student: Ref
  section: string | null
  stars: number
  stars_label: string
  behaviour: Behaviour
  remark: string | null
  cycle: Period
  created_at: string
}

export interface StudentFeedback {
  id: number
  term: Period & { id: number; name: string }
  teacher: Ref
  student: Ref
  section: string | null
  studies: number
  studies_label: string
  behaviour: number
  behaviour_label: string
  sports: number | null
  sports_label: string | null
  remark: string | null
  created_at: string
}

export interface TeacherClassResult {
  section_id: number
  section: string
  subject_id: number
  subject: string
  students: number
  papers: number
  pass_percent: number | null
  fail_percent: number | null
  average_percent: number | null
}

export interface TeacherReportRow {
  teacher_user_id: number
  name: string
  designation: string | null
  overall: {
    papers: number
    pass_percent: number | null
    fail_percent: number | null
    average_percent: number | null
  }
  classes: TeacherClassResult[]
  rating: RatingSummary
  remarks: string[]
}

export interface TeacherReport {
  exam: Ref | null
  teachers: TeacherReportRow[]
}

export interface RatingsParams {
  page: number
  limit: number
  search?: string
  teacher_user_id?: number
  behaviour?: Behaviour
  max_stars?: number
}

export interface StudentFeedbackParams {
  page: number
  limit: number
  search?: string
  teacher_user_id?: number
  section_id?: number
}

export interface FeedbackSettingsInput {
  teacher_rating_enabled?: boolean
  teacher_rating_months?: number
  student_feedback_enabled?: boolean
}

export const feedbackKeys = {
  all: ['feedback'] as const,
  settings: () => [...feedbackKeys.all, 'settings'] as const,
  ranking: () => [...feedbackKeys.all, 'ranking'] as const,
  ratings: (params: RatingsParams) => [...feedbackKeys.all, 'ratings', params] as const,
  students: (params: StudentFeedbackParams) => [...feedbackKeys.all, 'students', params] as const,
  report: (examId?: number, teacherId?: number) =>
    [...feedbackKeys.all, 'report', examId ?? 0, teacherId ?? 0] as const,
}

export const feedbackApi = {
  settings: () => api.get<FeedbackSettings>('/admin/feedback/settings'),
  saveSettings: (input: FeedbackSettingsInput) =>
    api.put<FeedbackSettings>('/admin/feedback/settings', input),
  ranking: () => api.get<RankingRow[]>('/admin/feedback/ranking'),
  ratings: (params: RatingsParams) =>
    api.get<Paginated<Rating>>('/admin/feedback/ratings', { ...params }),
  removeRating: (id: number) => api.delete<null>(`/admin/feedback/ratings/${id}`),
  students: (params: StudentFeedbackParams) =>
    api.get<Paginated<StudentFeedback>>('/admin/feedback/student-feedback', { ...params }),
  removeFeedback: (id: number) => api.delete<null>(`/admin/feedback/student-feedback/${id}`),
  report: (examId?: number, teacherId?: number) =>
    api.get<TeacherReport>('/admin/feedback/teacher-report', {
      exam_id: examId,
      teacher_user_id: teacherId,
    }),
}

export function useFeedbackSettings() {
  return useQuery({ queryKey: feedbackKeys.settings(), queryFn: feedbackApi.settings })
}

export function useTeacherRanking() {
  return useQuery({ queryKey: feedbackKeys.ranking(), queryFn: feedbackApi.ranking })
}

export function useRatings(params: RatingsParams) {
  return useQuery({
    queryKey: feedbackKeys.ratings(params),
    queryFn: () => feedbackApi.ratings(params),
    placeholderData: keepPreviousData,
  })
}

export function useStudentFeedback(params: StudentFeedbackParams) {
  return useQuery({
    queryKey: feedbackKeys.students(params),
    queryFn: () => feedbackApi.students(params),
    placeholderData: keepPreviousData,
  })
}

export function useTeacherReport(examId?: number, teacherId?: number) {
  return useQuery({
    queryKey: feedbackKeys.report(examId, teacherId),
    queryFn: () => feedbackApi.report(examId, teacherId),
    placeholderData: keepPreviousData,
  })
}

export function useFeedbackMutation<TInput, TResult>(fn: (input: TInput) => Promise<TResult>) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: fn,
    meta: { silent: true },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: feedbackKeys.all }),
  })
}
