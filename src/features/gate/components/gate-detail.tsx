import type { DetailTarget } from '../helpers'
import { PassDetailModal } from './pass-detail-modal'
import { VisitDetailModal } from './visit-detail-modal'

interface GateDetailProps {
  target: DetailTarget | null
  open: boolean
  onOpenChange: (open: boolean) => void
  canManage: boolean
  canApprove: boolean
}

export function GateDetail({ target, open, onOpenChange, canManage, canApprove }: GateDetailProps) {
  return (
    <>
      <PassDetailModal
        passId={target?.kind === 'pass' ? target.id : undefined}
        open={open && target?.kind === 'pass'}
        onOpenChange={onOpenChange}
        canManage={canManage}
        canApprove={canApprove}
      />
      <VisitDetailModal
        visitId={target?.kind === 'visit' ? target.id : undefined}
        open={open && target?.kind === 'visit'}
        onOpenChange={onOpenChange}
        canManage={canManage}
      />
    </>
  )
}
