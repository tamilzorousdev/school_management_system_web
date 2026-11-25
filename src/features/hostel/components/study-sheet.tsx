import { useState } from 'react'
import { CheckCheck, ListChecks, Save } from 'lucide-react'
import { DataTable, type Column } from '@/components/common/data-table'
import { Badge, type BadgeTone } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { alerts } from '@/lib/alerts'
import { toApiError } from '@/lib/api/errors'
import { cn } from '@/lib/utils'
import { useHostelMutation } from '../api'
import {
  studyApi,
  useStudySheet,
  type StudyCounts,
  type StudyMark,
  type StudyMarkInput,
  type StudySheetEntry,
} from '../api-duty'
import { dayLabel, shiftTime, STUDY_MARK } from './duty-helpers'
import { InfoNote, StudentCell } from './leave-form-parts'

const MARKS: StudyMark[] = ['present', 'absent', 'late', 'excused']

const activeTone: Record<BadgeTone, string> = {
  success: 'border-success/50 bg-success/15 text-success',
  danger: 'border-destructive/50 bg-destructive/15 text-destructive',
  warning: 'border-warning/50 bg-warning/15 text-warning',
  info: 'border-info/50 bg-info/15 text-info',
  neutral: 'border-border bg-muted text-foreground',
}

const COUNT_KEYS: { key: keyof StudyCounts; label: string; tone: BadgeTone }[] = [
  { key: 'present', label: 'Present', tone: 'success' },
  { key: 'absent', label: 'Absent', tone: 'danger' },
  { key: 'late', label: 'Late', tone: 'warning' },
  { key: 'excused', label: 'Excused', tone: 'info' },
  { key: 'unmarked', label: 'Not marked', tone: 'neutral' },
]

export function StudySheetView({
  scheduleId,
  date,
  canMark,
  lockedReason,
}: {
  scheduleId: number
  date: string
  canMark: boolean
  lockedReason?: string
}) {
  const sheet = useStudySheet({ schedule_id: scheduleId, date })
  const [pending, setPending] = useState<Record<number, StudyMark>>({})
  const mark = useHostelMutation((entries: StudyMarkInput['entries']) =>
    studyApi.mark({ schedule_id: scheduleId, date, entries })
  )

  const data = sheet.data
  const students = data?.students ?? []
  const notRunning = data ? !data.runs_on_date : false
  const turnedOff = data ? !data.schedule.active : false
  const editable = canMark && !lockedReason && !notRunning && !turnedOff

  const nextFor = (entry: StudySheetEntry) =>
    pending[entry.admission_id] ??
    (entry.status ? undefined : (entry.suggested_status ?? undefined))
  const shownFor = (entry: StudySheetEntry) => nextFor(entry) ?? entry.status ?? null
  const changes = students.flatMap((entry) => {
    const next = nextFor(entry)
    return next && next !== entry.status ? [{ admission_id: entry.admission_id, status: next }] : []
  })
  const blankCount = students.filter(
    (entry) => !entry.status && !entry.suggested_status && !pending[entry.admission_id]
  ).length

  const setMark = (entry: StudySheetEntry, status: StudyMark) =>
    setPending((prev) => ({ ...prev, [entry.admission_id]: status }))

  const fillPresent = () =>
    setPending((prev) => {
      const next = { ...prev }
      students.forEach((entry) => {
        if (!entry.status && !entry.suggested_status && !next[entry.admission_id]) {
          next[entry.admission_id] = 'present'
        }
      })
      return next
    })

  const save = async () => {
    try {
      await mark.mutateAsync(changes)
      alerts.success(`${changes.length} ${changes.length === 1 ? 'mark' : 'marks'} saved`)
      setPending({})
    } catch (error) {
      alerts.error(toApiError(error).message)
    }
  }

  const columns: Column<StudySheetEntry>[] = [
    {
      key: 'student',
      header: 'Student',
      cell: (row) => <StudentCell student={row.student} />,
    },
    {
      key: 'place',
      header: 'Room / seat',
      cell: (row) => <PlaceText entry={row} />,
    },
    {
      key: 'status',
      header: 'Status',
      hideBelow: 'lg',
      cell: (row) => <StatusCell entry={row} pending={pending[row.admission_id]} />,
    },
    {
      key: 'mark',
      header: 'Mark',
      cell: (row) => (
        <MarkButtons
          name={row.student.name}
          value={shownFor(row)}
          disabled={!editable}
          onChange={(status) => setMark(row, status)}
        />
      ),
    },
  ]

  return (
    <div className='grid gap-4'>
      {lockedReason && <InfoNote tone='warning'>{lockedReason}</InfoNote>}
      {!lockedReason && turnedOff && (
        <InfoNote tone='warning'>
          This study schedule is turned off, so it cannot be marked.
        </InfoNote>
      )}
      {!lockedReason && !turnedOff && notRunning && (
        <InfoNote tone='warning'>
          This schedule does not run on {dayLabel(date)}. Pick a day it runs on to mark it.
        </InfoNote>
      )}

      <div className='flex flex-wrap items-center gap-2'>
        {COUNT_KEYS.map((item) => (
          <Badge key={item.key} tone={item.tone} className='px-2.5 py-1'>
            {item.label}
            <span className='tabular font-extrabold'>{data?.counts[item.key] ?? 0}</span>
          </Badge>
        ))}
        <span className='tabular text-xs text-muted-foreground'>
          of {data?.counts.total ?? 0} students
        </span>
      </div>

      <Card className='overflow-hidden'>
        <div className='flex flex-wrap items-center gap-2 border-b px-4 py-3'>
          <div className='grid gap-0.5'>
            <span className='text-sm font-semibold'>
              {data?.schedule.name ?? 'Study sheet'} · {dayLabel(date)}
            </span>
            {data && (
              <span className='text-xs text-muted-foreground'>
                {shiftTime(data.schedule.start_time, data.schedule.end_time)} ·{' '}
                {[data.schedule.hostel_name, data.schedule.block_name, data.schedule.hall_name]
                  .filter(Boolean)
                  .join(' · ')}
              </span>
            )}
          </div>
          {editable && (
            <Button
              variant='outline'
              size='sm'
              className='ml-auto'
              disabled={blankCount === 0}
              onClick={fillPresent}
            >
              <CheckCheck />
              Mark all unmarked present
            </Button>
          )}
        </div>
        <DataTable
          rows={students}
          columns={columns}
          rowKey={(row) => row.admission_id}
          loading={sheet.isFetching}
          error={sheet.isError ? sheet.error.message : null}
          onRetry={() => sheet.refetch()}
          empty={{
            icon: ListChecks,
            title: 'No students in this study group',
            description:
              'Residents of the schedule’s hostel or block, or students seated in its study hall, appear here.',
          }}
          card={(row) => (
            <div className='grid gap-3'>
              <div className='flex items-start justify-between gap-2'>
                <StudentCell student={row.student} />
                <StatusCell entry={row} pending={pending[row.admission_id]} />
              </div>
              <PlaceText entry={row} />
              <MarkButtons
                name={row.student.name}
                value={shownFor(row)}
                disabled={!editable}
                onChange={(status) => setMark(row, status)}
              />
            </div>
          )}
        />
      </Card>

      {editable && changes.length > 0 && (
        <div className='sticky bottom-4 z-10'>
          <Card className='flex flex-row flex-wrap items-center justify-between gap-3 border-primary/40 px-4 py-3 shadow-lg'>
            <span className='text-sm font-semibold'>
              {changes.length} {changes.length === 1 ? 'mark' : 'marks'} not saved
            </span>
            <div className='flex gap-2'>
              <Button variant='ghost' size='sm' onClick={() => setPending({})}>
                Discard
              </Button>
              <Button size='sm' loading={mark.isPending} onClick={() => void save()}>
                <Save />
                Save {changes.length} {changes.length === 1 ? 'mark' : 'marks'}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}

function PlaceText({ entry }: { entry: StudySheetEntry }) {
  return (
    <div className='grid gap-0.5 text-sm'>
      <span className='tabular'>
        {entry.room_no ? `${entry.room_no} / ${entry.bed_no ?? '—'}` : 'No bed'}
      </span>
      <span className='text-xs text-muted-foreground'>
        {[entry.block_name, entry.seat_no ? `Seat ${entry.seat_no}` : null]
          .filter(Boolean)
          .join(' · ') || '—'}
      </span>
    </div>
  )
}

function StatusCell({ entry, pending }: { entry: StudySheetEntry; pending?: StudyMark }) {
  return (
    <div className='flex flex-wrap items-center gap-1'>
      {entry.status ? (
        <Badge tone={STUDY_MARK[entry.status].tone} dot>
          {STUDY_MARK[entry.status].label}
        </Badge>
      ) : (
        <Badge tone='neutral'>Not marked</Badge>
      )}
      {!entry.status && entry.suggested_status && (
        <span className='text-xs text-muted-foreground'>
          Away on leave: {STUDY_MARK[entry.suggested_status].label.toLowerCase()}
        </span>
      )}
      {pending && pending !== entry.status && <Badge tone='warning'>Not saved</Badge>}
    </div>
  )
}

function MarkButtons({
  name,
  value,
  disabled,
  onChange,
}: {
  name: string
  value: StudyMark | null
  disabled: boolean
  onChange: (status: StudyMark) => void
}) {
  return (
    <div role='radiogroup' aria-label={`Mark ${name}`} className='flex flex-wrap gap-1'>
      {MARKS.map((status) => {
        const active = value === status
        return (
          <button
            key={status}
            type='button'
            role='radio'
            aria-checked={active}
            disabled={disabled}
            onClick={() => onChange(status)}
            className={cn(
              'h-8 rounded-md border px-2.5 text-xs font-semibold transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40 disabled:cursor-not-allowed disabled:opacity-60',
              active
                ? activeTone[STUDY_MARK[status].tone]
                : 'bg-card text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            {STUDY_MARK[status].label}
          </button>
        )
      })}
    </div>
  )
}
