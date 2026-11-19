import { useState, type ReactNode } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { FileText, Paperclip, Trash2, X } from 'lucide-react'
import { z } from 'zod'
import { AppModal } from '@/components/common/app-modal'
import { Combobox, type ComboboxOption } from '@/components/common/combobox'
import { FormField } from '@/components/common/form-field'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input, Textarea } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { useClasses } from '@/features/setup/api'
import { useStaffList } from '@/features/staff/api'
import { useStudents } from '@/features/students/api'
import { useDebouncedValue } from '@/hooks/use-debounce'
import { alerts } from '@/lib/alerts'
import { toApiError } from '@/lib/api/errors'
import { filesApi } from '@/lib/files'
import { formatBytes } from '@/lib/format'
import {
  announcementsApi,
  useAnnouncementAction,
  type Announcement,
  type AnnouncementAudience,
  type AnnouncementInput,
} from '../api'
import {
  ATTACHMENT_ACCEPT,
  ATTACHMENT_TYPES,
  AUDIENCE_LABEL,
  MAX_ATTACHMENTS,
  fromLocalInput,
  toLocalInput,
} from '../labels'

const FORM_ID = 'announcement-form'
const MAX_PEOPLE = 200

const chip = z.object({ key: z.string(), id: z.number(), label: z.string() })
const file = z.object({ id: z.number(), name: z.string(), mime_type: z.string(), size: z.number() })

const schema = z
  .object({
    title: z.string().trim().min(1, 'Enter a title').max(150, 'Keep the title under 150 letters'),
    body: z
      .string()
      .trim()
      .min(1, 'Write the announcement')
      .max(4000, 'Keep it under 4000 letters'),
    audience: z.enum(['everyone', 'parents', 'staff', 'classes', 'individuals']),
    targets: z.array(chip),
    students: z.array(chip).max(MAX_PEOPLE, `Choose up to ${MAX_PEOPLE} students`),
    staff: z.array(chip).max(MAX_PEOPLE, `Choose up to ${MAX_PEOPLE} staff members`),
    files: z.array(file).max(MAX_ATTACHMENTS, `Attach up to ${MAX_ATTACHMENTS} files`),
    urgent: z.boolean(),
    publish_at: z.string(),
    expires_at: z.string(),
    send_now: z.boolean(),
    notify_again: z.boolean(),
  })
  .superRefine((values, context) => {
    const issue = (path: string, message: string) =>
      context.addIssue({ code: 'custom', path: [path], message })
    if (values.audience === 'classes' && !values.targets.length)
      issue('targets', 'Choose at least one class or section')
    if (values.audience === 'individuals' && !values.students.length && !values.staff.length)
      issue('students', 'Choose at least one student or staff member')
    if (values.publish_at && values.send_now)
      issue('publish_at', 'Choose either a time or send now')
    if (
      values.publish_at &&
      values.expires_at &&
      new Date(values.expires_at) <= new Date(values.publish_at)
    )
      issue('expires_at', 'Remove it after it is sent')
  })

type FormValues = z.infer<typeof schema>
type Chip = FormValues['targets'][number]

const FIELD_MAP: Record<string, keyof FormValues> = {
  class_ids: 'targets',
  section_ids: 'targets',
  student_ids: 'students',
  staff_user_ids: 'staff',
  file_ids: 'files',
  priority: 'urgent',
}

export function AnnouncementForm({
  announcement,
  onOpenChange,
}: {
  announcement: Announcement | null
  onOpenChange: (open: boolean) => void
}) {
  const published = announcement?.status === 'published'
  const classes = useClasses()
  const [studentSearch, setStudentSearch] = useState('')
  const [staffSearch, setStaffSearch] = useState('')
  const [uploading, setUploading] = useState(false)
  const debouncedStudent = useDebouncedValue(studentSearch)
  const debouncedStaff = useDebouncedValue(staffSearch)
  const save = useAnnouncementAction((input: AnnouncementInput) =>
    announcement ? announcementsApi.update(announcement.id, input) : announcementsApi.create(input)
  )

  const {
    control,
    register,
    handleSubmit,
    setError,
    setValue,
    getValues,
    clearErrors,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: announcement?.title ?? '',
      body: announcement?.body ?? '',
      audience: announcement?.audience ?? 'parents',
      targets: [
        ...(announcement?.classes ?? []).map((item) => ({
          key: `class:${item.id}`,
          id: item.id,
          label: `Class ${item.name}`,
        })),
        ...(announcement?.sections ?? []).map((item) => ({
          key: `section:${item.id}`,
          id: item.id,
          label: item.name,
        })),
      ],
      students: (announcement?.students ?? []).map((item) => ({
        key: `student:${item.id}`,
        id: item.id,
        label: item.name,
      })),
      staff: (announcement?.staff ?? []).map((item) => ({
        key: `staff:${item.id}`,
        id: item.id,
        label: item.name,
      })),
      files: (announcement?.attachments ?? []).map((item) => ({
        id: item.id,
        name: item.name,
        mime_type: item.mime_type,
        size: item.size_bytes,
      })),
      urgent: announcement?.priority === 'urgent',
      publish_at: toLocalInput(announcement?.publish_at ?? null),
      expires_at: toLocalInput(announcement?.expires_at ?? null),
      send_now: false,
      notify_again: false,
    },
  })

  const audience = useWatch({ control, name: 'audience' })
  const sendNow = useWatch({ control, name: 'send_now' })
  const publishAt = useWatch({ control, name: 'publish_at' })
  const files = useWatch({ control, name: 'files' })

  const students = useStudents(
    { page: 1, limit: 20, search: debouncedStudent || undefined, status: 'active' },
    audience === 'individuals' && !published
  )
  const staffList = useStaffList({
    page: 1,
    limit: 20,
    search: debouncedStaff || undefined,
    status: 'active',
  })

  const targetOptions: ComboboxOption[] = (classes.data ?? []).flatMap((item) => [
    { value: `class:${item.id}`, label: `Class ${item.name}`, hint: 'Every section' },
    ...item.sections.map((section) => ({
      value: `section:${section.id}`,
      label: `${item.name} - ${section.name}`,
    })),
  ])
  const studentOptions: ComboboxOption[] = (students.data?.items ?? []).map((item) => ({
    value: `student:${item.id}`,
    label: item.full_name,
    hint: [item.admission_no, item.class?.name, item.section?.name].filter(Boolean).join(' · '),
  }))
  const staffOptions: ComboboxOption[] = (staffList.data?.items ?? []).map((item) => ({
    value: `staff:${item.user_id}`,
    label: item.name,
    hint: item.roles.map((role) => role.name).join(', '),
  }))

  const upload = async (picked: FileList | null) => {
    const list = Array.from(picked ?? [])
    if (!list.length) return
    const current = getValues('files')
    if (current.length + list.length > MAX_ATTACHMENTS) {
      setError('files', { message: `Attach up to ${MAX_ATTACHMENTS} files` })
      return
    }
    const wrong = list.find((item) => !ATTACHMENT_TYPES.includes(item.type))
    if (wrong) {
      setError('files', { message: `${wrong.name}: attach a PDF or an image (JPG, PNG or WEBP)` })
      return
    }
    clearErrors('files')
    setUploading(true)
    try {
      const uploaded = await Promise.all(
        list.map((item) => filesApi.upload(item, 'announcement_attachment'))
      )
      setValue('files', [
        ...getValues('files'),
        ...uploaded.map((item) => ({
          id: item.id,
          name: item.name,
          mime_type: item.mime_type,
          size: item.size_bytes,
        })),
      ])
    } catch (error) {
      setError('files', { message: toApiError(error).message })
    } finally {
      setUploading(false)
    }
  }

  const onSubmit = handleSubmit(async (values) => {
    const ids = (chips: Chip[], prefix: string) =>
      chips.filter((item) => item.key.startsWith(`${prefix}:`)).map((item) => item.id)
    const input: AnnouncementInput = {
      title: values.title.trim(),
      body: values.body.trim(),
      audience: values.audience,
      class_ids: values.audience === 'classes' ? ids(values.targets, 'class') : [],
      section_ids: values.audience === 'classes' ? ids(values.targets, 'section') : [],
      student_ids: values.audience === 'individuals' ? values.students.map((item) => item.id) : [],
      staff_user_ids: values.audience === 'individuals' ? values.staff.map((item) => item.id) : [],
      file_ids: values.files.map((item) => item.id),
      priority: values.urgent ? 'urgent' : 'normal',
      expires_at: fromLocalInput(values.expires_at),
      ...(published
        ? { notify_again: values.notify_again }
        : { publish_at: fromLocalInput(values.publish_at), publish_now: values.send_now }),
    }
    try {
      const saved = await save.mutateAsync(input)
      alerts.success(
        published
          ? values.notify_again
            ? `Updated and sent again to ${saved.recipient_count} people`
            : 'Announcement updated'
          : saved.status === 'published'
            ? `Sent to ${saved.recipient_count} people`
            : saved.status === 'scheduled'
              ? 'Announcement scheduled'
              : 'Draft saved'
      )
      onOpenChange(false)
    } catch (error) {
      const apiError = toApiError(error)
      if (apiError.code === 'ANNOUNCEMENT_AUDIENCE_LOCKED') {
        setError('root', { message: apiError.message })
        return
      }
      if (!apiError.fieldErrors.length) {
        setError('root', { message: apiError.message })
        return
      }
      for (const item of apiError.fieldErrors) {
        const field = FIELD_MAP[item.field] ?? item.field
        if (field in values) setError(field as keyof FormValues, { message: item.message })
        else setError('root', { message: item.message })
      }
    }
  })

  const submitText = published
    ? 'Save changes'
    : sendNow
      ? 'Send now'
      : publishAt
        ? 'Schedule'
        : 'Save draft'

  return (
    <AppModal
      open
      onOpenChange={onOpenChange}
      title={announcement ? 'Edit announcement' : 'New announcement'}
      description={
        published
          ? 'It is already sent. Readers see it marked Edited. Who receives it cannot change.'
          : 'Parents and staff read it in the app. Urgent ones also go by SMS when the push does not arrive.'
      }
      formId={FORM_ID}
      submitText={submitText}
      loading={save.isPending || uploading}
      size='lg'
    >
      <form id={FORM_ID} noValidate className='grid gap-3 sm:grid-cols-2' onSubmit={onSubmit}>
        {errors.root && (
          <p role='alert' className='text-sm font-medium text-destructive sm:col-span-2'>
            {errors.root.message}
          </p>
        )}
        <FormField
          id='a-title'
          label='Title'
          required
          error={errors.title?.message}
          className='sm:col-span-2'
        >
          <Input id='a-title' maxLength={150} {...register('title')} />
        </FormField>
        <FormField
          id='a-body'
          label='Announcement'
          required
          error={errors.body?.message}
          className='sm:col-span-2'
        >
          <Textarea id='a-body' maxLength={4000} rows={5} {...register('body')} />
        </FormField>

        {published ? (
          <div className='grid gap-1 rounded-lg border bg-muted/30 p-3 text-sm sm:col-span-2'>
            <span className='text-xs font-bold tracking-wider text-muted-foreground uppercase'>
              Sent to
            </span>
            <span className='font-semibold break-words'>{announcement?.audience_label}</span>
          </div>
        ) : (
          <>
            <Controller
              control={control}
              name='audience'
              render={({ field }) => (
                <FormField
                  id='a-audience'
                  label='Send to'
                  error={errors.audience?.message}
                  className='sm:col-span-2'
                >
                  <Combobox
                    id='a-audience'
                    label='Send to'
                    value={field.value}
                    placeholder='Choose who gets it'
                    options={(Object.keys(AUDIENCE_LABEL) as AnnouncementAudience[]).map(
                      (value) => ({ value, label: AUDIENCE_LABEL[value] })
                    )}
                    onChange={(value) =>
                      field.onChange((value ?? 'parents') as AnnouncementAudience)
                    }
                    highlightSelected={false}
                    className='sm:w-full'
                  />
                </FormField>
              )}
            />
            {audience === 'classes' && (
              <Controller
                control={control}
                name='targets'
                render={({ field }) => (
                  <ChipPicker
                    id='a-targets'
                    label='Classes and sections'
                    addLabel='Add a class or section'
                    options={targetOptions}
                    value={field.value}
                    onChange={field.onChange}
                    error={errors.targets?.message}
                  />
                )}
              />
            )}
            {audience === 'individuals' && (
              <>
                <Controller
                  control={control}
                  name='students'
                  render={({ field }) => (
                    <ChipPicker
                      id='a-students'
                      label='Students (their parents receive it)'
                      addLabel='Search students by name or admission number'
                      options={studentOptions}
                      value={field.value}
                      onChange={(next) => {
                        field.onChange(next)
                        clearErrors('students')
                      }}
                      onSearch={setStudentSearch}
                      error={errors.students?.message}
                      tone='info'
                    />
                  )}
                />
                <Controller
                  control={control}
                  name='staff'
                  render={({ field }) => (
                    <ChipPicker
                      id='a-staff'
                      label='Staff members'
                      addLabel='Search staff by name or mobile'
                      options={staffOptions}
                      value={field.value}
                      onChange={(next) => {
                        field.onChange(next)
                        clearErrors('students')
                      }}
                      onSearch={setStaffSearch}
                      error={errors.staff?.message}
                      tone='neutral'
                    />
                  )}
                />
              </>
            )}
          </>
        )}

        <FormField
          id='a-files'
          label='Attachments'
          hint={`PDF or images, up to ${MAX_ATTACHMENTS}`}
          error={errors.files?.message}
          className='sm:col-span-2'
        >
          <div className='grid gap-2'>
            {files.length > 0 && (
              <ul className='grid gap-2'>
                {files.map((item) => (
                  <li
                    key={item.id}
                    className='flex items-center justify-between gap-3 rounded-lg border p-2 pl-3'
                  >
                    <span className='flex min-w-0 items-center gap-2'>
                      <FileText className='size-4 shrink-0 text-muted-foreground' />
                      <span className='grid min-w-0'>
                        <span className='truncate text-sm font-semibold'>{item.name}</span>
                        <span className='text-xs text-muted-foreground'>
                          {formatBytes(item.size)}
                        </span>
                      </span>
                    </span>
                    <Button
                      type='button'
                      size='icon'
                      variant='ghost'
                      aria-label={`Remove ${item.name}`}
                      onClick={() =>
                        setValue(
                          'files',
                          getValues('files').filter((entry) => entry.id !== item.id)
                        )
                      }
                    >
                      <Trash2 />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
            {files.length < MAX_ATTACHMENTS && (
              <label
                htmlFor='a-files'
                className='flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed p-3 text-sm font-semibold text-muted-foreground hover:bg-muted/40'
              >
                <Paperclip className='size-4' />
                {uploading ? 'Uploading…' : 'Attach files'}
                <input
                  id='a-files'
                  type='file'
                  multiple
                  accept={ATTACHMENT_ACCEPT}
                  className='sr-only'
                  disabled={uploading}
                  onChange={(event) => {
                    void upload(event.target.files)
                    event.target.value = ''
                  }}
                />
              </label>
            )}
          </div>
        </FormField>

        {!published && (
          <FormField
            id='a-publish'
            label='Send later'
            hint='Leave empty to save a draft'
            error={errors.publish_at?.message}
          >
            <Input
              id='a-publish'
              type='datetime-local'
              disabled={sendNow}
              {...register('publish_at')}
            />
          </FormField>
        )}
        <FormField
          id='a-expires'
          label='Remove from the feed after'
          hint='Optional'
          error={errors.expires_at?.message}
          className={published ? 'sm:col-span-2' : undefined}
        >
          <Input id='a-expires' type='datetime-local' {...register('expires_at')} />
        </FormField>

        <Controller
          control={control}
          name='urgent'
          render={({ field }) => (
            <SwitchRow title='Urgent' hint='SMS when the push does not arrive'>
              <Switch checked={field.value} onCheckedChange={field.onChange} aria-label='Urgent' />
            </SwitchRow>
          )}
        />
        {published ? (
          <Controller
            control={control}
            name='notify_again'
            render={({ field }) => (
              <SwitchRow title='Send the update again' hint='Everyone gets a new notification'>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  aria-label='Send the update to everyone again'
                />
              </SwitchRow>
            )}
          />
        ) : (
          <Controller
            control={control}
            name='send_now'
            render={({ field }) => (
              <SwitchRow title='Send now' hint='Publish as soon as it is saved'>
                <Switch
                  checked={field.value}
                  onCheckedChange={(checked) => {
                    field.onChange(checked)
                    if (checked) {
                      setValue('publish_at', '')
                      clearErrors('publish_at')
                    }
                  }}
                  aria-label='Send now'
                />
              </SwitchRow>
            )}
          />
        )}
      </form>
    </AppModal>
  )
}

function SwitchRow({
  title,
  hint,
  children,
}: {
  title: string
  hint: string
  children: ReactNode
}) {
  return (
    <label className='flex items-center justify-between gap-3 rounded-lg border p-3 text-sm'>
      <span className='grid'>
        <span className='font-semibold'>{title}</span>
        <span className='text-xs text-muted-foreground'>{hint}</span>
      </span>
      {children}
    </label>
  )
}

function ChipPicker({
  id,
  label,
  addLabel,
  options,
  value,
  onChange,
  onSearch,
  error,
  tone = 'info',
}: {
  id: string
  label: string
  addLabel: string
  options: ComboboxOption[]
  value: Chip[]
  onChange: (value: Chip[]) => void
  onSearch?: (query: string) => void
  error?: string
  tone?: 'info' | 'neutral'
}) {
  const chosen = new Set(value.map((item) => item.key))
  return (
    <FormField id={id} label={label} error={error} className='sm:col-span-2'>
      <div className='grid gap-2'>
        <Combobox
          id={id}
          label={addLabel}
          placeholder={addLabel}
          searchPlaceholder='Type to search'
          options={options.filter((option) => !chosen.has(option.value))}
          onSearch={onSearch}
          onChange={(picked) => {
            if (!picked) return
            const option = options.find((item) => item.value === picked)
            onChange([
              ...value,
              { key: picked, id: Number(picked.split(':')[1]), label: option?.label ?? picked },
            ])
          }}
          highlightSelected={false}
          invalid={Boolean(error)}
          className='sm:w-full'
        />
        {value.length > 0 && (
          <span className='flex flex-wrap gap-1.5'>
            {value.map((item) => (
              <Badge key={item.key} tone={tone}>
                {item.label}
                <button
                  type='button'
                  aria-label={`Remove ${item.label}`}
                  className='rounded-full hover:bg-foreground/10'
                  onClick={() => onChange(value.filter((entry) => entry.key !== item.key))}
                >
                  <X className='size-3' />
                </button>
              </Badge>
            ))}
          </span>
        )}
      </div>
    </FormField>
  )
}
