import { z } from 'zod'

export const ALUMNI_TABS = ['alumni', 'submissions'] as const
export type AlumniTab = (typeof ALUMNI_TABS)[number]

export const alumniSearchSchema = z.object({
  tab: z.enum(ALUMNI_TABS).optional().catch(undefined),
  page: z.coerce.number().int().min(1).catch(1),
  search: z.string().trim().max(100).optional().catch(undefined),
  batch_year: z.coerce.number().int().min(1950).max(2100).optional().catch(undefined),
  source: z.enum(['pass_out', 'converted', 'registered', 'self']).optional().catch(undefined),
  exit_type: z.enum(['graduated', 'transferred', 'withdrawn']).optional().catch(undefined),
  occupation_status: z
    .enum(['higher_studies', 'employed', 'self_employed', 'seeking', 'other', 'unknown'])
    .optional()
    .catch(undefined),
  status: z.enum(['active', 'inactive']).optional().catch(undefined),
  reachable: z.boolean().optional().catch(undefined),
  sort: z
    .enum(['name', 'batch_year', 'left_on', 'final_percent', 'alumni_no', 'created_at'])
    .optional()
    .catch(undefined),
  order: z.enum(['asc', 'desc']).optional().catch(undefined),
  submission_status: z.enum(['pending', 'approved', 'rejected']).optional().catch(undefined),
})

export type AlumniSearch = z.infer<typeof alumniSearchSchema>
