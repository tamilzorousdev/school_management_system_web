import { useState } from 'react'
import { Wrench } from 'lucide-react'
import { Combobox } from '@/components/common/combobox'
import { DetailList, ErrorState } from '@/components/common/display'
import { FormField } from '@/components/common/form-field'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/input'
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
import { alerts } from '@/lib/alerts'
import { toApiError } from '@/lib/api/errors'
import { formatDateTime } from '@/lib/format'
import {
  hostelApi,
  useComplaint,
  useHostelMutation,
  type ComplaintAction,
  type ComplaintDetail,
  type ComplaintPatchInput,
  type Priority,
  type TicketInput,
} from '../api'
import { COMPLAINT_CATEGORY, COMPLAINT_STATUS, PRIORITY, toneOptions } from '../labels'
import { RatingStars, UpdateTimeline } from './complaint-parts'
import { InfoNote, NoteModal, StudentCell } from './leave-form-parts'
import { StaffPicker } from './pickers'
import { COMPLAINT_ACTION, COMPLAINT_NEXT, maintenanceCategoryFor } from './ticket-helpers'
import { TicketFormModal } from './ticket-form-modal'

export function ComplaintDetailSheet({
  complaintId,
  onClose,
  onOpenTicket,
}: {
  complaintId: number | null
  onClose: () => void
  onOpenTicket: (ticketId: number) => void
}) {
  const [shownId, setShownId] = useState(complaintId)
  if (complaintId && complaintId !== shownId) setShownId(complaintId)
  const complaint = useComplaint(shownId ?? 0)
  const data = complaint.data

  return (
    <Sheet open={Boolean(complaintId)} onOpenChange={(open) => !open && onClose()}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{data?.title ?? 'Complaint'}</SheetTitle>
          <SheetDescription>
            {data
              ? `${data.complaint_no} · ${COMPLAINT_CATEGORY[data.category]} · ${data.hostel_name}`
              : 'Loading'}
          </SheetDescription>
        </SheetHeader>
        <SheetBody>
          {complaint.isError && !data ? (
            <ErrorState message={complaint.error.message} onRetry={() => complaint.refetch()} />
          ) : !data ? (
            <div className='grid gap-3'>
              <Skeleton className='h-20' />
              <Skeleton className='h-40' />
            </div>
          ) : (
            <ComplaintBody complaint={data} onOpenTicket={onOpenTicket} />
          )}
        </SheetBody>
      </SheetContent>
    </Sheet>
  )
}

function ComplaintBody({
  complaint,
  onOpenTicket,
}: {
  complaint: ComplaintDetail
  onOpenTicket: (ticketId: number) => void
}) {
  const me = useMe().data
  const canHandle = can(me, 'hostel.complaint')
  const canMaintain = can(me, 'hostel.maintenance')
  const [action, setAction] = useState<ComplaintAction | null>(null)
  const [ticketing, setTicketing] = useState(false)
  const act = useHostelMutation((input: { action: ComplaintAction; note: string | null }) =>
    hostelApi.actOnComplaint(complaint.id, input.action, input.note)
  )
  const status = COMPLAINT_STATUS[complaint.status]
  const live = complaint.status === 'open' || complaint.status === 'in_progress'
  const actions = canHandle ? COMPLAINT_NEXT[complaint.status] : []

  return (
    <div className='grid gap-5'>
      <div className='flex flex-wrap items-center gap-2'>
        <Badge tone={status.tone} dot>
          {status.label}
        </Badge>
        <Badge tone={PRIORITY[complaint.priority].tone}>
          {PRIORITY[complaint.priority].label} priority
        </Badge>
        {complaint.overdue && <Badge tone='danger'>Overdue</Badge>}
        <Badge tone='neutral'>
          {complaint.raised_by_role === 'parent' ? 'From a parent' : 'From staff'}
        </Badge>
      </div>

      {(actions.length > 0 || (canMaintain && live && !complaint.maintenance_ticket_id)) && (
        <div className='flex flex-wrap gap-2'>
          {actions.map((key) => (
            <Button
              key={key}
              size='sm'
              variant={key === 'resolve' || key === 'start' ? 'default' : 'outline'}
              onClick={() => setAction(key)}
            >
              {COMPLAINT_ACTION[key].label}
            </Button>
          ))}
          {canMaintain && live && !complaint.maintenance_ticket_id && (
            <Button size='sm' variant='outline' onClick={() => setTicketing(true)}>
              <Wrench />
              Make maintenance ticket
            </Button>
          )}
        </div>
      )}

      {complaint.maintenance_ticket_id && (
        <InfoNote icon={Wrench}>
          A maintenance ticket is open for this. Finishing it resolves the complaint.{' '}
          <button
            type='button'
            className='font-semibold text-primary hover:underline'
            onClick={() => onOpenTicket(complaint.maintenance_ticket_id as number)}
          >
            Open the ticket
          </button>
        </InfoNote>
      )}

      <p className='text-sm whitespace-pre-wrap'>{complaint.description}</p>

      {complaint.student && (
        <div className='rounded-lg border p-3'>
          <StudentCell student={complaint.student} />
        </div>
      )}

      <DetailList
        items={[
          { label: 'Room', value: complaint.room_no ?? 'Whole hostel' },
          { label: 'Raised by', value: complaint.raised_by_name ?? '—' },
          { label: 'Raised', value: formatDateTime(complaint.created_at) },
          { label: 'Due', value: formatDateTime(complaint.due_at) },
          { label: 'Assigned to', value: complaint.assigned_to_name ?? 'Nobody yet' },
          { label: 'Resolved', value: formatDateTime(complaint.resolved_at) },
          ...(complaint.resolution ? [{ label: 'Resolution', value: complaint.resolution }] : []),
          ...(complaint.rating
            ? [
                {
                  label: 'Parent rating',
                  value: (
                    <span className='grid gap-1'>
                      <RatingStars rating={complaint.rating} />
                      {complaint.rating_comment && (
                        <span className='font-normal'>{complaint.rating_comment}</span>
                      )}
                    </span>
                  ),
                },
              ]
            : []),
        ]}
      />

      {canHandle && live && (
        <ComplaintManageForm
          key={`${complaint.id}-${complaint.updates.length}`}
          complaint={complaint}
        />
      )}

      <div className='grid gap-2'>
        <h3 className='text-sm font-bold'>Timeline</h3>
        <UpdateTimeline updates={complaint.updates} statuses={COMPLAINT_STATUS} />
      </div>

      {action && (
        <NoteModal
          title={COMPLAINT_ACTION[action].title}
          description={`${complaint.complaint_no}. ${COMPLAINT_ACTION[action].description}`}
          label={action === 'resolve' ? 'What was done' : action === 'reject' ? 'Reason' : 'Note'}
          required={COMPLAINT_ACTION[action].needsNote}
          submitText={COMPLAINT_ACTION[action].label}
          onClose={() => setAction(null)}
          onSubmit={async (note) => {
            await act.mutateAsync({ action, note })
            alerts.success(COMPLAINT_ACTION[action].done)
          }}
        />
      )}

      {ticketing && (
        <TicketFormModal
          title='Make maintenance ticket'
          description={`From ${complaint.complaint_no} · ${complaint.room_no ? `room ${complaint.room_no}` : complaint.hostel_name}`}
          submitText='Raise ticket'
          lockPlace
          defaults={{
            hostel_id: complaint.hostel_id,
            room_id: complaint.room_id,
            title: complaint.title,
            description: complaint.description,
            priority: complaint.priority,
            category: maintenanceCategoryFor(complaint.category),
          }}
          onSubmit={(input: TicketInput) => hostelApi.complaintToTicket(complaint.id, input)}
          onClose={() => setTicketing(false)}
        />
      )}
    </div>
  )
}

function ComplaintManageForm({ complaint }: { complaint: ComplaintDetail }) {
  const [assignee, setAssignee] = useState<string | undefined>(
    complaint.assigned_to ? String(complaint.assigned_to) : undefined
  )
  const [priority, setPriority] = useState<Priority>(complaint.priority)
  const [note, setNote] = useState('')
  const patch = useHostelMutation((input: ComplaintPatchInput) =>
    hostelApi.patchComplaint(complaint.id, input)
  )

  const save = async () => {
    const input: ComplaintPatchInput = {}
    const nextAssignee = assignee ? Number(assignee) : null
    if (nextAssignee !== complaint.assigned_to) input.assigned_to = nextAssignee
    if (priority !== complaint.priority) input.priority = priority
    if (note.trim()) input.note = note.trim()
    if (!Object.keys(input).length) {
      alerts.info('Nothing to save')
      return
    }
    try {
      await patch.mutateAsync(input)
      alerts.success('Complaint updated', {
        description: input.assigned_to ? 'The staff member is told.' : undefined,
      })
    } catch (error) {
      alerts.error(toApiError(error).message)
    }
  }

  return (
    <div className='grid gap-3 rounded-lg border bg-muted/30 p-3'>
      <h3 className='text-sm font-bold'>Assign and update</h3>
      <div className='grid gap-3 sm:grid-cols-2'>
        <FormField id='complaint-assignee' label='Assigned to'>
          <StaffPicker
            id='complaint-assignee'
            label='Staff'
            value={assignee}
            initial={
              complaint.assigned_to
                ? {
                    value: String(complaint.assigned_to),
                    label: complaint.assigned_to_name ?? 'Staff',
                  }
                : null
            }
            onChange={(value) => setAssignee(value)}
          />
        </FormField>
        <FormField id='complaint-priority-edit' label='Priority'>
          <Combobox
            id='complaint-priority-edit'
            label='Priority'
            value={priority}
            placeholder='Choose priority'
            options={toneOptions(PRIORITY)}
            highlightSelected={false}
            className='sm:w-full'
            onChange={(value) => setPriority((value ?? complaint.priority) as Priority)}
          />
        </FormField>
      </div>
      <FormField id='complaint-note' label='Note' hint='Added to the timeline'>
        <Textarea
          id='complaint-note'
          maxLength={500}
          value={note}
          onChange={(event) => setNote(event.target.value)}
        />
      </FormField>
      <Button
        size='sm'
        className='justify-self-start'
        loading={patch.isPending}
        onClick={() => void save()}
      >
        Save
      </Button>
    </div>
  )
}
