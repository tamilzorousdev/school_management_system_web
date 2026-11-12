import { useState } from 'react'
import { AppModal } from '@/components/common/app-modal'
import { DatePicker } from '@/components/common/date-picker'
import { FormField } from '@/components/common/form-field'
import { SegmentedControl } from '@/components/common/segmented-control'
import { Skeleton } from '@/components/ui/skeleton'
import { alerts } from '@/lib/alerts'
import { toApiError } from '@/lib/api/errors'
import {
  performanceApi,
  usePerformanceMutation,
  useSpecialRoster,
  type SpecialClass,
  type SpecialStatus,
} from '../api'

const STATUSES: { value: SpecialStatus; label: string }[] = [
  { value: 'present', label: 'P' },
  { value: 'absent', label: 'A' },
  { value: 'late', label: 'L' },
]

const today = () => new Date(Date.now() + 5.5 * 3600 * 1000).toISOString().slice(0, 10)

export function SpecialAttendanceModal({
  special,
  onClose,
}: {
  special: SpecialClass
  onClose: () => void
}) {
  const [date, setDate] = useState(today())
  const roster = useSpecialRoster(special.id, date)
  const [marks, setMarks] = useState<Record<string, Record<number, SpecialStatus>>>({})
  const save = usePerformanceMutation((items: { student_id: number; status: SpecialStatus }[]) =>
    performanceApi.mark(special.id, { date, items })
  )
  const data = roster.data?.date === date ? roster.data : undefined
  const statusOf = (studentId: number, saved: SpecialStatus) => marks[date]?.[studentId] ?? saved
  const absent =
    data?.students.filter((row) => statusOf(row.student_id, row.status) === 'absent').length ?? 0

  return (
    <AppModal
      open
      onOpenChange={(open) => !open && onClose()}
      title={`Attendance · ${special.title}`}
      description={`${special.section.name} · ${special.when}`}
      formId='special-attendance-form'
      submitText='Save attendance'
      loading={save.isPending}
    >
      <form
        id='special-attendance-form'
        noValidate
        className='grid gap-4'
        onSubmit={async (event) => {
          event.preventDefault()
          if (!data) return
          if (!data.runs_today) {
            alerts.error(`${special.title} does not run on this date`)
            return
          }
          try {
            await save.mutateAsync(
              data.students.map((row) => ({
                student_id: row.student_id,
                status: statusOf(row.student_id, row.status),
              }))
            )
            alerts.success(
              absent
                ? `Attendance saved. Parents of ${absent} absent ${absent === 1 ? 'student' : 'students'} are told.`
                : 'Attendance saved'
            )
            onClose()
          } catch (error) {
            alerts.error(toApiError(error).message)
          }
        }}
      >
        <FormField
          id='special-attendance-date'
          label='Date'
          hint={data && !data.runs_today ? 'This class does not run on this date' : undefined}
        >
          <DatePicker
            id='special-attendance-date'
            value={date}
            max={today()}
            onChange={(value: string) => value && setDate(value)}
          />
        </FormField>
        {!data ? (
          <Skeleton className='h-40' />
        ) : (
          <ul className='grid max-h-80 gap-1.5 overflow-auto'>
            {data.students.map((row) => (
              <li
                key={row.student_id}
                className='flex items-center justify-between gap-3 rounded-lg border px-3 py-2'
              >
                <span className='min-w-0 truncate text-sm font-medium'>
                  {row.roll_no ? `${row.roll_no}. ` : ''}
                  {row.full_name}
                </span>
                <SegmentedControl
                  label={`Attendance of ${row.full_name}`}
                  value={statusOf(row.student_id, row.status)}
                  onChange={(value: SpecialStatus) =>
                    setMarks((current) => ({
                      ...current,
                      [date]: { ...current[date], [row.student_id]: value },
                    }))
                  }
                  options={STATUSES}
                />
              </li>
            ))}
          </ul>
        )}
      </form>
    </AppModal>
  )
}
