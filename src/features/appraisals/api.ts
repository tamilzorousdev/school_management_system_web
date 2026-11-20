import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, type Paginated } from '@/lib/api/client'

export type AppraisalStatus = 'draft' | 'submitted' | 'reviewed' | 'appealed' | 'finalized'
export type OverallRating =
  | 'outstanding'
  | 'exceeds_expectations'
  | 'meets_expectations'
  | 'needs_improvement'
  | 'unsatisfactory'
export type AppraisalRecommendation = 'increment' | 'promotion' | 'retention' | 'pip'

interface Ref {
  id: number
  name: string
}

export interface AppraisalScores {
  teaching_effectiveness: number
  student_outcomes: number
  classroom_management: number
  professional_conduct: number
  extracurricular_contribution: number
}

export interface StaffAppraisal extends AppraisalScores {
  id: number
  academic_year_id: number
  staff_id: number
  user_id: number
  staff: Ref
  employee_no: string
  designation: string
  department: string | null
  reviewer: Ref
  period: string
  review_date: string
  status: AppraisalStatus
  overall_score: number
  overall_rating: OverallRating
  strengths: string | null
  areas_for_improvement: string | null
  goals_next_period: string | null
  reviewer_remarks: string | null
  staff_remarks: string | null
  recommendation: AppraisalRecommendation
  increment_percent: number
  finalized_at: string | null
  created_at: string
}

export interface AppraisalInput extends AppraisalScores {
  academic_year_id: number
  staff_id: number
  period: string
  review_date: string
  strengths?: string
  areas_for_improvement?: string
  goals_next_period?: string
  reviewer_remarks?: string
  recommendation?: AppraisalRecommendation
  increment_percent?: number
}

export interface AppraisalListParams {
  page: number
  limit: number
  academic_year_id?: number
  status?: AppraisalStatus
  rating?: OverallRating
  staff_id?: number
  sort?: string
  order?: 'asc' | 'desc'
}

export const appraisalKeys = {
  all: ['staff-appraisals'] as const,
  list: (params: AppraisalListParams) => [...appraisalKeys.all, 'list', params] as const,
  detail: (id: number) => [...appraisalKeys.all, 'detail', id] as const,
}

export const appraisalsApi = {
  list: (params: AppraisalListParams) =>
    api.get<Paginated<StaffAppraisal>>('/admin/staff-appraisals', { ...params }),
  detail: (id: number) => api.get<StaffAppraisal>(`/admin/staff-appraisals/${id}`),
  create: (input: AppraisalInput) => api.post<StaffAppraisal>('/admin/staff-appraisals', input),
  update: (id: number, input: AppraisalInput) =>
    api.put<StaffAppraisal>(`/admin/staff-appraisals/${id}`, input),
  finalize: (id: number) => api.post<StaffAppraisal>(`/admin/staff-appraisals/${id}/finalize`, {}),
}

export function useAppraisals(params: AppraisalListParams) {
  return useQuery({
    queryKey: appraisalKeys.list(params),
    queryFn: () => appraisalsApi.list(params),
    placeholderData: keepPreviousData,
  })
}

export function useAppraisal(id: number | null) {
  return useQuery({
    queryKey: appraisalKeys.detail(id ?? 0),
    queryFn: () => appraisalsApi.detail(id ?? 0),
    enabled: Boolean(id),
  })
}

export function useAppraisalAction<TInput, TResult>(fn: (input: TInput) => Promise<TResult>) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: fn,
    meta: { silent: true },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: appraisalKeys.all }),
  })
}
