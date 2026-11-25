import { useState } from 'react'
import { CircleOff, Plus, UtensilsCrossed, XCircle } from 'lucide-react'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import { DataTable, type Column } from '@/components/common/data-table'
import { FilterSelect, ListToolbar } from '@/components/common/list-toolbar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { alerts } from '@/lib/alerts'
import { toApiError } from '@/lib/api/errors'
import { formatDate } from '@/lib/format'
import { useHostelMutation } from '../api'
import { careApi, useMessSkips, type MessSkip } from '../api-care'
import { StudentCell } from './leave-form-parts'
import { todayIso } from './leave-helpers'
import { MEAL, mealList, SKIP_SOURCE } from './mess-helpers'
import { MessSkipModal } from './mess-skip-modal'
import { HostelSelect, ResidentPicker } from './pickers'

const LIMIT = 20

const ACTIVE_OPTIONS = [
  { value: 'true', label: 'Running or coming up' },
  { value: 'false', label: 'Over or cancelled' },
]

export function MessSkipsView({
  hostelId,
  page,
  canEdit,
  adding,
  onAddingChange,
  onHostelChange,
  onPageChange,
}: {
  hostelId?: number
  page: number
  canEdit: boolean
  adding: boolean
  onAddingChange: (adding: boolean) => void
  onHostelChange: (hostelId?: number) => void
  onPageChange: (page: number) => void
}) {
  const today = todayIso()
  const [residentId, setResidentId] = useState<string | undefined>()
  const [active, setActive] = useState<string | undefined>('true')
  const [cancelling, setCancelling] = useState<MessSkip | null>(null)
  const skips = useMessSkips({
    page,
    limit: LIMIT,
    hostel_id: hostelId,
    admission_id: residentId ? Number(residentId) : undefined,
    active: active === undefined ? undefined : active === 'true',
  })
  const cancel = useHostelMutation(careApi.cancelSkip)
  const filtered = Boolean(hostelId || residentId || active !== 'true')
  const cancellable = (row: MessSkip) => row.status === 'active' && row.to_date >= today

  const confirmCancel = async () => {
    if (!cancelling) return
    try {
      await cancel.mutateAsync(cancelling.id)
      alerts.success('Meal skip cancelled', { description: cancelling.student.name })
      setCancelling(null)
    } catch (error) {
      alerts.error(toApiError(error).message)
    }
  }

  const statusBadge = (row: MessSkip) =>
    row.status === 'cancelled' ? (
      <Badge tone='neutral'>Cancelled</Badge>
    ) : row.to_date < today ? (
      <Badge tone='neutral'>Over</Badge>
    ) : row.from_date > today ? (
      <Badge tone='info' dot>
        Coming up
      </Badge>
    ) : (
      <Badge tone='success' dot>
        Running
      </Badge>
    )

  const cancelButton = (row: MessSkip) =>
    canEdit && cancellable(row) ? (
      <Button variant='ghost' size='sm' onClick={() => setCancelling(row)}>
        <XCircle />
        Cancel
      </Button>
    ) : null

  const columns: Column<MessSkip>[] = [
    {
      key: 'student',
      header: 'Student',
      cell: (row) => <StudentCell student={row.student} extra={row.hostel_name} />,
    },
    {
      key: 'dates',
      header: 'Days',
      cell: (row) => (
        <span className='text-sm whitespace-nowrap'>
          {row.from_date === row.to_date
            ? formatDate(row.from_date)
            : `${formatDate(row.from_date)} – ${formatDate(row.to_date)}`}
        </span>
      ),
    },
    {
      key: 'meals',
      header: 'Meals',
      cell: (row) => (
        <div className='flex flex-wrap gap-1'>
          {row.meals.map((meal) => (
            <Badge key={meal} tone='neutral'>
              {MEAL[meal]}
            </Badge>
          ))}
        </div>
      ),
    },
    {
      key: 'reason',
      header: 'Reason',
      hideBelow: 'xl',
      cell: (row) => (
        <span className='line-clamp-2 text-sm text-muted-foreground'>{row.reason ?? '—'}</span>
      ),
    },
    {
      key: 'source',
      header: 'Asked by',
      hideBelow: 'lg',
      cell: (row) => (
        <div className='grid gap-0.5 text-sm'>
          <span>{SKIP_SOURCE[row.source]}</span>
          {row.created_by_name && (
            <span className='text-xs text-muted-foreground'>{row.created_by_name}</span>
          )}
        </div>
      ),
    },
    { key: 'status', header: 'Status', cell: statusBadge },
    { key: 'actions', header: '', align: 'right', cell: cancelButton },
  ]

  return (
    <Card className='overflow-hidden'>
      <ListToolbar
        summary={skips.data ? `${skips.data.total} skips` : ''}
        onClear={
          filtered
            ? () => {
                setResidentId(undefined)
                setActive('true')
                onHostelChange(undefined)
              }
            : undefined
        }
      >
        <HostelSelect
          id='skips-hostel'
          allLabel='All hostels'
          value={hostelId ? String(hostelId) : undefined}
          onChange={(value) => onHostelChange(value ? Number(value) : undefined)}
        />
        <ResidentPicker
          id='skips-resident'
          label='Resident'
          allLabel='All residents'
          hostelId={hostelId}
          value={residentId}
          onChange={(value) => {
            setResidentId(value)
            onPageChange(1)
          }}
        />
        <FilterSelect
          id='skips-active'
          label='Filter by state'
          allLabel='Any state'
          value={active}
          options={ACTIVE_OPTIONS}
          onChange={(value) => {
            setActive(value)
            onPageChange(1)
          }}
        />
      </ListToolbar>
      <DataTable
        rows={skips.data?.items ?? []}
        columns={columns}
        rowKey={(row) => row.id}
        loading={skips.isFetching}
        error={skips.isError ? skips.error.message : null}
        onRetry={() => skips.refetch()}
        empty={{
          icon: filtered ? CircleOff : UtensilsCrossed,
          title: filtered ? 'No meal skips match these filters' : 'No meal skips coming up',
          description: filtered
            ? 'Try another filter or clear the filters.'
            : 'Parents ask for skips in the Parent app; wardens can add one here.',
          action:
            canEdit && !filtered ? (
              <Button onClick={() => onAddingChange(true)}>
                <Plus />
                Add meal skip
              </Button>
            ) : undefined,
        }}
        card={(row) => (
          <div className='grid gap-2'>
            <div className='flex items-start justify-between gap-2'>
              <StudentCell student={row.student} extra={row.hostel_name} />
              {statusBadge(row)}
            </div>
            <span className='text-sm'>
              {formatDate(row.from_date)}
              {row.to_date !== row.from_date ? ` – ${formatDate(row.to_date)}` : ''} ·{' '}
              {mealList(row.meals)}
            </span>
            <span className='text-xs text-muted-foreground'>
              {SKIP_SOURCE[row.source]}
              {row.reason ? ` · ${row.reason}` : ''}
            </span>
            {cancelButton(row) && <div className='justify-self-start'>{cancelButton(row)}</div>}
          </div>
        )}
        pagination={{
          page,
          limit: LIMIT,
          total: skips.data?.total ?? 0,
          label: 'skips',
          onPageChange,
        }}
      />

      {adding && <MessSkipModal hostelId={hostelId} onClose={() => onAddingChange(false)} />}
      <ConfirmDialog
        open={Boolean(cancelling)}
        onOpenChange={(open) => !open && setCancelling(null)}
        title='Cancel this meal skip?'
        description={
          cancelling
            ? `${cancelling.student.name} will be counted again for ${mealList(cancelling.meals).toLowerCase()}.`
            : ''
        }
        confirmText='Cancel skip'
        destructive
        loading={cancel.isPending}
        onConfirm={() => void confirmCancel()}
      />
    </Card>
  )
}
