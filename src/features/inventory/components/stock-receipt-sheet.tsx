import { useState } from 'react'
import { DetailList, ErrorState } from '@/components/common/display'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { formatDate, formatDateTime } from '@/lib/format'
import { useReceipt } from '../api'
import { money, qty } from '../labels'

export function StockReceiptSheet({ id, onClose }: { id?: number; onClose: () => void }) {
  const [shownId, setShownId] = useState(id)
  if (id && id !== shownId) setShownId(id)
  const receipt = useReceipt(shownId ?? null)
  const data = receipt.data

  return (
    <Sheet open={Boolean(id)} onOpenChange={(open) => !open && onClose()}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{data?.receipt_no ?? 'Goods receipt'}</SheetTitle>
          <SheetDescription>
            {data ? `${data.store.name} · received ${formatDate(data.received_on)}` : 'Loading'}
          </SheetDescription>
        </SheetHeader>
        <SheetBody className='grid content-start gap-5'>
          {receipt.isError ? (
            <ErrorState message={receipt.error.message} onRetry={() => receipt.refetch()} />
          ) : !data ? (
            <div className='grid gap-2'>
              {Array.from({ length: 4 }, (_, index) => (
                <Skeleton key={index} className='h-12' />
              ))}
            </div>
          ) : (
            <>
              <DetailList
                items={[
                  { label: 'Vendor', value: data.vendor?.name ?? '—' },
                  {
                    label: 'Invoice',
                    value: data.invoice_no
                      ? `${data.invoice_no}${data.invoice_date ? ` · ${formatDate(data.invoice_date)}` : ''}`
                      : '—',
                  },
                  { label: 'Received by', value: data.received_by ?? '—' },
                  { label: 'Entered', value: formatDateTime(data.created_at) },
                  ...(data.notes ? [{ label: 'Notes', value: data.notes }] : []),
                ]}
              />
              <div className='overflow-hidden rounded-lg border'>
                <ul className='divide-y'>
                  {data.lines.map((line) => (
                    <li
                      key={line.item.id}
                      className='flex flex-wrap items-start justify-between gap-2 px-3 py-2.5'
                    >
                      <span className='grid min-w-0'>
                        <span className='truncate font-semibold'>{line.item.name}</span>
                        <span className='tabular text-xs text-muted-foreground'>
                          {qty(line.quantity, line.unit)} × {money(line.rate)}
                        </span>
                      </span>
                      <span className='tabular font-bold'>{money(line.amount)}</span>
                    </li>
                  ))}
                </ul>
                <div className='flex items-center justify-between border-t bg-muted/40 px-3 py-2.5'>
                  <span className='text-sm font-semibold'>Total</span>
                  <span className='tabular text-lg font-extrabold'>{money(data.total)}</span>
                </div>
              </div>
            </>
          )}
        </SheetBody>
      </SheetContent>
    </Sheet>
  )
}
