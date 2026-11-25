import { useState } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Clock, MoonStar, Pencil, Plus, Trash2 } from 'lucide-react'
import { z } from 'zod'
import { AppModal } from '@/components/common/app-modal'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import { DataTable, type Column } from '@/components/common/data-table'
import { FormField } from '@/components/common/form-field'
import { TimePicker } from '@/components/common/time-picker'
import { useShortcut } from '@/components/shortcuts/shortcut-context'
import { Kbd } from '@/components/shortcuts/kbd'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { alerts } from '@/lib/alerts'
import { toApiError } from '@/lib/api/errors'
import { useHostelMutation } from '../api'
import { dutyApi, useDutyShifts, type DutyShift, type DutyShiftInput } from '../api-duty'
import { FormAlert, InfoNote, SwitchField } from './leave-form-parts'
import { applyApiError, timeLabel } from './leave-helpers'

export function DutyShiftsTab({ canManage }: { canManage: boolean }) {
  const shifts = useDutyShifts()
  const [editing, setEditing] = useState<DutyShift | 'new' | null>(null)
  const [removing, setRemoving] = useState<DutyShift | null>(null)
  const remove = useHostelMutation((id: number) => dutyApi.removeShift(id))
  const rows = shifts.data ?? []

  useShortcut('hostel.create', () => setEditing('new'), { enabled: canManage })

  const confirmRemove = async () => {
    if (!removing) return
    try {
      await remove.mutateAsync(removing.id)
      alerts.success('Shift deleted', { description: removing.name })
      setRemoving(null)
    } catch (error) {
      alerts.error(toApiError(error).message)
    }
  }

  const actions = (row: DutyShift) =>
    canManage ? (
      <div className='flex justify-end gap-1'>
        <Button
          variant='ghost'
          size='icon-sm'
          aria-label={`Edit ${row.name}`}
          onClick={() => setEditing(row)}
        >
          <Pencil />
        </Button>
        <Button
          variant='ghost'
          size='icon-sm'
          aria-label={`Delete ${row.name}`}
          onClick={() => setRemoving(row)}
        >
          <Trash2 />
        </Button>
      </div>
    ) : null

  const columns: Column<DutyShift>[] = [
    {
      key: 'name',
      header: 'Shift',
      cell: (row) => (
        <span className='flex items-center gap-1.5 font-semibold'>
          {row.name}
          {row.is_night && <MoonStar className='size-3.5 text-muted-foreground' />}
        </span>
      ),
    },
    {
      key: 'start',
      header: 'Starts',
      cell: (row) => <span className='tabular'>{timeLabel(row.start_time.slice(0, 5))}</span>,
    },
    {
      key: 'end',
      header: 'Ends',
      cell: (row) => (
        <span className='tabular'>
          {timeLabel(row.end_time.slice(0, 5))}
          {row.crosses_midnight && (
            <span className='ml-1 text-xs text-muted-foreground'>next day</span>
          )}
        </span>
      ),
    },
    {
      key: 'night',
      header: 'Night duty',
      hideBelow: 'lg',
      cell: (row) => (row.is_night ? 'Yes' : 'No'),
    },
    {
      key: 'active',
      header: 'Status',
      cell: (row) => (
        <Badge tone={row.active ? 'success' : 'neutral'}>{row.active ? 'Active' : 'Off'}</Badge>
      ),
    },
    { key: 'actions', header: '', align: 'right', cell: actions },
  ]

  return (
    <Card className='overflow-hidden'>
      <div className='flex flex-wrap items-center gap-2 border-b px-4 py-3'>
        <span className='text-sm font-semibold'>Duty shifts</span>
        <span className='tabular text-xs text-muted-foreground'>{rows.length} shifts</span>
        {canManage && (
          <Button size='sm' className='ml-auto' onClick={() => setEditing('new')}>
            <Plus />
            Add shift
            <Kbd id='hostel.create' inverted />
          </Button>
        )}
      </div>
      <DataTable
        rows={rows}
        columns={columns}
        rowKey={(row) => row.id}
        loading={shifts.isFetching}
        error={shifts.isError ? shifts.error.message : null}
        onRetry={() => shifts.refetch()}
        empty={{
          icon: Clock,
          title: 'No shifts yet',
          description: 'Add shifts like Morning, Evening and Night to build the duty roster.',
          action: canManage ? (
            <Button onClick={() => setEditing('new')}>
              <Plus />
              Add shift
            </Button>
          ) : undefined,
        }}
        card={(row) => (
          <div className='flex items-start justify-between gap-3'>
            <div className='grid gap-1'>
              <span className='flex items-center gap-1.5 font-semibold'>
                {row.name}
                {row.is_night && <MoonStar className='size-3.5 text-muted-foreground' />}
              </span>
              <span className='tabular text-xs text-muted-foreground'>
                {timeLabel(row.start_time.slice(0, 5))} – {timeLabel(row.end_time.slice(0, 5))}
                {row.crosses_midnight ? ' (next day)' : ''}
              </span>
              <Badge tone={row.active ? 'success' : 'neutral'} className='justify-self-start'>
                {row.active ? 'Active' : 'Off'}
              </Badge>
            </div>
            {actions(row)}
          </div>
        )}
      />

      {editing && (
        <ShiftFormModal
          shift={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
        />
      )}

      <ConfirmDialog
        open={Boolean(removing)}
        onOpenChange={(open) => !open && setRemoving(null)}
        title='Delete shift'
        description={
          removing
            ? `Delete the ${removing.name} shift? A shift on the roster for today or later cannot be deleted; turn it off instead.`
            : ''
        }
        confirmText='Delete'
        destructive
        loading={remove.isPending}
        onConfirm={() => void confirmRemove()}
      />
    </Card>
  )
}

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/

const schema = z
  .object({
    name: z.string().trim().min(1, 'Enter a name').max(40, 'Keep it to 40 characters'),
    start_time: z.string().regex(TIME, 'Choose a start time'),
    end_time: z.string().regex(TIME, 'Choose an end time'),
    is_night: z.boolean(),
    active: z.boolean(),
  })
  .refine((values) => values.start_time !== values.end_time, {
    path: ['end_time'],
    message: 'End time must differ from start time',
  })

type FormValues = z.infer<typeof schema>

const FORM_ID = 'duty-shift-form'

function ShiftFormModal({ shift, onClose }: { shift: DutyShift | null; onClose: () => void }) {
  const [nightTouched, setNightTouched] = useState(Boolean(shift))
  const save = useHostelMutation((input: DutyShiftInput) =>
    shift ? dutyApi.updateShift(shift.id, input) : dutyApi.createShift(input)
  )
  const {
    register,
    control,
    handleSubmit,
    setError,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: shift?.name ?? '',
      start_time: shift?.start_time.slice(0, 5) ?? '',
      end_time: shift?.end_time.slice(0, 5) ?? '',
      is_night: shift?.is_night ?? false,
      active: shift?.active ?? true,
    },
  })
  const [start, end] = useWatch({ control, name: ['start_time', 'end_time'] })
  const crosses = TIME.test(start) && TIME.test(end) && end <= start

  const syncNight = () => {
    if (nightTouched) return
    const values = getValues()
    if (TIME.test(values.start_time) && TIME.test(values.end_time)) {
      setValue('is_night', values.end_time <= values.start_time)
    }
  }

  const submit = handleSubmit(async (values) => {
    try {
      const saved = await save.mutateAsync(values)
      alerts.success(shift ? 'Shift updated' : 'Shift added', { description: saved.name })
      onClose()
    } catch (error) {
      applyApiError(error, setError, ['name', 'start_time', 'end_time', 'is_night', 'active'], {
        HOSTEL_SHIFT_NAME_TAKEN: 'name',
      })
    }
  })

  return (
    <AppModal
      open
      onOpenChange={(open) => !open && onClose()}
      title={shift ? 'Edit shift' : 'Add shift'}
      description='Staff are put on the roster by shift. Check-in opens 30 minutes before the start.'
      formId={FORM_ID}
      submitText={shift ? 'Save shift' : 'Add shift'}
      loading={save.isPending}
      size='sm'
    >
      <form id={FORM_ID} noValidate onSubmit={submit} className='grid gap-4'>
        <FormAlert message={errors.root?.message} />
        <FormField id='shift-name' label='Name' required error={errors.name?.message}>
          <Input
            id='shift-name'
            autoComplete='off'
            maxLength={40}
            placeholder='Night'
            aria-invalid={Boolean(errors.name)}
            {...register('name')}
          />
        </FormField>
        <div className='grid gap-4 sm:grid-cols-2'>
          <FormField id='shift-start' label='Starts' required error={errors.start_time?.message}>
            <Controller
              control={control}
              name='start_time'
              render={({ field }) => (
                <TimePicker
                  id='shift-start'
                  value={field.value}
                  invalid={Boolean(errors.start_time)}
                  onChange={(value) => {
                    field.onChange(value)
                    syncNight()
                  }}
                />
              )}
            />
          </FormField>
          <FormField
            id='shift-end'
            label='Ends'
            required
            error={errors.end_time?.message}
            hint={crosses ? 'Ends the next day' : undefined}
          >
            <Controller
              control={control}
              name='end_time'
              render={({ field }) => (
                <TimePicker
                  id='shift-end'
                  value={field.value}
                  invalid={Boolean(errors.end_time)}
                  onChange={(value) => {
                    field.onChange(value)
                    syncNight()
                  }}
                />
              )}
            />
          </FormField>
        </div>
        <Controller
          control={control}
          name='is_night'
          render={({ field }) => (
            <SwitchField
              id='shift-night'
              label='Night duty'
              description='Night shifts show in night rounds and the night duty list.'
              checked={field.value}
              onCheckedChange={(checked) => {
                setNightTouched(true)
                field.onChange(checked)
              }}
            />
          )}
        />
        <Controller
          control={control}
          name='active'
          render={({ field }) => (
            <SwitchField
              id='shift-active'
              label='Active'
              description='Turned-off shifts cannot be put on the roster.'
              checked={field.value}
              onCheckedChange={field.onChange}
            />
          )}
        />
        {crosses && (
          <InfoNote>An end time before the start time means the shift ends the next day.</InfoNote>
        )}
      </form>
    </AppModal>
  )
}
