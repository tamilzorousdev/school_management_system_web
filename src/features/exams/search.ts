import { z } from 'zod'

export const EXAM_TABS = ['exams', 'marks', 'results', 'halls', 'grading'] as const
export type ExamTab = (typeof EXAM_TABS)[number]

export const EXAM_STATUS_FILTERS = ['draft', 'published'] as const

export const RESULT_FILTERS = ['pass', 'fail', 'incomplete', 'below_average'] as const
export type ResultFilter = (typeof RESULT_FILTERS)[number]

const id = z.coerce.number().int().min(1).optional().catch(undefined)

export const examsSearchSchema = z.object({
  tab: z.enum(EXAM_TABS).catch('exams'),
  page: z.coerce.number().int().min(1).optional().catch(undefined),
  search: z.string().optional().catch(undefined),
  status: z.enum(EXAM_STATUS_FILTERS).optional().catch(undefined),
  exam_id: id,
  section_id: id,
  subject_id: id,
  result: z.enum(RESULT_FILTERS).optional().catch(undefined),
})

export type ExamsSearch = z.infer<typeof examsSearchSchema>
