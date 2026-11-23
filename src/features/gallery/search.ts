import { z } from 'zod'

const id = z.coerce.number().int().min(1).optional().catch(undefined)
const page = z.coerce.number().int().min(1).catch(1)
const text = z.string().trim().max(100).optional().catch(undefined)
const date = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .optional()
  .catch(undefined)
const scope = z.enum(['school', 'class', 'section']).optional().catch(undefined)
const mediaType = z.enum(['image', 'video']).optional().catch(undefined)

export const gallerySearchSchema = z.object({
  page,
  search: text,
  scope,
  class_id: id,
  section_id: id,
  category_id: id,
  status: z.enum(['draft', 'published', 'archived']).optional().catch(undefined),
  visibility: z.enum(['everyone', 'staff', 'parents', 'classes']).optional().catch(undefined),
  media_type: mediaType,
  featured: z.boolean().optional().catch(undefined),
  tag: z.string().trim().max(40).optional().catch(undefined),
  from: date,
  to: date,
  sort: z.enum(['created_at', 'event_date', 'title', 'published_at']).optional().catch(undefined),
  order: z.enum(['asc', 'desc']).optional().catch(undefined),
})

export const albumSearchSchema = z.object({
  page,
  media_type: mediaType,
  uploader_id: id,
  status: z.enum(['active', 'pending_deletion']).optional().catch(undefined),
})

export const trashSearchSchema = z.object({
  page,
  kind: z.enum(['media', 'album']).catch('media'),
  search: text,
  reason: z
    .enum(['manual', 'retention', 'album_deleted', 'empty_album'])
    .optional()
    .catch(undefined),
  media_type: mediaType,
  scope,
  class_id: id,
  section_id: id,
})

export const gallerySettingsSearchSchema = z.object({
  tab: z.enum(['settings', 'categories', 'retention', 'holds']).catch('settings'),
  holds: z.enum(['active', 'ended']).catch('active'),
  page,
})

export const cleanupSearchSchema = z.object({
  page,
  status: z.enum(['running', 'completed', 'partial', 'failed']).optional().catch(undefined),
  job: id,
  action: z
    .enum([
      'marked',
      'unmarked',
      'trashed',
      'purged',
      'failed',
      'album_trashed',
      'album_purged',
      'orphan_removed',
    ])
    .optional()
    .catch(undefined),
  item_page: page,
})

export const galleryReportsSearchSchema = z.object({
  report: z
    .enum([
      'class_usage',
      'section_usage',
      'album_counts',
      'category_usage',
      'upload_activity',
      'user_uploads',
      'storage',
      'expiring',
      'deleted',
      'restored',
      'purged',
      'cleanup_activity',
      'cleanup_failures',
    ])
    .catch('class_usage'),
  academic_year_id: id,
  from: date,
  to: date,
})

export const galleryAuditSearchSchema = z.object({
  page,
  search: text,
  action: z.string().trim().max(40).optional().catch(undefined),
  user_id: id,
  result: z.enum(['success', 'failure']).optional().catch(undefined),
  from: date,
  to: date,
  sort: z.enum(['created_at', 'action', 'user_name']).optional().catch(undefined),
  order: z.enum(['asc', 'desc']).optional().catch(undefined),
})

export type GallerySearch = z.infer<typeof gallerySearchSchema>
export type AlbumSearch = z.infer<typeof albumSearchSchema>
export type TrashSearch = z.infer<typeof trashSearchSchema>
export type GallerySettingsSearch = z.infer<typeof gallerySettingsSearchSchema>
export type CleanupSearch = z.infer<typeof cleanupSearchSchema>
export type GalleryReportsSearch = z.infer<typeof galleryReportsSearchSchema>
export type GalleryAuditSearch = z.infer<typeof galleryAuditSearchSchema>
