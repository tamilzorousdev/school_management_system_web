import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowRight, CircleCheck, CircleDashed, CircleMinus, IndianRupee } from 'lucide-react'
import { z } from 'zod'
import { AppModal } from '@/components/common/app-modal'
import { Combobox } from '@/components/common/combobox'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import { DetailList, ErrorState } from '@/components/common/display'
import { FormField } from '@/components/common/form-field'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input, Textarea } from '@/components/ui/input'
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { can, useMe } from '@/features/auth/api'
import { rupees } from '@/features/fees/labels'
import { alerts } from '@/lib/alerts'
import { toApiError } from '@/lib/api/errors'
import { formatDate, formatDateTime } from '@/lib/format'
import {
  hostelApi,
  useCheckout,
  useHostelMutation,
  type Checkout,
  type ClearanceInput,
  type ClearanceItem,
  type ClearanceStatus,
} from '../api'
import {
  CHECKOUT_REASON,
  CHECKOUT_STATUS,
  CLEARANCE_STATUS,
  studentLine,
  toneOptions,
} from '../labels'
import { SettleDepositModal } from './fee-modals'
import { applyApiError, nullIfEmpty, optionalAmount, optionalText } from './resident-form'
import { FormError, MoneyTile } from './resident-form-parts'

const CLEARANCE_FORM_ID = 'hostel-clearance-form'
const CLEARANCE_OPTIONS = toneOptions(CLEARANCE_STATUS)

const STATUS_BUTTONS: { status: ClearanceStatus; label: string; icon: typeof CircleCheck }[] = [
  { status: 'cleared', label: 'Cleared', icon: CircleCheck },
  { status: 'waived', label: 'Waived', icon: CircleMinus },
  { status: 'pending', label: 'Pending', icon: CircleDashed },
]

export function CheckoutSheet({
  checkoutId,
  onClose,
}: {
  checkoutId: number | null
  onClose: () => void
}) {
  const [shownId, setShownId] = useState(checkoutId)
  if (checkoutId && checkoutId !== shownId) setShownId(checkoutId)
  const checkout = useCheckout(shownId ?? 0)
  const data = checkout.data

  return (
    <Sheet open={Boolean(checkoutId)} onOpenChange={(open) => !open && onClose()}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{data ? `Checkout · ${data.student.name}` : 'Checkout'}</SheetTitle>
          <SheetDescription>
            {data
              ? [studentLine(data.student), data.hostel_name, data.bed].filter(Boolean).join(' · ')
              : 'Loading'}
          </SheetDescription>
        </SheetHeader>
        <SheetBody>
          {checkout.isError && !data ? (
            <ErrorState message={checkout.error.message} onRetry={() => checkout.refetch()} />
          ) : !data ? (
            <div className='grid gap-3'>
              <Skeleton className='h-24' />
              <Skeleton className='h-64' />
            </div>
          ) : (
            <CheckoutBody key={data.id} checkout={data} onClose={onClose} />
          )}
        </SheetBody>
      </SheetContent>
    </Sheet>
  )
}

function CheckoutBody({ checkout, onClose }: { checkout: Checkout; onClose: () => void }) {
  const me = useMe().data
  const canCheckout = can(me, 'hostel.checkout')
  const canFees = can(me, 'hostel.fees')
  const open = checkout.status === 'open'
  const editable = open && canCheckout
  const [editing, setEditing] = useState<{ item: ClearanceItem; status: ClearanceStatus } | null>(
    null
  )
  const [settling, setSettling] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [completeError, setCompleteError] = useState<string | null>(null)
  const complete = useHostelMutation(() => hostelApi.completeCheckout(checkout.id))
  const cancel = useHostelMutation(() => hostelApi.cancelCheckout(checkout.id))

  const finish = () => {
    setCompleteError(null)
    complete
      .mutateAsync(undefined)
      .then(() =>
        alerts.success('Checkout completed', {
          description: `${checkout.student.name} has left the hostel and the bed is vacant.`,
        })
      )
      .catch((error: unknown) => setCompleteError(toApiError(error).message))
  }

  return (
    <div className='grid gap-5'>
      <div className='flex flex-wrap items-center justify-between gap-2'>
        <div className='flex flex-wrap items-center gap-2'>
          <Badge tone={CHECKOUT_STATUS[checkout.status].tone} dot>
            {CHECKOUT_STATUS[checkout.status].label}
          </Badge>
          {open && checkout.pending_items > 0 && (
            <Badge tone='warning'>{checkout.pending_items} pending</Badge>
          )}
        </div>
        <Button variant='outline' size='sm' asChild>
          <Link
            to='/hostel/residents/$admissionId'
            params={{ admissionId: String(checkout.admission_id) }}
            search={{ tab: 'overview' }}
            onClick={onClose}
          >
            Open resident
            <ArrowRight />
          </Link>
        </Button>
      </div>

      <DetailList
        items={[
          { label: 'Reason', value: CHECKOUT_REASON[checkout.reason] },
          { label: 'Checkout date', value: formatDate(checkout.checkout_date) },
          { label: 'Hostel admission', value: checkout.admission_no, mono: true },
          {
            label: checkout.completed_at ? 'Completed' : 'Started',
            value: formatDateTime(checkout.completed_at ?? checkout.created_at),
          },
          ...(checkout.forwarding_address
            ? [{ label: 'Forwarding address', value: checkout.forwarding_address }]
            : []),
          ...(checkout.remarks ? [{ label: 'Remarks', value: checkout.remarks }] : []),
        ]}
      />

      <div className='grid gap-3 sm:grid-cols-2'>
        <MoneyTile
          label='Hostel fee due'
          value={rupees(checkout.hostel_dues)}
          tone={checkout.hostel_dues > 0 ? 'warning' : 'success'}
          hint={
            checkout.hostel_dues > 0
              ? 'Collect it in Fees, or waive the fee dues item'
              : 'No hostel fee due'
          }
          action={
            checkout.hostel_dues > 0 ? (
              <Button variant='outline' size='sm' asChild>
                <Link to='/fees' search={{ tab: 'dues', search: checkout.admission_no }}>
                  <IndianRupee />
                  Collect in Fees
                </Link>
              </Button>
            ) : undefined
          }
        />
        <MoneyTile
          label='Caution deposit held'
          value={rupees(checkout.deposit_held)}
          tone={checkout.deposit_held > 0 ? 'warning' : 'success'}
          hint={
            checkout.deposit_held > 0
              ? 'Refund it or keep part of it before completing'
              : 'Nothing held'
          }
          action={
            checkout.deposit_held > 0 && canFees && open ? (
              <Button variant='outline' size='sm' onClick={() => setSettling(true)}>
                Settle deposit
              </Button>
            ) : undefined
          }
        />
      </div>

      <section className='grid gap-3'>
        <h3 className='text-xs font-bold tracking-wider text-muted-foreground uppercase'>
          Clearance checklist
        </h3>
        <ul className='grid divide-y rounded-lg border'>
          {checkout.items.map((item) => (
            <li key={item.code} className='grid gap-2 px-3 py-3'>
              <div className='flex flex-wrap items-start justify-between gap-2'>
                <div className='grid min-w-0 gap-0.5'>
                  <span className='text-sm font-semibold'>{item.label}</span>
                  {(item.amount !== null || item.note) && (
                    <span className='text-xs text-muted-foreground'>
                      {[item.amount !== null ? rupees(item.amount) : null, item.note]
                        .filter(Boolean)
                        .join(' · ')}
                    </span>
                  )}
                  {item.cleared_at && (
                    <span className='text-xs text-muted-foreground'>
                      {item.cleared_by_name ? `${item.cleared_by_name} · ` : ''}
                      {formatDateTime(item.cleared_at)}
                    </span>
                  )}
                </div>
                <Badge tone={CLEARANCE_STATUS[item.status].tone} dot className='shrink-0'>
                  {CLEARANCE_STATUS[item.status].label}
                </Badge>
              </div>
              {editable && (
                <div className='flex flex-wrap gap-1.5'>
                  {STATUS_BUTTONS.filter((button) => button.status !== item.status).map(
                    (button) => (
                      <Button
                        key={button.status}
                        variant='outline'
                        size='sm'
                        onClick={() => setEditing({ item, status: button.status })}
                      >
                        <button.icon />
                        {button.label}
                      </Button>
                    )
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      </section>

      {editable && (
        <div className='grid gap-3 border-t pt-4'>
          <FormError message={completeError ?? undefined} />
          <div className='flex flex-wrap justify-end gap-2'>
            <Button variant='outline' onClick={() => setCancelling(true)}>
              Cancel checkout
            </Button>
            <Button loading={complete.isPending} onClick={finish}>
              <CircleCheck />
              Complete checkout
            </Button>
          </div>
        </div>
      )}

      <ClearanceModal checkoutId={checkout.id} target={editing} onClose={() => setEditing(null)} />
      <SettleDepositModal
        open={settling}
        onOpenChange={setSettling}
        admissionId={checkout.admission_id}
        studentName={checkout.student.name}
        held={checkout.deposit_held}
      />
      <ConfirmDialog
        open={cancelling}
        onOpenChange={setCancelling}
        title='Cancel this checkout?'
        description={`${checkout.student.name} goes back to staying in the hostel. The checklist is kept on record.`}
        confirmText='Cancel checkout'
        destructive
        loading={cancel.isPending}
        onConfirm={() =>
          void cancel
            .mutateAsync(undefined)
            .then(() => {
              alerts.success('Checkout cancelled')
              setCancelling(false)
            })
            .catch((error: unknown) => alerts.error(toApiError(error).message))
        }
      />
    </div>
  )
}

const clearanceSchema = z.object({
  status: z.enum(['pending', 'cleared', 'waived']),
  amount: optionalAmount,
  note: optionalText(255, 'Note'),
})

type ClearanceValues = z.infer<typeof clearanceSchema>

function ClearanceModal({
  checkoutId,
  target,
  onClose,
}: {
  checkoutId: number
  target: { item: ClearanceItem; status: ClearanceStatus } | null
  onClose: () => void
}) {
  const save = useHostelMutation((input: { code: string; body: ClearanceInput }) =>
    hostelApi.updateClearance(checkoutId, input.code, input.body)
  )
  return (
    <AppModal
      open={Boolean(target)}
      onOpenChange={(next) => !next && onClose()}
      title={target?.item.label ?? 'Clearance item'}
      description='Add a charge or refund amount and a note if needed.'
      formId={CLEARANCE_FORM_ID}
      submitText='Save'
      loading={save.isPending}
      size='sm'
    >
      {target && (
        <ClearanceForm
          key={`${target.item.code}-${target.status}`}
          item={target.item}
          status={target.status}
          onSubmit={async (body) => {
            await save.mutateAsync({ code: target.item.code, body })
            alerts.success(`${target.item.label}: ${CLEARANCE_STATUS[body.status].label}`)
            onClose()
          }}
        />
      )}
    </AppModal>
  )
}

function ClearanceForm({
  item,
  status,
  onSubmit,
}: {
  item: ClearanceItem
  status: ClearanceStatus
  onSubmit: (body: ClearanceInput) => Promise<void>
}) {
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<ClearanceValues>({
    resolver: zodResolver(clearanceSchema),
    defaultValues: {
      status,
      amount: item.amount !== null ? String(item.amount) : '',
      note: item.note ?? '',
    },
  })

  const submit = handleSubmit(async (values) => {
    try {
      await onSubmit({
        status: values.status,
        amount: values.amount ? Number(values.amount) : null,
        note: nullIfEmpty(values.note),
      })
    } catch (error) {
      applyApiError(error, setError, ['status', 'amount', 'note'])
    }
  })

  return (
    <form id={CLEARANCE_FORM_ID} onSubmit={submit} noValidate className='grid gap-4'>
      <FormError message={errors.root?.message} />
      <FormField id='clearance-status' label='Status' required error={errors.status?.message}>
        <Controller
          control={control}
          name='status'
          render={({ field }) => (
            <Combobox
              id='clearance-status'
              label='Status'
              value={field.value}
              options={CLEARANCE_OPTIONS}
              placeholder='Choose status'
              highlightSelected={false}
              className='sm:w-full'
              onChange={(value) => field.onChange(value ?? status)}
            />
          )}
        />
      </FormField>
      <FormField
        id='clearance-amount'
        label='Amount'
        error={errors.amount?.message}
        hint='Charge or refund, if any'
      >
        <Input
          id='clearance-amount'
          inputMode='decimal'
          className='tabular'
          aria-invalid={Boolean(errors.amount)}
          {...register('amount')}
        />
      </FormField>
      <FormField id='clearance-note' label='Note' error={errors.note?.message}>
        <Textarea
          id='clearance-note'
          rows={2}
          aria-invalid={Boolean(errors.note)}
          {...register('note')}
        />
      </FormField>
    </form>
  )
}
