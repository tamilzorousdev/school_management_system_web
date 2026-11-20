import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { AppModal } from '@/components/common/app-modal'
import { FormField } from '@/components/common/form-field'
import { Textarea } from '@/components/ui/input'
import { alerts } from '@/lib/alerts'
import {
  grievancesApi,
  useGrievanceAction,
  type GrievanceDetail,
  type GrievanceListItem,
} from '../api'

const schema = z.object({
  reason: z
    .string()
    .trim()
    .min(5, 'Escalation reason must be at least 5 characters')
    .max(1000, 'Escalation reason cannot exceed 1000 characters'),
})

type FormData = z.infer<typeof schema>

interface EscalateDialogProps {
  grievance: GrievanceListItem | GrievanceDetail | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function EscalateDialog({
  grievance,
  open,
  onOpenChange,
  onSuccess,
}: EscalateDialogProps) {
  const [loading, setLoading] = useState(false)
  const escalateAction = useGrievanceAction((input: { id: number; data: FormData }) =>
    grievancesApi.escalate(input.id, {
      reason: input.data.reason,
    })
  )

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { reason: '' },
  })

  const onSubmit = async (values: FormData) => {
    if (!grievance) return
    setLoading(true)
    try {
      await escalateAction.mutateAsync({ id: grievance.id, data: values })
      alerts.success('Grievance escalated to Principal')
      onOpenChange(false)
      form.reset()
      onSuccess?.()
    } catch (err: unknown) {
      alerts.error((err as Error)?.message ?? 'Failed to escalate grievance')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AppModal
      open={open}
      onOpenChange={onOpenChange}
      title='Escalate to Principal'
      description={`Escalate ${grievance?.ticket_no ?? 'ticket'} for executive management intervention.`}
      formId='escalate-grievance-form'
      submitText={loading ? 'Escalating...' : 'Confirm escalation'}
      loading={loading}
    >
      <form
        id='escalate-grievance-form'
        onSubmit={form.handleSubmit(onSubmit)}
        className='grid gap-4 py-2'
      >
        <FormField
          id='escalation-reason'
          label='Reason for Escalation'
          error={form.formState.errors.reason?.message}
          hint='Explain why this grievance requires immediate leadership attention (e.g., repeated violation, safety threat, unresolved SLA breach).'
          required
        >
          <Textarea
            id='escalation-reason'
            {...form.register('reason')}
            placeholder='State the reason for escalation...'
            rows={4}
          />
        </FormField>
      </form>
    </AppModal>
  )
}
