import { useState } from 'react'
import { AppModal } from '@/components/common/app-modal'
import { FormField } from '@/components/common/form-field'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { alerts } from '@/lib/alerts'
import { toApiError } from '@/lib/api/errors'
import { openFile } from '@/lib/files'
import { formatDate } from '@/lib/format'
import { useStudentMutation, type StudentDetail } from '../api'
import { EXIT_TYPE_LABELS } from '../labels'
import { recordsApi, studentFiles, useStudentNoc, type ExitInput } from '../records-api'

export function ExitModal({ student, onClose }: { student: StudentDetail; onClose: () => void }) {
  const noc = useStudentNoc(student.id, true)
  const [draft, setDraft] = useState({
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
      title={`Issue TC for ${student.full_name}`}
      description='Every department has cleared the NOC. The student is marked as left, the roll number is freed, the transfer certificate is issued and the student is added to alumni.'
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
          setErrors({})
          try {
            const tc = await save.mutateAsync({
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
        {noc.data && (
          <dl className='grid gap-3 rounded-lg border bg-muted/40 p-3 text-sm sm:col-span-2 sm:grid-cols-3'>
            <div className='grid gap-0.5'>
              <dt className='text-xs text-muted-foreground'>Leaving because</dt>
              <dd className='font-medium'>{EXIT_TYPE_LABELS[noc.data.exit_type]}</dd>
            </div>
            <div className='grid gap-0.5'>
              <dt className='text-xs text-muted-foreground'>Leaving date</dt>
              <dd className='font-medium'>{formatDate(noc.data.leaving_date)}</dd>
            </div>
            <div className='grid gap-0.5'>
              <dt className='text-xs text-muted-foreground'>Reason</dt>
              <dd className='font-medium break-words'>{noc.data.reason}</dd>
            </div>
          </dl>
        )}
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
        <FormField id='exit-conduct' label='Conduct' error={errors.conduct}>
          <Input
            id='exit-conduct'
            autoFocus
            value={draft.conduct}
            onChange={(event) => setDraft({ ...draft, conduct: event.target.value })}
          />
        </FormField>
        <FormField id='exit-remarks' label='Remarks on the TC' error={errors.remarks}>
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
