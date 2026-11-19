import { useState } from 'react'
import { Ban, Check, PackageCheck, X } from 'lucide-react'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import { DetailList, ErrorState } from '@/components/common/display'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { alerts } from '@/lib/alerts'
import { toApiError } from '@/lib/api/errors'
import { formatDate, formatDateTime } from '@/lib/format'
import { cn } from '@/lib/utils'
import { inventoryApi, useInventoryMutation, useRequisition, type InventoryAccess } from '../api'
import { qty, REQUISITION_STATUS } from '../labels'
import { DecisionModal } from './decision-modal'
import { ApproveRequisitionModal, IssueRequisitionModal } from './requisition-actions'
import { remaining, requisitionFor } from './stock-form'

export function RequisitionSheet({
  id,
  onClose,
  access,
}: {
  id?: number
  onClose: () => void
  access: InventoryAccess
}) {
  const [shownId, setShownId] = useState(id)
  if (id && id !== shownId) setShownId(id)
  const requisition = useRequisition(shownId ?? null)
  const data = requisition.data
  const [action, setAction] = useState<'approve' | 'reject' | 'issue' | 'cancel' | null>(null)
  const reject = useInventoryMutation((note: string) =>
    inventoryApi.rejectRequisition(data!.id, note)
  )
  const cancel = useInventoryMutation(() => inventoryApi.cancelRequisition(data!.id))

  const canApprove = access.approve && data?.status === 'pending'
  const canIssue = access.stock && (data?.status === 'approved' || data?.status === 'partly_issued')
  const canCancel = access.stock && (data?.status === 'pending' || data?.status === 'approved')

  return (
    <Sheet open={Boolean(id)} onOpenChange={(open) => !open && onClose()}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{data?.requisition_no ?? 'Requisition'}</SheetTitle>
          <SheetDescription>{data ? data.purpose : 'Loading'}</SheetDescription>
        </SheetHeader>
        <SheetBody className='grid content-start gap-5'>
          {requisition.isError ? (
            <ErrorState message={requisition.error.message} onRetry={() => requisition.refetch()} />
          ) : !data ? (
            <div className='grid gap-2'>
              {Array.from({ length: 4 }, (_, index) => (
                <Skeleton key={index} className='h-12' />
              ))}
            </div>
          ) : (
            <>
              <div className='flex flex-wrap items-center gap-2'>
                <Badge tone={REQUISITION_STATUS[data.status].tone} dot>
                  {REQUISITION_STATUS[data.status].label}
                </Badge>
                {data.needed_by && (
                  <span className='text-xs text-muted-foreground'>
                    Needed by {formatDate(data.needed_by)}
                  </span>
                )}
              </div>
              {(canApprove || canIssue || canCancel) && (
                <div className='flex flex-wrap gap-2'>
                  {canApprove && (
                    <>
                      <Button size='sm' onClick={() => setAction('approve')}>
                        <Check />
                        Approve
                      </Button>
                      <Button size='sm' variant='outline' onClick={() => setAction('reject')}>
                        <X />
                        Reject
                      </Button>
                    </>
                  )}
                  {canIssue && (
                    <Button size='sm' onClick={() => setAction('issue')}>
                      <PackageCheck />
                      Issue
                    </Button>
                  )}
                  {canCancel && (
                    <Button
                      size='sm'
                      variant='ghost'
                      className='text-destructive hover:bg-destructive/10'
                      onClick={() => setAction('cancel')}
                    >
                      <Ban />
                      Cancel
                    </Button>
                  )}
                </div>
              )}
              <DetailList
                items={[
                  { label: 'Store', value: data.store.name },
                  { label: 'For', value: requisitionFor(data) },
                  { label: 'Raised by', value: data.raised_by ?? '—' },
                  { label: 'Raised on', value: formatDateTime(data.created_at) },
                  ...(data.decided_by
                    ? [
                        {
                          label: 'Decided by',
                          value: `${data.decided_by} · ${formatDateTime(data.decided_at)}`,
                        },
                      ]
                    : []),
                  ...(data.decision_note ? [{ label: 'Note', value: data.decision_note }] : []),
                  ...(data.issued_at
                    ? [{ label: 'Issued', value: formatDateTime(data.issued_at) }]
                    : []),
                ]}
              />
              <div className='overflow-x-auto rounded-lg border'>
                <table className='w-full min-w-[30rem] text-sm'>
                  <thead className='bg-muted text-left text-xs text-muted-foreground'>
                    <tr>
                      <th className='px-3 py-2 font-semibold'>Item</th>
                      <th className='px-3 py-2 text-right font-semibold'>Asked</th>
                      <th className='px-3 py-2 text-right font-semibold'>Approved</th>
                      <th className='px-3 py-2 text-right font-semibold'>Issued</th>
                      <th className='px-3 py-2 text-right font-semibold'>In store</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.lines.map((line) => (
                      <tr key={line.item.id} className='border-t'>
                        <td className='px-3 py-2 font-semibold'>{line.item.name}</td>
                        <td className='tabular px-3 py-2 text-right'>
                          {qty(line.quantity, line.unit)}
                        </td>
                        <td className='tabular px-3 py-2 text-right'>
                          {qty(line.approved_quantity)}
                        </td>
                        <td className='tabular px-3 py-2 text-right'>
                          {qty(line.issued_quantity)}
                        </td>
                        <td
                          className={cn(
                            'tabular px-3 py-2 text-right',
                            line.available < remaining(line) && 'font-bold text-destructive'
                          )}
                        >
                          {qty(line.available)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </SheetBody>
      </SheetContent>
      <ApproveRequisitionModal
        open={action === 'approve'}
        onOpenChange={(open) => !open && setAction(null)}
        requisition={data ?? null}
      />
      <IssueRequisitionModal
        open={action === 'issue'}
        onOpenChange={(open) => !open && setAction(null)}
        requisition={data ?? null}
      />
      <DecisionModal
        open={action === 'reject'}
        onOpenChange={(open) => !open && setAction(null)}
        mode='reject'
        title={`Reject ${data?.requisition_no ?? 'requisition'}?`}
        description='The requester sees this reason.'
        placeholder='Not needed this term'
        loading={reject.isPending}
        onSubmit={async (note) => {
          await reject.mutateAsync(note ?? '')
          alerts.success('Requisition rejected')
          setAction(null)
        }}
      />
      <ConfirmDialog
        open={action === 'cancel'}
        onOpenChange={(open) => !open && setAction(null)}
        title={`Cancel ${data?.requisition_no ?? 'requisition'}?`}
        description='Nothing has been issued against it yet. It stays in the list as cancelled.'
        confirmText='Cancel requisition'
        destructive
        loading={cancel.isPending}
        onConfirm={async () => {
          try {
            await cancel.mutateAsync(undefined)
            alerts.success('Requisition cancelled')
          } catch (error) {
            alerts.error(toApiError(error).message)
          }
          setAction(null)
        }}
      />
    </Sheet>
  )
}
