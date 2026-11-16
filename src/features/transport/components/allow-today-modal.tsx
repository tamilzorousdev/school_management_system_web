import { useState } from 'react'
import { AppModal } from '@/components/common/app-modal'
import { FormField } from '@/components/common/form-field'
import { Textarea } from '@/components/ui/input'
import { alerts } from '@/lib/alerts'
import { toApiError } from '@/lib/api/errors'

export function AllowTodayModal({
  title,
  description,
  onAllow,
  onClose,
}: {
  title: string
  description: string
  onAllow: (reason: string) => Promise<unknown>
  onClose: () => void
}) {
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  return (
    <AppModal
      open
      onOpenChange={(open) => !open && onClose()}
      title={title}
      description={description}
      formId='allow-today-form'
      submitText='Allow for today'
      loading={saving}
    >
      <form
        id='allow-today-form'
        noValidate
        onSubmit={async (event) => {
          event.preventDefault()
          if (reason.trim().length < 5) {
            setError('Write why it is safe to allow it today')
            return
          }
          setSaving(true)
          try {
            await onAllow(reason.trim())
            alerts.success('Allowed for today. It ends at midnight.')
            onClose()
          } catch (caught) {
            setError(toApiError(caught).message)
          } finally {
            setSaving(false)
          }
        }}
      >
        <FormField
          id='allow-reason'
          label='Reason'
          required
          error={error ?? undefined}
          hint='Saved with your name and shown on the record.'
        >
          <Textarea
            id='allow-reason'
            rows={3}
            maxLength={255}
            value={reason}
            placeholder='Insurance paid today, the copy comes tomorrow'
            aria-invalid={Boolean(error) || undefined}
            onChange={(event) => {
              setReason(event.target.value)
              setError(null)
            }}
          />
        </FormField>
      </form>
    </AppModal>
  )
}
