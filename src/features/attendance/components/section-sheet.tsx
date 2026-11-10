import { useState } from 'react'
import { CheckCheck, Download, Save, UsersRound } from 'lucide-react'
import { Combobox } from '@/components/common/combobox'
import { DataTable, type Column } from '@/components/common/data-table'
import { EmptyState, ErrorState } from '@/components/common/display'
import { SegmentedControl } from '@/components/common/segmented-control'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { alerts } from '@/lib/alerts'
import { toApiError } from '@/lib/api/errors'
import { formatDate, formatDateTime } from '@/lib/format'
import { cn } from '@/lib/utils'
import {
  attendanceApi,
  useAttendanceMutation,
  useRoster,
  useSectionReport,
  type AttendanceSessionName,
  type AttendanceStatus,
  type MarkInput,
  type Roster,
  type SectionReportRow,
} from '../api'
import {
  ATTENDANCE_STATUS,
  ATTENDANCE_STATUSES,
  dayOffText,
  percentLabel,
  percentTone,
  recentMonths,
  today,
} from '../labels'
import { Notice } from './notice'

type View = 'mark' | 'report'

const ROW_TINT: Record<AttendanceStatus, string> = {
  present: '',
  absent: 'bg-destructive/5',
  late: 'bg-warning/5',
  half_day: 'bg-info/5',
  leave: 'bg-muted/60',
}

interface Mark {
  status: AttendanceStatus
  remarks: string
}

const STATUS_OPTIONS = ATTENDANCE_STATUSES.map((value) => ({
  value,
  label: ATTENDANCE_STATUS[value].short,
}))

const SESSION_TEXT: Record<AttendanceSessionName, string> = {
  morning: 'Morning attendance (1st period)',
  afternoon: 'Afternoon attendance (5th period)',
}

export function SectionSheet({
  sectionId,
  sectionName,
  date,
  session,
  canManage,
  onClose,
}: {
  sectionId: number | null
  sectionName: string
  date: string
  session: AttendanceSessionName
  canManage: boolean
  onClose: () => void
}) {
  const [view, setView] = useState<View>('mark')
  const roster = useRoster(sectionId, date, session)
  const data =
    roster.data?.date === date && roster.data.session === session ? roster.data : undefined

  return (
    <Sheet open={Boolean(sectionId)} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className='sm:max-w-2xl'>
        <SheetHeader>
          <SheetTitle>Class {data?.section.name ?? sectionName}</SheetTitle>
          <SheetDescription>
            {view === 'mark'
              ? `${SESSION_TEXT[session]} for ${formatDate(date)}`
              : 'Monthly attendance, both sessions together'}
          </SheetDescription>
          <div className='mt-2 flex flex-wrap items-center gap-2'>
            <SegmentedControl
              label='Section view'
              value={view}
              onChange={setView}
              options={[
                { value: 'mark', label: 'Mark attendance' },
                { value: 'report', label: 'Monthly report' },
              ]}
            />
            {view === 'mark' && data && (
              <Badge tone={data.marked ? 'success' : 'warning'} dot>
                {data.marked
                  ? `Marked${data.taken_by ? ` by ${data.taken_by.name}` : ''}`
                  : 'Not marked yet'}
              </Badge>
            )}
          </div>
        </SheetHeader>
        {view === 'report' ? (
          <SheetBody>
            <ReportView sectionId={sectionId} sectionName={data?.section.name ?? sectionName} />
          </SheetBody>
        ) : roster.isError && !data ? (
          <SheetBody>
            <ErrorState message={roster.error.message} onRetry={() => roster.refetch()} />
          </SheetBody>
        ) : !data ? (
          <SheetBody className='grid content-start gap-3'>
            {Array.from({ length: 6 }, (_, index) => (
              <Skeleton key={index} className='h-16' />
            ))}
          </SheetBody>
        ) : (
          <RosterEditor
            key={`${sectionId}-${date}-${session}`}
            roster={data}
            canManage={canManage}
            sectionId={sectionId!}
          />
        )}
      </SheetContent>
    </Sheet>
  )
}

function RosterEditor({
  roster,
  sectionId,
  canManage,
}: {
  roster: Roster
  sectionId: number
  canManage: boolean
}) {
  const [marks, setMarks] = useState<Record<number, Mark>>(() =>
    Object.fromEntries(
      roster.students.map((student) => [
        student.student_id,
        { status: student.status, remarks: student.remarks ?? '' },
      ])
    )
  )
  const save = useAttendanceMutation((input: MarkInput) => attendanceApi.mark(sectionId, input))
  const editable = canManage && roster.working_day
  const isToday = roster.date === today()

  const counts = ATTENDANCE_STATUSES.map((status) => ({
    status,
    count: Object.values(marks).filter((mark) => mark.status === status).length,
  }))

  const update = (studentId: number, patch: Partial<Mark>) =>
    setMarks((current) => ({ ...current, [studentId]: { ...current[studentId], ...patch } }))

  const allPresent = () =>
    setMarks((current) =>
      Object.fromEntries(
        roster.students.map((student) => [
          student.student_id,
          {
            ...current[student.student_id],
            status: student.on_leave ? 'leave' : 'present',
          },
        ])
      )
    )

  const submit = async () => {
    try {
      const result = await save.mutateAsync({
        date: roster.date,
        session: roster.session,
        items: roster.students.map((student) => ({
          student_id: student.student_id,
          status: marks[student.student_id].status,
          remarks: marks[student.student_id].remarks.trim() || null,
        })),
      })
      const absent = result.summary.absent
      alerts.success(
        isToday && absent
          ? `Attendance saved. Parents of ${absent} absent ${absent === 1 ? 'student were' : 'students were'} alerted.`
          : 'Attendance saved'
      )
    } catch (error) {
      alerts.error(toApiError(error).message)
    }
  }

  return (
    <>
      <SheetBody className='grid content-start gap-4'>
        {!roster.working_day && <Notice>{dayOffText(roster.holiday)}</Notice>}
        {roster.students.length === 0 ? (
          <EmptyState
            icon={UsersRound}
            title='No students in this section'
            description='Admit students or move them into this section first.'
          />
        ) : (
          <>
            <div className='flex flex-wrap items-center justify-between gap-2'>
              <div className='flex flex-wrap gap-1.5'>
                {counts.map(({ status, count }) => (
                  <Badge key={status} tone={count ? ATTENDANCE_STATUS[status].tone : 'neutral'}>
                    {ATTENDANCE_STATUS[status].label} {count}
                  </Badge>
                ))}
              </div>
              {editable && (
                <Button variant='outline' size='sm' onClick={allPresent}>
                  <CheckCheck />
                  All present
                </Button>
              )}
            </div>
            <ul className='grid divide-y rounded-lg border'>
              {roster.students.map((student) => {
                const mark = marks[student.student_id]
                return (
                  <li
                    key={student.student_id}
                    className={cn('grid gap-2 p-3', ROW_TINT[mark.status])}
                  >
                    <div className='flex flex-wrap items-center justify-between gap-2'>
                      <div className='flex min-w-0 items-center gap-3'>
                        <span className='tabular grid size-8 shrink-0 place-items-center rounded-md bg-muted text-xs font-bold text-muted-foreground'>
                          {student.roll_no ?? '—'}
                        </span>
                        <span className='grid min-w-0'>
                          <span className='flex items-center gap-1.5 truncate font-semibold'>
                            {student.full_name}
                            {student.on_leave && <Badge tone='info'>Approved leave</Badge>}
                          </span>
                          <span className='truncate font-mono text-xs text-muted-foreground'>
                            {student.admission_no}
                          </span>
                        </span>
                      </div>
                      {editable ? (
                        <SegmentedControl
                          label={`Status for ${student.full_name}`}
                          value={mark.status}
                          onChange={(status) => update(student.student_id, { status })}
                          options={STATUS_OPTIONS}
                        />
                      ) : (
                        <Badge tone={ATTENDANCE_STATUS[mark.status].tone}>
                          {ATTENDANCE_STATUS[mark.status].label}
                        </Badge>
                      )}
                    </div>
                    {editable ? (
                      <Input
                        aria-label={`Remarks for ${student.full_name}`}
                        placeholder='Remarks (optional)'
                        maxLength={255}
                        value={mark.remarks}
                        onChange={(event) =>
                          update(student.student_id, { remarks: event.target.value })
                        }
                        className='h-8 text-xs'
                      />
                    ) : (
                      mark.remarks && (
                        <p className='text-xs text-muted-foreground'>{mark.remarks}</p>
                      )
                    )}
                  </li>
                )
              })}
            </ul>
          </>
        )}
      </SheetBody>
      {editable && roster.students.length > 0 && (
        <div className='flex flex-wrap items-center justify-between gap-3 border-t px-5 py-3 sm:px-6'>
          <span className='text-xs text-muted-foreground'>
            {roster.taken_at
              ? `Last saved ${formatDateTime(roster.taken_at)}`
              : isToday
                ? 'Parents of absent students get an alert when you save.'
                : 'Not saved for this date yet.'}
          </span>
          <Button onClick={() => void submit()} loading={save.isPending}>
            <Save />
            Save attendance
          </Button>
        </div>
      )}
    </>
  )
}

function ReportView({
  sectionId,
  sectionName,
}: {
  sectionId: number | null
  sectionName: string
}) {
  const months = recentMonths()
  const [month, setMonth] = useState(months[0].value)
  const report = useSectionReport(sectionId, month)
  const data = report.data
  const [downloading, setDownloading] = useState(false)

  const columns: Column<SectionReportRow>[] = [
    {
      key: 'name',
      header: 'Student',
      cell: (row) => (
        <span className='flex items-center gap-2'>
          <span className='tabular w-6 text-xs text-muted-foreground'>{row.roll_no ?? '—'}</span>
          <span className='font-semibold'>{row.full_name}</span>
        </span>
      ),
    },
    { key: 'present', header: 'Present', align: 'right', cell: (row) => row.present },
    { key: 'absent', header: 'Absent', align: 'right', cell: (row) => row.absent },
    { key: 'late', header: 'Late', align: 'right', cell: (row) => row.late },
    { key: 'half_day', header: 'Half day', align: 'right', cell: (row) => row.half_day },
    { key: 'leave', header: 'Leave', align: 'right', cell: (row) => row.leave },
    {
      key: 'percent',
      header: 'Attendance',
      align: 'right',
      cell: (row) => <Badge tone={percentTone(row.percent)}>{percentLabel(row.percent)}</Badge>,
    },
  ]

  return (
    <div className='grid gap-4'>
      <div className='flex flex-wrap items-center gap-2'>
        <Combobox
          id='report-month'
          label='Month'
          value={month}
          placeholder='Choose month'
          searchPlaceholder='Search months'
          options={months}
          onChange={(value) => value && setMonth(value)}
          highlightSelected={false}
        />
        {data && (
          <span className='text-xs text-muted-foreground'>
            {data.marked_days} of {data.working_days} school days marked
          </span>
        )}
        <Button
          variant='outline'
          size='sm'
          className='ml-auto'
          disabled={!data || !sectionId}
          loading={downloading}
          onClick={async () => {
            if (!sectionId) return
            setDownloading(true)
            try {
              await attendanceApi.downloadSectionReport(sectionId, month, sectionName)
            } catch (error) {
              alerts.error(toApiError(error).message)
            } finally {
              setDownloading(false)
            }
          }}
        >
          <Download />
          Excel
        </Button>
      </div>
      <div className='overflow-hidden rounded-lg border'>
        <DataTable
          rows={data?.students ?? []}
          columns={columns}
          rowKey={(row) => row.student_id}
          loading={report.isFetching}
          error={report.isError ? report.error.message : null}
          onRetry={() => report.refetch()}
          empty={{
            icon: UsersRound,
            title: 'No attendance this month',
            description: 'Nothing was marked for this section in the chosen month.',
          }}
          card={(row) => (
            <div className='grid gap-1'>
              <div className='flex items-center justify-between gap-2'>
                <span className='truncate font-semibold'>{row.full_name}</span>
                <Badge tone={percentTone(row.percent)}>{percentLabel(row.percent)}</Badge>
              </div>
              <span className='text-xs text-muted-foreground'>
                Present {row.present} · Absent {row.absent} · Late {row.late} · Half day {row.half_day} · Leave {row.leave}
              </span>
            </div>
          )}
        />
      </div>
    </div>
  )
}
