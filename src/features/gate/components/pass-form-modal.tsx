import { useState, type ReactNode } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { AlertTriangle, UserPlus } from 'lucide-react'
import { z } from 'zod'
import { AppModal } from '@/components/common/app-modal'
import { Combobox, type ComboboxOption } from '@/components/common/combobox'
import { FormField } from '@/components/common/form-field'
import { Badge } from '@/components/ui/badge'
import { Input, Textarea } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { today } from '@/features/attendance/labels'
import { applyFieldErrors } from '@/features/maintenance/helpers'
import { FileField, FormAlert, type AttachedFile } from '@/features/maintenance/components/shared'
import { useDebouncedValue } from '@/hooks/use-debounce'
import { alerts } from '@/lib/alerts'
import { toApiError } from '@/lib/api/errors'
import { formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import {
  gateApi,
  useGateMutation,
  useGateStudents,
  type GatePass,
  type GateStudentCard,
  type PickupInput,
  type PickupPerson,
  type StaffPassInput,
} from '../api'
import { PASS_STATUS, PICKUP_KIND } from '../labels'
import { PersonCell, StudentCell } from './shared'

const FORM_ID = 'gate-pass-form'
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/
const MOBILE = /^[6-9]\d{9}$/

const schema = z
  .object({
    student_id: z.string().min(1, 'Choose the student'),
    pickup: z.string().min(1, 'Choose who picks the student up'),
    name: z.string().trim(),
    relation: z.string().trim(),
    mobile: z.string().trim(),
    pass_date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Choose the date')
      .refine((value) => value >= today(), 'The date cannot be in the past'),
    from_time: z.string().regex(TIME, 'Choose from when the student may leave'),
    until_time: z.string(),
    reason: z
      .string()
      .trim()
      .min(3, 'Enter the reason, 3 to 300 characters')
      .max(300, 'Enter the reason, 3 to 300 characters'),
    approve_now: z.boolean(),
  })
  .superRefine((values, ctx) => {
    if (values.until_time && values.until_time <= values.from_time)
      ctx.addIssue({
        code: 'custom',
        path: ['until_time'],
        message: 'Until must be after the from time',
      })
    if (values.pickup !== 'other') return
    if (values.name.length < 2 || values.name.length > 80)
      ctx.addIssue({ code: 'custom', path: ['name'], message: 'Enter the name, 2 to 80 letters' })
    if (values.relation.length < 2 || values.relation.length > 40)
      ctx.addIssue({
        code: 'custom',
        path: ['relation'],
        message: 'Enter how they are related, like Uncle',
      })
    if (!MOBILE.test(values.mobile))
      ctx.addIssue({
        code: 'custom',
        path: ['mobile'],
        message: 'Enter a 10-digit mobile number',
      })
  })

type FormValues = z.infer<typeof schema>

const FIELDS: (keyof FormValues)[] = [
  'student_id',
  'pass_date',
  'from_time',
  'until_time',
  'reason',
  'approve_now',
]

const personKey = (person: PickupPerson) => `${person.kind}:${person.id}`

interface PassFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: (pass: GatePass) => void
}

export function PassFormModal({ open, onOpenChange, onCreated }: PassFormModalProps) {
  const save = useGateMutation((input: StaffPassInput) => gateApi.createPass(input))
  const [uploading, setUploading] = useState(false)
  return (
    <AppModal
      open={open}
      onOpenChange={onOpenChange}
      title='New gate pass'
      description='For a parent who phoned or came to the office. The parent gets the QR and code in the app.'
      formId={FORM_ID}
      submitText='Create pass'
      loading={save.isPending || uploading}
      size='lg'
    >
      {open && (
        <PassForm
          onUploadingChange={setUploading}
          onSubmit={async (input) => {
            const pass = await save.mutateAsync(input)
            alerts.success(
              pass.status === 'approved' ? 'Gate pass created and approved' : 'Gate pass created'
            )
            onOpenChange(false)
            onCreated(pass)
          }}
        />
      )}
    </AppModal>
  )
}

function PassForm({
  onUploadingChange,
  onSubmit,
}: {
  onUploadingChange: (uploading: boolean) => void
  onSubmit: (input: StaffPassInput) => Promise<void>
}) {
  const [query, setQuery] = useState('')
  const debounced = useDebouncedValue(query)
  const students = useGateStudents(debounced)
  const [card, setCard] = useState<GateStudentCard | null>(null)
  const [photo, setPhoto] = useState<AttachedFile | null>(null)
  const [photoError, setPhotoError] = useState('')
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
      student_id: '',
      pickup: '',
      name: '',
      relation: '',
      mobile: '',
      pass_date: today(),
      from_time: '',
      until_time: '',
      reason: '',
      approve_now: true,
    },
  })
  const pickup = useWatch({ control, name: 'pickup' })

  const cards = students.data ?? []
  const choices =
    card && !cards.some((item) => item.student.id === card.student.id) ? [card, ...cards] : cards
  const options: ComboboxOption[] = choices.map((item) => ({
    value: String(item.student.id),
    label: item.student.name,
    hint: [item.student.class_section, item.student.admission_no].filter(Boolean).join(' · '),
  }))

  const submit = handleSubmit(async (values) => {
    const person = card?.people.find((item) => personKey(item) === values.pickup)
    const input: PickupInput =
      values.pickup === 'other' || !person
        ? {
            kind: 'other',
            name: values.name,
            relation: values.relation,
            mobile: values.mobile,
            photo_file_id: photo?.id,
          }
        : person.kind === 'guardian'
          ? { kind: 'guardian', guardian_id: person.id ?? undefined }
          : { kind: 'authorised', authorised_id: person.id ?? undefined }
    try {
      await onSubmit({
        student_id: Number(values.student_id),
        pass_date: values.pass_date,
        from_time: values.from_time,
        until_time: values.until_time || undefined,
        reason: values.reason,
        pickup: input,
        approve_now: values.approve_now,
      })
    } catch (error) {
      const apiError = toApiError(error)
      const mapped = applyFieldErrors(apiError, FIELDS, setError, {
        'pickup.name': (message) => setError('name', { message }),
        'pickup.relation': (message) => setError('relation', { message }),
        'pickup.mobile': (message) => setError('mobile', { message }),
        'pickup.photo_file_id': setPhotoError,
        'pickup.kind': (message) => setError('pickup', { message }),
        'pickup.guardian_id': (message) => setError('pickup', { message }),
        'pickup.authorised_id': (message) => setError('pickup', { message }),
      })
      if (!mapped) setError('root', { message: apiError.message })
    }
  })

  return (
    <form id={FORM_ID} onSubmit={submit} noValidate className='grid gap-4 sm:grid-cols-2'>
      <FormAlert message={errors.root?.message} />
      <FormField
        id='pass-student'
        label='Student'
        required
        error={errors.student_id?.message}
        hint='Type 2 or more letters of the name, admission number or class like 5A'
        className='sm:col-span-2'
      >
        <Controller
          control={control}
          name='student_id'
          render={({ field }) => (
            <Combobox
              id='pass-student'
              label='Student'
              value={field.value || undefined}
              options={options}
              onSearch={setQuery}
              placeholder='Search name, admission number or class'
              searchPlaceholder='Search students'
              emptyText={
                debounced.trim().length < 2
                  ? 'Type 2 or more letters'
                  : students.isFetching
                    ? 'Searching…'
                    : 'No students found'
              }
              highlightSelected={false}
              className='sm:w-full'
              invalid={Boolean(errors.student_id)}
              onChange={(value) => {
                field.onChange(value ?? '')
                setCard(choices.find((item) => String(item.student.id) === value) ?? null)
                setValue('pickup', '')
              }}
            />
          )}
        />
      </FormField>
      {card && (
        <div className='grid gap-3 rounded-lg border bg-muted/30 p-3 sm:col-span-2'>
          <StudentCell student={card.student} />
          {card.absent_today && (
            <p className='flex items-center gap-2 text-sm font-medium text-warning'>
              <AlertTriangle className='size-4 shrink-0' />
              Marked absent today
            </p>
          )}
          {card.today_passes.length > 0 && (
            <div className='flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground'>
              Already today:
              {card.today_passes.map((item) => (
                <Badge key={item.id} tone={PASS_STATUS[item.status].tone}>
                  {item.pass_no} · {PASS_STATUS[item.status].label}
                </Badge>
              ))}
            </div>
          )}
        </div>
      )}
      {card && (
        <FormField
          id='pass-pickup'
          label='Picked up by'
          required
          error={errors.pickup?.message}
          className='sm:col-span-2'
        >
          <Controller
            control={control}
            name='pickup'
            render={({ field }) => (
              <div
                id='pass-pickup'
                role='radiogroup'
                aria-label='Picked up by'
                aria-invalid={Boolean(errors.pickup) || undefined}
                className='grid gap-2 sm:grid-cols-2'
              >
                {card.people.map((person) => (
                  <PickupChoice
                    key={personKey(person)}
                    checked={field.value === personKey(person)}
                    onSelect={() => field.onChange(personKey(person))}
                  >
                    <PersonCell person={person} />
                    <span className='flex flex-wrap gap-1'>
                      <Badge tone={person.kind === 'guardian' ? 'info' : 'neutral'}>
                        {PICKUP_KIND[person.kind]}
                      </Badge>
                      {person.valid_until && (
                        <Badge tone='neutral'>Until {formatDate(person.valid_until)}</Badge>
                      )}
                    </span>
                  </PickupChoice>
                ))}
                <PickupChoice
                  checked={field.value === 'other'}
                  onSelect={() => field.onChange('other')}
                >
                  <span className='flex items-center gap-2.5'>
                    <span className='grid size-9 place-items-center rounded-full bg-muted text-muted-foreground'>
                      <UserPlus className='size-4' />
                    </span>
                    <span className='grid'>
                      <span className='font-semibold'>Someone else</span>
                      <span className='text-xs text-muted-foreground'>
                        Not registered: enter their details
                      </span>
                    </span>
                  </span>
                </PickupChoice>
              </div>
            )}
          />
        </FormField>
      )}
      {pickup === 'other' && (
        <>
          <FormField id='pass-name' label='Name' required error={errors.name?.message}>
            <Input
              id='pass-name'
              maxLength={80}
              placeholder='Ravi Kumar'
              aria-invalid={Boolean(errors.name) || undefined}
              {...register('name')}
            />
          </FormField>
          <FormField id='pass-relation' label='Relation' required error={errors.relation?.message}>
            <Input
              id='pass-relation'
              maxLength={40}
              placeholder='Uncle'
              aria-invalid={Boolean(errors.relation) || undefined}
              {...register('relation')}
            />
          </FormField>
          <FormField id='pass-mobile' label='Mobile' required error={errors.mobile?.message}>
            <Input
              id='pass-mobile'
              inputMode='numeric'
              maxLength={10}
              placeholder='9876500011'
              aria-invalid={Boolean(errors.mobile) || undefined}
              {...register('mobile')}
            />
          </FormField>
          <FileField
            id='pass-photo'
            label='Photo'
            purpose='gate_pickup_photo'
            file={photo}
            onChange={setPhoto}
            onUploadingChange={onUploadingChange}
            error={photoError}
            onError={setPhotoError}
            photoOnly
          />
        </>
      )}
      <FormField id='pass-date' label='Date' required error={errors.pass_date?.message}>
        <Controller
          control={control}
          name='pass_date'
          render={({ field }) => (
            <Input
              id='pass-date'
              type='date'
              min={today()}
              aria-invalid={Boolean(errors.pass_date) || undefined}
              value={field.value}
              onChange={(event) => field.onChange(event.target.value)}
            />
          )}
        />
      </FormField>
      <div className='grid grid-cols-2 gap-3'>
        <FormField id='pass-from' label='From' required error={errors.from_time?.message}>
          <Controller
            control={control}
            name='from_time'
            render={({ field }) => (
              <Input
                id='pass-from'
                type='time'
                placeholder='11:30'
                aria-invalid={Boolean(errors.from_time) || undefined}
                value={field.value}
                onChange={(event) => field.onChange(event.target.value)}
              />
            )}
          />
        </FormField>
        <FormField
          id='pass-until'
          label='Until'
          error={errors.until_time?.message}
          hint='Default 2 hours'
        >
          <Controller
            control={control}
            name='until_time'
            render={({ field }) => (
              <Input
                id='pass-until'
                type='time'
                placeholder='13:30'
                aria-invalid={Boolean(errors.until_time) || undefined}
                value={field.value}
                onChange={(event) => field.onChange(event.target.value)}
              />
            )}
          />
        </FormField>
      </div>
      <FormField
        id='pass-reason'
        label='Reason'
        required
        error={errors.reason?.message}
        className='sm:col-span-2'
      >
        <Textarea
          id='pass-reason'
          rows={2}
          maxLength={300}
          placeholder='Doctor appointment'
          aria-invalid={Boolean(errors.reason) || undefined}
          {...register('reason')}
        />
      </FormField>
      <div className='flex items-start justify-between gap-3 rounded-lg border p-3 sm:col-span-2'>
        <span className='grid gap-0.5'>
          <label htmlFor='pass-approve-now' className='text-sm font-semibold'>
            Approve now
          </label>
          <span className='text-xs text-muted-foreground'>
            Switch off to leave it waiting for approval.
          </span>
        </span>
        <Controller
          control={control}
          name='approve_now'
          render={({ field }) => (
            <Switch id='pass-approve-now' checked={field.value} onCheckedChange={field.onChange} />
          )}
        />
      </div>
    </form>
  )
}

function PickupChoice({
  checked,
  onSelect,
  children,
}: {
  checked: boolean
  onSelect: () => void
  children: ReactNode
}) {
  return (
    <button
      type='button'
      role='radio'
      aria-checked={checked}
      onClick={onSelect}
      className={cn(
        'grid min-w-0 gap-2 rounded-lg border bg-card p-3 text-left transition-colors outline-none hover:bg-muted/50 focus-visible:ring-[3px] focus-visible:ring-ring/40',
        checked && 'border-primary ring-2 ring-primary/30'
      )}
    >
      {children}
    </button>
  )
}
