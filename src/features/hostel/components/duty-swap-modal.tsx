import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { AppModal } from '@/components/common/app-modal'
import { FormField } from '@/components/common/form-field'
import { Textarea } from '@/components/ui/input'
import { alerts } from '@/lib/alerts'
import { useHostelMutation } from '../api'
import { dutyApi, type RosterRow, type SwapInput } from '../api-duty'
import { dayLabel, shiftTime } from './duty-helpers'
import { FormAlert, InfoNote } from './leave-form-parts'
import { applyApiError, textOrNull } from './leave-helpers'
import { StaffPicker } from './pickers'

const FORM_ID = 'duty-swap-form'

const schema = z.object({
  to_user_id: z.string().min(1, 'Choose who takes the duty'),
  reason: z.string().trim().max(255, 'Keep it to 255 characters'),
})

type FormValues = z.infer<typeof schema>

export function SwapRequestModal({ duty, onClose }: { duty: RosterRow; onClose: () => void }) {
  const request = useHostelMutation((input: SwapInput) => dutyApi.requestSwap(duty.id, input))
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { to_user_id: '', reason: '' },
  })

  const submit = handleSubmit(async (values) => {
    try {
      const swap = await request.mutateAsync({
        to_user_id: Number(values.to_user_id),
        reason: textOrNull(values.reason),
      })
      alerts.success('Swap requested', {
        description: `${swap.to_user_name} and the roster manager are told.`,
      })
      onClose()
    } catch (error) {
      applyApiError(error, setError, ['to_user_id', 'reason'], {
        HOSTEL_DUTY_CLASH: 'to_user_id',
        HOSTEL_SWAP_PENDING: 'to_user_id',
      })
    }
  })

  return (
    <AppModal
      open
      onOpenChange={(open) => !open && onClose()}
      title='Request a swap'
      description={`${dayLabel(duty.duty_date)} · ${duty.shift_name} (${shiftTime(duty.start_time, duty.end_time)}) · ${duty.hostel_name}`}
      formId={FORM_ID}
      submitText='Request swap'
      loading={request.isPending}
      size='sm'
    >
      <form id={FORM_ID} noValidate onSubmit={submit} className='grid gap-4'>
        <FormAlert message={errors.root?.message} />
        <FormField
          id='swap-to-user'
          label='Who takes the duty'
          required
          error={errors.to_user_id?.message}
        >
          <Controller
            control={control}
            name='to_user_id'
            render={({ field }) => (
              <StaffPicker
                id='swap-to-user'
                label='Staff member'
                value={field.value || undefined}
                invalid={Boolean(errors.to_user_id)}
                onChange={(value) => field.onChange(value ?? '')}
              />
            )}
          />
        </FormField>
        <FormField id='swap-reason' label='Reason' error={errors.reason?.message} hint='Optional'>
          <Textarea
            id='swap-reason'
            maxLength={255}
            placeholder='Family function'
            aria-invalid={Boolean(errors.reason)}
            {...register('reason')}
          />
        </FormField>
        <InfoNote>
          The duty stays yours until a roster manager approves the swap. The other person must be
          free on this shift that day.
        </InfoNote>
      </form>
    </AppModal>
  )
}
