import { useRef, useState } from 'react'
import { Camera, ImageUp, PenLine } from 'lucide-react'
import { AppModal } from '@/components/common/app-modal'
import { SegmentedControl } from '@/components/common/segmented-control'
import { SignaturePad, type SignaturePadHandle } from '@/components/common/signature-pad'
import { Button } from '@/components/ui/button'
import { toApiError } from '@/lib/api/errors'
import { filesApi } from '@/lib/files'

type Mode = 'draw' | 'photo'

const PHOTO_TYPES = ['image/png', 'image/jpeg', 'image/webp']
const MAX_PHOTO_MB = 5

export function SignatureModal({
  title,
  photoPurpose = 'signature',
  onSave,
  onClose,
}: {
  title: string
  photoPurpose?: string
  onSave: (fileId: number) => Promise<void>
  onClose: () => void
}) {
  const [mode, setMode] = useState<Mode>('draw')
  const [empty, setEmpty] = useState(true)
  const [photo, setPhoto] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const pad = useRef<SignaturePadHandle>(null)

  const choosePhoto = (file: File | undefined) => {
    setError('')
    if (!file) return
    if (!PHOTO_TYPES.includes(file.type)) return setError('Choose a JPG, PNG or WEBP photo')
    if (file.size > MAX_PHOTO_MB * 1024 * 1024)
      return setError(`The photo must be ${MAX_PHOTO_MB} MB or smaller`)
    if (preview) URL.revokeObjectURL(preview)
    setPhoto(file)
    setPreview(URL.createObjectURL(file))
  }

  const save = async () => {
    setError('')
    setSaving(true)
    try {
      if (mode === 'draw') {
        const blob = await pad.current?.toBlob()
        if (!blob) return setError('Sign inside the box first')
        const uploaded = await filesApi.upload(
          new File([blob], 'signature.png', { type: 'image/png' }),
          'signature_pad'
        )
        await onSave(uploaded.id)
      } else {
        if (!photo) return setError('Choose a photo of your signature first')
        const uploaded = await filesApi.upload(photo, photoPurpose)
        await onSave(uploaded.id)
      }
      onClose()
    } catch (caught) {
      setError(toApiError(caught).message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <AppModal
      open
      onOpenChange={(open) => !open && onClose()}
      title={title}
      description='Sign on the screen, or sign on paper and upload a photo. Either way it is saved as a clean digital signature.'
      size='lg'
      footer={
        <div className='flex w-full flex-wrap items-center justify-between gap-2'>
          <span role='alert' className='text-sm text-destructive'>
            {error}
          </span>
          <div className='flex gap-2'>
            <Button variant='outline' onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button
              loading={saving}
              disabled={mode === 'draw' ? empty : !photo}
              onClick={() => void save()}
            >
              Save signature
            </Button>
          </div>
        </div>
      }
    >
      <div className='grid gap-4'>
        <SegmentedControl
          label='How to sign'
          value={mode}
          onChange={(next: Mode) => {
            setMode(next)
            setError('')
          }}
          options={[
            { value: 'draw', label: 'Sign here' },
            { value: 'photo', label: 'Upload photo' },
          ]}
        />
        {mode === 'draw' ? (
          <div className='grid gap-2'>
            <p className='flex items-center gap-1.5 text-xs text-muted-foreground'>
              <PenLine className='size-3.5' />
              Sign with your finger, a stylus or the mouse.
            </p>
            <SignaturePad ref={pad} onChange={setEmpty} />
          </div>
        ) : (
          <div className='grid gap-3'>
            <p className='flex items-center gap-1.5 text-xs text-muted-foreground'>
              <Camera className='size-3.5' />
              Sign with a dark pen on plain white paper and take a clear photo. Shadows, lines and
              the paper are removed.
            </p>
            <div className='grid h-48 place-items-center overflow-hidden rounded-xl border-2 border-dashed bg-muted/30 p-2'>
              {preview ? (
                <img
                  src={preview}
                  alt='Chosen signature photo'
                  className='size-full object-contain'
                />
              ) : (
                <ImageUp className='size-8 text-muted-foreground' aria-hidden />
              )}
            </div>
            <Button asChild variant='outline' size='sm' className='justify-self-start'>
              <label htmlFor='signature-photo' className='cursor-pointer'>
                <ImageUp />
                {photo ? 'Choose another photo' : 'Choose photo'}
                <input
                  id='signature-photo'
                  type='file'
                  accept={PHOTO_TYPES.join(',')}
                  className='sr-only'
                  onChange={(event) => {
                    choosePhoto(event.target.files?.[0])
                    event.target.value = ''
                  }}
                />
              </label>
            </Button>
          </div>
        )}
      </div>
    </AppModal>
  )
}
