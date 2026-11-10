import { useState } from 'react'
import { ClipboardCheck } from 'lucide-react'
import { Combobox } from '@/components/common/combobox'
import { DataTable, type Column } from '@/components/common/data-table'
import { Badge } from '@/components/ui/badge'
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { formatDate } from '@/lib/format'
import { useMissedReport, type MissedTeacher } from '../api'
import { recentMonths } from '../labels'

const SESSION_LABEL = { morning: 'Morning', afternoon: 'Afternoon' } as const

export function MissedReportSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const months = recentMonths()
  const [month, setMonth] = useState(months[0].value)
  const report = useMissedReport(month, open)
  const data = report.data

  const sessionsText = (row: MissedTeacher) =>
    row.sessions
      .slice(0, 4)
      .map((item) => `${item.section} · ${formatDate(item.date)} ${SESSION_LABEL[item.session]}`)
      .join(', ') + (row.sessions.length > 4 ? ` and ${row.sessions.length - 4} more` : '')

  const columns: Column<MissedTeacher>[] = [
    {
      key: 'teacher',
      header: 'Class teacher',
      cell: (row) => <span className='font-semibold'>{row.teacher}</span>,
    },
    {
      key: 'missed',
      header: 'Missed',
      align: 'right',
      cell: (row) => <Badge tone='danger'>{row.missed}</Badge>,
    },
    {
      key: 'still',
      header: 'Still not marked',
      align: 'right',
      hideBelow: 'lg',
      cell: (row) => row.sessions.filter((item) => item.still_not_marked).length,
    },
    {
      key: 'sessions',
      header: 'Sessions',
      hideBelow: 'lg',
      cell: (row) => <span className='text-xs text-muted-foreground'>{sessionsText(row)}</span>,
    },
  ]

  return (
    <Sheet open={open} onOpenChange={(next) => !next && onClose()}>
      <SheetContent className='sm:max-w-2xl'>
        <SheetHeader>
          <SheetTitle>Missed attendance</SheetTitle>
          <SheetDescription>
            Sessions the class side did not mark before the 1st or 5th period ended plus the{' '}
            {data?.grace_minutes ?? 15} minute grace. Sundays and holidays are left out.
          </SheetDescription>
        </SheetHeader>
        <SheetBody className='grid content-start gap-4'>
          <Combobox
            id='missed-report-month'
            label='Month'
            value={month}
            placeholder='Choose month'
            searchPlaceholder='Search months'
            options={months}
            onChange={(value) => value && setMonth(value)}
            highlightSelected={false}
          />
          {data && (
            <div className='grid grid-cols-2 gap-2 text-center'>
              <div className='rounded-lg border p-3'>
                <p className='text-xs text-muted-foreground'>Sessions missed</p>
                <p className='text-lg font-bold'>{data.total_missed}</p>
              </div>
              <div className='rounded-lg border p-3'>
                <p className='text-xs text-muted-foreground'>Teachers</p>
                <p className='text-lg font-bold'>{data.teachers.length}</p>
              </div>
            </div>
          )}
          <div className='overflow-hidden rounded-lg border'>
            <DataTable
              rows={data?.teachers ?? []}
              columns={columns}
              rowKey={(row) => String(row.teacher_id ?? 'none')}
              loading={report.isFetching}
              error={report.isError ? report.error.message : null}
              onRetry={() => report.refetch()}
              empty={{
                icon: ClipboardCheck,
                title: 'Nothing missed',
                description: 'Every session this month was marked on time.',
              }}
              card={(row) => (
                <div className='grid gap-1'>
                  <div className='flex items-center justify-between gap-2'>
                    <span className='font-semibold'>{row.teacher}</span>
                    <Badge tone='danger'>{row.missed} missed</Badge>
                  </div>
                  <span className='text-xs text-muted-foreground'>{sessionsText(row)}</span>
                </div>
              )}
            />
          </div>
        </SheetBody>
      </SheetContent>
    </Sheet>
  )
}
