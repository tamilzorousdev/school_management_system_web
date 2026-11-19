import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { AppModal } from '@/components/common/app-modal'
import { Combobox } from '@/components/common/combobox'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import { FormField } from '@/components/common/form-field'
import { Input, Textarea } from '@/components/ui/input'
import { rupees } from '@/features/fees/labels'
import { alerts } from '@/lib/alerts'
import { toApiError } from '@/lib/api/errors'
import { formatDate } from '@/lib/format'
import {
  FOLLOW_UP_ACTIONS,
  libraryApi,
  useLibraryMutation,
  type CopyCondition,
  type FollowUpAction,
  type Loan,
} from '../api'
import {
  COPY_CONDITION_VALUES,
  optionalAmount,
  optionalDate,
  optionalText,
  textOrNull,
} from '../form-utils'
import {
  COPY_CONDITION,
  FOLLOW_UP_ACTION,
  optionsOf,
  plural,
  today,
  type LoanAction,
} from '../labels'
import { FormError } from './library-parts'

export function LoanActionModal({
  action,
  loan,
  onClose,
}: {
  action: LoanAction | null
  loan: Loan | null
  onClose: () => void
}) {
  if (!loan || !action) return null
  if (action === 'renew') return <RenewModal loan={loan} onClose={onClose} />
  if (action === 'lost') return <LostModal loan={loan} onClose={onClose} />
  if (action === 'found') return <FoundDialog loan={loan} onClose={onClose} />
  if (action === 'return') return <ReturnLoanModal loan={loan} onClose={onClose} />
  return <FollowUpModal loan={loan} onClose={onClose} />
}

const subtitle = (loan: Loan) =>
  `${loan.book.title} · ${loan.copy.accession_no} · ${loan.member.name}`

const renewSchema = z.object({ due_date: optionalDate })

function RenewModal({ loan, onClose }: { loan: Loan; onClose: () => void }) {
  const renew = useLibraryMutation((dueDate: string) =>
    libraryApi.renew(loan.id, dueDate || undefined)
  )
  const {
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<z.infer<typeof renewSchema>>({
    resolver: zodResolver(renewSchema),
    defaultValues: { due_date: '' },
  })
  const submit = handleSubmit(async (values) => {
    if (values.due_date && values.due_date <= today()) {
      setError('due_date', { message: 'Choose a date after today' })
      return
    }
    try {
      const next = await renew.mutateAsync(values.due_date)
      alerts.success('Loan renewed', { description: `Now due ${formatDate(next.due_date)}` })
      onClose()
    } catch (error) {
      setError('root', { message: toApiError(error).message })
    }
  })
  return (
    <AppModal
      open
      onOpenChange={(open) => !open && onClose()}
      title='Renew loan'
      description={subtitle(loan)}
      formId='library-renew'
      submitText='Renew'
      loading={renew.isPending}
    >
      <form id='library-renew' noValidate onSubmit={submit} className='grid gap-4'>
        <FormError message={errors.root?.message} />
        <p className='text-sm text-muted-foreground'>
          Due {formatDate(loan.due_date)}. Renewed {plural(loan.renew_count, 'time')} so far.
        </p>
        <FormField
          id='renew-due'
          label='New due date'
          hint='Leave empty to add the usual loan days'
          error={errors.due_date?.message}
        >
          <Controller
            control={control}
            name='due_date'
            render={({ field }) => (
              <Input
                id='renew-due'
                type='date'
                min={today()}
                value={field.value}
                onChange={(event) => field.onChange(event.target.value)}
              />
            )}
          />
        </FormField>
      </form>
    </AppModal>
  )
}

const lostSchema = z.object({ note: optionalText(255, 'Note') })

function LostModal({ loan, onClose }: { loan: Loan; onClose: () => void }) {
  const lost = useLibraryMutation((note: string) => libraryApi.markLost(loan.id, textOrNull(note)))
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<z.infer<typeof lostSchema>>({
    resolver: zodResolver(lostSchema),
    defaultValues: { note: '' },
  })
  const submit = handleSubmit(async (values) => {
    try {
      const detail = await lost.mutateAsync(values.note)
      const total = detail.fines.reduce((sum, fine) => sum + fine.balance, 0)
      alerts.success('Book marked lost', {
        description: total ? `Fines raised: ${rupees(total)}` : undefined,
      })
      onClose()
    } catch (error) {
      setError('root', { message: toApiError(error).message })
    }
  })
  return (
    <AppModal
      open
      onOpenChange={(open) => !open && onClose()}
      title='Mark book lost'
      description={subtitle(loan)}
      formId='library-lost'
      submitText='Mark lost'
      loading={lost.isPending}
    >
      <form id='library-lost' noValidate onSubmit={submit} className='grid gap-4'>
        <FormError message={errors.root?.message} />
        <p className='rounded-md border border-warning/30 bg-warning/10 px-3 py-2 text-sm'>
          A lost fine (book price plus the processing fee) and any late fine are raised for{' '}
          {loan.member.name}. If the book turns up, mark it found and the unpaid lost fine is
          waived.
        </p>
        <FormField id='lost-note' label='Note' error={errors.note?.message}>
          <Input id='lost-note' autoFocus {...register('note')} />
        </FormField>
      </form>
    </AppModal>
  )
}

function FoundDialog({ loan, onClose }: { loan: Loan; onClose: () => void }) {
  const found = useLibraryMutation(() => libraryApi.markFound(loan.id))
  return (
    <ConfirmDialog
      open
      onOpenChange={(open) => !open && onClose()}
      title='Book found?'
      description={`${subtitle(loan)}. The copy goes back on the shelf and the unpaid part of the lost fine is waived.`}
      confirmText='Mark found'
      loading={found.isPending}
      onConfirm={async () => {
        try {
          await found.mutateAsync(undefined)
          alerts.success('Book found')
          onClose()
        } catch (error) {
          alerts.error(toApiError(error).message)
        }
      }}
    />
  )
}

const returnSchema = z.object({
  condition: z.enum(COPY_CONDITION_VALUES).optional(),
  damage_fine: optionalAmount(1000000, 'Damage fine'),
  remarks: optionalText(255, 'Remarks'),
})

function ReturnLoanModal({ loan, onClose }: { loan: Loan; onClose: () => void }) {
  const submitReturn = useLibraryMutation((values: z.infer<typeof returnSchema>) =>
    libraryApi.returnBooks([
      {
        code: loan.copy.barcode,
        condition: values.condition,
        damage_fine: values.damage_fine ? Number(values.damage_fine) : undefined,
        remarks: textOrNull(values.remarks),
      },
    ])
  )
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<z.infer<typeof returnSchema>>({
    resolver: zodResolver(returnSchema),
    defaultValues: { condition: undefined, damage_fine: '', remarks: '' },
  })
  const submit = handleSubmit(async (values) => {
    try {
      const [item] = await submitReturn.mutateAsync(values)
      const total = item?.fines.reduce((sum, fine) => sum + fine.balance, 0) ?? 0
      alerts.success('Book returned', {
        description: total ? `Fines raised: ${rupees(total)}` : undefined,
      })
      onClose()
    } catch (error) {
      setError('root', { message: toApiError(error).message })
    }
  })
  return (
    <AppModal
      open
      onOpenChange={(open) => !open && onClose()}
      title='Return book'
      description={subtitle(loan)}
      formId='library-return-one'
      submitText='Return'
      loading={submitReturn.isPending}
    >
      <form
        id='library-return-one'
        noValidate
        onSubmit={submit}
        className='grid gap-4 sm:grid-cols-2'
      >
        <div className='sm:col-span-2'>
          <FormError message={errors.root?.message} />
          {loan.running_fine > 0 && (
            <p className='text-sm text-destructive'>
              {plural(loan.days_overdue, 'day')} late: a fine of {rupees(loan.running_fine)} is
              raised on return.
            </p>
          )}
        </div>
        <FormField id='return-condition' label='Condition'>
          <Controller
            control={control}
            name='condition'
            render={({ field }) => (
              <Combobox
                id='return-condition'
                label='Condition'
                placeholder='Unchanged'
                allLabel='Unchanged'
                value={field.value}
                options={optionsOf(COPY_CONDITION)}
                onChange={(next) => field.onChange(next as CopyCondition | undefined)}
                className='sm:w-full'
                highlightSelected={false}
              />
            )}
          />
        </FormField>
        <FormField
          id='return-damage'
          label='Damage fine (₹)'
          hint='Raises a fine and sends the copy to repair'
          error={errors.damage_fine?.message}
        >
          <Input id='return-damage' inputMode='decimal' {...register('damage_fine')} />
        </FormField>
        <FormField
          id='return-remarks'
          label='Remarks'
          error={errors.remarks?.message}
          className='sm:col-span-2'
        >
          <Input id='return-remarks' {...register('remarks')} />
        </FormField>
      </form>
    </AppModal>
  )
}

const followUpSchema = z.object({
  action: z.enum(FOLLOW_UP_ACTIONS, { message: 'Choose what was done' }),
  note: optionalText(500, 'Note'),
  promised_on: optionalDate,
  next_follow_up_on: optionalDate,
})

function FollowUpModal({ loan, onClose }: { loan: Loan; onClose: () => void }) {
  const save = useLibraryMutation((values: z.infer<typeof followUpSchema>) =>
    libraryApi.addFollowUp(loan.id, {
      action: values.action,
      note: textOrNull(values.note),
      promised_on: values.promised_on || undefined,
      next_follow_up_on: values.next_follow_up_on || undefined,
    })
  )
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<z.infer<typeof followUpSchema>>({
    resolver: zodResolver(followUpSchema),
    defaultValues: {
      action: loan.member.member_type === 'staff' ? 'reminded_staff' : 'called_parent',
      note: '',
      promised_on: '',
      next_follow_up_on: '',
    },
  })
  const submit = handleSubmit(async (values) => {
    try {
      await save.mutateAsync(values)
      alerts.success('Follow-up saved')
      onClose()
    } catch (error) {
      const apiError = toApiError(error)
      const field = apiError.fieldErrors[0]?.field
      if (field === 'note' || field === 'promised_on' || field === 'next_follow_up_on') {
        setError(field, { message: apiError.fieldErrors[0].message })
      } else {
        setError('root', { message: apiError.message })
      }
    }
  })
  const dateField = (name: 'promised_on' | 'next_follow_up_on', label: string, hint: string) => (
    <FormField id={`follow-${name}`} label={label} hint={hint} error={errors[name]?.message}>
      <Controller
        control={control}
        name={name}
        render={({ field }) => (
          <Input
            id={`follow-${name}`}
            type='date'
            min={today()}
            value={field.value}
            onChange={(event) => field.onChange(event.target.value)}
          />
        )}
      />
    </FormField>
  )
  return (
    <AppModal
      open
      onOpenChange={(open) => !open && onClose()}
      title='Log follow-up'
      description={`${subtitle(loan)} · ${plural(loan.days_overdue, 'day')} late`}
      formId='library-follow-up'
      submitText='Save follow-up'
      loading={save.isPending}
    >
      <form
        id='library-follow-up'
        noValidate
        onSubmit={submit}
        className='grid gap-4 sm:grid-cols-2'
      >
        <div className='sm:col-span-2'>
          <FormError message={errors.root?.message} />
        </div>
        <FormField
          id='follow-action'
          label='What was done'
          required
          error={errors.action?.message}
          className='sm:col-span-2'
        >
          <Controller
            control={control}
            name='action'
            render={({ field }) => (
              <Combobox
                id='follow-action'
                label='What was done'
                placeholder='Choose'
                value={field.value}
                options={optionsOf(FOLLOW_UP_ACTION)}
                onChange={(next) => field.onChange(next as FollowUpAction | undefined)}
                className='sm:w-full'
                highlightSelected={false}
              />
            )}
          />
        </FormField>
        <FormField
          id='follow-note'
          label='Note'
          error={errors.note?.message}
          className='sm:col-span-2'
        >
          <Textarea
            id='follow-note'
            rows={3}
            placeholder='Mother said the book will come on Monday'
            {...register('note')}
          />
        </FormField>
        {dateField('promised_on', 'Promised return', 'When they said it will come back')}
        {dateField('next_follow_up_on', 'Check again on', 'Back in the follow-up list on this day')}
      </form>
    </AppModal>
  )
}
