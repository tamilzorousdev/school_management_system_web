import { useState } from 'react'
import { Ban, Check, LogOut, X } from 'lucide-react'
import { AppModal } from '@/components/common/app-modal'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import { DetailList, ErrorState } from '@/components/common/display'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDate, formatDateTime, formatNumber } from '@/lib/format'
import { gateApi, useGateMutation, useGateVisit, type Visit } from '../api'
import { runAction } from '../helpers'
import { CHECK_METHOD, ID_PROOF, VISIT_PURPOSE, timeWindow } from '../labels'
import { DecisionDialog } from './decision-dialog'
import { PersonCell, StudentCell, Timeline, VisitBadges, VisitStatusBadge } from './shared'

interface VisitDetailModalProps {
  visitId?: number
  open: boolean
  onOpenChange: (open: boolean) => void
  canManage: boolean
}

type Confirm = 'out' | 'cancel' | null

export function VisitDetailModal({
  visitId,
  open,
  onOpenChange,
  canManage,
}: VisitDetailModalProps) {
  const query = useGateVisit(visitId)
  const visit = query.data
  const [decision, setDecision] = useState<boolean | null>(null)
  const [confirm, setConfirm] = useState<Confirm>(null)
  const decide = useGateMutation(({ allow, note }: { allow: boolean; note: string }) =>
    gateApi.decideVisit(visitId!, allow, note)
  )
  const act = useGateMutation((kind: 'out' | 'cancel') =>
    kind === 'out' ? gateApi.checkOut(visitId!) : gateApi.cancelVisit(visitId!)
  )

  return (
    <>
      <AppModal
        open={open}
        onOpenChange={onOpenChange}
        title={visit ? `Visitor ${visit.visit_no}` : 'Visitor'}
        description={visit ? `${visit.name} · ${formatDate(visit.visit_date)}` : undefined}
        size='lg'
        footer={
          <div className='flex flex-wrap justify-end gap-2'>
            {canManage && visit?.status === 'inside' && (
              <Button onClick={() => setConfirm('out')}>
                <LogOut />
                Check out
              </Button>
            )}
            {canManage && (visit?.status === 'expected' || visit?.status === 'waiting') && (
              <Button variant='outline' onClick={() => setConfirm('cancel')}>
                <Ban />
                Cancel visit
              </Button>
            )}
            {canManage && visit?.status === 'waiting' && (
              <>
                <Button variant='destructive' onClick={() => setDecision(false)}>
                  <X />
                  Decline
                </Button>
                <Button onClick={() => setDecision(true)}>
                  <Check />
                  Allow
                </Button>
              </>
            )}
            <Button variant='outline' onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        }
      >
        {query.isPending ? (
          <div className='grid gap-3'>
            <Skeleton className='h-16' />
            <Skeleton className='h-40' />
          </div>
        ) : query.isError ? (
          <ErrorState message={query.error.message} onRetry={() => query.refetch()} />
        ) : (
          <VisitBody visit={query.data} />
        )}
      </AppModal>
      <DecisionDialog
        open={decision !== null}
        onOpenChange={(next) => !next && setDecision(null)}
        yes={decision === true}
        title={decision ? 'Let this visitor in?' : 'Decline this visitor?'}
        description={visit ? `${visit.name} · ${VISIT_PURPOSE[visit.purpose]}` : ''}
        confirmText={decision ? 'Allow' : 'Decline'}
        successText={decision ? 'Visitor allowed' : 'Visitor declined'}
        onDecide={(note) => decide.mutateAsync({ allow: decision === true, note })}
      />
      <ConfirmDialog
        open={confirm !== null}
        onOpenChange={(next) => !next && setConfirm(null)}
        title={confirm === 'out' ? 'Check this visitor out?' : 'Cancel this visit?'}
        description={
          confirm === 'out'
            ? 'Use this when the visitor left without the gate checking them out.'
            : 'The slip number and code stop working at the gate.'
        }
        confirmText={confirm === 'out' ? 'Check out' : 'Cancel visit'}
        destructive={confirm === 'cancel'}
        loading={act.isPending}
        onConfirm={async () => {
          if (!confirm) return
          const done = await runAction(
            () => act.mutateAsync(confirm),
            confirm === 'out' ? 'Visitor checked out' : 'Visit cancelled'
          )
          if (done) setConfirm(null)
        }}
      />
    </>
  )
}

function VisitBody({ visit }: { visit: Visit }) {
  const showCodes =
    Boolean(visit.code) && (visit.status === 'expected' || visit.status === 'allowed')
  return (
    <div className='grid min-w-0 gap-4'>
      <div className='flex flex-wrap items-center gap-2'>
        <VisitStatusBadge visit={visit} />
        <VisitBadges visit={visit} />
      </div>
      {visit.blocked && (
        <p className='rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive'>
          This visitor matches the blocked list. The gate and the office were warned.
        </p>
      )}
      <div className='grid gap-3 sm:grid-cols-2'>
        <div className='grid gap-2 rounded-lg border p-3'>
          <span className='text-[11px] font-bold tracking-wider text-muted-foreground uppercase'>
            Visitor
          </span>
          <PersonCell
            person={{
              name: visit.name,
              relation: visit.company,
              mobile: visit.mobile,
              photo: visit.photo,
            }}
          />
        </div>
        {visit.student ? (
          <div className='grid gap-2 rounded-lg border p-3'>
            <span className='text-[11px] font-bold tracking-wider text-muted-foreground uppercase'>
              About the student
            </span>
            <StudentCell student={visit.student} />
          </div>
        ) : null}
      </div>
      {showCodes && (
        <div className='grid gap-3 rounded-lg border bg-muted/40 p-3 sm:grid-cols-2'>
          <div className='grid gap-0.5'>
            <span className='text-[11px] font-bold tracking-wider text-muted-foreground uppercase'>
              Slip number
            </span>
            <span className='font-mono text-2xl font-bold tracking-wide'>{visit.visit_no}</span>
          </div>
          <div className='grid gap-0.5'>
            <span className='text-[11px] font-bold tracking-wider text-muted-foreground uppercase'>
              Gate code
            </span>
            <span className='font-mono text-2xl font-bold tracking-[0.3em]'>{visit.code}</span>
          </div>
        </div>
      )}
      <DetailList
        items={[
          {
            label: 'Purpose',
            value: [VISIT_PURPOSE[visit.purpose], visit.purpose_note].filter(Boolean).join(' · '),
          },
          { label: 'To meet', value: visit.host?.name ?? 'The office decides' },
          { label: 'Expected', value: timeWindow(visit.expected_from, visit.expected_until) },
          {
            label: 'People',
            value: `${formatNumber(visit.people_count)}${visit.vehicle_no ? ` · ${visit.vehicle_no}` : ''}`,
          },
          ...(visit.invited_by ? [{ label: 'Invited by', value: visit.invited_by.name }] : []),
          ...(visit.decided_by
            ? [
                {
                  label: 'Answered by',
                  value: `${visit.decided_by.name}${visit.decision_note ? ` · ${visit.decision_note}` : ''}`,
                },
              ]
            : []),
          ...(visit.checked_in_at
            ? [
                {
                  label: 'Came in',
                  value: `${formatDateTime(visit.checked_in_at)}${visit.check_in_method ? ` · ${CHECK_METHOD[visit.check_in_method].label}` : ''}`,
                },
              ]
            : []),
          ...(visit.checked_out_at
            ? [
                {
                  label: 'Left',
                  value: `${formatDateTime(visit.checked_out_at)}${visit.check_out_method ? ` · ${CHECK_METHOD[visit.check_out_method]?.label ?? visit.check_out_method}` : ''}`,
                },
              ]
            : []),
          ...(visit.id_proof_kind || visit.id_proof_last4
            ? [
                {
                  label: 'ID seen at the gate',
                  value: `${visit.id_proof_kind ? ID_PROOF[visit.id_proof_kind] : 'ID'} ending ${visit.id_proof_last4 ?? '—'}`,
                },
              ]
            : []),
        ]}
      />
      <div className='grid gap-2'>
        <h3 className='text-sm font-semibold'>Timeline</h3>
        <Timeline visitId={visit.id} />
      </div>
    </div>
  )
}
