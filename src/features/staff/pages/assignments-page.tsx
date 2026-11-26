import { useMemo, useState } from 'react'
import { getRouteApi, Link, useNavigate } from '@tanstack/react-router'
import {
  ArrowLeft,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  History,
  Lock,
  Save,
  Undo2,
  UserRoundX,
  UsersRound,
} from 'lucide-react'
import { AppModal } from '@/components/common/app-modal'
import { Combobox } from '@/components/common/combobox'
import { EmptyState, ErrorState } from '@/components/common/display'
import { FilterSelect } from '@/components/common/list-toolbar'
import { Page, PageHeader } from '@/components/common/page'
import { useShortcut } from '@/components/shortcuts/shortcut-context'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { can, useMe } from '@/features/auth/api'
import { useClasses } from '@/features/setup/api'
import { alerts } from '@/lib/alerts'
import { formatDate, formatDateTime } from '@/lib/format'
import { toApiError } from '@/lib/api/errors'
import { cn } from '@/lib/utils'
import {
  staffApi,
  useAssignmentChanges,
  useAssignments,
  useStaffMutation,
  type AssignmentItem,
  type MatrixCell,
  type MatrixRow,
  type MatrixTeacher,
} from '../api'
import { LoadBar } from '../components/load-bar'
import { loadTone } from '../labels'

const route = getRouteApi('/_app/staff/assignments')
const DEFAULT_PERIODS = 5

interface Edit {
  section_id: number
  subject_id: number
  teacher_user_id: number | null
  periods_per_week: number | null
  original_teacher: number | null
  original_periods: number | null
}

type Edits = Record<string, Edit>

const cellKey = (sectionId: number, subjectId: number) => `${sectionId}:${subjectId}`
const shiftWeek = (start: string, days: number) => {
  const date = new Date(`${start}T00:00:00Z`)
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}
const periodsOf = (edit: Edit) => edit.periods_per_week ?? edit.original_periods ?? DEFAULT_PERIODS

export function AssignmentsPage() {
  const search = route.useSearch()
  const navigate = useNavigate({ from: '/staff/assignments' })
  const allowed = can(useMe().data, 'staff.manage')
  const classes = useClasses()
  const [week, setWeek] = useState<string>()
  const [showChanges, setShowChanges] = useState(false)
  const matrix = useAssignments({ class_id: search.class_id, week })
  const [edits, setEdits] = useState<Edits>({})
  const weekInfo = matrix.data?.week
  const canManage = allowed && !weekInfo?.read_only
  const limit = matrix.data?.class_periods_per_week ?? 30
  const save = useStaffMutation((items: AssignmentItem[]) =>
    staffApi.saveAssignments({ academic_year_id: matrix.data?.academic_year.id, items })
  )

  useShortcut('app.refresh', () => void matrix.refetch())

  const teachers = useMemo(() => {
    const loads = new Map(
      (matrix.data?.teachers ?? []).map((teacher) => [teacher.user_id, teacher.load_periods])
    )
    for (const edit of Object.values(edits)) {
      if (edit.original_teacher !== null)
        loads.set(
          edit.original_teacher,
          (loads.get(edit.original_teacher) ?? 0) - (edit.original_periods ?? 0)
        )
      if (edit.teacher_user_id !== null)
        loads.set(edit.teacher_user_id, (loads.get(edit.teacher_user_id) ?? 0) + periodsOf(edit))
    }
    return (matrix.data?.teachers ?? []).map((teacher) => ({
      ...teacher,
      load_periods: loads.get(teacher.user_id) ?? teacher.load_periods,
    }))
  }, [matrix.data, edits])

  const teacherOptions = teachers.map((teacher) => ({
    value: String(teacher.user_id),
    label: teacher.name,
    hint: `${teacher.load_periods}/${teacher.max_periods_per_week}`,
  }))

  const rows = matrix.data?.rows ?? []
  const unassigned = rows.reduce(
    (count, row) =>
      count +
      row.cells.filter((cell) => {
        const edit = edits[cellKey(row.section_id, cell.subject_id)]
        return (edit ? edit.teacher_user_id : cell.teacher_user_id) === null
      }).length,
    0
  )
  const changes = Object.keys(edits).length
  const sectionTotal = (row: MatrixRow) =>
    row.cells.reduce((sum, cell) => {
      const edit = edits[cellKey(row.section_id, cell.subject_id)]
      const teacher = edit ? edit.teacher_user_id : cell.teacher_user_id
      const periods = edit ? periodsOf(edit) : (cell.periods_per_week ?? 0)
      return sum + (teacher === null ? 0 : periods)
    }, 0)
  const overClasses = rows.filter((row) => {
    const total = sectionTotal(row)
    return total > limit && total > row.periods_total
  })

  const change = (
    row: MatrixRow,
    cell: MatrixCell,
    patch: Partial<Pick<Edit, 'teacher_user_id' | 'periods_per_week'>>
  ) => {
    const key = cellKey(row.section_id, cell.subject_id)
    setEdits((current) => {
      const base: Edit = current[key] ?? {
        section_id: row.section_id,
        subject_id: cell.subject_id,
        teacher_user_id: cell.teacher_user_id,
        periods_per_week: cell.periods_per_week,
        original_teacher: cell.teacher_user_id,
        original_periods: cell.periods_per_week,
      }
      const next = { ...base, ...patch }
      const unchanged =
        next.teacher_user_id === next.original_teacher &&
        (next.teacher_user_id === null ||
          periodsOf(next) === (next.original_periods ?? DEFAULT_PERIODS))
      const { [key]: _removed, ...rest } = current
      return unchanged ? rest : { ...current, [key]: next }
    })
  }

  const submit = async () => {
    const items: AssignmentItem[] = Object.values(edits).map((edit) => ({
      section_id: edit.section_id,
      subject_id: edit.subject_id,
      teacher_user_id: edit.teacher_user_id,
      ...(edit.teacher_user_id !== null ? { periods_per_week: periodsOf(edit) } : {}),
    }))
    try {
      await save.mutateAsync(items)
      alerts.success(`${items.length} ${items.length === 1 ? 'change' : 'changes'} saved`)
      setEdits({})
    } catch (error) {
      alerts.error(toApiError(error).message)
    }
  }

  return (
    <Page className={cn(changes > 0 && 'pb-28')}>
      <Link
        to='/staff'
        search={{ page: 1 }}
        className='inline-flex items-center gap-1.5 self-start text-[13px] font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
      >
        <ArrowLeft className='size-4 stroke-[1.75]' />
        All staff
      </Link>
      <PageHeader
        eyebrow='People'
        title='Teacher assignments'
        description={`Who teaches each subject in each section${matrix.data ? ` in ${matrix.data.academic_year.name}` : ' this year'}. Pick a teacher and the periods a week, then save all changes at once.`}
      />

      <div className='flex flex-wrap items-center gap-2'>
        <FilterSelect
          id='class-filter'
          label='Filter by class'
          allLabel='All classes'
          value={search.class_id ? String(search.class_id) : undefined}
          options={(classes.data ?? []).map((item) => ({
            value: String(item.id),
            label: `Class ${item.name}`,
          }))}
          onChange={(value) =>
            navigate({ search: { class_id: value ? Number(value) : undefined }, replace: true })
          }
          className='h-8 text-[13px] border-[#9AA49F]'
        />
        {matrix.data && (
          <Badge tone={unassigned ? 'warning' : 'success'} className='text-[11.5px] font-medium'>
            {unassigned ? (
              <>
                <UserRoundX className='size-3.5 stroke-[1.75]' />
                {unassigned} {unassigned === 1 ? 'subject has' : 'subjects have'} no teacher
              </>
            ) : (
              'Every subject has a teacher'
            )}
          </Badge>
        )}
        {!allowed && <Badge tone='neutral' className='text-[11.5px] font-medium'>View only</Badge>}
      </div>

      {weekInfo && (
        <Card className='flex flex-row flex-wrap items-center justify-between gap-2 border border-[#EDF0EE] bg-white p-2.5 sm:px-3.5 dark:border-slate-800 dark:bg-slate-900'>
          <div className='flex items-center gap-1.5'>
            <Button
              size='icon-sm'
              variant='outline'
              aria-label='Previous week'
              disabled={changes > 0}
              className='border-[#EDF0EE] bg-white text-[#3C4440] hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300'
              onClick={() => setWeek(shiftWeek(weekInfo.start, -7))}
            >
              <ChevronLeft className='size-4 stroke-[1.75]' />
            </Button>
            <span className='text-[13px] font-semibold text-slate-800 dark:text-slate-200'>
              Week of {formatDate(weekInfo.start)} – {formatDate(weekInfo.end)}
              {weekInfo.is_current ? ' (this week)' : ''}
            </span>
            <Button
              size='icon-sm'
              variant='outline'
              aria-label='Next week'
              disabled={weekInfo.is_current || changes > 0}
              className='border-[#EDF0EE] bg-white text-[#3C4440] hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300'
              onClick={() => setWeek(shiftWeek(weekInfo.start, 7))}
            >
              <ChevronRight className='size-4 stroke-[1.75]' />
            </Button>
            {!weekInfo.is_current && (
              <Button
                size='sm'
                variant='secondary'
                className='border-[#C6CEC9] bg-white text-[#171B19] hover:bg-[#F9FAFB] font-medium'
                onClick={() => setWeek(undefined)}
              >
                This week
              </Button>
            )}
          </div>
          <div className='flex flex-wrap items-center gap-2'>
            {weekInfo.read_only && (
              <Badge tone='neutral' className='text-[11.5px] font-medium'>
                <Lock className='size-3 stroke-[1.75]' />
                As it was that week
              </Badge>
            )}
            <Button
              size='sm'
              variant='secondary'
              className='border-[#C6CEC9] bg-white text-[#171B19] hover:bg-[#F9FAFB] font-medium'
              onClick={() => setShowChanges(true)}
            >
              <History className='size-3.5 stroke-[1.75]' />
              Changes this week ({weekInfo.changes})
            </Button>
          </div>
        </Card>
      )}

      {matrix.isPending ? (
        <div className='grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]'>
          <div className='grid gap-4'>
            {Array.from({ length: 3 }, (_, index) => (
              <Skeleton key={index} className='h-48 w-full rounded-xl' />
            ))}
          </div>
          <Skeleton className='h-80 w-full rounded-xl' />
        </div>
      ) : matrix.isError ? (
        <Card className='border border-[#EDF0EE] bg-white dark:border-slate-800 dark:bg-slate-900'>
          <ErrorState message={matrix.error.message} onRetry={() => matrix.refetch()} />
        </Card>
      ) : rows.length === 0 ? (
        <Card className='border border-[#EDF0EE] bg-white p-8 dark:border-slate-800 dark:bg-slate-900'>
          <EmptyState
            icon={BookOpen}
            title='No sections this year'
            description='Add classes and sections in School setup first.'
          />
        </Card>
      ) : (
        <div className='grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]'>
          <div className='grid gap-4'>
            {rows.map((row) => (
              <SectionCard
                key={row.section_id}
                row={row}
                total={sectionTotal(row)}
                limit={limit}
                edits={edits}
                canManage={canManage}
                teacherOptions={teacherOptions}
                onChange={change}
              />
            ))}
          </div>
          <TeachersPanel teachers={teachers} />
        </div>
      )}

      {changes > 0 && (
        <div className='fixed inset-x-0 bottom-0 z-40 px-4 pb-4 sm:px-6 lg:px-8'>
          <Card className='mx-auto flex max-w-3xl flex-row flex-wrap items-center justify-between gap-3 border border-[#EDF0EE] bg-white p-3.5 shadow-xl sm:px-5 dark:border-slate-800 dark:bg-slate-900'>
            <span className='grid text-[13px] font-semibold text-slate-900 dark:text-slate-100'>
              {changes} unsaved {changes === 1 ? 'change' : 'changes'}
              {overClasses.length > 0 && (
                <span className='text-[12px] font-normal text-destructive'>
                  {overClasses
                    .map((row) => `Class ${row.class_name} - ${row.section_name}`)
                    .join(', ')}{' '}
                  would go over {limit} periods a week. Lower some periods first.
                </span>
              )}
            </span>
            <div className='flex gap-2'>
              <Button
                variant='secondary'
                size='sm'
                className='border-[#C6CEC9] bg-white text-[#171B19] hover:bg-[#F9FAFB] font-medium'
                onClick={() => setEdits({})}
                disabled={save.isPending}
              >
                <Undo2 className='size-3.5 stroke-[1.75]' />
                Discard
              </Button>
              <Button
                variant='primary'
                size='sm'
                onClick={() => void submit()}
                loading={save.isPending}
                disabled={overClasses.length > 0}
              >
                <Save className='size-3.5 stroke-[1.75]' />
                Save {changes} {changes === 1 ? 'change' : 'changes'}
              </Button>
            </div>
          </Card>
        </div>
      )}
      {showChanges && weekInfo && (
        <ChangesModal week={weekInfo.start} onClose={() => setShowChanges(false)} />
      )}
    </Page>
  )
}

function ChangesModal({ week, onClose }: { week: string; onClose: () => void }) {
  const changes = useAssignmentChanges(week)
  const rows = changes.data ?? []
  return (
    <AppModal
      open
      onOpenChange={(open) => !open && onClose()}
      size='lg'
      title='Changes this week'
      description={`What changed from the week of ${formatDate(week)}. Earlier weeks keep what they had.`}
    >
      {changes.isPending ? (
        <Skeleton className='h-40' />
      ) : changes.isError ? (
        <ErrorState message={changes.error.message} onRetry={() => changes.refetch()} />
      ) : !rows.length ? (
        <EmptyState icon={History} title='No changes in this week' className='py-6' />
      ) : (
        <ul className='grid max-h-[60vh] divide-y divide-[#EDF0EE] overflow-y-auto rounded-xl border border-[#EDF0EE] dark:divide-slate-800 dark:border-slate-800'>
          {rows.map((row) => (
            <li key={row.id} className='grid gap-1 p-3 text-[13px]'>
              <span className='font-semibold text-slate-900 dark:text-slate-100'>{row.summary}</span>
              <span className='text-[12px] text-slate-500 dark:text-slate-400'>
                {formatDateTime(row.at)}
                {row.changed_by ? ` · by ${row.changed_by.name}` : ''}
              </span>
            </li>
          ))}
        </ul>
      )}
    </AppModal>
  )
}

function SectionCard({
  row,
  total,
  limit,
  edits,
  canManage,
  teacherOptions,
  onChange,
}: {
  row: MatrixRow
  total: number
  limit: number
  edits: Edits
  canManage: boolean
  teacherOptions: { value: string; label: string; hint: string }[]
  onChange: (
    row: MatrixRow,
    cell: MatrixCell,
    patch: Partial<Pick<Edit, 'teacher_user_id' | 'periods_per_week'>>
  ) => void
}) {
  return (
    <Card className='overflow-hidden border border-[#EDF0EE] bg-white dark:border-slate-800 dark:bg-slate-900'>
      <div className='flex flex-wrap items-center justify-between gap-2 border-b border-[#EDF0EE] bg-slate-50/50 px-4 py-3 dark:border-slate-800 dark:bg-slate-900/50'>
        <h2 className='flex flex-wrap items-center gap-2 text-[14px] leading-[20px] font-bold text-slate-900 dark:text-slate-100'>
          Class {row.class_name} - {row.section_name}
          <Badge
            tone={total > limit ? 'danger' : total === limit ? 'warning' : 'success'}
            className='text-[11.5px] font-medium'
          >
            {total} / {limit} periods a week
          </Badge>
        </h2>
        <span className='text-[12px] leading-[16px] text-slate-500 dark:text-slate-400'>
          Class teacher:{' '}
          <span
            className={cn('font-semibold', row.class_teacher ? 'text-slate-900 dark:text-slate-100' : 'text-amber-600 dark:text-amber-400')}
          >
            {row.class_teacher ?? 'Not set'}
          </span>
        </span>
      </div>
      {row.cells.length === 0 ? (
        <p className='px-4 py-5 text-[13px] text-slate-500 dark:text-slate-400'>
          No subjects set for this class. Add them in School setup.
        </p>
      ) : (
        <ul className='grid gap-px bg-[#EDF0EE] sm:grid-cols-2 2xl:grid-cols-3 dark:bg-slate-800'>
          {row.cells.map((cell) => {
            const edit = edits[cellKey(row.section_id, cell.subject_id)]
            const teacherId = edit ? edit.teacher_user_id : cell.teacher_user_id
            const periods = edit ? edit.periods_per_week : cell.periods_per_week
            const teacherName = teacherOptions.find(
              (option) => option.value === String(teacherId)
            )?.label
            const id = `cell-${row.section_id}-${cell.subject_id}`
            return (
              <li
                key={cell.subject_id}
                className={cn('grid gap-2.5 bg-white p-3.5 dark:bg-slate-900', edit && 'bg-[#EAF7F0]/30 dark:bg-emerald-950/20')}
              >
                <div className='flex items-center justify-between gap-2'>
                  <span className='truncate text-[13px] leading-[18px] font-semibold text-slate-900 dark:text-slate-100'>{cell.subject_name}</span>
                  <span className='flex shrink-0 items-center gap-1.5'>
                    {edit && <Badge tone='info' className='text-[10px] font-semibold'>Changed</Badge>}
                    <span className='rounded bg-[#EAF7F0] px-1.5 py-0.5 font-mono text-[11px] font-bold text-[#127D48] dark:bg-emerald-950/60 dark:text-emerald-300'>
                      {cell.subject_code}
                    </span>
                  </span>
                </div>
                {canManage ? (
                  <div className='flex items-center gap-2'>
                    <Combobox
                      id={id}
                      label={`Teacher for ${cell.subject_name}, ${row.class_name} - ${row.section_name}`}
                      value={teacherId ? String(teacherId) : undefined}
                      placeholder='No teacher'
                      allLabel='No teacher'
                      searchPlaceholder='Search teachers'
                      options={teacherOptions}
                      onChange={(value) =>
                        onChange(row, cell, { teacher_user_id: value ? Number(value) : null })
                      }
                      highlightSelected={false}
                      className={cn('min-w-0 flex-1 sm:w-full', !teacherId && 'text-amber-600')}
                    />
                    <Input
                      type='number'
                      inputMode='numeric'
                      min={1}
                      max={15}
                      aria-label={`Periods a week for ${cell.subject_name}`}
                      title='Periods a week'
                      disabled={!teacherId}
                      placeholder={String(DEFAULT_PERIODS)}
                      className='tabular w-16 shrink-0 text-center border-[#C6CEC9] text-[13px]'
                      value={teacherId && periods !== null ? String(periods) : ''}
                      onChange={(event) => {
                        const value = Number(event.target.value)
                        onChange(row, cell, {
                          periods_per_week: event.target.value
                            ? Math.min(15, Math.max(1, Math.round(value)))
                            : null,
                        })
                      }}
                    />
                  </div>
                ) : (
                  <div className='flex items-center justify-between gap-2 text-[13px]'>
                    <span className={cn('truncate font-medium', !teacherId ? 'text-amber-600 dark:text-amber-400' : 'text-slate-800 dark:text-slate-200')}>
                      {teacherName ?? cell.teacher_name ?? 'No teacher'}
                    </span>
                    {teacherId && periods !== null && (
                      <span className='tabular shrink-0 text-[12px] font-medium text-slate-500 dark:text-slate-400'>
                        {periods} a week
                      </span>
                    )}
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </Card>
  )
}

function TeachersPanel({ teachers }: { teachers: MatrixTeacher[] }) {
  const over = teachers.filter(
    (teacher) => loadTone(teacher.load_periods, teacher.max_periods_per_week) === 'danger'
  ).length
  return (
    <Card className='overflow-hidden border border-[#EDF0EE] bg-white dark:border-slate-800 dark:bg-slate-900 lg:sticky lg:top-20'>
      <div className='flex items-center justify-between gap-2 border-b border-[#EDF0EE] bg-slate-50/50 px-4 py-3 dark:border-slate-800 dark:bg-slate-900/50'>
        <h2 className='flex items-center gap-2 text-[14px] leading-[20px] font-bold text-slate-900 dark:text-slate-100'>
          <UsersRound className='size-4 text-[#127D48] stroke-[1.75]' />
          Teachers
        </h2>
        {over > 0 && <Badge tone='danger' className='text-[11.5px] font-medium'>{over} over limit</Badge>}
      </div>
      {teachers.length === 0 ? (
        <p className='px-4 py-5 text-[13px] text-slate-500 dark:text-slate-400'>
          No teaching staff yet. Add teachers in Staff.
        </p>
      ) : (
        <ul className='grid divide-y divide-[#EDF0EE] dark:divide-slate-800 lg:max-h-[calc(100vh-12rem)] lg:overflow-y-auto'>
          {teachers.map((teacher) => (
            <li key={teacher.user_id} className='grid gap-1.5 px-4 py-3'>
              <div className='flex items-baseline justify-between gap-2'>
                <span className='truncate text-[13px] leading-[18px] font-semibold text-slate-900 dark:text-slate-100'>{teacher.name}</span>
                <span className='truncate text-[12px] leading-[16px] text-slate-500 dark:text-slate-400'>
                  {teacher.department ?? ''}
                </span>
              </div>
              <LoadBar load={teacher.load_periods} max={teacher.max_periods_per_week} />
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}
