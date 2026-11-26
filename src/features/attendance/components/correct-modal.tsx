import { useState } from 'react'
import { AppModal } from '@/components/common/app-modal'
import { Combobox } from '@/components/common/combobox'
import { FormField } from '@/components/common/form-field'
import { Input, Textarea } from '@/components/ui/input'
import { alerts } from '@/lib/alerts'
import { formatDate } from '@/lib/format'
import { fieldErrorsOf } from '@/features/setup/form-actions'
import {
  attendanceApi,
  useAttendanceMutation,
  type ManualMarkInput,
  type StaffAttendanceStatus,
  type StaffBoardRow,
} from '../api'
import { MANUAL_STATUSES, STAFF_DAY_STATUS, clockTime, toZonedIso } from '../labels'

export function CorrectModal({ row, onClose }: { row: StaffBoardRow; onClose: () => void }) {
  const initialStatus = (MANUAL_STATUSES as string[]).includes(row.status)
    ? (row.status as StaffAttendanceStatus)
    : 'present'
  const [status, setStatus] = useState<StaffAttendanceStatus>(initialStatus)
  const [checkIn, setCheckIn] = useState(clockTime(row.check_in_at))
  const [checkOut, setCheckOut] = useState(clockTime(row.check_out_at))
  const [remarks, setRemarks] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const save = useAttendanceMutation((input: ManualMarkInput) =>
    attendanceApi.correctStaff(row.user_id, input)
  )
  const needsTimes = status !== 'absent'

  return (
    <AppModal
      open
      onOpenChange={(open) => !open && onClose()}
      title={`Correct attendance for ${row.name}`}
      description={`${formatDate(row.date)} · saved as a manual entry with your reason`}
      formId='correct-attendance-form'
      submitText='Save correction'
      loading={save.isPending}
      showSubmitShortcut={false}
    >
      <form
        id='correct-attendance-form'
        noValidate
        className='grid gap-4 sm:grid-cols-2'
        onSubmit={async (event) => {
          event.preventDefault()
          const next: Record<string, string> = {}
          if (remarks.trim().length < 3) next.remarks = 'Give a reason of at least 3 characters'
          if (needsTimes && checkIn && checkOut && checkOut <= checkIn)
            next.check_out_at = 'Must be after the check-in time'
          setErrors(next)
          if (Object.keys(next).length) return
          try {
            await save.mutateAsync({
              date: row.date,
              status,
              check_in_at: needsTimes && checkIn ? toZonedIso(row.date, checkIn) : null,
              check_out_at: needsTimes && checkOut ? toZonedIso(row.date, checkOut) : null,
              remarks: remarks.trim(),
            })
            alerts.success(`Attendance corrected for ${row.name}`)
            onClose()
          } catch (error) {
            const fields = fieldErrorsOf(error)
            if (fields.root) alerts.error(fields.root)
            else setErrors(fields)
          }
        }}
      >
        <FormField id='correct-status' label='Status' required className='sm:col-span-2'>
          <Combobox
            id='correct-status'
            label='Status'
            value={status}
            placeholder='Choose status'
            options={MANUAL_STATUSES.map((value) => ({
              value,
              label: STAFF_DAY_STATUS[value].label,
            }))}
            onChange={(value) => setStatus((value ?? 'present') as StaffAttendanceStatus)}
            highlightSelected={false}
            className='sm:w-full'
          />
        </FormField>
        <FormField id='correct-in' label='Check-in time' error={errors.check_in_at}>
          <Input
            id='correct-in'
            type='time'
            disabled={!needsTimes}
            value={needsTimes ? checkIn : ''}
            onChange={(event) => setCheckIn(event.target.value)}
          />
        </FormField>
        <FormField id='correct-out' label='Check-out time' error={errors.check_out_at}>
          <Input
            id='correct-out'
            type='time'
            disabled={!needsTimes}
            value={needsTimes ? checkOut : ''}
            onChange={(event) => setCheckOut(event.target.value)}
          />
        </FormField>
        <FormField
          id='correct-remarks'
          label='Reason'
          required
          error={errors.remarks}
          className='sm:col-span-2'
        >
          <Textarea
            id='correct-remarks'
            autoFocus
            maxLength={255}
            placeholder='Phone GPS was not working'
            value={remarks}
            aria-invalid={Boolean(errors.remarks) || undefined}
            onChange={(event) => setRemarks(event.target.value)}
          />
        </FormField>
      </form>
    </AppModal>
  )
}
