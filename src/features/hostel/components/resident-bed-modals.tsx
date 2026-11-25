import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { AppModal } from '@/components/common/app-modal'
import { Combobox } from '@/components/common/combobox'
import { DatePicker } from '@/components/common/date-picker'
import { FormField } from '@/components/common/form-field'
import { Input, Textarea } from '@/components/ui/input'
import { alerts } from '@/lib/alerts'
import { toApiError } from '@/lib/api/errors'
import {
  hostelApi,
  useHostelMutation,
  type AdmissionDetail,
  type AdmissionDetailsInput,
} from '../api'
import { DIET, labelOptions } from '../labels'
import { ResidentPicker, VacantBedSelect } from './pickers'
import {
  applyApiError,
  bedText,
  nullIfEmpty,
  optionalMobile,
  optionalText,
  undefinedIfEmpty,
} from './resident-form'
import { FormError } from './resident-form-parts'

export type BedAction = 'allocate' | 'transfer' | 'swap' | 'vacate'

const BED_FORM_ID = 'hostel-bed-form'
const DETAILS_FORM_ID = 'hostel-details-form'
const DIET_OPTIONS = labelOptions(DIET)

const ACTION_TEXT: Record<
  BedAction,
  { title: string; submit: string; done: string; dateLabel: string; description: string }
> = {
  allocate: {
    title: 'Allocate a bed',
    submit: 'Allocate bed',
    done: 'Bed allocated',
    dateLabel: 'From',
    description: 'Only vacant beds in this hostel are listed.',
  },
  transfer: {
    title: 'Move to another bed',
    submit: 'Transfer',
    done: 'Moved to the new bed',
    dateLabel: 'Transfer date',
    description: 'The current bed becomes vacant on the transfer date.',
  },
  swap: {
    title: 'Swap beds with another resident',
    submit: 'Swap beds',
    done: 'Beds swapped',
    dateLabel: 'Swap date',
    description: 'Both students must have a bed. They exchange beds on the date.',
  },
  vacate: {
    title: 'Vacate the bed',
    submit: 'Vacate bed',
    done: 'Bed vacated',
    dateLabel: 'Vacate on',
    description: 'The student stays admitted without a bed until you allocate one again.',
  },
}

const FIELD_MAP: Record<string, 'target' | 'date' | 'reason'> = {
  bed_id: 'target',
  other_admission_id: 'target',
  from_date: 'date',
  transfer_date: 'date',
  date: 'date',
  reason: 'reason',
}

const TARGET_CODES = new Set([
  'HOSTEL_BED_NOT_VACANT',
  'HOSTEL_BED_NOT_FOUND',
  'HOSTEL_ROOM_NOT_ACTIVE',
  'HOSTEL_SAME_BED',
  'HOSTEL_SWAP_SELF',
  'HOSTEL_GENDER_MISMATCH',
  'HOSTEL_ADMISSION_NOT_FOUND',
])

const bedSchema = z.object({
  target: z.string(),
  date: z.string(),
  reason: optionalText(255, 'Reason'),
})

type BedValues = z.infer<typeof bedSchema>

export function BedActionModal({
  action,
  admission,
  onClose,
}: {
  action: BedAction | null
  admission: AdmissionDetail
  onClose: () => void
}) {
  const run = useHostelMutation(
    ({ kind, values }: { kind: BedAction; values: BedValues }): Promise<AdmissionDetail> => {
      const date = undefinedIfEmpty(values.date)
      const reason = nullIfEmpty(values.reason)
      if (kind === 'allocate') {
        return hostelApi.allocate(admission.id, { bed_id: Number(values.target), from_date: date })
      }
      if (kind === 'transfer') {
        return hostelApi.transfer(admission.id, {
          bed_id: Number(values.target),
          transfer_date: date,
          reason,
        })
      }
      if (kind === 'swap') {
        return hostelApi.swap(admission.id, {
          other_admission_id: Number(values.target),
          transfer_date: date,
          reason,
        })
      }
      return hostelApi.vacate(admission.id, { date, reason })
    }
  )
  const text = action ? ACTION_TEXT[action] : null
  const current = bedText(admission.bed)

  return (
    <AppModal
      open={Boolean(action)}
      onOpenChange={(next) => !next && onClose()}
      title={text?.title ?? ''}
      description={
        text
          ? `${admission.student.name}${current ? ` · now in ${current}` : ''}. ${text.description}`
          : undefined
      }
      formId={BED_FORM_ID}
      submitText={text?.submit}
      loading={run.isPending}
    >
      {action && (
        <BedForm
          key={action}
          action={action}
          admission={admission}
          onSubmit={async (values) => {
            await run.mutateAsync({ kind: action, values })
            alerts.success(ACTION_TEXT[action].done)
            onClose()
          }}
        />
      )}
    </AppModal>
  )
}

function BedForm({
  action,
  admission,
  onSubmit,
}: {
  action: BedAction
  admission: AdmissionDetail
  onSubmit: (values: BedValues) => Promise<void>
}) {
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<BedValues>({
    resolver: zodResolver(bedSchema),
    defaultValues: { target: '', date: '', reason: '' },
  })
  const text = ACTION_TEXT[action]

  const submit = handleSubmit(async (values) => {
    if (action !== 'vacate' && !values.target) {
      setError(
        'target',
        { message: action === 'swap' ? 'Choose the other resident' : 'Choose a vacant bed' },
        { shouldFocus: true }
      )
      return
    }
    try {
      await onSubmit(values)
    } catch (error) {
      const apiError = toApiError(error)
      let mapped = false
      apiError.fieldErrors.forEach((item) => {
        const field = FIELD_MAP[item.field]
        if (!field) return
        setError(field, { message: item.message }, { shouldFocus: !mapped })
        mapped = true
      })
      if (TARGET_CODES.has(apiError.code)) {
        setError('target', { message: apiError.message }, { shouldFocus: !mapped })
        mapped = true
      }
      if (!mapped) setError('root', { message: apiError.message })
    }
  })

  return (
    <form id={BED_FORM_ID} onSubmit={submit} noValidate className='grid gap-4'>
      <FormError message={errors.root?.message} />
      {action === 'allocate' || action === 'transfer' ? (
        <FormField
          id='bed-target'
          label={action === 'allocate' ? 'Bed' : 'New bed'}
          required
          error={errors.target?.message}
          hint={
            action === 'transfer' ? 'Vacant beds in every hostel that fits the student' : undefined
          }
        >
          <Controller
            control={control}
            name='target'
            render={({ field }) => (
              <VacantBedSelect
                id='bed-target'
                hostelId={action === 'allocate' ? admission.hostel_id : undefined}
                value={field.value || undefined}
                invalid={Boolean(errors.target)}
                onChange={(value) => field.onChange(value ?? '')}
              />
            )}
          />
        </FormField>
      ) : action === 'swap' ? (
        <FormField
          id='bed-target'
          label='Swap with'
          required
          error={errors.target?.message}
          hint='Another resident who has a bed'
        >
          <Controller
            control={control}
            name='target'
            render={({ field }) => (
              <ResidentPicker
                id='bed-target'
                label='Resident'
                value={field.value || undefined}
                invalid={Boolean(errors.target)}
                onChange={(value) => field.onChange(value ?? '')}
              />
            )}
          />
        </FormField>
      ) : null}
      <FormField
        id='bed-date'
        label={text.dateLabel}
        error={errors.date?.message}
        hint='Leave empty for today'
      >
        <Controller
          control={control}
          name='date'
          render={({ field }) => (
            <DatePicker
              id='bed-date'
              value={field.value}
              invalid={Boolean(errors.date)}
              onChange={(value: string) => field.onChange(value)}
            />
          )}
        />
      </FormField>
      {action !== 'allocate' && (
        <FormField id='bed-reason' label='Reason' error={errors.reason?.message}>
          <Textarea
            id='bed-reason'
            rows={2}
            aria-invalid={Boolean(errors.reason)}
            {...register('reason')}
          />
        </FormField>
      )}
    </form>
  )
}

const detailsSchema = z.object({
  diet: z.enum(['veg', 'non_veg', 'eggetarian']),
  local_guardian_name: optionalText(120, 'Name'),
  local_guardian_mobile: optionalMobile,
  local_guardian_relation: optionalText(40, 'Relation'),
  local_guardian_address: optionalText(255, 'Address'),
  medical_notes: optionalText(500, 'Medical notes'),
  notes: optionalText(500, 'Notes'),
})

type DetailsValues = z.infer<typeof detailsSchema>

export function ResidentDetailsModal({
  open,
  onOpenChange,
  admission,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  admission: AdmissionDetail
}) {
  const save = useHostelMutation((input: AdmissionDetailsInput) =>
    hostelApi.updateAdmission(admission.id, input)
  )
  return (
    <AppModal
      open={open}
      onOpenChange={onOpenChange}
      title='Edit stay details'
      description={`${admission.student.name} · ${admission.admission_no}`}
      formId={DETAILS_FORM_ID}
      submitText='Save changes'
      loading={save.isPending}
      size='lg'
    >
      {open && (
        <DetailsForm
          admission={admission}
          onSubmit={async (input) => {
            await save.mutateAsync(input)
            alerts.success('Details saved')
            onOpenChange(false)
          }}
        />
      )}
    </AppModal>
  )
}

function DetailsForm({
  admission,
  onSubmit,
}: {
  admission: AdmissionDetail
  onSubmit: (input: AdmissionDetailsInput) => Promise<void>
}) {
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<DetailsValues>({
    resolver: zodResolver(detailsSchema),
    defaultValues: {
      diet: admission.diet,
      local_guardian_name: admission.local_guardian_name ?? '',
      local_guardian_mobile: admission.local_guardian_mobile ?? '',
      local_guardian_relation: admission.local_guardian_relation ?? '',
      local_guardian_address: admission.local_guardian_address ?? '',
      medical_notes: admission.medical_notes ?? '',
      notes: admission.notes ?? '',
    },
  })

  const submit = handleSubmit(async (values) => {
    try {
      await onSubmit({
        diet: values.diet,
        local_guardian_name: nullIfEmpty(values.local_guardian_name),
        local_guardian_mobile: nullIfEmpty(values.local_guardian_mobile),
        local_guardian_relation: nullIfEmpty(values.local_guardian_relation),
        local_guardian_address: nullIfEmpty(values.local_guardian_address),
        medical_notes: nullIfEmpty(values.medical_notes),
        notes: nullIfEmpty(values.notes),
      })
    } catch (error) {
      applyApiError(error, setError, Object.keys(detailsSchema.shape) as (keyof DetailsValues)[])
    }
  })

  return (
    <form id={DETAILS_FORM_ID} onSubmit={submit} noValidate className='grid gap-4 sm:grid-cols-2'>
      <div className='sm:col-span-2'>
        <FormError message={errors.root?.message} />
      </div>
      <FormField id='details-diet' label='Diet' error={errors.diet?.message}>
        <Controller
          control={control}
          name='diet'
          render={({ field }) => (
            <Combobox
              id='details-diet'
              label='Diet'
              value={field.value}
              options={DIET_OPTIONS}
              placeholder='Choose diet'
              highlightSelected={false}
              className='sm:w-full'
              onChange={(value) => field.onChange(value ?? 'veg')}
            />
          )}
        />
      </FormField>
      <FormField
        id='details-lg-name'
        label='Local guardian name'
        error={errors.local_guardian_name?.message}
      >
        <Input
          id='details-lg-name'
          autoComplete='off'
          aria-invalid={Boolean(errors.local_guardian_name)}
          {...register('local_guardian_name')}
        />
      </FormField>
      <FormField
        id='details-lg-mobile'
        label='Local guardian mobile'
        error={errors.local_guardian_mobile?.message}
      >
        <Input
          id='details-lg-mobile'
          type='tel'
          inputMode='numeric'
          maxLength={10}
          className='tabular'
          aria-invalid={Boolean(errors.local_guardian_mobile)}
          {...register('local_guardian_mobile')}
        />
      </FormField>
      <FormField
        id='details-lg-relation'
        label='Relation'
        error={errors.local_guardian_relation?.message}
      >
        <Input
          id='details-lg-relation'
          aria-invalid={Boolean(errors.local_guardian_relation)}
          {...register('local_guardian_relation')}
        />
      </FormField>
      <FormField
        id='details-lg-address'
        label='Local guardian address'
        error={errors.local_guardian_address?.message}
        className='sm:col-span-2'
      >
        <Input
          id='details-lg-address'
          aria-invalid={Boolean(errors.local_guardian_address)}
          {...register('local_guardian_address')}
        />
      </FormField>
      <FormField id='details-medical' label='Medical notes' error={errors.medical_notes?.message}>
        <Textarea
          id='details-medical'
          rows={3}
          aria-invalid={Boolean(errors.medical_notes)}
          {...register('medical_notes')}
        />
      </FormField>
      <FormField id='details-notes' label='Notes' error={errors.notes?.message}>
        <Textarea
          id='details-notes'
          rows={3}
          aria-invalid={Boolean(errors.notes)}
          {...register('notes')}
        />
      </FormField>
    </form>
  )
}
