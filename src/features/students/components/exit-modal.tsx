import { useState } from 'react'
import { AppModal } from '@/components/common/app-modal'
import { FormField } from '@/components/common/form-field'
import { SegmentedControl } from '@/components/common/segmented-control'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { alerts } from '@/lib/alerts'
import { toApiError } from '@/lib/api/errors'
import { openFile } from '@/lib/files'
import { useStudentMutation, type StudentDetail } from '../api'
import { recordsApi, studentFiles, type ExitInput, type ExitType } from '../records-api'

const today = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })

export function ExitModal({ student, onClose }: { student: StudentDetail; onClose: () => void }) {
  const [draft, setDraft] = useState({
    exit_type: 'transferred' as ExitType,
    leaving_date: today(),
    reason: '',
    conduct: 'Good',
    promotion_eligible: true,
    remarks: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [dues, setDues] = useState<string | null>(null)
  const save = useStudentMutation((input: ExitInput) => recordsApi.exit(student.id, input))

  return (
    <AppModal
      open
      onOpenChange={(open) => !open && onClose()}
      title={`${student.full_name} is leaving`}
      description='The student is marked as left, the roll number is freed, a transfer certificate is issued and the student is added to alumni.'
      formId='exit-form'
      submitText={dues ? 'Issue TC with dues' : 'Issue TC'}
      loading={save.isPending}
      size='lg'
    >
      <form
        id='exit-form'
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
            const tc = await save.mutateAsync({
              exit_type: draft.exit_type,
              leaving_date: draft.leaving_date,
              reason: draft.reason.trim(),
              conduct: draft.conduct.trim() || 'Good',
              promotion_eligible: draft.promotion_eligible,
              remarks: draft.remarks.trim() || null,
              acknowledge_dues: dues ? true : undefined,
            })
            alerts.success(`TC ${tc.tc_no} issued`)
            onClose()
            void openFile(studentFiles.tc(student.id)).catch((error: unknown) =>
              alerts.error(toApiError(error).message)
            )
          } catch (error) {
            const apiError = toApiError(error)
            if (apiError.code === 'FEE_DUES_PENDING') {
              setDues(apiError.message)
              return
            }
            setErrors(
              apiError.fieldErrors.length
                ? Object.fromEntries(apiError.fieldErrors.map((item) => [item.field, item.message]))
                : { root: apiError.message }
            )
          }
        }}
      >
        {dues && (
          <p
            role='alert'
            className='rounded-lg border border-warning/40 bg-warning/10 px-3 py-2 text-sm sm:col-span-2'
          >
            <span className='font-semibold'>Unpaid fees.</span> {dues} To stop collecting them, ask
            for a write-off on each invoice in Fees.
          </p>
        )}
        {errors.root && (
          <p role='alert' className='text-sm font-medium text-destructive sm:col-span-2'>
            {errors.root}
          </p>
        )}
        <FormField id='exit-type' label='Leaving because' className='sm:col-span-2'>
          <SegmentedControl
            label='Leaving because'
            value={draft.exit_type}
            onChange={(value) => setDraft({ ...draft, exit_type: value })}
            options={[
              { value: 'transferred', label: 'Moving to another school' },
              { value: 'withdrawn', label: 'Withdrawn' },
            ]}
          />
        </FormField>
        <FormField id='exit-date' label='Leaving date' required error={errors.leaving_date}>
          <Input
            id='exit-date'
            type='date'
            min={student.admission_date}
            value={draft.leaving_date}
            onChange={(event) => setDraft({ ...draft, leaving_date: event.target.value })}
          />
        </FormField>
        <FormField id='exit-conduct' label='Conduct' error={errors.conduct}>
          <Input
            id='exit-conduct'
            value={draft.conduct}
            onChange={(event) => setDraft({ ...draft, conduct: event.target.value })}
          />
        </FormField>
        <FormField
          id='exit-reason'
          label='Reason'
          required
          error={errors.reason}
          className='sm:col-span-2'
        >
          <Input
            id='exit-reason'
            autoFocus
            placeholder='Family moved to Coimbatore'
            value={draft.reason}
            onChange={(event) => {
              setDraft({ ...draft, reason: event.target.value })
              setErrors({ ...errors, reason: '' })
            }}
          />
        </FormField>
        <FormField id='exit-remarks' label='Remarks on the TC' className='sm:col-span-2'>
          <Input
            id='exit-remarks'
            value={draft.remarks}
            onChange={(event) => setDraft({ ...draft, remarks: event.target.value })}
          />
        </FormField>
        <label className='flex items-center justify-between gap-3 rounded-lg border p-3 sm:col-span-2'>
          <span className='grid'>
            <span className='text-sm font-semibold'>Qualified for promotion</span>
            <span className='text-xs text-muted-foreground'>
              Printed on the transfer certificate
            </span>
          </span>
          <Switch
            checked={draft.promotion_eligible}
            onCheckedChange={(value) => setDraft({ ...draft, promotion_eligible: value })}
            aria-label='Qualified for promotion'
          />
        </label>
      </form>
    </AppModal>
  )
}
