import { useState } from 'react'
import {
  ArrowDown,
  ArrowUp,
  BellRing,
  CalendarClock,
  Coffee,
  Plus,
  RotateCcw,
  Save,
  Trash2,
  Undo2,
} from 'lucide-react'
import { Combobox } from '@/components/common/combobox'
import { ErrorState } from '@/components/common/display'
import { FormField } from '@/components/common/form-field'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { alerts } from '@/lib/alerts'
import { toApiError } from '@/lib/api/errors'
import { cn } from '@/lib/utils'
import {
  addSpecial,
  breakGaps,
  insideDay,
  insertBreak,
  specialName,
  type BreakGap,
  type SlotSide,
} from '../special-slots'
import { SpecialBreakModal, SpecialSlotModal } from './special-slot-modals'
import { useClasses, useSections, type SchoolClass } from '@/features/setup/api'
import {
  timetableApi,
  useBellSchedule,
  useTimetableMutation,
  type BellPeriod,
  type BellPeriodInput,
} from '../api'

interface Row extends Required<BellPeriodInput> {
  key: number
}

type RowErrors = Record<number, Partial<Record<keyof BellPeriodInput, string>>>

let nextKey = 1

const toRows = (periods: BellPeriod[]): Row[] =>
  periods.map((period) => ({
    key: nextKey++,
    name: period.name,
    start_time: period.start_time,
    end_time: period.end_time,
    is_break: period.is_break,
    is_special: period.is_special ?? false,
    section_ids: period.section_ids ?? null,
  }))

const addMinutes = (time: string, minutes: number) => {
  const [hours, mins] = time.split(':').map(Number)
  const total = Math.min(23 * 60 + 59, hours * 60 + mins + minutes)
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
}

export function BellTab({ canManage }: { canManage: boolean }) {
  const classes = useClasses()
  const [selectedClassId, setSelectedClassId] = useState<number | undefined>(undefined)
  const [selectedSectionId, setSelectedSectionId] = useState<number | undefined>(undefined)
  const classSections = (useSections().data ?? []).filter(
    (item) => item.class_id === selectedClassId
  )
  const periods = useBellSchedule(selectedClassId)

  const classOptions = [
    { value: 'all', label: 'All classes (Default timing)' },
    ...(classes.data ?? []).map((c) => ({
      value: String(c.id),
      label: `Class ${c.name}`,
    })),
  ]

  const chosenClass = classes.data?.find((c) => c.id === selectedClassId)

  const chosenSection = classSections.find((item) => item.id === selectedSectionId)

  return (
    <div className='grid gap-4'>
      <div className='flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card p-3 shadow-2xs'>
        <div className='flex flex-wrap items-center gap-2.5'>
          <label
            htmlFor='bell-class-select'
            className='text-xs font-semibold text-muted-foreground'
          >
            Schedule for:
          </label>
          <Combobox
            id='bell-class-select'
            label='Schedule for'
            options={classOptions}
            value={selectedClassId ? String(selectedClassId) : 'all'}
            onChange={(val) => {
              setSelectedClassId(val === 'all' ? undefined : Number(val))
              setSelectedSectionId(undefined)
            }}
            placeholder='Choose class'
            searchPlaceholder='Search classes...'
            className='w-64'
          />
          {selectedClassId && classSections.length > 0 && (
            <Combobox
              id='bell-section-select'
              label='Section'
              options={[
                { value: 'all', label: 'All sections' },
                ...classSections.map((item) => ({
                  value: String(item.id),
                  label: `Section ${item.name}`,
                })),
              ]}
              value={selectedSectionId ? String(selectedSectionId) : 'all'}
              onChange={(val) =>
                setSelectedSectionId(!val || val === 'all' ? undefined : Number(val))
              }
              placeholder='All sections'
              searchPlaceholder='Search sections...'
              className='w-48'
            />
          )}
        </div>
        <div className='flex items-center gap-2 text-xs text-muted-foreground'>
          {chosenClass ? (
            <span>
              Configuring timings specifically for <strong>Class {chosenClass.name}</strong>
              {chosenSection && (
                <>
                  {' '}
                  · showing <strong>Section {chosenSection.name}</strong>
                </>
              )}
            </span>
          ) : (
            <span>
              Configuring <strong>school-wide default</strong> timings
            </span>
          )}
        </div>
      </div>

      {periods.isError && !periods.data ? (
        <Card>
          <ErrorState message={periods.error.message} onRetry={() => periods.refetch()} />
        </Card>
      ) : !periods.data ? (
        <Skeleton className='h-96 w-full rounded-xl' />
      ) : (
        <BellEditor
          key={selectedClassId ?? 'default'}
          periods={periods.data}
          classId={selectedClassId}
          className={chosenClass?.name}
          sectionId={selectedSectionId}
          classes={classes.data ?? []}
          canManage={canManage}
        />
      )}
    </div>
  )
}

function BellEditor({
  periods,
  classId,
  className,
  sectionId,
  classes,
  canManage,
}: {
  periods: BellPeriod[]
  classId?: number
  className?: string
  sectionId?: number
  classes: SchoolClass[]
  canManage: boolean
}) {
  const [rows, setRows] = useState<Row[]>(() => toRows(periods))
  const [baseline, setBaseline] = useState(() => JSON.stringify(toRows(periods).map(strip)))
  const [errors, setErrors] = useState<RowErrors>({})
  const save = useTimetableMutation((items: BellPeriodInput[]) =>
    timetableApi.savePeriods(items, classId)
  )
  const resetMutation = useTimetableMutation((id: number) => timetableApi.resetClassPeriods(id))
  const dirty = JSON.stringify(rows.map(strip)) !== baseline

  const isCustom = classId !== undefined && periods.length > 0 && periods[0].class_id === classId

  const copyFromOptions = [
    ...(classId !== undefined ? [{ value: 'default', label: 'Default schedule' }] : []),
    ...classes
      .filter((c) => c.id !== classId)
      .map((c) => ({ value: String(c.id), label: `Class ${c.name}` })),
  ]

  const handleCopyFrom = async (sourceValue: string) => {
    const srcId = sourceValue === 'default' ? undefined : Number(sourceValue)
    try {
      const fetched = await timetableApi.periods(srcId)
      if (fetched && fetched.length > 0) {
        setRows(toRows(fetched))
        alerts.success(
          `Timings copied from ${sourceValue === 'default' ? 'Default schedule' : 'selected class'}. Review and click Save.`
        )
      }
    } catch {
      alerts.error('Could not copy timings')
    }
  }

  const update = (key: number, patch: Partial<Row>) =>
    setRows((current) => current.map((row) => (row.key === key ? { ...row, ...patch } : row)))

  const move = (index: number, offset: number) =>
    setRows((current) => {
      const next = [...current]
      const [row] = next.splice(index, 1)
      next.splice(index + offset, 0, row)
      return next
    })

  const add = (kind: 'period' | 'break') =>
    setRows((current) => {
      const start = current.at(-1)?.end_time ?? '08:50'
      const teaching = current.filter((row) => !row.is_break && !row.is_special).length
      const isBreak = kind === 'break'
      return [
        ...current,
        {
          key: nextKey++,
          name: isBreak ? 'Break' : `Period ${teaching + 1}`,
          start_time: start,
          end_time: addMinutes(start, isBreak ? 15 : 45),
          is_break: isBreak,
          is_special: false,
          section_ids: null,
        },
      ]
    })

  const sectionList = useSections().data ?? []
  const [slotModal, setSlotModal] = useState(false)
  const [gapChoices, setGapChoices] = useState<BreakGap[] | null>(null)

  const addSpecialSlot = (
    side: SlotSide,
    name: string,
    minutes: number,
    sectionIds: number[] | null,
    breakMinutes: number
  ) =>
    setRows((current) => {
      const key = nextKey++
      const breakKey = nextKey++
      return addSpecial(
        current,
        side,
        name,
        minutes,
        key,
        sectionIds,
        breakMinutes,
        breakKey
      ) as Row[]
    })

  const addSpecialBreak = (gap: BreakGap, minutes: number) => {
    setRows(
      (current) => insertBreak(current, gap, minutes, 'Special class break', nextKey++) as Row[]
    )
    alerts.success(`Break added: ${gap.label}`)
  }

  const askSpecialBreak = () => {
    if (!rows.some((row) => row.is_special)) {
      alerts.error('Add a special class first. The special class break goes next to it.')
      return
    }
    const gaps = breakGaps(rows)
    if (!gaps.length) {
      alerts.error('Every special class already has a break next to it.')
      return
    }
    if (gaps.length === 1) addSpecialBreak(gaps[0], 10)
    else setGapChoices(gaps)
  }

  const reset = () => {
    setRows(toRows(periods))
    setErrors({})
  }

  const submit = async () => {
    const misplaced = insideDay(rows)
    if (misplaced) {
      alerts.error(`${misplaced.name} must be before the first period or after the last one`)
      return
    }
    const next: RowErrors = {}
    rows.forEach((row, index) => {
      const rowErrors: RowErrors[number] = {}
      if (!row.name.trim()) rowErrors.name = 'Enter a name'
      if (!row.start_time) rowErrors.start_time = 'Enter the start'
      if (!row.end_time) rowErrors.end_time = 'Enter the end'
      else if (row.start_time && row.end_time <= row.start_time)
        rowErrors.end_time = 'Must be after the start'
      if (Object.keys(rowErrors).length) next[index] = rowErrors
    })
    setErrors(next)
    if (Object.keys(next).length) return
    try {
      const saved = await save.mutateAsync(rows.map(strip))
      const fresh = toRows(saved)
      setRows(fresh)
      setBaseline(JSON.stringify(fresh.map(strip)))
      alerts.success(
        classId ? `Bell schedule saved for Class ${className}` : 'Default bell schedule saved'
      )
    } catch (error) {
      const apiError = toApiError(error)
      const fieldErrors: RowErrors = {}
      for (const item of apiError.fieldErrors) {
        const match = /^items\.(\d+)\.(name|start_time|end_time|is_break)$/.exec(item.field)
        if (!match) continue
        const index = Number(match[1])
        fieldErrors[index] = { ...fieldErrors[index], [match[2]]: item.message }
      }
      if (Object.keys(fieldErrors).length) setErrors(fieldErrors)
      else alerts.error(apiError.message)
    }
  }

  const numbers = periodNumbers(rows)
  const teaching = rows.filter((row) => !row.is_break && !row.is_special).length

  return (
    <Card className='overflow-hidden'>
      <div className='flex flex-wrap items-start justify-between gap-3 border-b px-4 py-3 sm:px-5'>
        <div className='grid gap-0.5'>
          <div className='flex items-center gap-2'>
            <h2 className='flex items-center gap-2 font-bold'>
              <BellRing className='size-4 text-primary' />
              {classId ? `Class ${className} Timing` : 'Default Bell Schedule'}
            </h2>
            {classId &&
              (isCustom ? (
                <Badge tone='success'>Custom timing active</Badge>
              ) : (
                <Badge tone='neutral'>Inheriting default timing</Badge>
              ))}
          </div>
          <p className='text-xs text-muted-foreground'>
            {classId
              ? `Period timings for Class ${className}. All sections of Class ${className} follow this schedule.`
              : 'Default school-wide period timings. Classes without custom timings follow this schedule.'}
          </p>
        </div>
        {canManage && (
          <div className='flex flex-wrap items-center gap-2'>
            {copyFromOptions.length > 0 && (
              <Combobox
                id='copy-from-select'
                label='Copy from'
                options={copyFromOptions}
                placeholder='Copy timings from...'
                searchPlaceholder='Search source...'
                onChange={(val) => val && void handleCopyFrom(val)}
                className='w-48'
              />
            )}
            {isCustom && (
              <Button
                variant='outline'
                size='sm'
                loading={resetMutation.isPending}
                onClick={async () => {
                  if (!classId) return
                  await resetMutation.mutateAsync(classId)
                  alerts.success(`Class ${className} reset to default timing`)
                }}
              >
                <RotateCcw className='size-3.5' />
                Reset to default
              </Button>
            )}
            <Button variant='outline' size='sm' onClick={() => add('period')}>
              <Plus />
              Add period
            </Button>
            <Button variant='outline' size='sm' onClick={() => add('break')}>
              <Coffee />
              Add break
            </Button>
            <Button variant='outline' size='sm' onClick={() => setSlotModal(true)}>
              <CalendarClock />
              Special class
            </Button>
            <Button variant='outline' size='sm' onClick={askSpecialBreak}>
              <Coffee />
              Special class break
            </Button>
          </div>
        )}
      </div>
      {slotModal && (
        <SpecialSlotModal
          defaultName={specialName(rows)}
          firstPeriod={rows.find((row) => !row.is_break && !row.is_special)?.name ?? 'Period 1'}
          lastPeriod={
            rows.filter((row) => !row.is_break && !row.is_special).at(-1)?.name ?? 'the last period'
          }
          classId={classId}
          sectionId={sectionId}
          onAdd={addSpecialSlot}
          onClose={() => setSlotModal(false)}
        />
      )}
      {gapChoices && (
        <SpecialBreakModal
          gaps={gapChoices}
          onAdd={addSpecialBreak}
          onClose={() => setGapChoices(null)}
        />
      )}
      <ol className='grid divide-y'>
        {rows.map((row, index) => {
          if (
            row.is_special &&
            sectionId &&
            row.section_ids?.length &&
            !row.section_ids.includes(sectionId)
          )
            return null
          const number = numbers[index]
          const rowErrors = errors[index] ?? {}
          return (
            <li
              key={row.key}
              className={cn(
                'grid items-start gap-3 px-4 py-3 sm:px-5 md:grid-cols-[3rem_minmax(0,1fr)_8rem_8rem_auto_auto]',
                row.is_break && 'bg-muted/50',
                row.is_special && 'bg-warning/5'
              )}
            >
              <span className='flex h-9 items-center'>
                {row.is_special ? (
                  <Badge tone='warning'>
                    <CalendarClock className='size-3' />
                  </Badge>
                ) : number ? (
                  <Badge tone='info'>P{number}</Badge>
                ) : (
                  <Badge tone='neutral'>
                    <Coffee className='size-3' />
                  </Badge>
                )}
              </span>
              <FormField label='Name' id={`bell-name-${row.key}`} error={rowErrors.name}>
                <Input
                  id={`bell-name-${row.key}`}
                  maxLength={30}
                  disabled={!canManage}
                  value={row.name}
                  aria-invalid={Boolean(rowErrors.name) || undefined}
                  onChange={(event) => update(row.key, { name: event.target.value })}
                />
              </FormField>
              <div className='grid grid-cols-2 gap-3 md:contents'>
                <FormField label='Start' id={`bell-start-${row.key}`} error={rowErrors.start_time}>
                  <Input
                    id={`bell-start-${row.key}`}
                    type='time'
                    disabled={!canManage}
                    value={row.start_time}
                    aria-invalid={Boolean(rowErrors.start_time) || undefined}
                    onChange={(event) => update(row.key, { start_time: event.target.value })}
                  />
                </FormField>
                <FormField label='End' id={`bell-end-${row.key}`} error={rowErrors.end_time}>
                  <Input
                    id={`bell-end-${row.key}`}
                    type='time'
                    disabled={!canManage}
                    value={row.end_time}
                    aria-invalid={Boolean(rowErrors.end_time) || undefined}
                    onChange={(event) => update(row.key, { end_time: event.target.value })}
                  />
                </FormField>
              </div>
              {row.is_special ? (
                <span className='grid h-9 content-center text-xs font-semibold text-warning md:mt-5'>
                  Special class
                  <span className='max-w-40 truncate font-normal text-muted-foreground'>
                    {row.section_ids?.length
                      ? `For ${row.section_ids
                          .map((id) => {
                            const item = sectionList.find((section) => section.id === id)
                            return item ? `${item.class_name}-${item.name}` : id
                          })
                          .join(', ')}`
                      : 'All sections'}
                  </span>
                </span>
              ) : (
                <label className='flex h-9 items-center gap-2 text-xs font-semibold md:mt-5'>
                  <Switch
                    checked={row.is_break}
                    disabled={!canManage}
                    aria-label={`Break: ${row.name}`}
                    onCheckedChange={(is_break) => update(row.key, { is_break })}
                  />
                  Break
                </label>
              )}
              {canManage ? (
                <span className='flex items-center gap-0.5 md:mt-5'>
                  <Button
                    variant='ghost'
                    size='icon-sm'
                    aria-label={`Move ${row.name} up`}
                    disabled={index === 0 || row.is_special}
                    onClick={() => move(index, -1)}
                  >
                    <ArrowUp />
                  </Button>
                  <Button
                    variant='ghost'
                    size='icon-sm'
                    aria-label={`Move ${row.name} down`}
                    disabled={index === rows.length - 1 || row.is_special}
                    onClick={() => move(index, 1)}
                  >
                    <ArrowDown />
                  </Button>
                  <Button
                    variant='ghost'
                    size='icon-sm'
                    aria-label={`Remove ${row.name}`}
                    disabled={rows.length === 1}
                    className='text-destructive hover:bg-destructive/10'
                    onClick={() =>
                      setRows((current) => current.filter((item) => item.key !== row.key))
                    }
                  >
                    <Trash2 />
                  </Button>
                </span>
              ) : (
                <span />
              )}
            </li>
          )
        })}
      </ol>
      {canManage && (
        <div className='flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3 sm:px-5'>
          <span className='text-xs text-muted-foreground'>
            {dirty ? 'You have unsaved changes' : `${teaching} teaching periods a day`}
          </span>
          <div className='flex gap-2'>
            <Button variant='outline' onClick={reset} disabled={!dirty || save.isPending}>
              <Undo2 />
              Discard
            </Button>
            <Button onClick={() => void submit()} loading={save.isPending} disabled={!dirty}>
              <Save />
              {classId ? `Save timing for Class ${className}` : 'Save bell schedule'}
            </Button>
          </div>
        </div>
      )}
    </Card>
  )
}

function strip(row: Row): Required<BellPeriodInput> {
  return {
    name: row.name.trim(),
    start_time: row.start_time,
    end_time: row.end_time,
    is_break: row.is_break,
    is_special: row.is_special,
    section_ids: row.is_special ? row.section_ids : null,
  }
}

function periodNumbers(rows: Row[]) {
  let count = 0
  return rows.map((row) => (row.is_break || row.is_special ? null : ++count))
}
