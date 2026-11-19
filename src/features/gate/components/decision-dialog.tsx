import type { ReactNode } from 'react'
import { NoteDialog } from '@/features/maintenance/components/shared'
import { alerts } from '@/lib/alerts'
import { toApiError } from '@/lib/api/errors'

interface DecisionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  yes: boolean
  title: string
  description: ReactNode
  confirmText: string
  successText: string
  onDecide: (note: string) => Promise<unknown>
}

export function DecisionDialog({
  open,
  onOpenChange,
  yes,
  title,
  description,
  confirmText,
  successText,
  onDecide,
}: DecisionDialogProps) {
  return (
    <NoteDialog
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      label={yes ? 'Note (optional)' : 'Reason (optional)'}
      placeholder={yes ? 'Parent confirmed on the phone' : 'Parent could not be reached'}
      confirmText={confirmText}
      destructive={!yes}
      onConfirm={async (note) => {
        try {
          await onDecide(note)
          alerts.success(successText)
          onOpenChange(false)
        } catch (error) {
          const apiError = toApiError(error)
          if (apiError.fieldErrors.length) throw error
          alerts.error(apiError.message)
          onOpenChange(false)
        }
      }}
    />
  )
}
