import { Link } from '@tanstack/react-router'
import { Boxes, History } from 'lucide-react'
import { EmptyState, ErrorState } from '@/components/common/display'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDate, formatDateTime } from '@/lib/format'
import { useStaffAssets, type Allocation } from '../api'
import { ASSET_CONDITION } from '../labels'

export function StaffAssetsTab({ staffId }: { staffId: number }) {
  const assets = useStaffAssets(staffId)

  if (assets.isPending) {
    return (
      <div className='grid gap-2'>
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className='h-16' />
        ))}
      </div>
    )
  }
  if (assets.isError) {
    return (
      <Card>
        <ErrorState message={assets.error.message} onRetry={() => assets.refetch()} />
      </Card>
    )
  }

  return (
    <div className='grid gap-6 xl:grid-cols-2'>
      <AllocationList
        title='With them now'
        icon={Boxes}
        rows={assets.data.current}
        empty='No school assets are allocated to this staff member.'
      />
      <AllocationList
        title='Returned'
        icon={History}
        rows={assets.data.history}
        empty='Nothing returned yet.'
      />
    </div>
  )
}

function AllocationList({
  title,
  icon,
  rows,
  empty,
}: {
  title: string
  icon: typeof Boxes
  rows: Allocation[]
  empty: string
}) {
  return (
    <Card className='overflow-hidden'>
      <div className='flex items-center justify-between gap-2 border-b px-4 py-3'>
        <h2 className='font-bold'>{title}</h2>
        <span className='tabular text-xs text-muted-foreground'>{rows.length}</span>
      </div>
      {rows.length === 0 ? (
        <EmptyState icon={icon} title={empty} />
      ) : (
        <ul className='grid divide-y'>
          {rows.map((row) => (
            <li key={row.id}>
              <Link
                to='/inventory/assets/$assetId'
                params={{ assetId: String(row.asset.id) }}
                search={{ tab: 'details' }}
                className='grid gap-1 px-4 py-3 outline-none hover:bg-muted/50 focus-visible:bg-accent/60'
              >
                <span className='flex flex-wrap items-start justify-between gap-2'>
                  <span className='grid min-w-0'>
                    <span className='truncate font-semibold'>{row.asset.name}</span>
                    <span className='truncate font-mono text-[11px] text-muted-foreground'>
                      {row.asset_tag}
                    </span>
                  </span>
                  <span className='flex flex-wrap gap-1.5'>
                    {row.status === 'active' && row.overdue && (
                      <Badge tone='danger' dot>
                        Overdue
                      </Badge>
                    )}
                    {row.status === 'active' && !row.acknowledged_at && (
                      <Badge tone='warning'>Not acknowledged</Badge>
                    )}
                    {row.return_condition && (
                      <Badge tone={ASSET_CONDITION[row.return_condition].tone}>
                        {ASSET_CONDITION[row.return_condition].label}
                      </Badge>
                    )}
                  </span>
                </span>
                <span className='text-xs text-muted-foreground'>
                  Since {formatDate(row.allocated_on)}
                  {row.returned_on
                    ? ` · returned ${formatDate(row.returned_on)}`
                    : row.expected_return_on
                      ? ` · due back ${formatDate(row.expected_return_on)}`
                      : ''}
                  {row.acknowledged_at ? ` · received ${formatDateTime(row.acknowledged_at)}` : ''}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}
