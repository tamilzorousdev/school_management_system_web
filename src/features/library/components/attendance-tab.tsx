import { useState } from 'react'
import {
  CalendarCheck,
  CircleOff,
  Clock3,
  DoorOpen,
  LogIn,
  LogOut,
  TriangleAlert,
  UsersRound,
} from 'lucide-react'
import { Avatar } from '@/components/common/avatar'
import { Combobox } from '@/components/common/combobox'
import { DataTable, type Column } from '@/components/common/data-table'
import { InsightCards, type Insight } from '@/components/common/insight-cards'
import { FilterSelect, ListToolbar, SearchBox } from '@/components/common/list-toolbar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { DateStepper } from '@/features/attendance/components/date-stepper'
import { can, useMe } from '@/features/auth/api'
import { alerts } from '@/lib/alerts'
import { toApiError } from '@/lib/api/errors'
import { formatTime } from '@/lib/format'
import { cn } from '@/lib/utils'
import {
  MEMBER_TYPES,
  VISIT_KINDS,
  libraryApi,
  useLibraryMutation,
  usePeriods,
  useVisitInsights,
  useVisits,
  type LibraryPeriod,
  type Visit,
  type VisitPurpose,
  type VisitScanResult,
} from '../api'
import { MEMBER_TYPE, VISIT_KIND, VISIT_PURPOSE, optionsOf, today } from '../labels'
import { LIST_LIMIT, oneOf, type LibraryTabProps } from '../search'
import { Section } from './library-parts'
import { PeriodRosterModal } from './period-roster-modal'
import { ScanInput } from './scan-input'
import { ClassFilter, SectionFilter } from './school-pickers'

const time = (value: string | null) => (value ? formatTime(value).slice(0, 5) : '—')

export function AttendanceTab({ search, onChange }: LibraryTabProps) {
  const canScan = can(useMe().data, 'library.attendance')
  const date = search.date ?? today()
  const isToday = date === today()
  const insights = useVisitInsights(date)
  const periods = usePeriods(date)
  const [slot, setSlot] = useState<LibraryPeriod | null>(null)
  const data = insights.data

  const cards: Insight[] = [
    {
      key: 'inside',
      label: 'Inside now',
      value: data?.inside_now ?? 0,
      hint:
        data?.busiest_hour !== null && data?.busiest_hour !== undefined
          ? `Busiest at ${String(data.busiest_hour).padStart(2, '0')}:00`
          : undefined,
      icon: DoorOpen,
      tone: 'success',
    },
    {
      key: 'visitors',
      label: 'Visitors',
      value: data?.visitors_today ?? 0,
      hint: `${data?.students_today ?? 0} students · ${data?.staff_today ?? 0} staff`,
      icon: UsersRound,
      tone: 'primary',
    },
    {
      key: 'minutes',
      label: 'Average stay',
      value:
        data?.average_minutes === null || data?.average_minutes === undefined
          ? '—'
          : `${data.average_minutes} min`,
      icon: Clock3,
      tone: 'info',
    },
    {
      key: 'periods',
      label: 'Library periods',
      value: `${data?.periods_marked ?? 0} / ${data?.periods_today ?? 0}`,
      hint: 'Marked',
      icon: CalendarCheck,
      tone: data && data.periods_marked < data.periods_today ? 'warning' : 'success',
    },
  ]

  return (
    <div className='grid gap-4'>
      <DateStepper
        id='library-attendance-date'
        value={date}
        onChange={(next) => onChange({ date: next === today() ? undefined : next })}
      />
      <InsightCards items={cards} loading={insights.isPending} />
      <div className='grid gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]'>
        {canScan && isToday ? <ScanDesk /> : <InsideNow date={date} canScan={canScan && isToday} />}
        <Section
          title='Library periods'
          description='From the timetable. Open a period to mark who came.'
        >
          {periods.isPending ? (
            <div className='grid gap-2 p-4'>
              <Skeleton className='h-10' />
              <Skeleton className='h-10' />
            </div>
          ) : periods.data?.length ? (
            <ul className='divide-y'>
              {periods.data.map((period) => (
                <li key={period.slot_id}>
                  <button
                    type='button'
                    onClick={() => setSlot(period)}
                    className='flex w-full items-center justify-between gap-3 px-4 py-3 text-left outline-none hover:bg-muted/50 focus-visible:bg-accent/60'
                  >
                    <div className='grid min-w-0'>
                      <span className='truncate font-semibold'>
                        {period.section.name} · {period.period_name ?? `Period ${period.period_no}`}
                      </span>
                      <span className='truncate text-xs text-muted-foreground'>
                        {[
                          period.start_time && `${period.start_time}–${period.end_time ?? ''}`,
                          period.teacher,
                        ]
                          .filter(Boolean)
                          .join(' · ')}
                      </span>
                    </div>
                    {period.marked ? (
                      <Badge tone='success'>
                        {period.present}/{period.total}
                      </Badge>
                    ) : (
                      <Badge tone='warning'>Mark</Badge>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className='px-4 py-8 text-center text-sm text-muted-foreground'>
              No library periods on this day.
            </p>
          )}
        </Section>
      </div>
      {canScan && isToday && <InsideNow date={date} canScan />}
      <Register search={search} onChange={onChange} date={date} />
      <PeriodRosterModal period={slot} date={date} onClose={() => setSlot(null)} />
    </div>
  )
}

function ScanDesk() {
  const [purpose, setPurpose] = useState<VisitPurpose>('read')
  const [result, setResult] = useState<VisitScanResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const scan = useLibraryMutation((code: string) => libraryApi.scanVisit(code, purpose))

  return (
    <Card className='grid content-start gap-3 p-4'>
      <div className='flex flex-wrap items-center justify-between gap-2'>
        <h2 className='font-bold'>Door scan</h2>
        <Combobox
          id='visit-purpose'
          label='Purpose'
          placeholder='Purpose'
          value={purpose}
          options={optionsOf(VISIT_PURPOSE).filter((item) => item.value !== 'period')}
          onChange={(next) => setPurpose((next ?? 'read') as VisitPurpose)}
          highlightSelected={false}
        />
      </div>
      <ScanInput
        id='visit-scan'
        label='Scan an ID card or library card'
        size='lg'
        busy={scan.isPending}
        placeholder='ID card QR or library card'
        hint='Scan or type. The first scan checks in, the next one checks out.'
        onScan={async (code) => {
          setError(null)
          try {
            setResult(await scan.mutateAsync(code))
          } catch (caught) {
            setResult(null)
            setError(toApiError(caught).message)
          }
        }}
      />
      {error && (
        <p className='flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive'>
          <TriangleAlert className='size-4 shrink-0' />
          {error}
        </p>
      )}
      {result && (
        <div
          className={cn(
            'flex items-center gap-3 rounded-lg border p-3',
            result.action === 'checked_in'
              ? 'border-success/30 bg-success/10'
              : 'border-info/30 bg-info/10'
          )}
        >
          <Avatar name={result.visit.visitor.name} src={result.visit.visitor.photo_url} size='lg' />
          <div className='grid min-w-0 flex-1'>
            <span className='truncate text-lg font-extrabold'>{result.visit.visitor.name}</span>
            <span className='truncate text-sm text-muted-foreground'>
              {[MEMBER_TYPE[result.visit.visitor.member_type], result.visit.visitor.detail]
                .filter(Boolean)
                .join(' · ')}
            </span>
          </div>
          <div className='grid justify-items-end gap-0.5'>
            <Badge tone={result.action === 'checked_in' ? 'success' : 'info'}>
              {result.action === 'checked_in' ? (
                <LogIn className='size-3' />
              ) : (
                <LogOut className='size-3' />
              )}
              {result.action === 'checked_in' ? 'Checked in' : 'Checked out'}
            </Badge>
            <span className='text-xs text-muted-foreground'>
              {result.action === 'checked_in'
                ? time(result.visit.in_at)
                : `${time(result.visit.out_at)}${result.visit.minutes !== null ? ` · ${result.visit.minutes} min` : ''}`}
            </span>
          </div>
        </div>
      )}
    </Card>
  )
}

function InsideNow({ date, canScan }: { date: string; canScan: boolean }) {
  const inside = useVisits({ page: 1, limit: 50, date, inside: true, sort: 'in_at', order: 'desc' })
  const checkOut = useLibraryMutation((id: number) => libraryApi.checkOut(id))
  const rows = inside.data?.items ?? []

  return (
    <Section
      title='Inside now'
      description={inside.data ? `${inside.data.total} people` : undefined}
    >
      {inside.isPending ? (
        <div className='grid gap-2 p-4'>
          <Skeleton className='h-10' />
        </div>
      ) : rows.length ? (
        <>
          <ul className='divide-y'>
            {rows.map((visit) => (
              <li key={visit.id} className='flex items-center justify-between gap-3 px-4 py-2.5'>
                <div className='flex min-w-0 items-center gap-2.5'>
                  <Avatar name={visit.visitor.name} src={visit.visitor.photo_url} size='sm' />
                  <div className='grid min-w-0'>
                    <span className='truncate font-semibold'>{visit.visitor.name}</span>
                    <span className='truncate text-xs text-muted-foreground'>
                      {[
                        visit.visitor.detail,
                        `in ${time(visit.in_at)}`,
                        VISIT_PURPOSE[visit.purpose],
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                    </span>
                  </div>
                </div>
                {canScan && (
                  <Button
                    size='sm'
                    variant='outline'
                    loading={checkOut.isPending && checkOut.variables === visit.id}
                    onClick={async () => {
                      try {
                        await checkOut.mutateAsync(visit.id)
                        alerts.success(`${visit.visitor.name} checked out`)
                      } catch (caught) {
                        alerts.error(toApiError(caught).message)
                      }
                    }}
                  >
                    <LogOut />
                    Check out
                  </Button>
                )}
              </li>
            ))}
          </ul>
          {inside.data && inside.data.total > rows.length && (
            <p className='border-t px-4 py-2 text-xs text-muted-foreground'>
              Showing the latest {rows.length} of {inside.data.total}. The register below lists
              everyone.
            </p>
          )}
        </>
      ) : (
        <p className='px-4 py-8 text-center text-sm text-muted-foreground'>No one is inside.</p>
      )}
    </Section>
  )
}

function Register({
  search,
  onChange,
  date,
}: Pick<LibraryTabProps, 'search' | 'onChange'> & { date: string }) {
  const kind = oneOf(VISIT_KINDS, search.kind)
  const memberType = oneOf(MEMBER_TYPES, search.member_type)
  const visits = useVisits({
    page: search.page ?? 1,
    limit: LIST_LIMIT,
    date,
    search: search.search,
    sort: search.sort,
    order: search.order,
    kind,
    member_type: memberType,
    class_id: search.class_id,
    section_id: search.section_id,
    present: search.present,
  })

  const columns: Column<Visit>[] = [
    {
      key: 'visitor',
      header: 'Visitor',
      cell: (visit) => (
        <div className='flex min-w-0 items-center gap-2.5'>
          <Avatar name={visit.visitor.name} src={visit.visitor.photo_url} size='sm' />
          <div className='grid min-w-0'>
            <span className='truncate font-semibold'>{visit.visitor.name}</span>
            <span className='truncate text-xs text-muted-foreground'>
              {[MEMBER_TYPE[visit.visitor.member_type], visit.visitor.detail]
                .filter(Boolean)
                .join(' · ')}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: 'kind',
      header: 'Kind',
      cell: (visit) =>
        visit.kind === 'period' ? (
          <span>
            {VISIT_KIND.period}
            {visit.period_no ? ` ${visit.period_no}` : ''}
          </span>
        ) : (
          VISIT_PURPOSE[visit.purpose]
        ),
    },
    { key: 'in_at', header: 'In', sortKey: 'in_at', cell: (visit) => time(visit.in_at) },
    { key: 'out_at', header: 'Out', cell: (visit) => time(visit.out_at) },
    {
      key: 'minutes',
      header: 'Stay',
      hideBelow: 'lg',
      cell: (visit) => (visit.minutes !== null ? `${visit.minutes} min` : '—'),
    },
    {
      key: 'present',
      header: 'Present',
      cell: (visit) =>
        visit.present ? <Badge tone='success'>Present</Badge> : <Badge tone='danger'>Absent</Badge>,
    },
  ]

  const filtered = Boolean(
    search.search ||
    kind ||
    memberType ||
    search.class_id ||
    search.section_id ||
    search.present !== undefined
  )

  return (
    <Card className='overflow-hidden'>
      <div className='border-b px-4 py-3'>
        <h2 className='font-bold'>Register</h2>
      </div>
      <ListToolbar
        summary={visits.data ? `${visits.data.total} entries` : ''}
        onClear={
          filtered
            ? () =>
                onChange({
                  search: undefined,
                  kind: undefined,
                  member_type: undefined,
                  class_id: undefined,
                  section_id: undefined,
                  present: undefined,
                })
            : undefined
        }
      >
        <SearchBox
          value={search.search ?? ''}
          onChange={(value) => onChange({ search: value || undefined })}
          placeholder='Name or admission no'
          label='Search the register'
        />
        <FilterSelect
          id='visit-kind-filter'
          label='Filter by kind'
          allLabel='Walk-ins and periods'
          value={kind}
          options={optionsOf(VISIT_KIND)}
          onChange={(next) => onChange({ kind: next })}
        />
        <FilterSelect
          id='visit-member-type-filter'
          label='Filter by member type'
          allLabel='Students and staff'
          value={memberType}
          options={optionsOf(MEMBER_TYPE)}
          onChange={(member_type) => onChange({ member_type })}
        />
        <ClassFilter
          value={search.class_id}
          onChange={(class_id) => onChange({ class_id, section_id: undefined })}
        />
        <SectionFilter
          classId={search.class_id}
          value={search.section_id}
          onChange={(section_id) => onChange({ section_id })}
        />
        <FilterSelect
          id='visit-present-filter'
          label='Filter by presence'
          allLabel='Present and absent'
          value={search.present === undefined ? undefined : String(search.present)}
          options={[
            { value: 'true', label: 'Present' },
            { value: 'false', label: 'Absent (periods)' },
          ]}
          onChange={(value) =>
            onChange({ present: value === undefined ? undefined : value === 'true' })
          }
        />
      </ListToolbar>
      <DataTable
        rows={visits.data?.items ?? []}
        columns={columns}
        rowKey={(visit) => visit.id}
        loading={visits.isFetching}
        error={visits.isError ? visits.error.message : null}
        onRetry={() => visits.refetch()}
        sort={{ sort: search.sort, order: search.order ?? 'desc' }}
        onSortChange={(next) => onChange(next)}
        empty={{
          icon: filtered ? CircleOff : DoorOpen,
          title: filtered ? 'No entries match these filters' : 'No visits on this day',
        }}
        card={(visit) => (
          <div className='flex items-center justify-between gap-2'>
            <div className='grid min-w-0'>
              <span className='truncate font-semibold'>{visit.visitor.name}</span>
              <span className='truncate text-xs text-muted-foreground'>
                {visit.kind === 'period' ? VISIT_KIND.period : VISIT_PURPOSE[visit.purpose]} ·{' '}
                {time(visit.in_at)}–{time(visit.out_at)}
              </span>
            </div>
            {visit.present ? (
              <Badge tone='success'>Present</Badge>
            ) : (
              <Badge tone='danger'>Absent</Badge>
            )}
          </div>
        )}
        pagination={{
          page: search.page ?? 1,
          limit: LIST_LIMIT,
          total: visits.data?.total ?? 0,
          label: 'entries',
          onPageChange: (page) => onChange({ page }),
        }}
      />
    </Card>
  )
}
