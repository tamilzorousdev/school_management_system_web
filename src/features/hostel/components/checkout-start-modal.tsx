import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { AppModal } from '@/components/common/app-modal'
import { Combobox } from '@/components/common/combobox'
import { DatePicker } from '@/components/common/date-picker'
import { FormField } from '@/components/common/form-field'
import { Input, Textarea } from '@/components/ui/input'
import { alerts } from '@/lib/alerts'
import {
  hostelApi,
  useHostelMutation,
  type AdmissionDetail,
  type Checkout,
  type CheckoutStartInput,
} from '../api'
import { CHECKOUT_REASON, labelOptions } from '../labels'
import { applyApiError, nullIfEmpty, optionalText, undefinedIfEmpty } from './resident-form'
import { FormError } from './resident-form-parts'

const FORM_ID = 'hostel-checkout-start'
const REASON_OPTIONS = labelOptions(CHECKOUT_REASON)

const schema = z.object({
  reason: z.string().min(1, 'Choose why the student is leaving'),
  checkout_date: z.string(),
  forwarding_address: optionalText(255, 'Address'),
  remarks: optionalText(500, 'Remarks'),
})

type FormValues = z.infer<typeof schema>

export function CheckoutStartModal({
  open,
  onOpenChange,
  admission,
  onStarted,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  admission: AdmissionDetail
  onStarted?: (checkout: Checkout) => void
}) {
  const start = useHostelMutation((input: CheckoutStartInput) =>
    hostelApi.startCheckout(admission.id, input)
  )
  return (
    <AppModal
      open={open}
      onOpenChange={onOpenChange}
      title='Start checkout'
      description={`${admission.student.name} moves to checking out. Work through the clearance checklist, settle dues and the deposit, then complete it.`}
      formId={FORM_ID}
      submitText='Start checkout'
      loading={start.isPending}
    >
      {open && (
        <CheckoutStartForm
          admittedOn={admission.admitted_on}
          onSubmit={async (input) => {
            const checkout = await start.mutateAsync(input)
            alerts.success('Checkout started', {
              description: `${checkout.items.length} clearance items to finish`,
            })
            onOpenChange(false)
            onStarted?.(checkout)
          }}
        />
      )}
    </AppModal>
  )
}

function CheckoutStartForm({
  admittedOn,
  onSubmit,
}: {
  admittedOn: string
  onSubmit: (input: CheckoutStartInput) => Promise<void>
}) {
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { reason: '', checkout_date: '', forwarding_address: '', remarks: '' },
  })

  const submit = handleSubmit(async (values) => {
    try {
      await onSubmit({
        reason: values.reason as CheckoutStartInput['reason'],
        checkout_date: undefinedIfEmpty(values.checkout_date),
        forwarding_address: nullIfEmpty(values.forwarding_address),
        remarks: nullIfEmpty(values.remarks),
      })
    } catch (error) {
      applyApiError(error, setError, Object.keys(schema.shape) as (keyof FormValues)[])
    }
  })

  return (
    <form id={FORM_ID} onSubmit={submit} noValidate className='grid gap-4'>
      <FormError message={errors.root?.message} />
      <div className='grid gap-4 sm:grid-cols-2'>
        <FormField id='checkout-reason' label='Reason' required error={errors.reason?.message}>
          <Controller
            control={control}
            name='reason'
            render={({ field }) => (
              <Combobox
                id='checkout-reason'
                label='Reason'
                value={field.value || undefined}
                options={REASON_OPTIONS}
                placeholder='Choose a reason'
                invalid={Boolean(errors.reason)}
                highlightSelected={false}
                className='sm:w-full'
                onChange={(value) => field.onChange(value ?? '')}
              />
            )}
          />
        </FormField>
        <FormField
          id='checkout-date'
          label='Checkout date'
          error={errors.checkout_date?.message}
          hint='Leave empty for today'
        >
          <Controller
            control={control}
            name='checkout_date'
            render={({ field }) => (
              <DatePicker
                id='checkout-date'
                value={field.value}
                min={admittedOn}
                invalid={Boolean(errors.checkout_date)}
                onChange={(value: string) => field.onChange(value)}
              />
            )}
          />
        </FormField>
      </div>
      <FormField
        id='checkout-address'
        label='Forwarding address'
        error={errors.forwarding_address?.message}
      >
        <Input
          id='checkout-address'
          aria-invalid={Boolean(errors.forwarding_address)}
          {...register('forwarding_address')}
        />
      </FormField>
      <FormField id='checkout-remarks' label='Remarks' error={errors.remarks?.message}>
        <Textarea
          id='checkout-remarks'
          rows={3}
          aria-invalid={Boolean(errors.remarks)}
          {...register('remarks')}
        />
      </FormField>
    </form>
  )
}
