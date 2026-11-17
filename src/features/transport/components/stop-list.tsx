import { useEffect, useRef, useState } from 'react'
import {
  ChevronDown,
  ChevronUp,
  GripVertical,
  MapPinned,
  Pencil,
  School,
  Trash2,
  UserPlus,
  UsersRound,
} from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { EmptyState } from '@/components/common/display'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { useRiders } from '../api'
import { MODE_LABELS, rupees } from '../labels'
import type { DraftStop } from './stop-form-modal'

interface StopListProps {
  routeId: number
  stops: DraftStop[]
  counts: Record<string, number>
  selectedKey?: string
  canManage: boolean
  onSelect: (key: string) => void
  onReorder: (from: number, to: number) => void
  onEdit: (stop: DraftStop) => void
  onDelete: (stop: DraftStop) => void
  onAddStudents: (stop: DraftStop) => void
}

function StopStudents({ routeId, stopId }: { routeId: number; stopId: number }) {
  const riders = useRiders({ page: 1, limit: 100, route_id: routeId, stop_id: stopId })
  if (riders.isPending) return <Skeleton className='h-16' />
  const rows = riders.data?.items ?? []
  if (!rows.length)
    return <p className='text-xs text-muted-foreground'>No students at this stop yet.</p>
  const total = riders.data?.total ?? rows.length
  const usage = (rider: (typeof rows)[number]) => {
    if (rider.drop_stop && rider.drop_stop.id === stopId) return 'Evening drop only here'
    if (rider.drop_stop) return 'Morning pickup only here'
    return rider.mode !== 'both' ? MODE_LABELS[rider.mode] : null
  }
  return (
    <div className='grid gap-2'>
      <ul className='grid gap-1'>
        {rows.map((rider) => (
          <li key={rider.id} className='flex items-center justify-between gap-2 text-xs'>
            <span className='min-w-0 truncate'>
              <span className='font-semibold'>{rider.student.full_name}</span>
              {rider.student.class_section && (
                <span className='text-muted-foreground'> · {rider.student.class_section}</span>
              )}
            </span>
            {usage(rider) && <span className='shrink-0 text-muted-foreground'>{usage(rider)}</span>}
          </li>
        ))}
      </ul>
      <Link
        to='/transport/routes/$routeId/students'
        params={{ routeId }}
        hash={`stop-${stopId}`}
        className='justify-self-start text-xs font-semibold text-primary hover:underline'
      >
        {total > rows.length ? `See all ${total} in the route list` : 'Open the route list'}
      </Link>
    </div>
  )
}

export function StopList({
  routeId,
  stops,
  counts,
  selectedKey,
  canManage,
  onSelect,
  onReorder,
  onEdit,
  onDelete,
  onAddStudents,
}: StopListProps) {
  const [dragFrom, setDragFrom] = useState<number | null>(null)
  const [dragOver, setDragOver] = useState<number | null>(null)
  const [open, setOpen] = useState<Record<string, boolean>>({})
  const listRef = useRef<HTMLOListElement>(null)

  useEffect(() => {
    if (!selectedKey) return
    listRef.current
      ?.querySelector<HTMLElement>(`[data-key="${selectedKey}"]`)
      ?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [selectedKey])

  if (!stops.length) {
    return (
      <EmptyState
        icon={MapPinned}
        title='No stops yet'
        description={
          canManage
            ? 'Click the map to add a stop, then press Save stops.'
            : 'This route has no stops yet.'
        }
      />
    )
  }

  const endDrag = () => {
    setDragFrom(null)
    setDragOver(null)
  }

  return (
    <ol ref={listRef} aria-label='Stops in travel order' className='grid gap-2'>
      {stops.map((stop, index) => {
        const students = counts[stop.key] ?? 0
        const expanded = Boolean(open[stop.key])
        return (
          <li
            key={stop.key}
            data-key={stop.key}
            draggable={canManage}
            onDragStart={(event) => {
              event.dataTransfer.effectAllowed = 'move'
              event.dataTransfer.setData('text/plain', String(index))
              setDragFrom(index)
            }}
            onDragOver={(event) => {
              if (dragFrom === null) return
              event.preventDefault()
              setDragOver(index)
            }}
            onDrop={(event) => {
              event.preventDefault()
              if (dragFrom !== null && dragFrom !== index) onReorder(dragFrom, index)
              endDrag()
            }}
            onDragEnd={endDrag}
            className={cn(
              'grid gap-2 rounded-lg border bg-card p-3 transition-[border-color,box-shadow,opacity]',
              stop.key === selectedKey && 'border-info/60 ring-2 ring-info/25',
              dragFrom === index && 'opacity-50',
              dragOver === index && dragFrom !== index && 'border-primary ring-2 ring-primary/30'
            )}
          >
            <div className='flex items-start gap-2'>
              {canManage && (
                <span
                  aria-hidden
                  title='Drag to reorder'
                  className='-ml-1 grid h-7 w-5 shrink-0 cursor-grab place-items-center text-muted-foreground active:cursor-grabbing'
                >
                  <GripVertical className='size-4' />
                </span>
              )}
              <span className='grid size-7 shrink-0 place-items-center rounded-full bg-primary text-xs font-extrabold text-primary-foreground'>
                {index + 1}
              </span>
              <button
                type='button'
                onClick={() => onSelect(stop.key)}
                className='grid min-w-0 flex-1 rounded text-left outline-none focus-visible:ring-2 focus-visible:ring-ring/40'
                aria-label={`Show ${stop.name} on the map`}
              >
                <span className='flex items-center gap-1.5'>
                  <span className='truncate font-semibold'>{stop.name}</span>
                  {!stop.id && <Badge tone='warning'>New</Badge>}
                </span>
                <span className='tabular flex flex-wrap gap-x-2 text-xs text-muted-foreground'>
                  <span>Pickup {stop.pickup_time ?? '—'}</span>
                  <span>Drop {stop.drop_time ?? '—'}</span>
                  <span>{stop.geofence_radius_m} m circle</span>
                  <span>{rupees(stop.monthly_fee)} a month</span>
                </span>
                {stop.landmark && (
                  <span className='truncate text-xs text-muted-foreground'>{stop.landmark}</span>
                )}
              </button>
              {canManage && (
                <span className='-mr-1 flex shrink-0'>
                  <Button
                    size='icon-sm'
                    variant='ghost'
                    aria-label={`Edit ${stop.name}`}
                    onClick={() => onEdit(stop)}
                  >
                    <Pencil />
                  </Button>
                  <Button
                    size='icon-sm'
                    variant='ghost'
                    aria-label={`Delete ${stop.name}`}
                    className='text-destructive hover:bg-destructive/10'
                    onClick={() => onDelete(stop)}
                  >
                    <Trash2 />
                  </Button>
                </span>
              )}
            </div>
            <div className='flex flex-wrap items-center gap-2 pl-9'>
              {stop.id ? (
                <>
                  <Button
                    size='sm'
                    variant='ghost'
                    className='-ml-2'
                    aria-expanded={expanded}
                    aria-label={`${expanded ? 'Hide' : 'Show'} students at ${stop.name}`}
                    disabled={!students}
                    onClick={() => setOpen((prev) => ({ ...prev, [stop.key]: !expanded }))}
                  >
                    <UsersRound />
                    {students} {students === 1 ? 'student' : 'students'}
                    {students > 0 && (expanded ? <ChevronUp /> : <ChevronDown />)}
                  </Button>
                  {canManage && (
                    <Button
                      size='sm'
                      variant='outline'
                      aria-label={`Add students to ${stop.name}`}
                      onClick={() => onAddStudents(stop)}
                    >
                      <UserPlus />
                      Add students
                    </Button>
                  )}
                </>
              ) : (
                <span className='text-xs text-muted-foreground'>
                  Save stops to add students here
                </span>
              )}
              {canManage && (
                <span className='-mr-1 ml-auto flex'>
                  <Button
                    size='icon-sm'
                    variant='ghost'
                    aria-label={`Move ${stop.name} up`}
                    disabled={index === 0}
                    onClick={() => onReorder(index, index - 1)}
                  >
                    <ChevronUp />
                  </Button>
                  <Button
                    size='icon-sm'
                    variant='ghost'
                    aria-label={`Move ${stop.name} down`}
                    disabled={index === stops.length - 1}
                    onClick={() => onReorder(index, index + 1)}
                  >
                    <ChevronDown />
                  </Button>
                </span>
              )}
            </div>
            {expanded && stop.id && (
              <div className='ml-9 rounded-md bg-muted/60 p-2.5'>
                <StopStudents routeId={routeId} stopId={stop.id} />
              </div>
            )}
          </li>
        )
      })}
      <li className='flex items-center gap-2 rounded-lg border border-dashed p-3 text-sm font-semibold text-muted-foreground'>
        <span className='grid size-7 place-items-center rounded-lg bg-foreground text-background'>
          <School className='size-4' />
        </span>
        School
      </li>
    </ol>
  )
}
