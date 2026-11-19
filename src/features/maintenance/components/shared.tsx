import { useState, type ReactNode } from 'react'
import { FileText, Upload, X } from 'lucide-react'
import { FormField } from '@/components/common/form-field'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input, Textarea } from '@/components/ui/input'
import { toApiError } from '@/lib/api/errors'
import { filesApi } from '@/lib/files'
import type { VehicleRef } from '../api'
import { openStoredFile } from '../helpers'

const FILE_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'application/pdf']
const PHOTO_TYPES = ['image/png', 'image/jpeg', 'image/webp']
const MAX_BYTES = 5 * 1024 * 1024

export interface AttachedFile {
  id: number
  name: string
}

export function BusCell({ vehicle }: { vehicle: VehicleRef }) {
  return (
    <div className='grid min-w-0'>
      <span className='truncate font-semibold'>{vehicle.name}</span>
      <span className='font-mono text-xs whitespace-nowrap text-muted-foreground'>
        {vehicle.registration_no}
      </span>
    </div>
  )
}

export function FormAlert({ message }: { message?: string }) {
  if (!message) return null
  return (
    <p
      role='alert'
      className='rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive sm:col-span-2'
    >
      {message}
    </p>
  )
}

interface FileFieldProps {
  id: string
  label: string
  purpose: string
  file: AttachedFile | null
  onChange: (file: AttachedFile | null) => void
  onUploadingChange: (uploading: boolean) => void
  error: string
  onError: (message: string) => void
  photoOnly?: boolean
  className?: string
}

export function FileField({
  id,
  label,
  purpose,
  file,
  onChange,
  onUploadingChange,
  error,
  onError,
  photoOnly,
  className,
}: FileFieldProps) {
  const [uploading, setUploading] = useState(false)
  const types = photoOnly ? PHOTO_TYPES : FILE_TYPES

  const upload = async (picked: File | undefined) => {
    if (!picked) return
    onError('')
    if (!types.includes(picked.type))
      return onError(photoOnly ? 'Choose a photo' : 'Choose a photo or a PDF')
    if (picked.size > MAX_BYTES) return onError('The file must be 5 MB or smaller')
    setUploading(true)
    onUploadingChange(true)
    try {
      const uploaded = await filesApi.upload(picked, purpose)
      onChange({ id: uploaded.id, name: uploaded.name })
    } catch (caught) {
      onError(toApiError(caught).message)
    } finally {
      setUploading(false)
      onUploadingChange(false)
    }
  }

  return (
    <FormField
      id={id}
      label={label}
      error={error}
      hint={photoOnly ? 'Photo, up to 5 MB' : 'Photo or PDF, up to 5 MB'}
      className={className}
    >
      {file ? (
        <div className='flex h-9 min-w-0 items-center gap-2 rounded-md border bg-muted/40 px-3 text-sm'>
          <FileText className='size-4 shrink-0 text-muted-foreground' />
          <button
            type='button'
            onClick={() => openStoredFile(file)}
            className='min-w-0 flex-1 truncate text-left hover:underline'
          >
            {file.name}
          </button>
          <button
            type='button'
            onClick={() => onChange(null)}
            aria-label={`Remove ${label.toLowerCase()}`}
            className='grid size-6 place-items-center rounded text-muted-foreground hover:bg-muted hover:text-foreground'
          >
            <X className='size-3.5' />
          </button>
        </div>
      ) : (
        <Button asChild variant='outline' disabled={uploading} className='justify-start'>
          <label htmlFor={id} className='cursor-pointer'>
            <Upload />
            {uploading ? 'Uploading…' : `Upload ${label.toLowerCase()}`}
            <input
              id={id}
              type='file'
              accept={types.join(',')}
              className='sr-only'
              disabled={uploading}
              onChange={(event) => {
                void upload(event.target.files?.[0])
                event.target.value = ''
              }}
            />
          </label>
        </Button>
      )}
    </FormField>
  )
}

interface NoteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: ReactNode
  label: string
  placeholder?: string
  confirmText: string
  destructive?: boolean
  required?: boolean
  onConfirm: (note: string) => Promise<void>
}

export function NoteDialog({
  open,
  onOpenChange,
  title,
  description,
  label,
  placeholder,
  confirmText,
  destructive,
  required,
  onConfirm,
}: NoteDialogProps) {
  const [note, setNote] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [wasOpen, setWasOpen] = useState(open)
  if (open !== wasOpen) {
    setWasOpen(open)
    if (open) {
      setNote('')
      setError('')
    }
  }

  const submit = async () => {
    const text = note.trim()
    if (required && text.length < 3) return setError('Enter at least 3 characters')
    setLoading(true)
    try {
      await onConfirm(text)
    } catch (caught) {
      const apiError = toApiError(caught)
      setError(apiError.fieldErrors[0]?.message ?? apiError.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !loading && onOpenChange(next)}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <form
          id='note-dialog-form'
          noValidate
          onSubmit={(event) => {
            event.preventDefault()
            void submit()
          }}
        >
          <FormField id='note-dialog-text' label={label} required={required} error={error}>
            <Textarea
              id='note-dialog-text'
              rows={3}
              maxLength={300}
              autoFocus
              placeholder={placeholder}
              aria-invalid={Boolean(error) || undefined}
              value={note}
              onChange={(event) => setNote(event.target.value)}
            />
          </FormField>
        </form>
        <DialogFooter>
          <Button variant='outline' onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button
            type='submit'
            form='note-dialog-form'
            variant={destructive ? 'destructive' : 'default'}
            loading={loading}
          >
            {confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function DateRangeInputs({
  from,
  to,
  onChange,
}: {
  from?: string
  to?: string
  onChange: (patch: { from?: string; to?: string }) => void
}) {
  return (
    <>
      <Input
        type='date'
        aria-label='From date'
        placeholder='From'
        value={from ?? ''}
        max={to}
        onChange={(event) => onChange({ from: event.target.value || undefined })}
        className='w-full sm:w-40'
      />
      <Input
        type='date'
        aria-label='To date'
        placeholder='To'
        value={to ?? ''}
        min={from}
        onChange={(event) => onChange({ to: event.target.value || undefined })}
        className='w-full sm:w-40'
      />
    </>
  )
}

export interface SheetAction {
  key: string
  label: string
  icon: ReactNode
  onClick: () => void
  destructive?: boolean
  className?: string
}

export function ActionSheet({
  open,
  onOpenChange,
  title,
  description,
  actions,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  actions: SheetAction[]
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-sm'>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <div className='grid gap-2'>
          {actions.map((action) => (
            <Button
              key={action.key}
              variant={action.destructive ? 'destructive' : 'outline'}
              className='justify-start'
              onClick={() => {
                onOpenChange(false)
                action.onClick()
              }}
            >
              {action.icon}
              {action.label}
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
