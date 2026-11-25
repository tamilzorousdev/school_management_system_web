import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { KeyRound, Pencil, Trash2, Undo2, UserPlus } from 'lucide-react'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import { DetailList, ErrorState } from '@/components/common/display'
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
import { Skeleton } from '@/components/ui/skeleton'
import { can, useMe } from '@/features/auth/api'
import { rupees } from '@/features/fees/labels'
import { alerts } from '@/lib/alerts'
import { formatDate } from '@/lib/format'
import { useHostelMutation } from '../api'
import { roomsApi, useLocker, type LockerAllocation, type LockerDetail } from '../api-rooms'
import { studentLine } from '../labels'
import { LOCK_TYPE, LOCKER_SIZE, LOCKER_STATUS, placeLine } from './asset-labels'
import { AllocateLockerModal, EditLockerModal, ReturnLockerModal } from './locker-modals'

export function LockerSheet({ lockerId, onClose }: { lockerId?: number; onClose: () => void }) {
  const [shownId, setShownId] = useState(lockerId)
  if (lockerId && lockerId !== shownId) setShownId(lockerId)
  const locker = useLocker(shownId ?? 0)
  const data = locker.data

  return (
    <Sheet open={Boolean(lockerId)} onOpenChange={(open) => !open && onClose()}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{data ? `Locker ${data.locker_no}` : 'Locker'}</SheetTitle>
          <SheetDescription>
            {data
              ? placeLine([
                  data.hostel_name,
                  data.block_name,
                  data.room_no && `Room ${data.room_no}`,
                ])
              : 'Loading'}
          </SheetDescription>
        </SheetHeader>
        <SheetBody>
          {locker.isError && !data ? (
            <ErrorState message={locker.error.message} onRetry={() => locker.refetch()} />
          ) : !data ? (
            <div className='grid gap-3'>
              <Skeleton className='h-24' />
              <Skeleton className='h-48' />
            </div>
          ) : (
            <LockerBody locker={data} onDeleted={onClose} />
          )}
        </SheetBody>
      </SheetContent>
    </Sheet>
  )
}

type Modal = 'allocate' | 'return' | 'edit' | 'delete' | null

function LockerBody({ locker, onDeleted }: { locker: LockerDetail; onDeleted: () => void }) {
  const me = useMe().data
  const canManage = can(me, 'hostel.locker')
  const [modal, setModal] = useState<Modal>(null)
  const remove = useHostelMutation(() => roomsApi.removeLocker(locker.id), false)
  const status = LOCKER_STATUS[locker.status]
  const holder = locker.holder

  return (
    <div className='grid gap-5'>
      <div className='flex flex-wrap items-center justify-between gap-2'>
        <div className='flex flex-wrap items-center gap-2'>
          <Badge tone={status.tone} dot>
            {status.label}
          </Badge>
          {locker.size && <Badge tone='neutral'>{LOCKER_SIZE[locker.size]}</Badge>}
        </div>
        {canManage && (
          <div className='flex flex-wrap gap-2'>
            {locker.status === 'available' && (
              <Button size='sm' onClick={() => setModal('allocate')}>
                <UserPlus />
                Allot
              </Button>
            )}
            {holder && (
              <Button size='sm' onClick={() => setModal('return')}>
                <Undo2 />
                Take back
              </Button>
            )}
            <Button size='sm' variant='outline' onClick={() => setModal('edit')}>
              <Pencil />
              Edit
            </Button>
            <Button
              size='sm'
              variant='ghost'
              aria-label={`Delete locker ${locker.locker_no}`}
              disabled={Boolean(holder)}
              title={holder ? 'Take the locker back first' : undefined}
              onClick={() => setModal('delete')}
            >
              <Trash2 />
            </Button>
          </div>
        )}
      </div>

      {holder && (
        <div className='grid gap-2 rounded-lg border border-info/30 bg-info/5 p-3'>
          <span className='text-[11px] font-bold tracking-wider text-muted-foreground uppercase'>
            Held by
          </span>
          <div className='grid min-w-0'>
            <Link
              to='/hostel/residents/$admissionId'
              params={{ admissionId: String(holder.admission_id) }}
              search={{ tab: 'belongings' }}
              className='truncate font-semibold text-primary hover:underline'
            >
              {holder.student.name}
            </Link>
            <span className='truncate text-xs text-muted-foreground'>
              {studentLine(holder.student)}
            </span>
          </div>
          <span className='flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground'>
            <span>Since {formatDate(holder.from_date)}</span>
            <span className='inline-flex items-center gap-1'>
              <KeyRound className='size-3' />
              {holder.keys_given} {holder.keys_given === 1 ? 'key' : 'keys'}
            </span>
            <span>{LOCK_TYPE[holder.lock_type]}</span>
            {holder.deposit !== null && <span>Deposit {rupees(holder.deposit)}</span>}
          </span>
        </div>
      )}

      <DetailList
        items={[
          { label: 'Hostel', value: locker.hostel_name },
          { label: 'Block', value: locker.block_name ?? '—' },
          { label: 'Room', value: locker.room_no ?? 'Not in a room' },
          { label: 'Size', value: locker.size ? LOCKER_SIZE[locker.size] : '—' },
          ...(locker.notes ? [{ label: 'Notes', value: locker.notes }] : []),
        ]}
      />

      <div className='grid gap-2'>
        <h3 className='text-sm font-bold'>History</h3>
        {locker.history.length ? (
          <ul className='divide-y rounded-lg border'>
            {locker.history.map((entry) => (
              <HistoryRow key={entry.id} entry={entry} />
            ))}
          </ul>
        ) : (
          <p className='rounded-lg border border-dashed p-3 text-sm text-muted-foreground'>
            Never given to a student yet.
          </p>
        )}
      </div>

      {modal === 'allocate' && (
        <AllocateLockerModal locker={locker} onClose={() => setModal(null)} />
      )}
      {modal === 'return' && holder && (
        <ReturnLockerModal locker={locker} holder={holder} onClose={() => setModal(null)} />
      )}
      {modal === 'edit' && <EditLockerModal locker={locker} onClose={() => setModal(null)} />}
      <ConfirmDialog
        open={modal === 'delete'}
        onOpenChange={(open) => !open && setModal(null)}
        title={`Delete locker ${locker.locker_no}?`}
        description='The locker and its history are removed from the list.'
        confirmText='Delete locker'
        destructive
        loading={remove.isPending}
        onConfirm={() =>
          remove.mutate(undefined, {
            onSuccess: () => {
              alerts.success(`Locker ${locker.locker_no} deleted`)
              setModal(null)
              onDeleted()
            },
            onError: () => setModal(null),
          })
        }
      />
    </div>
  )
}

function HistoryRow({ entry }: { entry: LockerAllocation }) {
  const missing =
    entry.keys_returned !== null ? Math.max(0, entry.keys_given - entry.keys_returned) : 0
  return (
    <li className='grid gap-1 px-3 py-3'>
      <div className='flex flex-wrap items-start justify-between gap-2'>
        <div className='grid min-w-0'>
          <Link
            to='/hostel/residents/$admissionId'
            params={{ admissionId: String(entry.admission_id) }}
            search={{ tab: 'overview' }}
            className='truncate text-sm font-semibold text-primary hover:underline'
          >
            {entry.student.name}
          </Link>
          <span className='truncate text-xs text-muted-foreground'>
            {studentLine(entry.student)}
          </span>
        </div>
        {entry.to_date ? (
          <Badge tone={missing ? 'warning' : 'neutral'} className='shrink-0'>
            {missing ? `${missing} key${missing === 1 ? '' : 's'} missing` : 'Returned'}
          </Badge>
        ) : (
          <Badge tone='info' dot className='shrink-0'>
            Holding
          </Badge>
        )}
      </div>
      <span className='text-xs text-muted-foreground'>
        {formatDate(entry.from_date)} – {entry.to_date ? formatDate(entry.to_date) : 'now'} ·{' '}
        {entry.keys_given} given
        {entry.keys_returned !== null ? `, ${entry.keys_returned} returned` : ''} ·{' '}
        {LOCK_TYPE[entry.lock_type]}
        {entry.deposit !== null ? ` · deposit ${rupees(entry.deposit)}` : ''}
      </span>
      {(entry.given_by_name || entry.returned_by_name) && (
        <span className='text-xs text-muted-foreground'>
          {placeLine([
            entry.given_by_name && `Given by ${entry.given_by_name}`,
            entry.returned_by_name && `taken back by ${entry.returned_by_name}`,
          ])}
        </span>
      )}
      {entry.return_note && <span className='text-xs'>{entry.return_note}</span>}
    </li>
  )
}
