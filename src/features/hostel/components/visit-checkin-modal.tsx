import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Ban, ShieldAlert, ShieldCheck, ShieldQuestion } from 'lucide-react'
import { z } from 'zod'
import { AppModal } from '@/components/common/app-modal'
import { Combobox } from '@/components/common/combobox'
import { FormField } from '@/components/common/form-field'
import { Kbd } from '@/components/shortcuts/kbd'
import { Button } from '@/components/ui/button'
import { DialogFooter } from '@/components/ui/dialog'
import { Input, Textarea } from '@/components/ui/input'
import { alerts } from '@/lib/alerts'
import { toApiError } from '@/lib/api/errors'
import { timeAgo } from '@/lib/format'
import {
  hostelApi,
  useHostelMutation,
  type IdProofType,
  type VisitInput,
  type VisitorLookup,
} from '../api'
import { ID_PROOF, labelOptions } from '../labels'
import { FormAlert, InfoNote } from './leave-form-parts'
import { applyApiError, digitsOnly, MOBILE_PATTERN, textOrNull } from './leave-helpers'
import { ResidentPicker } from './pickers'

const FORM_ID = 'hostel-visit-form'

const schema = z.object({
  admission_id: z.string().min(1, 'Choose the resident being visited'),
  mobile: z.string().regex(MOBILE_PATTERN, 'Enter a valid 10-digit mobile number'),
  visitor_name: z
    .string()
    .trim()
    .min(2, 'Enter the visitor’s name')
    .max(120, 'Keep the name to 120 characters'),
  relation: z.string().trim().min(2, 'Enter the relation').max(40, 'Keep it to 40 characters'),
  people_count: z
    .string()
    .regex(/^\d{1,2}$/, 'Enter how many people')
    .refine((value) => Number(value) >= 1 && Number(value) <= 20, 'Between 1 and 20 people'),
  id_proof_type: z.string(),
  id_proof_last4: z
    .string()
    .trim()
    .refine(
      (value) => !value || /^[A-Za-z0-9]{4}$/.test(value),
      'Enter exactly 4 letters or digits'
    ),
  purpose: z.string().trim().max(255, 'Keep it to 255 characters'),
  note: z.string().trim().max(255, 'Keep it to 255 characters'),
})

type FormValues = z.infer<typeof schema>

const FIELDS = [
  'admission_id',
  'mobile',
  'visitor_name',
  'relation',
  'people_count',
  'id_proof_type',
  'id_proof_last4',
  'purpose',
  'note',
] as const

interface LookupState {
  mobile: string
  loading: boolean
  data: VisitorLookup | null
  error?: string
}

export function VisitCheckInModal({ onClose }: { onClose: () => void }) {
  const save = useHostelMutation((input: VisitInput) => hostelApi.checkIn(input))
  const [lookup, setLookup] = useState<LookupState | null>(null)
  const {
    register,
    control,
    handleSubmit,
    setError,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      admission_id: '',
      mobile: '',
      visitor_name: '',
      relation: '',
      people_count: '1',
      id_proof_type: '',
      id_proof_last4: '',
      purpose: '',
      note: '',
    },
  })

  const isCurrent = (mobile: string, admissionId: string) =>
    digitsOnly(getValues('mobile') ?? '') === mobile && getValues('admission_id') === admissionId

  const runLookup = async (rawMobile: string, admissionId: string) => {
    const mobile = digitsOnly(rawMobile)
    if (!MOBILE_PATTERN.test(mobile)) {
      setLookup(null)
      return
    }
    setLookup({ mobile, loading: true, data: null })
    try {
      const data = await hostelApi.lookupVisitor(
        mobile,
        admissionId ? Number(admissionId) : undefined
      )
      if (!isCurrent(mobile, admissionId)) return
      setLookup({ mobile, loading: false, data })
      if (data.known && data.known_name && !getValues('visitor_name').trim()) {
        setValue('visitor_name', data.known_name, { shouldValidate: true })
      }
      if (data.known && data.known_relation && !getValues('relation').trim()) {
        setValue('relation', data.known_relation, { shouldValidate: true })
      }
    } catch (error) {
      if (!isCurrent(mobile, admissionId)) return
      setLookup({ mobile, loading: false, data: null, error: toApiError(error).message })
    }
  }

  const blocked = Boolean(lookup?.data?.blocked)

  const send = async (values: FormValues, deny: boolean) => {
    if (blocked && !deny) {
      setError('root', { message: 'This number is blocked. Record the visitor as turned away.' })
      return
    }
    try {
      const visit = await save.mutateAsync({
        admission_id: Number(values.admission_id),
        mobile: values.mobile,
        visitor_name: values.visitor_name,
        relation: values.relation,
        people_count: Number(values.people_count),
        id_proof_type: (values.id_proof_type || undefined) as IdProofType | undefined,
        id_proof_last4: values.id_proof_last4 || undefined,
        purpose: textOrNull(values.purpose),
        note: textOrNull(values.note),
        deny: deny || undefined,
      })
      if (deny) alerts.warning('Recorded as turned away', { description: visit.visit_no })
      else
        alerts.success('Visitor checked in', {
          description: `${visit.visit_no}. Parents are told.`,
        })
      onClose()
    } catch (error) {
      const apiError = applyApiError(error, setError, FIELDS, {
        HOSTEL_ADMISSION_CLOSED: 'admission_id',
        HOSTEL_NOT_RESIDENT: 'admission_id',
        HOSTEL_ADMISSION_NOT_FOUND: 'admission_id',
      })
      if (apiError.code === 'HOSTEL_VISITOR_BLOCKED') {
        void runLookup(values.mobile, values.admission_id)
      }
    }
  }

  const submit = handleSubmit((values) => send(values, false))
  const turnAway = handleSubmit((values) => send(values, true))

  return (
    <AppModal
      open
      onOpenChange={(open) => !open && onClose()}
      title='Check in visitor'
      description='Type the visitor’s mobile first to see if they are known or blocked.'
      formId={FORM_ID}
      loading={save.isPending}
      size='lg'
      footer={
        <DialogFooter>
          <Button variant='outline' onClick={onClose} disabled={save.isPending}>
            Cancel
          </Button>
          {blocked ? (
            <Button variant='destructive' loading={save.isPending} onClick={() => void turnAway()}>
              <Ban />
              Record as turned away
            </Button>
          ) : (
            <Button type='submit' form={FORM_ID} loading={save.isPending}>
              Check in
              <Kbd id='modal.submit' inverted />
            </Button>
          )}
        </DialogFooter>
      }
    >
      <form id={FORM_ID} noValidate onSubmit={submit} className='grid gap-4'>
        <FormAlert message={errors.root?.message} />
        <div className='grid gap-4 sm:grid-cols-2'>
          <FormField
            id='visit-resident'
            label='Visiting'
            required
            error={errors.admission_id?.message}
          >
            <Controller
              control={control}
              name='admission_id'
              render={({ field }) => (
                <ResidentPicker
                  id='visit-resident'
                  label='Resident'
                  value={field.value || undefined}
                  invalid={Boolean(errors.admission_id)}
                  onChange={(value) => {
                    field.onChange(value ?? '')
                    void runLookup(getValues('mobile'), value ?? '')
                  }}
                />
              )}
            />
          </FormField>
          <FormField
            id='visit-mobile'
            label='Visitor mobile'
            required
            error={errors.mobile?.message}
          >
            <div className='flex'>
              <span className='inline-flex h-9 items-center rounded-l-md border border-r-0 border-input bg-muted px-2.5 text-sm font-semibold text-muted-foreground'>
                +91
              </span>
              <Input
                id='visit-mobile'
                type='tel'
                inputMode='numeric'
                maxLength={10}
                autoFocus
                placeholder='9876543210'
                className='tabular rounded-l-none'
                aria-invalid={Boolean(errors.mobile)}
                {...register('mobile', {
                  setValueAs: digitsOnly,
                  onChange: (event: { target: { value: string } }) =>
                    void runLookup(event.target.value, getValues('admission_id')),
                })}
              />
            </div>
          </FormField>
        </div>

        <LookupResult lookup={lookup} />

        <div className='grid gap-4 sm:grid-cols-3'>
          <FormField
            id='visit-name'
            label='Visitor name'
            required
            error={errors.visitor_name?.message}
            className='sm:col-span-2'
          >
            <Input
              id='visit-name'
              autoComplete='off'
              placeholder='Kumar R'
              aria-invalid={Boolean(errors.visitor_name)}
              {...register('visitor_name')}
            />
          </FormField>
          <FormField id='visit-relation' label='Relation' required error={errors.relation?.message}>
            <Input
              id='visit-relation'
              autoComplete='off'
              placeholder='Father'
              aria-invalid={Boolean(errors.relation)}
              {...register('relation')}
            />
          </FormField>
          <FormField id='visit-people' label='People' error={errors.people_count?.message}>
            <Input
              id='visit-people'
              type='number'
              min={1}
              max={20}
              inputMode='numeric'
              className='tabular'
              aria-invalid={Boolean(errors.people_count)}
              {...register('people_count')}
            />
          </FormField>
          <FormField id='visit-proof' label='ID proof' error={errors.id_proof_type?.message}>
            <Controller
              control={control}
              name='id_proof_type'
              render={({ field }) => (
                <Combobox
                  id='visit-proof'
                  label='ID proof'
                  value={field.value || undefined}
                  allLabel='None'
                  placeholder='None'
                  options={labelOptions(ID_PROOF)}
                  highlightSelected={false}
                  className='sm:w-full'
                  onChange={(value) => field.onChange(value ?? '')}
                />
              )}
            />
          </FormField>
          <FormField
            id='visit-proof-last4'
            label='Last 4 of ID'
            error={errors.id_proof_last4?.message}
            hint='Only the last 4 are kept'
          >
            <Input
              id='visit-proof-last4'
              maxLength={4}
              autoComplete='off'
              placeholder='1234'
              className='font-mono uppercase'
              aria-invalid={Boolean(errors.id_proof_last4)}
              {...register('id_proof_last4')}
            />
          </FormField>
        </div>
        <div className='grid gap-4 sm:grid-cols-2'>
          <FormField id='visit-purpose' label='Purpose' error={errors.purpose?.message}>
            <Input
              id='visit-purpose'
              autoComplete='off'
              placeholder='Weekend visit'
              aria-invalid={Boolean(errors.purpose)}
              {...register('purpose')}
            />
          </FormField>
          <FormField id='visit-note' label='Note' error={errors.note?.message}>
            <Textarea
              id='visit-note'
              className='min-h-9'
              rows={1}
              aria-invalid={Boolean(errors.note)}
              {...register('note')}
            />
          </FormField>
        </div>
      </form>
    </AppModal>
  )
}

function LookupResult({ lookup }: { lookup: LookupState | null }) {
  if (!lookup) {
    return (
      <InfoNote icon={ShieldQuestion}>
        The check uses the mobile number: blocked numbers, the student’s parents and approved
        visitors are recognised.
      </InfoNote>
    )
  }
  if (lookup.loading)
    return <InfoNote icon={ShieldQuestion}>Checking +91 {lookup.mobile}…</InfoNote>
  if (lookup.error) return <InfoNote tone='warning'>{lookup.error}</InfoNote>
  const data = lookup.data
  if (!data) return null
  const last = data.last_visit_at ? ` Last visit ${timeAgo(data.last_visit_at)}.` : ''
  if (data.blocked) {
    return (
      <InfoNote tone='danger' icon={ShieldAlert}>
        <span className='font-semibold'>Blocked number.</span>{' '}
        {data.blocked_reason ?? 'This visitor may not enter.'} They can only be recorded as turned
        away.
      </InfoNote>
    )
  }
  if (data.known) {
    return (
      <InfoNote tone='success' icon={ShieldCheck}>
        <span className='font-semibold'>
          Known: {data.known_name ?? 'registered contact'}
          {data.known_relation ? ` (${data.known_relation})` : ''}.
        </span>{' '}
        A parent or approved visitor of this student.{last}
      </InfoNote>
    )
  }
  return (
    <InfoNote tone='warning' icon={ShieldQuestion}>
      <span className='font-semibold'>Not a known contact.</span> Check an ID proof and confirm with
      the parents if unsure.{last}
    </InfoNote>
  )
}
