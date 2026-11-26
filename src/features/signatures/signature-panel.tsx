import { useState } from 'react'
import { History, PenLine, Trash } from 'lucide-react'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import { ErrorState } from '@/components/common/display'
import { SignatureModal } from '@/components/common/signature-modal'
import { Badge, type BadgeTone } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { alerts } from '@/lib/alerts'
import { toApiError } from '@/lib/api/errors'
import { formatDateTime } from '@/lib/format'
import {
  useSetSignature,
  useSignature,
  useSignatureAgain,
  type SignatureAction,
  type SignatureChange,
  type SignatureOwner,
} from './api'

const ACTION_LABELS: Record<SignatureAction, string> = {
  added: 'Added',
  changed: 'Changed',
  removed: 'Removed',
}

const ACTION_TONES: Record<SignatureAction, BadgeTone> = {
  added: 'success',
  changed: 'info',
  removed: 'danger',
}

const HISTORY_SHOWN = 5

export function SignaturePanel({
  owner,
  ownerId,
  canManage,
}: {
  owner: SignatureOwner
  ownerId: number
  canManage: boolean
}) {
  const signature = useSignature(owner, ownerId)
  const save = useSetSignature(owner, ownerId)
  const [signing, setSigning] = useState(false)
  const [removing, setRemoving] = useState(false)
  const [reusing, setReusing] = useState<SignatureChange | null>(null)
  const [showAll, setShowAll] = useState(false)
  const again = useSignatureAgain(owner, ownerId)
  const label = owner === 'staff' ? 'teacher' : 'parent'
  const data = signature.data

  if (signature.isError && !data)
    return <ErrorState message={signature.error.message} onRetry={() => signature.refetch()} />
  if (!data) return <Skeleton className='h-28' />

  return (
    <div className='grid gap-4'>
      <div className='flex flex-wrap items-center gap-4'>
        <div className='grid h-16 w-40 shrink-0 place-items-center overflow-hidden rounded-xl border bg-white p-2'>
          {data.signature_url ? (
            <img
              src={data.signature_url}
              alt={`${data.owner.name} signature`}
              className='size-full object-contain'
            />
          ) : (
            <PenLine className='size-5 stroke-[1.75] text-slate-400 dark:text-slate-500' aria-hidden />
          )}
        </div>
        <div className='grid min-w-0 flex-1 gap-1 text-sm'>
          <span className='font-semibold'>
            {data.signature_url ? 'Signature on file' : 'No signature yet'}
          </span>
          <span className='text-xs text-muted-foreground'>
            {data.updated_at
              ? `Last change ${formatDateTime(data.updated_at)}`
              : `Shown on report cards only after the ${label} signs them.`}
          </span>
        </div>
        {canManage && (
          <div className='flex flex-wrap gap-2'>
            <Button
              variant='secondary'
              size='sm'
              className='border-[#C6CEC9] bg-white text-[#171B19] hover:bg-[#F9FAFB]'
              onClick={() => setSigning(true)}
            >
              <PenLine className='size-3.5 stroke-[1.75] text-[#3C4440] dark:text-slate-300' />
              {data.signature_url ? 'Change signature' : 'Add signature'}
            </Button>
            {data.signature_url && (
              <Button
                variant='ghost'
                size='sm'
                className='text-destructive hover:bg-destructive/10'
                onClick={() => setRemoving(true)}
              >
                <Trash className='size-3.5 stroke-[1.75]' />
                Remove
              </Button>
            )}
          </div>
        )}
      </div>

      <div className='grid gap-2'>
        <h4 className='text-xs font-bold tracking-wider text-muted-foreground uppercase'>
          Change history
        </h4>
        {data.history.length === 0 ? (
          <p className='text-sm text-muted-foreground'>No changes yet.</p>
        ) : (
          <ul className='grid gap-2'>
            {(showAll ? data.history : data.history.slice(0, HISTORY_SHOWN)).map((change) => (
              <HistoryRow
                key={change.id}
                change={change}
                onUseAgain={
                  canManage && change.can_use_again ? () => setReusing(change) : undefined
                }
              />
            ))}
          </ul>
        )}
        {data.history.length > HISTORY_SHOWN && (
          <Button
            variant='ghost'
            size='sm'
            className='justify-self-start'
            onClick={() => setShowAll((value) => !value)}
          >
            {showAll ? 'Show latest 5 only' : `Show all (${data.history.length})`}
          </Button>
        )}
      </div>

      {signing && (
        <SignatureModal
          title={`${data.owner.name} signature`}
          onSave={async (fileId) => {
            await save.mutateAsync(fileId)
            alerts.success('Signature saved. Report cards signed this year now show it.')
          }}
          onClose={() => setSigning(false)}
        />
      )}
      <ConfirmDialog
        open={removing}
        onOpenChange={setRemoving}
        title='Remove this signature?'
        description={`Report cards already signed keep the old signature. The ${label} must add a new one before signing again.`}
        confirmText='Remove'
        destructive
        loading={save.isPending}
        onConfirm={async () => {
          try {
            await save.mutateAsync(null)
            alerts.success('Signature removed')
            setRemoving(false)
          } catch (caught) {
            alerts.error(toApiError(caught).message)
          }
        }}
      />
      <ConfirmDialog
        open={Boolean(reusing)}
        onOpenChange={(open) => !open && setReusing(null)}
        title='Use this signature again?'
        description={
          <span className='grid gap-3'>
            {reusing && (
              <span className='grid h-16 w-40 place-items-center overflow-hidden rounded-xl border bg-white p-2'>
                <img
                  src={(reusing.new_url ?? reusing.old_url) || ''}
                  alt='Earlier signature'
                  className='size-full object-contain'
                />
              </span>
            )}
            It becomes the current signature. Report cards signed this year switch to it.
          </span>
        }
        confirmText='Use this again'
        loading={again.isPending}
        onConfirm={async () => {
          if (!reusing) return
          try {
            await again.mutateAsync(reusing.id)
            alerts.success('Earlier signature is in use again')
            setReusing(null)
          } catch (caught) {
            alerts.error(toApiError(caught).message)
          }
        }}
      />
    </div>
  )
}

function HistoryRow({ change, onUseAgain }: { change: SignatureChange; onUseAgain?: () => void }) {
  const image = change.new_url ?? change.old_url
  return (
    <li className='flex flex-wrap items-center gap-3 rounded-lg border p-3'>
      <div className='grid h-10 w-24 shrink-0 place-items-center overflow-hidden rounded-md border bg-white p-1'>
        {image ? (
          <img
            src={image}
            alt=''
            className={
              change.action === 'removed'
                ? 'size-full object-contain opacity-40'
                : 'size-full object-contain'
            }
          />
        ) : null}
      </div>
      <div className='grid min-w-0 flex-1 gap-0.5'>
        <div className='flex flex-wrap items-center gap-1.5'>
          <Badge tone={ACTION_TONES[change.action]}>{ACTION_LABELS[change.action]}</Badge>
          {change.by_admin && <Badge tone='warning'>By school office</Badge>}
        </div>
        <span className='text-xs text-muted-foreground'>
          {formatDateTime(change.at)}
          {change.changed_by ? ` · ${change.changed_by.name}` : ''}
          {change.note ? ` · ${change.note}` : ''}
        </span>
      </div>
      {onUseAgain && (
        <Button variant='outline' size='sm' onClick={onUseAgain}>
          <History />
          Use this again
        </Button>
      )}
    </li>
  )
}
