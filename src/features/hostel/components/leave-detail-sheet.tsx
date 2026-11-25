import { useState } from 'react'
import { Ban, Check, LogIn, LogOut, X } from 'lucide-react'
import { CopyButton, DetailList } from '@/components/common/display'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { can, useMe } from '@/features/auth/api'
import { alerts } from '@/lib/alerts'
import { toApiError } from '@/lib/api/errors'
import { formatDate, formatDateTime } from '@/lib/format'
import { hostelApi, useHostelMutation, type Leave, type LeaveDecision } from '../api'
import { LEAVE_KIND, LEAVE_SOURCE, LEAVE_STATUS } from '../labels'
import { NoteModal, StudentCell } from './leave-form-parts'
import { CONSENT_STATUS, timeLabel } from './leave-helpers'

const DECISION: Record<
  LeaveDecision,
  { title: string; submit: string; done: string; description: string }
> = {
  approve: {
    title: 'Approve leave',
    submit: 'Approve',
    done: 'Leave approved',
    description: 'Parents are told. A home leave also marks school attendance as leave.',
  },
  reject: {
    title: 'Reject leave',
    submit: 'Reject',
    done: 'Leave rejected',
    description: 'Parents are told the leave was not allowed.',
  },
  cancel: {
    title: 'Cancel leave',
    submit: 'Cancel leave',
    done: 'Leave cancelled',
    description: 'The pass stops working and any school leave for these dates is cancelled.',
  },
}

export function LeaveDetailSheet({
  leave,
  onClose,
  onChanged,
}: {
  leave: Leave | null
  onClose: () => void
  onChanged: (leave: Leave) => void
}) {
  const [shown, setShown] = useState(leave)
  if (leave && leave !== shown) setShown(leave)

  return (
    <Sheet open={Boolean(leave)} onOpenChange={(open) => !open && onClose()}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{shown?.student.name ?? 'Leave'}</SheetTitle>
          <SheetDescription>
            {shown ? `${shown.leave_no} · ${LEAVE_KIND[shown.kind]} · ${shown.hostel_name}` : ''}
          </SheetDescription>
        </SheetHeader>
        <SheetBody>{shown && <LeaveBody leave={shown} onChanged={onChanged} />}</SheetBody>
      </SheetContent>
    </Sheet>
  )
}

function LeaveBody({ leave, onChanged }: { leave: Leave; onChanged: (leave: Leave) => void }) {
  const me = useMe().data
  const canApprove = can(me, 'hostel.leave_approve')
  const canOperate = can(me, 'hostel.pass_operate')
  const [decision, setDecision] = useState<LeaveDecision | null>(null)
  const decide = useHostelMutation((input: { action: LeaveDecision; note: string | null }) =>
    hostelApi.decideLeave(leave.id, input.action, input.note)
  )
  const gate = useHostelMutation((direction: 'out' | 'in') =>
    direction === 'out' ? hostelApi.passOut(leave.id) : hostelApi.passIn(leave.id)
  )

  const move = async (direction: 'out' | 'in') => {
    try {
      const result = await gate.mutateAsync(direction)
      onChanged(result)
      alerts.success(direction === 'out' ? 'Marked out' : 'Marked back in', {
        description:
          direction === 'in' && result.late_minutes
            ? `${result.late_minutes} minutes late`
            : 'Parents are told.',
      })
    } catch (error) {
      alerts.error(toApiError(error).message)
    }
  }

  const status = LEAVE_STATUS[leave.status]
  const outing = leave.kind === 'outing'
  const canDecide = {
    approve: leave.status === 'pending',
    reject: leave.status === 'pending' || leave.status === 'awaiting_parent',
    cancel: ['awaiting_parent', 'pending', 'approved'].includes(leave.status),
  }
  const hasPass = leave.status === 'approved' || leave.status === 'out'

  return (
    <div className='grid gap-5'>
      <div className='flex flex-wrap items-center gap-2'>
        <Badge tone={status.tone} dot>
          {status.label}
        </Badge>
        {leave.overdue && <Badge tone='danger'>Overdue</Badge>}
        {leave.late_minutes ? <Badge tone='warning'>{leave.late_minutes} min late</Badge> : null}
      </div>

      <div className='flex flex-wrap gap-2'>
        {canOperate && leave.status === 'approved' && (
          <Button size='sm' loading={gate.isPending} onClick={() => void move('out')}>
            <LogOut />
            Mark out
          </Button>
        )}
        {canOperate && leave.status === 'out' && (
          <Button size='sm' loading={gate.isPending} onClick={() => void move('in')}>
            <LogIn />
            Mark back in
          </Button>
        )}
        {canApprove && canDecide.approve && (
          <Button size='sm' onClick={() => setDecision('approve')}>
            <Check />
            Approve
          </Button>
        )}
        {canApprove && canDecide.reject && (
          <Button size='sm' variant='outline' onClick={() => setDecision('reject')}>
            <X />
            Reject
          </Button>
        )}
        {canApprove && canDecide.cancel && (
          <Button size='sm' variant='outline' onClick={() => setDecision('cancel')}>
            <Ban />
            Cancel
          </Button>
        )}
      </div>

      {hasPass && (
        <div className='grid gap-1 rounded-lg border border-primary/30 bg-primary/5 p-4 text-center'>
          <span className='text-[11px] font-bold tracking-wider text-muted-foreground uppercase'>
            Pass number
          </span>
          <span className='font-mono text-2xl font-extrabold tracking-wide'>{leave.leave_no}</span>
          <span className='text-xs text-muted-foreground'>
            Type this number at the gate, or scan the QR in the Parent app.
          </span>
          {leave.qr_token && (
            <div className='flex justify-center'>
              <CopyButton value={leave.qr_token} label='Copy QR text' />
            </div>
          )}
        </div>
      )}

      <div className='rounded-lg border p-3'>
        <StudentCell student={leave.student} extra={leave.bed ?? 'No bed'} />
      </div>

      <DetailList
        items={[
          { label: 'Kind', value: LEAVE_KIND[leave.kind] },
          { label: 'Asked by', value: LEAVE_SOURCE[leave.source] },
          {
            label: outing ? 'Date' : 'Dates',
            value: outing
              ? formatDate(leave.from_date)
              : `${formatDate(leave.from_date)} – ${formatDate(leave.to_date)}`,
          },
          {
            label: 'Times',
            value:
              [timeLabel(leave.depart_time), timeLabel(leave.return_time)]
                .filter(Boolean)
                .join(' – ') || '—',
          },
          { label: 'Expected back', value: formatDateTime(leave.expected_return_at) },
          {
            label: 'Parent consent',
            value: (
              <Badge tone={CONSENT_STATUS[leave.consent_status].tone}>
                {CONSENT_STATUS[leave.consent_status].label}
              </Badge>
            ),
          },
          { label: 'Left', value: formatDateTime(leave.departed_at) },
          { label: 'Came back', value: formatDateTime(leave.returned_at) },
          {
            label: 'Escort',
            value: leave.escort_name
              ? [
                  leave.escort_name,
                  leave.escort_relation,
                  leave.escort_mobile && `+91 ${leave.escort_mobile}`,
                ]
                  .filter(Boolean)
                  .join(' · ')
              : '—',
          },
          { label: 'Recorded', value: formatDateTime(leave.created_at) },
          { label: 'Decided by', value: leave.decided_by_name ?? '—' },
          { label: 'Decision note', value: leave.decision_note ?? '—' },
        ]}
      />

      <div className='grid gap-1'>
        <h3 className='text-[11px] font-bold tracking-wider text-muted-foreground uppercase'>
          Reason
        </h3>
        <p className='text-sm whitespace-pre-wrap'>{leave.reason}</p>
      </div>

      {decision && (
        <NoteModal
          title={DECISION[decision].title}
          description={`${leave.student.name} · ${leave.leave_no}. ${DECISION[decision].description}`}
          submitText={DECISION[decision].submit}
          maxLength={255}
          onClose={() => setDecision(null)}
          onSubmit={async (note) => {
            const result = await decide.mutateAsync({ action: decision, note })
            onChanged(result)
            alerts.success(DECISION[decision].done)
          }}
        />
      )}
    </div>
  )
}
