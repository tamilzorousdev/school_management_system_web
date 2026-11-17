import { z } from 'zod'

export const TRANSPORT_TABS = ['buses', 'routes', 'students', 'expiries'] as const
export type TransportTab = (typeof TRANSPORT_TABS)[number]

export const transportSearchSchema = z.object({
  tab: z.enum(TRANSPORT_TABS).catch('buses'),
  search: z.string().optional().catch(undefined),
  page: z.coerce.number().int().min(1).optional().catch(undefined),
  flag: z
    .enum(['not_road_worthy', 'expired', 'due_soon', 'nearly_full', 'contractor'])
    .optional()
    .catch(undefined),
  route_id: z.coerce.number().int().min(1).optional().catch(undefined),
  stop_id: z.coerce.number().int().min(1).optional().catch(undefined),
  class_id: z.coerce.number().int().min(1).optional().catch(undefined),
  mode: z.enum(['both', 'pickup', 'drop']).optional().catch(undefined),
  sort: z.enum(['name', 'admission_no', 'class', 'stop', 'created_at']).optional().catch(undefined),
  order: z.enum(['asc', 'desc']).optional().catch(undefined),
})

export type TransportSearch = z.infer<typeof transportSearchSchema>
