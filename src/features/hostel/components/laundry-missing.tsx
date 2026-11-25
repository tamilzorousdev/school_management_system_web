import { PackageSearch } from 'lucide-react'
import { DataTable, type Column } from '@/components/common/data-table'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { formatDate } from '@/lib/format'
import { useLaundryMissing, type LaundryMissingRow } from '../api-care'
import { StudentCell } from './leave-form-parts'

export function LaundryMissingSection({
  hostelId,
  onOpenBatch,
}: {
  hostelId?: number
  onOpenBatch: (batchId: number) => void
}) {
  const missing = useLaundryMissing({ hostel_id: hostelId })
  const data = missing.data

  const columns: Column<LaundryMissingRow>[] = [
    {
      key: 'student',
      header: 'Student',
      cell: (row) => <StudentCell student={row.student} />,
    },
    {
      key: 'batch',
      header: 'Batch',
      cell: (row) => (
        <div className='grid gap-0.5'>
          <span className='font-mono text-sm'>{row.batch_no}</span>
          <span className='text-xs text-muted-foreground'>
            Returned {formatDate(row.returned_on)}
          </span>
        </div>
      ),
    },
    {
      key: 'counts',
      header: 'Gave / back',
      hideBelow: 'lg',
      align: 'right',
      cell: (row) => (
        <span className='tabular text-sm'>
          {row.items_given} / {row.items_returned}
        </span>
      ),
    },
    {
      key: 'missing',
      header: 'Missing',
      cell: (row) => (
        <div className='grid gap-0.5'>
          <Badge tone='danger' className='justify-self-start'>
            {row.missing} missing
          </Badge>
          {row.missing_note && (
            <span className='text-xs text-muted-foreground'>{row.missing_note}</span>
          )}
        </div>
      ),
    },
  ]

  return (
    <Card className='overflow-hidden'>
      <div className='flex flex-wrap items-center gap-2 border-b px-4 py-3'>
        <div className='grid gap-0.5'>
          <h2 className='text-sm font-bold'>Missing clothes</h2>
          <p className='text-xs text-muted-foreground'>
            {data
              ? `Batches collected ${formatDate(data.from)} to ${formatDate(data.to)}`
              : 'Batches collected in the last 90 days'}
          </p>
        </div>
        {data && (
          <div className='ml-auto flex flex-wrap gap-1.5'>
            <Badge tone='neutral' className='px-2.5 py-1'>
              Batches <span className='tabular font-extrabold'>{data.batches}</span>
            </Badge>
            <Badge tone='neutral' className='px-2.5 py-1'>
              Clothes <span className='tabular font-extrabold'>{data.items_given}</span>
            </Badge>
            <Badge tone={data.items_missing ? 'danger' : 'success'} className='px-2.5 py-1'>
              Missing <span className='tabular font-extrabold'>{data.items_missing}</span>
            </Badge>
          </div>
        )}
      </div>
      <DataTable
        rows={data?.rows ?? []}
        columns={columns}
        rowKey={(row) => `${row.batch_id}-${row.admission_id}`}
        loading={missing.isFetching}
        error={missing.isError ? missing.error.message : null}
        onRetry={() => missing.refetch()}
        onRowClick={(row) => onOpenBatch(row.batch_id)}
        empty={{
          icon: PackageSearch,
          title: 'Nothing missing',
          description: 'Every returned batch came back complete.',
        }}
        card={(row) => (
          <div className='grid gap-2'>
            <div className='flex items-start justify-between gap-2'>
              <StudentCell student={row.student} />
              <Badge tone='danger' className='shrink-0'>
                {row.missing} missing
              </Badge>
            </div>
            <span className='text-xs text-muted-foreground'>
              <span className='font-mono'>{row.batch_no}</span> · gave {row.items_given}, back{' '}
              {row.items_returned}
              {row.missing_note ? ` · ${row.missing_note}` : ''}
            </span>
          </div>
        )}
      />
    </Card>
  )
}
