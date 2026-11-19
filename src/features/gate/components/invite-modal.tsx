import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { CheckCircle2 } from 'lucide-react'
import { z } from 'zod'
import { AppModal } from '@/components/common/app-modal'
import { Combobox, type ComboboxOption } from '@/components/common/combobox'
import { FormField } from '@/components/common/form-field'
import { Button } from '@/components/ui/button'
import { Input, Textarea } from '@/components/ui/input'
import { today } from '@/features/attendance/labels'
import { applyFieldErrors } from '@/features/maintenance/helpers'
import { FormAlert } from '@/features/maintenance/components/shared'
import { useDebouncedValue } from '@/hooks/use-debounce'
import { alerts } from '@/lib/alerts'
import { toApiError } from '@/lib/api/errors'
import { formatDate } from '@/lib/format'
import {
  gateApi,
  useGateMutation,
  useGateStaff,
  useGateStudents,
  type InviteInput,
  type Visit,
  type VisitPurpose,
} from '../api'
import { VISIT_PURPOSE_OPTIONS, timeWindow } from '../labels'

const FORM_ID = 'gate-invite-form'
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/

const optionalTime = (message: string) =>
  z.string().refine((value) => !value || TIME.test(value), message)

const schema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, 'Enter the name, 2 to 80 letters')
      .max(80, 'Enter the name, 2 to 80 letters'),
    mobile: z
      .string()
      .trim()
      .regex(/^[6-9]\d{9}$/, 'Enter a 10-digit mobile number'),
    purpose: z.string().min(1, 'Choose why they are coming'),
    purpose_note: z.string().trim().max(300, 'Note must be 300 characters or less'),
    host_user_id: z.string(),
    student_id: z.string(),
    visit_date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Choose the date')
      .refine((value) => value >= today(), 'The date cannot be in the past'),
    expected_from: optionalTime('Choose a time'),
    expected_until: optionalTime('Choose a time'),
    company: z.string().trim().max(100, 'Company must be 100 characters or less'),
    people_count: z
      .string()
      .trim()
      .refine((value) => {
        const number = Number(value || 1)
        return Number.isInteger(number) && number >= 1 && number <= 50
      }, 'Enter 1 to 50 people'),
    vehicle_no: z.string().trim().max(15, 'Vehicle number must be 15 characters or less'),
  })
  .refine(
    (values) =>
      !values.expected_from ||
      !values.expected_until ||
      values.expected_until > values.expected_from,
    { path: ['expected_until'], message: 'Until must be after the from time' }
  )

type FormValues = z.infer<typeof schema>

const FIELDS: (keyof FormValues)[] = [
  'name',
  'mobile',
  'purpose',
  'purpose_note',
  'host_user_id',
  'student_id',
  'visit_date',
  'expected_from',
  'expected_until',
  'company',
  'people_count',
  'vehicle_no',
]

interface InviteModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function InviteModal({ open, onOpenChange }: InviteModalProps) {
  const save = useGateMutation((input: InviteInput) => gateApi.invite(input))
  const [created, setCreated] = useState<Visit | null>(null)
  const [wasOpen, setWasOpen] = useState(open)
  if (open !== wasOpen) {
    setWasOpen(open)
    if (open) setCreated(null)
  }

  return (
    <AppModal
      open={open}
      onOpenChange={onOpenChange}
      title={created ? 'Visitor invited' : 'Invite visitor'}
      description={
        created
          ? undefined
          : 'They get an SMS with a slip number and a 4-digit code to show at the gate.'
      }
      formId={created ? undefined : FORM_ID}
      submitText='Invite'
      loading={save.isPending}
      size='lg'
      footer={
        created ? (
          <div className='flex justify-end'>
            <Button onClick={() => onOpenChange(false)}>Done</Button>
          </div>
        ) : undefined
      }
    >
      {created ? (
        <InviteResult visit={created} />
      ) : (
        open && (
          <InviteForm
            onSubmit={async (input) => {
              const visit = await save.mutateAsync(input)
              alerts.success('Visitor invited')
              setCreated(visit)
            }}
          />
        )
      )}
    </AppModal>
  )
}

function InviteResult({ visit }: { visit: Visit }) {
  return (
    <div className='grid gap-4'>
      <p className='flex items-start gap-2 rounded-md border border-success/30 bg-success/10 px-3 py-2 text-sm font-medium text-success'>
        <CheckCircle2 className='mt-0.5 size-4 shrink-0' />
        Sent by SMS to {visit.mobile}. {visit.name} shows the slip number or the code at the gate.
      </p>
      <div className='grid gap-3 rounded-lg border bg-muted/40 p-4 sm:grid-cols-2'>
        <div className='grid gap-0.5'>
          <span className='text-[11px] font-bold tracking-wider text-muted-foreground uppercase'>
            Slip number
          </span>
          <span className='font-mono text-2xl font-bold tracking-wide'>{visit.visit_no}</span>
        </div>
        <div className='grid gap-0.5'>
          <span className='text-[11px] font-bold tracking-wider text-muted-foreground uppercase'>
            Gate code
          </span>
          <span className='font-mono text-2xl font-bold tracking-[0.3em]'>{visit.code ?? '—'}</span>
        </div>
        <span className='text-sm text-muted-foreground sm:col-span-2'>
          {formatDate(visit.visit_date)} · {timeWindow(visit.expected_from, visit.expected_until)}
          {visit.host ? ` · to meet ${visit.host.name}` : ''}
        </span>
      </div>
    </div>
  )
}

function InviteForm({ onSubmit }: { onSubmit: (input: InviteInput) => Promise<void> }) {
  const [staffQuery, setStaffQuery] = useState('')
  const [studentQuery, setStudentQuery] = useState('')
  const staff = useGateStaff(useDebouncedValue(staffQuery))
  const studentSearch = useDebouncedValue(studentQuery)
  const students = useGateStudents(studentSearch)
  const [hostOption, setHostOption] = useState<ComboboxOption | null>(null)
  const [studentOption, setStudentOption] = useState<ComboboxOption | null>(null)
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      mobile: '',
      purpose: '',
      purpose_note: '',
      host_user_id: '',
      student_id: '',
      visit_date: today(),
      expected_from: '',
      expected_until: '',
      company: '',
      people_count: '1',
      vehicle_no: '',
    },
  })

  const keep = (options: ComboboxOption[], chosen: ComboboxOption | null) =>
    chosen && !options.some((option) => option.value === chosen.value)
      ? [chosen, ...options]
      : options
  const staffOptions = keep(
    (staff.data ?? []).map((item) => ({
      value: String(item.id),
      label: item.name,
      hint: item.role ?? undefined,
    })),
    hostOption
  )
  const studentOptions = keep(
    (students.data ?? []).map((item) => ({
      value: String(item.student.id),
      label: item.student.name,
      hint: [item.student.class_section, item.student.admission_no].filter(Boolean).join(' · '),
    })),
    studentOption
  )

  const submit = handleSubmit(async (values) => {
    try {
      await onSubmit({
        name: values.name,
        mobile: values.mobile,
        purpose: values.purpose as VisitPurpose,
        purpose_note: values.purpose_note || undefined,
        host_user_id: values.host_user_id ? Number(values.host_user_id) : undefined,
        student_id: values.student_id ? Number(values.student_id) : undefined,
        visit_date: values.visit_date,
        expected_from: values.expected_from || undefined,
        expected_until: values.expected_until || undefined,
        company: values.company || undefined,
        people_count: Number(values.people_count || 1),
        vehicle_no: values.vehicle_no || undefined,
      })
    } catch (error) {
      const apiError = toApiError(error)
      if (!applyFieldErrors(apiError, FIELDS, setError))
        setError('root', { message: apiError.message })
    }
  })

  return (
    <form id={FORM_ID} onSubmit={submit} noValidate className='grid gap-4 sm:grid-cols-2'>
      <FormAlert message={errors.root?.message} />
      <FormField id='invite-name' label='Name' required error={errors.name?.message}>
        <Input
          id='invite-name'
          maxLength={80}
          placeholder='Suresh Babu'
          aria-invalid={Boolean(errors.name) || undefined}
          {...register('name')}
        />
      </FormField>
      <FormField id='invite-mobile' label='Mobile' required error={errors.mobile?.message}>
        <Input
          id='invite-mobile'
          inputMode='numeric'
          maxLength={10}
          placeholder='9876500033'
          aria-invalid={Boolean(errors.mobile) || undefined}
          {...register('mobile')}
        />
      </FormField>
      <FormField id='invite-purpose' label='Purpose' required error={errors.purpose?.message}>
        <Controller
          control={control}
          name='purpose'
          render={({ field }) => (
            <Combobox
              id='invite-purpose'
              label='Purpose'
              value={field.value || undefined}
              options={VISIT_PURPOSE_OPTIONS}
              placeholder='Choose why they are coming'
              searchPlaceholder='Search purposes'
              highlightSelected={false}
              className='sm:w-full'
              invalid={Boolean(errors.purpose)}
              onChange={(value) => field.onChange(value ?? '')}
            />
          )}
        />
      </FormField>
      <FormField
        id='invite-host'
        label='To meet'
        error={errors.host_user_id?.message}
        hint='Leave empty and the office decides'
      >
        <Controller
          control={control}
          name='host_user_id'
          render={({ field }) => (
            <Combobox
              id='invite-host'
              label='To meet'
              value={field.value || undefined}
              options={staffOptions}
              onSearch={setStaffQuery}
              allLabel='The office decides'
              placeholder='The office decides'
              searchPlaceholder='Search staff'
              emptyText={staff.isFetching ? 'Searching…' : 'No staff found'}
              highlightSelected={false}
              className='sm:w-full'
              onChange={(value) => {
                field.onChange(value ?? '')
                setHostOption(staffOptions.find((option) => option.value === value) ?? null)
              }}
            />
          )}
        />
      </FormField>
      <FormField
        id='invite-note'
        label='Note'
        error={errors.purpose_note?.message}
        className='sm:col-span-2'
      >
        <Textarea
          id='invite-note'
          rows={2}
          maxLength={300}
          placeholder='Science fair stall setup'
          aria-invalid={Boolean(errors.purpose_note) || undefined}
          {...register('purpose_note')}
        />
      </FormField>
      <FormField
        id='invite-student'
        label='About a student'
        error={errors.student_id?.message}
        hint='Optional'
        className='sm:col-span-2'
      >
        <Controller
          control={control}
          name='student_id'
          render={({ field }) => (
            <Combobox
              id='invite-student'
              label='About a student'
              value={field.value || undefined}
              options={studentOptions}
              onSearch={setStudentQuery}
              allLabel='No student'
              placeholder='No student'
              searchPlaceholder='Search name, admission number or class'
              emptyText={
                studentSearch.trim().length < 2
                  ? 'Type 2 or more letters'
                  : students.isFetching
                    ? 'Searching…'
                    : 'No students found'
              }
              highlightSelected={false}
              className='sm:w-full'
              onChange={(value) => {
                field.onChange(value ?? '')
                setStudentOption(studentOptions.find((option) => option.value === value) ?? null)
              }}
            />
          )}
        />
      </FormField>
      <FormField id='invite-date' label='Date' required error={errors.visit_date?.message}>
        <Controller
          control={control}
          name='visit_date'
          render={({ field }) => (
            <Input
              id='invite-date'
              type='date'
              min={today()}
              aria-invalid={Boolean(errors.visit_date) || undefined}
              value={field.value}
              onChange={(event) => field.onChange(event.target.value)}
            />
          )}
        />
      </FormField>
      <div className='grid grid-cols-2 gap-3'>
        <FormField id='invite-from' label='Expected from' error={errors.expected_from?.message}>
          <Controller
            control={control}
            name='expected_from'
            render={({ field }) => (
              <Input
                id='invite-from'
                type='time'
                placeholder='10:00'
                aria-invalid={Boolean(errors.expected_from) || undefined}
                value={field.value}
                onChange={(event) => field.onChange(event.target.value)}
              />
            )}
          />
        </FormField>
        <FormField id='invite-until' label='Until' error={errors.expected_until?.message}>
          <Controller
            control={control}
            name='expected_until'
            render={({ field }) => (
              <Input
                id='invite-until'
                type='time'
                placeholder='12:00'
                aria-invalid={Boolean(errors.expected_until) || undefined}
                value={field.value}
                onChange={(event) => field.onChange(event.target.value)}
              />
            )}
          />
        </FormField>
      </div>
      <FormField id='invite-company' label='Company' error={errors.company?.message}>
        <Input
          id='invite-company'
          maxLength={100}
          placeholder='Lab Supplies Co'
          aria-invalid={Boolean(errors.company) || undefined}
          {...register('company')}
        />
      </FormField>
      <div className='grid grid-cols-2 gap-3'>
        <FormField id='invite-people' label='People' error={errors.people_count?.message}>
          <Input
            id='invite-people'
            type='number'
            inputMode='numeric'
            min={1}
            max={50}
            aria-invalid={Boolean(errors.people_count) || undefined}
            {...register('people_count')}
          />
        </FormField>
        <FormField id='invite-vehicle' label='Vehicle no' error={errors.vehicle_no?.message}>
          <Input
            id='invite-vehicle'
            maxLength={15}
            placeholder='TN09AB1234'
            className='uppercase'
            aria-invalid={Boolean(errors.vehicle_no) || undefined}
            {...register('vehicle_no')}
          />
        </FormField>
      </div>
    </form>
  )
}
