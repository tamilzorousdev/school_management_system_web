import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { IndianRupee } from 'lucide-react'
import { z } from 'zod'
import { AppModal } from '@/components/common/app-modal'
import { Combobox } from '@/components/common/combobox'
import { DatePicker } from '@/components/common/date-picker'
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
  useHostelMutation,
  useTicket,
  type Priority,
  type TicketChangeInput,
  type TicketChargeInput,
  type TicketDetail,
  type TicketStatus,
} from '../api'
import { MAINTENANCE_CATEGORY, PRIORITY, TICKET_STATUS, toneOptions } from '../labels'
import { UpdateTimeline } from './complaint-parts'
import { FormAlert, InfoNote } from './leave-form-parts'
import { applyApiError, textOrNull } from './leave-helpers'
import { ResidentPicker, StaffPicker } from './pickers'
import { TICKET_NEXT } from './ticket-helpers'

export function TicketDetailSheet({
  ticketId,
  onClose,
}: {
  ticketId: number | null
  onClose: () => void
}) {
  const [shownId, setShownId] = useState(ticketId)
  if (ticketId && ticketId !== shownId) setShownId(ticketId)
  const ticket = useTicket(shownId ?? 0)
  const data = ticket.data

  return (
    <Sheet open={Boolean(ticketId)} onOpenChange={(open) => !open && onClose()}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{data?.title ?? 'Maintenance ticket'}</SheetTitle>
          <SheetDescription>
            {data
              ? `${data.ticket_no} · ${MAINTENANCE_CATEGORY[data.category]} · ${data.hostel_name}`
              : 'Loading'}
          </SheetDescription>
        </SheetHeader>
        <SheetBody>
          {ticket.isError && !data ? (
            <ErrorState message={ticket.error.message} onRetry={() => ticket.refetch()} />
          ) : !data ? (
            <div className='grid gap-3'>
              <Skeleton className='h-20' />
              <Skeleton className='h-40' />
            </div>
          ) : (
            <TicketBody ticket={data} />
          )}
        </SheetBody>
      </SheetContent>
    </Sheet>
  )
}

function TicketBody({ ticket }: { ticket: TicketDetail }) {
  const canMaintain = can(useMe().data, 'hostel.maintenance')
  const [charging, setCharging] = useState(false)
  const status = TICKET_STATUS[ticket.status]
  const final = TICKET_NEXT[ticket.status].length === 0

  return (
    <div className='grid gap-5'>
      <div className='flex flex-wrap items-center gap-2'>
        <Badge tone={status.tone} dot>
          {status.label}
        </Badge>
        <Badge tone={PRIORITY[ticket.priority].tone}>
          {PRIORITY[ticket.priority].label} priority
        </Badge>
        {ticket.overdue && <Badge tone='danger'>Overdue</Badge>}
        {ticket.blocks_room && !final && <Badge tone='warning'>Room closed</Badge>}
        {ticket.charged_fine_id && <Badge tone='info'>Damage charged</Badge>}
      </div>

      {canMaintain && !ticket.charged_fine_id && (
        <Button
          size='sm'
          variant='outline'
          className='justify-self-start'
          onClick={() => setCharging(true)}
        >
          <IndianRupee />
          Charge damage to resident
        </Button>
      )}

      {ticket.description && <p className='text-sm whitespace-pre-wrap'>{ticket.description}</p>}

      <DetailList
        items={[
          {
            label: 'Where',
            value: ticket.room_no
              ? `Room ${ticket.room_no}${ticket.bed_no ? ` · bed ${ticket.bed_no}` : ''}`
              : 'Common area',
          },
          { label: 'Raised by', value: ticket.created_by_name ?? '—' },
          { label: 'Raised', value: formatDateTime(ticket.created_at) },
          { label: 'Due', value: formatDateTime(ticket.due_at) },
          { label: 'Assigned to', value: ticket.assigned_to_name ?? 'Nobody yet' },
          { label: 'Vendor', value: ticket.vendor_name ?? '—' },
          { label: 'Scheduled', value: formatDate(ticket.scheduled_on) },
          { label: 'Cost', value: ticket.cost !== null ? rupees(ticket.cost) : '—' },
          { label: 'Completed', value: formatDateTime(ticket.completed_at) },
          { label: 'From complaint', value: ticket.complaint_id ? 'Yes' : 'No' },
        ]}
      />

      {canMaintain && !final && (
        <TicketUpdateForm key={`${ticket.id}-${ticket.updates.length}`} ticket={ticket} />
      )}

      <div className='grid gap-2'>
        <h3 className='text-sm font-bold'>Timeline</h3>
        <UpdateTimeline updates={ticket.updates} statuses={TICKET_STATUS} />
      </div>

      {charging && <ChargeModal ticket={ticket} onClose={() => setCharging(false)} />}
    </div>
  )
}

function TicketUpdateForm({ ticket }: { ticket: TicketDetail }) {
  const [status, setStatus] = useState<TicketStatus | undefined>()
  const [priority, setPriority] = useState<Priority>(ticket.priority)
  const [assignee, setAssignee] = useState<string | undefined>(
    ticket.assigned_to ? String(ticket.assigned_to) : undefined
  )
  const [vendor, setVendor] = useState(ticket.vendor_name ?? '')
  const [scheduled, setScheduled] = useState(ticket.scheduled_on?.slice(0, 10) ?? '')
  const [cost, setCost] = useState(ticket.cost !== null ? String(ticket.cost) : '')
  const [note, setNote] = useState('')
  const [error, setError] = useState<string | undefined>()
  const change = useHostelMutation((input: TicketChangeInput) =>
    hostelApi.changeTicket(ticket.id, input)
  )

  const save = async () => {
    const input: TicketChangeInput = {}
    if (status) input.status = status
    if (priority !== ticket.priority) input.priority = priority
    const nextAssignee = assignee ? Number(assignee) : null
    if (nextAssignee !== ticket.assigned_to) input.assigned_to = nextAssignee
    if ((textOrNull(vendor) ?? null) !== ticket.vendor_name) input.vendor_name = textOrNull(vendor)
    if (scheduled && scheduled !== ticket.scheduled_on?.slice(0, 10)) input.scheduled_on = scheduled
    const nextCost = cost.trim() === '' ? null : Number(cost)
    if (nextCost !== null && (!Number.isFinite(nextCost) || nextCost < 0)) {
      setError('Enter a cost of 0 or more')
      return
    }
    if (nextCost !== ticket.cost) input.cost = nextCost
    if (note.trim()) input.note = note.trim()
    if (!Object.keys(input).length) {
      alerts.info('Nothing to save')
      return
    }
    setError(undefined)
    try {
      await change.mutateAsync(input)
      alerts.success('Ticket updated', {
        description:
          input.status === 'done' && ticket.blocks_room
            ? 'The room is open again if no other ticket blocks it.'
            : undefined,
      })
    } catch (caught) {
      const apiError = toApiError(caught)
      setError(apiError.fieldErrors[0]?.message ?? apiError.message)
    }
  }

  const nextOptions = TICKET_NEXT[ticket.status].map((value) => ({
    value,
    label: TICKET_STATUS[value].label,
  }))

  return (
    <div className='grid gap-3 rounded-lg border bg-muted/30 p-3'>
      <h3 className='text-sm font-bold'>Update</h3>
      <FormAlert message={error} />
      <div className='grid gap-3 sm:grid-cols-2'>
        <FormField id='ticket-status' label='Move to'>
          <Combobox
            id='ticket-status'
            label='Status'
            value={status}
            allLabel={`Keep ${TICKET_STATUS[ticket.status].label.toLowerCase()}`}
            placeholder='Keep status'
            options={nextOptions}
            highlightSelected={false}
            className='sm:w-full'
            onChange={(value) => setStatus(value as TicketStatus | undefined)}
          />
        </FormField>
        <FormField id='ticket-priority-edit' label='Priority'>
          <Combobox
            id='ticket-priority-edit'
            label='Priority'
            value={priority}
            placeholder='Choose priority'
            options={toneOptions(PRIORITY)}
            highlightSelected={false}
            className='sm:w-full'
            onChange={(value) => setPriority((value ?? ticket.priority) as Priority)}
          />
        </FormField>
        <FormField id='ticket-assignee' label='Assigned to'>
          <StaffPicker
            id='ticket-assignee'
            label='Staff'
            value={assignee}
            initial={
              ticket.assigned_to
                ? { value: String(ticket.assigned_to), label: ticket.assigned_to_name ?? 'Staff' }
                : null
            }
            onChange={(value) => setAssignee(value)}
          />
        </FormField>
        <FormField id='ticket-vendor' label='Vendor'>
          <Input
            id='ticket-vendor'
            maxLength={120}
            autoComplete='off'
            placeholder='Outside electrician or firm'
            value={vendor}
            onChange={(event) => setVendor(event.target.value)}
          />
        </FormField>
        <FormField id='ticket-scheduled' label='Scheduled on'>
          <DatePicker
            id='ticket-scheduled'
            value={scheduled}
            clearable={false}
            onChange={(value: string) => setScheduled(value)}
          />
        </FormField>
        <FormField id='ticket-cost' label='Cost'>
          <Input
            id='ticket-cost'
            type='number'
            min={0}
            step='0.01'
            inputMode='decimal'
            className='tabular'
            value={cost}
            onChange={(event) => setCost(event.target.value)}
          />
        </FormField>
      </div>
      <FormField id='ticket-note' label='Note' hint='Added to the timeline'>
        <Textarea
          id='ticket-note'
          maxLength={500}
          value={note}
          onChange={(event) => setNote(event.target.value)}
        />
      </FormField>
      {status === 'done' && ticket.complaint_id && (
        <InfoNote>Marking it done also resolves the complaint it came from.</InfoNote>
      )}
      <Button
        size='sm'
        className='justify-self-start'
        loading={change.isPending}
        onClick={() => void save()}
      >
        Save update
      </Button>
    </div>
  )
}

const chargeSchema = z.object({
  admission_id: z.string().min(1, 'Choose the resident'),
  amount: z
    .string()
    .refine(
      (value) => Number(value) >= 1 && Number(value) <= 1000000,
      'Enter an amount between 1 and 10,00,000'
    ),
  reason: z.string().trim().min(3, 'Write the reason').max(120, 'Keep it to 120 characters'),
})

type ChargeValues = z.infer<typeof chargeSchema>

const CHARGE_FORM = 'hostel-ticket-charge-form'

function ChargeModal({ ticket, onClose }: { ticket: TicketDetail; onClose: () => void }) {
  const charge = useHostelMutation((input: TicketChargeInput) =>
    hostelApi.chargeTicket(ticket.id, input)
  )
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<ChargeValues>({
    resolver: zodResolver(chargeSchema),
    defaultValues: {
      admission_id: '',
      amount: ticket.cost ? String(ticket.cost) : '',
      reason: `Damage: ${ticket.title}`.slice(0, 120),
    },
  })

  const submit = handleSubmit(async (values) => {
    try {
      await charge.mutateAsync({
        admission_id: Number(values.admission_id),
        amount: Number(values.amount),
        reason: values.reason,
      })
      alerts.success('Damage charge raised', {
        description: 'It waits for fee approval before it is billed.',
      })
      onClose()
    } catch (error) {
      applyApiError(error, setError, ['admission_id', 'amount', 'reason'], {
        HOSTEL_ADMISSION_CLOSED: 'admission_id',
        HOSTEL_ADMISSION_NOT_FOUND: 'admission_id',
        STUDENT_NOT_ENROLLED: 'admission_id',
      })
    }
  })

  return (
    <AppModal
      open
      onOpenChange={(open) => !open && onClose()}
      title='Charge damage to resident'
      description={`${ticket.ticket_no} · ${ticket.title}`}
      formId={CHARGE_FORM}
      submitText='Raise charge'
      loading={charge.isPending}
    >
      <form id={CHARGE_FORM} noValidate onSubmit={submit} className='grid gap-4'>
        <FormAlert message={errors.root?.message} />
        <FormField
          id='charge-resident'
          label='Resident'
          required
          error={errors.admission_id?.message}
        >
          <Controller
            control={control}
            name='admission_id'
            render={({ field }) => (
              <ResidentPicker
                id='charge-resident'
                label='Resident'
                hostelId={ticket.hostel_id}
                value={field.value || undefined}
                invalid={Boolean(errors.admission_id)}
                onChange={(value) => field.onChange(value ?? '')}
              />
            )}
          />
        </FormField>
        <FormField id='charge-amount' label='Amount' required error={errors.amount?.message}>
          <Input
            id='charge-amount'
            type='number'
            min={1}
            step='0.01'
            inputMode='decimal'
            className='tabular'
            aria-invalid={Boolean(errors.amount)}
            {...register('amount')}
          />
        </FormField>
        <FormField id='charge-reason' label='Reason' required error={errors.reason?.message}>
          <Input
            id='charge-reason'
            maxLength={120}
            autoComplete='off'
            aria-invalid={Boolean(errors.reason)}
            {...register('reason')}
          />
        </FormField>
        <InfoNote>
          The charge becomes a fee fine. Someone with fee approval (not you) approves it in Fees,
          then it is billed to the parent. A ticket can be charged once.
        </InfoNote>
      </form>
    </AppModal>
  )
}
