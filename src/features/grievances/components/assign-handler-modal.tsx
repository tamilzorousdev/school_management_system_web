import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { AppModal } from '@/components/common/app-modal'
import { Combobox } from '@/components/common/combobox'
import { FormField } from '@/components/common/form-field'
import { Textarea } from '@/components/ui/input'
import { alerts } from '@/lib/alerts'
import { useTeachers } from '@/features/setup/api'
import {
  grievancesApi,
  useGrievanceAction,
  type GrievanceDetail,
  type GrievanceListItem,
} from '../api'

const schema = z.object({
  assigned_to_user_id: z.number().int().min(1, 'Please select an officer or teacher'),
  note: z.string().trim().max(500),
})

type FormData = z.infer<typeof schema>

interface AssignHandlerModalProps {
  grievance: GrievanceListItem | GrievanceDetail | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function AssignHandlerModal({
  grievance,
  open,
  onOpenChange,
  onSuccess,
}: AssignHandlerModalProps) {
  const [loading, setLoading] = useState(false)
  const teachers = useTeachers()
  const assignAction = useGrievanceAction((input: { id: number; data: FormData }) =>
    grievancesApi.assign(input.id, {
      assigned_to_user_id: input.data.assigned_to_user_id,
      note: input.data.note,
    })
  )

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      assigned_to_user_id: grievance?.assigned_to?.id ?? undefined,
      note: '',
    },
  })

  const onSubmit = async (values: FormData) => {
    if (!grievance) return
    setLoading(true)
    try {
      await assignAction.mutateAsync({ id: grievance.id, data: values })
      alerts.success('Grievance assigned successfully')
      onOpenChange(false)
      form.reset()
      onSuccess?.()
    } catch (err: unknown) {
      alerts.error((err as Error)?.message ?? 'Failed to assign grievance')
    } finally {
      setLoading(false)
    }
  }

  const officerOptions = (teachers.data ?? []).map((t) => ({
    value: String(t.id),
    label: t.name,
  }))

  return (
    <AppModal
      open={open}
      onOpenChange={onOpenChange}
      title='Assign Grievance Officer'
      description={`Assign ${grievance?.ticket_no ?? 'ticket'} to a department in-charge or teacher.`}
      formId='assign-handler-form'
      submitText={loading ? 'Assigning...' : 'Assign ticket'}
      loading={loading}
    >
      <form
        id='assign-handler-form'
        onSubmit={form.handleSubmit(onSubmit)}
        className='grid gap-4 py-2'
      >
        <FormField
          id='assign-officer-combobox'
          label='Assigned Officer / Teacher'
          error={form.formState.errors.assigned_to_user_id?.message}
          required
        >
          <Controller
            control={form.control}
            name='assigned_to_user_id'
            render={({ field }) => (
              <Combobox
                id='assign-officer-combobox'
                label='Assigned Officer'
                options={officerOptions}
                value={field.value ? String(field.value) : ''}
                onChange={(val) => field.onChange(val ? Number(val) : undefined)}
                placeholder='Search and choose officer'
                searchPlaceholder='Search staff...'
              />
            )}
          />
        </FormField>

        <FormField
          id='assign-routing-instructions'
          label='Routing Instructions / Internal Note'
          error={form.formState.errors.note?.message}
        >
          <Textarea
            id='assign-routing-instructions'
            {...form.register('note')}
            placeholder='Add any internal directives or instructions for the assigned officer...'
            rows={3}
          />
        </FormField>
      </form>
    </AppModal>
  )
}
