import { Controller, useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { AppModal } from '@/components/common/app-modal'
import { Combobox } from '@/components/common/combobox'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import { FormField } from '@/components/common/form-field'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { useAcademicYears } from '@/features/setup/api'
import { alerts } from '@/lib/alerts'
import { toApiError } from '@/lib/api/errors'
import {
  galleryApi,
  useGalleryCategories,
  useGalleryMutation,
  type PolicyInput,
  type PolicyUpdateInput,
  type RetentionPolicy,
} from '../api'
import {
  MEDIA_TYPE_OPTIONS,
  POLICY_TARGET_OPTIONS,
  RETENTION_UNIT_OPTIONS,
  SCOPE_OPTIONS,
} from '../labels'
import { useConfirmRetry } from '../use-confirm-retry'
import { AlbumPicker } from './pickers'

const FORM_ID = 'gallery-policy-form'

const schema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, 'Enter a name of 2 to 80 letters')
      .max(80, 'Enter a name of 2 to 80 letters'),
    target: z.enum(['album', 'archived', 'category', 'academic_year', 'scope', 'media_type']),
    album_id: z.number().optional(),
    category_id: z.string(),
    academic_year_id: z.string(),
    scope: z.string(),
    media_type: z.string(),
    keep_forever: z.boolean(),
    retention_value: z.number(),
    retention_unit: z.enum(['days', 'months', 'years']),
    is_active: z.boolean(),
  })
  .superRefine((values, ctx) => {
    const need = (path: string, message: string) =>
      ctx.addIssue({ code: 'custom', path: [path], message })
    if (values.target === 'album' && !values.album_id) need('album_id', 'Choose the album')
    if (values.target === 'category' && !values.category_id)
      need('category_id', 'Choose the category')
    if (values.target === 'academic_year' && !values.academic_year_id)
      need('academic_year_id', 'Choose the year')
    if (values.target === 'scope' && !values.scope) need('scope', 'Choose the gallery')
    if (values.target === 'media_type' && !values.media_type)
      need('media_type', 'Choose photos or videos')
    if (
      !values.keep_forever &&
      (!Number.isInteger(values.retention_value) ||
        values.retention_value < 1 ||
        values.retention_value > 3650)
    )
      need('retention_value', 'Enter a whole number from 1 to 3650')
  })

type Values = z.infer<typeof schema>

export function PolicyFormModal({
  policy,
  onClose,
}: {
  policy: RetentionPolicy | 'new' | null
  onClose: () => void
}) {
  const create = useGalleryMutation(galleryApi.createPolicy)
  const update = useGalleryMutation(galleryApi.updatePolicy)
  const retry = useConfirmRetry()
  const existing = policy && policy !== 'new' ? policy : null

  return (
    <>
      <AppModal
        open={Boolean(policy)}
        onOpenChange={(open) => !open && onClose()}
        title={existing ? 'Edit retention policy' : 'Add retention policy'}
        description='The most specific policy wins: album, archived albums, category, academic year, gallery, media type, then the default.'
        formId={FORM_ID}
        submitText={existing ? 'Save policy' : 'Add policy'}
        loading={create.isPending || update.isPending}
        size='lg'
      >
        {policy && (
          <PolicyForm
            key={existing?.id ?? 'new'}
            policy={existing}
            onSubmit={async (values) => {
              const retention = values.keep_forever
                ? { keep_forever: true }
                : {
                    keep_forever: false,
                    retention_value: values.retention_value,
                    retention_unit: values.retention_unit,
                  }
              const done = () => {
                alerts.success(existing ? 'Retention policy saved' : 'Retention policy added')
                onClose()
              }
              if (existing) {
                const input: PolicyUpdateInput = {
                  name: values.name,
                  is_active: values.is_active,
                  ...retention,
                }
                await retry.attempt(
                  () => update.mutateAsync({ id: existing.id, ...input }),
                  () => update.mutateAsync({ id: existing.id, ...input, confirm: true }),
                  done
                )
              } else {
                const input: PolicyInput = {
                  name: values.name,
                  target: values.target,
                  album_id: values.target === 'album' ? values.album_id : undefined,
                  category_id:
                    values.target === 'category' ? Number(values.category_id) : undefined,
                  academic_year_id:
                    values.target === 'academic_year' ? Number(values.academic_year_id) : undefined,
                  scope:
                    values.target === 'scope' ? (values.scope as PolicyInput['scope']) : undefined,
                  media_type:
                    values.target === 'media_type'
                      ? (values.media_type as PolicyInput['media_type'])
                      : undefined,
                  is_active: values.is_active,
                  ...retention,
                }
                await retry.attempt(
                  () => create.mutateAsync(input),
                  () => create.mutateAsync({ ...input, confirm: true }),
                  done
                )
              }
            }}
          />
        )}
      </AppModal>
      <ConfirmDialog
        {...retry.dialog}
        title='Shorter than the default retention'
        confirmText='Save anyway'
        destructive
      />
    </>
  )
}

const FIELDS: (keyof Values)[] = [
  'name',
  'target',
  'album_id',
  'category_id',
  'academic_year_id',
  'scope',
  'media_type',
  'retention_value',
  'retention_unit',
]

function PolicyForm({
  policy,
  onSubmit,
}: {
  policy: RetentionPolicy | null
  onSubmit: (values: Values) => Promise<void>
}) {
  const categories = useGalleryCategories(true)
  const years = useAcademicYears()
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: policy?.name ?? '',
      target: policy?.target ?? 'category',
      album_id: policy?.album_id ?? undefined,
      category_id: policy?.category_id ? String(policy.category_id) : '',
      academic_year_id: policy?.academic_year_id ? String(policy.academic_year_id) : '',
      scope: policy?.scope ?? '',
      media_type: policy?.media_type ?? '',
      keep_forever: policy?.keep_forever ?? false,
      retention_value: policy?.retention_value ?? 1,
      retention_unit: policy?.retention_unit ?? 'years',
      is_active: policy?.is_active ?? true,
    },
  })
  const target = useWatch({ control, name: 'target' })
  const keepForever = useWatch({ control, name: 'keep_forever' })

  const submit = handleSubmit(async (values) => {
    try {
      await onSubmit(values)
    } catch (error) {
      const apiError = toApiError(error)
      let mapped = false
      apiError.fieldErrors.forEach((fieldError) => {
        const field = FIELDS.find((name) => name === fieldError.field)
        if (field) {
          setError(field, { message: fieldError.message }, { shouldFocus: !mapped })
          mapped = true
        }
      })
      if (!mapped) setError('root', { message: apiError.message })
    }
  })

  const select = (
    name: 'category_id' | 'academic_year_id' | 'scope' | 'media_type',
    label: string,
    options: { value: string; label: string }[]
  ) => (
    <FormField id={`policy-${name}`} label={label} required error={errors[name]?.message}>
      <Controller
        control={control}
        name={name}
        render={({ field }) => (
          <Combobox
            id={`policy-${name}`}
            label={label}
            value={field.value || undefined}
            options={options}
            placeholder={`Choose ${label.toLowerCase()}`}
            invalid={Boolean(errors[name])}
            className='sm:w-full'
            onChange={(next) => field.onChange(next ?? '')}
          />
        )}
      />
    </FormField>
  )

  return (
    <form id={FORM_ID} onSubmit={submit} noValidate className='grid gap-4'>
      {errors.root?.message && (
        <p
          role='alert'
          className='rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive'
        >
          {errors.root.message}
        </p>
      )}
      <div className='grid gap-4 sm:grid-cols-2'>
        <FormField
          id='policy-name'
          label='Name'
          required
          error={errors.name?.message}
          className='sm:col-span-2'
        >
          <Input
            id='policy-name'
            autoFocus
            maxLength={80}
            placeholder='Keep annual day for 5 years'
            aria-invalid={Boolean(errors.name) || undefined}
            {...register('name')}
          />
        </FormField>
        {!policy && (
          <FormField id='policy-target' label='Applies to' required error={errors.target?.message}>
            <Controller
              control={control}
              name='target'
              render={({ field }) => (
                <Combobox
                  id='policy-target'
                  label='Applies to'
                  value={field.value}
                  options={POLICY_TARGET_OPTIONS}
                  placeholder='Choose what it covers'
                  className='sm:w-full'
                  onChange={(next) => next && field.onChange(next)}
                />
              )}
            />
          </FormField>
        )}
        {!policy && target === 'album' && (
          <FormField id='policy-album' label='Album' required error={errors.album_id?.message}>
            <Controller
              control={control}
              name='album_id'
              render={({ field }) => (
                <AlbumPicker
                  id='policy-album'
                  label='Album'
                  value={field.value}
                  invalid={Boolean(errors.album_id)}
                  onChange={(next) => field.onChange(next)}
                />
              )}
            />
          </FormField>
        )}
        {!policy &&
          target === 'category' &&
          select(
            'category_id',
            'Category',
            (categories.data ?? []).map((category) => ({
              value: String(category.id),
              label: category.name,
            }))
          )}
        {!policy &&
          target === 'academic_year' &&
          select(
            'academic_year_id',
            'Academic year',
            (years.data ?? []).map((year) => ({ value: String(year.id), label: year.name }))
          )}
        {!policy && target === 'scope' && select('scope', 'Gallery', SCOPE_OPTIONS)}
        {!policy &&
          target === 'media_type' &&
          select('media_type', 'Media type', MEDIA_TYPE_OPTIONS)}
        {policy && (
          <p className='text-sm text-muted-foreground sm:col-span-2'>
            Applies to: {policy.applies_to}
          </p>
        )}
      </div>
      <Controller
        control={control}
        name='keep_forever'
        render={({ field }) => (
          <div className='flex items-center justify-between gap-3 rounded-lg border p-3 text-sm'>
            <label htmlFor='policy-forever' className='grid cursor-pointer'>
              <span className='font-semibold'>Keep forever</span>
              <span className='text-xs text-muted-foreground'>
                Never delete these automatically
              </span>
            </label>
            <Switch id='policy-forever' checked={field.value} onCheckedChange={field.onChange} />
          </div>
        )}
      />
      {!keepForever && (
        <div className='grid gap-4 sm:grid-cols-2'>
          <FormField
            id='policy-value'
            label='Keep for'
            required
            hint='From the upload date'
            error={errors.retention_value?.message}
          >
            <Input
              id='policy-value'
              type='number'
              min={1}
              max={3650}
              aria-invalid={Boolean(errors.retention_value) || undefined}
              {...register('retention_value', { valueAsNumber: true })}
            />
          </FormField>
          <FormField id='policy-unit' label='Unit' required error={errors.retention_unit?.message}>
            <Controller
              control={control}
              name='retention_unit'
              render={({ field }) => (
                <Combobox
                  id='policy-unit'
                  label='Unit'
                  value={field.value}
                  options={RETENTION_UNIT_OPTIONS}
                  placeholder='Unit'
                  className='sm:w-full'
                  onChange={(next) => next && field.onChange(next)}
                />
              )}
            />
          </FormField>
        </div>
      )}
      <Controller
        control={control}
        name='is_active'
        render={({ field }) => (
          <div className='flex items-center justify-between gap-3 rounded-lg border p-3 text-sm'>
            <label htmlFor='policy-active' className='grid cursor-pointer'>
              <span className='font-semibold'>Active</span>
              <span className='text-xs text-muted-foreground'>Inactive policies are ignored</span>
            </label>
            <Switch id='policy-active' checked={field.value} onCheckedChange={field.onChange} />
          </div>
        )}
      />
    </form>
  )
}
