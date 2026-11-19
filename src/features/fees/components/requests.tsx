import { useState } from 'react'
import { CheckCircle2, ClipboardCheck, FileDown, Undo2, XCircle } from 'lucide-react'
import { AppModal } from '@/components/common/app-modal'
import { Combobox } from '@/components/common/combobox'
import { DataTable, type Column } from '@/components/common/data-table'
import { FormField } from '@/components/common/form-field'
import { FilterSelect, ListToolbar, SearchBox } from '@/components/common/list-toolbar'
import { useShortcut } from '@/components/shortcuts/shortcut-context'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input, Textarea } from '@/components/ui/input'
import { alerts } from '@/lib/alerts'
import { formatDate, formatDateTime } from '@/lib/format'
import { today } from '@/features/attendance/labels'
import { useMe } from '@/features/auth/api'
import type { FeeAccess } from '../access'
import {
  feesApi,
  useFeeRequests,
  useFeesMutation,
  type FeeInvoiceDetail,
  type FeeRequest,
  type FeeRequestKind,
  type FeeRequestStatus,
  type PaymentMode,
} from '../api'
import {
  MANUAL_MODE_OPTIONS,
  PAYMENT_MODES,
  REQUEST_KINDS,
  REQUEST_KIND_OPTIONS,
  REQUEST_STATUS,
  REQUEST_STATUS_OPTIONS,
  amountError,
  formErrors,
  openRefundReceipt,
  rupees,
} from '../labels'
import type { FeesSearch } from '../search'

const LIMIT = 20

function requestSummary(request: Pick<FeeRequest, 'kind' | 'amount' | 'payment' | 'details'>) {
  if (request.kind === 'discount') {
    return Number(request.amount) > 0
      ? `Discount of ${rupees(Number(request.amount))}`
      : 'Remove the discount'
  }
  if (request.kind === 'cancel') return 'Cancel the invoice'
  if (request.kind === 'write_off') return `Write off ${rupees(Number(request.amount))}`
  if (request.kind === 'reschedule') {
    return `Move the due date to ${request.details.due_date ? formatDate(request.details.due_date) : '—'}`
  }
  if (request.kind === 'reversal') {
    return `Reverse ${request.payment ? `${request.payment.receipt_no} · ` : ''}${rupees(Number(request.amount))}`
  }
  return `Refund ${rupees(Number(request.amount))}`
}

export function ApprovalsTab({
  search,
  access,
  onChange,
  onOpenInvoice,
}: {
  search: FeesSearch
  access: FeeAccess
  onChange: (patch: Partial<FeesSearch>) => void
  onOpenInvoice: (invoiceId: number) => void
}) {
  const me = useMe().data
  const page = search.page ?? 1
  const status = search.request_status ?? 'pending'
  const requests = useFeeRequests({
    page,
    limit: LIMIT,
    search: search.search,
    kind: search.request_kind,
    status: status === 'all' ? undefined : (status as FeeRequestStatus),
  })
  const [deciding, setDeciding] = useState<{ request: FeeRequest; approve: boolean } | null>(null)
  const withdraw = useFeesMutation((id: number) => feesApi.withdrawRequest(id))
  const filtered = Boolean(search.search || search.request_kind || search.request_status)

  useShortcut('app.refresh', () => void requests.refetch())

  const actions = (row: FeeRequest) => {
    if (row.status !== 'pending') return null
    const mine = me?.id === row.requested_by?.id
    return (
      <span className='flex flex-wrap justify-end gap-1.5'>
        {access.approve && !mine && (
          <>
            <Button
              size='sm'
              variant='outline'
              aria-label={`Reject request ${row.id}`}
              onClick={(event) => {
                event.stopPropagation()
                setDeciding({ request: row, approve: false })
              }}
            >
              <XCircle />
              Reject
            </Button>
            <Button
              size='sm'
              aria-label={`Approve request ${row.id}`}
              onClick={(event) => {
                event.stopPropagation()
                setDeciding({ request: row, approve: true })
              }}
            >
              <CheckCircle2 />
              Approve
            </Button>
          </>
        )}
        {mine && (
          <Button
            size='sm'
            variant='ghost'
            loading={withdraw.isPending && withdraw.variables === row.id}
            onClick={async (event) => {
              event.stopPropagation()
              try {
                await withdraw.mutateAsync(row.id)
                alerts.success('Request withdrawn')
              } catch (error) {
                formErrors(error)
              }
            }}
          >
            <Undo2 />
            Withdraw
          </Button>
        )}
      </span>
    )
  }

  const columns: Column<FeeRequest>[] = [
    {
      key: 'what',
      header: 'Request',
      cell: (row) => (
        <span className='grid'>
          <span className='font-semibold'>{requestSummary(row)}</span>
          <span className='text-xs text-muted-foreground'>
            {row.invoice.invoice_no} · {row.invoice.installment}
          </span>
        </span>
      ),
    },
    {
      key: 'student',
      header: 'Student',
      cell: (row) => (
        <span className='grid'>
          <span>{row.student.full_name}</span>
          <span className='text-xs text-muted-foreground'>
            {row.student.class_section ?? row.student.admission_no}
          </span>
        </span>
      ),
    },
    {
      key: 'reason',
      header: 'Reason',
      hideBelow: 'lg',
      cell: (row) => <span className='line-clamp-2 text-muted-foreground'>{row.reason}</span>,
    },
    {
      key: 'by',
      header: 'Asked by',
      hideBelow: 'xl',
      cell: (row) => (
        <span className='grid'>
          <span>{row.requested_by?.name ?? '—'}</span>
          <span className='text-xs text-muted-foreground'>{formatDateTime(row.requested_at)}</span>
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (row) => (
        <span className='grid gap-0.5'>
          <Badge tone={REQUEST_STATUS[row.status].tone}>{REQUEST_STATUS[row.status].label}</Badge>
          {row.decided_by && row.status !== 'withdrawn' && (
            <span className='text-xs text-muted-foreground'>by {row.decided_by.name}</span>
          )}
        </span>
      ),
    },
    { key: 'actions', header: '', align: 'right', cell: actions },
  ]

  return (
    <Card className='overflow-hidden'>
      <div className='border-b px-4 py-3'>
        <h2 className='font-bold'>Approvals</h2>
        <p className='text-xs text-muted-foreground'>
          Discounts, invoice cancellations, payment reversals and refunds change the invoice only
          after the AO or school admin approves them. Nobody approves their own request.
        </p>
      </div>
      <ListToolbar
        summary={
          requests.data
            ? `${requests.data.total} ${requests.data.total === 1 ? 'request' : 'requests'}`
            : ''
        }
        onClear={
          filtered
            ? () =>
                onChange({ search: undefined, request_kind: undefined, request_status: undefined })
            : undefined
        }
      >
        <SearchBox
          value={search.search ?? ''}
          onChange={(value) => onChange({ search: value || undefined })}
          placeholder='Student, invoice or reason'
          label='Search requests'
        />
        <FilterSelect
          id='request-status-filter'
          label='Filter by status'
          allLabel='Waiting'
          value={status === 'pending' ? undefined : status}
          options={REQUEST_STATUS_OPTIONS.filter((option) => option.value !== 'pending')}
          onChange={(value) =>
            onChange({ request_status: (value as FeesSearch['request_status']) || undefined })
          }
        />
        <FilterSelect
          id='request-kind-filter'
          label='Filter by kind'
          allLabel='All kinds'
          value={search.request_kind}
          options={REQUEST_KIND_OPTIONS}
          onChange={(value) => onChange({ request_kind: value as FeeRequestKind | undefined })}
        />
      </ListToolbar>
      <DataTable
        rows={requests.data?.items ?? []}
        columns={columns}
        rowKey={(row) => row.id}
        loading={requests.isFetching}
        error={requests.isError ? requests.error.message : null}
        onRetry={() => requests.refetch()}
        onRowClick={(row) => onOpenInvoice(row.invoice.id)}
        empty={{
          icon: ClipboardCheck,
          title: status === 'pending' && !filtered ? 'Nothing is waiting' : 'No requests match',
          description:
            status === 'pending' && !filtered
              ? 'New discount, cancellation, reversal and refund requests appear here.'
              : 'Try other filters or clear them.',
        }}
        pagination={
          requests.data
            ? {
                page,
                limit: LIMIT,
                total: requests.data.total,
                label: 'requests',
                onPageChange: (next) => onChange({ page: next }),
              }
            : undefined
        }
        card={(row) => (
          <div className='grid gap-1.5'>
            <div className='flex items-start justify-between gap-2'>
              <span className='font-semibold'>{requestSummary(row)}</span>
              <Badge tone={REQUEST_STATUS[row.status].tone}>
                {REQUEST_STATUS[row.status].label}
              </Badge>
            </div>
            <span className='text-xs text-muted-foreground'>
              {row.student.full_name} · {row.invoice.invoice_no} · asked by{' '}
              {row.requested_by?.name ?? '—'}
            </span>
            <span className='text-xs'>{row.reason}</span>
          </div>
        )}
      />
      {deciding && (
        <DecideRequestModal
          request={deciding.request}
          approve={deciding.approve}
          onClose={() => setDeciding(null)}
        />
      )}
    </Card>
  )
}

export function DecideRequestModal({
  request,
  approve,
  onClose,
}: {
  request: Pick<
    FeeRequest,
    'id' | 'kind' | 'amount' | 'payment' | 'reason' | 'requested_by' | 'details'
  >
  approve: boolean
  onClose: () => void
}) {
  const [comment, setComment] = useState('')
  const [error, setError] = useState<string>()
  const decide = useFeesMutation(() =>
    approve
      ? feesApi.approveRequest(request.id, comment.trim())
      : feesApi.rejectRequest(request.id, comment.trim())
  )
  const what = requestSummary(request)
  return (
    <AppModal
      open
      onOpenChange={(open) => !open && onClose()}
      title={approve ? `Approve: ${what}?` : `Reject: ${what}?`}
      description={`Asked by ${request.requested_by?.name ?? 'someone'}: “${request.reason}”. ${approve ? 'The invoice changes as soon as you approve.' : 'Nothing changes on the invoice.'}`}
      formId='fee-decide-form'
      submitText={approve ? 'Approve' : 'Reject'}
      cancelText='Not now'
      loading={decide.isPending}
    >
      <form
        id='fee-decide-form'
        noValidate
        onSubmit={async (event) => {
          event.preventDefault()
          if (!approve && comment.trim().length < 3) {
            setError('Say why, so the person who asked knows')
            return
          }
          setError(undefined)
          try {
            await decide.mutateAsync(undefined)
            alerts.success(approve ? `${REQUEST_KINDS[request.kind]} approved` : 'Request rejected')
            onClose()
          } catch (caught) {
            const fields = formErrors(caught, {
              SELF_APPROVAL: 'comment',
              REQUEST_NOT_PENDING: 'comment',
              DISCOUNT_TOO_HIGH: 'comment',
              REFUND_TOO_HIGH: 'comment',
              NOTHING_TO_REFUND: 'comment',
              INVOICE_HAS_PAYMENTS: 'comment',
              INVOICE_PAID: 'comment',
              NO_CHANGE: 'comment',
              PAYMENT_ALREADY_REVERSED: 'comment',
              BALANCE_MISMATCH: 'comment',
              YEAR_ARCHIVED: 'comment',
            })
            setError(fields.comment)
          }
        }}
      >
        <FormField
          id='decide-comment'
          label={approve ? 'Comment' : 'Reason'}
          required={!approve}
          error={error}
        >
          <Textarea
            id='decide-comment'
            autoFocus
            rows={2}
            maxLength={300}
            value={comment}
            placeholder={approve ? 'Optional' : 'Discount is above the sibling policy'}
            aria-invalid={Boolean(error) || undefined}
            onChange={(event) => setComment(event.target.value)}
          />
        </FormField>
      </form>
    </AppModal>
  )
}

export function RefundModal({
  invoice,
  onClose,
}: {
  invoice: FeeInvoiceDetail
  onClose: () => void
}) {
  const [amount, setAmount] = useState('')
  const [mode, setMode] = useState<PaymentMode>('bank_transfer')
  const [reference, setReference] = useState('')
  const [paidOn, setPaidOn] = useState(today())
  const [reason, setReason] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const ask = useFeesMutation(() =>
    feesApi.refund(invoice.id, {
      amount: Number(amount),
      mode,
      reference: reference.trim() || undefined,
      paid_on: paidOn,
      reason: reason.trim(),
    })
  )
  const most = Math.max(0, invoice.paid - invoice.refunded)
  return (
    <AppModal
      open
      onOpenChange={(open) => !open && onClose()}
      title={`Refund on ${invoice.invoice_no}`}
      description={`Only paid amounts of refundable fee heads can be refunded. ${rupees(invoice.paid)} paid${invoice.refunded ? `, ${rupees(invoice.refunded)} already refunded` : ''}. The refund is recorded when it is approved.`}
      formId='fee-refund-form'
      submitText='Send for approval'
      loading={ask.isPending}
      size='lg'
    >
      <form
        id='fee-refund-form'
        noValidate
        className='grid gap-4 sm:grid-cols-2'
        onSubmit={async (event) => {
          event.preventDefault()
          const next: Record<string, string> = {}
          const amountMessage = amountError(amount, most)
          if (amountMessage) next.amount = amountMessage
          else if (!(Number(amount) > 0)) next.amount = 'Enter more than 0'
          if (reason.trim().length < 3)
            next.reason = 'Give the reason, for example: deposit returned'
          setErrors(next)
          if (Object.keys(next).length) return
          try {
            await ask.mutateAsync(undefined)
            alerts.success('Refund sent for approval')
            onClose()
          } catch (error) {
            setErrors(
              formErrors(error, {
                REFUND_TOO_HIGH: 'amount',
                NOTHING_TO_REFUND: 'amount',
                REQUEST_PENDING: 'amount',
              })
            )
          }
        }}
      >
        <FormField id='refund-amount' label='Amount' required error={errors.amount}>
          <div className='relative'>
            <span className='pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-muted-foreground'>
              ₹
            </span>
            <Input
              id='refund-amount'
              type='number'
              inputMode='decimal'
              min={0}
              step='0.01'
              className='tabular pl-7'
              value={amount}
              aria-invalid={Boolean(errors.amount) || undefined}
              onChange={(event) => setAmount(event.target.value)}
            />
          </div>
        </FormField>
        <FormField id='refund-mode' label='Paid back by' required>
          <Combobox
            id='refund-mode'
            label='Paid back by'
            value={mode}
            options={MANUAL_MODE_OPTIONS}
            placeholder='Choose'
            onChange={(value) => value && setMode(value as PaymentMode)}
          />
        </FormField>
        <FormField id='refund-reference' label='Reference' error={errors.reference}>
          <Input
            id='refund-reference'
            value={reference}
            maxLength={60}
            placeholder='NEFT or cheque number'
            onChange={(event) => setReference(event.target.value)}
          />
        </FormField>
        <FormField id='refund-date' label='Paid back on' required error={errors.paid_on}>
          <Input
            id='refund-date'
            type='date'
            value={paidOn}
            max={today()}
            onChange={(event) => setPaidOn(event.target.value)}
          />
        </FormField>
        <FormField
          id='refund-reason'
          label='Reason'
          required
          error={errors.reason}
          className='sm:col-span-2'
        >
          <Textarea
            id='refund-reason'
            rows={2}
            maxLength={300}
            value={reason}
            placeholder='Caution deposit returned on leaving'
            aria-invalid={Boolean(errors.reason) || undefined}
            onChange={(event) => setReason(event.target.value)}
          />
        </FormField>
      </form>
    </AppModal>
  )
}

export function PendingRequests({
  invoice,
  canApprove,
}: {
  invoice: FeeInvoiceDetail
  canApprove: boolean
}) {
  const me = useMe().data
  const [deciding, setDeciding] = useState<{ id: number; approve: boolean } | null>(null)
  if (!invoice.pending_requests.length) return null
  const chosen = invoice.pending_requests.find((row) => row.id === deciding?.id)
  const payment = (paymentId: number | null) =>
    invoice.payments.find((item) => item.id === paymentId) ?? null
  return (
    <section className='grid gap-2 rounded-lg border border-warning/40 bg-warning/10 p-3'>
      <h3 className='text-sm font-semibold'>Waiting for approval</h3>
      <ul className='grid gap-2'>
        {invoice.pending_requests.map((row) => {
          const ref = payment(row.payment_id)
          const what = requestSummary({
            kind: row.kind,
            amount: row.amount,
            details: row.details,
            payment: ref ? { ...ref, mode: ref.mode } : null,
          })
          return (
            <li key={row.id} className='flex flex-wrap items-center justify-between gap-2 text-sm'>
              <span>
                <span className='font-semibold'>{what}</span>{' '}
                <span className='text-muted-foreground'>
                  · {row.reason} · asked by {row.requested_by?.name ?? '—'}{' '}
                  {formatDate(row.requested_at.slice(0, 10))}
                </span>
              </span>
              {canApprove && me?.id !== row.requested_by?.id && (
                <span className='flex gap-1.5'>
                  <Button
                    size='sm'
                    variant='outline'
                    onClick={() => setDeciding({ id: row.id, approve: false })}
                  >
                    Reject
                  </Button>
                  <Button size='sm' onClick={() => setDeciding({ id: row.id, approve: true })}>
                    Approve
                  </Button>
                </span>
              )}
            </li>
          )
        })}
      </ul>
      {deciding && chosen && (
        <DecideRequestModal
          request={{
            id: chosen.id,
            kind: chosen.kind,
            amount: chosen.amount,
            details: chosen.details,
            reason: chosen.reason,
            requested_by: chosen.requested_by,
            payment: payment(chosen.payment_id)
              ? {
                  id: chosen.payment_id!,
                  receipt_no: payment(chosen.payment_id)!.receipt_no,
                  amount: payment(chosen.payment_id)!.amount,
                  mode: payment(chosen.payment_id)!.mode,
                  paid_on: payment(chosen.payment_id)!.paid_on,
                }
              : null,
          }}
          approve={deciding.approve}
          onClose={() => setDeciding(null)}
        />
      )}
    </section>
  )
}

export function RefundList({ invoice }: { invoice: FeeInvoiceDetail }) {
  if (!invoice.refunds.length) return null
  return (
    <section className='grid gap-2'>
      <h3 className='text-[11px] font-bold tracking-wider text-muted-foreground uppercase'>
        Refunds
      </h3>
      <ul className='divide-y rounded-lg border'>
        {invoice.refunds.map((refund) => (
          <li
            key={refund.id}
            className='flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-sm'
          >
            <span className='grid'>
              <span className='font-semibold'>
                {rupees(refund.amount)} · {PAYMENT_MODES[refund.mode]}
              </span>
              <span className='text-xs text-muted-foreground'>
                {formatDate(refund.paid_on)} · {refund.refund_no}
                {refund.reference ? ` · ${refund.reference}` : ''} · {refund.reason}
              </span>
            </span>
            <Button
              size='sm'
              variant='ghost'
              aria-label={`Refund receipt ${refund.refund_no}`}
              onClick={() => openRefundReceipt(refund.id)}
            >
              <FileDown />
              Receipt
            </Button>
          </li>
        ))}
      </ul>
    </section>
  )
}

export function RescheduleModal({
  invoice,
  onClose,
}: {
  invoice: FeeInvoiceDetail
  onClose: () => void
}) {
  const [dueDate, setDueDate] = useState(invoice.due_date)
  const [reason, setReason] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const ask = useFeesMutation(() => feesApi.reschedule(invoice.id, dueDate, reason.trim()))
  return (
    <AppModal
      open
      onOpenChange={(open) => !open && onClose()}
      title={`Change the due date of ${invoice.invoice_no}?`}
      description={`Now due ${formatDate(invoice.due_date)}. The new date is used once it is approved, and the parent is told.`}
      formId='fee-reschedule-form'
      submitText='Send for approval'
      loading={ask.isPending}
    >
      <form
        id='fee-reschedule-form'
        noValidate
        className='grid gap-4'
        onSubmit={async (event) => {
          event.preventDefault()
          const next: Record<string, string> = {}
          if (!dueDate) next.due_date = 'Choose the new due date'
          else if (dueDate === invoice.due_date) next.due_date = 'Choose a different date'
          if (reason.trim().length < 3) next.reason = 'Give the reason, for the approver'
          setErrors(next)
          if (Object.keys(next).length) return
          try {
            await ask.mutateAsync(undefined)
            alerts.success('New due date sent for approval')
            onClose()
          } catch (error) {
            setErrors(
              formErrors(error, {
                NO_CHANGE: 'due_date',
                INVOICE_PAID: 'due_date',
                REQUEST_PENDING: 'due_date',
              })
            )
          }
        }}
      >
        <FormField id='reschedule-date' label='New due date' required error={errors.due_date}>
          <Input
            id='reschedule-date'
            type='date'
            value={dueDate}
            onChange={(event) => setDueDate(event.target.value)}
          />
        </FormField>
        <FormField id='reschedule-reason' label='Reason' required error={errors.reason}>
          <Textarea
            id='reschedule-reason'
            rows={2}
            maxLength={300}
            value={reason}
            placeholder='Parent asked for time till the salary date'
            aria-invalid={Boolean(errors.reason) || undefined}
            onChange={(event) => setReason(event.target.value)}
          />
        </FormField>
      </form>
    </AppModal>
  )
}

export function WriteOffModal({
  invoice,
  onClose,
}: {
  invoice: FeeInvoiceDetail
  onClose: () => void
}) {
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string>()
  const ask = useFeesMutation(() => feesApi.writeOff(invoice.id, reason.trim()))
  return (
    <AppModal
      open
      onOpenChange={(open) => !open && onClose()}
      title={`Write off ${rupees(invoice.balance)} on ${invoice.invoice_no}?`}
      description='Use this for dues that will not be collected, for example after a TC. Once approved, the balance is added to the discount and the invoice shows as paid. The write-off stays in the audit log.'
      formId='fee-write-off-form'
      submitText='Send for approval'
      cancelText='Keep the dues'
      loading={ask.isPending}
    >
      <form
        id='fee-write-off-form'
        noValidate
        onSubmit={async (event) => {
          event.preventDefault()
          if (reason.trim().length < 3) {
            setError('Give the reason, for the approver')
            return
          }
          setError(undefined)
          try {
            await ask.mutateAsync(undefined)
            alerts.success('Write-off sent for approval')
            onClose()
          } catch (caught) {
            setError(
              formErrors(caught, { INVOICE_PAID: 'reason', REQUEST_PENDING: 'reason' }).reason
            )
          }
        }}
      >
        <FormField id='write-off-reason' label='Reason' required error={error}>
          <Textarea
            id='write-off-reason'
            autoFocus
            rows={3}
            maxLength={200}
            value={reason}
            placeholder='Left the school with a TC; family cannot pay'
            aria-invalid={Boolean(error) || undefined}
            onChange={(event) => setReason(event.target.value)}
          />
        </FormField>
      </form>
    </AppModal>
  )
}
