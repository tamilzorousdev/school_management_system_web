import { z } from 'zod'

export const tripHistorySearchSchema = z.object({
  page: z.coerce.number().int().min(1).catch(1),
  limit: z.coerce.number().int().min(10).max(50).optional().catch(undefined),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .catch(undefined),
  route_id: z.coerce.number().int().min(1).optional().catch(undefined),
  vehicle_id: z.coerce.number().int().min(1).optional().catch(undefined),
  status: z.enum(['active', 'ended']).optional().catch(undefined),
  flag: z.enum(['any', 'not_boarded', 'not_alighted']).optional().catch(undefined),
})

export type TripHistorySearch = z.infer<typeof tripHistorySearchSchema>
