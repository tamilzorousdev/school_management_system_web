import { z } from 'zod'

const id = z.coerce.number().int().min(1).optional().catch(undefined)

export const appraisalsSearchSchema = z.object({
  tab: z.enum(['reviews', 'cycles', 'groups', 'appeals']).catch('reviews'),
  page: z.coerce.number().int().min(1).catch(1),
  search: z.string().trim().max(80).optional().catch(undefined),
  cycle_id: id,
  group_id: id,
  stage: z
    .enum(['self_pending', 'hod_pending', 'principal_pending', 'published', 'appealed', 'completed'])
    .optional()
    .catch(undefined),
  appraisal: id,
})

export type AppraisalsSearch = z.infer<typeof appraisalsSearchSchema>
