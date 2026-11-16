import { z } from 'zod'

export const emergencySearchSchema = z.object({
  page: z.coerce.number().int().min(1).catch(1),
  search: z.string().trim().max(80).optional().catch(undefined),
  category: z
    .enum(['weather', 'school_closed', 'security', 'health', 'transport', 'all_clear', 'other'])
    .optional()
    .catch(undefined),
  status: z.enum(['sending', 'sent', 'partly_failed']).optional().catch(undefined),
  id: z.coerce.number().int().min(1).optional().catch(undefined),
})

export type EmergencySearch = z.infer<typeof emergencySearchSchema>
