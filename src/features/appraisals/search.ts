import { z } from 'zod'

const id = z.coerce.number().int().min(1).optional().catch(undefined)

export const appraisalsSearchSchema = z.object({
  page: z.coerce.number().int().min(1).catch(1),
  academic_year_id: id,
  staff_id: id,
  status: z.enum(['draft', 'submitted', 'reviewed', 'appealed', 'finalized']).optional().catch(undefined),
  rating: z
    .enum([
      'outstanding',
      'exceeds_expectations',
      'meets_expectations',
      'needs_improvement',
      'unsatisfactory',
    ])
    .optional()
    .catch(undefined),
  sort: z.enum(['review_date', 'created_at']).optional().catch(undefined),
  order: z.enum(['asc', 'desc']).optional().catch(undefined),
  appraisal: id,
})

export type AppraisalsSearch = z.infer<typeof appraisalsSearchSchema>
