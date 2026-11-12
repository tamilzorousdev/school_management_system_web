import { useState } from 'react'
import { CalendarDays, Pencil, Plus, Trash2 } from 'lucide-react'
import { AppModal } from '@/components/common/app-modal'
import { Combobox } from '@/components/common/combobox'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import { EmptyState, ErrorState } from '@/components/common/display'
import { FormField } from '@/components/common/form-field'
import { Badge, type BadgeTone } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import { setupApi, useHolidays, useSetupMutation, type Holiday, type HolidayType } from '../api'
import { fieldErrorsOf, run } from '../form-actions'
import { RootError, Section } from './setup-shared'
import { SegmentedControl } from '@/components/common/segmented-control'
import { ClassPicker } from './class-picker'

const TYPES: Record<HolidayType, { label: string; tone: BadgeTone }> = {
  holiday: { label: 'Holiday', tone: 'success' },
  emergency_closure: { label: 'Emergency closure', tone: 'danger' },
  event: { label: 'School event', tone: 'info' },
}

const today = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })

export function HolidaysTab({ canManage }: { canManage: boolean }) {
  const holidays = useHolidays()
  const [editing, setEditing] = useState<Holiday | 'new' | null>(null)
  const [removing, setRemoving] = useState<Holiday | null>(null)
  const remove = useSetupMutation((id: number) => setupApi.removeHoliday(id))
  const now = today()

  return (
    <Section
      title='Holidays and events'
      description='Attendance skips holidays. Emergency closures, like rain holidays, are announced to parents.'
      action={
        canManage && (
          <Button size='sm' onClick={() => setEditing('new')}>
            <Plus />
            Add holiday
          </Button>
        )
      }
    >
      {holidays.isError ? (
        <ErrorState message={holidays.error.message} onRetry={() => holidays.refetch()} />
      ) : !holidays.data ? (
        <Skeleton className='h-60' />
      ) : holidays.data.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title='No holidays yet'
          description='Add the year’s holidays so attendance skips them.'
        />
      ) : (
        <ul className='grid gap-2'>
          {holidays.data.map((holiday) => {
            const past = (holiday.end_date ?? holiday.date) < now
            const day = new Date(`${holiday.date}T00:00:00Z`)
            return (
              <li
                key={holiday.id}
                className={cn(
                  'flex items-center gap-3 rounded-lg border p-3',
                  past && 'opacity-60'
                )}
              >
                <span className='grid w-12 shrink-0 place-items-center rounded-lg bg-muted py-1 text-center'>
                  <span className='text-[10px] font-bold text-muted-foreground uppercase'>
                    {day.toLocaleDateString('en-IN', { month: 'short', timeZone: 'UTC' })}
                  </span>
                  <span className='tabular text-lg leading-none font-extrabold'>
                    {day.getUTCDate()}
                  </span>
                </span>
                <span className='grid min-w-0 flex-1'>
                  <span className='truncate font-semibold'>{holiday.name}</span>
                  <span className='text-xs text-muted-foreground'>
                    {holiday.end_date
                      ? `${formatDate(holiday.date)} to ${formatDate(holiday.end_date)} · `
                      : `${formatDate(holiday.date)} · `}
                    {holiday.days} {holiday.days === 1 ? 'day' : 'days'}
                  </span>
                </span>
                {!holiday.whole_school && (
                  <Badge tone='info' className='max-w-48 truncate'>
                    {holiday.classes.map((item) => `Class ${item.name}`).join(', ')}
                  </Badge>
                )}
                <Badge tone={TYPES[holiday.type].tone}>{TYPES[holiday.type].label}</Badge>
                {canManage && (
                  <span className='flex'>
                    <Button
                      size='icon-sm'
                      variant='ghost'
                      aria-label={`Edit ${holiday.name}`}
                      onClick={() => setEditing(holiday)}
                    >
                      <Pencil />
                    </Button>
                    <Button
                      size='icon-sm'
                      variant='ghost'
                      aria-label={`Delete ${holiday.name}`}
                      className='text-destructive hover:bg-destructive/10'
                      onClick={() => setRemoving(holiday)}
                    >
                      <Trash2 />
                    </Button>
                  </span>
                )}
              </li>
            )
          })}
        </ul>
      )}
      {editing && (
        <HolidayModal
          holiday={editing === 'new' ? undefined : editing}
          onClose={() => setEditing(null)}
        />
      )}
      <ConfirmDialog
        open={Boolean(removing)}
        onOpenChange={(open) => !open && setRemoving(null)}
        title={`Delete ${removing?.name ?? ''}?`}
        description='It is removed from the school calendar.'
        confirmText='Delete'
        destructive
        loading={remove.isPending}
        onConfirm={async () => {
          if (removing) await run(() => remove.mutateAsync(removing.id), `${removing.name} deleted`)
          setRemoving(null)
        }}
      />
    </Section>
  )
}

function HolidayModal({ holiday, onClose }: { holiday?: Holiday; onClose: () => void }) {
  const [name, setName] = useState(holiday?.name ?? '')
  const [date, setDate] = useState(holiday?.date ?? '')
  const [endDate, setEndDate] = useState(holiday?.end_date ?? '')
  const [type, setType] = useState<HolidayType>(holiday?.type ?? 'holiday')
  const [onlyClasses, setOnlyClasses] = useState(holiday ? !holiday.whole_school : false)
  const [classIds, setClassIds] = useState<number[]>(holiday?.classes.map((item) => item.id) ?? [])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const save = useSetupMutation(() => {
    const input = {
      name: name.trim(),
      date,
      end_date: endDate || null,
      type,
      class_ids: onlyClasses ? classIds : null,
    }
    return holiday ? setupApi.updateHoliday(holiday.id, input) : setupApi.createHoliday(input)
  })
  return (
    <AppModal
      open
      onOpenChange={(open) => !open && onClose()}
      title={holiday ? `Edit ${holiday.name}` : 'Add holiday'}
      formId='holiday-form'
      submitText={holiday ? 'Save' : 'Add'}
      loading={save.isPending}
    >
      <form
        id='holiday-form'
        noValidate
        className='grid gap-4 sm:grid-cols-2'
        onSubmit={async (event) => {
          event.preventDefault()
          const next: Record<string, string> = {}
          if (name.trim().length < 2) next.name = 'Enter a name'
          if (!date) next.date = 'Choose the date'
          if (endDate && date && endDate < date) next.end_date = 'Must be on or after the first day'
          if (onlyClasses && !classIds.length) next.class_ids = 'Choose at least one class'
          setErrors(next)
          if (Object.keys(next).length) return
          try {
            await save.mutateAsync(undefined)
            onClose()
          } catch (error) {
            setErrors(fieldErrorsOf(error))
          }
        }}
      >
        <RootError message={errors.root} />
        <FormField
          id='holiday-name'
          label='Name'
          required
          error={errors.name}
          className='sm:col-span-2'
        >
          <Input
            id='holiday-name'
            autoFocus
            placeholder='Deepavali'
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </FormField>
        <FormField id='holiday-date' label='Date' required error={errors.date}>
          <Input
            id='holiday-date'
            type='date'
            value={date}
            onChange={(event) => setDate(event.target.value)}
          />
        </FormField>
        <FormField
          id='holiday-end'
          label='Last day'
          error={errors.end_date}
          hint='For holidays longer than a day'
        >
          <Input
            id='holiday-end'
            type='date'
            value={endDate}
            min={date || undefined}
            onChange={(event) => setEndDate(event.target.value)}
          />
        </FormField>
        <FormField id='holiday-type' label='Type' className='sm:col-span-2'>
          <Combobox
            id='holiday-type'
            label='Type'
            value={type}
            placeholder='Choose type'
            options={(Object.keys(TYPES) as HolidayType[]).map((value) => ({
              value,
              label: TYPES[value].label,
            }))}
            onChange={(value) => setType((value ?? 'holiday') as HolidayType)}
            highlightSelected={false}
            className='sm:w-full'
          />
        </FormField>
        <FormField
          id='holiday-scope'
          label='Applies to'
          error={errors.class_ids}
          hint={
            onlyClasses
              ? 'Only these classes are off; attendance is not expected from them. Teachers and parents of these classes see it.'
              : 'Every class is off'
          }
          className='sm:col-span-2'
        >
          <div className='grid gap-2.5'>
            <SegmentedControl
              label='Applies to'
              value={onlyClasses ? 'classes' : 'school'}
              onChange={(value: string) => setOnlyClasses(value === 'classes')}
              options={[
                { value: 'school', label: 'Whole school' },
                { value: 'classes', label: 'Only some classes' },
              ]}
            />
            {onlyClasses && (
              <ClassPicker id='holiday-scope' value={classIds} onChange={setClassIds} />
            )}
          </div>
        </FormField>
      </form>
    </AppModal>
  )
}
