import { z } from 'zod'

export const TRANSPORT_TABS = ['buses', 'routes', 'students', 'expiries'] as const
export type TransportTab = (typeof TRANSPORT_TABS)[number]

export const transportSearchSchema = z.object({
  tab: z.enum(TRANSPORT_TABS).catch('buses'),
  search: z.string().optional().catch(undefined),
  page: z.coerce.number().int().min(1).optional().catch(undefined),
  route_id: z.coerce.number().int().min(1).optional().catch(undefined),
  stop_id: z.coerce.number().int().min(1).optional().catch(undefined),
})

export type TransportSearch = z.infer<typeof transportSearchSchema>
