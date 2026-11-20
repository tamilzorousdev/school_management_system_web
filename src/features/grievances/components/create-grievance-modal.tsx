import { useState } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { AppModal } from '@/components/common/app-modal'
import { Combobox } from '@/components/common/combobox'
import { FormField } from '@/components/common/form-field'
import { Input, Textarea } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { alerts } from '@/lib/alerts'
import { useTeachers } from '@/features/setup/api'
import {
  grievancesApi,
  useGrievanceAction,
  type CreateGrievanceInput,
  type GrievanceCategory,
  type GrievancePriority,
} from '../api'
import { GRIEVANCE_CATEGORY, GRIEVANCE_PRIORITY } from '../labels'

const schema = z.object({
  complainant_type: z.enum(['parent', 'staff', 'student', 'anonymous']),
  complainant_name: z.string().trim().max(100),
  complainant_mobile: z.string().trim(),
  is_anonymous: z.boolean(),
  category: z.enum([
    'transport',
    'academics',
    'safety_bullying',
    'fees_billing',
    'facilities',
    'staff_conduct',
    'workplace_staff',
    'other',
  ]),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  subject: z
    .string()
    .trim()
    .min(5, 'Subject must be at least 5 characters')
    .max(180, 'Subject cannot exceed 180 characters'),
  description: z
    .string()
    .trim()
    .min(10, 'Description must be at least 10 characters')
    .max(3000, 'Description cannot exceed 3000 characters'),
  assigned_to_user_id: z.number().int().min(1).optional(),
  sla_hours: z.number().int().min(1).max(720).optional(),
})

type FormData = z.infer<typeof schema>

interface CreateGrievanceModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function CreateGrievanceModal({
  open,
  onOpenChange,
  onSuccess,
}: CreateGrievanceModalProps) {
  const [loading, setLoading] = useState(false)
  const teachers = useTeachers()
  const createAction = useGrievanceAction((input: CreateGrievanceInput) =>
    grievancesApi.create(input)
  )

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      complainant_type: 'parent',
      complainant_name: '',
      complainant_mobile: '',
      is_anonymous: false,
      category: 'academics',
      priority: 'medium',
      subject: '',
      description: '',
      sla_hours: 48,
    },
  })

  const isAnonymous = useWatch({ control: form.control, name: 'is_anonymous' })

  const onSubmit = async (values: FormData) => {
    setLoading(true)
    try {
      await createAction.mutateAsync({
        complainant_type: values.is_anonymous ? 'anonymous' : values.complainant_type,
        complainant_name: values.is_anonymous ? null : values.complainant_name || null,
        complainant_mobile: values.is_anonymous ? null : values.complainant_mobile || null,
        is_anonymous: values.is_anonymous,
        category: values.category,
        priority: values.priority,
        subject: values.subject,
        description: values.description,
        assigned_to_user_id: values.assigned_to_user_id ?? null,
        sla_hours: values.sla_hours,
      })
      alerts.success('Grievance logged successfully')
      onOpenChange(false)
      form.reset()
      onSuccess?.()
    } catch (err: unknown) {
      alerts.error((err as Error)?.message ?? 'Failed to log grievance')
    } finally {
      setLoading(false)
    }
  }

  const categoryOptions = Object.entries(GRIEVANCE_CATEGORY).map(([key, val]) => ({
    value: key,
    label: val.label,
    hint: val.description,
  }))

  const priorityOptions = Object.entries(GRIEVANCE_PRIORITY).map(([key, val]) => ({
    value: key,
    label: val.label,
  }))

  const officerOptions = (teachers.data ?? []).map((t) => ({
    value: String(t.id),
    label: t.name,
  }))

  return (
    <AppModal
      open={open}
      onOpenChange={onOpenChange}
      title='Log New Grievance'
      description='Record an in-person, telephonic, or internal school complaint.'
      formId='create-grievance-form'
      submitText={loading ? 'Logging...' : 'Submit grievance'}
      loading={loading}
      size='lg'
    >
      <form
        id='create-grievance-form'
        onSubmit={form.handleSubmit(onSubmit)}
        className='grid gap-4 py-2'
      >
        <div className='flex items-center justify-between rounded-lg border p-3 bg-muted/20'>
          <div className='grid gap-0.5'>
            <span className='text-sm font-semibold'>Anonymous Submission</span>
            <span className='text-xs text-muted-foreground'>
              Hide complainant personal identity from teachers and assigned officers.
            </span>
          </div>
          <Controller
            control={form.control}
            name='is_anonymous'
            render={({ field }) => (
              <Switch checked={field.value} onCheckedChange={field.onChange} />
            )}
          />
        </div>

        {!isAnonymous && (
          <div className='grid gap-4 sm:grid-cols-2'>
            <FormField
              id='grievance-complainant-name'
              label='Complainant Name'
              error={form.formState.errors.complainant_name?.message}
            >
              <Input
                id='grievance-complainant-name'
                {...form.register('complainant_name')}
                placeholder='e.g. Ramesh Kumar'
              />
            </FormField>

            <FormField
              id='grievance-complainant-mobile'
              label='Mobile Number'
              error={form.formState.errors.complainant_mobile?.message}
            >
              <Input
                id='grievance-complainant-mobile'
                {...form.register('complainant_mobile')}
                placeholder='10-digit mobile number'
                maxLength={10}
              />
            </FormField>
          </div>
        )}

        <div className='grid gap-4 sm:grid-cols-2'>
          <FormField
            id='grievance-category'
            label='Category'
            error={form.formState.errors.category?.message}
            required
          >
            <Controller
              control={form.control}
              name='category'
              render={({ field }) => (
                <Combobox
                  id='grievance-category'
                  label='Category'
                  options={categoryOptions}
                  value={field.value}
                  onChange={(val) => field.onChange(val as GrievanceCategory)}
                  placeholder='Choose category'
                />
              )}
            />
          </FormField>

          <FormField
            id='grievance-priority'
            label='Priority'
            error={form.formState.errors.priority?.message}
            required
          >
            <Controller
              control={form.control}
              name='priority'
              render={({ field }) => (
                <Combobox
                  id='grievance-priority'
                  label='Priority'
                  options={priorityOptions}
                  value={field.value}
                  onChange={(val) => field.onChange(val as GrievancePriority)}
                  placeholder='Choose priority'
                />
              )}
            />
          </FormField>
        </div>

        <FormField
          id='grievance-subject'
          label='Subject'
          error={form.formState.errors.subject?.message}
          required
        >
          <Input
            id='grievance-subject'
            {...form.register('subject')}
            placeholder='Short title summarizing the grievance'
          />
        </FormField>

        <FormField
          id='grievance-description'
          label='Full Narrative Description'
          error={form.formState.errors.description?.message}
          required
        >
          <Textarea
            id='grievance-description'
            {...form.register('description')}
            placeholder='Provide detailed facts, dates, witnesses, and context...'
            rows={4}
          />
        </FormField>

        <div className='grid gap-4 sm:grid-cols-2'>
          <FormField
            id='grievance-assignee'
            label='Assign Initial Officer (Optional)'
            error={form.formState.errors.assigned_to_user_id?.message}
          >
            <Controller
              control={form.control}
              name='assigned_to_user_id'
              render={({ field }) => (
                <Combobox
                  id='grievance-assignee'
                  label='Initial Officer'
                  options={officerOptions}
                  value={field.value ? String(field.value) : ''}
                  onChange={(val) => field.onChange(val ? Number(val) : undefined)}
                  placeholder='Assign to staff...'
                />
              )}
            />
          </FormField>

          <FormField
            id='grievance-sla-hours'
            label='Target SLA (Hours)'
            error={form.formState.errors.sla_hours?.message}
          >
            <Controller
              control={form.control}
              name='sla_hours'
              render={({ field }) => (
                <Input
                  id='grievance-sla-hours'
                  type='number'
                  value={field.value ?? ''}
                  onChange={(e) =>
                    field.onChange(e.target.value ? Number(e.target.value) : undefined)
                  }
                  placeholder='e.g. 24 or 48'
                  min={1}
                  max={720}
                />
              )}
            />
          </FormField>
        </div>
      </form>
    </AppModal>
  )
}
