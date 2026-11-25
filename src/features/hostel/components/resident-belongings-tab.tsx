import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import {
  ArrowRight,
  KeyRound,
  Lock,
  MoreHorizontal,
  Package,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import { DataTable, type Column } from '@/components/common/data-table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/ui/skeleton'
import { can, useMe } from '@/features/auth/api'
import { alerts } from '@/lib/alerts'
import { formatDate } from '@/lib/format'
import { useHostelModules, useHostelMutation, type AdmissionDetail } from '../api'
import {
  roomsApi,
  useBelongings,
  useLockers,
  type Belonging,
  type BelongingStatus,
} from '../api-rooms'
import { BELONGING_STATUS, LOCK_TYPE, placeLine } from './asset-labels'
import { AddBelongingModal, EditBelongingModal } from './belonging-modals'
import { Muted, Section } from './resident-form-parts'

type Modal =
  | { kind: 'add' }
  | { kind: 'edit'; belonging: Belonging }
  | { kind: 'remove'; belonging: Belonging }
  | null

export function ResidentBelongingsTab({ admission }: { admission: AdmissionDetail }) {
  const me = useMe().data
  const canEdit = can(me, 'hostel.inventory')
  const modules = useHostelModules()
  const lockersOn = Boolean(modules.data?.enabled_modules.lockers)
  const belongings = useBelongings(admission.id)
  const [modal, setModal] = useState<Modal>(null)
  const setStatus = useHostelMutation(
    (input: { id: number; status: BelongingStatus }) =>
      roomsApi.updateBelonging(input.id, { status: input.status }),
    false
  )
  const remove = useHostelMutation((id: number) => roomsApi.removeBelonging(id), false)
  const open = admission.status !== 'checked_out'

  const actions = (row: Belonging) =>
    canEdit ? (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant='ghost'
            size='icon-sm'
            aria-label={`Actions for ${row.item}`}
            loading={setStatus.isPending && setStatus.variables?.id === row.id}
          >
            <MoreHorizontal />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end'>
          {(Object.keys(BELONGING_STATUS) as BelongingStatus[])
            .filter((status) => status !== row.status)
            .map((status) => (
              <DropdownMenuItem
                key={status}
                onSelect={() =>
                  setStatus.mutate(
                    { id: row.id, status },
                    {
                      onSuccess: () =>
                        alerts.success(`${row.item}: ${BELONGING_STATUS[status].label}`),
                    }
                  )
                }
              >
                Mark {BELONGING_STATUS[status].label.toLowerCase()}
              </DropdownMenuItem>
            ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => setModal({ kind: 'edit', belonging: row })}>
            <Pencil />
            Edit status &amp; notes
          </DropdownMenuItem>
          <DropdownMenuItem
            destructive
            onSelect={() => setModal({ kind: 'remove', belonging: row })}
          >
            <Trash2 />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ) : null

  const statusBadge = (row: Belonging) => (
    <Badge tone={BELONGING_STATUS[row.status].tone} dot>
      {BELONGING_STATUS[row.status].label}
    </Badge>
  )

  const columns: Column<Belonging>[] = [
    {
      key: 'item',
      header: 'Item',
      cell: (row) => (
        <div className='grid min-w-0'>
          <span className='truncate font-semibold'>
            {row.item}
            {row.quantity > 1 && (
              <span className='font-normal text-muted-foreground'> × {row.quantity}</span>
            )}
          </span>
          {row.description && (
            <span className='truncate text-xs text-muted-foreground'>{row.description}</span>
          )}
        </div>
      ),
    },
    {
      key: 'serial_no',
      header: 'Serial no.',
      hideBelow: 'lg',
      cell: (row) => <span className='font-mono text-xs'>{row.serial_no ?? '—'}</span>,
    },
    {
      key: 'declared_on',
      header: 'Declared',
      cell: (row) => (
        <div className='grid'>
          <span className='text-sm'>{formatDate(row.declared_on)}</span>
          {row.declared_by_name && (
            <span className='text-xs text-muted-foreground'>{row.declared_by_name}</span>
          )}
        </div>
      ),
    },
    { key: 'status', header: 'Status', cell: statusBadge },
    {
      key: 'notes',
      header: 'Notes',
      hideBelow: 'xl',
      cell: (row) => <span className='text-sm text-muted-foreground'>{row.notes ?? '—'}</span>,
    },
    { key: 'actions', header: '', align: 'right', cell: actions },
  ]

  return (
    <div className='grid gap-6'>
      {lockersOn && <LockerCard admission={admission} />}
      <Section
        title='Belongings'
        action={
          canEdit && open ? (
            <Button size='sm' onClick={() => setModal({ kind: 'add' })}>
              <Plus />
              Record item
            </Button>
          ) : undefined
        }
      >
        <div className='-mx-4 -mb-4 border-t sm:-mx-5 sm:-mb-5'>
          <DataTable
            rows={belongings.data ?? []}
            columns={columns}
            rowKey={(row) => row.id}
            loading={belongings.isFetching}
            error={belongings.isError ? belongings.error.message : null}
            onRetry={() => belongings.refetch()}
            empty={{
              icon: Package,
              title: 'No belongings recorded',
              description: 'Record phones, laptops, cycles and other valuables kept in the hostel.',
              action:
                canEdit && open ? (
                  <Button variant='outline' onClick={() => setModal({ kind: 'add' })}>
                    <Plus />
                    Record item
                  </Button>
                ) : undefined,
            }}
            card={(row) => (
              <div className='grid gap-1.5'>
                <div className='flex items-start justify-between gap-2'>
                  <div className='grid min-w-0'>
                    <span className='truncate font-semibold'>
                      {row.item}
                      {row.quantity > 1 && (
                        <span className='font-normal text-muted-foreground'> × {row.quantity}</span>
                      )}
                    </span>
                    <span className='truncate text-xs text-muted-foreground'>
                      {placeLine([row.description, row.serial_no && `SN ${row.serial_no}`])}
                    </span>
                  </div>
                  <div className='flex shrink-0 items-center gap-1'>
                    {statusBadge(row)}
                    {actions(row)}
                  </div>
                </div>
                <span className='text-xs text-muted-foreground'>
                  {placeLine([`Declared ${formatDate(row.declared_on)}`, row.notes])}
                </span>
              </div>
            )}
          />
        </div>
      </Section>

      {modal?.kind === 'add' && (
        <AddBelongingModal
          admissionId={admission.id}
          studentName={admission.student.name}
          onClose={() => setModal(null)}
        />
      )}
      {modal?.kind === 'edit' && (
        <EditBelongingModal belonging={modal.belonging} onClose={() => setModal(null)} />
      )}
      <ConfirmDialog
        open={modal?.kind === 'remove'}
        onOpenChange={(next) => !next && setModal(null)}
        title={modal?.kind === 'remove' ? `Delete ${modal.belonging.item}?` : 'Delete item?'}
        description='Use this only for an item recorded by mistake. To show it went home, mark it taken home instead.'
        confirmText='Delete'
        destructive
        loading={remove.isPending}
        onConfirm={() => {
          if (modal?.kind !== 'remove') return
          const { belonging } = modal
          remove.mutate(belonging.id, {
            onSuccess: () => {
              alerts.success(`${belonging.item} deleted`)
              setModal(null)
            },
            onError: () => setModal(null),
          })
        }}
      />
    </div>
  )
}

function LockerCard({ admission }: { admission: AdmissionDetail }) {
  const lockers = useLockers({
    page: 1,
    limit: 10,
    search: admission.student.admission_no,
    status: 'allotted',
  })
  const locker = lockers.data?.items.find((item) => item.holder?.admission_id === admission.id)

  return (
    <Section
      title='Locker'
      action={
        locker ? (
          <Button variant='outline' size='sm' asChild>
            <Link to='/hostel/lockers' search={{ page: 1, locker: locker.id }}>
              Open locker
              <ArrowRight />
            </Link>
          </Button>
        ) : undefined
      }
    >
      {lockers.isPending ? (
        <Skeleton className='h-14' />
      ) : locker?.holder ? (
        <div className='flex flex-wrap items-center gap-3'>
          <span className='grid size-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary'>
            <Lock className='size-5' />
          </span>
          <div className='grid min-w-0'>
            <span className='font-mono font-bold'>{locker.locker_no}</span>
            <span className='text-xs text-muted-foreground'>
              {placeLine([
                locker.block_name,
                locker.room_no && `Room ${locker.room_no}`,
                `since ${formatDate(locker.holder.from_date)}`,
              ])}
            </span>
          </div>
          <span className='ml-auto flex flex-wrap gap-1.5'>
            <Badge tone='neutral'>
              <KeyRound className='size-3' />
              {locker.holder.keys_given} {locker.holder.keys_given === 1 ? 'key' : 'keys'}
            </Badge>
            <Badge tone='neutral'>{LOCK_TYPE[locker.holder.lock_type]}</Badge>
          </span>
        </div>
      ) : (
        <Muted>No locker is given to this student.</Muted>
      )}
    </Section>
  )
}
