import { Controller, useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { AppModal } from '@/components/common/app-modal'
import { Combobox } from '@/components/common/combobox'
import { DatePicker } from '@/components/common/date-picker'
import { FormField } from '@/components/common/form-field'
import { TimePicker } from '@/components/common/time-picker'
import { Input, Textarea } from '@/components/ui/input'
import { alerts } from '@/lib/alerts'
import { hostelApi, useHostelMutation, type Leave, type LeaveInput } from '../api'
import { LEAVE_KIND, LEAVE_STATUS, labelOptions } from '../labels'
import { FormAlert, InfoNote, SwitchField } from './leave-form-parts'
import { applyApiError, digitsOnly, MOBILE_PATTERN, textOrNull, todayIso } from './leave-helpers'
import { ResidentPicker } from './pickers'

const FORM_ID = 'hostel-leave-form'

const schema = z
  .object({
    admission_id: z.string().min(1, 'Choose a resident'),
    kind: z.enum(['home', 'outing', 'medical', 'festival', 'other']),
    from_date: z.string().min(1, 'Choose the date'),
    to_date: z.string(),
    depart_time: z.string(),
    return_time: z.string(),
    reason: z
      .string()
      .trim()
      .min(3, 'Write the reason (3 characters or more)')
      .max(500, 'Keep the reason to 500 characters'),
    escort_name: z.string().trim().max(120, 'Keep the name to 120 characters'),
    escort_relation: z.string().trim().max(40, 'Keep the relation to 40 characters'),
    escort_mobile: z
      .string()
      .trim()
      .refine((value) => !value || MOBILE_PATTERN.test(value), 'Enter a valid 10-digit mobile'),
    approve_now: z.boolean(),
  })
  .superRefine((values, ctx) => {
    if (values.kind === 'outing') {
      if (!values.depart_time) {
        ctx.addIssue({ code: 'custom', path: ['depart_time'], message: 'Enter when they leave' })
      }
      if (!values.return_time) {
        ctx.addIssue({ code: 'custom', path: ['return_time'], message: 'Enter when they return' })
      }
      if (values.depart_time && values.return_time && values.return_time <= values.depart_time) {
        ctx.addIssue({
          code: 'custom',
          path: ['return_time'],
          message: 'The return time must be after leaving',
        })
      }
    } else if (values.to_date && values.to_date < values.from_date) {
      ctx.addIssue({
        code: 'custom',
        path: ['to_date'],
        message: 'The last day cannot be before the first',
      })
    }
  })

type FormValues = z.infer<typeof schema>

const FIELDS = [
  'admission_id',
  'kind',
  'from_date',
  'to_date',
  'depart_time',
  'return_time',
  'reason',
  'escort_name',
  'escort_relation',
  'escort_mobile',
] as const

export function LeaveFormModal({
  canApprove,
  onClose,
  onCreated,
}: {
  canApprove: boolean
  onClose: () => void
  onCreated: (leave: Leave) => void
}) {
  const create = useHostelMutation((input: LeaveInput) => hostelApi.createLeave(input))
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      admission_id: '',
      kind: 'home',
      from_date: todayIso(),
      to_date: '',
      depart_time: '',
      return_time: '',
      reason: '',
      escort_name: '',
      escort_relation: '',
      escort_mobile: '',
      approve_now: false,
    },
  })
  const kind = useWatch({ control, name: 'kind' })
  const fromDate = useWatch({ control, name: 'from_date' })
  const outing = kind === 'outing'

  const submit = handleSubmit(async (values) => {
    try {
      const leave = await create.mutateAsync({
        admission_id: Number(values.admission_id),
        kind: values.kind,
        from_date: values.from_date,
        to_date: outing ? undefined : values.to_date || values.from_date,
        depart_time: values.depart_time || undefined,
        return_time: values.return_time || undefined,
        reason: values.reason,
        escort_name: textOrNull(values.escort_name),
        escort_relation: textOrNull(values.escort_relation),
        escort_mobile: textOrNull(values.escort_mobile),
        approve_now: canApprove ? values.approve_now : undefined,
      })
      alerts.success('Leave recorded', {
        description: `${leave.leave_no} · ${LEAVE_STATUS[leave.status].label}`,
      })
      onCreated(leave)
      onClose()
    } catch (error) {
      applyApiError(error, setError, FIELDS, {
        HOSTEL_OUTING_OUTSIDE_WINDOW: 'depart_time',
        HOSTEL_LEAVE_OVERLAP: 'from_date',
        HOSTEL_ADMISSION_CLOSED: 'admission_id',
        HOSTEL_NOT_RESIDENT: 'admission_id',
        HOSTEL_ADMISSION_NOT_FOUND: 'admission_id',
      })
    }
  })

  return (
    <AppModal
      open
      onOpenChange={(open) => !open && onClose()}
      title='Record leave'
      description='A home leave, medical leave or a same-day outing for a resident.'
      formId={FORM_ID}
      submitText='Record leave'
      loading={create.isPending}
      size='lg'
    >
      <form id={FORM_ID} noValidate onSubmit={submit} className='grid gap-4'>
        <FormAlert message={errors.root?.message} />
        <div className='grid gap-4 sm:grid-cols-2'>
          <FormField
            id='leave-resident'
            label='Resident'
            required
            error={errors.admission_id?.message}
          >
            <Controller
              control={control}
              name='admission_id'
              render={({ field }) => (
                <ResidentPicker
                  id='leave-resident'
                  label='Resident'
                  value={field.value || undefined}
                  invalid={Boolean(errors.admission_id)}
                  onChange={(value) => field.onChange(value ?? '')}
                />
              )}
            />
          </FormField>
          <FormField id='leave-kind' label='Kind' required error={errors.kind?.message}>
            <Controller
              control={control}
              name='kind'
              render={({ field }) => (
                <Combobox
                  id='leave-kind'
                  label='Kind'
                  value={field.value}
                  placeholder='Choose kind'
                  options={labelOptions(LEAVE_KIND)}
                  highlightSelected={false}
                  className='sm:w-full'
                  onChange={(value) => field.onChange(value ?? 'home')}
                />
              )}
            />
          </FormField>
          <FormField
            id='leave-from'
            label={outing ? 'Date' : 'From'}
            required
            error={errors.from_date?.message}
          >
            <Controller
              control={control}
              name='from_date'
              render={({ field }) => (
                <DatePicker
                  id='leave-from'
                  value={field.value}
                  min={todayIso()}
                  clearable={false}
                  invalid={Boolean(errors.from_date)}
                  onChange={(value: string) => field.onChange(value)}
                />
              )}
            />
          </FormField>
          {!outing && (
            <FormField
              id='leave-to'
              label='To'
              error={errors.to_date?.message}
              hint='Leave empty for one day'
            >
              <Controller
                control={control}
                name='to_date'
                render={({ field }) => (
                  <DatePicker
                    id='leave-to'
                    value={field.value}
                    min={fromDate || todayIso()}
                    invalid={Boolean(errors.to_date)}
                    onChange={(value: string) => field.onChange(value)}
                  />
                )}
              />
            </FormField>
          )}
          <FormField
            id='leave-depart'
            label='Leaves at'
            required={outing}
            error={errors.depart_time?.message}
            hint={outing ? 'Inside the outing window from hostel settings' : 'Optional'}
          >
            <Controller
              control={control}
              name='depart_time'
              render={({ field }) => (
                <TimePicker
                  id='leave-depart'
                  value={field.value}
                  invalid={Boolean(errors.depart_time)}
                  onChange={field.onChange}
                />
              )}
            />
          </FormField>
          <FormField
            id='leave-return'
            label={outing ? 'Back by' : 'Back by (last day)'}
            required={outing}
            error={errors.return_time?.message}
            hint={outing ? undefined : 'Default is the hostel in-time'}
          >
            <Controller
              control={control}
              name='return_time'
              render={({ field }) => (
                <TimePicker
                  id='leave-return'
                  value={field.value}
                  invalid={Boolean(errors.return_time)}
                  onChange={field.onChange}
                />
              )}
            />
          </FormField>
        </div>

        <FormField id='leave-reason' label='Reason' required error={errors.reason?.message}>
          <Textarea
            id='leave-reason'
            maxLength={500}
            placeholder='Grandmother’s birthday'
            aria-invalid={Boolean(errors.reason)}
            {...register('reason')}
          />
        </FormField>

        <div className='grid gap-4 sm:grid-cols-3'>
          <FormField id='leave-escort' label='Escort name' error={errors.escort_name?.message}>
            <Input
              id='leave-escort'
              autoComplete='off'
              placeholder='Kumar R'
              aria-invalid={Boolean(errors.escort_name)}
              {...register('escort_name')}
            />
          </FormField>
          <FormField
            id='leave-escort-relation'
            label='Relation'
            error={errors.escort_relation?.message}
          >
            <Input
              id='leave-escort-relation'
              autoComplete='off'
              placeholder='Father'
              aria-invalid={Boolean(errors.escort_relation)}
              {...register('escort_relation')}
            />
          </FormField>
          <FormField
            id='leave-escort-mobile'
            label='Escort mobile'
            error={errors.escort_mobile?.message}
          >
            <Input
              id='leave-escort-mobile'
              type='tel'
              inputMode='numeric'
              maxLength={10}
              placeholder='9876543210'
              className='tabular'
              aria-invalid={Boolean(errors.escort_mobile)}
              {...register('escort_mobile', { setValueAs: digitsOnly })}
            />
          </FormField>
        </div>

        {canApprove && (
          <Controller
            control={control}
            name='approve_now'
            render={({ field }) => (
              <SwitchField
                id='leave-approve-now'
                label='Approve now'
                description='Skips the approval step when no parent consent is needed.'
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            )}
          />
        )}

        <InfoNote>
          When parent consent is on in hostel settings, a leave recorded here (other than medical)
          waits for the parent to agree in the Parent app before it can be approved.
        </InfoNote>
      </form>
    </AppModal>
  )
}
