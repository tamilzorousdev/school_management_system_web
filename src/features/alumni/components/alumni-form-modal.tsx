import { Controller, useForm, type Control } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { AppModal } from '@/components/common/app-modal'
import { Combobox } from '@/components/common/combobox'
import { DatePicker } from '@/components/common/date-picker'
import { FormField } from '@/components/common/form-field'
import { Input, Textarea } from '@/components/ui/input'
import { alerts } from '@/lib/alerts'
import { useUpdateAlumnus, type AlumniDetail, type AlumniProfileInput } from '../api'
import {
  applyApiErrors,
  batchYearText,
  CAREER_FIELDS,
  CONTACT_FIELDS,
  contactInput,
  contactShape,
  contactValues,
  currentYear,
  numberOrNull,
  orNull,
  percentText,
  text,
  type ContactValues,
} from '../form'
import { EXIT_TYPE, FINAL_RESULT, GENDER, toOptions, toneOptions } from '../labels'
import {
  ConsentField,
  ContactTextFields,
  FormSection,
  OccupationField,
  RootError,
} from './form-parts'

const FORM_ID = 'alumni-form'
const GENDER_OPTIONS = toOptions(GENDER)
const EXIT_OPTIONS = toneOptions(EXIT_TYPE)
const RESULT_OPTIONS = toneOptions(FINAL_RESULT)

const schema = z.object({
  ...contactShape,
  first_name: z
    .string()
    .trim()
    .min(1, 'Enter the first name')
    .max(60, 'Must be 60 characters or less'),
  last_name: text(60),
  gender: z.enum(['male', 'female', 'other']).or(z.literal('')),
  dob: z.string(),
  admission_no: text(30),
  admission_date: z.string(),
  batch_year: batchYearText,
  left_on: z.string(),
  exit_type: z.enum(['graduated', 'transferred', 'withdrawn']),
  final_academic_year_name: text(20),
  final_class_name: text(30),
  final_section_name: text(10),
  final_percent: percentText,
  final_grade: text(5),
  final_result: z.enum(['pass', 'fail']).or(z.literal('')),
  tc_no: text(40),
  notes: text(2000),
})

type FormValues = z.infer<typeof schema>
const FIELDS = Object.keys(schema.shape)

interface AlumniFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  alumnus: AlumniDetail | null
  onSaved?: (saved: AlumniDetail) => void
}

export function AlumniFormModal({ open, onOpenChange, alumnus, onSaved }: AlumniFormModalProps) {
  const update = useUpdateAlumnus(alumnus?.id ?? 0)

  return (
    <AppModal
      open={open}
      onOpenChange={onOpenChange}
      title='Edit alumni record'
      description='Every changed field is kept in the change history.'
      formId={FORM_ID}
      submitText='Save changes'
      loading={update.isPending}
      size='xl'
    >
      {open && alumnus && (
        <AlumniForm
          key={alumnus.id}
          alumnus={alumnus}
          onSubmit={async (input) => {
            const saved = await update.mutateAsync(input)
            alerts.success('Alumni record updated')
            onOpenChange(false)
            onSaved?.(saved)
          }}
        />
      )}
    </AppModal>
  )
}

function defaults(alumnus: AlumniDetail): FormValues {
  return {
    ...contactValues(alumnus),
    first_name: alumnus.first_name,
    last_name: alumnus.last_name ?? '',
    gender: alumnus.gender ?? '',
    dob: alumnus.dob ?? '',
    admission_no: alumnus.admission_no ?? '',
    admission_date: alumnus.admission_date ?? '',
    batch_year: String(alumnus.batch_year),
    left_on: alumnus.left_on ?? '',
    exit_type: alumnus.exit_type,
    final_academic_year_name: alumnus.final_academic_year_name ?? '',
    final_class_name: alumnus.final_class_name ?? '',
    final_section_name: alumnus.final_section_name ?? '',
    final_percent: alumnus.final_percent === null ? '' : String(alumnus.final_percent),
    final_grade: alumnus.final_grade ?? '',
    final_result: alumnus.final_result ?? '',
    tc_no: alumnus.tc_no ?? '',
    notes: alumnus.notes ?? '',
  }
}

function toInput(values: FormValues): AlumniProfileInput & {
  first_name: string
  batch_year: number
} {
  return {
    ...contactInput(values),
    first_name: values.first_name.trim(),
    batch_year: Number(values.batch_year),
    last_name: orNull(values.last_name),
    gender: values.gender || null,
    dob: values.dob || null,
    admission_no: orNull(values.admission_no),
    admission_date: values.admission_date || null,
    left_on: values.left_on || null,
    exit_type: values.exit_type,
    final_academic_year_name: orNull(values.final_academic_year_name),
    final_class_name: orNull(values.final_class_name),
    final_section_name: orNull(values.final_section_name),
    final_percent: numberOrNull(values.final_percent),
    final_grade: orNull(values.final_grade),
    final_result: values.final_result || null,
    tc_no: orNull(values.tc_no),
    notes: orNull(values.notes),
  }
}

function AlumniForm({
  alumnus,
  onSubmit,
}: {
  alumnus: AlumniDetail
  onSubmit: (input: ReturnType<typeof toInput>) => Promise<void>
}) {
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: defaults(alumnus) })
  const contactControl = control as unknown as Control<ContactValues>

  const submit = handleSubmit(async (values) => {
    try {
      await onSubmit(toInput(values))
    } catch (error) {
      applyApiErrors(error, FIELDS, setError)
    }
  })

  const textField = (
    name: keyof FormValues,
    label: string,
    options: {
      placeholder?: string
      required?: boolean
      maxLength?: number
      inputMode?: 'numeric' | 'decimal'
      autoFocus?: boolean
    } = {}
  ) => (
    <FormField
      id={`a-${name}`}
      label={label}
      required={options.required}
      error={errors[name]?.message}
    >
      <Input
        id={`a-${name}`}
        autoComplete='off'
        autoFocus={options.autoFocus}
        placeholder={options.placeholder}
        maxLength={options.maxLength}
        inputMode={options.inputMode}
        aria-invalid={Boolean(errors[name])}
        {...register(name)}
      />
    </FormField>
  )

  const dateField = (name: 'dob' | 'admission_date' | 'left_on', label: string) => (
    <FormField id={`a-${name}`} label={label} error={errors[name]?.message}>
      <Controller
        control={control}
        name={name}
        render={({ field }) => (
          <DatePicker
            id={`a-${name}`}
            value={field.value}
            max={new Date().toISOString().slice(0, 10)}
            clearable
            invalid={Boolean(errors[name])}
            onChange={(value: string) => field.onChange(value)}
          />
        )}
      />
    </FormField>
  )

  return (
    <form id={FORM_ID} onSubmit={submit} noValidate className='grid gap-6'>
      <RootError message={errors.root?.message} />

      <FormSection title='Who they are'>
        {textField('first_name', 'First name', {
          required: true,
          placeholder: 'Priya',
          maxLength: 60,
          autoFocus: true,
        })}
        {textField('last_name', 'Last name', { placeholder: 'Narayanan', maxLength: 60 })}
        <FormField id='a-gender' label='Gender' error={errors.gender?.message}>
          <Controller
            control={control}
            name='gender'
            render={({ field }) => (
              <Combobox
                id='a-gender'
                label='Gender'
                value={field.value || undefined}
                placeholder='Not given'
                searchPlaceholder='Search'
                options={GENDER_OPTIONS}
                onChange={(value) => field.onChange(value ?? '')}
                className='sm:w-full'
              />
            )}
          />
        </FormField>
        {dateField('dob', 'Date of birth')}
        {textField('admission_no', 'Admission no', {
          placeholder: 'ADM-2014-0042',
          maxLength: 30,
        })}
        {dateField('admission_date', 'Admitted on')}
      </FormSection>

      <FormSection title='Leaving school'>
        {textField('batch_year', 'Batch (year they left)', {
          required: true,
          placeholder: String(currentYear()),
          maxLength: 4,
          inputMode: 'numeric',
        })}
        {dateField('left_on', 'Left on')}
        <FormField id='a-exit' label='How they left' required error={errors.exit_type?.message}>
          <Controller
            control={control}
            name='exit_type'
            render={({ field }) => (
              <Combobox
                id='a-exit'
                label='How they left'
                value={field.value}
                placeholder='Choose one'
                searchPlaceholder='Search'
                options={EXIT_OPTIONS}
                onChange={(value) => field.onChange(value ?? 'graduated')}
                highlightSelected={false}
                className='sm:w-full'
              />
            )}
          />
        </FormField>
        {textField('final_academic_year_name', 'Final academic year', {
          placeholder: '2025-26',
          maxLength: 20,
        })}
        {textField('final_class_name', 'Final class', { placeholder: 'Class 12', maxLength: 30 })}
        {textField('final_section_name', 'Final section', { placeholder: 'A', maxLength: 10 })}
        {textField('final_percent', 'Final %', {
          placeholder: '86.4',
          maxLength: 6,
          inputMode: 'decimal',
        })}
        {textField('final_grade', 'Final grade', { placeholder: 'A1', maxLength: 5 })}
        <FormField id='a-result' label='Final result' error={errors.final_result?.message}>
          <Controller
            control={control}
            name='final_result'
            render={({ field }) => (
              <Combobox
                id='a-result'
                label='Final result'
                value={field.value || undefined}
                placeholder='Not recorded'
                searchPlaceholder='Search'
                options={RESULT_OPTIONS}
                onChange={(value) => field.onChange(value ?? '')}
                className='sm:w-full'
              />
            )}
          />
        </FormField>
        {textField('tc_no', 'TC number', { placeholder: 'TZS-TC-2025-0012', maxLength: 40 })}
      </FormSection>

      <FormSection title='Contact'>
        <ContactTextFields control={contactControl} fields={CONTACT_FIELDS} prefix='a' />
        <ConsentField control={contactControl} prefix='a' />
      </FormSection>

      <FormSection title='After school'>
        <OccupationField control={contactControl} prefix='a' />
        <ContactTextFields control={contactControl} fields={CAREER_FIELDS} prefix='a' />
      </FormSection>

      <FormField
        id='a-notes'
        label='Staff notes'
        error={errors.notes?.message}
        hint='Only staff see this.'
      >
        <Textarea
          id='a-notes'
          rows={3}
          maxLength={2000}
          placeholder='Head girl 2025-26.'
          {...register('notes')}
        />
      </FormField>
    </form>
  )
}
