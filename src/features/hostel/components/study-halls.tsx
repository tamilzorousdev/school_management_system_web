import { useState } from 'react'
import { LayoutGrid, Pencil, Plus, Trash2 } from 'lucide-react'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import { DataTable, type Column } from '@/components/common/data-table'
import { useShortcut } from '@/components/shortcuts/shortcut-context'
import { Kbd } from '@/components/shortcuts/kbd'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { alerts } from '@/lib/alerts'
import { toApiError } from '@/lib/api/errors'
import { useHostelMutation } from '../api'
import { studyApi, useStudyHalls, type StudyHall } from '../api-duty'
import { StudyHallModal } from './study-hall-modal'
import { StudySeatMap } from './study-seat-map'

export function StudyHallsTab({
  hostelId,
  hallId,
  canEdit,
  onOpen,
}: {
  hostelId?: number
  hallId?: number
  canEdit: boolean
  onOpen: (hallId: number | undefined) => void
}) {
  const halls = useStudyHalls(hostelId, !hallId)
  const [editing, setEditing] = useState<StudyHall | 'new' | null>(null)
  const [removing, setRemoving] = useState<StudyHall | null>(null)
  const remove = useHostelMutation((id: number) => studyApi.removeHall(id))
  const rows = halls.data ?? []

  useShortcut('hostel.create', () => setEditing('new'), { enabled: canEdit && !hallId })

  if (hallId)
    return <StudySeatMap hallId={hallId} canEdit={canEdit} onBack={() => onOpen(undefined)} />

  const confirmRemove = async () => {
    if (!removing) return
    try {
      await remove.mutateAsync(removing.id)
      alerts.success('Study hall deleted', { description: removing.name })
      setRemoving(null)
    } catch (error) {
      alerts.error(toApiError(error).message)
    }
  }

  const actions = (row: StudyHall) =>
    canEdit ? (
      <div className='flex justify-end gap-1'>
        <Button
          variant='ghost'
          size='icon-sm'
          aria-label={`Edit ${row.name}`}
          onClick={(event) => {
            event.stopPropagation()
            setEditing(row)
          }}
        >
          <Pencil />
        </Button>
        <Button
          variant='ghost'
          size='icon-sm'
          aria-label={`Delete ${row.name}`}
          onClick={(event) => {
            event.stopPropagation()
            setRemoving(row)
          }}
        >
          <Trash2 />
        </Button>
      </div>
    ) : null

  const columns: Column<StudyHall>[] = [
    {
      key: 'name',
      header: 'Hall',
      cell: (row) => (
        <div className='grid min-w-0 gap-0.5'>
          <span className='truncate font-semibold'>{row.name}</span>
          <span className='truncate text-xs text-muted-foreground'>
            {row.location ?? row.hostel_name}
          </span>
        </div>
      ),
    },
    {
      key: 'hostel',
      header: 'Hostel',
      hideBelow: 'lg',
      cell: (row) => <span className='text-sm'>{row.hostel_name}</span>,
    },
    {
      key: 'seats',
      header: 'Seats taken',
      cell: (row) => <SeatUse hall={row} />,
    },
    {
      key: 'supervisor',
      header: 'Supervisor',
      hideBelow: 'xl',
      cell: (row) => <span className='text-sm'>{row.supervisor_name ?? '—'}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      cell: (row) => (
        <Badge tone={row.status === 'open' ? 'success' : 'neutral'}>
          {row.status === 'open' ? 'Open' : 'Closed'}
        </Badge>
      ),
    },
    { key: 'actions', header: '', align: 'right', cell: actions },
  ]

  return (
    <Card className='overflow-hidden'>
      <div className='flex flex-wrap items-center gap-2 border-b px-4 py-3'>
        <span className='text-sm font-semibold'>Study halls</span>
        <span className='tabular text-xs text-muted-foreground'>{rows.length} halls</span>
        {canEdit && (
          <Button size='sm' className='ml-auto' onClick={() => setEditing('new')}>
            <Plus />
            Add hall
            <Kbd id='hostel.create' inverted />
          </Button>
        )}
      </div>
      <DataTable
        rows={rows}
        columns={columns}
        rowKey={(row) => row.id}
        loading={halls.isFetching}
        error={halls.isError ? halls.error.message : null}
        onRetry={() => halls.refetch()}
        onRowClick={(row) => onOpen(row.id)}
        empty={{
          icon: LayoutGrid,
          title: 'No study halls',
          description: 'Add a study hall; seats S1, S2… are created for its capacity.',
          action: canEdit ? (
            <Button onClick={() => setEditing('new')}>
              <Plus />
              Add hall
            </Button>
          ) : undefined,
        }}
        card={(row) => (
          <div className='flex items-start justify-between gap-3'>
            <div className='grid min-w-0 gap-1.5'>
              <span className='truncate font-semibold'>{row.name}</span>
              <span className='truncate text-xs text-muted-foreground'>
                {[row.hostel_name, row.location, row.supervisor_name].filter(Boolean).join(' · ')}
              </span>
              <SeatUse hall={row} />
            </div>
            <div className='grid justify-items-end gap-2'>
              <Badge tone={row.status === 'open' ? 'success' : 'neutral'}>
                {row.status === 'open' ? 'Open' : 'Closed'}
              </Badge>
              {actions(row)}
            </div>
          </div>
        )}
      />

      {editing && (
        <StudyHallModal
          hall={editing === 'new' ? null : editing}
          hostelId={hostelId}
          onClose={() => setEditing(null)}
        />
      )}

      <ConfirmDialog
        open={Boolean(removing)}
        onOpenChange={(open) => !open && setRemoving(null)}
        title='Delete study hall'
        description={
          removing
            ? `Delete ${removing.name}? Only a hall with no seated students and no study schedule can be deleted.`
            : ''
        }
        confirmText='Delete'
        destructive
        loading={remove.isPending}
        onConfirm={() => void confirmRemove()}
      />
    </Card>
  )
}

function SeatUse({ hall }: { hall: StudyHall }) {
  const percent = hall.seats_active ? Math.round((hall.seats_taken / hall.seats_active) * 100) : 0
  return (
    <div className='grid w-40 max-w-full gap-1'>
      <span className='tabular text-xs'>
        <span className='font-semibold'>{hall.seats_taken}</span>
        <span className='text-muted-foreground'>
          {' '}
          / {hall.seats_active} · {hall.seats_free} free
        </span>
      </span>
      <div className='h-1.5 overflow-hidden rounded-full bg-muted'>
        <div className='h-full rounded-full bg-primary' style={{ width: `${percent}%` }} />
      </div>
    </div>
  )
}
