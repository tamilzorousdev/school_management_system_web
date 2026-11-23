import { Controller, useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { X } from 'lucide-react'
import { z } from 'zod'
import { AppModal } from '@/components/common/app-modal'
import { Combobox } from '@/components/common/combobox'
import { FormField } from '@/components/common/form-field'
import { SegmentedControl } from '@/components/common/segmented-control'
import { Badge } from '@/components/ui/badge'
import { Input, Textarea } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { useAcademicYears, useClasses } from '@/features/setup/api'
import { alerts } from '@/lib/alerts'
import { toApiError } from '@/lib/api/errors'
import {
  galleryApi,
  useGalleryCategories,
  useGalleryMutation,
  type Album,
  type AlbumDetail,
  type AlbumInput,
  type AlbumScope,
  type AlbumUpdateInput,
} from '../api'
import { SCOPE_OPTIONS, visibilityOptionsFor } from '../labels'
import { classLabel } from '../format'

const FORM_ID = 'gallery-album-form'

const schema = z
  .object({
    scope: z.enum(['school', 'class', 'section']),
    class_id: z.string(),
    section_id: z.string(),
    academic_year_id: z.string(),
    category_id: z.string(),
    title: z
      .string()
      .trim()
      .min(2, 'Enter a title of 2 to 150 letters')
      .max(150, 'Enter a title of 2 to 150 letters'),
    description: z.string().trim().max(2000, 'Keep the description under 2000 letters'),
    event_date: z.string(),
    tags: z
      .string()
      .refine((value) => splitTags(value).length <= 20, 'Use at most 20 tags')
      .refine(
        (value) => splitTags(value).every((tag) => tag.length <= 40),
        'Each tag must be 40 letters or less'
      ),
    visibility: z.enum(['everyone', 'staff', 'parents', 'classes']),
    class_ids: z.array(z.number()),
    section_ids: z.array(z.number()),
    allow_download: z.boolean(),
    is_featured: z.boolean(),
    publish: z.boolean(),
  })
  .superRefine((values, ctx) => {
    if (values.scope === 'class' && !values.class_id)
      ctx.addIssue({ code: 'custom', path: ['class_id'], message: 'Choose the class' })
    if (values.scope === 'section' && !values.section_id)
      ctx.addIssue({ code: 'custom', path: ['section_id'], message: 'Choose the section' })
    if (
      values.scope === 'school' &&
      values.visibility === 'classes' &&
      !values.class_ids.length &&
      !values.section_ids.length
    )
      ctx.addIssue({
        code: 'custom',
        path: ['class_ids'],
        message: 'Choose at least one class or section',
      })
  })

type FormValues = z.infer<typeof schema>

function splitTags(value: string) {
  return value
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean)
}

interface AlbumFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  album?: Album | null
  defaults?: { scope?: AlbumScope; class_id?: number; section_id?: number }
  onSaved?: (album: AlbumDetail) => void
}

export function AlbumFormModal({
  open,
  onOpenChange,
  album,
  defaults,
  onSaved,
}: AlbumFormModalProps) {
  const create = useGalleryMutation(galleryApi.createAlbum)
  const update = useGalleryMutation(galleryApi.updateAlbum)
  const editing = Boolean(album)

  return (
    <AppModal
      open={open}
      onOpenChange={onOpenChange}
      title={editing ? 'Edit album' : 'Create album'}
      description={
        editing
          ? 'Changes show in the Staff and Parent apps straight away.'
          : 'Albums start as a draft unless you publish them now. Add photos and videos after creating it.'
      }
      formId={FORM_ID}
      submitText={editing ? 'Save changes' : 'Create album'}
      loading={create.isPending || update.isPending}
      size='lg'
    >
      {open && (
        <AlbumForm
          key={album?.id ?? 'new'}
          album={album ?? null}
          defaults={defaults}
          onSubmit={async (values) => {
            const tags = splitTags(values.tags)
            const audience =
              values.scope === 'school' && values.visibility === 'classes'
                ? { class_ids: values.class_ids, section_ids: values.section_ids }
                : { class_ids: [], section_ids: [] }
            if (album) {
              const input: AlbumUpdateInput = {
                title: values.title,
                description: values.description || null,
                event_date: values.event_date || null,
                category_id: values.category_id ? Number(values.category_id) : null,
                tags,
                visibility: values.visibility,
                allow_download: values.allow_download,
                ...audience,
              }
              const saved = await update.mutateAsync({ id: album.id, ...input })
              alerts.success('Album saved')
              onSaved?.(saved)
            } else {
              const input: AlbumInput = {
                scope: values.scope,
                class_id: values.scope === 'class' ? Number(values.class_id) : undefined,
                section_id: values.scope === 'section' ? Number(values.section_id) : undefined,
                academic_year_id:
                  values.scope !== 'section' && values.academic_year_id
                    ? Number(values.academic_year_id)
                    : undefined,
                category_id: values.category_id ? Number(values.category_id) : undefined,
                title: values.title,
                description: values.description || undefined,
                event_date: values.event_date || undefined,
                tags: tags.length ? tags : undefined,
                visibility: values.visibility,
                allow_download: values.allow_download,
                is_featured: values.is_featured,
                publish: values.publish,
                ...(values.scope === 'school' && values.visibility === 'classes' ? audience : {}),
              }
              const saved = await create.mutateAsync(input)
              alerts.success(values.publish ? 'Album published' : 'Album created as a draft')
              onSaved?.(saved)
            }
            onOpenChange(false)
          }}
        />
      )}
    </AppModal>
  )
}

const FIELDS: (keyof FormValues)[] = [
  'scope',
  'class_id',
  'section_id',
  'academic_year_id',
  'category_id',
  'title',
  'description',
  'event_date',
  'tags',
  'visibility',
  'class_ids',
  'section_ids',
]

function AlbumForm({
  album,
  defaults,
  onSubmit,
}: {
  album: Album | null
  defaults?: AlbumFormModalProps['defaults']
  onSubmit: (values: FormValues) => Promise<void>
}) {
  const classes = useClasses()
  const years = useAcademicYears()
  const categories = useGalleryCategories()
  const {
    register,
    control,
    handleSubmit,
    setError,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      scope: album?.scope ?? defaults?.scope ?? 'school',
      class_id: String(album?.class_id ?? defaults?.class_id ?? ''),
      section_id: String(album?.section_id ?? defaults?.section_id ?? ''),
      academic_year_id: '',
      category_id: album?.category_id ? String(album.category_id) : '',
      title: album?.title ?? '',
      description: album?.description ?? '',
      event_date: album?.event_date ?? '',
      tags: album?.tags.join(', ') ?? '',
      visibility: album?.visibility ?? 'everyone',
      class_ids: album?.class_ids ?? [],
      section_ids: album?.section_ids ?? [],
      allow_download: album?.allow_download ?? true,
      is_featured: album?.is_featured ?? false,
      publish: false,
    },
  })

  const scope = useWatch({ control, name: 'scope' })
  const visibility = useWatch({ control, name: 'visibility' })
  const classId = useWatch({ control, name: 'class_id' })
  const classIds = useWatch({ control, name: 'class_ids' })
  const sectionIds = useWatch({ control, name: 'section_ids' })

  const classList = classes.data ?? []
  const sectionList = classList.flatMap((item) => item.sections)
  const classOptions = classList.map((item) => ({
    value: String(item.id),
    label: classLabel(item.name),
  }))
  const sectionOptions = sectionList
    .filter((section) => !classId || String(section.class_id) === classId)
    .map((section) => ({
      value: String(section.id),
      label: `${classLabel(section.class_name)} - ${section.name}`,
    }))
  const allSectionOptions = sectionList.map((section) => ({
    value: String(section.id),
    label: `${classLabel(section.class_name)} - ${section.name}`,
  }))
  const visibilityOptions = visibilityOptionsFor(scope)

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

  const chips = (ids: number[], key: 'class_ids' | 'section_ids', label: (id: number) => string) =>
    ids.length > 0 && (
      <span className='flex flex-wrap gap-1.5'>
        {ids.map((id) => (
          <Badge key={id} tone='info'>
            {label(id)}
            <button
              type='button'
              aria-label={`Remove ${label(id)}`}
              className='rounded-full hover:bg-info/20'
              onClick={() =>
                setValue(
                  key,
                  ids.filter((item) => item !== id),
                  { shouldValidate: true }
                )
              }
            >
              <X className='size-3' />
            </button>
          </Badge>
        ))}
      </span>
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
      {!album && (
        <FormField id='album-scope' label='Gallery' required>
          <Controller
            control={control}
            name='scope'
            render={({ field }) => (
              <SegmentedControl
                label='Gallery'
                value={field.value}
                options={SCOPE_OPTIONS}
                className='w-fit flex-wrap'
                onChange={(next) => {
                  field.onChange(next)
                  if (next !== 'school' && visibility !== 'everyone' && visibility !== 'staff')
                    setValue('visibility', 'everyone')
                }}
              />
            )}
          />
        </FormField>
      )}
      <div className='grid gap-4 sm:grid-cols-2'>
        {!album && scope !== 'school' && (
          <FormField
            id='album-class'
            label='Class'
            required={scope === 'class'}
            error={errors.class_id?.message}
          >
            <Controller
              control={control}
              name='class_id'
              render={({ field }) => (
                <Combobox
                  id='album-class'
                  label='Class'
                  value={field.value || undefined}
                  options={classOptions}
                  placeholder='Choose a class'
                  searchPlaceholder='Search classes'
                  invalid={Boolean(errors.class_id)}
                  className='sm:w-full'
                  onChange={(next) => {
                    field.onChange(next ?? '')
                    setValue('section_id', '')
                  }}
                />
              )}
            />
          </FormField>
        )}
        {!album && scope === 'section' && (
          <FormField id='album-section' label='Section' required error={errors.section_id?.message}>
            <Controller
              control={control}
              name='section_id'
              render={({ field }) => (
                <Combobox
                  id='album-section'
                  label='Section'
                  value={field.value || undefined}
                  options={sectionOptions}
                  placeholder='Choose a section'
                  searchPlaceholder='Search sections'
                  invalid={Boolean(errors.section_id)}
                  className='sm:w-full'
                  onChange={(next) => field.onChange(next ?? '')}
                />
              )}
            />
          </FormField>
        )}
        {!album && scope !== 'section' && (
          <FormField
            id='album-year'
            label='Academic year'
            hint='Leave empty for the current year'
            error={errors.academic_year_id?.message}
          >
            <Controller
              control={control}
              name='academic_year_id'
              render={({ field }) => (
                <Combobox
                  id='album-year'
                  label='Academic year'
                  value={field.value || undefined}
                  options={(years.data ?? []).map((year) => ({
                    value: String(year.id),
                    label: year.name,
                    hint: year.is_current ? 'Current' : undefined,
                  }))}
                  allLabel='Current year'
                  placeholder='Current year'
                  className='sm:w-full'
                  onChange={(next) => field.onChange(next ?? '')}
                />
              )}
            />
          </FormField>
        )}
        <FormField id='album-category' label='Category' error={errors.category_id?.message}>
          <Controller
            control={control}
            name='category_id'
            render={({ field }) => (
              <Combobox
                id='album-category'
                label='Category'
                value={field.value || undefined}
                options={(categories.data ?? []).map((category) => ({
                  value: String(category.id),
                  label: category.name,
                }))}
                allLabel='No category'
                placeholder='No category'
                className='sm:w-full'
                onChange={(next) => field.onChange(next ?? '')}
              />
            )}
          />
        </FormField>
        <FormField
          id='album-title'
          label='Title'
          required
          error={errors.title?.message}
          className='sm:col-span-2'
        >
          <Input
            id='album-title'
            autoFocus
            maxLength={150}
            placeholder='Sports Day 2026'
            aria-invalid={Boolean(errors.title) || undefined}
            {...register('title')}
          />
        </FormField>
        <FormField
          id='album-description'
          label='Description'
          error={errors.description?.message}
          className='sm:col-span-2'
        >
          <Textarea
            id='album-description'
            maxLength={2000}
            rows={3}
            placeholder='What happened, who took part'
            {...register('description')}
          />
        </FormField>
        <FormField id='album-event-date' label='Event date' error={errors.event_date?.message}>
          <Controller
            control={control}
            name='event_date'
            render={({ field }) => (
              <Input
                id='album-event-date'
                type='date'
                value={field.value}
                onChange={(event) => field.onChange(event.target.value)}
              />
            )}
          />
        </FormField>
        <FormField
          id='album-tags'
          label='Tags'
          hint='Separate with commas, up to 20'
          error={errors.tags?.message}
        >
          <Input
            id='album-tags'
            placeholder='sports, relay'
            aria-invalid={Boolean(errors.tags) || undefined}
            {...register('tags')}
          />
        </FormField>
        <FormField
          id='album-visibility'
          label='Who can see it'
          error={errors.visibility?.message}
          className='sm:col-span-2'
        >
          <Controller
            control={control}
            name='visibility'
            render={({ field }) => (
              <Combobox
                id='album-visibility'
                label='Who can see it'
                value={field.value}
                options={visibilityOptions}
                placeholder='Choose who can see it'
                className='sm:w-full'
                onChange={(next) => next && field.onChange(next)}
              />
            )}
          />
        </FormField>
        {scope === 'school' && visibility === 'classes' && (
          <>
            <FormField
              id='album-class-ids'
              label='Classes'
              error={errors.class_ids?.message}
              hint='Parents of children in these classes see it'
            >
              <Combobox
                id='album-class-ids'
                label='Add a class'
                value={undefined}
                options={classOptions.filter((option) => !classIds.includes(Number(option.value)))}
                placeholder='Add a class'
                className='sm:w-full'
                highlightSelected={false}
                onChange={(next) =>
                  next &&
                  setValue('class_ids', [...classIds, Number(next)], { shouldValidate: true })
                }
              />
              {chips(classIds, 'class_ids', (id) =>
                classLabel(classList.find((item) => item.id === id)?.name ?? String(id))
              )}
            </FormField>
            <FormField id='album-section-ids' label='Sections' error={errors.section_ids?.message}>
              <Combobox
                id='album-section-ids'
                label='Add a section'
                value={undefined}
                options={allSectionOptions.filter(
                  (option) => !sectionIds.includes(Number(option.value))
                )}
                placeholder='Add a section'
                className='sm:w-full'
                highlightSelected={false}
                onChange={(next) =>
                  next &&
                  setValue('section_ids', [...sectionIds, Number(next)], { shouldValidate: true })
                }
              />
              {chips(
                sectionIds,
                'section_ids',
                (id) =>
                  allSectionOptions.find((option) => option.value === String(id))?.label ??
                  String(id)
              )}
            </FormField>
          </>
        )}
      </div>
      <div className='grid gap-2 sm:grid-cols-2'>
        <Controller
          control={control}
          name='allow_download'
          render={({ field }) => (
            <SwitchRow
              id='album-download'
              title='Allow downloads'
              hint='Viewers can save photos and videos'
              checked={field.value}
              onChange={field.onChange}
            />
          )}
        />
        {!album && (
          <Controller
            control={control}
            name='is_featured'
            render={({ field }) => (
              <SwitchRow
                id='album-featured'
                title='Featured'
                hint='Shown first in the apps'
                checked={field.value}
                onChange={field.onChange}
              />
            )}
          />
        )}
        {!album && (
          <Controller
            control={control}
            name='publish'
            render={({ field }) => (
              <SwitchRow
                id='album-publish'
                title='Publish now'
                hint='Otherwise it is saved as a draft'
                checked={field.value}
                onChange={field.onChange}
              />
            )}
          />
        )}
      </div>
    </form>
  )
}

function SwitchRow({
  id,
  title,
  hint,
  checked,
  onChange,
}: {
  id: string
  title: string
  hint: string
  checked: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <div className='flex items-center justify-between gap-3 rounded-lg border p-3 text-sm'>
      <label htmlFor={id} className='grid cursor-pointer'>
        <span className='font-semibold'>{title}</span>
        <span className='text-xs text-muted-foreground'>{hint}</span>
      </label>
      <Switch id={id} checked={checked} onCheckedChange={onChange} />
    </div>
  )
}
