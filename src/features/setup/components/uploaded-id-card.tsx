import { useId, useRef, useState } from 'react'
import { Check, FileUp, Loader2, Move, RefreshCw, Trash2, Upload } from 'lucide-react'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { alerts } from '@/lib/alerts'
import { toApiError } from '@/lib/api/errors'
import { filesApi } from '@/lib/files'
import { readDesignPdf, imageSize, type DesignPage } from '@/lib/id-card-detect'
import { defaultIdCardLayout, ID_CARD_LAYOUT_LABELS, type IdCardLayout } from '@/lib/id-card-layout'
import { cn } from '@/lib/utils'
import { setupApi, useSetupMutation, type SchoolProfile } from '../api'
import { IdCardLayoutDialog } from './id-card-layout-dialog'
import { IdCardLayoutView } from './id-card-layout-view'

const ACCEPT = 'application/pdf,image/png,image/jpeg'
const MAX_BYTES = 15 * 1024 * 1024

type Side = 'front' | 'back'

function isPdf(file: File) {
  return file.type === 'application/pdf' || /\.pdf$/i.test(file.name)
}

async function readDesign(file: File, maxPages: number): Promise<DesignPage[]> {
  if (!isPdf(file) && !['image/png', 'image/jpeg'].includes(file.type)) {
    throw new Error('Upload the design as a PDF, PNG or JPG file.')
  }
  if (file.size > MAX_BYTES) throw new Error('The design file must be under 15 MB.')
  const pages = isPdf(file) ? await readDesignPdf(file, maxPages) : [{ file, items: [] }]
  if (!pages.length) throw new Error('This PDF has no pages.')
  return pages
}

function errorMessage(error: unknown) {
  if (error instanceof Error && !('status' in error)) return error.message
  const apiError = toApiError(error)
  return apiError.fieldErrors[0]?.message ?? apiError.message
}

interface UploadedIdCardProps {
  school: SchoolProfile | undefined
  active: boolean
  canManage: boolean
  busy: boolean
  onApply: () => void
}

export function UploadedIdCard({ school, active, canManage, busy, onApply }: UploadedIdCardProps) {
  const [uploading, setUploading] = useState<Side | null>(null)
  const [confirmRemove, setConfirmRemove] = useState<Side | null>(null)
  const [placing, setPlacing] = useState(false)
  const [landscape, setLandscape] = useState(true)
  const mutation = useSetupMutation((input: Partial<SchoolProfile>) => setupApi.updateSchool(input))
  const frontUrl = school?.id_card_front_url ?? null
  const backUrl = school?.id_card_back_url ?? null
  const disabled = !canManage || mutation.isPending || busy
  const layout: IdCardLayout = school?.id_card_layout ?? defaultIdCardLayout(landscape)

  const upload = async (side: Side, file: File) => {
    setUploading(side)
    try {
      const pages = await readDesign(file, side === 'front' ? 2 : 1)
      const size = await imageSize(pages[0]!.file)
      const wide = size.width > size.height
      const [front, back] = await Promise.all(
        pages.map((page) => filesApi.upload(page.file, 'id_card_design'))
      )
      const found = pages.flatMap((page) => page.items)
      const current = school?.id_card_layout ?? defaultIdCardLayout(wide)
      const nextLayout: IdCardLayout =
        side === 'front'
          ? found.length
            ? { front: pages[0]!.items, back: pages[1]?.items ?? (back ? [] : current.back) }
            : current
          : { ...current, back: found.length ? pages[0]!.items : current.back }
      await mutation.mutateAsync(
        side === 'front'
          ? {
              id_card_front_file_id: front!.id,
              ...(back ? { id_card_back_file_id: back.id } : {}),
              id_card_layout: nextLayout,
              id_card_design: 'custom' as const,
            }
          : { id_card_back_file_id: front!.id, id_card_layout: nextLayout }
      )
      setLandscape(wide)
      if (found.length) {
        const names = [...new Set(found.map((item) => ID_CARD_LAYOUT_LABELS[item.key]))]
        alerts.success(
          `Design ready. Each student’s ${names.join(', ')} will print in the matching places.`
        )
      } else if (side === 'front') {
        alerts.info(
          'Design uploaded, but no Name or Photo labels were found in it. Drag the details to the right places.'
        )
        setPlacing(true)
      } else {
        alerts.success('Back design uploaded.')
      }
    } catch (error) {
      alerts.error(errorMessage(error))
    } finally {
      setUploading(null)
    }
  }

  const remove = async (side: Side) => {
    try {
      await mutation.mutateAsync(
        side === 'front'
          ? {
              id_card_front_file_id: null,
              id_card_back_file_id: null,
              id_card_layout: null,
              ...(active ? { id_card_design: 'design1' as const } : {}),
            }
          : { id_card_back_file_id: null }
      )
      setConfirmRemove(null)
      alerts.success(side === 'front' ? 'Uploaded design removed.' : 'Back design removed.')
    } catch (error) {
      alerts.error(errorMessage(error))
    }
  }

  return (
    <Card
      className={cn(
        'grid gap-5 p-4 sm:p-5',
        active && 'border-2 border-primary ring-4 ring-primary/15'
      )}
    >
      <div className='flex flex-wrap items-start justify-between gap-3'>
        <div className='flex items-start gap-3.5'>
          <div className='flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary'>
            <FileUp className='size-6' />
          </div>
          <div className='grid gap-1'>
            <div className='flex flex-wrap items-center gap-2'>
              <h3 className='font-bold text-foreground'>Upload your own ID card design</h3>
              {active && (
                <Badge tone='success' className='gap-1'>
                  <Check className='size-3' /> Active
                </Badge>
              )}
              {frontUrl && !active && <Badge tone='info'>Uploaded, not in use</Badge>}
            </div>
            <p className='text-sm text-muted-foreground'>
              Upload the ID card design from your design team with empty space for the photo and
              details. A PDF with two pages becomes the front and back. Each student’s own photo,
              name, ID, class and address are printed on it.
            </p>
          </div>
        </div>
        {frontUrl && (
          <div className='flex flex-wrap gap-2'>
            <Button
              variant='outline'
              size='sm'
              disabled={disabled}
              onClick={() => setPlacing(true)}
            >
              <Move /> Set where details go
            </Button>
            {!active && (
              <Button size='sm' disabled={disabled} onClick={onApply}>
                Use for ID cards
              </Button>
            )}
          </div>
        )}
      </div>
      <div className='grid gap-4 sm:grid-cols-2'>
        <DesignSlot
          label='Front side'
          hint='PDF, PNG or JPG · up to 15 MB'
          url={frontUrl}
          uploading={uploading === 'front'}
          disabled={disabled || uploading !== null}
          onFile={(file) => void upload('front', file)}
          onRemove={() => setConfirmRemove('front')}
        >
          {frontUrl && (
            <IdCardLayoutView imageUrl={frontUrl} items={layout.front} onLandscape={setLandscape} />
          )}
        </DesignSlot>
        <DesignSlot
          label='Back side'
          hint={frontUrl ? 'Optional · PDF, PNG or JPG' : 'Upload the front side first'}
          url={backUrl}
          uploading={uploading === 'back'}
          disabled={disabled || uploading !== null || !frontUrl}
          onFile={(file) => void upload('back', file)}
          onRemove={() => setConfirmRemove('back')}
        >
          {backUrl && <IdCardLayoutView imageUrl={backUrl} items={layout.back} />}
        </DesignSlot>
      </div>
      {school && frontUrl && (
        <IdCardLayoutDialog
          open={placing}
          onOpenChange={setPlacing}
          school={school}
          layout={layout}
        />
      )}
      <ConfirmDialog
        open={confirmRemove !== null}
        onOpenChange={(open) => !open && setConfirmRemove(null)}
        title={confirmRemove === 'front' ? 'Remove the uploaded design?' : 'Remove the back side?'}
        description={
          confirmRemove === 'front'
            ? 'Both sides are removed. If this design is in use, ID cards go back to Design 1.'
            : 'ID cards will print only the front side.'
        }
        confirmText='Remove'
        destructive
        loading={mutation.isPending}
        onConfirm={() => confirmRemove && void remove(confirmRemove)}
      />
    </Card>
  )
}

interface DesignSlotProps {
  label: string
  hint: string
  url: string | null
  uploading: boolean
  disabled: boolean
  onFile: (file: File) => void
  onRemove: () => void
  children: React.ReactNode
}

function DesignSlot({
  label,
  hint,
  url,
  uploading,
  disabled,
  onFile,
  onRemove,
  children,
}: DesignSlotProps) {
  const id = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const [over, setOver] = useState(false)
  const pick = () => inputRef.current?.click()
  return (
    <div className='grid min-w-0 gap-2'>
      <div className='flex min-h-8 items-center justify-between gap-2'>
        <label htmlFor={id} className='text-sm font-semibold'>
          {label}
        </label>
        {url && (
          <div className='flex gap-1'>
            <Button variant='ghost' size='sm' onClick={pick} disabled={disabled}>
              <RefreshCw /> Replace
            </Button>
            <Button
              variant='ghost'
              size='icon-sm'
              aria-label={`Remove ${label}`}
              onClick={onRemove}
              disabled={disabled}
              className='text-destructive hover:text-destructive'
            >
              <Trash2 />
            </Button>
          </div>
        )}
      </div>
      <input
        ref={inputRef}
        id={id}
        type='file'
        accept={ACCEPT}
        className='sr-only'
        disabled={disabled}
        onChange={(event) => {
          const file = event.target.files?.[0]
          event.target.value = ''
          if (file) onFile(file)
        }}
      />
      {url ? (
        <div className='relative flex min-h-48 items-center justify-center rounded-xl border bg-muted/30 p-3'>
          <div className='w-full max-w-md'>{children}</div>
          {uploading && <Busy />}
        </div>
      ) : (
        <button
          type='button'
          disabled={disabled}
          onClick={pick}
          onDragOver={(event) => {
            event.preventDefault()
            setOver(true)
          }}
          onDragLeave={() => setOver(false)}
          onDrop={(event) => {
            event.preventDefault()
            setOver(false)
            const file = event.dataTransfer.files?.[0]
            if (file && !disabled) onFile(file)
          }}
          className={cn(
            'relative flex h-56 w-full items-center justify-center rounded-xl border-2 border-dashed bg-muted/30 p-3 text-center transition-colors hover:border-primary/60 hover:bg-primary/5 disabled:cursor-not-allowed disabled:hover:border-border disabled:hover:bg-muted/30',
            over && 'border-primary bg-primary/5'
          )}
        >
          <span className='grid justify-items-center gap-2 text-muted-foreground'>
            <Upload className='size-7' />
            <span className='text-sm font-medium text-foreground'>
              Upload {label.toLowerCase()}
            </span>
            <span className='text-xs'>{hint}</span>
          </span>
          {uploading && <Busy />}
        </button>
      )}
    </div>
  )
}

function Busy() {
  return (
    <span className='absolute inset-0 flex items-center justify-center rounded-xl bg-card/70'>
      <Loader2 className='size-6 animate-spin text-primary' />
    </span>
  )
}
