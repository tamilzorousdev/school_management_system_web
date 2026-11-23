import { useState } from 'react'
import { BellRing, CircleCheck, History } from 'lucide-react'
import { EmptyState, ErrorState } from '@/components/common/display'
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
import { useAoDetail, type AoCard } from '../api'
import { PENDING_LABEL, pendingAge } from '../labels'
import { AoStats } from './ao-card'

interface AoDetailSheetProps {
  userId: number | undefined
  fallback: AoCard | undefined
  onClose: () => void
  onRemind: (card: AoCard) => void
  reminding: boolean
}

export function AoDetailSheet({
  userId,
  fallback,
  onClose,
  onRemind,
  reminding,
}: AoDetailSheetProps) {
  const [shownId, setShownId] = useState(userId)
  if (userId && userId !== shownId) setShownId(userId)
  const detail = useAoDetail(shownId)
  const card = detail.data?.card ?? fallback
  return (
    <Sheet open={Boolean(userId)} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className='sm:max-w-2xl'>
        <SheetHeader>
          <SheetTitle>{card?.user.name ?? 'AO'}</SheetTitle>
          <SheetDescription>
            {card
              ? card.is_head
                ? 'Head AO · whole school'
                : card.wings.map((wing) => wing.name).join(', ')
              : 'Loading'}
          </SheetDescription>
        </SheetHeader>
        <SheetBody className='grid content-start gap-6'>
          {card && (
            <div className='grid gap-3'>
              <AoStats card={card} />
              <Button
                className='justify-self-start'
                size='sm'
                variant='outline'
                disabled={!card.pending.total}
                loading={reminding}
                onClick={() => onRemind(card)}
              >
                <BellRing />
                Remind about {card.pending.total} pending
              </Button>
            </div>
          )}
          {detail.isPending ? (
            <div className='grid gap-2'>
              {Array.from({ length: 4 }, (_, index) => (
                <Skeleton key={index} className='h-14' />
              ))}
            </div>
          ) : detail.isError ? (
            <ErrorState message={detail.error.message} onRetry={() => detail.refetch()} />
          ) : (
            <>
              <section className='grid gap-2'>
                <h3 className='text-sm font-bold'>Pending ({detail.data.pending.length})</h3>
                {detail.data.pending.length ? (
                  <ul className='grid gap-2'>
                    {detail.data.pending.map((item) => (
                      <li
                        key={`${item.kind}-${item.id}`}
                        className='grid gap-1 rounded-lg border p-3'
                      >
                        <div className='flex flex-wrap items-center gap-2'>
                          <Badge tone='neutral'>{PENDING_LABEL[item.kind]}</Badge>
                          <span className='min-w-0 flex-1 text-sm font-semibold break-words'>
                            {item.title}
                          </span>
                          {item.overdue && <Badge tone='danger'>Overdue</Badge>}
                        </div>
                        <div className='flex flex-wrap gap-x-3 text-xs text-muted-foreground'>
                          {item.student && (
                            <span>
                              {item.student}
                              {item.class_section && ` · ${item.class_section}`}
                            </span>
                          )}
                          <span className={item.overdue ? 'font-semibold text-destructive' : ''}>
                            {pendingAge(item.age_hours)}
                          </span>
                          <span>{formatDateTime(item.created_at)}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <EmptyState icon={CircleCheck} title='Nothing waiting' className='py-6' />
                )}
              </section>
              <section className='grid gap-2'>
                <h3 className='text-sm font-bold'>Activity</h3>
                {detail.data.activity.length ? (
                  <ol className='grid gap-3 border-l pl-4'>
                    {detail.data.activity.map((item, index) => (
                      <li key={`${item.at}-${index}`} className='grid gap-0.5'>
                        <span className='text-sm font-semibold break-words'>{item.title}</span>
                        {item.detail && (
                          <span className='text-xs break-words text-muted-foreground'>
                            {item.detail}
                          </span>
                        )}
                        <span className='text-xs text-muted-foreground'>
                          {formatDateTime(item.at)}
                        </span>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <EmptyState icon={History} title='No activity yet' className='py-6' />
                )}
              </section>
            </>
          )}
        </SheetBody>
      </SheetContent>
    </Sheet>
  )
}
