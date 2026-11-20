import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, http, type ApiEnvelope, type Paginated } from '@/lib/api/client'
import type { StaffGroup } from '@/features/emergency/api'

export interface Ref {
  id: number
  name: string
}

export type SurveyStatus = 'draft' | 'scheduled' | 'open' | 'closed'
export type SurveyAudience = 'everyone' | 'parents' | 'staff' | 'classes' | 'sections'
export type QuestionType =
  'single_choice' | 'multi_choice' | 'rating' | 'short_text' | 'long_text' | 'date' | 'number'
export type ResultRole = 'parent' | 'staff'

export interface SurveyQuestion {
  id: number
  type: QuestionType
  text: string
  options: string[]
  is_required: boolean
  sort_order: number
}

export interface QuestionInput {
  type: QuestionType
  text: string
  options?: string[]
  is_required: boolean
}

export interface SurveyCounts {
  recipients: number
  answered: number
  response_rate: number | null
}

export interface Survey {
  id: number
  title: string
  description: string | null
  status: SurveyStatus
  audience: SurveyAudience
  class_ids: number[]
  section_ids: number[]
  staff_groups: StaffGroup[]
  audience_label: string
  is_anonymous: boolean
  per_child: boolean
  send_at: string | null
  closes_at: string | null
  sent_at: string | null
  closed_at: string | null
  questions: SurveyQuestion[]
  counts: SurveyCounts
  locked: boolean
  created_by: Ref | null
  created_at: string
}

export interface SurveyInput {
  title?: string
  description?: string
  audience?: SurveyAudience
  class_ids?: number[]
  section_ids?: number[]
  staff_groups?: StaffGroup[]
  is_anonymous?: boolean
  per_child?: boolean
  questions?: QuestionInput[]
}

export interface SurveyAudienceInput {
  audience: SurveyAudience
  class_ids?: number[]
  section_ids?: number[]
  staff_groups?: StaffGroup[]
  per_child?: boolean
}

export interface SurveyPreview {
  recipients: number
  people: number
  parents: number
  staff: number
  without_app: number
}

export interface SurveyInsights {
  open: number
  drafts: number
  answers_this_month: number
  average_response_rate: number | null
}

export interface ChoiceResult {
  option: string
  count: number
  percent: number
}

export interface WrittenAnswer {
  value: string
  name?: string
  class_section?: string | null
}

export interface QuestionResult {
  id: number
  type: QuestionType
  text: string
  answered: number
  choices?: ChoiceResult[]
  rating?: { average: number | null; counts: Record<string, number> }
  number?: { average: number | null; min: number | null; max: number | null }
  answers?: WrittenAnswer[]
}

export interface SurveyResults {
  survey: Survey
  counts: SurveyCounts
  questions: QuestionResult[]
}

export interface NotAnswered {
  id: number
  name: string
  role: 'parent' | 'staff' | 'both'
  student: Ref | null
  class_section: string | null
  reminded_at: string | null
}

export interface TemplateQuestion {
  type: QuestionType
  text: string
  options: string[]
  is_required: boolean
}

export interface SurveyTemplate {
  id: number
  key: string | null
  title: string
  description: string | null
  questions: TemplateQuestion[]
  is_active: boolean
  sort_order: number
}

export interface TemplateInput {
  title: string
  description?: string
  questions: QuestionInput[]
  is_active?: boolean
}

export interface SurveyListParams {
  page: number
  limit: number
  search?: string
  status?: SurveyStatus
}

export interface ResultFilters {
  class_id?: number
  section_id?: number
  role?: ResultRole
  search?: string
}

export interface NotAnsweredParams extends ResultFilters {
  page: number
  limit: number
}

export interface Saved<T> {
  data: T
  message: string
}

const write = <T>(method: 'post' | 'patch' | 'delete', url: string, body?: unknown) =>
  http
    .request<ApiEnvelope<T>>({ method, url, data: body })
    .then(({ data }): Saved<T> => ({ data: data.data, message: data.message }))

export const surveyKeys = {
  all: ['surveys'] as const,
  list: (params: SurveyListParams) => [...surveyKeys.all, 'list', params] as const,
  insights: () => [...surveyKeys.all, 'insights'] as const,
  detail: (id: number) => [...surveyKeys.all, 'detail', id] as const,
  results: (id: number, filters: ResultFilters) =>
    [...surveyKeys.all, 'results', id, filters] as const,
  notAnswered: (id: number, params: NotAnsweredParams) =>
    [...surveyKeys.all, 'not-answered', id, params] as const,
  preview: (input: SurveyAudienceInput) => [...surveyKeys.all, 'preview', input] as const,
  templates: (all: boolean) => [...surveyKeys.all, 'templates', all] as const,
}

export const surveysApi = {
  list: (params: SurveyListParams) => api.get<Paginated<Survey>>('/admin/surveys', { ...params }),
  insights: () => api.get<SurveyInsights>('/admin/surveys/insights'),
  detail: (id: number) => api.get<Survey>(`/admin/surveys/${id}`),
  create: (input: SurveyInput) => write<Survey>('post', '/admin/surveys', input),
  update: ({ id, ...input }: SurveyInput & { id: number }) =>
    write<Survey>('patch', `/admin/surveys/${id}`, input),
  remove: (id: number) => write<null>('delete', `/admin/surveys/${id}`),
  preview: (input: SurveyAudienceInput) => api.post<SurveyPreview>('/admin/surveys/preview', input),
  send: ({ id, ...input }: { id: number; send_at?: string; closes_at: string }) =>
    write<Survey>('post', `/admin/surveys/${id}/send`, input),
  close: (id: number) => write<Survey>('post', `/admin/surveys/${id}/close`),
  extend: ({ id, closes_at }: { id: number; closes_at: string }) =>
    write<Survey>('post', `/admin/surveys/${id}/extend`, { closes_at }),
  remind: (id: number) => write<{ reminded: number }>('post', `/admin/surveys/${id}/remind`),
  results: (id: number, filters: ResultFilters) =>
    api.get<SurveyResults>(`/admin/surveys/${id}/results`, { ...filters }),
  notAnswered: (id: number, params: NotAnsweredParams) =>
    api.get<Paginated<NotAnswered>>(`/admin/surveys/${id}/not-answered`, { ...params }),
  exportUrl: (id: number) => `/admin/surveys/${id}/export`,
  templates: (all: boolean) =>
    api.get<SurveyTemplate[]>('/admin/surveys/templates', all ? { all: true } : undefined),
  createTemplate: (input: TemplateInput) =>
    write<SurveyTemplate>('post', '/admin/surveys/templates', input),
  updateTemplate: ({ id, ...input }: Partial<TemplateInput> & { id: number }) =>
    write<SurveyTemplate>('patch', `/admin/surveys/templates/${id}`, input),
  removeTemplate: (id: number) => write<null>('delete', `/admin/surveys/templates/${id}`),
}

export function useSurveys(params: SurveyListParams) {
  return useQuery({
    queryKey: surveyKeys.list(params),
    queryFn: () => surveysApi.list(params),
    placeholderData: keepPreviousData,
  })
}

export function useSurveyInsights() {
  return useQuery({ queryKey: surveyKeys.insights(), queryFn: surveysApi.insights })
}

export function useSurvey(id: number | undefined) {
  return useQuery({
    queryKey: surveyKeys.detail(id ?? 0),
    queryFn: () => surveysApi.detail(id!),
    enabled: Boolean(id),
  })
}

export function useSurveyResults(id: number, filters: ResultFilters, enabled = true) {
  return useQuery({
    queryKey: surveyKeys.results(id, filters),
    queryFn: () => surveysApi.results(id, filters),
    placeholderData: keepPreviousData,
    enabled,
  })
}

export function useSurveyNotAnswered(id: number, params: NotAnsweredParams, enabled: boolean) {
  return useQuery({
    queryKey: surveyKeys.notAnswered(id, params),
    queryFn: () => surveysApi.notAnswered(id, params),
    placeholderData: keepPreviousData,
    enabled,
  })
}

export function useSurveyPreview(input: SurveyAudienceInput | null) {
  return useQuery({
    queryKey: surveyKeys.preview(input ?? { audience: 'parents' }),
    queryFn: () => surveysApi.preview(input!),
    enabled: Boolean(input),
    placeholderData: keepPreviousData,
    meta: { silent: true },
  })
}

export function useSurveyTemplates(all = false) {
  return useQuery({
    queryKey: surveyKeys.templates(all),
    queryFn: () => surveysApi.templates(all),
  })
}

export function useSurveyMutation<TInput, TResult>(fn: (input: TInput) => Promise<TResult>) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: fn,
    meta: { silent: true },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: surveyKeys.all }),
  })
}
