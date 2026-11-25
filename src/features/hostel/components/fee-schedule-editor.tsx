import { useState, type ReactNode } from 'react'
import { CalendarRange, Lock, Plus, Save, Trash2 } from 'lucide-react'
import { DatePicker } from '@/components/common/date-picker'
import { ErrorState } from '@/components/common/display'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { can, useMe } from '@/features/auth/api'
import { alerts } from '@/lib/alerts'
import { toApiError } from '@/lib/api/errors'
import { cn } from '@/lib/utils'
import {
  hostelApi,
  useFeeSchedule,
  useHostelMutation,
  type Schedule,
  type ScheduleItemInput,
} from '../api'
import { FormError } from './resident-form-parts'

const MAX_ROWS = 12

interface Row {
  key: string
  label: string
  due_date: string
  share: string
  invoiced: number
}

type RowErrors = Partial<Record<'label' | 'due_date' | 'share', string>>

const round2 = (value: number) => Math.round(value * 100) / 100

export function FeeScheduleEditor() {
  const schedule = useFeeSchedule()
  const data = schedule.data

  if (schedule.isError && !data) {
    return (
      <Card>
        <ErrorState message={schedule.error.message} onRetry={() => schedule.refetch()} />
      </Card>
    )
  }
  if (!data) return <Skeleton className='h-72' />

  const signature = JSON.stringify([
    data.academic_year_id,
    data.locked,
    data.items.map((item) => [item.id, item.label, item.due_date, item.share_percent]),
  ])
  return <ScheduleForm key={signature} schedule={data} />
}

function ScheduleForm({ schedule }: { schedule: Schedule }) {
  const canEdit = can(useMe().data, 'hostel.fees')
  const locked = schedule.locked
  const [rows, setRows] = useState<Row[]>(() =>
    schedule.items.map((item) => ({
      key: `item-${item.id}`,
      label: item.label,
      due_date: item.due_date,
      share: String(item.share_percent),
      invoiced: item.invoiced,
    }))
  )
  const [errors, setErrors] = useState<Record<string, RowErrors>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const save = useHostelMutation((items: ScheduleItemInput[]) => hostelApi.saveSchedule(items))

  const total = round2(rows.reduce((sum, row) => sum + (Number(row.share) || 0), 0))
  const dirty =
    rows.length !== schedule.items.length ||
    rows.some((row, index) => {
      const item = schedule.items[index]
      return (
        !item ||
        row.label !== item.label ||
        row.due_date !== item.due_date ||
        Number(row.share) !== item.share_percent
      )
    })

  const update = (key: string, patch: Partial<Row>) => {
    setRows((current) => current.map((row) => (row.key === key ? { ...row, ...patch } : row)))
    setErrors((current) => {
      if (!current[key]) return current
      const next = { ...current }
      delete next[key]
      return next
    })
  }

  const add = () =>
    setRows((current) => {
      const left = round2(100 - current.reduce((sum, row) => sum + (Number(row.share) || 0), 0))
      return [
        ...current,
        {
          key: crypto.randomUUID(),
          label: `Term ${current.length + 1}`,
          due_date: '',
          share: left > 0 ? String(left) : '',
          invoiced: 0,
        },
      ]
    })

  const remove = (key: string) => setRows((current) => current.filter((row) => row.key !== key))

  const validate = () => {
    const found: Record<string, RowErrors> = {}
    rows.forEach((row) => {
      const rowErrors: RowErrors = {}
      if (!row.label.trim()) rowErrors.label = 'Enter a name'
      else if (row.label.trim().length > 40) rowErrors.label = '40 characters or less'
      if (!row.due_date) rowErrors.due_date = 'Choose a date'
      const share = Number(row.share)
      if (!/^\d+(\.\d{1,2})?$/.test(row.share.trim()) || share <= 0 || share > 100)
        rowErrors.share = 'Between 0.01 and 100'
      if (Object.keys(rowErrors).length) found[row.key] = rowErrors
    })
    const dates = rows.map((row) => row.due_date).filter(Boolean)
    if (new Set(dates).size !== dates.length) {
      rows.forEach((row) => {
        if (row.due_date && dates.filter((date) => date === row.due_date).length > 1)
          found[row.key] = { ...found[row.key], due_date: 'Two instalments share this date' }
      })
    }
    setErrors(found)
    if (!rows.length) return 'Add at least one instalment'
    if (Object.keys(found).length) return 'Fix the highlighted instalments'
    if (total !== 100) return `Shares must add up to 100% (now ${total}%)`
    return null
  }

  const submit = () => {
    const problem = validate()
    setFormError(problem)
    if (problem) return
    save
      .mutateAsync(
        rows.map((row) => ({
          label: row.label.trim(),
          due_date: row.due_date,
          share_percent: Number(row.share),
        }))
      )
      .then(() => alerts.success('Fee schedule saved'))
      .catch((error: unknown) => {
        const apiError = toApiError(error)
        const messages = apiError.fieldErrors.map((item) => item.message)
        setFormError(messages.length ? messages.join('. ') : apiError.message)
      })
  }

  const editable = canEdit
  const fixed = locked || !canEdit

  return (
    <Card className='grid gap-4 p-4 sm:p-5'>
      <div className='flex flex-wrap items-start justify-between gap-3'>
        <div className='grid gap-1'>
          <h2 className='flex items-center gap-2 font-bold'>
            <CalendarRange className='size-4 text-muted-foreground' />
            Instalments for {schedule.year_name}
          </h2>
          <p className='max-w-2xl text-sm text-muted-foreground'>
            Each instalment bills its share of the room type&apos;s annual fee on the due date.
            Shares must add up to 100%.
          </p>
        </div>
        {locked && (
          <Badge tone='warning'>
            <Lock className='size-3' />
            Billed · names only
          </Badge>
        )}
      </div>

      {locked && (
        <p className='rounded-lg border border-warning/40 bg-warning/5 px-3 py-2 text-sm'>
          Some instalments are already billed, so dates and shares are fixed for this year. You can
          still rename them.
        </p>
      )}

      <FormError message={formError ?? undefined} />

      {rows.length === 0 ? (
        <p className='rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground'>
          No instalments yet. Add one for the whole year, or split it into terms.
        </p>
      ) : (
        <div className='grid gap-2'>
          <div className='hidden gap-3 px-1 text-[11px] font-bold tracking-wider text-muted-foreground uppercase md:grid md:grid-cols-[minmax(0,1fr)_11rem_7rem_6rem_2.25rem]'>
            <span>Name</span>
            <span>Due date</span>
            <span>Share %</span>
            <span>Billed</span>
            <span className='sr-only'>Remove</span>
          </div>
          {rows.map((row, index) => {
            const rowErrors = errors[row.key] ?? {}
            return (
              <div
                key={row.key}
                className='grid gap-3 rounded-lg border p-3 md:grid-cols-[minmax(0,1fr)_11rem_7rem_6rem_2.25rem] md:items-start md:rounded-none md:border-0 md:border-b md:p-1 md:pb-2'
              >
                <RowField label='Name' error={rowErrors.label}>
                  <Input
                    aria-label={`Instalment ${index + 1} name`}
                    value={row.label}
                    maxLength={40}
                    disabled={!editable}
                    aria-invalid={Boolean(rowErrors.label)}
                    onChange={(event) => update(row.key, { label: event.target.value })}
                  />
                </RowField>
                <div className='grid grid-cols-2 gap-3 md:contents'>
                  <RowField label='Due date' error={rowErrors.due_date}>
                    <DatePicker
                      id={`schedule-date-${row.key}`}
                      value={row.due_date}
                      disabled={fixed}
                      clearable={false}
                      invalid={Boolean(rowErrors.due_date)}
                      onChange={(value: string) => update(row.key, { due_date: value })}
                    />
                  </RowField>
                  <RowField label='Share %' error={rowErrors.share}>
                    <Input
                      aria-label={`Instalment ${index + 1} share percent`}
                      inputMode='decimal'
                      className='tabular'
                      value={row.share}
                      disabled={fixed}
                      aria-invalid={Boolean(rowErrors.share)}
                      onChange={(event) => update(row.key, { share: event.target.value })}
                    />
                  </RowField>
                </div>
                <div className='flex items-center justify-between gap-2 md:contents'>
                  <span className='text-sm text-muted-foreground md:pt-2'>
                    <span className='md:hidden'>Billed to </span>
                    <span className='tabular font-semibold text-foreground'>{row.invoiced}</span>
                    <span className='md:hidden'> residents</span>
                  </span>
                  <Button
                    variant='ghost'
                    size='icon'
                    aria-label={`Remove ${row.label || `instalment ${index + 1}`}`}
                    disabled={fixed}
                    onClick={() => remove(row.key)}
                  >
                    <Trash2 />
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <div className='flex flex-wrap items-center justify-between gap-3 border-t pt-4'>
        <div className='flex flex-wrap items-center gap-3'>
          {!fixed && (
            <Button variant='outline' disabled={rows.length >= MAX_ROWS} onClick={add}>
              <Plus />
              Add instalment
            </Button>
          )}
          <span
            className={cn(
              'tabular text-sm font-semibold',
              total === 100 ? 'text-success' : 'text-warning'
            )}
          >
            Total {total}%
          </span>
        </div>
        {editable && (
          <Button loading={save.isPending} disabled={!dirty} onClick={submit}>
            <Save />
            Save schedule
          </Button>
        )}
      </div>
    </Card>
  )
}

function RowField({
  label,
  error,
  children,
}: {
  label: string
  error?: string
  children: ReactNode
}) {
  return (
    <div className='grid content-start gap-1'>
      <span className='text-xs font-semibold md:sr-only'>{label}</span>
      {children}
      {error && (
        <span role='alert' className='text-xs font-medium text-destructive'>
          {error}
        </span>
      )}
    </div>
  )
}
