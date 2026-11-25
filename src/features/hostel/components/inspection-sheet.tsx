import { useState, type ReactNode } from 'react'
import { Link } from '@tanstack/react-router'
import { ArrowRight, Gavel, Wrench } from 'lucide-react'
import { DetailList, ErrorState } from '@/components/common/display'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDateTime } from '@/lib/format'
import { useInspection, type InspectionDetail } from '../api-rooms'
import { CHECK_RESULT, INSPECTION_RESULT, placeLine, scoreTone } from './asset-labels'

export function InspectionSheet({
  inspectionId,
  onClose,
}: {
  inspectionId?: number
  onClose: () => void
}) {
  const [shownId, setShownId] = useState(inspectionId)
  if (inspectionId && inspectionId !== shownId) setShownId(inspectionId)
  const inspection = useInspection(shownId ?? 0)
  const data = inspection.data

  return (
    <Sheet open={Boolean(inspectionId)} onOpenChange={(open) => !open && onClose()}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{data ? `Inspection of room ${data.room_no}` : 'Inspection'}</SheetTitle>
          <SheetDescription>
            {data
              ? placeLine([data.hostel_name, data.block_name, formatDateTime(data.inspected_at)])
              : 'Loading'}
          </SheetDescription>
        </SheetHeader>
        <SheetBody>
          {inspection.isError && !data ? (
            <ErrorState message={inspection.error.message} onRetry={() => inspection.refetch()} />
          ) : !data ? (
            <div className='grid gap-3'>
              <Skeleton className='h-24' />
              <Skeleton className='h-48' />
            </div>
          ) : (
            <InspectionBody inspection={data} />
          )}
        </SheetBody>
      </SheetContent>
    </Sheet>
  )
}

function InspectionBody({ inspection }: { inspection: InspectionDetail }) {
  const result = INSPECTION_RESULT[inspection.result]
  return (
    <div className='grid gap-5'>
      <div className='flex flex-wrap items-center gap-2'>
        <Badge tone={scoreTone(inspection.score)}>Score {inspection.score}%</Badge>
        <Badge tone={result.tone} dot>
          {result.label}
        </Badge>
        {inspection.issues > 0 && (
          <Badge tone='warning'>
            {inspection.issues} {inspection.issues === 1 ? 'issue' : 'issues'}
          </Badge>
        )}
      </div>

      <DetailList
        items={[
          { label: 'Inspected', value: formatDateTime(inspection.inspected_at) },
          { label: 'Inspector', value: inspection.inspector_name ?? '—' },
          {
            label: 'Cleanliness',
            value: inspection.cleanliness ? `${inspection.cleanliness} of 5` : 'Not rated',
          },
          { label: 'Room', value: placeLine([inspection.room_no, inspection.block_name]) },
          ...(inspection.notes ? [{ label: 'Notes', value: inspection.notes }] : []),
        ]}
      />

      {(inspection.ticket_no || inspection.case_no) && (
        <div className='grid gap-2'>
          {inspection.ticket_no && (
            <FollowUp
              icon={Wrench}
              label='Repair ticket'
              number={inspection.ticket_no}
              link={
                <Link
                  to='/hostel/complaints'
                  search={{ tab: 'maintenance', page: 1, search: inspection.ticket_no }}
                >
                  Open
                  <ArrowRight />
                </Link>
              }
            />
          )}
          {inspection.case_no && (
            <FollowUp
              icon={Gavel}
              label='Conduct case'
              number={inspection.case_no}
              link={
                <Link to='/hostel/discipline' search={{ page: 1, search: inspection.case_no }}>
                  Open
                  <ArrowRight />
                </Link>
              }
            />
          )}
        </div>
      )}

      <div className='grid gap-2'>
        <h3 className='text-sm font-bold'>Checklist</h3>
        <ul className='divide-y rounded-lg border'>
          {inspection.items.map((item) => (
            <li key={item.id} className='grid gap-1 px-3 py-2.5'>
              <div className='flex items-center justify-between gap-2'>
                <span className='text-sm font-medium'>{item.item}</span>
                <Badge tone={CHECK_RESULT[item.result].tone} className='shrink-0'>
                  {CHECK_RESULT[item.result].label}
                </Badge>
              </div>
              {item.note && <span className='text-xs text-muted-foreground'>{item.note}</span>}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

function FollowUp({
  icon: Icon,
  label,
  number,
  link,
}: {
  icon: typeof Wrench
  label: string
  number: string
  link: ReactNode
}) {
  return (
    <div className='flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5'>
      <span className='flex min-w-0 items-center gap-3'>
        <span className='grid size-8 shrink-0 place-items-center rounded-md bg-muted text-muted-foreground'>
          <Icon className='size-4' />
        </span>
        <span className='grid min-w-0'>
          <span className='text-xs text-muted-foreground'>{label}</span>
          <span className='truncate font-mono text-sm font-semibold'>{number}</span>
        </span>
      </span>
      <Button size='sm' variant='outline' asChild>
        {link}
      </Button>
    </div>
  )
}
