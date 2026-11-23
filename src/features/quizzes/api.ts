import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, type Paginated, type QueryParams } from '@/lib/api/client'

export type QuizStatus = 'draft' | 'pending_approval' | 'approved' | 'rejected'

export interface QuizOption {
  key: string
  text: string
}

export interface QuizQuestion {
  id: number
  quiz_id: number
  question_text: string
  question_type: string
  options: QuizOption[]
  correct_option: string
  explanation: string | null
  marks: number
  order_index: number
}

export interface OnlineQuiz {
  id: number
  school_id: number
  class_id: number
  section_id: number
  subject_id: number
  teacher_id: number
  title: string
  description: string | null
  instructions: string | null
  duration_minutes: number
  start_at: string
  end_at: string
  total_marks: number
  pass_percentage: number
  expire_on_exit?: boolean
  require_camera?: boolean
  require_microphone?: boolean
  status: QuizStatus
  rejection_reason: string | null
  approved_at: string | null
  approved_by: number | null
  created_at: string
  updated_at: string
  class?: { id: number; name: string }
  section?: { id: number; name: string }
  subject?: { id: number; name: string; code: string }
  teacher?: { id: number; first_name: string; last_name: string }
  questions?: QuizQuestion[]
  questions_count?: number
}

export interface QuizQuestionStat {
  question_id: number
  question_text: string
  marks: number
  correct_count: number
  total_attempts: number
  success_rate: number
}

export interface QuizAnalytics {
  quiz_id: number
  title: string
  total_students: number
  total_submissions: number
  completed_count: number
  expired_count: number
  average_score: number
  highest_score: number
  lowest_score: number
  pass_count: number
  fail_count: number
  pass_percentage: number
  question_stats: QuizQuestionStat[]
}

export interface CreateQuizQuestionInput {
  sequence?: number
  question_text: string
  options: { key: string; text: string }[]
  correct_option: string
  explanation?: string | null
  marks?: number
}

export interface CreateQuizInput {
  academic_year_id?: number
  section_id: number
  subject_id: number
  teacher_user_id?: number
  title: string
  description?: string | null
  instructions?: string | null
  pass_marks?: number
  duration_minutes: number
  start_at: string
  end_at: string
  expire_on_exit?: boolean
  require_camera?: boolean
  require_microphone?: boolean
  status?: 'draft' | 'approved'
  questions: CreateQuizQuestionInput[]
}

export interface StaffQuizPermissionItem {
  staff_id: number
  user_id: number
  name: string
  employee_no: string
  designation: string
  department: string | null
  staff_type: string
  has_permission: boolean
}

export interface QuizPermissionsResponse {
  can_manage: boolean
  can_create: boolean
  allow_all_teachers: boolean
  permitted_user_ids: number[]
  staff: StaffQuizPermissionItem[]
}

export interface UpdateQuizPermissionsInput {
  allow_all_teachers?: boolean
  permitted_user_ids?: number[]
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
  create: (data: CreateQuizInput) => api.post<OnlineQuiz>('/admin/quizzes', data),
  remove: (id: number) => api.delete<{ message: string }>(`/admin/quizzes/${id}`),
  update: (id: number, data: Partial<OnlineQuiz> & { questions?: unknown[] }) =>
    api.put<OnlineQuiz>(`/admin/quizzes/${id}`, data),
  approve: (id: number) => api.post<OnlineQuiz>(`/admin/quizzes/${id}/approve`),
  reject: (id: number, rejection_reason: string) =>
    api.post<OnlineQuiz>(`/admin/quizzes/${id}/reject`, { rejection_reason }),
  analytics: (id: number) => api.get<QuizAnalytics>(`/admin/quizzes/${id}/analytics`),
  getPermissions: () => api.get<QuizPermissionsResponse>('/admin/quizzes/permissions'),
  updatePermissions: (data: UpdateQuizPermissionsInput) =>
    api.post<QuizPermissionsResponse>('/admin/quizzes/permissions', data),
}

export function useQuizPermissions() {
  return useQuery({
    queryKey: ['quizzes', 'permissions'],
    queryFn: () => quizzesApi.getPermissions(),
  })
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

