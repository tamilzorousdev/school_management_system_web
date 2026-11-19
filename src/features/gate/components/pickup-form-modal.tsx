import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { AppModal } from '@/components/common/app-modal'
import { FormField } from '@/components/common/form-field'
import { Input } from '@/components/ui/input'
import { today } from '@/features/attendance/labels'
import { applyFieldErrors } from '@/features/maintenance/helpers'
import { FileField, FormAlert, type AttachedFile } from '@/features/maintenance/components/shared'
import { alerts } from '@/lib/alerts'
import { toApiError } from '@/lib/api/errors'
import { gateApi, useGateMutation, type AuthorisedPickup, type AuthorisedPickupInput } from '../api'

const FORM_ID = 'gate-pickup-form'

const schema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Enter the name, 2 to 80 letters')
    .max(80, 'Enter the name, 2 to 80 letters'),
  relation: z
    .string()
    .trim()
    .min(2, 'Enter how they are related, like Grandfather')
    .max(40, 'Relation must be 40 characters or less'),
  mobile: z
    .string()
    .trim()
    .regex(/^[6-9]\d{9}$/, 'Enter a 10-digit mobile number'),
  valid_until: z.string(),
})

type FormValues = z.infer<typeof schema>
const FIELDS: (keyof FormValues)[] = ['name', 'relation', 'mobile', 'valid_until']

interface PickupFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  studentId?: number
  studentName: string
  pickup: AuthorisedPickup | null
}

export function PickupFormModal({
  open,
  onOpenChange,
  studentId,
  studentName,
  pickup,
}: PickupFormModalProps) {
  const save = useGateMutation((input: AuthorisedPickupInput) =>
    pickup ? gateApi.updatePickup(pickup.id, input) : gateApi.addPickup(studentId!, input)
  )
  const [uploading, setUploading] = useState(false)
  return (
    <AppModal
      open={open}
      onOpenChange={onOpenChange}
      title={pickup ? 'Edit pickup person' : 'Add pickup person'}
      description={`Someone other than a parent who may pick up ${studentName}. The gate sees their photo.`}
      formId={FORM_ID}
      submitText={pickup ? 'Save changes' : 'Add person'}
      loading={save.isPending || uploading}
    >
      {open && (
        <PickupForm
          key={pickup?.id ?? 'new'}
          pickup={pickup}
          onUploadingChange={setUploading}
          onSubmit={async (input) => {
            await save.mutateAsync(input)
            alerts.success(pickup ? 'Pickup person updated' : 'Pickup person added')
            onOpenChange(false)
          }}
        />
      )}
    </AppModal>
  )
}

function PickupForm({
  pickup,
  onUploadingChange,
  onSubmit,
}: {
  pickup: AuthorisedPickup | null
  onUploadingChange: (uploading: boolean) => void
  onSubmit: (input: AuthorisedPickupInput) => Promise<void>
}) {
  const [photo, setPhoto] = useState<AttachedFile | null>(pickup?.photo ?? null)
  const [photoError, setPhotoError] = useState('')
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: pickup?.name ?? '',
      relation: pickup?.relation ?? '',
      mobile: pickup?.mobile ?? '',
      valid_until: pickup?.valid_until ?? '',
    },
  })

  const submit = handleSubmit(async (values) => {
    const clear = pickup ? null : undefined
    try {
      await onSubmit({
        name: values.name,
        relation: values.relation,
        mobile: values.mobile,
        photo_file_id: photo ? photo.id : clear,
        valid_until: values.valid_until || clear,
      })
    } catch (error) {
      const apiError = toApiError(error)
      const mapped = applyFieldErrors(apiError, FIELDS, setError, {
        photo_file_id: setPhotoError,
      })
      if (!mapped) setError('root', { message: apiError.message })
    }
  })

  return (
    <form id={FORM_ID} onSubmit={submit} noValidate className='grid gap-4 sm:grid-cols-2'>
      <FormAlert message={errors.root?.message} />
      <FormField id='pickup-name' label='Name' required error={errors.name?.message}>
        <Input
          id='pickup-name'
          maxLength={80}
          placeholder='Murugan S'
          aria-invalid={Boolean(errors.name) || undefined}
          {...register('name')}
        />
      </FormField>
      <FormField id='pickup-relation' label='Relation' required error={errors.relation?.message}>
        <Input
          id='pickup-relation'
          maxLength={40}
          placeholder='Grandfather'
          aria-invalid={Boolean(errors.relation) || undefined}
          {...register('relation')}
        />
      </FormField>
      <FormField id='pickup-mobile' label='Mobile' required error={errors.mobile?.message}>
        <Input
          id='pickup-mobile'
          inputMode='numeric'
          maxLength={10}
          placeholder='9876500022'
          aria-invalid={Boolean(errors.mobile) || undefined}
          {...register('mobile')}
        />
      </FormField>
      <FormField
        id='pickup-valid-until'
        label='Valid until'
        error={errors.valid_until?.message}
        hint='Leave empty for no end date'
      >
        <Controller
          control={control}
          name='valid_until'
          render={({ field }) => (
            <Input
              id='pickup-valid-until'
              type='date'
              min={today()}
              aria-invalid={Boolean(errors.valid_until) || undefined}
              value={field.value}
              onChange={(event) => field.onChange(event.target.value)}
            />
          )}
        />
      </FormField>
      <FileField
        id='pickup-photo'
        label='Photo'
        purpose='gate_pickup_photo'
        file={photo}
        onChange={setPhoto}
        onUploadingChange={onUploadingChange}
        error={photoError}
        onError={setPhotoError}
        photoOnly
        className='sm:col-span-2'
      />
    </form>
  )
}
