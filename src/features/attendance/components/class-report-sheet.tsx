import { useState } from 'react'
import { Download, LayoutGrid } from 'lucide-react'
import { Combobox } from '@/components/common/combobox'
import { DataTable, type Column } from '@/components/common/data-table'
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
import { alerts } from '@/lib/alerts'
import { toApiError } from '@/lib/api/errors'
import { useClasses } from '@/features/setup/api'
import { attendanceApi, useClassReport, type ClassReportSection } from '../api'
import { percentLabel, percentTone, recentMonths } from '../labels'

export function ClassReportSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const months = recentMonths()
  const [month, setMonth] = useState(months[0].value)
  const classes = useClasses(open)
  const options = (classes.data ?? [])
    .filter((item) => item.sections.length > 0)
    .map((item) => ({ value: String(item.id), label: `Class ${item.name}` }))
  const [classId, setClassId] = useState<number | undefined>()
  const chosen = classId ?? (options[0] ? Number(options[0].value) : undefined)
  const report = useClassReport(open ? chosen : undefined, month)
  const data = report.data
  const [downloading, setDownloading] = useState(false)

  const columns: Column<ClassReportSection>[] = [
    {
      key: 'name',
      header: 'Section',
      cell: (row) => <span className='font-semibold'>{row.name}</span>,
    },
    { key: 'students', header: 'Students', align: 'right', cell: (row) => row.students },
    { key: 'days', header: 'Days marked', align: 'right', cell: (row) => row.marked_days },
    {
      key: 'below',
      header: 'Below 75%',
      align: 'right',
      cell: (row) => (row.below_75 ? <Badge tone='danger'>{row.below_75}</Badge> : <span>0</span>),
    },
    {
      key: 'percent',
      header: 'Average',
      align: 'right',
      cell: (row) => <Badge tone={percentTone(row.percent)}>{percentLabel(row.percent)}</Badge>,
    },
  ]

  return (
    <Sheet open={open} onOpenChange={(next) => !next && onClose()}>
      <SheetContent className='sm:max-w-2xl'>
        <SheetHeader>
          <SheetTitle>Class-wise report</SheetTitle>
          <SheetDescription>
            Every section of a class for a month. Each day counts both sessions; absent in one is a
            half day.
          </SheetDescription>
        </SheetHeader>
        <SheetBody className='grid content-start gap-4'>
          <div className='flex flex-wrap items-center gap-2'>
            <Combobox
              id='class-report-class'
              label='Class'
              value={chosen ? String(chosen) : undefined}
              placeholder='Choose class'
              searchPlaceholder='Search classes'
              options={options}
              onChange={(value) => value && setClassId(Number(value))}
              highlightSelected={false}
            />
            <Combobox
              id='class-report-month'
              label='Month'
              value={month}
              placeholder='Choose month'
              searchPlaceholder='Search months'
              options={months}
              onChange={(value) => value && setMonth(value)}
              highlightSelected={false}
            />
            <Button
              variant='outline'
              size='sm'
              className='ml-auto'
              disabled={!data}
              loading={downloading}
              onClick={async () => {
                if (!data) return
                setDownloading(true)
                try {
                  await attendanceApi.downloadClassReport(data.class.id, month, data.class.name)
                } catch (error) {
                  alerts.error(toApiError(error).message)
                } finally {
                  setDownloading(false)
                }
              }}
            >
              <Download />
              Excel
            </Button>
          </div>
          {data && (
            <div className='grid grid-cols-3 gap-2 text-center'>
              <div className='rounded-lg border p-3'>
                <p className='text-xs text-muted-foreground'>Students</p>
                <p className='text-lg font-bold'>{data.students}</p>
              </div>
              <div className='rounded-lg border p-3'>
                <p className='text-xs text-muted-foreground'>Class average</p>
                <p className='text-lg font-bold'>{percentLabel(data.percent)}</p>
              </div>
              <div className='rounded-lg border p-3'>
                <p className='text-xs text-muted-foreground'>Below 75%</p>
                <p className='text-lg font-bold'>{data.below_75}</p>
              </div>
            </div>
          )}
          <div className='overflow-hidden rounded-lg border'>
            <DataTable
              rows={data?.sections ?? []}
              columns={columns}
              rowKey={(row) => row.section_id}
              loading={report.isFetching || classes.isPending}
              error={report.isError ? report.error.message : null}
              onRetry={() => report.refetch()}
              empty={{
                icon: LayoutGrid,
                title: 'No sections',
                description: 'This class has no sections this year.',
              }}
              card={(row) => (
                <div className='flex items-center justify-between gap-2'>
                  <span className='grid'>
                    <span className='font-semibold'>{row.name}</span>
                    <span className='text-xs text-muted-foreground'>
                      {row.students} students · {row.marked_days} days · {row.below_75} below 75%
                    </span>
                  </span>
                  <Badge tone={percentTone(row.percent)}>{percentLabel(row.percent)}</Badge>
                </div>
              )}
            />
          </div>
        </SheetBody>
      </SheetContent>
    </Sheet>
  )
}
