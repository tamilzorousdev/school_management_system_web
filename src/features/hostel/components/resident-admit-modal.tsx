import { Controller, useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { AppModal } from '@/components/common/app-modal'
import { Combobox } from '@/components/common/combobox'
import { DatePicker } from '@/components/common/date-picker'
import { FormField } from '@/components/common/form-field'
import { Input, Textarea } from '@/components/ui/input'
import { alerts } from '@/lib/alerts'
import { hostelApi, useHostelMutation, type AdmissionDetail, type AdmissionInput } from '../api'
import { DIET, labelOptions } from '../labels'
import { HostelSelect, StudentPicker, VacantBedSelect } from './pickers'
import {
  applyApiError,
  nullIfEmpty,
  optionalMobile,
  optionalText,
  todayIso,
  undefinedIfEmpty,
} from './resident-form'
import { FormError } from './resident-form-parts'

const FORM_ID = 'hostel-admit-form'
const DIET_OPTIONS = labelOptions(DIET)

const schema = z.object({
  student_id: z.string().min(1, 'Choose a student'),
  hostel_id: z.string().min(1, 'Choose a hostel'),
  bed_id: z.string(),
  admitted_on: z.string(),
  diet: z.enum(['veg', 'non_veg', 'eggetarian']),
  local_guardian_name: optionalText(120, 'Name'),
  local_guardian_mobile: optionalMobile,
  local_guardian_relation: optionalText(40, 'Relation'),
  local_guardian_address: optionalText(255, 'Address'),
  medical_notes: optionalText(500, 'Medical notes'),
  notes: optionalText(500, 'Notes'),
})

type FormValues = z.infer<typeof schema>

export interface AdmitPrefill {
  student?: { value: string; label: string; hint?: string }
  hostel_id?: number | null
  application_id?: number
}

export function AdmitModal({
  prefill,
  onClose,
  onAdmitted,
}: {
  prefill: AdmitPrefill | null
  onClose: () => void
  onAdmitted?: (admission: AdmissionDetail) => void
}) {
  const admit = useHostelMutation((input: AdmissionInput) => hostelApi.admit(input))
  const open = Boolean(prefill)
  return (
    <AppModal
      open={open}
      onOpenChange={(next) => !next && onClose()}
      title={prefill?.application_id ? 'Admit from application' : 'Admit a student'}
      description='Choose a bed now, or admit first and allocate a bed when one is free.'
      formId={FORM_ID}
      submitText='Admit student'
      loading={admit.isPending}
      size='lg'
    >
      {prefill && (
        <AdmitForm
          prefill={prefill}
          onSubmit={async (input) => {
            const admission = await admit.mutateAsync(input)
            alerts.success(`${admission.student.name} admitted`, {
              description: admission.bed
                ? `Bed ${admission.bed.room_no} / ${admission.bed.bed_no}`
                : 'Allocate a bed when one is free.',
            })
            onClose()
            onAdmitted?.(admission)
          }}
        />
      )}
    </AppModal>
  )
}

function AdmitForm({
  prefill,
  onSubmit,
}: {
  prefill: AdmitPrefill
  onSubmit: (input: AdmissionInput) => Promise<void>
}) {
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
      student_id: prefill.student?.value ?? '',
      hostel_id: prefill.hostel_id ? String(prefill.hostel_id) : '',
      bed_id: '',
      admitted_on: todayIso(),
      diet: 'veg',
      local_guardian_name: '',
      local_guardian_mobile: '',
      local_guardian_relation: '',
      local_guardian_address: '',
      medical_notes: '',
      notes: '',
    },
  })
  const hostelId = Number(useWatch({ control, name: 'hostel_id' })) || undefined

  const submit = handleSubmit(async (values) => {
    try {
      await onSubmit({
        student_id: Number(values.student_id),
        hostel_id: Number(values.hostel_id),
        bed_id: values.bed_id ? Number(values.bed_id) : undefined,
        application_id: prefill.application_id,
        admitted_on: undefinedIfEmpty(values.admitted_on),
        diet: values.diet,
        local_guardian_name: nullIfEmpty(values.local_guardian_name),
        local_guardian_mobile: nullIfEmpty(values.local_guardian_mobile),
        local_guardian_relation: nullIfEmpty(values.local_guardian_relation),
        local_guardian_address: nullIfEmpty(values.local_guardian_address),
        medical_notes: nullIfEmpty(values.medical_notes),
        notes: nullIfEmpty(values.notes),
      })
    } catch (error) {
      applyApiError(error, setError, Object.keys(schema.shape) as (keyof FormValues)[], {
        HOSTEL_ALREADY_ADMITTED: 'student_id',
        HOSTEL_STUDENT_NOT_ACTIVE: 'student_id',
        STUDENT_NOT_FOUND: 'student_id',
        HOSTEL_GENDER_MISMATCH: 'hostel_id',
        HOSTEL_INACTIVE: 'hostel_id',
        HOSTEL_BED_NOT_VACANT: 'bed_id',
        HOSTEL_ROOM_NOT_ACTIVE: 'bed_id',
        HOSTEL_BED_NOT_FOUND: 'bed_id',
      })
    }
  })

  return (
    <form id={FORM_ID} onSubmit={submit} noValidate className='grid gap-5'>
      <FormError message={errors.root?.message} />
      <div className='grid gap-4 sm:grid-cols-2'>
        <FormField
          id='admit-student'
          label='Student'
          required
          error={errors.student_id?.message}
          className='sm:col-span-2'
          hint={prefill.application_id ? 'From the approved application' : undefined}
        >
          <Controller
            control={control}
            name='student_id'
            render={({ field }) => (
              <StudentPicker
                id='admit-student'
                label='Student'
                value={field.value || undefined}
                initial={prefill.student ?? null}
                invalid={Boolean(errors.student_id)}
                onChange={(value) => field.onChange(value ?? '')}
              />
            )}
          />
        </FormField>
        <FormField
          id='admit-hostel'
          label='Hostel'
          required
          error={errors.hostel_id?.message}
          hint='Boys hostels take boys only, girls hostels girls only'
        >
          <Controller
            control={control}
            name='hostel_id'
            render={({ field }) => (
              <HostelSelect
                id='admit-hostel'
                value={field.value || undefined}
                invalid={Boolean(errors.hostel_id)}
                onChange={(value) => {
                  field.onChange(value ?? '')
                  setValue('bed_id', '')
                }}
              />
            )}
          />
        </FormField>
        <FormField
          id='admit-bed'
          label='Bed'
          error={errors.bed_id?.message}
          hint={hostelId ? 'Leave empty to allocate later' : 'Choose the hostel first'}
        >
          <Controller
            control={control}
            name='bed_id'
            render={({ field }) => (
              <VacantBedSelect
                id='admit-bed'
                hostelId={hostelId}
                value={field.value || undefined}
                invalid={Boolean(errors.bed_id)}
                onChange={(value) => field.onChange(value ?? '')}
              />
            )}
          />
        </FormField>
        <FormField id='admit-date' label='Admitted on' error={errors.admitted_on?.message}>
          <Controller
            control={control}
            name='admitted_on'
            render={({ field }) => (
              <DatePicker
                id='admit-date'
                value={field.value}
                invalid={Boolean(errors.admitted_on)}
                onChange={(value: string) => field.onChange(value)}
              />
            )}
          />
        </FormField>
        <FormField id='admit-diet' label='Diet' error={errors.diet?.message}>
          <Controller
            control={control}
            name='diet'
            render={({ field }) => (
              <Combobox
                id='admit-diet'
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
      </div>

      <fieldset className='grid gap-4'>
        <legend className='mb-1 text-xs font-bold tracking-wider text-muted-foreground uppercase'>
          Local guardian
        </legend>
        <div className='grid gap-4 sm:grid-cols-2'>
          <FormField id='admit-lg-name' label='Name' error={errors.local_guardian_name?.message}>
            <Input
              id='admit-lg-name'
              autoComplete='off'
              aria-invalid={Boolean(errors.local_guardian_name)}
              {...register('local_guardian_name')}
            />
          </FormField>
          <FormField
            id='admit-lg-mobile'
            label='Mobile'
            error={errors.local_guardian_mobile?.message}
          >
            <Input
              id='admit-lg-mobile'
              type='tel'
              inputMode='numeric'
              maxLength={10}
              className='tabular'
              aria-invalid={Boolean(errors.local_guardian_mobile)}
              {...register('local_guardian_mobile')}
            />
          </FormField>
          <FormField
            id='admit-lg-relation'
            label='Relation'
            error={errors.local_guardian_relation?.message}
          >
            <Input
              id='admit-lg-relation'
              placeholder='Uncle'
              aria-invalid={Boolean(errors.local_guardian_relation)}
              {...register('local_guardian_relation')}
            />
          </FormField>
          <FormField
            id='admit-lg-address'
            label='Address'
            error={errors.local_guardian_address?.message}
          >
            <Input
              id='admit-lg-address'
              aria-invalid={Boolean(errors.local_guardian_address)}
              {...register('local_guardian_address')}
            />
          </FormField>
        </div>
      </fieldset>

      <div className='grid gap-4 sm:grid-cols-2'>
        <FormField id='admit-medical' label='Medical notes' error={errors.medical_notes?.message}>
          <Textarea
            id='admit-medical'
            rows={3}
            placeholder='Allergies, regular medicines'
            aria-invalid={Boolean(errors.medical_notes)}
            {...register('medical_notes')}
          />
        </FormField>
        <FormField id='admit-notes' label='Notes' error={errors.notes?.message}>
          <Textarea
            id='admit-notes'
            rows={3}
            aria-invalid={Boolean(errors.notes)}
            {...register('notes')}
          />
        </FormField>
      </div>
    </form>
  )
}
