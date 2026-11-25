import { useRef, useState, type FormEvent } from 'react'
import { CheckCheck, ListChecks, QrCode, Save, UtensilsCrossed } from 'lucide-react'
import { DataTable, type Column } from '@/components/common/data-table'
import { ErrorState } from '@/components/common/display'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { alerts } from '@/lib/alerts'
import { toApiError } from '@/lib/api/errors'
import { formatDate, formatDateTime } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useHostelMutation } from '../api'
import {
  careApi,
  useMessAttendance,
  useMessDay,
  useMessHeadcount,
  type Meal,
  type MealMark,
  type MessAttendanceEntry,
} from '../api-care'
import { DIET } from '../labels'
import { InfoNote, StudentCell } from './leave-form-parts'
import { shiftDate } from './leave-helpers'
import { MEAL, MEAL_MARK_TONE, MENU_SOURCE } from './mess-helpers'
import { MarkChoice } from './mess-parts'

const MARK_OPTIONS: { value: MealMark; label: string; activeClass: string }[] = [
  { value: 'ate', label: 'Ate', activeClass: 'border-success/50 bg-success/15 text-success' },
  {
    value: 'skipped',
    label: 'Skipped',
    activeClass: 'border-warning/50 bg-warning/15 text-warning',
  },
]

export function MessDayMenu({
  hostelId,
  date,
  meal,
}: {
  hostelId?: number
  date: string
  meal: Meal
}) {
  const day = useMessDay({ date, hostel_id: hostelId })
  const data = day.data
  return (
    <Card className='gap-3 p-4'>
      <div className='flex items-center justify-between gap-2'>
        <h2 className='text-sm font-bold'>Menu</h2>
        <span className='text-xs text-muted-foreground'>
          {data ? `${data.day_name}, ${formatDate(data.date)}` : formatDate(date)}
        </span>
      </div>
      {day.isError && !data ? (
        <ErrorState message={day.error.message} onRetry={() => day.refetch()} className='py-6' />
      ) : !data ? (
        <div className='grid gap-2'>
          <Skeleton className='h-12' />
          <Skeleton className='h-12' />
          <Skeleton className='h-12' />
        </div>
      ) : (
        <ul className='grid gap-2'>
          {data.meals.map((item) => (
            <li
              key={item.meal}
              className={cn(
                'grid gap-1 rounded-lg border p-3',
                item.meal === meal ? 'border-primary/50 bg-primary/5' : 'bg-card'
              )}
            >
              <div className='flex flex-wrap items-center gap-2'>
                <span className='text-sm font-semibold'>{MEAL[item.meal]}</span>
                {item.source !== 'school_week' && (
                  <Badge tone={MENU_SOURCE[item.source].tone}>
                    {MENU_SOURCE[item.source].label}
                  </Badge>
                )}
              </div>
              <span className={cn('text-sm', !item.items && 'text-muted-foreground italic')}>
                {item.items ?? 'No menu set'}
              </span>
              {item.non_veg_items && (
                <span className='text-xs text-muted-foreground'>Non-veg: {item.non_veg_items}</span>
              )}
              {item.note && <span className='text-xs text-muted-foreground'>{item.note}</span>}
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}

export function MessHeadcountCard({
  hostelId,
  date,
  meal,
}: {
  hostelId: number
  date: string
  meal: Meal
}) {
  const headcount = useMessHeadcount({ hostel_id: hostelId, date, meal })
  const data = headcount.data
  const tiles = data
    ? [
        { label: 'Ate', value: data.ate },
        { label: 'Skipped', value: data.skipped },
        { label: 'Not marked', value: data.unmarked },
        { label: 'Away on leave', value: data.on_leave },
      ]
    : []
  return (
    <Card className='gap-3 p-4'>
      <div className='flex items-center justify-between gap-2'>
        <h2 className='text-sm font-bold'>{MEAL[meal]} headcount</h2>
        <UtensilsCrossed className='size-4 text-primary' />
      </div>
      {headcount.isError && !data ? (
        <ErrorState
          message={headcount.error.message}
          onRetry={() => headcount.refetch()}
          className='py-6'
        />
      ) : !data ? (
        <Skeleton className='h-32' />
      ) : (
        <>
          <div className='flex items-end gap-2'>
            <span className='tabular text-4xl font-extrabold tracking-tight'>{data.expected}</span>
            <span className='pb-1 text-xs text-muted-foreground'>
              meals to cook of {data.residents} residents
            </span>
          </div>
          <div className='flex flex-wrap gap-1.5'>
            <Badge tone='success'>
              Veg <span className='tabular font-extrabold'>{data.by_diet.veg}</span>
            </Badge>
            <Badge tone='danger'>
              Non-veg <span className='tabular font-extrabold'>{data.by_diet.non_veg}</span>
            </Badge>
            <Badge tone='warning'>
              Egg <span className='tabular font-extrabold'>{data.by_diet.eggetarian}</span>
            </Badge>
          </div>
          <dl className='grid grid-cols-2 gap-2'>
            {tiles.map((tile) => (
              <div key={tile.label} className='rounded-lg bg-muted/60 px-3 py-2'>
                <dt className='text-[11px] font-semibold text-muted-foreground'>{tile.label}</dt>
                <dd className='tabular text-lg font-extrabold'>{tile.value}</dd>
              </div>
            ))}
          </dl>
          {data.skipping > 0 && (
            <p className='text-xs text-muted-foreground'>
              {data.skipping} {data.skipping === 1 ? 'resident has' : 'residents have'} asked to
              skip this meal.
            </p>
          )}
        </>
      )}
    </Card>
  )
}

export function MessAttendanceView({
  hostelId,
  date,
  meal,
  today,
  canMark,
}: {
  hostelId: number
  date: string
  meal: Meal
  today: string
  canMark: boolean
}) {
  const sheet = useMessAttendance({ hostel_id: hostelId, date, meal })
  const [pending, setPending] = useState<Record<number, MealMark>>({})
  const mark = useHostelMutation(careApi.mark)
  const data = sheet.data
  const students = data?.students ?? []
  const lockedReason =
    date > today
      ? 'Meals can be marked once the day comes.'
      : date < shiftDate(today, -1)
        ? 'Meals can be marked only for today and yesterday. This sheet is read only.'
        : undefined
  const editable = canMark && !lockedReason

  const shownFor = (entry: MessAttendanceEntry) => pending[entry.admission_id] ?? entry.status
  const changes = students.flatMap((entry) => {
    const next = pending[entry.admission_id]
    return next && next !== entry.status ? [{ admission_id: entry.admission_id, status: next }] : []
  })
  const fillable = students.filter(
    (entry) => !entry.status && !entry.on_leave && !entry.skip_id && !pending[entry.admission_id]
  )

  const fillAte = () =>
    setPending((prev) => {
      const next = { ...prev }
      fillable.forEach((entry) => {
        next[entry.admission_id] = 'ate'
      })
      return next
    })

  const save = async () => {
    try {
      await mark.mutateAsync({ hostel_id: hostelId, date, meal, entries: changes })
      alerts.success(`${changes.length} ${changes.length === 1 ? 'mark' : 'marks'} saved`)
      setPending({})
    } catch (error) {
      alerts.error(toApiError(error).message)
    }
  }

  const columns: Column<MessAttendanceEntry>[] = [
    {
      key: 'student',
      header: 'Student',
      cell: (row) => <StudentCell student={row.student} extra={DIET[row.diet]} />,
    },
    {
      key: 'room',
      header: 'Room / bed',
      hideBelow: 'lg',
      cell: (row) => (
        <span className='tabular text-sm'>
          {row.room_no ? `${row.room_no} / ${row.bed_no ?? '—'}` : 'No bed'}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (row) => <MealStatus entry={row} pending={pending[row.admission_id]} />,
    },
    {
      key: 'mark',
      header: 'Mark',
      cell: (row) => (
        <MarkChoice
          name={row.student.name}
          value={shownFor(row)}
          options={MARK_OPTIONS}
          disabled={!editable}
          onChange={(status) => setPending((prev) => ({ ...prev, [row.admission_id]: status }))}
        />
      ),
    },
  ]

  const counts = data?.counts
  const countBadges = [
    { key: 'ate', label: 'Ate', tone: 'success' as const, value: counts?.ate },
    { key: 'skipped', label: 'Skipped', tone: 'warning' as const, value: counts?.skipped },
    { key: 'unmarked', label: 'Not marked', tone: 'neutral' as const, value: counts?.unmarked },
    { key: 'leave', label: 'On leave', tone: 'info' as const, value: counts?.on_leave },
    {
      key: 'skip',
      label: 'Asked to skip',
      tone: 'info' as const,
      value: counts?.skip_requested,
    },
  ]

  return (
    <div className='grid gap-4'>
      {canMark && date === today && <MessScanBox hostelId={hostelId} meal={meal} />}
      {lockedReason && <InfoNote tone='warning'>{lockedReason}</InfoNote>}

      <div className='flex flex-wrap items-center gap-2'>
        {countBadges.map((item) => (
          <Badge key={item.key} tone={item.tone} className='px-2.5 py-1'>
            {item.label}
            <span className='tabular font-extrabold'>{item.value ?? 0}</span>
          </Badge>
        ))}
        <span className='tabular text-xs text-muted-foreground'>
          of {counts?.total ?? 0} residents
        </span>
      </div>

      <Card className='overflow-hidden'>
        <div className='flex flex-wrap items-center gap-2 border-b px-4 py-3'>
          <span className='text-sm font-semibold'>{MEAL[meal]} attendance</span>
          {editable && (
            <Button
              variant='outline'
              size='sm'
              className='ml-auto'
              disabled={fillable.length === 0}
              onClick={fillAte}
            >
              <CheckCheck />
              Mark the rest as ate
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
            title: 'No residents for this meal',
            description: 'Residents with a bed in this hostel on this date appear here.',
          }}
          card={(row) => (
            <div className='grid gap-3'>
              <div className='flex items-start justify-between gap-2'>
                <StudentCell student={row.student} extra={DIET[row.diet]} />
                <span className='tabular shrink-0 text-xs text-muted-foreground'>
                  {row.room_no ? `${row.room_no} / ${row.bed_no ?? '—'}` : 'No bed'}
                </span>
              </div>
              <MealStatus entry={row} pending={pending[row.admission_id]} />
              <MarkChoice
                name={row.student.name}
                value={shownFor(row)}
                options={MARK_OPTIONS}
                disabled={!editable}
                onChange={(status) =>
                  setPending((prev) => ({ ...prev, [row.admission_id]: status }))
                }
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

function MealStatus({ entry, pending }: { entry: MessAttendanceEntry; pending?: MealMark }) {
  return (
    <div className='flex flex-wrap items-center gap-1'>
      {entry.status ? (
        <Badge tone={MEAL_MARK_TONE[entry.status]} dot>
          {entry.status === 'ate' ? 'Ate' : 'Skipped'}
          {entry.method === 'qr' ? ' · QR' : ''}
        </Badge>
      ) : (
        <Badge tone='neutral'>Not marked</Badge>
      )}
      {entry.on_leave && <Badge tone='info'>On leave</Badge>}
      {entry.skip_id && <Badge tone='info'>Asked to skip</Badge>}
      {pending && pending !== entry.status && <Badge tone='warning'>Not saved</Badge>}
      {entry.marked_at && !pending && (
        <span className='text-xs text-muted-foreground'>{formatDateTime(entry.marked_at)}</span>
      )}
    </div>
  )
}

function MessScanBox({ hostelId, meal }: { hostelId: number; meal: Meal }) {
  const [qr, setQr] = useState('')
  const [result, setResult] = useState<{ tone: 'success' | 'warning' | 'danger'; text: string }>()
  const input = useRef<HTMLInputElement>(null)
  const scan = useHostelMutation(careApi.scan)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    const text = qr.trim()
    if (text.length < 10) {
      setResult({ tone: 'danger', text: 'Scan or paste the full QR text from the ID card.' })
      return
    }
    try {
      const done = await scan.mutateAsync({ hostel_id: hostelId, meal, qr: text })
      const name = done.entry.student.name
      setResult(
        done.already_marked
          ? { tone: 'warning', text: `${name} was already marked as ate for ${MEAL[meal]}.` }
          : { tone: 'success', text: `${name} marked as ate for ${MEAL[meal]}.` }
      )
      if (!done.already_marked) alerts.success(`${name} marked as ate`)
    } catch (error) {
      setResult({ tone: 'danger', text: toApiError(error).message })
    } finally {
      setQr('')
      input.current?.focus()
    }
  }

  return (
    <Card className='gap-3 p-4'>
      <form noValidate onSubmit={(event) => void submit(event)} className='grid gap-2'>
        <label htmlFor='mess-scan' className='text-sm font-semibold'>
          Scan / paste ID card QR
        </label>
        <div className='flex flex-col gap-2 sm:flex-row'>
          <div className='relative min-w-0 flex-1'>
            <QrCode className='pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground' />
            <Input
              id='mess-scan'
              ref={input}
              value={qr}
              autoComplete='off'
              maxLength={200}
              placeholder='Point the scanner here or paste TZS1… text'
              className='pl-9'
              onChange={(event) => setQr(event.target.value)}
            />
          </div>
          <Button type='submit' loading={scan.isPending}>
            Mark as ate
          </Button>
        </div>
        <p className='text-xs text-muted-foreground'>
          A scan marks the student as ate for {MEAL[meal].toLowerCase()} today.
        </p>
      </form>
      {result && <InfoNote tone={result.tone}>{result.text}</InfoNote>}
    </Card>
  )
}
