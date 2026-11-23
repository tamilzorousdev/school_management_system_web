import { useState } from 'react'
import {
  CheckCircle2,
  CircleAlert,
  Copy,
  FileImage,
  FileVideo,
  Loader2,
  RotateCcw,
  UploadCloud,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { alerts } from '@/lib/alerts'
import { cn } from '@/lib/utils'
import { formatStorage, type UploadRules } from '../labels'
import { useUploadQueue, type UploadTask } from '../use-upload-queue'

export function UploadPanel({
  albumId,
  rules,
  onUploaded,
}: {
  albumId: number
  rules: UploadRules | null
  onUploaded: () => void
}) {
  const [dragging, setDragging] = useState(false)
  const queue = useUploadQueue(albumId, onUploaded)
  const failed = queue.tasks.filter((task) => task.state === 'failed').length
  const finished = queue.tasks.filter(
    (task) => task.state !== 'queued' && task.state !== 'uploading'
  ).length

  const addFiles = (list: FileList | null) => {
    if (!list?.length || !rules) return
    const files = Array.from(list)
    if (files.length > rules.maxFiles) {
      alerts.warning(`Add up to ${rules.maxFiles} files at a time`, {
        description: `The first ${rules.maxFiles} were added.`,
      })
    }
    const created = queue.add(files.slice(0, rules.maxFiles), rules)
    const rejected = created.filter((task) => task.state === 'rejected').length
    if (rejected)
      alerts.warning(`${rejected} ${rejected === 1 ? 'file was' : 'files were'} skipped`)
  }

  return (
    <Card className='gap-3 p-4'>
      <label
        htmlFor='gallery-upload-input'
        onDragOver={(event) => {
          event.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault()
          setDragging(false)
          addFiles(event.dataTransfer.files)
        }}
        className={cn(
          'flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed px-4 py-6 text-center transition-colors focus-within:ring-[3px] focus-within:ring-ring/40',
          dragging ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/50',
          !rules && 'pointer-events-none opacity-60'
        )}
      >
        <span className='grid size-11 place-items-center rounded-full bg-primary/10 text-primary'>
          <UploadCloud className='size-5' aria-hidden />
        </span>
        <span className='text-sm font-semibold'>
          Drop photos and videos here, or{' '}
          <span className='text-primary underline'>choose files</span>
        </span>
        <span className='max-w-md text-xs text-muted-foreground'>
          {rules
            ? `${rules.summary} Up to ${rules.maxFiles} files at a time.`
            : 'Loading upload limits…'}
        </span>
        <input
          id='gallery-upload-input'
          type='file'
          multiple
          accept={rules?.accept}
          className='sr-only'
          disabled={!rules}
          onChange={(event) => {
            addFiles(event.target.files)
            event.target.value = ''
          }}
        />
      </label>

      {queue.tasks.length > 0 && (
        <div className='grid gap-2'>
          <div className='flex flex-wrap items-center gap-2 text-xs text-muted-foreground'>
            <span className='tabular'>
              {finished} of {queue.tasks.length} done
            </span>
            <span className='ml-auto flex gap-1'>
              {failed > 0 && (
                <Button variant='outline' size='sm' onClick={queue.retryFailed}>
                  <RotateCcw />
                  Retry {failed} failed
                </Button>
              )}
              {finished > 0 && (
                <Button variant='ghost' size='sm' onClick={queue.clearFinished}>
                  Clear finished
                </Button>
              )}
            </span>
          </div>
          <ul className='grid max-h-72 gap-1.5 overflow-y-auto pr-1' aria-live='polite'>
            {queue.tasks.map((task) => (
              <TaskRow key={task.key} task={task} onRetry={() => queue.retry(task.key)} />
            ))}
          </ul>
        </div>
      )}
    </Card>
  )
}

function TaskRow({ task, onRetry }: { task: UploadTask; onRetry: () => void }) {
  const Icon = task.file.type.startsWith('video/') ? FileVideo : FileImage
  return (
    <li className='grid gap-1.5 rounded-lg border bg-card px-3 py-2'>
      <div className='flex min-w-0 items-center gap-2 text-sm'>
        <Icon className='size-4 shrink-0 text-muted-foreground' aria-hidden />
        <span className='min-w-0 flex-1 truncate font-medium' title={task.file.name}>
          {task.file.name}
        </span>
        <span className='tabular shrink-0 text-xs text-muted-foreground'>
          {formatStorage(task.file.size)}
        </span>
        <StateIcon task={task} />
        {task.state === 'failed' && (
          <Button
            variant='ghost'
            size='icon-sm'
            aria-label={`Retry ${task.file.name}`}
            onClick={onRetry}
          >
            <RotateCcw />
          </Button>
        )}
      </div>
      {task.state === 'uploading' && (
        <div
          className='h-1.5 overflow-hidden rounded-full bg-muted'
          role='progressbar'
          aria-label={`Uploading ${task.file.name}`}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(task.progress * 100)}
        >
          <div
            className='h-full rounded-full bg-primary transition-[width]'
            style={{ width: `${Math.max(3, Math.round(task.progress * 100))}%` }}
          />
        </div>
      )}
      {task.message && (
        <p
          className={cn(
            'text-xs',
            task.state === 'duplicate' ? 'text-warning' : 'font-medium text-destructive'
          )}
        >
          {task.message}
        </p>
      )}
    </li>
  )
}

function StateIcon({ task }: { task: UploadTask }) {
  if (task.state === 'uploading')
    return (
      <span className='tabular inline-flex shrink-0 items-center gap-1 text-xs text-primary'>
        <Loader2 className='size-3.5 animate-spin' aria-hidden />
        {Math.round(task.progress * 100)}%
      </span>
    )
  if (task.state === 'queued')
    return <span className='shrink-0 text-xs text-muted-foreground'>Waiting</span>
  if (task.state === 'accepted')
    return (
      <span className='inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-success'>
        <CheckCircle2 className='size-3.5' aria-hidden />
        Added
      </span>
    )
  if (task.state === 'duplicate')
    return (
      <span className='inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-warning'>
        <Copy className='size-3.5' aria-hidden />
        Duplicate
      </span>
    )
  return (
    <span className='inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-destructive'>
      <CircleAlert className='size-3.5' aria-hidden />
      {task.state === 'rejected' ? 'Skipped' : 'Failed'}
    </span>
  )
}
