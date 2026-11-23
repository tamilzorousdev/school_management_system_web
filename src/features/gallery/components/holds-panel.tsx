import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Lock, LockOpen, Plus } from 'lucide-react'
import { DataTable, type Column } from '@/components/common/data-table'
import { SegmentedControl } from '@/components/common/segmented-control'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDate, formatDateTime } from '@/lib/format'
import { useHolds, type RetentionHold } from '../api'
import { ApplyHoldModal, ReleaseHoldModal } from './hold-modals'

const LIMIT = 20

const KIND_LABELS: Record<RetentionHold['kind'], string> = {
  hold: 'Hold',
  extension: 'Extended',
  permanent: 'Until released',
}

export function HoldsPanel({
  canConfigure,
  view,
  page,
  onChange,
}: {
  canConfigure: boolean
  view: 'active' | 'ended'
  page: number
  onChange: (patch: { holds?: 'active' | 'ended'; page?: number }) => void
}) {
  const holds = useHolds({ page, limit: LIMIT, active: view === 'active' })
  const [adding, setAdding] = useState(false)
  const [releasing, setReleasing] = useState<{ id: number; name: string } | null>(null)
  const rows = holds.data?.items ?? []
  const nameOf = (hold: RetentionHold) =>
    hold.album_title ?? hold.media_name ?? `#${hold.album_id ?? hold.media_id}`

  const target = (hold: RetentionHold) =>
    hold.album_id ? (
      <Link
        to='/gallery/albums/$albumId'
        params={{ albumId: String(hold.album_id) }}
        search={{ page: 1 }}
        className='font-bold hover:underline'
        onClick={(event) => event.stopPropagation()}
      >
        {nameOf(hold)}
      </Link>
    ) : (
      <span className='font-bold'>{nameOf(hold)}</span>
    )

  const columns: Column<RetentionHold>[] = [
    {
      key: 'target',
      header: 'Protected',
      cell: (hold) => (
        <div className='grid'>
          {target(hold)}
          <span className='text-xs text-muted-foreground'>
            {hold.album_id ? 'Album' : 'Photo or video'}
          </span>
        </div>
      ),
    },
    {
      key: 'reason',
      header: 'Reason',
      cell: (hold) => <span className='text-sm'>{hold.reason}</span>,
    },
    {
      key: 'until',
      header: 'Until',
      cell: (hold) => (
        <Badge tone={hold.keep_until ? 'info' : 'neutral'}>
          {hold.keep_until ? formatDate(hold.keep_until) : KIND_LABELS[hold.kind]}
        </Badge>
      ),
    },
    {
      key: 'applied',
      header: 'Applied',
      hideBelow: 'lg',
      cell: (hold) => (
        <div className='grid'>
          <span>{formatDateTime(hold.applied_at)}</span>
          <span className='text-xs text-muted-foreground'>{hold.applied_by_name ?? '—'}</span>
        </div>
      ),
    },
    ...(view === 'ended'
      ? [
          {
            key: 'released',
            header: 'Released',
            cell: (hold: RetentionHold) => (
              <div className='grid'>
                <span>{hold.released_at ? formatDateTime(hold.released_at) : '—'}</span>
                <span className='text-xs text-muted-foreground'>
                  {[hold.released_by_name, hold.release_reason].filter(Boolean).join(' · ')}
                </span>
              </div>
            ),
          },
        ]
      : []),
    {
      key: 'actions',
      header: <span className='sr-only'>Actions</span>,
      align: 'right',
      cell: (hold) =>
        canConfigure &&
        hold.is_active && (
          <Button
            variant='ghost'
            size='sm'
            onClick={() => setReleasing({ id: hold.id, name: nameOf(hold) })}
          >
            <LockOpen />
            Release
          </Button>
        ),
    },
  ]

  return (
    <Card className='overflow-hidden'>
      <CardHeader className='pb-4'>
        <div className='grid gap-0.5'>
          <CardTitle>Retention holds</CardTitle>
          <CardDescription>Albums and items protected from automatic deletion.</CardDescription>
        </div>
        <div className='flex flex-wrap items-center gap-2'>
          <SegmentedControl
            label='Holds'
            value={view}
            options={[
              { value: 'active', label: 'Active' },
              { value: 'ended', label: 'Ended' },
            ]}
            onChange={(holdsView) => onChange({ holds: holdsView, page: 1 })}
          />
          {canConfigure && (
            <Button size='sm' onClick={() => setAdding(true)}>
              <Plus />
              Add hold
            </Button>
          )}
        </div>
      </CardHeader>
      <DataTable
        rows={rows}
        columns={columns}
        rowKey={(hold) => hold.id}
        loading={holds.isFetching}
        error={holds.isError ? holds.error.message : null}
        onRetry={() => holds.refetch()}
        empty={{
          icon: Lock,
          title: view === 'active' ? 'No active holds' : 'No ended holds',
          description: view === 'active' ? 'Everything follows the retention rules.' : undefined,
        }}
        card={(hold) => (
          <div className='grid gap-1'>
            <div className='flex items-start justify-between gap-2'>
              {target(hold)}
              <Badge tone={hold.keep_until ? 'info' : 'neutral'}>
                {hold.keep_until ? formatDate(hold.keep_until) : KIND_LABELS[hold.kind]}
              </Badge>
            </div>
            <span className='text-sm'>{hold.reason}</span>
            <span className='text-xs text-muted-foreground'>
              Applied {formatDate(hold.applied_at)}
              {hold.applied_by_name ? ` by ${hold.applied_by_name}` : ''}
            </span>
            {canConfigure && hold.is_active && (
              <Button
                variant='outline'
                size='sm'
                className='mt-1 w-fit'
                onClick={() => setReleasing({ id: hold.id, name: nameOf(hold) })}
              >
                <LockOpen />
                Release
              </Button>
            )}
          </div>
        )}
        pagination={{
          page,
          limit: LIMIT,
          total: holds.data?.total ?? 0,
          label: 'holds',
          onPageChange: (next) => onChange({ page: next }),
        }}
      />
      <ApplyHoldModal target={adding ? 'pick' : null} onClose={() => setAdding(false)} />
      <ReleaseHoldModal hold={releasing} onClose={() => setReleasing(null)} />
    </Card>
  )
}
