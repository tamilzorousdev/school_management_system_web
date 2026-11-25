import { LogIn, LogOut, QrCode, ScanLine, Hand, MapPinOff } from 'lucide-react'
import { EmptyState } from '@/components/common/display'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { TripBoarding, TripDetail } from '../api'
import { BOARDING_ACTION, clock } from '../labels'

const place = (row: TripBoarding) => row.stop?.name || 'School gate'

export function BoardingLog({ trip }: { trip: TripDetail }) {
  const rows = trip.boardings ?? []
  const boarded = rows.filter((row) => row.action === 'boarded').length
  const alighted = rows.filter((row) => row.action === 'alighted').length
  const missed = rows.filter((row) => row.action === 'missed').length
  const scanned = rows.filter((row) => row.method === 'qr').length
  return (
    <div className='grid'>
      <p className='tabular flex flex-wrap gap-x-3 gap-y-1 border-b px-4 py-2.5 text-xs text-muted-foreground'>
        <span className='flex items-center gap-1'>
          <LogIn className='size-3.5' />
          <span className='font-semibold text-foreground'>{boarded}</span> got on
        </span>
        <span className='flex items-center gap-1'>
          <LogOut className='size-3.5' />
          <span className='font-semibold text-foreground'>{alighted}</span> got off
        </span>
        {missed > 0 && (
          <span className='flex items-center gap-1'>
            <MapPinOff className='size-3.5' />
            <span className='font-semibold text-foreground'>{missed}</span> not at stop
          </span>
        )}
        {rows.length > 0 && (
          <span className='flex items-center gap-1'>
            <QrCode className='size-3.5' />
            <span className='font-semibold text-foreground'>{scanned}</span> by ID card
          </span>
        )}
      </p>
      {rows.length === 0 ? (
        <EmptyState
          icon={ScanLine}
          title='No one scanned yet'
          description='The attendant scans ID cards or taps names in the Driver app as children get on and off. Parents are told at once.'
          className='py-8'
        />
      ) : (
        <ul aria-label='Boarding log' aria-live='polite' className='grid max-h-96 overflow-y-auto'>
          {rows.map((row) => {
            const on = row.action === 'boarded'
            const off = row.action === 'alighted'
            return (
              <li
                key={row.id}
                className='grid grid-cols-[1.75rem_minmax(0,1fr)_auto] items-start gap-3 border-b px-4 py-2.5 text-sm last:border-0'
              >
                <span
                  className={cn(
                    'grid size-7 place-items-center rounded-lg',
                    on
                      ? 'bg-success/10 text-success'
                      : off
                        ? 'bg-info/10 text-info'
                        : 'bg-warning/10 text-warning'
                  )}
                  aria-hidden
                >
                  {on ? (
                    <LogIn className='size-3.5' />
                  ) : off ? (
                    <LogOut className='size-3.5' />
                  ) : (
                    <MapPinOff className='size-3.5' />
                  )}
                </span>
                <span className='grid min-w-0 gap-0.5'>
                  <span className='flex flex-wrap items-center gap-1.5'>
                    <span className='font-semibold break-words'>{row.full_name}</span>
                    {row.pass_on_hold && (
                      <Badge tone='warning' title='Got on with the bus pass on hold'>
                        Pass on hold
                      </Badge>
                    )}
                  </span>
                  <span className='text-xs break-words text-muted-foreground'>
                    {BOARDING_ACTION[row.action]} at {place(row)}
                    {row.class_section ? ` · ${row.class_section}` : ''}
                    {row.recorded_by ? ` · by ${row.recorded_by.name}` : ''}
                    {off && row.handed_to ? ` · handed to ${row.handed_to}` : ''}
                  </span>
                </span>
                <span className='grid justify-items-end gap-1'>
                  <span className='tabular text-xs font-semibold'>{clock(row.occurred_at)}</span>
                  <Badge tone={row.method === 'qr' ? 'info' : 'neutral'}>
                    {row.method === 'qr' ? (
                      <QrCode className='size-3' />
                    ) : (
                      <Hand className='size-3' />
                    )}
                    {row.method === 'qr' ? 'ID card' : 'Manual'}
                  </Badge>
                </span>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
