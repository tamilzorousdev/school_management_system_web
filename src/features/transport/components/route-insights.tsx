import { AlertTriangle, Clock, History, ShieldAlert } from 'lucide-react'
import { ErrorState } from '@/components/common/display'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDateTime } from '@/lib/format'
import { useRouteHistory, type RouteDetail } from '../api'
import { routeWindow } from '../labels'

export function RouteTimingsPanel({ route }: { route: RouteDetail }) {
  const errors = route.schedule_problems.filter((item) => item.severity === 'error')
  const warnings = route.schedule_problems.filter((item) => item.severity === 'warning')
  return (
    <div className='grid gap-2'>
      <p className='flex items-center gap-1.5 text-xs text-muted-foreground'>
        <Clock className='size-3.5' />
        <span className='tabular font-semibold text-foreground'>{routeWindow(route.timings)}</span>
      </p>
      {[...errors, ...warnings].map((item) => (
        <p
          key={`${item.code}-${item.message}`}
          className={
            item.severity === 'error'
              ? 'flex items-start gap-1.5 rounded-md bg-destructive/10 px-2 py-1.5 text-xs text-destructive'
              : 'flex items-start gap-1.5 rounded-md bg-warning/10 px-2 py-1.5 text-xs text-warning'
          }
        >
          <AlertTriangle className='mt-0.5 size-3.5 shrink-0' />
          {item.message}
        </p>
      ))}
      {route.warnings.map((warning) => (
        <p
          key={warning}
          className='flex items-start gap-1.5 rounded-md bg-warning/10 px-2 py-1.5 text-xs text-warning'
        >
          <ShieldAlert className='mt-0.5 size-3.5 shrink-0' />
          {warning}
        </p>
      ))}
    </div>
  )
}

export function RouteHistory({ routeId }: { routeId: number }) {
  const history = useRouteHistory(routeId)
  if (history.isError && !history.data)
    return <ErrorState message={history.error.message} onRetry={() => history.refetch()} />
  if (!history.data) return <Skeleton className='h-24' />
  return (
    <div className='grid gap-2'>
      <h3 className='flex items-center gap-1.5 text-xs font-bold tracking-wider text-muted-foreground uppercase'>
        <History className='size-3.5' />
        Change history
      </h3>
      {history.data.length === 0 ? (
        <p className='text-sm text-muted-foreground'>No changes yet.</p>
      ) : (
        <ul className='grid gap-1.5'>
          {history.data.map((change) => (
            <li key={change.id} className='grid gap-0.5 rounded-lg border p-2.5 text-sm'>
              <span>{change.summary}</span>
              <span className='flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground'>
                {formatDateTime(change.at)}
                {change.changed_by ? ` · ${change.changed_by.name}` : ''}
                {change.parents_told > 0 && (
                  <Badge tone='info'>
                    {change.parents_told} {change.parents_told === 1 ? 'parent' : 'parents'} told
                  </Badge>
                )}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
