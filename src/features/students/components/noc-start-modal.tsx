import { useState } from 'react'
import { AppModal } from '@/components/common/app-modal'
import { FormField } from '@/components/common/form-field'
import { SegmentedControl } from '@/components/common/segmented-control'
import { Input } from '@/components/ui/input'
import { alerts } from '@/lib/alerts'
import { toApiError } from '@/lib/api/errors'
import { useStudentMutation, type StudentDetail } from '../api'
import { EXIT_TYPE_LABELS, NOC_DEPARTMENT_LABELS, toOptions } from '../labels'
import { recordsApi, type ExitType, type StartNocInput } from '../records-api'

const today = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })

export function NocStartModal({
  student,
  onClose,
}: {
  student: StudentDetail
  onClose: () => void
}) {
  const [draft, setDraft] = useState({
    exit_type: 'transferred' as ExitType,
    leaving_date: today(),
    reason: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const save = useStudentMutation((input: StartNocInput) => recordsApi.startNoc(student.id, input))

  return (
    <AppModal
      open
      onOpenChange={(open) => !open && onClose()}
      title={`${student.full_name} is leaving`}
      description={`Start a leaving request. ${Object.values(NOC_DEPARTMENT_LABELS).join(', ')} each clear their part of the NOC, then the TC can be issued.`}
      formId='noc-start-form'
      submitText='Start leaving request'
      loading={save.isPending}
      size='lg'
    >
      <form
        id='noc-start-form'
        noValidate
        className='grid gap-4 sm:grid-cols-2'
        onSubmit={async (event) => {
          event.preventDefault()
          const next: Record<string, string> = {}
          if (draft.reason.trim().length < 3) next.reason = 'Write the reason for leaving'
          if (!draft.leaving_date) next.leaving_date = 'Choose the leaving date'
          setErrors(next)
          if (Object.keys(next).length) return
          try {
            await save.mutateAsync({
              exit_type: draft.exit_type,
              leaving_date: draft.leaving_date,
              reason: draft.reason.trim(),
            })
            alerts.success('Leaving request started')
            onClose()
          } catch (error) {
            const apiError = toApiError(error)
            setErrors(
              apiError.fieldErrors.length
                ? Object.fromEntries(apiError.fieldErrors.map((item) => [item.field, item.message]))
                : { root: apiError.message }
            )
          }
        }}
      >
        {errors.root && (
          <p role='alert' className='text-sm font-medium text-destructive sm:col-span-2'>
            {errors.root}
          </p>
        )}
        <FormField id='noc-exit-type' label='Leaving because' className='sm:col-span-2'>
          <SegmentedControl
            label='Leaving because'
            value={draft.exit_type}
            onChange={(value) => setDraft({ ...draft, exit_type: value })}
            options={toOptions(EXIT_TYPE_LABELS)}
          />
        </FormField>
        <FormField id='noc-date' label='Leaving date' required error={errors.leaving_date}>
          <Input
            id='noc-date'
            type='date'
            min={student.admission_date}
            value={draft.leaving_date}
            onChange={(event) => setDraft({ ...draft, leaving_date: event.target.value })}
          />
        </FormField>
        <FormField
          id='noc-reason'
          label='Reason'
          required
          error={errors.reason}
          className='sm:col-span-2'
        >
          <Input
            id='noc-reason'
            autoFocus
            placeholder='Family moved to Coimbatore'
            value={draft.reason}
            onChange={(event) => {
              setDraft({ ...draft, reason: event.target.value })
              setErrors({ ...errors, reason: '' })
            }}
          />
        </FormField>
      </form>
    </AppModal>
  )
}
