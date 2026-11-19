import { z } from 'zod'

export const eventsSearchSchema = z.object({
  view: z.enum(['month', 'list']).catch('month'),
  month: z
    .string()
    .regex(/^\d{4}-(0[1-9]|1[0-2])$/)
    .optional()
    .catch(undefined),
  page: z.coerce.number().int().min(1).catch(1),
  search: z.string().trim().max(100).optional().catch(undefined),
  status: z.enum(['draft', 'published', 'cancelled']).optional().catch(undefined),
  class_id: z.coerce.number().int().min(1).optional().catch(undefined),
  upcoming: z.boolean().optional().catch(undefined),
  sort: z.enum(['event_date', 'title']).optional().catch(undefined),
  order: z.enum(['asc', 'desc']).optional().catch(undefined),
  event: z.coerce.number().int().min(1).optional().catch(undefined),
})

export type EventsSearch = z.infer<typeof eventsSearchSchema>
