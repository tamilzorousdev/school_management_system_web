import { useState } from 'react'
import { ArrowRight, Check, CircleOff, Repeat2, Undo2, X } from 'lucide-react'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import { DataTable, type Column } from '@/components/common/data-table'
import { FilterSelect, ListToolbar } from '@/components/common/list-toolbar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import type { Me } from '@/features/auth/api'
import { alerts } from '@/lib/alerts'
import { toApiError } from '@/lib/api/errors'
import { formatDateTime } from '@/lib/format'
import { useHostelMutation } from '../api'
import { dutyApi, useSwaps, type Swap, type SwapStatus } from '../api-duty'
import { toneOptions } from '../labels'
import { dayLabel, shiftTime, SWAP_STATUS } from './duty-helpers'

const LIMIT = 20

type Action = 'approve' | 'reject' | 'cancel'

const ACTION_TEXT: Record<Action, { title: string; confirm: string; done: string }> = {
  approve: { title: 'Approve swap', confirm: 'Approve', done: 'Swap approved' },
  reject: { title: 'Reject swap', confirm: 'Reject', done: 'Swap rejected' },
  cancel: { title: 'Cancel swap request', confirm: 'Cancel request', done: 'Swap cancelled' },
}

export function DutySwapsTab({
  me,
  canManage,
  status,
  page,
  onStatusChange,
  onPageChange,
}: {
  me: Me
  canManage: boolean
  status?: SwapStatus
  page: number
  onStatusChange: (status: SwapStatus | undefined) => void
  onPageChange: (page: number) => void
}) {
  const swaps = useSwaps({ page, limit: LIMIT, status })
  const [pending, setPending] = useState<{ swap: Swap; action: Action } | null>(null)
  const decide = useHostelMutation(({ swap, action }: { swap: Swap; action: Action }) =>
    action === 'approve'
      ? dutyApi.approveSwap(swap.id)
      : action === 'reject'
        ? dutyApi.rejectSwap(swap.id)
        : dutyApi.cancelSwap(swap.id)
  )

  const run = async () => {
    if (!pending) return
    try {
      await decide.mutateAsync(pending)
      alerts.success(ACTION_TEXT[pending.action].done)
      setPending(null)
    } catch (error) {
      alerts.error(toApiError(error).message)
    }
  }

  const actions = (row: Swap) => {
    if (row.status !== 'pending') return null
    const mine = row.from_user_id === me.id
    if (!canManage && !mine) return null
    return (
      <div className='flex flex-wrap justify-end gap-1'>
        {canManage && (
          <>
            <Button size='sm' onClick={() => setPending({ swap: row, action: 'approve' })}>
              <Check />
              Approve
            </Button>
            <Button
              size='sm'
              variant='outline'
              onClick={() => setPending({ swap: row, action: 'reject' })}
            >
              <X />
              Reject
            </Button>
          </>
        )}
        {mine && (
          <Button
            size='sm'
            variant='ghost'
            onClick={() => setPending({ swap: row, action: 'cancel' })}
          >
            <Undo2 />
            Cancel
          </Button>
        )}
      </div>
    )
  }

  const columns: Column<Swap>[] = [
    {
      key: 'duty',
      header: 'Duty',
      cell: (row) => <DutyText row={row} />,
    },
    {
      key: 'people',
      header: 'From → to',
      cell: (row) => <People row={row} />,
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
      key: 'status',
      header: 'Status',
      cell: (row) => <SwapState row={row} />,
    },
    {
      key: 'created',
      header: 'Asked',
      hideBelow: 'lg',
      cell: (row) => (
        <span className='text-xs text-muted-foreground'>{formatDateTime(row.created_at)}</span>
      ),
    },
    { key: 'actions', header: '', align: 'right', cell: actions },
  ]

  const text = pending ? ACTION_TEXT[pending.action] : null

  return (
    <Card className='overflow-hidden'>
      <ListToolbar
        summary={swaps.data ? `${swaps.data.total} swap requests` : ''}
        onClear={status ? () => onStatusChange(undefined) : undefined}
      >
        <FilterSelect
          id='swaps-status'
          label='Filter by status'
          allLabel='Any status'
          value={status}
          options={toneOptions(SWAP_STATUS)}
          onChange={(value) => onStatusChange(value as SwapStatus | undefined)}
        />
        {!canManage && (
          <span className='text-xs text-muted-foreground'>
            Showing swaps you asked for or were asked to take.
          </span>
        )}
      </ListToolbar>
      <DataTable
        rows={swaps.data?.items ?? []}
        columns={columns}
        rowKey={(row) => row.id}
        loading={swaps.isFetching}
        error={swaps.isError ? swaps.error.message : null}
        onRetry={() => swaps.refetch()}
        empty={{
          icon: status ? CircleOff : Repeat2,
          title: status ? 'No swaps with this status' : 'No swap requests',
          description: status
            ? 'Clear the filter to see every request.'
            : 'Staff ask to hand a duty to someone else from My duty on the Today tab or in the Staff app.',
        }}
        card={(row) => (
          <div className='grid gap-2'>
            <div className='flex items-start justify-between gap-2'>
              <DutyText row={row} />
              <SwapState row={row} />
            </div>
            <People row={row} />
            {row.reason && <span className='text-xs text-muted-foreground'>{row.reason}</span>}
            {actions(row)}
          </div>
        )}
        pagination={{
          page,
          limit: LIMIT,
          total: swaps.data?.total ?? 0,
          label: 'swap requests',
          onPageChange,
        }}
      />

      <ConfirmDialog
        open={Boolean(pending)}
        onOpenChange={(open) => !open && setPending(null)}
        title={text?.title ?? ''}
        description={
          pending
            ? pending.action === 'approve'
              ? `The ${pending.swap.shift_name} duty on ${dayLabel(pending.swap.duty_date)} moves from ${pending.swap.from_user_name} to ${pending.swap.to_user_name}. Both are told.`
              : pending.action === 'reject'
                ? `${pending.swap.from_user_name} keeps the ${pending.swap.shift_name} duty on ${dayLabel(pending.swap.duty_date)}.`
                : `You keep the ${pending.swap.shift_name} duty on ${dayLabel(pending.swap.duty_date)}.`
            : ''
        }
        confirmText={text?.confirm}
        destructive={pending?.action === 'reject'}
        loading={decide.isPending}
        onConfirm={() => void run()}
      />
    </Card>
  )
}

function DutyText({ row }: { row: Swap }) {
  return (
    <div className='grid min-w-0 gap-0.5'>
      <span className='truncate font-semibold'>
        {dayLabel(row.duty_date)} · {row.shift_name}
      </span>
      <span className='truncate text-xs text-muted-foreground'>
        {shiftTime(row.start_time, row.end_time)} · {row.hostel_name}
      </span>
    </div>
  )
}

function People({ row }: { row: Swap }) {
  return (
    <span className='flex flex-wrap items-center gap-1.5 text-sm'>
      {row.from_user_name}
      <ArrowRight className='size-3.5 text-muted-foreground' />
      <span className='font-semibold'>{row.to_user_name}</span>
    </span>
  )
}

function SwapState({ row }: { row: Swap }) {
  return (
    <div className='grid justify-items-start gap-0.5'>
      <Badge tone={SWAP_STATUS[row.status].tone} dot>
        {SWAP_STATUS[row.status].label}
      </Badge>
      {row.decided_by_name && row.status !== 'pending' && (
        <span className='text-[11px] text-muted-foreground'>by {row.decided_by_name}</span>
      )}
    </div>
  )
}
