import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, type Paginated, type UploadOptions } from '@/lib/api/client'

export type AlbumScope = 'school' | 'class' | 'section'
export type AlbumStatus = 'draft' | 'published' | 'archived'
export type Visibility = 'everyone' | 'staff' | 'parents' | 'classes'
export type MediaType = 'image' | 'video'
export type MediaStatus = 'active' | 'pending_deletion'
export type DeleteReason = 'manual' | 'retention' | 'album_deleted' | 'empty_album'
export type RetentionUnit = 'days' | 'months' | 'years'
export type CleanupFrequency = 'daily' | 'weekly' | 'monthly'
export type PolicyTarget =
  'album' | 'archived' | 'category' | 'academic_year' | 'scope' | 'media_type'
export type ImageFormat = 'jpeg' | 'png' | 'webp'
export type VideoFormat = 'mp4' | 'mov' | 'webm' | '3gp'
export type JobTrigger = 'schedule' | 'manual' | 'retry'
export type JobStatus = 'running' | 'completed' | 'partial' | 'failed'
export type JobAction =
  | 'marked'
  | 'unmarked'
  | 'trashed'
  | 'purged'
  | 'failed'
  | 'album_trashed'
  | 'album_purged'
  | 'orphan_removed'
export type ExportFormat = 'xlsx' | 'csv'
export type ReportName =
  | 'class_usage'
  | 'section_usage'
  | 'album_counts'
  | 'category_usage'
  | 'upload_activity'
  | 'user_uploads'
  | 'storage'
  | 'expiring'
  | 'deleted'
  | 'restored'
  | 'purged'
  | 'cleanup_activity'
  | 'cleanup_failures'

export interface GalleryMedia {
  id: number
  album_id: number
  media_type: MediaType
  title: string | null
  description: string | null
  original_name: string
  mime_type: string
  size_bytes: number
  width: number | null
  height: number | null
  duration_seconds: number | null
  url: string
  thumbnail_url: string | null
  download_url: string | null
  url_expires_at: string
  uploaded_by: number | null
  uploaded_by_name: string | null
  created_at: string
  status: MediaStatus
  expires_at: string | null
  trash_at: string | null
  on_hold: boolean
  can_delete: boolean
}

export interface Album {
  id: number
  scope: AlbumScope
  academic_year_id: number
  academic_year: string | null
  class_id: number | null
  class_name: string | null
  section_id: number | null
  section_name: string | null
  category_id: number | null
  category: string | null
  title: string
  description: string | null
  event_date: string | null
  tags: string[]
  visibility: Visibility
  class_ids: number[]
  section_ids: number[]
  status: AlbumStatus
  is_featured: boolean
  allow_download: boolean
  cover_media_id: number | null
  cover_url: string | null
  photo_count: number
  video_count: number
  size_bytes: number
  created_by: number | null
  created_by_name: string | null
  created_at: string
  published_at: string | null
  on_hold: boolean
  can_manage: boolean
}

export interface ViewerOptions {
  slideshow_enabled: boolean
  downloads_enabled: boolean
  sharing_enabled: boolean
  videos_enabled: boolean
}

export interface AlbumDetail extends Album {
  viewer: ViewerOptions
}

export interface AlbumListParams {
  page: number
  limit: number
  search?: string
  scope?: AlbumScope
  class_id?: number
  section_id?: number
  category_id?: number
  status?: AlbumStatus
  visibility?: Visibility
  media_type?: MediaType
  uploader_id?: number
  featured?: boolean
  tag?: string
  from?: string
  to?: string
  sort?: 'created_at' | 'event_date' | 'title' | 'published_at'
  order?: 'asc' | 'desc'
}

export interface AlbumInput {
  scope: AlbumScope
  class_id?: number
  section_id?: number
  academic_year_id?: number
  category_id?: number
  title: string
  description?: string
  event_date?: string
  tags?: string[]
  visibility?: Visibility
  class_ids?: number[]
  section_ids?: number[]
  allow_download?: boolean
  is_featured?: boolean
  publish?: boolean
}

export interface AlbumUpdateInput {
  title?: string
  description?: string | null
  event_date?: string | null
  category_id?: number | null
  tags?: string[]
  visibility?: Visibility
  class_ids?: number[]
  section_ids?: number[]
  allow_download?: boolean
  cover_media_id?: number | null
}

export interface MediaListParams {
  page: number
  limit: number
  search?: string
  media_type?: MediaType
  uploader_id?: number
  status?: MediaStatus
  from?: string
  to?: string
}

export interface MediaUpdateInput {
  title?: string | null
  description?: string | null
  sort_order?: number
}

export interface UploadItem {
  index: number
  name: string
  status: 'accepted' | 'duplicate' | 'failed'
  media_id: number | null
  error: string | null
  message: string | null
}

export interface UploadResult {
  session_id: number
  total: number
  accepted: number
  duplicates: number
  failed: number
  items: UploadItem[]
  media: GalleryMedia[]
}

export interface TrashItem {
  kind: 'media' | 'album'
  id: number
  name: string
  media_type: MediaType | null
  album_id: number | null
  album_title: string | null
  album_available: boolean
  scope: AlbumScope | null
  class_name: string | null
  section_name: string | null
  size_bytes: number
  item_count: number
  thumbnail_url: string | null
  deleted_at: string
  deleted_reason: DeleteReason | null
  deleted_by_name: string | null
  purge_after: string | null
}

export interface TrashParams {
  page: number
  limit: number
  kind: 'media' | 'album'
  search?: string
  reason?: DeleteReason
  media_type?: MediaType
  scope?: AlbumScope
  class_id?: number
  section_id?: number
  album_id?: number
}

export interface RestoreInput {
  media_ids?: number[]
  album_ids?: number[]
  target_album_id?: number
}

export interface RestoreResult {
  media_restored: number
  albums_restored: number
  needs_album: number[]
  duplicates: number[]
}

export interface PurgeResult {
  media_purged: number
  albums_purged: number
  failed: number
  bytes_reclaimed: number
}

export interface CountBy {
  id: number
  name: string
  photos: number
  videos: number
  size_bytes: number
}

export interface StorageUsage {
  driver: string
  used_bytes: number
  trash_bytes: number
  quota_bytes: number
  remaining_bytes: number
  used_percent: number
  level: 'ok' | 'warning' | 'full'
}

export interface GalleryDashboard {
  albums: number
  photos: number
  videos: number
  storage: StorageUsage
  uploaded_this_month: number
  expiring_soon: number
  scheduled_for_deletion: number
  pending_deletion: number
  on_hold: number
  by_class: CountBy[]
  by_section: CountBy[]
  recent: GalleryMedia[]
}

export interface DashboardParams {
  academic_year_id?: number
  from?: string
  to?: string
  class_id?: number
  section_id?: number
  album_id?: number
  media_type?: MediaType
  uploader_id?: number
  category_id?: number
}

export interface ReportParams {
  academic_year_id?: number
  from?: string
  to?: string
}

export interface GalleryReport {
  report: ReportName
  title: string
  columns: { key: string; label: string }[]
  rows: Record<string, string | number | null>[]
}

export interface AuditLog {
  id: number
  user_id: number | null
  user_name: string | null
  user_role: string | null
  action: string
  album_id: number | null
  media_id: number | null
  class_id: number | null
  section_id: number | null
  result: 'success' | 'failure'
  details: Record<string, unknown>
  ip: string | null
  created_at: string
}

export interface AuditParams {
  page: number
  limit: number
  search?: string
  action?: string
  user_id?: number
  album_id?: number
  media_id?: number
  result?: 'success' | 'failure'
  from?: string
  to?: string
  sort?: 'created_at' | 'action' | 'user_name'
  order?: 'asc' | 'desc'
}

export interface GallerySettings {
  is_enabled: boolean
  app_gallery_enabled: boolean
  class_gallery_enabled: boolean
  section_gallery_enabled: boolean
  videos_enabled: boolean
  downloads_enabled: boolean
  sharing_enabled: boolean
  slideshow_enabled: boolean
  download_audit_enabled: boolean
  default_visibility: Visibility
  upload_roles: string[]
  teachers_delete_own: boolean
  storage_quota_mb: number
  storage_warning_percent: number
  max_image_mb: number
  max_video_mb: number
  max_video_seconds: number
  max_files_per_upload: number
  image_formats: ImageFormat[]
  video_formats: VideoFormat[]
  image_quality: number
  image_max_side: number
  thumbnail_side: number
  cleanup_enabled: boolean
  cleanup_paused: boolean
  retention_value: number
  retention_unit: RetentionUnit
  cleanup_frequency: CleanupFrequency
  cleanup_time: string
  cleanup_weekday: number
  cleanup_month_day: number
  time_zone: string
  notice_days: number
  recovery_days: number
  auto_trash_enabled: boolean
  permanent_delete_enabled: boolean
  delete_empty_albums: boolean
  purge_orphans: boolean
  purge_stale_uploads: boolean
  notify_in_app: boolean
  notify_email: boolean
  notify_roles: string[]
  next_cleanup_at: string | null
  last_cleanup_at: string | null
  storage_driver: string
  server_upload_limit_mb: number
  server_video_processing: boolean
  updated_at: string | null
}

export type SettingsInput = Partial<
  Omit<
    GallerySettings,
    | 'cleanup_paused'
    | 'next_cleanup_at'
    | 'last_cleanup_at'
    | 'storage_driver'
    | 'server_upload_limit_mb'
    | 'server_video_processing'
    | 'updated_at'
  >
> & { confirm?: boolean }

export interface GalleryCategory {
  id: number
  key: string | null
  name: string
  sort_order: number
  is_active: boolean
  album_count: number
}

export interface CategoryInput {
  name?: string
  sort_order?: number
  is_active?: boolean
}

export interface RetentionPolicy {
  id: number
  name: string
  target: PolicyTarget
  album_id: number | null
  category_id: number | null
  academic_year_id: number | null
  scope: AlbumScope | null
  media_type: MediaType | null
  applies_to: string
  retention_value: number | null
  retention_unit: RetentionUnit | null
  keep_forever: boolean
  is_active: boolean
  media_count: number
  updated_at: string
}

export interface RetentionOverview {
  default_value: number
  default_unit: RetentionUnit
  policies: RetentionPolicy[]
  default_media_count: number
  kept_forever: number
}

export interface PolicyInput {
  name: string
  target: PolicyTarget
  album_id?: number
  category_id?: number
  academic_year_id?: number
  scope?: AlbumScope
  media_type?: MediaType
  retention_value?: number
  retention_unit?: RetentionUnit
  keep_forever?: boolean
  is_active?: boolean
  confirm?: boolean
}

export interface PolicyUpdateInput {
  name?: string
  retention_value?: number
  retention_unit?: RetentionUnit
  keep_forever?: boolean
  is_active?: boolean
  confirm?: boolean
}

export interface RetentionHold {
  id: number
  kind: 'hold' | 'extension' | 'permanent'
  album_id: number | null
  album_title: string | null
  media_id: number | null
  media_name: string | null
  reason: string
  keep_until: string | null
  is_active: boolean
  applied_by_name: string | null
  applied_at: string
  released_by_name: string | null
  released_at: string | null
  release_reason: string | null
}

export interface HoldParams {
  page: number
  limit: number
  search?: string
  active?: boolean
  album_id?: number
  media_id?: number
}

export interface HoldInput {
  album_id?: number
  media_id?: number
  reason: string
  keep_until?: string | null
}

export interface CleanupPreviewItem {
  action: 'mark' | 'trash' | 'purge' | 'album_trash' | 'album_purge'
  id: number
  name: string
  album_title: string | null
  size_bytes: number
  due_at: string | null
}

export interface CleanupPreview {
  scanned: number
  to_mark: number
  to_trash: number
  to_purge: number
  albums_to_trash: number
  albums_to_purge: number
  held: number
  bytes_to_reclaim: number
  permanent_delete_enabled: boolean
  auto_trash_enabled: boolean
  items: CleanupPreviewItem[]
}

export interface CleanupJob {
  id: number
  trigger: JobTrigger
  status: JobStatus
  started_at: string
  finished_at: string | null
  duration_ms: number | null
  scanned: number
  marked: number
  unmarked: number
  trashed: number
  purged: number
  failed: number
  held: number
  albums_trashed: number
  albums_purged: number
  orphans_removed: number
  uploads_cleared: number
  bytes_reclaimed: number
  storage_bytes_after: number | null
  error: string | null
  triggered_by_name: string | null
  retry_of_job_id: number | null
  retryable: number
}

export interface CleanupJobItem {
  id: number
  action: JobAction
  media_id: number | null
  album_id: number | null
  name: string | null
  size_bytes: number
  error: string | null
  retried_job_id: number | null
  created_at: string
}

export interface CleanupStatus {
  cleanup_enabled: boolean
  paused: boolean
  running: boolean
  next_cleanup_at: string | null
  last_job: CleanupJob | null
  retryable: number
}

export interface JobParams {
  page: number
  limit: number
  status?: JobStatus
}

export interface JobItemParams {
  page: number
  limit: number
  action?: JobAction
}

export interface UserOption {
  id: number
  name: string
  mobile: string
}

const BASE = '/admin/gallery'

export const galleryKeys = {
  all: ['gallery'] as const,
  dashboard: (params: DashboardParams) => [...galleryKeys.all, 'dashboard', params] as const,
  albums: (params: AlbumListParams) => [...galleryKeys.all, 'albums', params] as const,
  album: (id: number) => [...galleryKeys.all, 'album', id] as const,
  media: (albumId: number, params: MediaListParams) =>
    [...galleryKeys.all, 'media', albumId, params] as const,
  trash: (params: TrashParams) => [...galleryKeys.all, 'trash', params] as const,
  report: (report: ReportName, params: ReportParams) =>
    [...galleryKeys.all, 'report', report, params] as const,
  audit: (params: AuditParams) => [...galleryKeys.all, 'audit', params] as const,
  settings: () => [...galleryKeys.all, 'settings'] as const,
  categories: (all: boolean) => [...galleryKeys.all, 'categories', all] as const,
  retention: () => [...galleryKeys.all, 'retention'] as const,
  holds: (params: HoldParams) => [...galleryKeys.all, 'holds', params] as const,
  cleanupStatus: () => [...galleryKeys.all, 'cleanup-status'] as const,
  jobs: (params: JobParams) => [...galleryKeys.all, 'jobs', params] as const,
  job: (id: number) => [...galleryKeys.all, 'job', id] as const,
  jobItems: (id: number, params: JobItemParams) =>
    [...galleryKeys.all, 'job-items', id, params] as const,
  users: (search: string) => ['gallery-users', search] as const,
}

export const galleryApi = {
  dashboard: (params: DashboardParams) =>
    api.get<GalleryDashboard>(`${BASE}/dashboard`, { ...params }),
  albums: (params: AlbumListParams) => api.get<Paginated<Album>>(`${BASE}/albums`, { ...params }),
  album: (id: number) => api.get<AlbumDetail>(`${BASE}/albums/${id}`),
  createAlbum: (input: AlbumInput) => api.post<AlbumDetail>(`${BASE}/albums`, input),
  updateAlbum: ({ id, ...input }: AlbumUpdateInput & { id: number }) =>
    api.patch<AlbumDetail>(`${BASE}/albums/${id}`, input),
  publish: ({ id, notify }: { id: number; notify: boolean }) =>
    api.post<AlbumDetail>(`${BASE}/albums/${id}/publish`, { notify }),
  unpublish: (id: number) => api.post<AlbumDetail>(`${BASE}/albums/${id}/unpublish`),
  archive: (id: number) => api.post<AlbumDetail>(`${BASE}/albums/${id}/archive`),
  feature: ({ id, is_featured }: { id: number; is_featured: boolean }) =>
    api.patch<AlbumDetail>(`${BASE}/albums/${id}/feature`, { is_featured }),
  share: (id: number) => api.post<{ recipients: number }>(`${BASE}/albums/${id}/share`),
  removeAlbum: ({ id, note }: { id: number; note?: string }) =>
    api.delete<null>(`${BASE}/albums/${id}`, { note }),
  media: (albumId: number, params: MediaListParams) =>
    api.get<Paginated<GalleryMedia>>(`${BASE}/albums/${albumId}/media`, { ...params }),
  upload: (albumId: number, file: File, options?: UploadOptions) => {
    const form = new FormData()
    form.append('files', file)
    return api.upload<UploadResult>(`${BASE}/albums/${albumId}/media`, form, {
      timeout: 0,
      ...options,
    })
  },
  updateMedia: ({ id, ...input }: MediaUpdateInput & { id: number }) =>
    api.patch<GalleryMedia>(`${BASE}/media/${id}`, input),
  setPoster: ({ id, file }: { id: number; file: File }) => {
    const form = new FormData()
    form.append('file', file)
    return api.upload<GalleryMedia>(`${BASE}/media/${id}/poster`, form, { method: 'put' })
  },
  removeMedia: ({ id, note }: { id: number; note?: string }) =>
    api.delete<null>(`${BASE}/media/${id}`, { note }),
  removeMediaMany: (input: { media_ids: number[]; note?: string }) =>
    api.post<{ deleted: number }>(`${BASE}/media/delete`, input),
  trash: (params: TrashParams) => api.get<Paginated<TrashItem>>(`${BASE}/trash`, { ...params }),
  restore: (input: RestoreInput) => api.post<RestoreResult>(`${BASE}/trash/restore`, input),
  purge: (input: { media_ids?: number[]; album_ids?: number[] }) =>
    api.post<PurgeResult>(`${BASE}/trash/purge`, { ...input, confirm: true }),
  emptyTrash: () => api.post<PurgeResult>(`${BASE}/trash/empty`, { confirm: true }),
  report: (report: ReportName, params: ReportParams) =>
    api.get<GalleryReport>(`${BASE}/reports/${report}`, { ...params }),
  reportExportUrl: (report: ReportName) => `${BASE}/reports/${report}/export`,
  audit: (params: AuditParams) => api.get<Paginated<AuditLog>>(`${BASE}/audit-logs`, { ...params }),
  auditExportUrl: `${BASE}/audit-logs/export`,
  settings: () => api.get<GallerySettings>(`${BASE}/settings`),
  updateSettings: (input: SettingsInput) => api.patch<GallerySettings>(`${BASE}/settings`, input),
  resetSettings: () => api.post<GallerySettings>(`${BASE}/settings/reset`, { confirm: true }),
  categories: (all: boolean) =>
    api.get<GalleryCategory[]>(`${BASE}/categories`, all ? { all: true } : undefined),
  createCategory: (input: CategoryInput) => api.post<GalleryCategory>(`${BASE}/categories`, input),
  updateCategory: ({ id, ...input }: CategoryInput & { id: number }) =>
    api.patch<GalleryCategory>(`${BASE}/categories/${id}`, input),
  removeCategory: (id: number) => api.delete<null>(`${BASE}/categories/${id}`),
  retention: () => api.get<RetentionOverview>(`${BASE}/retention`),
  createPolicy: (input: PolicyInput) =>
    api.post<RetentionPolicy>(`${BASE}/retention/policies`, input),
  updatePolicy: ({ id, ...input }: PolicyUpdateInput & { id: number }) =>
    api.patch<RetentionPolicy>(`${BASE}/retention/policies/${id}`, input),
  removePolicy: ({ id, confirm }: { id: number; confirm?: boolean }) =>
    api.delete<null>(`${BASE}/retention/policies/${id}`, confirm ? { confirm: true } : undefined),
  holds: (params: HoldParams) =>
    api.get<Paginated<RetentionHold>>(`${BASE}/retention/holds`, { ...params }),
  applyHold: (input: HoldInput) => api.post<RetentionHold>(`${BASE}/retention/holds`, input),
  releaseHold: ({ id, ...input }: { id: number; reason: string; confirm?: boolean }) =>
    api.post<RetentionHold>(`${BASE}/retention/holds/${id}/release`, input),
  cleanupStatus: () => api.get<CleanupStatus>(`${BASE}/cleanup/status`),
  cleanupPreview: () => api.get<CleanupPreview>(`${BASE}/cleanup/preview`),
  runCleanup: () => api.post<CleanupJob>(`${BASE}/cleanup/run`, { confirm: true }),
  pauseCleanup: () => api.post<CleanupStatus>(`${BASE}/cleanup/pause`),
  resumeCleanup: () => api.post<CleanupStatus>(`${BASE}/cleanup/resume`),
  jobs: (params: JobParams) =>
    api.get<Paginated<CleanupJob>>(`${BASE}/cleanup/jobs`, { ...params }),
  job: (id: number) => api.get<CleanupJob>(`${BASE}/cleanup/jobs/${id}`),
  jobItems: (id: number, params: JobItemParams) =>
    api.get<Paginated<CleanupJobItem>>(`${BASE}/cleanup/jobs/${id}/items`, { ...params }),
  retryJob: (id: number) => api.post<CleanupJob>(`${BASE}/cleanup/jobs/${id}/retry`),
  jobExportUrl: (id: number) => `${BASE}/cleanup/jobs/${id}/export`,
  users: (search: string) =>
    api.get<Paginated<UserOption>>('/admin/users', { page: 1, limit: 20, search }),
}

export function useGalleryDashboard(params: DashboardParams) {
  return useQuery({
    queryKey: galleryKeys.dashboard(params),
    queryFn: () => galleryApi.dashboard(params),
    placeholderData: keepPreviousData,
  })
}

export function useAlbums(params: AlbumListParams, enabled = true) {
  return useQuery({
    queryKey: galleryKeys.albums(params),
    queryFn: () => galleryApi.albums(params),
    placeholderData: keepPreviousData,
    enabled,
  })
}

export function useAlbum(id: number) {
  return useQuery({
    queryKey: galleryKeys.album(id),
    queryFn: () => galleryApi.album(id),
    meta: { silent: true },
  })
}

export function useAlbumMedia(albumId: number, params: MediaListParams, enabled = true) {
  return useQuery({
    queryKey: galleryKeys.media(albumId, params),
    queryFn: () => galleryApi.media(albumId, params),
    placeholderData: keepPreviousData,
    enabled,
  })
}

export function useTrash(params: TrashParams) {
  return useQuery({
    queryKey: galleryKeys.trash(params),
    queryFn: () => galleryApi.trash(params),
    placeholderData: keepPreviousData,
  })
}

export function useGalleryReport(report: ReportName, params: ReportParams) {
  return useQuery({
    queryKey: galleryKeys.report(report, params),
    queryFn: () => galleryApi.report(report, params),
    placeholderData: keepPreviousData,
  })
}

export function useGalleryAudit(params: AuditParams, enabled = true) {
  return useQuery({
    queryKey: galleryKeys.audit(params),
    queryFn: () => galleryApi.audit(params),
    placeholderData: keepPreviousData,
    enabled,
  })
}

export function useGallerySettings(enabled = true) {
  return useQuery({ queryKey: galleryKeys.settings(), queryFn: galleryApi.settings, enabled })
}

export function useGalleryCategories(all = false, enabled = true) {
  return useQuery({
    queryKey: galleryKeys.categories(all),
    queryFn: () => galleryApi.categories(all),
    enabled,
    staleTime: 60_000,
  })
}

export function useRetention() {
  return useQuery({ queryKey: galleryKeys.retention(), queryFn: galleryApi.retention })
}

export function useHolds(params: HoldParams) {
  return useQuery({
    queryKey: galleryKeys.holds(params),
    queryFn: () => galleryApi.holds(params),
    placeholderData: keepPreviousData,
  })
}

export function useCleanupStatus() {
  return useQuery({
    queryKey: galleryKeys.cleanupStatus(),
    queryFn: galleryApi.cleanupStatus,
    refetchInterval: (query) => (query.state.data?.running ? 5000 : false),
  })
}

export function useCleanupJobs(params: JobParams) {
  return useQuery({
    queryKey: galleryKeys.jobs(params),
    queryFn: () => galleryApi.jobs(params),
    placeholderData: keepPreviousData,
  })
}

export function useCleanupJob(id: number | undefined) {
  return useQuery({
    queryKey: galleryKeys.job(id ?? 0),
    queryFn: () => galleryApi.job(id!),
    enabled: Boolean(id),
  })
}

export function useCleanupJobItems(id: number | undefined, params: JobItemParams) {
  return useQuery({
    queryKey: galleryKeys.jobItems(id ?? 0, params),
    queryFn: () => galleryApi.jobItems(id!, params),
    enabled: Boolean(id),
    placeholderData: keepPreviousData,
  })
}

export function useUserOptions(search: string, enabled: boolean) {
  return useQuery({
    queryKey: galleryKeys.users(search),
    queryFn: () => galleryApi.users(search),
    enabled,
    placeholderData: keepPreviousData,
    meta: { silent: true },
  })
}

export function useGalleryMutation<TInput, TResult>(fn: (input: TInput) => Promise<TResult>) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: fn,
    meta: { silent: true },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: galleryKeys.all }),
  })
}

export function useInvalidateGallery() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: galleryKeys.all })
}
