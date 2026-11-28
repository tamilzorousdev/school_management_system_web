import { AppModal } from '@/components/common/app-modal'
import { ErrorState } from '@/components/common/display'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { Community } from '@/lib/identity'
import { cn } from '@/lib/utils'
import { useCommunitySummary } from '../api'

export function CommunitySummaryModal({
  open,
  onOpenChange,
  classId,
  classLabel,
  active,
  onPick,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  classId?: number
  classLabel?: string
  active?: Community
  onPick: (community: Community) => void
}) {
  const summary = useCommunitySummary(classId, open)
  const data = summary.data
  const number = 'text-right tabular'

  return (
    <AppModal
      open={open}
      onOpenChange={onOpenChange}
      title='Students by community'
      description={`${classLabel ? `Class ${classLabel}` : 'Whole school'}. Choose a community to list its students.`}
    >
      {summary.isError ? (
        <ErrorState message={summary.error.message} onRetry={() => summary.refetch()} />
      ) : !data ? (
        <div className='grid gap-2'>
          {Array.from({ length: 6 }, (_, index) => (
            <Skeleton key={index} className='h-9 w-full' />
          ))}
        </div>
      ) : (
        <div className='overflow-hidden rounded-lg border'>
          <Table>
            <TableHeader>
              <TableRow className='h-10'>
                <TableHead className='h-10'>Community</TableHead>
                <TableHead className={cn('h-10', number)}>Boys</TableHead>
                <TableHead className={cn('h-10', number)}>Girls</TableHead>
                <TableHead className={cn('h-10', number)}>Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.items.map((row) => (
                <TableRow
                  key={row.community}
                  data-active={row.community === active}
                  tabIndex={0}
                  className='h-10 cursor-pointer'
                  onClick={() => onPick(row.community)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      onPick(row.community)
                    }
                  }}
                >
                  <TableCell className='h-10 py-1.5 font-semibold'>{row.label}</TableCell>
                  <TableCell className={cn('h-10 py-1.5', number)}>{row.boys}</TableCell>
                  <TableCell className={cn('h-10 py-1.5', number)}>{row.girls}</TableCell>
                  <TableCell className={cn('h-10 py-1.5 font-semibold', number)}>
                    {row.total}
                  </TableCell>
                </TableRow>
              ))}
              <TableRow className='h-10'>
                <TableCell className='h-10 py-1.5 text-muted-foreground'>Not recorded</TableCell>
                <TableCell className='h-10 py-1.5' />
                <TableCell className='h-10 py-1.5' />
                <TableCell className={cn('h-10 py-1.5 text-muted-foreground', number)}>
                  {data.not_recorded}
                </TableCell>
              </TableRow>
              <TableRow className='h-10 bg-muted/40'>
                <TableCell className='h-10 py-1.5 font-bold'>Total</TableCell>
                <TableCell className='h-10 py-1.5' />
                <TableCell className='h-10 py-1.5' />
                <TableCell className={cn('h-10 py-1.5 font-bold', number)}>{data.total}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      )}
    </AppModal>
  )
}
