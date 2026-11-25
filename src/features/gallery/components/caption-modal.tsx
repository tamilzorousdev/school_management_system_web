import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { AppModal } from '@/components/common/app-modal'
import { FormField } from '@/components/common/form-field'
import { Input, Textarea } from '@/components/ui/input'
import { alerts } from '@/lib/alerts'
import { toApiError } from '@/lib/api/errors'
import { galleryApi, useGalleryMutation, type GalleryMedia } from '../api'

const schema = z.object({
  title: z.string().trim().max(150, 'Keep the title under 150 letters'),
  description: z.string().trim().max(1000, 'Keep the caption under 1000 letters'),
})

type Values = z.infer<typeof schema>

export function CaptionModal({
  media,
  onClose,
}: {
  media: GalleryMedia | null
  onClose: () => void
}) {
  const save = useGalleryMutation(galleryApi.updateMedia)
  return (
    <AppModal
      open={Boolean(media)}
      onOpenChange={(open) => !open && onClose()}
      title='Edit caption'
      description={media?.original_name}
      formId='gallery-caption-form'
      submitText='Save caption'
      loading={save.isPending}
    >
      {media && (
        <CaptionForm
          media={media}
          onSubmit={async (values) => {
            await save.mutateAsync({
              id: media.id,
              title: values.title || null,
              description: values.description || null,
            })
            alerts.success('Caption saved')
            onClose()
          }}
        />
      )}
    </AppModal>
  )
}

function CaptionForm({
  media,
  onSubmit,
}: {
  media: GalleryMedia
  onSubmit: (values: Values) => Promise<void>
}) {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { title: media.title ?? '', description: media.description ?? '' },
  })
  const submit = handleSubmit(async (values) => {
    try {
      await onSubmit(values)
    } catch (error) {
      setError('root', { message: toApiError(error).message })
    }
  })
  return (
    <form id='gallery-caption-form' onSubmit={submit} noValidate className='grid gap-4'>
      {errors.root?.message && (
        <p role='alert' className='text-sm font-medium text-destructive'>
          {errors.root.message}
        </p>
      )}
      <FormField id='caption-title' label='Title' error={errors.title?.message}>
        <Input
          id='caption-title'
          autoFocus
          maxLength={150}
          placeholder='Relay final'
          {...register('title')}
        />
      </FormField>
      <FormField id='caption-description' label='Caption' error={errors.description?.message}>
        <Textarea
          id='caption-description'
          rows={4}
          maxLength={1000}
          placeholder='Class 5 team wins the 4 × 100 m relay'
          {...register('description')}
        />
      </FormField>
    </form>
  )
}
