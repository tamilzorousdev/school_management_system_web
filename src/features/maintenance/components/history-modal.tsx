import { History } from 'lucide-react'
import { AppModal } from '@/components/common/app-modal'
import { EmptyState, ErrorState } from '@/components/common/display'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDateTime } from '@/lib/format'
import { useChanges, type ChangeEntity } from '../api'

const ACTION_LABEL: Record<string, string> = {
  update: 'Edited',
  delete: 'Deleted',
  approve: 'Approved',
  reject: 'Rejected',
  reimburse: 'Paid back',
  lock: 'Month lock',
}

interface HistoryModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  entity: ChangeEntity
  entityId?: number
  title: string
}

export function HistoryModal({ open, onOpenChange, entity, entityId, title }: HistoryModalProps) {
  const changes = useChanges(
    { page: 1, limit: 50, entity, entity_id: entityId },
    open && (entity === 'settings' || Boolean(entityId))
  )
  const rows = changes.data?.items ?? []

  return (
    <AppModal
      open={open}
      onOpenChange={onOpenChange}
      title='Change history'
      description={title}
      footer={
        <div className='flex justify-end'>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      }
    >
      {changes.isPending ? (
        <div className='grid gap-2'>
          <Skeleton className='h-14' />
          <Skeleton className='h-14' />
        </div>
      ) : changes.isError ? (
        <ErrorState message={changes.error.message} onRetry={() => changes.refetch()} />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={History}
          title='No changes yet'
          description='Edits, approvals and deletes are listed here with who made them.'
        />
      ) : (
        <ol className='grid max-h-[60vh] gap-2 overflow-y-auto'>
          {rows.map((change) => (
            <li key={change.id} className='grid gap-1 rounded-md border p-3 text-sm'>
              <div className='flex flex-wrap items-center justify-between gap-2'>
                <Badge tone={change.action === 'delete' ? 'danger' : 'neutral'}>
                  {ACTION_LABEL[change.action] ?? change.action}
                </Badge>
                <span className='tabular text-xs text-muted-foreground'>
                  {formatDateTime(change.at)}
                </span>
              </div>
              <span className='font-medium break-words'>{change.summary}</span>
              {change.note && (
                <span className='text-xs break-words text-muted-foreground'>
                  Reason: {change.note}
                </span>
              )}
              <span className='text-xs text-muted-foreground'>
                By {change.changed_by?.name ?? 'the system'}
              </span>
            </li>
          ))}
        </ol>
      )}
    </AppModal>
  )
}
