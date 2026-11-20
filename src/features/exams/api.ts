import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, type Paginated } from '@/lib/api/client'

export type ExamStatus = 'draft' | 'published'
export type ResultStatus = 'pass' | 'fail' | 'incomplete'

export interface Ref {
  id: number
  name: string
}

export interface ExamRef {
  id: number
  name: string
  status: ExamStatus
  start_date: string
  end_date: string
  published_at: string | null
}

export interface Exam extends ExamRef {
  academic_year: Ref
  term: Ref | null
  classes: Ref[]
  paper_count: number
  marks_entered: number
  marks_expected: number
  created_at: string
}

export interface ExamPaper {
  id: number
  class: Ref
  subject_id: number
  subject_name: string
  subject_code: string
  max_marks: number
  pass_marks: number
  exam_date: string | null
  marks_entered: number
}

export interface ExamSection {
  id: number
  name: string
  student_count: number
}

export interface ExamClass {
  id: number
  name: string
  sections: ExamSection[]
  subjects: ExamPaper[]
}

export interface ExamDetail extends Exam {
  class_details: ExamClass[]
}

export interface ExamInput {
  name: string
  term_id?: number | null
  start_date: string
  end_date: string
  class_ids: number[]
  subjects?: PaperInput[]
}

export interface PaperInput {
  class_id: number
  subject_id: number
  max_marks: number
  pass_marks: number
  exam_date?: string | null
}

export interface MarkSubject {
  id: number
  name: string
  code: string
  max_marks: number
  pass_marks: number
  exam_date: string | null
}

export interface SectionRef {
  id: number
  name: string
  class_id: number
  class_name: string
  section_name: string
}

export interface MarkRow {
  student_id: number
  admission_no: string
  full_name: string
  roll_no: number | null
  marks: number | null
  is_absent: boolean
  entered: boolean
}

export interface MarksSheet {
  exam: ExamRef
  section: SectionRef
  subject: MarkSubject

  teacher?: { id: number; name: string } | null
  class_teacher?: { id: number; name: string } | null
  editable: boolean
  entered: number
  total: number
  students: MarkRow[]
}

export interface MarkEntry {
  student_id: number
  marks: number | null
  is_absent: boolean
}

export interface SubjectResult {
  subject_id: number
  marks: number | null
  is_absent: boolean
  passed: boolean | null
}

export interface ResultRow {
  student_id: number
  admission_no: string
  full_name: string
  roll_no: number | null
  section_id: number
  section_name: string
  total: number
  max_total: number
  percent: number | null
  grade: string | null
  result: ResultStatus
  section_rank: number | null
  class_rank: number | null
  percentile?: number | null
  subjects: SubjectResult[]
}

export interface ResultSummary {
  students: number
  ranked: number
  passed: number
  failed: number
  incomplete: number
  average_percent: number | null
  highest_percent: number | null
}

export interface SectionResults {
  exam: ExamRef
  section: SectionRef
  subjects: MarkSubject[]
  summary: ResultSummary
  rows: ResultRow[]
}

export interface Topper {
  rank: number
  student_id: number
  full_name: string
  admission_no: string
  section_id: number
  section_name: string
  total: number
  max_total: number
  percent: number
  grade: string
}

export interface ClassToppers {
  class_id: number
  class_name: string
  students: number
  toppers: Topper[]
}

export interface ExamToppers {
  exam: ExamRef
  classes: ClassToppers[]
}

export interface StudentSubjectResult extends SubjectResult {
  name: string
  code: string
  max_marks: number
  pass_marks: number
}

export interface StudentExamResult {
  exam: ExamRef
  class_name: string
  section_name: string
  total: number
  max_total: number
  percent: number | null
  grade: string | null
  result: ResultStatus
  section_rank: number | null
  section_size: number
  class_rank: number | null
  class_size: number
  percentile?: number | null
  subjects: StudentSubjectResult[]
}


export interface ExamHall {
  id: number
  school_id: number
  name: string
  building: string | null
  floor: string | null
  capacity: number
  rows_count: number
  columns_count: number
  is_active: boolean
  created_at: string
}

export interface CreateExamHallInput {
  name: string
  building?: string
  floor?: string
  capacity: number
  rows_count?: number
  columns_count?: number
  is_active?: boolean
}

export interface ExamSeatAllocation {
  id: number
  exam_id: number
  hall_id: number
  hall_name: string
  building: string | null
  floor: string | null
  student_id: number
  full_name: string
  admission_no: string
  roll_no: number | null
  class_name: string
  section_name: string
  seat_number: string
  desk_order: number
}

export interface AutoAllocateHallsInput {
  hall_ids: number[]
  strategy?: 'sequential' | 'alternate_section'
}

export interface AutoAllocateResult {
  total_students: number
  total_capacity: number
  allocated: number
  unallocated: number
  halls: {
    hall_id: number
    hall_name: string
    allocated_count: number
    capacity: number
  }[]
}

export interface ExamInvigilator {
  id: number
  exam_id: number
  hall_id: number
  hall_name: string
  teacher_user_id: number
  teacher_name: string
  teacher_phone?: string | null
  exam_date: string
  session: string
}

export interface AssignInvigilatorInput {
  hall_id: number
  teacher_user_id: number
  exam_date: string
  session?: string
}

export interface GradingTier {
  grade: string
  min_percentage: number
  max_percentage: number
  grade_point?: number
  description?: string
}

export interface GradingScale {
  id: number
  school_id: number
  board: string
  name: string
  is_default: boolean
  tiers: GradingTier[]
  created_at: string
}

export interface SaveGradingScaleInput {
  board: string
  name: string
  is_default?: boolean
  tiers: GradingTier[]
}

export interface ExamListParams {
  page: number
  limit: number
  search?: string
  status?: ExamStatus
  sort?: 'start_date' | 'published_at' | 'name' | 'created_at'
  order?: 'asc' | 'desc'
}

export const examKeys = {
  all: ['exams'] as const,
  list: (params: ExamListParams) => [...examKeys.all, 'list', params] as const,
  detail: (id: number) => [...examKeys.all, 'detail', id] as const,
  marks: (id: number, sectionId: number, subjectId: number) =>
    [...examKeys.all, 'marks', id, sectionId, subjectId] as const,
  results: (id: number, sectionId: number) => [...examKeys.all, 'results', id, sectionId] as const,
  classToppers: (id: number, classId: number) =>
    [...examKeys.all, 'class-toppers', id, classId] as const,
  toppers: (id: number) => [...examKeys.all, 'toppers', id] as const,
  latestPublished: () => [...examKeys.all, 'latest-published'] as const,
  student: (studentId: number) => [...examKeys.all, 'student', studentId] as const,
  halls: () => [...examKeys.all, 'halls'] as const,
  seating: (examId: number, hallId?: number) => [...examKeys.all, 'seating', examId, hallId] as const,
  invigilators: (examId: number) => [...examKeys.all, 'invigilators', examId] as const,
  gradingScales: () => [...examKeys.all, 'grading-scales'] as const,
}

export const examsApi = {
  list: (params: ExamListParams) => api.get<Paginated<Exam>>('/admin/exams', { ...params }),
  get: (id: number) => api.get<ExamDetail>(`/admin/exams/${id}`),
  create: (input: ExamInput) => api.post<ExamDetail>('/admin/exams', input),
  update: (id: number, input: Partial<ExamInput>) =>
    api.patch<ExamDetail>(`/admin/exams/${id}`, input),
  remove: (id: number) => api.delete<null>(`/admin/exams/${id}`),
  setSubjects: (id: number, items: PaperInput[]) =>
    api.put<ExamPaper[]>(`/admin/exams/${id}/subjects`, { items }),
  marks: (id: number, sectionId: number, subjectId: number) =>
    api.get<MarksSheet>(`/admin/exams/${id}/sections/${sectionId}/marks`, {
      subject_id: subjectId,
    }),
  saveMarks: (id: number, sectionId: number, subjectId: number, items: MarkEntry[]) =>
    api.put<MarksSheet>(`/admin/exams/${id}/sections/${sectionId}/marks?subject_id=${subjectId}`, {
      items,
    }),
  results: (id: number, sectionId: number) =>
    api.get<SectionResults>(`/admin/exams/${id}/sections/${sectionId}/results`),
  classToppers: (id: number, classId: number) =>
    api.get<ClassToppers>(`/admin/exams/${id}/classes/${classId}/toppers`, { limit: 3 }),
  toppers: (id: number) => api.get<ExamToppers>(`/admin/exams/${id}/toppers`, { limit: 3 }),
  publish: (id: number) => api.post<ExamDetail>(`/admin/exams/${id}/publish`),
  studentResults: (studentId: number) =>
    api.get<StudentExamResult[]>(`/admin/students/${studentId}/results`),
  // Halls
  listHalls: () => api.get<ExamHall[]>('/admin/exams/halls'),
  createHall: (input: CreateExamHallInput) => api.post<ExamHall>('/admin/exams/halls', input),
  updateHall: (hallId: number, input: Partial<CreateExamHallInput>) =>
    api.put<ExamHall>(`/admin/exams/halls/${hallId}`, input),
  deleteHall: (hallId: number) => api.delete<null>(`/admin/exams/halls/${hallId}`),
  // Seating
  seating: (examId: number, hallId?: number) =>
    api.get<ExamSeatAllocation[]>(`/admin/exams/${examId}/seating`, hallId ? { hall_id: hallId } : undefined),
  autoAllocate: (examId: number, input: AutoAllocateHallsInput) =>
    api.post<AutoAllocateResult>(`/admin/exams/${examId}/seating/auto-allocate`, input),
  clearSeating: (examId: number) => api.delete<null>(`/admin/exams/${examId}/seating`),
  // Invigilators
  invigilators: (examId: number) => api.get<ExamInvigilator[]>(`/admin/exams/${examId}/invigilators`),
  assignInvigilator: (examId: number, input: AssignInvigilatorInput) =>
    api.post<ExamInvigilator>(`/admin/exams/${examId}/invigilators`, input),
  deleteInvigilator: (examId: number, invigilatorId: number) =>
    api.delete<null>(`/admin/exams/${examId}/invigilators/${invigilatorId}`),
  // Grading scales
  listGradingScales: () => api.get<GradingScale[]>('/admin/exams/grading-scales'),
  saveGradingScale: (input: SaveGradingScaleInput) =>
    api.post<GradingScale>('/admin/exams/grading-scales', input),
  setDefaultGradingScale: (scaleId: number) =>
    api.put<null>(`/admin/exams/grading-scales/${scaleId}/set-default`),
  deleteGradingScale: (scaleId: number) =>
    api.delete<null>(`/admin/exams/grading-scales/${scaleId}`),
}

export function useExams(params: ExamListParams) {
  return useQuery({
    queryKey: examKeys.list(params),
    queryFn: () => examsApi.list(params),
    placeholderData: keepPreviousData,
  })
}

export function useExamOptions() {
  return useExams({ page: 1, limit: 100 })
}

export function useExam(id: number | undefined) {
  return useQuery({
    queryKey: examKeys.detail(id ?? 0),
    queryFn: () => examsApi.get(id!),
    enabled: Boolean(id),
    placeholderData: keepPreviousData,
  })
}

export function useMarksSheet(id?: number, sectionId?: number, subjectId?: number) {
  return useQuery({
    queryKey: examKeys.marks(id ?? 0, sectionId ?? 0, subjectId ?? 0),
    queryFn: () => examsApi.marks(id!, sectionId!, subjectId!),
    enabled: Boolean(id && sectionId && subjectId),
  })
}

export function useSectionResults(id?: number, sectionId?: number) {
  return useQuery({
    queryKey: examKeys.results(id ?? 0, sectionId ?? 0),
    queryFn: () => examsApi.results(id!, sectionId!),
    enabled: Boolean(id && sectionId),
    placeholderData: keepPreviousData,
  })
}

export function useClassToppers(id?: number, classId?: number) {
  return useQuery({
    queryKey: examKeys.classToppers(id ?? 0, classId ?? 0),
    queryFn: () => examsApi.classToppers(id!, classId!),
    enabled: Boolean(id && classId),
    placeholderData: keepPreviousData,
  })
}

export function useLatestToppers(enabled = true) {
  return useQuery({
    queryKey: examKeys.latestPublished(),
    queryFn: async () => {
      const page = await examsApi.list({
        page: 1,
        limit: 1,
        status: 'published',
        sort: 'published_at',
      })
      const latest = page.items[0]
      return latest ? examsApi.toppers(latest.id) : null
    },
    enabled,
  })
}

export function useStudentResults(studentId: number) {
  return useQuery({
    queryKey: examKeys.student(studentId),
    queryFn: () => examsApi.studentResults(studentId),
  })
}

export function useExamMutation<TInput, TResult>(fn: (input: TInput) => Promise<TResult>) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: fn,
    meta: { silent: true },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: examKeys.all })
    },
  })
}


export function useExamHalls() {
  return useQuery({
    queryKey: examKeys.halls(),
    queryFn: () => examsApi.listHalls(),
  })
}

export function useCreateExamHall() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateExamHallInput) => examsApi.createHall(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: examKeys.halls() }),
  })
}

export function useUpdateExamHall() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...input }: { id: number } & Partial<CreateExamHallInput>) =>
      examsApi.updateHall(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: examKeys.halls() }),
  })
}

export function useDeleteExamHall() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => examsApi.deleteHall(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: examKeys.halls() }),
  })
}

export function useExamSeating(examId?: number, hallId?: number) {
  return useQuery({
    queryKey: examKeys.seating(examId ?? 0, hallId),
    queryFn: () => examsApi.seating(examId!, hallId),
    enabled: Boolean(examId),
  })
}

export function useAutoAllocateSeats() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ examId, ...input }: { examId: number } & AutoAllocateHallsInput) =>
      examsApi.autoAllocate(examId, input),
    onSuccess: (_data, vars) => qc.invalidateQueries({ queryKey: examKeys.seating(vars.examId) }),
  })
}

export function useClearSeating() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (examId: number) => examsApi.clearSeating(examId),
    onSuccess: (_data, examId) => qc.invalidateQueries({ queryKey: examKeys.seating(examId) }),
  })
}

export function useExamInvigilators(examId?: number) {
  return useQuery({
    queryKey: examKeys.invigilators(examId ?? 0),
    queryFn: () => examsApi.invigilators(examId!),
    enabled: Boolean(examId),
  })
}

export function useAssignInvigilator() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ examId, ...input }: { examId: number } & AssignInvigilatorInput) =>
      examsApi.assignInvigilator(examId, input),
    onSuccess: (_data, vars) =>
      qc.invalidateQueries({ queryKey: examKeys.invigilators(vars.examId) }),
  })
}

export function useDeleteInvigilator() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ examId, invigilatorId }: { examId: number; invigilatorId: number }) =>
      examsApi.deleteInvigilator(examId, invigilatorId),
    onSuccess: (_data, vars) =>
      qc.invalidateQueries({ queryKey: examKeys.invigilators(vars.examId) }),
  })
}

export function useGradingScales() {
  return useQuery({
    queryKey: examKeys.gradingScales(),
    queryFn: () => examsApi.listGradingScales(),
  })
}

export function useSaveGradingScale() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: SaveGradingScaleInput) => examsApi.saveGradingScale(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: examKeys.gradingScales() }),
  })
}

export function useSetDefaultGradingScale() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (scaleId: number) => examsApi.setDefaultGradingScale(scaleId),
    onSuccess: () => qc.invalidateQueries({ queryKey: examKeys.gradingScales() }),
  })
}

export function useDeleteGradingScale() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (scaleId: number) => examsApi.deleteGradingScale(scaleId),
    onSuccess: () => qc.invalidateQueries({ queryKey: examKeys.gradingScales() }),
  })
}
