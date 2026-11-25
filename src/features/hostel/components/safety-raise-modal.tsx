import { Controller, useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { BellRing } from 'lucide-react'
import { z } from 'zod'
import { AppModal } from '@/components/common/app-modal'
import { Combobox } from '@/components/common/combobox'
import { FormField } from '@/components/common/form-field'
import { Textarea } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { alerts } from '@/lib/alerts'
import { useHostelMutation } from '../api'
import { safetyApi, type SosDetail, type SosInput } from '../api-safety'
import { FormAlert, InfoNote } from './leave-form-parts'
import { applyApiError } from './leave-helpers'
import { HostelSelect, ResidentPicker } from './pickers'
import { SOS_KIND } from './safety-helpers'

const FORM_ID = 'hostel-sos-form'

const KINDS = [
  'fire',
  'medical',
  'security',
  'missing_student',
  'natural_disaster',
  'drill',
  'other',
] as const

const schema = z.object({
  hostel_id: z.string().min(1, 'Choose the hostel'),
  kind: z.enum(KINDS),
  message: z
    .string()
    .trim()
    .min(5, 'Say what is happening (5 characters or more)')
    .max(500, 'Keep the message to 500 characters'),
  admission_id: z.string(),
  is_drill: z.boolean(),
  notify_parents: z.boolean(),
})

type FormValues = z.infer<typeof schema>

const FIELDS = ['hostel_id', 'kind', 'message', 'admission_id'] as const

const KIND_OPTIONS = KINDS.map((kind) => ({ value: kind, label: SOS_KIND[kind] }))

export function SafetyRaiseModal({
  hostelId,
  onClose,
  onRaised,
}: {
  hostelId?: number
  onClose: () => void
  onRaised: (sos: SosDetail) => void
}) {
  const raise = useHostelMutation((input: SosInput) => safetyApi.raise(input))
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
      hostel_id: hostelId ? String(hostelId) : '',
      kind: 'fire',
      message: '',
      admission_id: '',
      is_drill: false,
      notify_parents: false,
    },
  })
  const kind = useWatch({ control, name: 'kind' })
  const isDrill = useWatch({ control, name: 'is_drill' })
  const selectedHostel = useWatch({ control, name: 'hostel_id' })
  const drill = isDrill || kind === 'drill'
  const aboutStudent = kind === 'missing_student' || kind === 'medical'

  const submit = handleSubmit(async (values) => {
    const practice = values.is_drill || values.kind === 'drill'
    try {
      const sos = await raise.mutateAsync({
        hostel_id: Number(values.hostel_id),
        kind: values.kind,
        message: values.message.trim(),
        admission_id: values.admission_id ? Number(values.admission_id) : undefined,
        is_drill: practice,
        notify_parents: practice ? false : values.notify_parents,
      })
      alerts.success(practice ? 'Drill started' : 'Alert raised', {
        description: `${sos.sos_no} · wardens, the principal and admins have been told${
          sos.notify_parents ? ', and every resident’s parents' : ''
        }.`,
      })
      onRaised(sos)
      onClose()
    } catch (error) {
      applyApiError(error, setError, FIELDS, {
        HOSTEL_NOT_RESIDENT: 'admission_id',
        HOSTEL_NOT_FOUND: 'hostel_id',
      })
    }
  })

  return (
    <AppModal
      open
      onOpenChange={(open) => !open && onClose()}
      title='Raise emergency alert'
      description='Everyone on hostel duty is told at once, and a headcount of the residents starts.'
      formId={FORM_ID}
      submitText={drill ? 'Start drill' : 'Raise alert'}
      loading={raise.isPending}
      size='lg'
    >
      <form id={FORM_ID} noValidate onSubmit={submit} className='grid gap-4'>
        <FormAlert message={errors.root?.message} />
        <div className='grid gap-4 sm:grid-cols-2'>
          <FormField id='sos-hostel' label='Hostel' required error={errors.hostel_id?.message}>
            <Controller
              control={control}
              name='hostel_id'
              render={({ field }) => (
                <HostelSelect
                  id='sos-hostel'
                  value={field.value || undefined}
                  invalid={Boolean(errors.hostel_id)}
                  onChange={(value) => {
                    field.onChange(value ?? '')
                    setValue('admission_id', '')
                  }}
                />
              )}
            />
          </FormField>
          <FormField id='sos-kind' label='What is happening' required error={errors.kind?.message}>
            <Controller
              control={control}
              name='kind'
              render={({ field }) => (
                <Combobox
                  id='sos-kind'
                  label='What is happening'
                  value={field.value}
                  placeholder='Choose kind'
                  options={KIND_OPTIONS}
                  highlightSelected={false}
                  className='sm:w-full'
                  onChange={(value) => field.onChange(value ?? 'fire')}
                />
              )}
            />
          </FormField>
        </div>

        <FormField
          id='sos-message'
          label='Message'
          required
          error={errors.message?.message}
          hint='Where it is and what people should do. This is sent as it is.'
        >
          <Textarea
            id='sos-message'
            maxLength={500}
            placeholder='Smoke in A Block ground floor. Everyone to the assembly point.'
            aria-invalid={Boolean(errors.message)}
            {...register('message')}
          />
        </FormField>

        <FormField
          id='sos-resident'
          label='Resident'
          error={errors.admission_id?.message}
          hint={
            aboutStudent
              ? 'The student who is missing or hurt'
              : 'Optional: only when the alert is about one student'
          }
        >
          <Controller
            control={control}
            name='admission_id'
            render={({ field }) => (
              <ResidentPicker
                key={selectedHostel || 'all'}
                id='sos-resident'
                label='Resident'
                hostelId={selectedHostel ? Number(selectedHostel) : undefined}
                value={field.value || undefined}
                invalid={Boolean(errors.admission_id)}
                onChange={(value) => field.onChange(value ?? '')}
              />
            )}
          />
        </FormField>

        <Controller
          control={control}
          name='is_drill'
          render={({ field }) => (
            <SwitchRow
              id='sos-drill'
              label='This is a drill'
              description='A practice run: no SMS goes out and parents are never told.'
              checked={drill}
              disabled={kind === 'drill'}
              onCheckedChange={(checked) => {
                field.onChange(checked)
                if (checked) setValue('notify_parents', false)
              }}
            />
          )}
        />
        <Controller
          control={control}
          name='notify_parents'
          render={({ field }) => (
            <SwitchRow
              id='sos-parents'
              label='Also tell all parents'
              description={
                drill
                  ? 'Parents are never told about a drill.'
                  : 'Sends the alert and the warden’s phone number to the parents of every resident of this hostel.'
              }
              checked={!drill && field.value}
              disabled={drill}
              onCheckedChange={field.onChange}
            />
          )}
        />

        <InfoNote icon={BellRing} tone={drill ? 'info' : 'danger'}>
          Wardens, assistant wardens, the principal and admins always get this alert by push
          {drill ? '.' : ' and SMS.'}
        </InfoNote>
      </form>
    </AppModal>
  )
}

function SwitchRow({
  id,
  label,
  description,
  checked,
  disabled,
  onCheckedChange,
}: {
  id: string
  label: string
  description: string
  checked: boolean
  disabled?: boolean
  onCheckedChange: (checked: boolean) => void
}) {
  return (
    <div className='flex items-center justify-between gap-4 rounded-lg border bg-muted/40 px-4 py-3'>
      <div className='grid gap-0.5'>
        <label htmlFor={id} className='text-sm font-semibold'>
          {label}
        </label>
        <p id={`${id}-hint`} className='text-xs text-muted-foreground'>
          {description}
        </p>
      </div>
      <Switch
        id={id}
        checked={checked}
        disabled={disabled}
        aria-describedby={`${id}-hint`}
        onCheckedChange={onCheckedChange}
      />
    </div>
  )
}
