import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, type Paginated, type QueryParams } from '@/lib/api/client'

export type QuizStatus = 'draft' | 'pending_approval' | 'approved' | 'rejected'

export interface QuizOption {
  key: string
  text: string
}

export type QuizQuestionType = 'single_choice' | 'multiple_choice' | 'true_false'

export interface QuizQuestion {
  id: number
  quiz_id: number
  question_text: string
  question_type: QuizQuestionType
  options: QuizOption[]
  correct_option: string
  explanation: string | null
  marks: number
  sequence: number
}

export interface OnlineQuiz {
  id: number
  school_id: number
  section_id: number
  subject_id: number
  title: string
  description: string | null
  instructions: string | null
  duration_minutes: number
  start_at: string
  end_at: string
  total_marks: number
  pass_percentage: number | null
  pass_marks: number | null
  expire_on_exit?: boolean
  require_camera?: boolean
  require_microphone?: boolean
  status: QuizStatus
  rejection_reason: string | null
  approved_at: string | null
  approved_by: { id: number; name: string } | null
  created_at: string
  updated_at: string
  class?: { id: number; name: string } | null
  section?: { id: number; name: string } | null
  subject?: { id: number; name: string; code: string } | null
  teacher?: { id: number; name: string } | null
  questions?: QuizQuestion[]
  questions_count?: number
  attempts_count?: number
}

export interface QuizQuestionStat {
  question_id: number
  sequence: number
  question_text: string
  correct_option: string
  total_answers: number
  correct_count: number
  accuracy_percent: number
}

export type QuizAttendance = 'attended' | 'in_progress' | 'not_attended'

export interface QuizStudentResult {
  student_id: number
  full_name: string
  roll_number: number | null
  status: string
  attendance: QuizAttendance
  score: number
  percentage: number
  passed: boolean | null
  submitted_at: string | null
  auto_submitted: boolean
}

export interface QuizAnalytics {
  quiz: {
    id: number
    title: string
    status: QuizStatus
    subject?: string
    class_section: string
    class_name: string
    section_name: string
    total_marks: number
    pass_marks: number | null
    duration_minutes: number
    start_at: string
    end_at: string
  }
  summary: {
    total_enrolled: number
    attended_count: number
    not_attended_count: number
    in_progress_count: number
    completed_count: number
    expired_count: number
    average_score: number
    highest_score: number
    pass_percent: number | null
  }
  students: QuizStudentResult[]
  questions: QuizQuestionStat[]
}

export interface QuizQuery extends QueryParams {
  status?: string
  class_id?: number
  section_id?: number
  subject_id?: number
  teacher_id?: number
  search?: string
  page?: number
  limit?: number
}

export const quizzesApi = {
  list: (params: QuizQuery) => api.get<Paginated<OnlineQuiz>>('/admin/quizzes', params),
  get: (id: number) => api.get<OnlineQuiz>(`/admin/quizzes/${id}`),
  update: (id: number, data: Partial<OnlineQuiz> & { questions?: unknown[] }) =>
    api.patch<OnlineQuiz>(`/admin/quizzes/${id}`, data),
  remove: (id: number) => api.delete<{ deleted: true; attempts: number }>(`/admin/quizzes/${id}`),
  approve: (id: number) => api.post<OnlineQuiz>(`/admin/quizzes/${id}/approve`),
  reject: (id: number, rejection_reason: string) =>
    api.post<OnlineQuiz>(`/admin/quizzes/${id}/reject`, { reason: rejection_reason }),
  analytics: (id: number) => api.get<QuizAnalytics>(`/admin/quizzes/${id}/analytics`),
}

export function useQuizzes(params: QuizQuery) {
  return useQuery({
    queryKey: ['quizzes', params],
    queryFn: () => quizzesApi.list(params),
    placeholderData: keepPreviousData,
  })
}

export function useQuiz(id: number | null | undefined) {
  return useQuery({
    queryKey: ['quizzes', id],
    queryFn: () => (id ? quizzesApi.get(id) : null),
    enabled: Boolean(id),
  })
}

export function useQuizAnalytics(id: number | null | undefined) {
  return useQuery({
    queryKey: ['quizzes', id, 'analytics'],
    queryFn: () => (id ? quizzesApi.analytics(id) : null),
    enabled: Boolean(id),
  })
}

export function useQuizActionMutation<TVariables>(
  mutationFn: (variables: TVariables) => Promise<unknown>
) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['quizzes'] })
    },
  })
}
