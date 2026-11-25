import { useState } from 'react'
import { RotateCcw, Save } from 'lucide-react'
import { Combobox } from '@/components/common/combobox'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import { FormField } from '@/components/common/form-field'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { alerts } from '@/lib/alerts'
import { toApiError } from '@/lib/api/errors'
import { formatDateTime } from '@/lib/format'
import { cn } from '@/lib/utils'
import {
  galleryApi,
  useGalleryMutation,
  type GallerySettings,
  type SettingsInput,
  type StorageUsage,
} from '../api'
import {
  FREQUENCY_OPTIONS,
  formatStorage,
  IMAGE_FORMAT_OPTIONS,
  MONTH_DAY_OPTIONS,
  NOTIFY_ROLE_OPTIONS,
  RETENTION_UNIT_OPTIONS,
  TIME_ZONE_OPTIONS,
  UPLOAD_ROLE_OPTIONS,
  VIDEO_FORMAT_OPTIONS,
  VISIBILITY_OPTIONS,
  WEEKDAY_OPTIONS,
} from '../labels'
import { useConfirmRetry } from '../use-confirm-retry'

type Editable = Required<Omit<SettingsInput, 'confirm'>>
type Key = keyof Editable

const EDITABLE: Key[] = [
  'is_enabled',
  'app_gallery_enabled',
  'class_gallery_enabled',
  'section_gallery_enabled',
  'videos_enabled',
  'downloads_enabled',
  'sharing_enabled',
  'slideshow_enabled',
  'download_audit_enabled',
  'default_visibility',
  'upload_roles',
  'teachers_delete_own',
  'storage_quota_mb',
  'storage_warning_percent',
  'max_image_mb',
  'max_video_mb',
  'max_video_seconds',
  'max_files_per_upload',
  'image_formats',
  'video_formats',
  'image_quality',
  'image_max_side',
  'thumbnail_side',
  'cleanup_enabled',
  'retention_value',
  'retention_unit',
  'cleanup_frequency',
  'cleanup_time',
  'cleanup_weekday',
  'cleanup_month_day',
  'time_zone',
  'notice_days',
  'recovery_days',
  'auto_trash_enabled',
  'permanent_delete_enabled',
  'delete_empty_albums',
  'purge_orphans',
  'purge_stale_uploads',
  'notify_in_app',
  'notify_email',
  'notify_roles',
]

const LIMITS: Partial<Record<Key, [number, number]>> = {
  storage_quota_mb: [100, 10_000_000],
  storage_warning_percent: [50, 99],
  max_image_mb: [1, 50],
  max_video_mb: [1, 4096],
  max_video_seconds: [5, 7200],
  max_files_per_upload: [1, 50],
  image_quality: [40, 100],
  image_max_side: [800, 8000],
  thumbnail_side: [120, 800],
  retention_value: [1, 3650],
  notice_days: [0, 365],
  recovery_days: [1, 365],
}

const pick = (settings: GallerySettings): Editable =>
  Object.fromEntries(EDITABLE.map((key) => [key, settings[key]])) as Editable

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b)

export function SettingsForm({
  settings,
  storage,
  readOnly,
}: {
  settings: GallerySettings
  storage?: StorageUsage
  readOnly: boolean
}) {
  const initial = pick(settings)
  const [draft, setDraft] = useState<Editable>(initial)
  const [errors, setErrors] = useState<Partial<Record<Key, string>>>({})
  const [resetOpen, setResetOpen] = useState(false)
  const save = useGalleryMutation(galleryApi.updateSettings)
  const reset = useGalleryMutation(galleryApi.resetSettings)
  const retry = useConfirmRetry()

  const changes = Object.fromEntries(
    EDITABLE.filter((key) => !same(draft[key], initial[key])).map((key) => [key, draft[key]])
  ) as SettingsInput
  const dirty = Object.keys(changes).length > 0

  const set = <K extends Key>(key: K, value: Editable[K]) => {
    setDraft((current) => ({ ...current, [key]: value }))
    setErrors((current) => ({ ...current, [key]: undefined }))
  }

  const toggleIn = <K extends 'upload_roles' | 'notify_roles' | 'image_formats' | 'video_formats'>(
    key: K,
    value: string,
    on: boolean
  ) => {
    const list = draft[key] as string[]
    set(key, (on ? [...list, value] : list.filter((item) => item !== value)) as Editable[K])
  }

  const submit = async () => {
    const next: Partial<Record<Key, string>> = {}
    for (const [key, [min, max]] of Object.entries(LIMITS) as [Key, [number, number]][]) {
      const value = draft[key] as number
      if (!Number.isInteger(value) || value < min || value > max)
        next[key] = `Enter a whole number from ${min} to ${max}`
    }
    if (!draft.image_formats.length) next.image_formats = 'Allow at least one image format'
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(draft.cleanup_time)) next.cleanup_time = 'Use HH:mm'
    if (Object.keys(next).length) {
      setErrors(next)
      alerts.error('Fix the highlighted fields')
      return
    }
    try {
      await retry.attempt(
        () => save.mutateAsync(changes),
        () => save.mutateAsync({ ...changes, confirm: true }),
        () => alerts.success('Gallery settings saved')
      )
    } catch (error) {
      const apiError = toApiError(error)
      if (apiError.fieldErrors.length) {
        setErrors(
          Object.fromEntries(apiError.fieldErrors.map((item) => [item.field, item.message]))
        )
      }
      alerts.error(apiError.message)
    }
  }

  const number = (key: Key, label: string, hint?: string, suffix?: string) => (
    <FormField id={`gs-${key}`} label={label} hint={hint} error={errors[key]}>
      <div className='flex items-center gap-2'>
        <Input
          id={`gs-${key}`}
          type='number'
          inputMode='numeric'
          min={LIMITS[key]?.[0]}
          max={LIMITS[key]?.[1]}
          disabled={readOnly}
          value={Number.isNaN(draft[key] as number) ? '' : String(draft[key])}
          aria-invalid={Boolean(errors[key]) || undefined}
          onChange={(event) =>
            set(key, (event.target.value === '' ? NaN : Number(event.target.value)) as never)
          }
        />
        {suffix && <span className='shrink-0 text-xs text-muted-foreground'>{suffix}</span>}
      </div>
    </FormField>
  )

  const toggle = (key: Key, title: string, hint: string, disabled = false) => (
    <SwitchRow
      id={`gs-${key}`}
      title={title}
      hint={hint}
      checked={Boolean(draft[key])}
      disabled={readOnly || disabled}
      changed={!same(draft[key], initial[key])}
      onChange={(value) => set(key, value as never)}
    />
  )

  const checks = (
    key: 'upload_roles' | 'notify_roles' | 'image_formats' | 'video_formats',
    label: string,
    options: { value: string; label: string }[],
    hint?: string
  ) => (
    <fieldset className='grid gap-1.5'>
      <legend className='mb-1.5 text-xs font-semibold'>{label}</legend>
      <div className='flex flex-wrap gap-2'>
        {options.map((option) => {
          const checked = (draft[key] as string[]).includes(option.value)
          return (
            <label
              key={option.value}
              className={cn(
                'inline-flex h-8 cursor-pointer items-center gap-2 rounded-md border px-3 text-sm',
                checked && 'border-primary/50 bg-primary/5',
                readOnly && 'cursor-not-allowed opacity-60'
              )}
            >
              <input
                type='checkbox'
                className='size-4 accent-primary'
                checked={checked}
                disabled={readOnly}
                onChange={(event) => toggleIn(key, option.value, event.target.checked)}
              />
              {option.label}
            </label>
          )
        })}
      </div>
      {errors[key] ? (
        <p role='alert' className='text-xs font-medium text-destructive'>
          {errors[key]}
        </p>
      ) : (
        hint && <p className='text-xs text-muted-foreground'>{hint}</p>
      )}
    </fieldset>
  )

  const select = (key: Key, label: string, options: { value: string; label: string }[]) => (
    <FormField id={`gs-${key}`} label={label} error={errors[key]}>
      <Combobox
        id={`gs-${key}`}
        label={label}
        value={String(draft[key])}
        options={options}
        placeholder={label}
        className={cn('sm:w-full', readOnly && 'pointer-events-none opacity-60')}
        onChange={(value) => {
          if (readOnly || value === undefined) return
          const numeric = key === 'cleanup_weekday' || key === 'cleanup_month_day'
          set(key, (numeric ? Number(value) : value) as never)
        }}
      />
    </FormField>
  )

  const usedPercent = storage ? Math.min(100, storage.used_percent) : 0

  return (
    <div className='grid gap-4'>
      {!readOnly && (
        <div className='sticky top-16 z-10 flex flex-wrap items-center gap-2 rounded-lg border bg-card/95 px-4 py-2.5 shadow-xs backdrop-blur'>
          <span className='text-sm text-muted-foreground'>
            {dirty
              ? `${Object.keys(changes).length} unsaved ${Object.keys(changes).length === 1 ? 'change' : 'changes'}`
              : `Saved${settings.updated_at ? ` ${formatDateTime(settings.updated_at)}` : ''}`}
          </span>
          <span className='ml-auto flex flex-wrap gap-2'>
            <Button variant='ghost' size='sm' onClick={() => setResetOpen(true)}>
              <RotateCcw />
              Reset to defaults
            </Button>
            {dirty && (
              <Button variant='outline' size='sm' onClick={() => setDraft(initial)}>
                Discard
              </Button>
            )}
            <Button
              size='sm'
              disabled={!dirty}
              loading={save.isPending}
              onClick={() => void submit()}
            >
              <Save />
              Save changes
            </Button>
          </span>
        </div>
      )}

      <Section title='General' description='What staff and parents can use in the apps.'>
        <div className='grid gap-2 md:grid-cols-2'>
          {toggle(
            'is_enabled',
            'Gallery on',
            'Switches the whole Gallery on or off for staff and parents'
          )}
          {toggle('app_gallery_enabled', 'App Media Gallery', 'School-wide albums')}
          {toggle('class_gallery_enabled', 'Class-wise Gallery', 'Albums for one class')}
          {toggle('section_gallery_enabled', 'Section-wise Gallery', 'Albums for one section')}
          {toggle('videos_enabled', 'Videos', 'Allow video uploads and playback')}
          {toggle('downloads_enabled', 'Downloads', 'Viewers can save photos and videos')}
          {toggle('sharing_enabled', 'Sharing', 'Notify the audience when an album is shared')}
          {toggle('slideshow_enabled', 'Slideshow', 'Show a slideshow button in the viewer')}
          {toggle(
            'download_audit_enabled',
            'Audit downloads',
            'Write an audit row each time a download link is opened'
          )}
          {toggle(
            'teachers_delete_own',
            'Teachers delete own uploads',
            'Teachers may delete what they uploaded'
          )}
        </div>
        <div className='grid gap-4 md:grid-cols-2'>
          {select('default_visibility', 'Default visibility', VISIBILITY_OPTIONS)}
          {checks(
            'upload_roles',
            'Staff app roles that may upload',
            UPLOAD_ROLE_OPTIONS,
            'None ticked: only admins upload'
          )}
        </div>
      </Section>

      <Section
        title='Upload limits and formats'
        description='Checked on the server for every file.'
      >
        <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
          {number('max_image_mb', 'Largest photo', '1 to 50', 'MB')}
          {number(
            'max_video_mb',
            'Largest video',
            `Server limit ${settings.server_upload_limit_mb} MB`,
            'MB'
          )}
          {number('max_video_seconds', 'Longest video', '5 to 7200', 'seconds')}
          {number('max_files_per_upload', 'Files per upload', '1 to 50')}
        </div>
        <div className='grid gap-4 md:grid-cols-2'>
          {checks('image_formats', 'Photo formats', IMAGE_FORMAT_OPTIONS)}
          {checks('video_formats', 'Video formats', VIDEO_FORMAT_OPTIONS)}
        </div>
      </Section>

      <Section
        title='Storage'
        description='Photos are resized and compressed on upload; originals are not kept.'
      >
        <div className='grid gap-2 rounded-lg border p-3'>
          <div className='flex flex-wrap items-center gap-2 text-sm'>
            <span className='font-semibold'>
              {storage
                ? `${formatStorage(storage.used_bytes)} of ${formatStorage(storage.quota_bytes)} used`
                : 'Usage loading…'}
            </span>
            {storage && (
              <Badge
                tone={
                  storage.level === 'full'
                    ? 'danger'
                    : storage.level === 'warning'
                      ? 'warning'
                      : 'success'
                }
              >
                {storage.level === 'full'
                  ? 'Full'
                  : storage.level === 'warning'
                    ? 'Nearly full'
                    : 'OK'}
              </Badge>
            )}
            <span className='ml-auto text-xs text-muted-foreground'>
              Driver {settings.storage_driver} · server upload limit{' '}
              {settings.server_upload_limit_mb} MB
            </span>
          </div>
          <div
            className='h-2 overflow-hidden rounded-full bg-muted'
            role='progressbar'
            aria-label='Storage used'
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={usedPercent}
          >
            <div
              className={cn(
                'h-full rounded-full',
                storage?.level === 'full'
                  ? 'bg-destructive'
                  : storage?.level === 'warning'
                    ? 'bg-warning'
                    : 'bg-primary'
              )}
              style={{ width: `${usedPercent}%` }}
            />
          </div>
          {storage && (
            <span className='text-xs text-muted-foreground'>
              {formatStorage(storage.trash_bytes)} in Trash ·{' '}
              {formatStorage(storage.remaining_bytes)} left
            </span>
          )}
        </div>
        <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-5'>
          {number('storage_quota_mb', 'Quota', '100 MB and up', 'MB')}
          {number('storage_warning_percent', 'Warn at', '50 to 99', '%')}
          {number('image_quality', 'Photo quality', '40 to 100')}
          {number('image_max_side', 'Longest photo side', '800 to 8000', 'px')}
          {number('thumbnail_side', 'Thumbnail size', '120 to 800', 'px')}
        </div>
      </Section>

      <Section
        title='Retention and cleanup'
        description='How long media is kept and when the automatic cleanup runs. Shorter periods ask for confirmation.'
      >
        <div className='grid gap-2 md:grid-cols-2'>
          {toggle('cleanup_enabled', 'Automatic cleanup', 'Runs on the schedule below')}
          {toggle('auto_trash_enabled', 'Move expired media to Trash', 'After the notice period')}
          {toggle(
            'permanent_delete_enabled',
            'Delete for good after recovery',
            'Otherwise Trash is kept until emptied'
          )}
          {toggle('delete_empty_albums', 'Trash empty albums', 'Albums left empty by the cleanup')}
          {toggle('purge_orphans', 'Remove leftover files', 'Files left behind by failed uploads')}
          {toggle(
            'purge_stale_uploads',
            'Clear old upload records',
            'Upload records older than 30 days'
          )}
        </div>
        <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
          {number('retention_value', 'Keep media for', 'From the upload date')}
          {select('retention_unit', 'Unit', RETENTION_UNIT_OPTIONS)}
          {number('notice_days', 'Notice before Trash', '0 to 365', 'days')}
          {number('recovery_days', 'Recovery in Trash', '1 to 365', 'days')}
          {select('cleanup_frequency', 'Runs', FREQUENCY_OPTIONS)}
          {draft.cleanup_frequency === 'weekly' && select('cleanup_weekday', 'On', WEEKDAY_OPTIONS)}
          {draft.cleanup_frequency === 'monthly' &&
            select('cleanup_month_day', 'Day of the month', MONTH_DAY_OPTIONS)}
          <FormField id='gs-cleanup_time' label='At' error={errors.cleanup_time}>
            <Input
              id='gs-cleanup_time'
              type='time'
              disabled={readOnly}
              value={draft.cleanup_time}
              onChange={(event) => set('cleanup_time', event.target.value)}
            />
          </FormField>
          {select(
            'time_zone',
            'Time zone',
            TIME_ZONE_OPTIONS.some((option) => option.value === draft.time_zone)
              ? TIME_ZONE_OPTIONS
              : [{ value: draft.time_zone, label: draft.time_zone }, ...TIME_ZONE_OPTIONS]
          )}
        </div>
        <p className='text-xs text-muted-foreground'>
          Next run{' '}
          {settings.next_cleanup_at ? formatDateTime(settings.next_cleanup_at) : 'not scheduled'}
          {settings.last_cleanup_at
            ? ` · last run ${formatDateTime(settings.last_cleanup_at)}`
            : ''}
          {settings.cleanup_paused ? ' · paused' : ''}
        </p>
      </Section>

      <Section
        title='Notifications'
        description='Notices about deletions, cleanup runs and storage.'
      >
        <div className='grid gap-2 md:grid-cols-2'>
          {toggle('notify_in_app', 'In-app and push', 'For the roles below')}
          {toggle('notify_email', 'Email', 'Through the notification service, when configured')}
        </div>
        {checks('notify_roles', 'Notify these roles', NOTIFY_ROLE_OPTIONS)}
      </Section>

      <ConfirmDialog
        {...retry.dialog}
        title='Confirm this change'
        confirmText='Save anyway'
        destructive
      />
      <ConfirmDialog
        open={resetOpen}
        onOpenChange={setResetOpen}
        title='Reset gallery settings?'
        description='Every switch and limit goes back to the default. Categories, policies and holds stay.'
        confirmText='Reset to defaults'
        destructive
        loading={reset.isPending}
        onConfirm={async () => {
          try {
            await reset.mutateAsync()
            alerts.success('Gallery settings reset to defaults')
            setResetOpen(false)
          } catch (error) {
            alerts.error(toApiError(error).message)
          }
        }}
      />
    </div>
  )
}

function Section({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <Card>
      <CardHeader>
        <div className='grid gap-0.5'>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
      </CardHeader>
      <CardContent className='grid gap-4'>{children}</CardContent>
    </Card>
  )
}

function SwitchRow({
  id,
  title,
  hint,
  checked,
  disabled,
  changed,
  onChange,
}: {
  id: string
  title: string
  hint: string
  checked: boolean
  disabled: boolean
  changed: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <div
      className={cn(
        'flex items-center justify-between gap-3 rounded-lg border p-3 text-sm',
        changed && 'border-primary/50 bg-primary/5'
      )}
    >
      <label htmlFor={id} className='grid cursor-pointer'>
        <span className='font-semibold'>{title}</span>
        <span className='text-xs text-muted-foreground'>{hint}</span>
      </label>
      <Switch id={id} checked={checked} disabled={disabled} onCheckedChange={onChange} />
    </div>
  )
}
