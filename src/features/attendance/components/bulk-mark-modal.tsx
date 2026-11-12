import { useState } from 'react'
import { AppModal } from '@/components/common/app-modal'
import { Combobox } from '@/components/common/combobox'
import { FormField } from '@/components/common/form-field'
import { Input, Textarea } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { alerts } from '@/lib/alerts'
import { formatDate } from '@/lib/format'
import { fieldErrorsOf } from '@/features/setup/form-actions'
import {
  attendanceApi,
  useAttendanceMutation,
  type AttendanceSlot,
  type AttendanceStatus,
  type BulkSectionInput,
  type BulkSkip,
  type BulkStaffInput,
  type StaffAttendanceStatus,
} from '../api'
import {
  ATTENDANCE_STATUS,
  ATTENDANCE_STATUSES,
  MANUAL_STATUSES,
  STAFF_DAY_STATUS,
  today,
  toZonedIso,
} from '../labels'

const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? '' : 's'}`

function skippedText(skipped: BulkSkip[]) {
  if (!skipped.length) return ''
  const names = skipped
    .slice(0, 3)
    .map((item) => `${item.name} (${item.reason.toLowerCase()})`)
    .join(', ')
  return ` Skipped ${skipped.length}: ${names}${skipped.length > 3 ? ' …' : ''}`
}

export function BulkStaffModal({
  date,
  userIds,
  onClose,
  onDone,
}: {
  date: string
  userIds: number[] | 'not_checked_in'
  onClose: () => void
  onDone: () => void
}) {
  const [status, setStatus] = useState<StaffAttendanceStatus>('present')
  const [checkIn, setCheckIn] = useState('')
  const [checkOut, setCheckOut] = useState('')
  const [remarks, setRemarks] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const save = useAttendanceMutation((input: BulkStaffInput) => attendanceApi.bulkStaff(input))
  const needsTimes = status !== 'absent'
  const everyone = userIds === 'not_checked_in'
  const who = everyone ? 'everyone not checked in' : plural(userIds.length, 'staff member')

  return (
    <AppModal
      open
      onOpenChange={(open) => !open && onClose()}
      title={`Mark ${who}`}
      description={`${formatDate(date)} · saved as manual entries. Staff on approved leave are skipped.`}
      formId='bulk-staff-form'
      submitText='Mark attendance'
      loading={save.isPending}
    >
      <form
        id='bulk-staff-form'
        noValidate
        className='grid gap-4 sm:grid-cols-2'
        onSubmit={async (event) => {
          event.preventDefault()
          const next: Record<string, string> = {}
          if (needsTimes && checkIn && checkOut && checkOut <= checkIn)
            next.check_out_at = 'Must be after the check-in time'
          setErrors(next)
          if (Object.keys(next).length) return
          try {
            const result = await save.mutateAsync({
              date,
              ...(everyone ? { all_not_checked_in: true } : { user_ids: userIds }),
              status,
              check_in_at: needsTimes && checkIn ? toZonedIso(date, checkIn) : null,
              check_out_at: needsTimes && checkOut ? toZonedIso(date, checkOut) : null,
              remarks: remarks.trim() || null,
            })
            alerts.success(
              `Marked ${plural(result.marked, 'staff member')} ${STAFF_DAY_STATUS[status].label.toLowerCase()}.${skippedText(result.skipped)}`
            )
            onDone()
          } catch (error) {
            const fields = fieldErrorsOf(error)
            if (fields.root) alerts.error(fields.root)
            else if (fields.user_ids) alerts.error(fields.user_ids)
            else setErrors(fields)
          }
        }}
      >
        <FormField id='bulk-staff-status' label='Status' required className='sm:col-span-2'>
          <Combobox
            id='bulk-staff-status'
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
        <FormField
          id='bulk-staff-in'
          label='Check-in time'
          hint='Optional, same for everyone'
          error={errors.check_in_at}
        >
          <Input
            id='bulk-staff-in'
            type='time'
            disabled={!needsTimes}
            value={needsTimes ? checkIn : ''}
            onChange={(event) => setCheckIn(event.target.value)}
          />
        </FormField>
        <FormField
          id='bulk-staff-out'
          label='Check-out time'
          hint='Optional'
          error={errors.check_out_at}
        >
          <Input
            id='bulk-staff-out'
            type='time'
            disabled={!needsTimes}
            value={needsTimes ? checkOut : ''}
            onChange={(event) => setCheckOut(event.target.value)}
          />
        </FormField>
        <FormField
          id='bulk-staff-remarks'
          label='Reason'
          hint='Optional'
          error={errors.remarks}
          className='sm:col-span-2'
        >
          <Textarea
            id='bulk-staff-remarks'
            maxLength={255}
            placeholder='Biometric machine was down'
            value={remarks}
            onChange={(event) => setRemarks(event.target.value)}
          />
        </FormField>
      </form>
    </AppModal>
  )
}

export function BulkSectionsModal({
  date,
  slot,
  slotLabel,
  sectionIds,
  markedCount,
  onClose,
  onDone,
}: {
  date: string
  slot: AttendanceSlot
  slotLabel: string
  sectionIds: number[] | 'not_marked'
  markedCount: number
  onClose: () => void
  onDone: () => void
}) {
  const [status, setStatus] = useState<AttendanceStatus>('present')
  const [remarks, setRemarks] = useState('')
  const [overwrite, setOverwrite] = useState(false)
  const save = useAttendanceMutation((input: BulkSectionInput) => attendanceApi.bulkSections(input))
  const everyone = sectionIds === 'not_marked'
  const who = everyone ? 'every section not marked yet' : plural(sectionIds.length, 'section')

  return (
    <AppModal
      open
      onOpenChange={(open) => !open && onClose()}
      title={`Mark ${who} · ${slotLabel}`}
      description={`${formatDate(date)} · ${slotLabel}. Every student gets the same status; students on approved leave stay on leave.`}
      formId='bulk-sections-form'
      submitText='Mark attendance'
      loading={save.isPending}
    >
      <form
        id='bulk-sections-form'
        noValidate
        className='grid gap-4'
        onSubmit={async (event) => {
          event.preventDefault()
          try {
            const result = await save.mutateAsync({
              date,
              session: slot.session,
              ...(slot.period ? { period: slot.period } : {}),
              ...(everyone ? {} : { section_ids: sectionIds }),
              status,
              remarks: remarks.trim() || null,
              overwrite,
            })
            alerts.success(
              `Marked ${plural(result.marked, 'section')} (${plural(result.students, 'student')}).${skippedText(result.skipped)}`
            )
            onDone()
          } catch (error) {
            const fields = fieldErrorsOf(error)
            alerts.error(fields.root ?? Object.values(fields)[0] ?? 'Could not mark attendance')
          }
        }}
      >
        <FormField id='bulk-sections-status' label='Status for every student' required>
          <Combobox
            id='bulk-sections-status'
            label='Status for every student'
            value={status}
            placeholder='Choose status'
            options={ATTENDANCE_STATUSES.map((value) => ({
              value,
              label: ATTENDANCE_STATUS[value].label,
            }))}
            onChange={(value) => setStatus((value ?? 'present') as AttendanceStatus)}
            highlightSelected={false}
            className='sm:w-full'
          />
        </FormField>
        {status === 'absent' && date === today() && (
          <p className='rounded-lg border border-warning/30 bg-warning/5 px-3 py-2 text-xs text-warning'>
            Parents of every student marked absent get an alert.
          </p>
        )}
        <FormField id='bulk-sections-remarks' label='Reason' hint='Optional'>
          <Textarea
            id='bulk-sections-remarks'
            maxLength={255}
            placeholder='Marked by the office'
            value={remarks}
            onChange={(event) => setRemarks(event.target.value)}
          />
        </FormField>
        {!everyone && markedCount > 0 && (
          <div className='flex items-start gap-3 rounded-lg border p-3'>
            <Switch
              id='bulk-sections-overwrite'
              checked={overwrite}
              onCheckedChange={setOverwrite}
            />
            <label htmlFor='bulk-sections-overwrite' className='grid gap-0.5 text-sm'>
              <span className='font-medium'>
                Replace {plural(markedCount, 'section')} already marked
              </span>
              <span className='text-xs text-muted-foreground'>
                Off: those sections keep the teacher's marks and are skipped.
              </span>
            </label>
          </div>
        )}
      </form>
    </AppModal>
  )
}
