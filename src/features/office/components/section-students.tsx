import { Bus, CircleOff, UsersRound } from 'lucide-react'
import { Avatar } from '@/components/common/avatar'
import { DataTable, type Column } from '@/components/common/data-table'
import { FilterSelect, ListToolbar, SearchBox } from '@/components/common/list-toolbar'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { useSectionStudents, type SectionStudent } from '../api'
import { FILTER_OPTIONS, STUDENT_FLAG, TODAY_STATUS, flagTone, percent, rupees } from '../labels'
import type { OfficeSearch } from '../search'
import { Chips } from './shared'

const LIMIT = 20

interface SectionStudentsProps {
  sectionId: number
  search: OfficeSearch
  onSearch: (patch: Partial<OfficeSearch>) => void
  onOpen: (student: SectionStudent) => void
}

function TodayBadge({ today }: { today: string | null }) {
  if (!today) return <Badge tone='neutral'>Not marked</Badge>
  const status = TODAY_STATUS[today] ?? { label: today, tone: 'neutral' as const }
  return (
    <Badge tone={status.tone} dot>
      {status.label}
    </Badge>
  )
}

function FeeCell({ student }: { student: SectionStudent }) {
  if (student.fee_status === 'none') return <span className='text-[12px] text-slate-400'>No fees</span>
  if (student.fee_status === 'paid') return <Badge tone='success'>Paid</Badge>
  return (
    <span className='tabular text-[13px] leading-[18px] font-semibold text-amber-600 dark:text-amber-400'>
      {rupees(student.fee_due)}
    </span>
  )
}

function ExamCell({ student }: { student: SectionStudent }) {
  if (student.last_exam_percent === null) return <span className='text-[12px] text-slate-400'>—</span>
  return (
    <span className='tabular text-[13px] leading-[18px] font-semibold text-slate-700 dark:text-slate-300'>
      {percent(student.last_exam_percent)}
      {student.rank !== null && (
        <span className='text-[12px] font-normal text-slate-500 dark:text-slate-400'> · rank {student.rank}</span>
      )}
    </span>
  )
}

const flagChips = (student: SectionStudent) =>
  student.flags.map((code) => ({
    key: code,
    label: STUDENT_FLAG[code]?.label ?? code,
    tone: flagTone(code),
  }))

export function SectionStudents({ sectionId, search, onSearch, onOpen }: SectionStudentsProps) {
  const students = useSectionStudents(sectionId, {
    page: search.page,
    limit: LIMIT,
    search: search.search,
    filter: search.filter,
    sort: search.sort,
    order: search.order,
  })
  const rows = students.data?.items ?? []
  const filtered = Boolean(search.search || (search.filter && search.filter !== 'all'))

  const columns: Column<SectionStudent>[] = [
    {
      key: 'name',
      header: 'STUDENT',
      sortKey: 'name',
      cell: (student) => (
        <div className='flex items-center gap-3'>
          <Avatar name={student.name} src={student.photo_url} />
          <div className='grid min-w-0'>
            <span className='truncate text-[13px] leading-[18px] font-semibold text-slate-900 dark:text-slate-100'>
              {student.name}
            </span>
            <span className='truncate text-[12px] leading-[16px] text-slate-500 dark:text-slate-400 font-mono'>
              {student.admission_no}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: 'roll_no',
      header: 'ROLL',
      sortKey: 'roll_no',
      cell: (student) => (
        <span className='tabular text-[13px] leading-[18px] font-semibold text-slate-700 dark:text-slate-300'>
          {student.roll_no ?? '—'}
        </span>
      ),
    },
    { key: 'today', header: 'TODAY', cell: (student) => <TodayBadge today={student.today} /> },
    {
      key: 'attendance',
      header: 'ATTENDANCE',
      sortKey: 'attendance',
      cell: (student) => (
        <span className='tabular text-[13px] leading-[18px] font-semibold text-slate-700 dark:text-slate-300'>
          {percent(student.attendance_percent)}
        </span>
      ),
    },
    {
      key: 'fee_due',
      header: 'FEE DUE',
      sortKey: 'fee_due',
      cell: (student) => <FeeCell student={student} />,
    },
    {
      key: 'last_exam',
      header: 'LAST EXAM',
      sortKey: 'last_exam',
      cell: (student) => <ExamCell student={student} />,
    },
    {
      key: 'bus',
      header: 'BUS',
      hideBelow: 'xl',
      cell: (student) =>
        student.transport ? (
          <span className='grid max-w-48 min-w-0'>
            <span className='truncate text-[13px] leading-[18px] font-medium text-slate-800 dark:text-slate-200'>
              {student.transport.route}
            </span>
            {student.transport.stop && (
              <span className='truncate text-[12px] leading-[16px] text-slate-500 dark:text-slate-400'>
                {student.transport.stop}
              </span>
            )}
          </span>
        ) : (
          <span className='text-[12px] text-slate-400'>—</span>
        ),
    },
    {
      key: 'flags',
      header: 'FLAGS',
      hideBelow: 'lg',
      cell: (student) => <Chips items={flagChips(student)} />,
    },
  ]

  return (
    <Card className='overflow-hidden'>
      <ListToolbar
        summary={
          students.data
            ? `${students.data.total} ${students.data.total === 1 ? 'student' : 'students'}`
            : ''
        }
        onClear={filtered ? () => onSearch({ search: undefined, filter: undefined }) : undefined}
      >
        <SearchBox
          value={search.search ?? ''}
          onChange={(value) => onSearch({ search: value || undefined })}
          placeholder='Search name or admission no'
          label='Search students'
        />
        <FilterSelect
          id='office-student-filter'
          label='Filter students'
          allLabel='All students'
          value={search.filter === 'all' ? undefined : search.filter}
          options={FILTER_OPTIONS}
          onChange={(filter) => onSearch({ filter: filter as OfficeSearch['filter'] })}
        />
      </ListToolbar>
      <DataTable
        rows={rows}
        columns={columns}
        rowKey={(student) => student.id}
        loading={students.isFetching}
        error={students.isError ? students.error.message : null}
        onRetry={() => students.refetch()}
        onRowClick={onOpen}
        sort={{ sort: search.sort, order: search.order ?? 'asc' }}
        onSortChange={(next) => onSearch(next as Partial<OfficeSearch>)}
        empty={{
          icon: filtered ? CircleOff : UsersRound,
          title: filtered ? 'No students match' : 'No students in this section',
          description: filtered ? 'Try another name, or clear the filters.' : undefined,
        }}
        card={(student) => (
          <div className='grid gap-2'>
            <div className='flex items-center gap-3'>
              <Avatar name={student.name} src={student.photo_url} />
              <div className='grid min-w-0 flex-1'>
                <span className='truncate text-[13px] leading-[18px] font-semibold text-slate-900 dark:text-slate-100'>
                  {student.name}
                </span>
                <span className='truncate text-[12px] leading-[16px] text-slate-500 dark:text-slate-400 font-mono'>
                  {student.admission_no} · Roll {student.roll_no ?? '—'}
                </span>
              </div>
              <TodayBadge today={student.today} />
            </div>
            <div className='flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-slate-600 dark:text-slate-400'>
              <span>Attendance {percent(student.attendance_percent)}</span>
              <span className='flex items-center gap-1'>
                Fee <FeeCell student={student} />
              </span>
              <span>
                Exam <ExamCell student={student} />
              </span>
              {student.transport && (
                <span className='flex min-w-0 items-center gap-1'>
                  <Bus className='size-3.5 shrink-0' />
                  <span className='truncate'>{student.transport.route}</span>
                </span>
              )}
            </div>
            <Chips items={flagChips(student)} />
          </div>
        )}
        pagination={
          students.data && {
            page: students.data.page,
            limit: students.data.limit,
            total: students.data.total,
            label: 'students',
            onPageChange: (page) => onSearch({ page }),
          }
        }
      />
    </Card>
  )
}
