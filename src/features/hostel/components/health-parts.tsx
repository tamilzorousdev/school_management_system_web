import { useState, type FormEvent } from 'react'
import { AppModal } from '@/components/common/app-modal'
import { FormField } from '@/components/common/form-field'
import { Textarea } from '@/components/ui/input'
import { toApiError } from '@/lib/api/errors'
import type { HealthLogNoteInput } from '../api-care'
import { SwitchField } from './leave-form-parts'

export function HealthNoteModal({
  title,
  description,
  submitText,
  onSubmit,
  onClose,
}: {
  title: string
  description?: string
  submitText: string
  onSubmit: (input: HealthLogNoteInput) => Promise<unknown>
  onClose: () => void
}) {
  const formId = 'health-note-form'
  const [note, setNote] = useState('')
  const [notify, setNotify] = useState(false)
  const [error, setError] = useState<string | undefined>()
  const [saving, setSaving] = useState(false)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    const text = note.trim()
    if (text.length > 255) {
      setError('Keep the note to 255 characters')
      return
    }
    setSaving(true)
    setError(undefined)
    try {
      await onSubmit({ note: text || null, notify_parent: notify })
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
        <FormField id='health-note' label='Note' error={error} hint='Optional, added to the record'>
          <Textarea
            id='health-note'
            autoFocus
            value={note}
            maxLength={255}
            placeholder='Fever down, back to class tomorrow'
            aria-invalid={Boolean(error)}
            onChange={(event) => setNote(event.target.value)}
          />
        </FormField>
        <SwitchField
          id='health-note-notify'
          label='Tell the parents'
          description='Parents get a push notification, then an SMS if the push does not reach them.'
          checked={notify}
          onCheckedChange={setNotify}
        />
      </form>
    </AppModal>
  )
}
