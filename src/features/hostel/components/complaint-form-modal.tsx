import { Controller, useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { AppModal } from '@/components/common/app-modal'
import { Combobox } from '@/components/common/combobox'
import { FormField } from '@/components/common/form-field'
import { SegmentedControl } from '@/components/common/segmented-control'
import { Input, Textarea } from '@/components/ui/input'
import { alerts } from '@/lib/alerts'
import {
  hostelApi,
  useHostelMutation,
  type ComplaintCategory,
  type ComplaintDetail,
  type ComplaintInput,
  type Priority,
} from '../api'
import { COMPLAINT_CATEGORY, labelOptions, PRIORITY, toneOptions } from '../labels'
import { FormAlert, InfoNote } from './leave-form-parts'
import { applyApiError } from './leave-helpers'
import { HostelSelect, ResidentPicker } from './pickers'

const FORM_ID = 'hostel-complaint-form'

const schema = z
  .object({
    about: z.enum(['resident', 'hostel']),
    admission_id: z.string(),
    hostel_id: z.string(),
    category: z.string().min(1, 'Choose a category'),
    priority: z.enum(['low', 'normal', 'high', 'urgent']),
    title: z.string().trim().min(3, 'Enter a short title').max(120, 'Keep it to 120 characters'),
    description: z
      .string()
      .trim()
      .min(5, 'Describe the problem (5 characters or more)')
      .max(1000, 'Keep it to 1000 characters'),
  })
  .superRefine((values, ctx) => {
    if (values.about === 'resident' && !values.admission_id) {
      ctx.addIssue({ code: 'custom', path: ['admission_id'], message: 'Choose a resident' })
    }
    if (values.about === 'hostel' && !values.hostel_id) {
      ctx.addIssue({ code: 'custom', path: ['hostel_id'], message: 'Choose a hostel' })
    }
  })

type FormValues = z.infer<typeof schema>

const ABOUT_OPTIONS: { value: FormValues['about']; label: string }[] = [
  { value: 'resident', label: 'A resident' },
  { value: 'hostel', label: 'The hostel' },
]

export function ComplaintFormModal({
  onClose,
  onCreated,
}: {
  onClose: () => void
  onCreated: (complaint: ComplaintDetail) => void
}) {
  const create = useHostelMutation((input: ComplaintInput) => hostelApi.createComplaint(input))
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      about: 'resident',
      admission_id: '',
      hostel_id: '',
      category: '',
      priority: 'normal',
      title: '',
      description: '',
    },
  })
  const about = useWatch({ control, name: 'about' })

  const submit = handleSubmit(async (values) => {
    try {
      const complaint = await create.mutateAsync({
        category: values.category as ComplaintCategory,
        title: values.title,
        description: values.description,
        priority: values.priority,
        admission_id: values.about === 'resident' ? Number(values.admission_id) : undefined,
        hostel_id: values.about === 'hostel' ? Number(values.hostel_id) : undefined,
      })
      alerts.success('Complaint recorded', { description: complaint.complaint_no })
      onCreated(complaint)
      onClose()
    } catch (error) {
      applyApiError(
        error,
        setError,
        ['admission_id', 'hostel_id', 'category', 'priority', 'title', 'description'],
        { HOSTEL_ADMISSION_CLOSED: 'admission_id', HOSTEL_ADMISSION_NOT_FOUND: 'admission_id' }
      )
    }
  })

  return (
    <AppModal
      open
      onOpenChange={(open) => !open && onClose()}
      title='Record a complaint'
      description='A problem raised by a student, staff or a parent on the phone.'
      formId={FORM_ID}
      submitText='Record complaint'
      loading={create.isPending}
      size='lg'
    >
      <form id={FORM_ID} noValidate onSubmit={submit} className='grid gap-4'>
        <FormAlert message={errors.root?.message} />
        <div className='grid gap-2'>
          <span className='text-xs font-semibold'>Complaint is about</span>
          <Controller
            control={control}
            name='about'
            render={({ field }) => (
              <SegmentedControl
                label='Complaint is about'
                value={field.value}
                options={ABOUT_OPTIONS}
                onChange={field.onChange}
                className='self-start'
              />
            )}
          />
        </div>
        <div className='grid gap-4 sm:grid-cols-2'>
          {about === 'resident' ? (
            <FormField
              id='complaint-resident'
              label='Resident'
              required
              error={errors.admission_id?.message}
              hint='The room is taken from the resident’s bed'
            >
              <Controller
                control={control}
                name='admission_id'
                render={({ field }) => (
                  <ResidentPicker
                    id='complaint-resident'
                    label='Resident'
                    value={field.value || undefined}
                    invalid={Boolean(errors.admission_id)}
                    onChange={(value) => field.onChange(value ?? '')}
                  />
                )}
              />
            </FormField>
          ) : (
            <FormField
              id='complaint-hostel'
              label='Hostel'
              required
              error={errors.hostel_id?.message}
            >
              <Controller
                control={control}
                name='hostel_id'
                render={({ field }) => (
                  <HostelSelect
                    id='complaint-hostel'
                    value={field.value || undefined}
                    invalid={Boolean(errors.hostel_id)}
                    onChange={(value) => field.onChange(value ?? '')}
                  />
                )}
              />
            </FormField>
          )}
          <FormField
            id='complaint-category'
            label='Category'
            required
            error={errors.category?.message}
          >
            <Controller
              control={control}
              name='category'
              render={({ field }) => (
                <Combobox
                  id='complaint-category'
                  label='Category'
                  value={field.value || undefined}
                  placeholder='Choose category'
                  options={labelOptions(COMPLAINT_CATEGORY)}
                  invalid={Boolean(errors.category)}
                  highlightSelected={false}
                  className='sm:w-full'
                  onChange={(value) => field.onChange(value ?? '')}
                />
              )}
            />
          </FormField>
          <FormField
            id='complaint-priority'
            label='Priority'
            required
            error={errors.priority?.message}
            hint='Sets the due time: urgent 4 h, high 1 day, normal 3 days, low 7 days'
          >
            <Controller
              control={control}
              name='priority'
              render={({ field }) => (
                <Combobox
                  id='complaint-priority'
                  label='Priority'
                  value={field.value}
                  placeholder='Choose priority'
                  options={toneOptions(PRIORITY)}
                  highlightSelected={false}
                  className='sm:w-full'
                  onChange={(value) => field.onChange((value ?? 'normal') as Priority)}
                />
              )}
            />
          </FormField>
        </div>
        <FormField id='complaint-title' label='Title' required error={errors.title?.message}>
          <Input
            id='complaint-title'
            autoComplete='off'
            maxLength={120}
            placeholder='Fan not working'
            aria-invalid={Boolean(errors.title)}
            {...register('title')}
          />
        </FormField>
        <FormField
          id='complaint-description'
          label='Details'
          required
          error={errors.description?.message}
        >
          <Textarea
            id='complaint-description'
            maxLength={1000}
            aria-invalid={Boolean(errors.description)}
            {...register('description')}
          />
        </FormField>
        <InfoNote>
          Assigning a staff member sends them a message. The complaint turns overdue if it is still
          open after its due time.
        </InfoNote>
      </form>
    </AppModal>
  )
}
