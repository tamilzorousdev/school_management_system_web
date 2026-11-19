import { z } from 'zod'

export const announcementsSearchSchema = z.object({
  page: z.coerce.number().int().min(1).catch(1),
  search: z.string().trim().max(100).optional().catch(undefined),
  status: z.enum(['draft', 'scheduled', 'published', 'archived']).optional().catch(undefined),
  audience: z
    .enum(['everyone', 'parents', 'staff', 'classes', 'individuals'])
    .optional()
    .catch(undefined),
  priority: z.enum(['normal', 'urgent']).optional().catch(undefined),
  sort: z
    .enum(['created_at', 'published_at', 'publish_at', 'title', 'status'])
    .optional()
    .catch(undefined),
  order: z.enum(['asc', 'desc']).optional().catch(undefined),
  announcement: z.coerce.number().int().min(1).optional().catch(undefined),
})

export type AnnouncementsSearch = z.infer<typeof announcementsSearchSchema>
