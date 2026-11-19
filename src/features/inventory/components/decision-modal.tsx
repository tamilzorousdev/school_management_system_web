import { useState, type FormEvent } from 'react'
import { AppModal } from '@/components/common/app-modal'
import { FormField } from '@/components/common/form-field'
import { Textarea } from '@/components/ui/input'
import { toApiError } from '@/lib/api/errors'

const FORM_ID = 'inventory-decision-form'

export type DecisionMode = 'approve' | 'reject' | 'cancel' | 'note'

interface DecisionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: DecisionMode
  title: string
  description?: string
  submitText?: string
  noteLabel?: string
  placeholder?: string
  loading?: boolean
  onSubmit: (note: string | null) => Promise<void>
}

export function DecisionModal({
  open,
  onOpenChange,
  mode,
  title,
  description,
  submitText,
  noteLabel,
  placeholder,
  loading,
  onSubmit,
}: DecisionModalProps) {
  return (
    <AppModal
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      formId={FORM_ID}
      submitText={
        submitText ?? (mode === 'approve' ? 'Approve' : mode === 'reject' ? 'Reject' : 'Save')
      }
      loading={loading}
      size='sm'
    >
      {open && (
        <DecisionForm
          required={mode !== 'approve'}
          label={noteLabel ?? (mode === 'approve' ? 'Note (optional)' : 'Reason')}
          placeholder={placeholder}
          onSubmit={onSubmit}
        />
      )}
    </AppModal>
  )
}

function DecisionForm({
  required,
  label,
  placeholder,
  onSubmit,
}: {
  required: boolean
  label: string
  placeholder?: string
  onSubmit: (note: string | null) => Promise<void>
}) {
  const [note, setNote] = useState('')
  const [error, setError] = useState<string | null>(null)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    const text = note.trim()
    if (required && text.length < 3) {
      setError('Write at least 3 characters')
      return
    }
    if (text.length > 255) {
      setError('Keep it under 255 characters')
      return
    }
    setError(null)
    try {
      await onSubmit(text || null)
    } catch (caught) {
      setError(toApiError(caught).message)
    }
  }

  return (
    <form id={FORM_ID} onSubmit={submit} noValidate className='grid gap-3'>
      <FormField id='decision-note' label={label} required={required} error={error ?? undefined}>
        <Textarea
          id='decision-note'
          autoFocus
          value={note}
          maxLength={255}
          placeholder={placeholder ?? (required ? 'Why?' : 'Anything the requester should know')}
          aria-invalid={Boolean(error)}
          onChange={(event) => setNote(event.target.value)}
        />
      </FormField>
    </form>
  )
}
