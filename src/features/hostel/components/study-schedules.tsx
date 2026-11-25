import { useState } from 'react'
import { CalendarClock, Pencil, Plus, Trash2 } from 'lucide-react'
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
import { studyApi, useStudySchedules, type StudySchedule } from '../api-duty'
import { daysText, shiftTime } from './duty-helpers'
import { StudyScheduleModal } from './study-schedule-modal'

export function StudySchedulesTab({
  hostelId,
  canEdit,
  hallOn,
}: {
  hostelId?: number
  canEdit: boolean
  hallOn: boolean
}) {
  const schedules = useStudySchedules({ hostel_id: hostelId })
  const [editing, setEditing] = useState<StudySchedule | 'new' | null>(null)
  const [removing, setRemoving] = useState<StudySchedule | null>(null)
  const remove = useHostelMutation((id: number) => studyApi.removeSchedule(id))
  const rows = schedules.data ?? []

  useShortcut('hostel.create', () => setEditing('new'), { enabled: canEdit })

  const confirmRemove = async () => {
    if (!removing) return
    try {
      await remove.mutateAsync(removing.id)
      alerts.success('Study schedule deleted', { description: removing.name })
      setRemoving(null)
    } catch (error) {
      alerts.error(toApiError(error).message)
    }
  }

  const actions = (row: StudySchedule) =>
    canEdit ? (
      <div className='flex justify-end gap-1'>
        <Button
          variant='ghost'
          size='icon-sm'
          aria-label={`Edit ${row.name}`}
          onClick={() => setEditing(row)}
        >
          <Pencil />
        </Button>
        <Button
          variant='ghost'
          size='icon-sm'
          aria-label={`Delete ${row.name}`}
          onClick={() => setRemoving(row)}
        >
          <Trash2 />
        </Button>
      </div>
    ) : null

  const columns: Column<StudySchedule>[] = [
    {
      key: 'name',
      header: 'Schedule',
      cell: (row) => (
        <div className='grid min-w-0 gap-0.5'>
          <span className='truncate font-semibold'>{row.name}</span>
          <span className='truncate text-xs text-muted-foreground'>{groupText(row)}</span>
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
      key: 'when',
      header: 'When',
      cell: (row) => (
        <div className='grid gap-0.5 text-sm'>
          <span>{daysText(row.days)}</span>
          <span className='tabular text-xs text-muted-foreground'>
            {shiftTime(row.start_time, row.end_time)}
          </span>
        </div>
      ),
    },
    {
      key: 'supervisor',
      header: 'Supervisor',
      hideBelow: 'xl',
      cell: (row) => <span className='text-sm'>{row.supervisor_name ?? '—'}</span>,
    },
    {
      key: 'active',
      header: 'Status',
      cell: (row) => (
        <Badge tone={row.active ? 'success' : 'neutral'}>{row.active ? 'Active' : 'Off'}</Badge>
      ),
    },
    { key: 'actions', header: '', align: 'right', cell: actions },
  ]

  return (
    <Card className='overflow-hidden'>
      <div className='flex flex-wrap items-center gap-2 border-b px-4 py-3'>
        <span className='text-sm font-semibold'>Study schedules</span>
        <span className='tabular text-xs text-muted-foreground'>{rows.length} schedules</span>
        {canEdit && (
          <Button size='sm' className='ml-auto' onClick={() => setEditing('new')}>
            <Plus />
            Add schedule
            <Kbd id='hostel.create' inverted />
          </Button>
        )}
      </div>
      <DataTable
        rows={rows}
        columns={columns}
        rowKey={(row) => row.id}
        loading={schedules.isFetching}
        error={schedules.isError ? schedules.error.message : null}
        onRetry={() => schedules.refetch()}
        empty={{
          icon: CalendarClock,
          title: 'No study schedules',
          description: 'Add study hours for a hostel, a block or a study hall.',
          action: canEdit ? (
            <Button onClick={() => setEditing('new')}>
              <Plus />
              Add schedule
            </Button>
          ) : undefined,
        }}
        card={(row) => (
          <div className='flex items-start justify-between gap-3'>
            <div className='grid min-w-0 gap-1'>
              <span className='truncate font-semibold'>{row.name}</span>
              <span className='text-xs text-muted-foreground'>
                {daysText(row.days)} · {shiftTime(row.start_time, row.end_time)}
              </span>
              <span className='text-xs text-muted-foreground'>
                {row.hostel_name} · {groupText(row)}
                {row.supervisor_name ? ` · ${row.supervisor_name}` : ''}
              </span>
              <Badge tone={row.active ? 'success' : 'neutral'} className='justify-self-start'>
                {row.active ? 'Active' : 'Off'}
              </Badge>
            </div>
            {actions(row)}
          </div>
        )}
      />

      {editing && (
        <StudyScheduleModal
          schedule={editing === 'new' ? null : editing}
          hostelId={hostelId}
          hallOn={hallOn}
          onClose={() => setEditing(null)}
        />
      )}

      <ConfirmDialog
        open={Boolean(removing)}
        onOpenChange={(open) => !open && setRemoving(null)}
        title='Delete study schedule'
        description={
          removing ? `Delete ${removing.name}? Study attendance already marked for it is kept.` : ''
        }
        confirmText='Delete'
        destructive
        loading={remove.isPending}
        onConfirm={() => void confirmRemove()}
      />
    </Card>
  )
}

function groupText(row: StudySchedule) {
  if (row.hall_name) return `Seated in ${row.hall_name}`
  if (row.block_name) return `${row.block_name} residents`
  return 'All residents'
}
