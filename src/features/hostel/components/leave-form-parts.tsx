import { useState, type FormEvent, type ReactNode } from 'react'
import { Info, type LucideIcon } from 'lucide-react'
import { AppModal } from '@/components/common/app-modal'
import { FormField } from '@/components/common/form-field'
import { Textarea } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { toApiError } from '@/lib/api/errors'
import { cn } from '@/lib/utils'
import type { HostelStudent } from '../api'
import { studentLine } from '../labels'

export function FormAlert({ message }: { message?: string }) {
  if (!message) return null
  return (
    <p
      role='alert'
      className='rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive'
    >
      {message}
    </p>
  )
}

const noteTones = {
  info: 'border-info/30 bg-info/5 text-foreground [&>svg]:text-info',
  warning: 'border-warning/30 bg-warning/10 text-foreground [&>svg]:text-warning',
  danger: 'border-destructive/30 bg-destructive/10 text-foreground [&>svg]:text-destructive',
  success: 'border-success/30 bg-success/10 text-foreground [&>svg]:text-success',
}

export function InfoNote({
  children,
  tone = 'info',
  icon: Icon = Info,
  className,
}: {
  children: ReactNode
  tone?: keyof typeof noteTones
  icon?: LucideIcon
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex items-start gap-2 rounded-md border px-3 py-2 text-sm',
        noteTones[tone],
        className
      )}
    >
      <Icon className='mt-0.5 size-4 shrink-0' />
      <div className='min-w-0 flex-1'>{children}</div>
    </div>
  )
}

export function SwitchField({
  id,
  label,
  description,
  checked,
  onCheckedChange,
}: {
  id: string
  label: string
  description?: ReactNode
  checked: boolean
  onCheckedChange: (checked: boolean) => void
}) {
  return (
    <div className='flex items-center justify-between gap-4 rounded-lg border bg-muted/40 px-4 py-3'>
      <div className='grid gap-0.5'>
        <label htmlFor={id} className='text-sm font-semibold'>
          {label}
        </label>
        {description && <p className='text-xs text-muted-foreground'>{description}</p>}
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  )
}

export function ToggleFilter({
  id,
  label,
  checked,
  onChange,
}: {
  id: string
  label: string
  checked: boolean
  onChange: (checked: boolean | undefined) => void
}) {
  return (
    <div className='flex h-9 items-center gap-2 px-1'>
      <Switch id={id} checked={checked} onCheckedChange={(next) => onChange(next || undefined)} />
      <label htmlFor={id} className='text-sm font-medium whitespace-nowrap'>
        {label}
      </label>
    </div>
  )
}

export function StudentCell({ student, extra }: { student: HostelStudent; extra?: ReactNode }) {
  return (
    <div className='grid min-w-0 gap-0.5'>
      <span className='truncate font-semibold'>{student.name}</span>
      <span className='truncate text-xs text-muted-foreground'>
        {studentLine(student)}
        {extra ? <> · {extra}</> : null}
      </span>
    </div>
  )
}

export function NoteModal({
  title,
  description,
  label = 'Note',
  required = false,
  maxLength = 500,
  submitText,
  onSubmit,
  onClose,
}: {
  title: string
  description?: string
  label?: string
  required?: boolean
  maxLength?: number
  submitText: string
  onSubmit: (note: string | null) => Promise<unknown>
  onClose: () => void
}) {
  const formId = 'hostel-note-form'
  const [note, setNote] = useState('')
  const [error, setError] = useState<string | undefined>()
  const [saving, setSaving] = useState(false)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    const text = note.trim()
    if (required && text.length < 3) {
      setError('Write a short note (3 characters or more)')
      return
    }
    if (text.length > maxLength) {
      setError(`Keep the note to ${maxLength} characters`)
      return
    }
    setSaving(true)
    setError(undefined)
    try {
      await onSubmit(text || null)
      onClose()
    } catch (caught) {
      const apiError = toApiError(caught)
      setError(apiError.fieldErrors[0]?.message ?? apiError.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <AppModal
      open
      onOpenChange={(open) => !open && onClose()}
      title={title}
      description={description}
      formId={formId}
      submitText={submitText}
      loading={saving}
      size='sm'
    >
      <form id={formId} noValidate onSubmit={(event) => void submit(event)} className='grid gap-3'>
        <FormField
          id='hostel-note'
          label={label}
          required={required}
          error={error}
          hint={required ? undefined : 'Optional'}
        >
          <Textarea
            id='hostel-note'
            autoFocus
            value={note}
            maxLength={maxLength}
            aria-invalid={Boolean(error)}
            onChange={(event) => setNote(event.target.value)}
          />
        </FormField>
      </form>
    </AppModal>
  )
}
