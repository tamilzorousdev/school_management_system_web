import { useState } from 'react'
import { Ban, Check, ImageIcon, Printer, X } from 'lucide-react'
import { AppModal } from '@/components/common/app-modal'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import { DetailList, ErrorState } from '@/components/common/display'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useMe } from '@/features/auth/api'
import { openStoredFile } from '@/features/maintenance/helpers'
import { formatDate, formatDateTime } from '@/lib/format'
import { gateApi, useGateMutation, useGatePass, type GatePass } from '../api'
import { runAction } from '../helpers'
import { ID_PROOF, PASS_SOURCE, PICKUP_KIND } from '../labels'
import { printGatePass } from '../print-gate-pass'
import { DecisionDialog } from './decision-dialog'
import { PassBadges, PassStatusBadge, PersonCell, StudentCell, Timeline } from './shared'

interface PassDetailModalProps {
  passId?: number
  open: boolean
  onOpenChange: (open: boolean) => void
  canManage: boolean
  canApprove: boolean
}

export function PassDetailModal({
  passId,
  open,
  onOpenChange,
  canManage,
  canApprove,
}: PassDetailModalProps) {
  const query = useGatePass(passId)
  const pass = query.data
  const school = useMe().data?.school ?? null
  const [decision, setDecision] = useState<boolean | null>(null)
  const [cancelling, setCancelling] = useState(false)
  const decide = useGateMutation(({ approve, note }: { approve: boolean; note: string }) =>
    gateApi.decidePass(passId!, approve, note)
  )
  const cancel = useGateMutation(() => gateApi.cancelPass(passId!))

  const waitingConsent = Boolean(pass?.needs_consent && pass.consent_status === 'waiting')
  const decidable = canApprove && pass?.status === 'pending'
  const cancellable = canManage && (pass?.status === 'pending' || pass?.status === 'approved')

  return (
    <>
      <AppModal
        open={open}
        onOpenChange={onOpenChange}
        title={pass ? `Gate pass ${pass.pass_no}` : 'Gate pass'}
        description={pass ? `${pass.student.name} · ${formatDate(pass.pass_date)}` : undefined}
        size='lg'
        footer={
          <div className='flex flex-wrap justify-end gap-2'>
            {pass?.status === 'approved' && (
              <Button variant='outline' onClick={() => printGatePass(pass, school)}>
                <Printer />
                Print slip
              </Button>
            )}
            {cancellable && (
              <Button variant='outline' onClick={() => setCancelling(true)}>
                <Ban />
                Cancel pass
              </Button>
            )}
            {decidable && (
              <>
                <Button variant='destructive' onClick={() => setDecision(false)}>
                  <X />
                  Reject
                </Button>
                <Button
                  onClick={() => setDecision(true)}
                  disabled={waitingConsent}
                  title={waitingConsent ? 'The parent must agree first' : undefined}
                >
                  <Check />
                  Approve
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
          <PassBody pass={query.data} />
        )}
      </AppModal>
      <DecisionDialog
        open={decision !== null}
        onOpenChange={(next) => !next && setDecision(null)}
        yes={decision === true}
        title={decision ? 'Approve this gate pass?' : 'Reject this gate pass?'}
        description={
          pass
            ? `${pass.student.name} leaves with ${pass.pickup.name}, ${pass.from_time} – ${pass.until_time}. The parent is told at once.`
            : ''
        }
        confirmText={decision ? 'Approve' : 'Reject'}
        successText={decision ? 'Gate pass approved' : 'Gate pass rejected'}
        onDecide={(note) => decide.mutateAsync({ approve: decision === true, note })}
      />
      <ConfirmDialog
        open={cancelling}
        onOpenChange={setCancelling}
        title='Cancel this gate pass?'
        description='The QR and code stop working at the gate and the parent is told.'
        confirmText='Cancel pass'
        destructive
        loading={cancel.isPending}
        onConfirm={async () => {
          if (await runAction(() => cancel.mutateAsync(undefined), 'Gate pass cancelled'))
            setCancelling(false)
        }}
      />
    </>
  )
}

function PassBody({ pass }: { pass: GatePass }) {
  const showCodes = pass.status === 'approved' && (pass.code || pass.qr_token)
  return (
    <div className='grid min-w-0 gap-4'>
      <div className='flex flex-wrap items-center gap-2'>
        <PassStatusBadge pass={pass} />
        <PassBadges pass={pass} />
      </div>
      {pass.needs_consent && pass.consent_status === 'waiting' && (
        <p className='rounded-md border border-warning/30 bg-warning/10 px-3 py-2 text-sm font-medium text-warning'>
          The person at the gate is not registered. The parent must agree in the app before this
          pass can be approved.
        </p>
      )}
      <div className='grid gap-3 sm:grid-cols-2'>
        <div className='grid gap-2 rounded-lg border p-3'>
          <span className='text-[11px] font-bold tracking-wider text-muted-foreground uppercase'>
            Student
          </span>
          <StudentCell student={pass.student} />
        </div>
        <div className='grid gap-2 rounded-lg border p-3'>
          <span className='text-[11px] font-bold tracking-wider text-muted-foreground uppercase'>
            Picked up by · {PICKUP_KIND[pass.pickup.kind]}
          </span>
          <PersonCell person={pass.pickup} />
        </div>
      </div>
      {showCodes && (
        <div className='grid gap-3 rounded-lg border bg-muted/40 p-3 sm:grid-cols-2'>
          <div className='grid gap-0.5'>
            <span className='text-[11px] font-bold tracking-wider text-muted-foreground uppercase'>
              Pass number
            </span>
            <span className='font-mono text-2xl font-bold tracking-wide'>{pass.pass_no}</span>
          </div>
          <div className='grid gap-0.5'>
            <span className='text-[11px] font-bold tracking-wider text-muted-foreground uppercase'>
              Gate code
            </span>
            <span className='font-mono text-2xl font-bold tracking-[0.3em]'>
              {pass.code ?? '—'}
            </span>
          </div>
          <p className='text-xs text-muted-foreground sm:col-span-2'>
            The parent has the QR in the app. The guard can also type the pass number and this code.
          </p>
        </div>
      )}
      <DetailList
        items={[
          { label: 'Date', value: formatDate(pass.pass_date) },
          { label: 'Leave between', value: `${pass.from_time} – ${pass.until_time}` },
          { label: 'Reason', value: pass.reason },
          {
            label: 'Requested',
            value: `${PASS_SOURCE[pass.source]}${pass.requested_by ? ` · ${pass.requested_by.name}` : ''} · ${formatDateTime(pass.created_at)}`,
          },
          ...(pass.decided_by || pass.decided_at
            ? [
                {
                  label: pass.status === 'rejected' ? 'Rejected by' : 'Decided by',
                  value: `${pass.decided_by?.name ?? '—'} · ${formatDateTime(pass.decided_at)}`,
                },
              ]
            : []),
          ...(pass.decision_note ? [{ label: 'Note', value: pass.decision_note }] : []),
          ...(pass.released_at
            ? [
                {
                  label: 'Released',
                  value: `${formatDateTime(pass.released_at)}${pass.released_by ? ` · ${pass.released_by.name}` : ''}`,
                },
              ]
            : []),
          ...(pass.id_proof_kind || pass.id_proof_last4
            ? [
                {
                  label: 'ID seen at the gate',
                  value: `${pass.id_proof_kind ? ID_PROOF[pass.id_proof_kind] : 'ID'} ending ${pass.id_proof_last4 ?? '—'}`,
                },
              ]
            : []),
          ...(pass.release_photo
            ? [
                {
                  label: 'Photo at the gate',
                  value: (
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() => openStoredFile(pass.release_photo)}
                    >
                      <ImageIcon />
                      Open photo
                    </Button>
                  ),
                },
              ]
            : []),
        ]}
      />
      <div className='grid gap-2'>
        <h3 className='text-sm font-semibold'>Timeline</h3>
        <Timeline passId={pass.id} />
      </div>
    </div>
  )
}
