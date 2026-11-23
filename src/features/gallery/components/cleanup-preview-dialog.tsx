import { AlertTriangle } from 'lucide-react'
import { AppModal } from '@/components/common/app-modal'
import { ErrorState } from '@/components/common/display'
import { Button } from '@/components/ui/button'
import { DialogFooter } from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDate } from '@/lib/format'
import type { CleanupPreview } from '../api'
import { formatStorage, PREVIEW_ACTION_LABELS } from '../labels'

export function CleanupPreviewDialog({
  open,
  preview,
  loading,
  error,
  running,
  onRetry,
  onClose,
  onRun,
}: {
  open: boolean
  preview?: CleanupPreview
  loading: boolean
  error: string | null
  running: boolean
  onRetry: () => void
  onClose: () => void
  onRun: () => void
}) {
  const nothing =
    preview &&
    !preview.to_mark &&
    !preview.to_trash &&
    !preview.to_purge &&
    !preview.albums_to_trash &&
    !preview.albums_to_purge

  return (
    <AppModal
      open={open}
      onOpenChange={(next) => !next && onClose()}
      title='Run the cleanup now?'
      description='This is what a run would do right now. Nothing has changed yet.'
      size='lg'
      loading={running}
      footer={
        <DialogFooter>
          <Button variant='outline' onClick={onClose} disabled={running}>
            Cancel
          </Button>
          <Button
            variant={preview?.to_purge ? 'destructive' : 'default'}
            onClick={onRun}
            loading={running}
            disabled={!preview}
          >
            Run cleanup
          </Button>
        </DialogFooter>
      }
    >
      {error ? (
        <ErrorState message={error} onRetry={onRetry} />
      ) : loading || !preview ? (
        <div className='grid gap-2'>
          <Skeleton className='h-16' />
          <Skeleton className='h-32' />
        </div>
      ) : (
        <div className='grid gap-4'>
          <dl className='grid grid-cols-2 gap-2 sm:grid-cols-4'>
            {[
              { label: 'Checked', value: preview.scanned },
              { label: 'Get the notice', value: preview.to_mark },
              { label: 'Move to Trash', value: preview.to_trash },
              { label: 'Deleted for good', value: preview.to_purge },
              { label: 'Albums to Trash', value: preview.albums_to_trash },
              { label: 'Albums deleted', value: preview.albums_to_purge },
              { label: 'Kept by a hold', value: preview.held },
              { label: 'Space freed', value: formatStorage(preview.bytes_to_reclaim) },
            ].map((item) => (
              <div key={item.label} className='grid gap-0.5 rounded-lg border p-2.5'>
                <dt className='text-[11px] font-semibold text-muted-foreground'>{item.label}</dt>
                <dd className='tabular text-lg font-extrabold'>{item.value}</dd>
              </div>
            ))}
          </dl>
          {(!preview.auto_trash_enabled || !preview.permanent_delete_enabled) && (
            <p className='flex items-start gap-2 rounded-md border border-warning/30 bg-warning/10 px-3 py-2 text-xs text-warning'>
              <AlertTriangle className='mt-0.5 size-3.5 shrink-0' aria-hidden />
              {!preview.auto_trash_enabled &&
                'Automatic Trash is off, so nothing is marked or moved. '}
              {!preview.permanent_delete_enabled && 'Permanent deletion is off, so Trash is kept.'}
            </p>
          )}
          {nothing ? (
            <p className='text-sm text-muted-foreground'>
              Nothing is due. A run still recalculates retention dates and tidies leftover files.
            </p>
          ) : (
            <div className='max-h-64 overflow-y-auto rounded-lg border'>
              <ul className='divide-y text-sm'>
                {preview.items.map((item) => (
                  <li
                    key={`${item.action}-${item.id}`}
                    className='flex flex-wrap items-center gap-x-3 gap-y-0.5 px-3 py-2'
                  >
                    <span className='min-w-0 flex-1 truncate font-medium'>{item.name}</span>
                    <span className='text-xs text-muted-foreground'>
                      {PREVIEW_ACTION_LABELS[item.action] ?? item.action}
                      {item.album_title ? ` · ${item.album_title}` : ''}
                      {item.due_at ? ` · ${formatDate(item.due_at)}` : ''}
                    </span>
                    <span className='tabular text-xs text-muted-foreground'>
                      {formatStorage(item.size_bytes)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </AppModal>
  )
}
