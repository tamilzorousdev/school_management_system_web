import { z } from 'zod'

export const chatSearchSchema = z.object({
  page: z.coerce.number().int().min(1).catch(1),
  search: z.string().trim().max(100).optional().catch(undefined),
  flagged: z.boolean().optional().catch(undefined),
  year: z.coerce.number().int().min(1).optional().catch(undefined),
  sort: z
    .enum(['last_message_at', 'created_at', 'message_count', 'open_flags'])
    .optional()
    .catch(undefined),
  order: z.enum(['asc', 'desc']).optional().catch(undefined),
  thread: z.coerce.number().int().min(1).optional().catch(undefined),
})

export type ChatSearch = z.infer<typeof chatSearchSchema>
