import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Ban, BedSingle, CircleCheck, MoreHorizontal, Pencil, Trash2, Wrench } from 'lucide-react'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import { DetailList, ErrorState } from '@/components/common/display'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
import { formatDate } from '@/lib/format'
import {
  hostelApi,
  useHostelMutation,
  useRoom,
  type Bed,
  type RoomDetail,
  type RoomStatus,
} from '../api'
import { BED_STATUS, ROOM_STATUS } from '../labels'
import { RoomAssetsSection } from './asset-room-section'
import { EditRoomModal } from './room-forms'
import { BedDots } from './room-parts'

type BedTarget = 'vacant' | 'blocked' | 'maintenance'

const BED_ACTIONS: { status: BedTarget; label: string; icon: typeof Ban }[] = [
  { status: 'vacant', label: 'Make vacant', icon: CircleCheck },
  { status: 'blocked', label: 'Block', icon: Ban },
  { status: 'maintenance', label: 'Under maintenance', icon: Wrench },
]

export function RoomSheet({ roomId, onClose }: { roomId?: number; onClose: () => void }) {
  const [shownId, setShownId] = useState(roomId)
  if (roomId && roomId !== shownId) setShownId(roomId)
  const room = useRoom(shownId ?? 0)
  const data = room.data

  return (
    <Sheet open={Boolean(roomId)} onOpenChange={(open) => !open && onClose()}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{data ? `Room ${data.room_no}` : 'Room'}</SheetTitle>
          <SheetDescription>
            {data ? [data.hostel_name, data.block_name, data.floor_name].join(' · ') : 'Loading'}
          </SheetDescription>
        </SheetHeader>
        <SheetBody>
          {room.isError && !data ? (
            <ErrorState message={room.error.message} onRetry={() => room.refetch()} />
          ) : !data ? (
            <div className='grid gap-3'>
              <Skeleton className='h-24' />
              <Skeleton className='h-48' />
            </div>
          ) : (
            <RoomBody room={data} onDeleted={onClose} />
          )}
        </SheetBody>
      </SheetContent>
    </Sheet>
  )
}

function RoomBody({ room, onDeleted }: { room: RoomDetail; onDeleted: () => void }) {
  const me = useMe().data
  const canManage = can(me, 'hostel.manage')
  const [editing, setEditing] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const setStatus = useHostelMutation(
    (status: RoomStatus) => hostelApi.updateRoom(room.id, { status }),
    false
  )
  const remove = useHostelMutation(() => hostelApi.removeRoom(room.id), false)
  const status = ROOM_STATUS[room.status]

  return (
    <div className='grid gap-5'>
      <div className='flex flex-wrap items-center justify-between gap-2'>
        <div className='flex flex-wrap items-center gap-2'>
          <Badge tone={status.tone} dot>
            {status.label}
          </Badge>
          <BedDots
            capacity={room.capacity}
            occupied={room.occupied_beds}
            vacant={room.vacant_beds}
          />
        </div>
        {canManage && (
          <div className='flex flex-wrap gap-2'>
            <Button size='sm' variant='outline' onClick={() => setEditing(true)}>
              <Pencil />
              Edit
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size='sm' variant='outline' loading={setStatus.isPending}>
                  Set status
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {(Object.keys(ROOM_STATUS) as RoomStatus[]).map((key) => (
                  <DropdownMenuItem
                    key={key}
                    disabled={key === room.status}
                    onSelect={() =>
                      setStatus.mutate(key, {
                        onSuccess: () =>
                          alerts.success(`Room ${room.room_no}: ${ROOM_STATUS[key].label}`),
                      })
                    }
                  >
                    {ROOM_STATUS[key].label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              size='sm'
              variant='ghost'
              aria-label={`Delete room ${room.room_no}`}
              onClick={() => setDeleting(true)}
            >
              <Trash2 />
            </Button>
          </div>
        )}
      </div>

      <DetailList
        items={[
          { label: 'Room type', value: room.room_type_name },
          { label: 'Beds', value: `${room.capacity} (${room.vacant_beds} vacant)` },
          { label: 'Block', value: room.block_name },
          { label: 'Floor', value: room.floor_name },
          ...(room.notes ? [{ label: 'Notes', value: room.notes }] : []),
        ]}
      />

      <div className='grid gap-2'>
        <h3 className='text-sm font-bold'>Beds</h3>
        <ul className='divide-y rounded-lg border'>
          {room.beds.map((bed) => (
            <BedRow key={bed.id} bed={bed} canManage={canManage} />
          ))}
        </ul>
      </div>

      <RoomAssetsSection room={{ id: room.id, hostel_id: room.hostel_id, room_no: room.room_no }} />

      <EditRoomModal room={editing ? room : null} onOpenChange={(open) => setEditing(open)} />
      <ConfirmDialog
        open={deleting}
        onOpenChange={setDeleting}
        title={`Delete room ${room.room_no}?`}
        description='The room and its beds are removed. A room with a resident cannot be deleted.'
        confirmText='Delete room'
        destructive
        loading={remove.isPending}
        onConfirm={() =>
          remove.mutate(undefined, {
            onSuccess: () => {
              alerts.success(`Room ${room.room_no} deleted`)
              setDeleting(false)
              onDeleted()
            },
            onError: () => setDeleting(false),
          })
        }
      />
    </div>
  )
}

function BedRow({ bed, canManage }: { bed: Bed; canManage: boolean }) {
  const update = useHostelMutation(
    (status: BedTarget) => hostelApi.updateBed(bed.id, { status }),
    false
  )
  const status = BED_STATUS[bed.status]
  const locked = bed.status === 'occupied' || bed.status === 'reserved'

  return (
    <li className='flex items-start justify-between gap-3 px-3 py-3'>
      <div className='flex min-w-0 items-start gap-3'>
        <span className='grid size-9 shrink-0 place-items-center rounded-md bg-muted font-mono text-sm font-bold'>
          {bed.bed_no}
        </span>
        <div className='grid min-w-0 gap-1'>
          <Badge tone={status.tone} dot className='justify-self-start'>
            {status.label}
          </Badge>
          {bed.occupant ? (
            <div className='grid min-w-0'>
              <Link
                to='/hostel/residents/$admissionId'
                params={{ admissionId: String(bed.occupant.admission_id) }}
                search={{ tab: 'overview' }}
                className='truncate text-sm font-semibold text-primary hover:underline'
              >
                {bed.occupant.student_name}
              </Link>
              <span className='text-xs text-muted-foreground'>
                {[bed.occupant.class_section, `since ${formatDate(bed.occupant.from_date)}`]
                  .filter(Boolean)
                  .join(' · ')}
              </span>
            </div>
          ) : (
            bed.notes && <span className='text-xs text-muted-foreground'>{bed.notes}</span>
          )}
        </div>
      </div>
      {canManage && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant='ghost'
              size='icon-sm'
              aria-label={`Actions for bed ${bed.bed_no}`}
              loading={update.isPending}
            >
              {!update.isPending && <MoreHorizontal />}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {locked && (
              <>
                <DropdownMenuLabel className='flex items-center gap-2 text-xs font-normal text-muted-foreground'>
                  <BedSingle className='size-3.5' />
                  {bed.status === 'occupied'
                    ? 'Vacate or transfer the resident first'
                    : 'Reserved by an allocation'}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
              </>
            )}
            {BED_ACTIONS.filter((action) => action.status !== bed.status).map((action) => (
              <DropdownMenuItem
                key={action.status}
                disabled={locked}
                onSelect={() =>
                  update.mutate(action.status, {
                    onSuccess: () =>
                      alerts.success(`Bed ${bed.bed_no}: ${BED_STATUS[action.status].label}`),
                  })
                }
              >
                <action.icon />
                {action.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </li>
  )
}
