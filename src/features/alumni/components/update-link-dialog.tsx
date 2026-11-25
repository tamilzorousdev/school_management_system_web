import { Link2 } from 'lucide-react'
import { AppModal } from '@/components/common/app-modal'
import { CopyButton } from '@/components/common/display'
import { Button } from '@/components/ui/button'
import { DialogFooter } from '@/components/ui/dialog'
import { formatDateTime } from '@/lib/format'
import type { UpdateLink } from '../api'

export function UpdateLinkDialog({
  link,
  name,
  onOpenChange,
}: {
  link: UpdateLink | null
  name: string
  onOpenChange: (open: boolean) => void
}) {
  const url = link ? `${window.location.origin}/${link.path.replace(/^\/+/, '')}` : ''
  return (
    <AppModal
      open={Boolean(link)}
      onOpenChange={onOpenChange}
      title='Update link ready'
      description={`Send this link to ${name}. They can correct their contact and career details; you approve the changes before they apply.`}
      footer={
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Done</Button>
        </DialogFooter>
      }
    >
      {link && (
        <div className='grid gap-3'>
          <div className='flex flex-col gap-2 rounded-lg border bg-muted/40 p-3 sm:flex-row sm:items-center'>
            <Link2 className='hidden size-4 shrink-0 text-muted-foreground sm:block' />
            <code className='min-w-0 flex-1 font-mono text-xs break-all'>{url}</code>
            <CopyButton value={url} label='Copy link' />
          </div>
          <p className='text-xs text-muted-foreground'>
            Works once, until {formatDateTime(link.expires_at)}. Any earlier link for this person
            has stopped working.
          </p>
        </div>
      )}
    </AppModal>
  )
}
