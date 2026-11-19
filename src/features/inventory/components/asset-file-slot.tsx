import { useRef, useState } from 'react'
import { FileText, ImageIcon, Paperclip, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toApiError } from '@/lib/api/errors'
import { filesApi } from '@/lib/files'
import { cn } from '@/lib/utils'

export interface FileSlotValue {
  id: number
  name: string
}

export function FileSlot({
  id,
  purpose,
  accept,
  kind,
  value,
  onChange,
  onBusyChange,
}: {
  id: string
  purpose: string
  accept: string
  kind: 'image' | 'document'
  value: FileSlotValue | null
  onChange: (value: FileSlotValue | null) => void
  onBusyChange?: (busy: boolean) => void
}) {
  const input = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const Icon = kind === 'image' ? ImageIcon : FileText

  const upload = async (file?: File) => {
    if (!file) return
    if (file.size > 10 * 1024 * 1024) {
      setError('Choose a file of 10 MB or less')
      return
    }
    setError(null)
    setUploading(true)
    onBusyChange?.(true)
    try {
      const uploaded = await filesApi.upload(file, purpose)
      onChange({ id: uploaded.id, name: uploaded.name || file.name })
    } catch (caught) {
      setError(toApiError(caught).message)
    } finally {
      setUploading(false)
      onBusyChange?.(false)
    }
  }

  return (
    <div className='grid gap-1'>
      <div
        className={cn(
          'flex min-w-0 items-center gap-2 rounded-md border border-dashed px-2 py-1.5',
          error && 'border-destructive'
        )}
      >
        <span className='grid size-8 shrink-0 place-items-center rounded-md bg-primary/10 text-primary'>
          <Icon className='size-4' />
        </span>
        <span className='min-w-0 flex-1 truncate text-sm'>
          {value ? value.name : <span className='text-muted-foreground'>No file</span>}
        </span>
        {value ? (
          <Button
            variant='ghost'
            size='icon-sm'
            aria-label='Remove file'
            onClick={() => onChange(null)}
          >
            <X />
          </Button>
        ) : (
          <Button
            variant='outline'
            size='sm'
            loading={uploading}
            onClick={() => input.current?.click()}
          >
            <Paperclip />
            Attach
          </Button>
        )}
        <input
          ref={input}
          id={id}
          type='file'
          accept={accept}
          className='sr-only'
          onChange={(event) => {
            void upload(event.target.files?.[0])
            event.target.value = ''
          }}
        />
      </div>
      {error && (
        <p role='alert' className='text-xs font-medium text-destructive'>
          {error}
        </p>
      )}
    </div>
  )
}
