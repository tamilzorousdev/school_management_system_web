import { useState } from 'react'
import { CalendarHeart, Plus, RotateCcw, Save, Trash2 } from 'lucide-react'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import { DataTable, type Column } from '@/components/common/data-table'
import { ErrorState } from '@/components/common/display'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input, Textarea } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { alerts } from '@/lib/alerts'
import { toApiError } from '@/lib/api/errors'
import { formatDate } from '@/lib/format'
import { useHostelMutation } from '../api'
import {
  careApi,
  useMessMenu,
  useMessOverrides,
  type Meal,
  type MessMenuEntryInput,
  type MessOverride,
  type MessWeek,
} from '../api-care'
import { InfoNote } from './leave-form-parts'
import { shiftDate, todayIso } from './leave-helpers'
import { DAY_NAMES, MEAL, MEALS, WEEK_ORDER } from './mess-helpers'
import { MessOverrideModal } from './mess-override-modal'

type Cell = { items: string; non_veg_items: string }
type Draft = Record<string, Cell>

const cellKey = (day: number, meal: Meal) => `${day}-${meal}`

function draftFrom(week: MessWeek, own: 'hostel_week' | 'school_week'): Draft {
  const draft: Draft = {}
  week.days.forEach((day) =>
    day.meals.forEach((meal) => {
      draft[cellKey(day.day_of_week, meal.meal)] =
        meal.source === own
          ? { items: meal.items ?? '', non_veg_items: meal.non_veg_items ?? '' }
          : { items: '', non_veg_items: '' }
    })
  )
  return draft
}

export function MessMenuEditor({ hostelId, canEdit }: { hostelId?: number; canEdit: boolean }) {
  const week = useMessMenu(hostelId)
  if (week.isError && !week.data) {
    return (
      <Card>
        <ErrorState message={week.error.message} onRetry={() => week.refetch()} />
      </Card>
    )
  }
  if (!week.data) {
    return (
      <div className='grid gap-3'>
        <Skeleton className='h-40' />
        <Skeleton className='h-40' />
      </div>
    )
  }
  return (
    <MenuGrid key={hostelId ?? 'school'} week={week.data} hostelId={hostelId} canEdit={canEdit} />
  )
}

function MenuGrid({
  week,
  hostelId,
  canEdit,
}: {
  week: MessWeek
  hostelId?: number
  canEdit: boolean
}) {
  const scoped = Boolean(hostelId)
  const own = scoped ? 'hostel_week' : 'school_week'
  const [initial, setInitial] = useState(() => draftFrom(week, own))
  const [draft, setDraft] = useState(initial)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const save = useHostelMutation(careApi.saveMenu)

  const dirty = Object.keys(draft).some(
    (key) =>
      draft[key].items !== initial[key]?.items ||
      draft[key].non_veg_items !== initial[key]?.non_veg_items
  )

  const update = (key: string, patch: Partial<Cell>) => {
    setDraft((prev) => ({ ...prev, [key]: { ...prev[key], ...patch } }))
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: '' }))
  }

  const submit = async () => {
    const found: Record<string, string> = {}
    const entries: MessMenuEntryInput[] = []
    WEEK_ORDER.forEach((day) =>
      MEALS.forEach((meal) => {
        const key = cellKey(day, meal)
        const cell = draft[key] ?? { items: '', non_veg_items: '' }
        const items = cell.items.trim()
        const nonVeg = cell.non_veg_items.trim()
        if (!items && nonVeg) found[key] = 'Add the main items first'
        if (items) entries.push({ day_of_week: day, meal, items, non_veg_items: nonVeg || null })
      })
    )
    if (Object.values(found).some(Boolean)) {
      setErrors(found)
      return
    }
    try {
      const saved = await save.mutateAsync({ hostel_id: hostelId, entries })
      const next = draftFrom(saved, own)
      setInitial(next)
      setDraft(next)
      alerts.success('Menu saved', {
        description: scoped
          ? 'Meals left empty use the school menu.'
          : 'Hostels without their own menu use this one.',
      })
    } catch (error) {
      alerts.error(toApiError(error).message)
    }
  }

  const inherited = (day: number, meal: Meal) =>
    week.days.find((item) => item.day_of_week === day)?.meals.find((item) => item.meal === meal)

  return (
    <div className='grid gap-4'>
      <InfoNote>
        {scoped
          ? 'This hostel’s own menu. A meal left empty uses the school menu (shown in grey). Saving replaces this hostel’s whole week.'
          : 'The school menu, used by every hostel that has no menu of its own. Saving replaces the whole week.'}
      </InfoNote>

      {WEEK_ORDER.map((day) => (
        <Card key={day} className='gap-3 p-4'>
          <h3 className='text-sm font-bold'>{DAY_NAMES[day]}</h3>
          <div className='grid gap-3 sm:grid-cols-2 xl:grid-cols-4'>
            {MEALS.map((meal) => {
              const key = cellKey(day, meal)
              const cell = draft[key] ?? { items: '', non_veg_items: '' }
              const fallback = inherited(day, meal)
              const school = scoped && fallback?.source === 'school_week' ? fallback : null
              const error = errors[key]
              return (
                <div key={meal} className='grid content-start gap-1.5'>
                  <label htmlFor={`menu-${key}`} className='text-xs font-semibold'>
                    {MEAL[meal]}
                  </label>
                  <Textarea
                    id={`menu-${key}`}
                    rows={2}
                    maxLength={500}
                    disabled={!canEdit}
                    value={cell.items}
                    aria-invalid={Boolean(error)}
                    placeholder={school?.items ?? 'Items, e.g. Idli, sambar, chutney'}
                    onChange={(event) => update(key, { items: event.target.value })}
                  />
                  <Input
                    id={`menu-${key}-nonveg`}
                    aria-label={`${DAY_NAMES[day]} ${MEAL[meal]} non-veg items`}
                    maxLength={300}
                    disabled={!canEdit}
                    value={cell.non_veg_items}
                    placeholder={school?.non_veg_items ?? 'Non-veg items (optional)'}
                    onChange={(event) => update(key, { non_veg_items: event.target.value })}
                  />
                  {error ? (
                    <p role='alert' className='text-xs font-medium text-destructive'>
                      {error}
                    </p>
                  ) : (
                    school &&
                    !cell.items.trim() && (
                      <p className='text-xs text-muted-foreground'>Uses the school menu</p>
                    )
                  )}
                </div>
              )
            })}
          </div>
        </Card>
      ))}

      {canEdit && (
        <div className='sticky bottom-4 z-10'>
          <Card className='flex flex-row flex-wrap items-center justify-between gap-3 border-primary/40 px-4 py-3 shadow-lg'>
            <span className='text-sm font-semibold'>
              {dirty ? 'Menu changes not saved' : 'No changes'}
            </span>
            <div className='flex gap-2'>
              <Button
                variant='ghost'
                size='sm'
                disabled={!dirty}
                onClick={() => {
                  setDraft(initial)
                  setErrors({})
                }}
              >
                <RotateCcw />
                Undo changes
              </Button>
              <Button
                size='sm'
                disabled={!dirty}
                loading={save.isPending}
                onClick={() => void submit()}
              >
                <Save />
                Save menu
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}

export function MessOverrides({ hostelId, canEdit }: { hostelId?: number; canEdit: boolean }) {
  const today = todayIso()
  const overrides = useMessOverrides({ from: today, to: shiftDate(today, 60), hostel_id: hostelId })
  const [adding, setAdding] = useState(false)
  const [removing, setRemoving] = useState<MessOverride | null>(null)
  const remove = useHostelMutation(careApi.removeOverride)

  const confirmRemove = async () => {
    if (!removing) return
    try {
      await remove.mutateAsync(removing.id)
      alerts.success('Menu change removed', { description: 'The weekly menu applies again.' })
      setRemoving(null)
    } catch (error) {
      alerts.error(toApiError(error).message)
    }
  }

  const columns: Column<MessOverride>[] = [
    {
      key: 'date',
      header: 'Date',
      cell: (row) => (
        <div className='grid gap-0.5'>
          <span className='font-semibold'>{formatDate(row.menu_date)}</span>
          <span className='text-xs text-muted-foreground'>{MEAL[row.meal]}</span>
        </div>
      ),
    },
    {
      key: 'items',
      header: 'Menu',
      cell: (row) => <OverrideItems row={row} />,
    },
    {
      key: 'scope',
      header: 'For',
      hideBelow: 'lg',
      cell: (row) => (
        <Badge tone={row.hostel_id ? 'info' : 'neutral'}>{row.hostel_name ?? 'All hostels'}</Badge>
      ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      cell: (row) =>
        canEdit ? (
          <Button
            variant='ghost'
            size='icon-sm'
            aria-label={`Remove the ${MEAL[row.meal]} change on ${formatDate(row.menu_date)}`}
            onClick={() => setRemoving(row)}
          >
            <Trash2 />
          </Button>
        ) : null,
    },
  ]

  return (
    <Card className='overflow-hidden'>
      <div className='flex flex-wrap items-center gap-2 border-b px-4 py-3'>
        <div className='grid gap-0.5'>
          <h2 className='text-sm font-bold'>Special menus for dates</h2>
          <p className='text-xs text-muted-foreground'>
            Festivals and events in the next 60 days. These win over the weekly menu.
          </p>
        </div>
        {canEdit && (
          <Button size='sm' variant='outline' className='ml-auto' onClick={() => setAdding(true)}>
            <Plus />
            Add date menu
          </Button>
        )}
      </div>
      <DataTable
        rows={overrides.data ?? []}
        columns={columns}
        rowKey={(row) => row.id}
        loading={overrides.isFetching}
        error={overrides.isError ? overrides.error.message : null}
        onRetry={() => overrides.refetch()}
        empty={{
          icon: CalendarHeart,
          title: 'No special menus coming up',
          description: 'Add one for a festival, a holiday or an event day.',
        }}
        card={(row) => (
          <div className='grid gap-2'>
            <div className='flex items-start justify-between gap-2'>
              <div className='grid gap-0.5'>
                <span className='font-semibold'>
                  {formatDate(row.menu_date)} · {MEAL[row.meal]}
                </span>
                <span className='text-xs text-muted-foreground'>
                  {row.hostel_name ?? 'All hostels'}
                </span>
              </div>
              {canEdit && (
                <Button
                  variant='ghost'
                  size='icon-sm'
                  aria-label='Remove this menu change'
                  onClick={() => setRemoving(row)}
                >
                  <Trash2 />
                </Button>
              )}
            </div>
            <OverrideItems row={row} />
          </div>
        )}
      />

      {adding && <MessOverrideModal defaultHostelId={hostelId} onClose={() => setAdding(false)} />}
      <ConfirmDialog
        open={Boolean(removing)}
        onOpenChange={(open) => !open && setRemoving(null)}
        title='Remove this menu change?'
        description={
          removing
            ? `${MEAL[removing.meal]} on ${formatDate(removing.menu_date)} goes back to the weekly menu.`
            : ''
        }
        confirmText='Remove'
        destructive
        loading={remove.isPending}
        onConfirm={() => void confirmRemove()}
      />
    </Card>
  )
}

function OverrideItems({ row }: { row: MessOverride }) {
  return (
    <div className='grid min-w-0 gap-0.5 text-sm'>
      <span>{row.items}</span>
      {row.non_veg_items && (
        <span className='text-xs text-muted-foreground'>Non-veg: {row.non_veg_items}</span>
      )}
      {row.note && <span className='text-xs text-muted-foreground italic'>{row.note}</span>}
    </div>
  )
}
