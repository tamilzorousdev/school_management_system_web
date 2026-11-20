import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { AppModal } from '@/components/common/app-modal'
import { FormField } from '@/components/common/form-field'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/input'
import { alerts } from '@/lib/alerts'
import {
  grievancesApi,
  useGrievanceAction,
  type GrievanceDetail,
  type GrievanceListItem,
} from '../api'

const schema = z.object({
  resolution_summary: z
    .string()
    .trim()
    .min(10, 'Resolution summary must be at least 10 characters')
    .max(2000, 'Resolution summary cannot exceed 2000 characters'),
  notify_complainant: z.boolean(),
})

type FormData = z.infer<typeof schema>

interface ResolveModalProps {
  grievance: GrievanceListItem | GrievanceDetail | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function ResolveModal({
  grievance,
  open,
  onOpenChange,
  onSuccess,
}: ResolveModalProps) {
  const [loading, setLoading] = useState(false)
  const resolveAction = useGrievanceAction((input: { id: number; data: FormData }) =>
    grievancesApi.resolve(input.id, {
      resolution_summary: input.data.resolution_summary,
      notify_complainant: input.data.notify_complainant,
    })
  )

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      resolution_summary: '',
      notify_complainant: true,
    },
  })

  const onSubmit = async (values: FormData) => {
    if (!grievance) return
    setLoading(true)
    try {
      await resolveAction.mutateAsync({ id: grievance.id, data: values })
      alerts.success('Grievance marked as resolved')
      onOpenChange(false)
      form.reset()
      onSuccess?.()
    } catch (err: unknown) {
      alerts.error((err as Error)?.message ?? 'Failed to resolve grievance')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AppModal
      open={open}
      onOpenChange={onOpenChange}
      title='Resolve Grievance'
      description={`Record official corrective action and resolve ${grievance?.ticket_no ?? 'ticket'}.`}
      formId='resolve-grievance-form'
      submitText={loading ? 'Resolving...' : 'Mark as resolved'}
      loading={loading}
    >
      <form
        id='resolve-grievance-form'
        onSubmit={form.handleSubmit(onSubmit)}
        className='grid gap-4 py-2'
      >
        <FormField
          id='resolve-summary'
          label='Official Resolution Summary'
          error={form.formState.errors.resolution_summary?.message}
          hint='Detail the corrective actions taken, inquiries made, and final outcome for the complainant.'
          required
        >
          <Textarea
            id='resolve-summary'
            {...form.register('resolution_summary')}
            placeholder='State the findings and resolution clearly...'
            rows={5}
          />
        </FormField>

        <div className='flex items-center justify-between rounded-lg border p-3 bg-muted/20'>
          <div className='grid gap-0.5'>
            <span className='text-sm font-semibold'>Notify Complainant</span>
            <span className='text-xs text-muted-foreground'>
              Send push notification and SMS with the resolution summary.
            </span>
          </div>
          <Controller
            control={form.control}
            name='notify_complainant'
            render={({ field }) => (
              <Switch checked={field.value} onCheckedChange={field.onChange} />
            )}
          />
        </div>
      </form>
    </AppModal>
  )
}
