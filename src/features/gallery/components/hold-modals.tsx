import { useState } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ChevronLeft, ChevronRight, Film, Images } from 'lucide-react'
import { z } from 'zod'
import { AppModal } from '@/components/common/app-modal'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import { ErrorState } from '@/components/common/display'
import { FormField } from '@/components/common/form-field'
import { SegmentedControl } from '@/components/common/segmented-control'
import { Button } from '@/components/ui/button'
import { Input, Textarea } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { alerts } from '@/lib/alerts'
import { toApiError } from '@/lib/api/errors'
import { cn } from '@/lib/utils'
import { galleryApi, useAlbumMedia, useGalleryMutation, type HoldInput } from '../api'
import { useConfirmRetry } from '../use-confirm-retry'
import { AlbumPicker } from './pickers'

const today = () => new Date().toLocaleDateString('en-CA')
const MEDIA_LIMIT = 18

const reason = z
  .string()
  .trim()
  .min(3, 'Give a reason of 3 to 300 letters')
  .max(300, 'Give a reason of 3 to 300 letters')

const applySchema = z
  .object({
    kind: z.enum(['album', 'media']),
    album_id: z.number().optional(),
    media_id: z.number().optional(),
    reason,
    forever: z.boolean(),
    keep_until: z.string(),
  })
  .superRefine((values, ctx) => {
    if (!values.forever && !values.keep_until)
      ctx.addIssue({ code: 'custom', path: ['keep_until'], message: 'Choose the last day' })
    if (!values.forever && values.keep_until && values.keep_until < today())
      ctx.addIssue({ code: 'custom', path: ['keep_until'], message: 'Choose today or a later day' })
  })

const releaseSchema = z.object({ reason })

type ApplyValues = z.infer<typeof applySchema>
type ReleaseValues = z.infer<typeof releaseSchema>

export interface HoldTarget {
  album_id?: number
  media_id?: number
  name: string
}

const TARGET_ERRORS: Record<string, 'album_id' | 'media_id'> = {
  ALBUM_IN_TRASH: 'album_id',
  ALBUM_NOT_FOUND: 'album_id',
  MEDIA_IN_TRASH: 'media_id',
  MEDIA_NOT_FOUND: 'media_id',
}

export function ApplyHoldModal({
  target,
  onClose,
}: {
  target: HoldTarget | 'pick' | null
  onClose: () => void
}) {
  const apply = useGalleryMutation(galleryApi.applyHold)
  const picking = target === 'pick'
  const fixed = target && target !== 'pick' ? target : null
  return (
    <AppModal
      open={Boolean(target)}
      onOpenChange={(open) => !open && onClose()}
      title={picking ? 'Add retention hold' : 'Apply retention hold'}
      description={
        picking
          ? 'Protect an album or one photo or video from automatic deletion.'
          : `${fixed?.name ?? ''} will not be deleted automatically while the hold is on.`
      }
      formId='gallery-hold-form'
      submitText='Apply hold'
      loading={apply.isPending}
      size={picking ? 'lg' : 'md'}
    >
      {target && (
        <ApplyHoldForm
          key={picking ? 'pick' : `${fixed?.album_id ?? ''}-${fixed?.media_id ?? ''}`}
          picking={picking}
          onSubmit={async (values) => {
            const input: HoldInput = {
              reason: values.reason,
              keep_until: values.forever ? null : values.keep_until,
            }
            if (fixed) {
              input.album_id = fixed.album_id
              input.media_id = fixed.media_id
            } else if (values.kind === 'album') {
              input.album_id = values.album_id
            } else {
              input.media_id = values.media_id
            }
            await apply.mutateAsync(input)
            alerts.success('Retention hold applied')
            onClose()
          }}
        />
      )}
    </AppModal>
  )
}

function ApplyHoldForm({
  picking,
  onSubmit,
}: {
  picking: boolean
  onSubmit: (values: ApplyValues) => Promise<void>
}) {
  const [albumTitle, setAlbumTitle] = useState<string | undefined>()
  const {
    register,
    control,
    handleSubmit,
    setError,
    setValue,
    formState: { errors },
  } = useForm<ApplyValues>({
    resolver: zodResolver(
      picking
        ? applySchema.superRefine((values, ctx) => {
            if (!values.album_id)
              ctx.addIssue({ code: 'custom', path: ['album_id'], message: 'Choose the album' })
            if (values.kind === 'media' && !values.media_id)
              ctx.addIssue({
                code: 'custom',
                path: ['media_id'],
                message: 'Choose the photo or video',
              })
          })
        : applySchema
    ),
    defaultValues: { kind: 'album', reason: '', forever: true, keep_until: '' },
  })
  const kind = useWatch({ control, name: 'kind' })
  const albumId = useWatch({ control, name: 'album_id' })
  const forever = useWatch({ control, name: 'forever' })

  const submit = handleSubmit(async (values) => {
    try {
      await onSubmit(values)
    } catch (error) {
      const apiError = toApiError(error)
      const targetField = TARGET_ERRORS[apiError.code]
      let mapped = false
      apiError.fieldErrors.forEach((item) => {
        if (['reason', 'keep_until', 'album_id', 'media_id'].includes(item.field)) {
          setError(item.field as keyof ApplyValues, { message: item.message })
          mapped = true
        }
      })
      if (targetField && picking) setError(targetField, { message: apiError.message })
      else if (!mapped) setError('root', { message: apiError.message })
    }
  })

  return (
    <form id='gallery-hold-form' onSubmit={submit} noValidate className='grid gap-4'>
      {errors.root?.message && (
        <p
          role='alert'
          className='rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive'
        >
          {errors.root.message}
        </p>
      )}
      {picking && (
        <>
          <FormField id='hold-kind' label='Protect' required>
            <Controller
              control={control}
              name='kind'
              render={({ field }) => (
                <SegmentedControl
                  label='Protect'
                  value={field.value}
                  options={[
                    { value: 'album', label: 'Album' },
                    { value: 'media', label: 'Photo or video' },
                  ]}
                  className='w-fit'
                  onChange={(next) => {
                    field.onChange(next)
                    setValue('media_id', undefined)
                  }}
                />
              )}
            />
          </FormField>
          <FormField id='hold-album' label='Album' required error={errors.album_id?.message}>
            <Controller
              control={control}
              name='album_id'
              render={({ field }) => (
                <AlbumPicker
                  id='hold-album'
                  label='Album'
                  value={field.value}
                  selectedLabel={albumTitle}
                  invalid={Boolean(errors.album_id)}
                  onChange={(next, title) => {
                    field.onChange(next)
                    setAlbumTitle(title)
                    setValue('media_id', undefined)
                  }}
                />
              )}
            />
          </FormField>
          {kind === 'media' && (
            <FormField
              id='hold-media'
              label='Photo or video'
              required
              error={errors.media_id?.message}
            >
              {albumId ? (
                <Controller
                  control={control}
                  name='media_id'
                  render={({ field }) => (
                    <MediaChooser
                      key={albumId}
                      albumId={albumId}
                      value={field.value}
                      onChange={field.onChange}
                    />
                  )}
                />
              ) : (
                <p className='text-sm text-muted-foreground'>Choose the album first.</p>
              )}
            </FormField>
          )}
        </>
      )}
      <FormField id='hold-reason' label='Reason' required error={errors.reason?.message}>
        <Textarea
          id='hold-reason'
          autoFocus={!picking}
          rows={3}
          maxLength={300}
          placeholder='School 50th anniversary'
          aria-invalid={Boolean(errors.reason) || undefined}
          {...register('reason')}
        />
      </FormField>
      <Controller
        control={control}
        name='forever'
        render={({ field }) => (
          <div className='flex items-center justify-between gap-3 rounded-lg border p-3 text-sm'>
            <label htmlFor='hold-forever' className='grid cursor-pointer'>
              <span className='font-semibold'>Keep until released</span>
              <span className='text-xs text-muted-foreground'>
                Turn off to keep it until a set day instead
              </span>
            </label>
            <Switch id='hold-forever' checked={field.value} onCheckedChange={field.onChange} />
          </div>
        )}
      />
      {!forever && (
        <FormField id='hold-until' label='Keep until' required error={errors.keep_until?.message}>
          <Controller
            control={control}
            name='keep_until'
            render={({ field }) => (
              <Input
                id='hold-until'
                type='date'
                min={today()}
                value={field.value}
                aria-invalid={Boolean(errors.keep_until) || undefined}
                onChange={(event) => field.onChange(event.target.value)}
              />
            )}
          />
        </FormField>
      )}
    </form>
  )
}

function MediaChooser({
  albumId,
  value,
  onChange,
}: {
  albumId: number
  value?: number
  onChange: (value: number) => void
}) {
  const [page, setPage] = useState(1)
  const media = useAlbumMedia(albumId, { page, limit: MEDIA_LIMIT })
  const rows = media.data?.items ?? []
  const pages = media.data?.total_pages ?? 1

  if (media.isError)
    return <ErrorState message={media.error.message} onRetry={() => media.refetch()} />
  if (media.isPending)
    return (
      <div className='grid grid-cols-3 gap-2 sm:grid-cols-6'>
        {Array.from({ length: 6 }, (_, index) => (
          <Skeleton key={index} className='aspect-square rounded-md' />
        ))}
      </div>
    )
  if (!rows.length)
    return <p className='text-sm text-muted-foreground'>This album has no photos or videos.</p>

  return (
    <div className='grid gap-2'>
      <ul
        role='radiogroup'
        aria-label='Photo or video'
        className='grid max-h-64 grid-cols-3 gap-2 overflow-y-auto p-0.5 sm:grid-cols-6'
      >
        {rows.map((item) => {
          const label = item.title || item.original_name
          const selected = item.id === value
          return (
            <li key={item.id}>
              <button
                type='button'
                role='radio'
                aria-checked={selected}
                aria-label={label}
                title={label}
                onClick={() => onChange(item.id)}
                className={cn(
                  'relative block aspect-square w-full overflow-hidden rounded-md border bg-muted outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40',
                  selected && 'ring-2 ring-primary'
                )}
              >
                {item.thumbnail_url ? (
                  <img
                    src={item.thumbnail_url}
                    alt=''
                    loading='lazy'
                    className='size-full object-cover'
                  />
                ) : (
                  <span className='grid size-full place-items-center text-muted-foreground'>
                    {item.media_type === 'video' ? (
                      <Film className='size-5' />
                    ) : (
                      <Images className='size-5' />
                    )}
                  </span>
                )}
                {item.on_hold && (
                  <span className='absolute inset-x-0 bottom-0 bg-card/90 text-[10px] font-semibold text-info'>
                    On hold
                  </span>
                )}
              </button>
            </li>
          )
        })}
      </ul>
      {pages > 1 && (
        <div className='flex items-center justify-end gap-2 text-xs text-muted-foreground'>
          <Button
            variant='ghost'
            size='icon-sm'
            aria-label='Previous page'
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
          >
            <ChevronLeft />
          </Button>
          <span className='tabular'>
            {page} of {pages}
          </span>
          <Button
            variant='ghost'
            size='icon-sm'
            aria-label='Next page'
            disabled={page >= pages}
            onClick={() => setPage(page + 1)}
          >
            <ChevronRight />
          </Button>
        </div>
      )}
    </div>
  )
}

export function ReleaseHoldModal({
  hold,
  onClose,
}: {
  hold: { id: number; name: string } | null
  onClose: () => void
}) {
  const release = useGalleryMutation(galleryApi.releaseHold)
  const retry = useConfirmRetry()
  return (
    <>
      <AppModal
        open={Boolean(hold)}
        onOpenChange={(open) => !open && onClose()}
        title='Release retention hold'
        description={`${hold?.name ?? ''} goes back to the normal retention rules.`}
        formId='gallery-release-form'
        submitText='Release hold'
        loading={release.isPending}
      >
        {hold && (
          <ReleaseHoldForm
            onSubmit={async (values) => {
              const done = () => {
                alerts.success('Retention hold released')
                onClose()
              }
              await retry.attempt(
                () => release.mutateAsync({ id: hold.id, reason: values.reason }),
                () => release.mutateAsync({ id: hold.id, reason: values.reason, confirm: true }),
                done
              )
            }}
          />
        )}
      </AppModal>
      <ConfirmDialog
        {...retry.dialog}
        title='Release the hold anyway?'
        confirmText='Release and schedule'
        destructive
      />
    </>
  )
}

function ReleaseHoldForm({ onSubmit }: { onSubmit: (values: ReleaseValues) => Promise<void> }) {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<ReleaseValues>({
    resolver: zodResolver(releaseSchema),
    defaultValues: { reason: '' },
  })
  const submit = handleSubmit(async (values) => {
    try {
      await onSubmit(values)
    } catch (error) {
      setError('reason', { message: toApiError(error).message })
    }
  })
  return (
    <form id='gallery-release-form' onSubmit={submit} noValidate className='grid gap-4'>
      <FormField id='release-reason' label='Reason' required error={errors.reason?.message}>
        <Textarea
          id='release-reason'
          autoFocus
          rows={3}
          maxLength={300}
          placeholder='Anniversary book printed'
          aria-invalid={Boolean(errors.reason) || undefined}
          {...register('reason')}
        />
      </FormField>
    </form>
  )
}
