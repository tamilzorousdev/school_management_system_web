import type { BadgeTone } from '@/components/ui/badge'
import { toApiError } from '@/lib/api/errors'
import type {
  AlbumScope,
  AlbumStatus,
  CleanupFrequency,
  DeleteReason,
  GallerySettings,
  ImageFormat,
  JobAction,
  JobStatus,
  JobTrigger,
  MediaType,
  PolicyTarget,
  ReportName,
  RetentionUnit,
  VideoFormat,
  Visibility,
} from './api'

export const SCOPE_LABELS: Record<AlbumScope, string> = {
  school: 'App Media Gallery',
  class: 'Class-wise',
  section: 'Section-wise',
}

export const SCOPE_OPTIONS = (Object.keys(SCOPE_LABELS) as AlbumScope[]).map((value) => ({
  value,
  label: SCOPE_LABELS[value],
}))

export const ALBUM_STATUS: Record<AlbumStatus, { label: string; tone: BadgeTone }> = {
  draft: { label: 'Draft', tone: 'neutral' },
  published: { label: 'Published', tone: 'success' },
  archived: { label: 'Archived', tone: 'warning' },
}

export const ALBUM_STATUS_OPTIONS = (Object.keys(ALBUM_STATUS) as AlbumStatus[]).map((value) => ({
  value,
  label: ALBUM_STATUS[value].label,
}))

export const VISIBILITY_LABELS: Record<Visibility, string> = {
  everyone: 'Everyone',
  staff: 'Staff only',
  parents: 'Parents only',
  classes: 'Chosen classes',
}

export const VISIBILITY_OPTIONS = (Object.keys(VISIBILITY_LABELS) as Visibility[]).map((value) => ({
  value,
  label: VISIBILITY_LABELS[value],
}))

export const visibilityOptionsFor = (scope: AlbumScope) =>
  scope === 'school'
    ? VISIBILITY_OPTIONS
    : [
        { value: 'everyone' as const, label: 'Parents and teachers of that class' },
        { value: 'staff' as const, label: 'Teachers only' },
      ]

export const MEDIA_TYPE_LABELS: Record<MediaType, string> = { image: 'Photos', video: 'Videos' }

export const MEDIA_TYPE_OPTIONS = [
  { value: 'image', label: 'Photos' },
  { value: 'video', label: 'Videos' },
]

export const MEDIA_STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'pending_deletion', label: 'Scheduled for deletion' },
]

export const DELETE_REASON_LABELS: Record<DeleteReason, string> = {
  manual: 'Deleted by a user',
  retention: 'Retention ended',
  album_deleted: 'Album deleted',
  empty_album: 'Empty album',
}

export const DELETE_REASON_OPTIONS = (Object.keys(DELETE_REASON_LABELS) as DeleteReason[]).map(
  (value) => ({ value, label: DELETE_REASON_LABELS[value] })
)

export const RETENTION_UNIT_OPTIONS: { value: RetentionUnit; label: string }[] = [
  { value: 'days', label: 'Days' },
  { value: 'months', label: 'Months' },
  { value: 'years', label: 'Years' },
]

export const FREQUENCY_OPTIONS: { value: CleanupFrequency; label: string }[] = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
]

export const WEEKDAY_OPTIONS = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
].map((label, index) => ({ value: String(index + 1), label }))

export const MONTH_DAY_OPTIONS = Array.from({ length: 28 }, (_, index) => ({
  value: String(index + 1),
  label: String(index + 1),
}))

export const TIME_ZONE_OPTIONS = [
  'Asia/Kolkata',
  'Asia/Dubai',
  'Asia/Singapore',
  'Asia/Colombo',
  'Europe/London',
  'UTC',
].map((value) => ({ value, label: value }))

export const IMAGE_FORMAT_OPTIONS: { value: ImageFormat; label: string }[] = [
  { value: 'jpeg', label: 'JPEG' },
  { value: 'png', label: 'PNG' },
  { value: 'webp', label: 'WebP' },
]

export const VIDEO_FORMAT_OPTIONS: { value: VideoFormat; label: string }[] = [
  { value: 'mp4', label: 'MP4' },
  { value: 'mov', label: 'MOV' },
  { value: 'webm', label: 'WebM' },
  { value: '3gp', label: '3GP' },
]

export const UPLOAD_ROLE_OPTIONS = [
  { value: 'TEACHER', label: 'Teacher' },
  { value: 'HOD', label: 'HOD' },
]

export const NOTIFY_ROLE_OPTIONS = [
  { value: 'ADMIN', label: 'School admin' },
  { value: 'PRINCIPAL', label: 'Principal' },
  { value: 'AO', label: 'AO' },
]

export const POLICY_TARGET_LABELS: Record<PolicyTarget, string> = {
  album: 'One album',
  archived: 'Archived albums',
  category: 'A category',
  academic_year: 'An academic year',
  scope: 'A gallery',
  media_type: 'Photos or videos',
}

export const POLICY_TARGET_OPTIONS = (Object.keys(POLICY_TARGET_LABELS) as PolicyTarget[]).map(
  (value) => ({ value, label: POLICY_TARGET_LABELS[value] })
)

export const JOB_STATUS: Record<JobStatus, { label: string; tone: BadgeTone }> = {
  running: { label: 'Running', tone: 'info' },
  completed: { label: 'Completed', tone: 'success' },
  partial: { label: 'Partly done', tone: 'warning' },
  failed: { label: 'Failed', tone: 'danger' },
}

export const JOB_STATUS_OPTIONS = (Object.keys(JOB_STATUS) as JobStatus[]).map((value) => ({
  value,
  label: JOB_STATUS[value].label,
}))

export const JOB_TRIGGER_LABELS: Record<JobTrigger, string> = {
  schedule: 'Scheduled',
  manual: 'Run now',
  retry: 'Retry',
}

export const JOB_ACTION_LABELS: Record<JobAction, string> = {
  marked: 'Scheduled for deletion',
  unmarked: 'Taken off the schedule',
  trashed: 'Moved to Trash',
  purged: 'Deleted for good',
  failed: 'Failed',
  album_trashed: 'Album moved to Trash',
  album_purged: 'Album deleted for good',
  orphan_removed: 'Leftover file removed',
}

export const JOB_ACTION_OPTIONS = (Object.keys(JOB_ACTION_LABELS) as JobAction[]).map((value) => ({
  value,
  label: JOB_ACTION_LABELS[value],
}))

export const PREVIEW_ACTION_LABELS: Record<string, string> = {
  mark: 'Will get the deletion notice',
  trash: 'Moves to Trash',
  purge: 'Deleted for good',
  album_trash: 'Album moves to Trash',
  album_purge: 'Album deleted for good',
}

export const REPORT_OPTIONS: { value: ReportName; label: string; hint: string }[] = [
  {
    value: 'class_usage',
    label: 'Class-wise usage',
    hint: 'Albums, photos, videos and size by class',
  },
  { value: 'section_usage', label: 'Section-wise usage', hint: 'The same by section' },
  { value: 'album_counts', label: 'Albums', hint: 'Every album with its counts' },
  { value: 'category_usage', label: 'Categories', hint: 'Albums and media by category' },
  { value: 'upload_activity', label: 'Upload activity', hint: 'Uploads per day' },
  { value: 'user_uploads', label: 'Uploads by user', hint: 'Who uploaded how much' },
  { value: 'storage', label: 'Storage', hint: 'Space used by gallery' },
  { value: 'expiring', label: 'Expiring soon', hint: 'Media near the end of retention' },
  { value: 'deleted', label: 'Deleted', hint: 'Media moved to Trash' },
  { value: 'restored', label: 'Restored', hint: 'Media brought back from Trash' },
  { value: 'purged', label: 'Deleted for good', hint: 'Permanent deletions' },
  { value: 'cleanup_activity', label: 'Cleanup runs', hint: 'Every automatic or manual run' },
  {
    value: 'cleanup_failures',
    label: 'Cleanup failures',
    hint: 'Items the cleanup could not delete',
  },
]

export const AUDIT_ACTIONS = [
  'album.created',
  'album.updated',
  'album.published',
  'album.unpublished',
  'album.archived',
  'album.featured',
  'album.unfeatured',
  'album.shared',
  'album.deleted',
  'album.trashed',
  'album.restored',
  'album.purged',
  'media.uploaded',
  'media.updated',
  'media.poster_set',
  'media.downloaded',
  'media.deleted',
  'media.trashed',
  'media.restored',
  'media.purged',
  'category.created',
  'category.updated',
  'category.removed',
  'retention.policy_created',
  'retention.policy_updated',
  'retention.policy_removed',
  'retention.hold_applied',
  'retention.hold_released',
  'settings.updated',
  'settings.reset',
  'cleanup.completed',
  'cleanup.failed',
  'cleanup.paused',
  'cleanup.resumed',
]

export const auditActionLabel = (action: string) => {
  const [subject, verb] = action.split('.')
  if (!verb) return action
  const words = verb.replace(/_/g, ' ')
  return `${subject.charAt(0).toUpperCase()}${subject.slice(1)} ${words}`
}

export const AUDIT_ACTION_OPTIONS = AUDIT_ACTIONS.map((value) => ({
  value,
  label: auditActionLabel(value),
}))

const IMAGE_MIME: Record<ImageFormat, string[]> = {
  jpeg: ['image/jpeg', 'image/jpg'],
  png: ['image/png'],
  webp: ['image/webp'],
}

const VIDEO_MIME: Record<VideoFormat, string[]> = {
  mp4: ['video/mp4'],
  mov: ['video/quicktime'],
  webm: ['video/webm'],
  '3gp': ['video/3gpp'],
}

const IMAGE_EXT: Record<ImageFormat, string[]> = {
  jpeg: ['jpg', 'jpeg'],
  png: ['png'],
  webp: ['webp'],
}

const VIDEO_EXT: Record<VideoFormat, string[]> = {
  mp4: ['mp4', 'm4v'],
  mov: ['mov'],
  webm: ['webm'],
  '3gp': ['3gp'],
}

export interface UploadRules {
  imageMimes: string[]
  videoMimes: string[]
  imageExts: string[]
  videoExts: string[]
  maxImageBytes: number
  maxVideoBytes: number
  serverBytes: number
  maxFiles: number
  videosEnabled: boolean
  accept: string
  summary: string
}

const MB = 1024 * 1024

export function uploadRules(settings: GallerySettings): UploadRules {
  const imageMimes = settings.image_formats.flatMap((format) => IMAGE_MIME[format])
  const videoMimes = settings.videos_enabled
    ? settings.video_formats.flatMap((format) => VIDEO_MIME[format])
    : []
  const imageExts = settings.image_formats.flatMap((format) => IMAGE_EXT[format])
  const videoExts = settings.videos_enabled
    ? settings.video_formats.flatMap((format) => VIDEO_EXT[format])
    : []
  const serverBytes = settings.server_upload_limit_mb * MB
  const formats = [
    settings.image_formats.map((format) => format.toUpperCase()).join(', '),
    settings.videos_enabled ? settings.video_formats.map((f) => f.toUpperCase()).join(', ') : '',
  ]
    .filter(Boolean)
    .join(' · ')
  return {
    imageMimes,
    videoMimes,
    imageExts,
    videoExts,
    maxImageBytes: Math.min(settings.max_image_mb * MB, serverBytes),
    maxVideoBytes: Math.min(settings.max_video_mb * MB, serverBytes),
    serverBytes,
    maxFiles: settings.max_files_per_upload,
    videosEnabled: settings.videos_enabled,
    accept: [
      ...imageMimes,
      ...videoMimes,
      ...[...imageExts, ...videoExts].map((e) => `.${e}`),
    ].join(','),
    summary: `${formats}. Photos up to ${settings.max_image_mb} MB${
      settings.videos_enabled
        ? `, videos up to ${Math.min(settings.max_video_mb, settings.server_upload_limit_mb)} MB and ${Math.round(settings.max_video_seconds / 60)} min`
        : ', videos are switched off'
    }.`,
  }
}

const extension = (name: string) => name.split('.').pop()?.toLowerCase() ?? ''

export function checkFile(file: File, rules: UploadRules): string | null {
  const ext = extension(file.name)
  const isImage = rules.imageMimes.includes(file.type) || rules.imageExts.includes(ext)
  const isVideo = rules.videoMimes.includes(file.type) || rules.videoExts.includes(ext)
  if (!isImage && !isVideo) {
    if (file.type.startsWith('video/') && !rules.videosEnabled) return 'Videos are switched off'
    return 'This file type is not allowed'
  }
  if (isImage && file.size > rules.maxImageBytes) {
    return `Photos must be ${Math.round(rules.maxImageBytes / MB)} MB or smaller`
  }
  if (isVideo && file.size > rules.maxVideoBytes) {
    return `Videos must be ${Math.round(rules.maxVideoBytes / MB)} MB or smaller`
  }
  return null
}

export const isExpired = (value: string | null | undefined, now = Date.now()) =>
  Boolean(value) && Date.parse(value as string) <= now + 30_000

export const needsConfirmation = (error: unknown) =>
  toApiError(error).code === 'CONFIRMATION_REQUIRED'

export const scopeLabel = (album: {
  scope: AlbumScope
  class_name: string | null
  section_name: string | null
}) => {
  if (album.scope === 'school') return SCOPE_LABELS.school
  if (album.scope === 'class') return album.class_name ?? 'Class'
  return [album.class_name, album.section_name].filter(Boolean).join(' - ') || 'Section'
}

export const formatDuration = (seconds: number | null) => {
  if (seconds === null || seconds === undefined) return ''
  const minutes = Math.floor(seconds / 60)
  const rest = Math.round(seconds % 60)
  return `${minutes}:${String(rest).padStart(2, '0')}`
}

export const formatStorage = (bytes: number) => {
  if (bytes >= 1024 ** 3) return `${(bytes / 1024 ** 3).toFixed(1)} GB`
  if (bytes >= MB) return `${(bytes / MB).toFixed(1)} MB`
  if (bytes >= 1024) return `${Math.round(bytes / 1024)} KB`
  return `${bytes} B`
}
