import { useState } from 'react'
import { FileSpreadsheet, ListX, RotateCcw } from 'lucide-react'
import { DataTable, type Column } from '@/components/common/data-table'
import { DetailList } from '@/components/common/display'
import { FilterSelect } from '@/components/common/list-toolbar'
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
import { alerts } from '@/lib/alerts'
import { toApiError } from '@/lib/api/errors'
import { downloadFile } from '@/lib/files'
import { formatDateTime } from '@/lib/format'
import {
  galleryApi,
  useCleanupJob,
  useCleanupJobItems,
  useGalleryMutation,
  type CleanupJobItem,
  type ExportFormat,
  type JobAction,
} from '../api'
import {
  formatStorage,
  JOB_ACTION_LABELS,
  JOB_ACTION_OPTIONS,
  JOB_STATUS,
  JOB_TRIGGER_LABELS,
} from '../labels'

const LIMIT = 25

export function JobDetailSheet({
  jobId,
  action,
  page,
  canConfigure,
  onChange,
  onClose,
}: {
  jobId?: number
  action?: JobAction
  page: number
  canConfigure: boolean
  onChange: (patch: { action?: JobAction; item_page?: number }) => void
  onClose: () => void
}) {
  const [shown, setShown] = useState(jobId)
  if (jobId && jobId !== shown) setShown(jobId)
  const job = useCleanupJob(shown)
  const items = useCleanupJobItems(shown, { page, limit: LIMIT, action })
  const retry = useGalleryMutation(galleryApi.retryJob)
  const [exporting, setExporting] = useState<ExportFormat | null>(null)
  const data = job.data
  const rows = items.data?.items ?? []

  const exportJob = async (format: ExportFormat) => {
    if (!shown) return
    setExporting(format)
    try {
      await downloadFile(galleryApi.jobExportUrl(shown), `gallery-cleanup-${shown}.${format}`, {
        format,
      })
    } catch (error) {
      alerts.error(toApiError(error).message)
    } finally {
      setExporting(null)
    }
  }

  const columns: Column<CleanupJobItem>[] = [
    {
      key: 'name',
      header: 'Item',
      cell: (item) => (
        <div className='grid min-w-0'>
          <span className='truncate font-semibold'>
            {item.name ?? `#${item.media_id ?? item.album_id ?? item.id}`}
          </span>
          {item.error && <span className='text-xs text-destructive'>{item.error}</span>}
        </div>
      ),
    },
    {
      key: 'action',
      header: 'Action',
      cell: (item) => (
        <Badge tone={item.action === 'failed' ? 'danger' : 'neutral'}>
          {JOB_ACTION_LABELS[item.action]}
        </Badge>
      ),
    },
    {
      key: 'size',
      header: 'Size',
      align: 'right',
      cell: (item) => <span className='tabular'>{formatStorage(item.size_bytes)}</span>,
    },
  ]

  return (
    <Sheet open={Boolean(jobId)} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className='sm:max-w-2xl'>
        <SheetHeader>
          <SheetTitle>Cleanup run #{shown}</SheetTitle>
          <SheetDescription>
            {data
              ? `${JOB_TRIGGER_LABELS[data.trigger]} · started ${formatDateTime(data.started_at)}`
              : 'Loading…'}
          </SheetDescription>
        </SheetHeader>
        <SheetBody className='grid content-start gap-5'>
          {!data ? (
            <Skeleton className='h-40' />
          ) : (
            <>
              <div className='flex flex-wrap items-center gap-2'>
                <Badge tone={JOB_STATUS[data.status].tone} dot>
                  {JOB_STATUS[data.status].label}
                </Badge>
                <span className='ml-auto flex flex-wrap gap-2'>
                  {canConfigure && data.retryable > 0 && (
                    <Button
                      size='sm'
                      loading={retry.isPending}
                      onClick={async () => {
                        try {
                          const next = await retry.mutateAsync(data.id)
                          alerts.success(
                            `Retry finished · ${next.purged} deleted, ${next.failed} failed`
                          )
                        } catch (error) {
                          alerts.error(toApiError(error).message)
                        }
                      }}
                    >
                      <RotateCcw />
                      Retry {data.retryable} failed
                    </Button>
                  )}
                  <Button
                    variant='outline'
                    size='sm'
                    loading={exporting === 'xlsx'}
                    onClick={() => void exportJob('xlsx')}
                  >
                    <FileSpreadsheet />
                    Excel
                  </Button>
                  <Button
                    variant='outline'
                    size='sm'
                    loading={exporting === 'csv'}
                    onClick={() => void exportJob('csv')}
                  >
                    CSV
                  </Button>
                </span>
              </div>
              {data.error && (
                <p className='rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive'>
                  {data.error}
                </p>
              )}
              <DetailList
                className='grid-cols-2 sm:grid-cols-3'
                items={[
                  { label: 'Checked', value: data.scanned },
                  { label: 'Marked', value: data.marked },
                  { label: 'Unmarked', value: data.unmarked },
                  { label: 'Moved to Trash', value: data.trashed },
                  { label: 'Deleted for good', value: data.purged },
                  { label: 'Failed', value: data.failed },
                  { label: 'Kept by a hold', value: data.held },
                  { label: 'Albums to Trash', value: data.albums_trashed },
                  { label: 'Albums deleted', value: data.albums_purged },
                  { label: 'Leftover files removed', value: data.orphans_removed },
                  { label: 'Upload records cleared', value: data.uploads_cleared },
                  { label: 'Space freed', value: formatStorage(data.bytes_reclaimed) },
                  {
                    label: 'Duration',
                    value:
                      data.duration_ms === null
                        ? 'Running'
                        : `${(data.duration_ms / 1000).toFixed(1)} s`,
                  },
                  { label: 'Started by', value: data.triggered_by_name ?? 'Schedule' },
                  {
                    label: 'Storage after',
                    value:
                      data.storage_bytes_after === null
                        ? '—'
                        : formatStorage(data.storage_bytes_after),
                  },
                ]}
              />
            </>
          )}
          <div className='grid gap-2'>
            <div className='flex flex-wrap items-center gap-2'>
              <h3 className='text-sm font-bold'>Items</h3>
              <span className='ml-auto'>
                <FilterSelect
                  id='job-action'
                  label='Filter by action'
                  allLabel='All actions'
                  value={action}
                  options={JOB_ACTION_OPTIONS}
                  onChange={(value) =>
                    onChange({ action: value as JobAction | undefined, item_page: 1 })
                  }
                />
              </span>
            </div>
            <div className='overflow-hidden rounded-lg border'>
              <DataTable
                rows={rows}
                columns={columns}
                rowKey={(item) => item.id}
                loading={items.isFetching}
                error={items.isError ? items.error.message : null}
                onRetry={() => items.refetch()}
                empty={{
                  icon: ListX,
                  title: 'No items',
                  description: 'This run changed nothing of this kind.',
                }}
                card={(item) => (
                  <div className='grid gap-1'>
                    <span className='truncate font-semibold'>
                      {item.name ?? `#${item.media_id ?? item.album_id ?? item.id}`}
                    </span>
                    <span className='text-xs text-muted-foreground'>
                      {JOB_ACTION_LABELS[item.action]} · {formatStorage(item.size_bytes)}
                    </span>
                    {item.error && <span className='text-xs text-destructive'>{item.error}</span>}
                  </div>
                )}
                pagination={{
                  page,
                  limit: LIMIT,
                  total: items.data?.total ?? 0,
                  label: 'items',
                  onPageChange: (next) => onChange({ item_page: next }),
                }}
              />
            </div>
          </div>
        </SheetBody>
      </SheetContent>
    </Sheet>
  )
}
