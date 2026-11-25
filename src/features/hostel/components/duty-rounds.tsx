import { useState } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { CheckCircle2, MoonStar, Plus, TriangleAlert } from 'lucide-react'
import { z } from 'zod'
import { AppModal } from '@/components/common/app-modal'
import { DataTable, type Column } from '@/components/common/data-table'
import { DatePicker } from '@/components/common/date-picker'
import { FormField } from '@/components/common/form-field'
import { ListToolbar } from '@/components/common/list-toolbar'
import { useShortcut } from '@/components/shortcuts/shortcut-context'
import { Kbd } from '@/components/shortcuts/kbd'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Textarea } from '@/components/ui/input'
import { alerts } from '@/lib/alerts'
import { formatTime } from '@/lib/format'
import { useHostelMutation, useHostels } from '../api'
import { dutyApi, useRounds, type NightRound, type NightRoundInput } from '../api-duty'
import { FormAlert, SwitchField } from './leave-form-parts'
import { applyApiError, textOrNull, todayIso } from './leave-helpers'
import { BlockSelect, HostelSelect } from './pickers'

export function DutyRoundsTab({
  hostelId,
  date,
  onDateChange,
}: {
  hostelId?: number
  date?: string
  onDateChange: (date: string | undefined) => void
}) {
  const today = todayIso()
  const day = date ?? today
  const rounds = useRounds({ hostel_id: hostelId, date: day })
  const [logging, setLogging] = useState(false)
  const rows = rounds.data ?? []
  const issues = rows.filter((row) => !row.all_ok).length

  useShortcut('hostel.create', () => setLogging(true))

  const columns: Column<NightRound>[] = [
    {
      key: 'time',
      header: 'Time',
      cell: (row) => (
        <span className='tabular font-semibold'>{formatTime(row.round_at).slice(0, 5)}</span>
      ),
    },
    {
      key: 'where',
      header: 'Where',
      cell: (row) => (
        <div className='grid gap-0.5 text-sm'>
          <span>{row.hostel_name}</span>
          <span className='text-xs text-muted-foreground'>{row.block_name ?? 'Whole hostel'}</span>
        </div>
      ),
    },
    {
      key: 'by',
      header: 'By',
      hideBelow: 'lg',
      cell: (row) => <span className='text-sm'>{row.user_name}</span>,
    },
    {
      key: 'result',
      header: 'Result',
      cell: (row) => <RoundResult row={row} />,
    },
  ]

  return (
    <Card className='overflow-hidden'>
      <ListToolbar
        summary={
          rounds.data
            ? `${rows.length} ${rows.length === 1 ? 'round' : 'rounds'}${issues ? ` · ${issues} with issues` : ''}`
            : ''
        }
      >
        <DatePicker
          id='rounds-date'
          value={day}
          max={today}
          clearable={false}
          className='w-full sm:w-44'
          onChange={(value: string) => onDateChange(value && value !== today ? value : undefined)}
        />
        <Button size='sm' onClick={() => setLogging(true)}>
          <Plus />
          Log round
          <Kbd id='hostel.create' inverted />
        </Button>
      </ListToolbar>
      <DataTable
        rows={rows}
        columns={columns}
        rowKey={(row) => row.id}
        loading={rounds.isFetching}
        error={rounds.isError ? rounds.error.message : null}
        onRetry={() => rounds.refetch()}
        empty={{
          icon: MoonStar,
          title: 'No night rounds on this day',
          description: 'Staff on night duty log each round with anything they found.',
          action: (
            <Button onClick={() => setLogging(true)}>
              <Plus />
              Log round
            </Button>
          ),
        }}
        card={(row) => (
          <div className='grid gap-2'>
            <div className='flex items-start justify-between gap-2'>
              <div className='grid gap-0.5'>
                <span className='tabular font-semibold'>
                  {formatTime(row.round_at).slice(0, 5)} · {row.user_name}
                </span>
                <span className='text-xs text-muted-foreground'>
                  {row.hostel_name} · {row.block_name ?? 'Whole hostel'}
                </span>
              </div>
            </div>
            <RoundResult row={row} />
          </div>
        )}
      />
      {logging && <RoundFormModal hostelId={hostelId} onClose={() => setLogging(false)} />}
    </Card>
  )
}

function RoundResult({ row }: { row: NightRound }) {
  if (row.all_ok)
    return (
      <Badge tone='success'>
        <CheckCircle2 className='size-3' />
        All in order
      </Badge>
    )
  return (
    <div className='grid justify-items-start gap-1'>
      <Badge tone='warning'>
        <TriangleAlert className='size-3' />
        Issues found
      </Badge>
      {row.issues && <span className='text-sm'>{row.issues}</span>}
    </div>
  )
}

const schema = z
  .object({
    hostel_id: z.string().min(1, 'Choose a hostel'),
    block_id: z.string(),
    all_ok: z.boolean(),
    issues: z.string().trim().max(500, 'Keep it to 500 characters'),
  })
  .refine((values) => values.all_ok || values.issues.length > 0, {
    path: ['issues'],
    message: 'Say what was wrong',
  })

type FormValues = z.infer<typeof schema>

const FORM_ID = 'duty-round-form'

function RoundFormModal({ hostelId, onClose }: { hostelId?: number; onClose: () => void }) {
  const hostels = useHostels()
  const fallback = hostelId ?? (hostels.data?.length === 1 ? hostels.data[0].id : undefined)
  const add = useHostelMutation((input: NightRoundInput) => dutyApi.addRound(input))
  const {
    register,
    control,
    handleSubmit,
    setError,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      hostel_id: fallback ? String(fallback) : '',
      block_id: '',
      all_ok: true,
      issues: '',
    },
  })
  const [allOk, chosenHostel] = useWatch({ control, name: ['all_ok', 'hostel_id'] })

  const submit = handleSubmit(async (values) => {
    try {
      await add.mutateAsync({
        hostel_id: Number(values.hostel_id),
        block_id: values.block_id ? Number(values.block_id) : null,
        all_ok: values.all_ok,
        issues: values.all_ok ? textOrNull(values.issues) : values.issues,
      })
      alerts.success('Night round recorded')
      onClose()
    } catch (error) {
      applyApiError(error, setError, ['hostel_id', 'block_id', 'all_ok', 'issues'], {
        HOSTEL_NOT_FOUND: 'hostel_id',
        HOSTEL_BLOCK_NOT_FOUND: 'block_id',
      })
    }
  })

  return (
    <AppModal
      open
      onOpenChange={(open) => !open && onClose()}
      title='Log night round'
      description='Recorded with the current time and your name.'
      formId={FORM_ID}
      submitText='Save round'
      loading={add.isPending}
      size='sm'
    >
      <form id={FORM_ID} noValidate onSubmit={submit} className='grid gap-4'>
        <FormAlert message={errors.root?.message} />
        <FormField id='round-hostel' label='Hostel' required error={errors.hostel_id?.message}>
          <Controller
            control={control}
            name='hostel_id'
            render={({ field }) => (
              <HostelSelect
                id='round-hostel'
                value={field.value || undefined}
                invalid={Boolean(errors.hostel_id)}
                onChange={(value) => {
                  field.onChange(value ?? '')
                  setValue('block_id', '')
                }}
              />
            )}
          />
        </FormField>
        <FormField
          id='round-block'
          label='Block'
          error={errors.block_id?.message}
          hint='Optional. Leave empty for the whole hostel.'
        >
          <Controller
            control={control}
            name='block_id'
            render={({ field }) => (
              <BlockSelect
                id='round-block'
                hostelId={chosenHostel ? Number(chosenHostel) : undefined}
                allLabel='Whole hostel'
                className='sm:w-full'
                value={field.value || undefined}
                invalid={Boolean(errors.block_id)}
                onChange={(value) => field.onChange(value ?? '')}
              />
            )}
          />
        </FormField>
        <Controller
          control={control}
          name='all_ok'
          render={({ field }) => (
            <SwitchField
              id='round-ok'
              label='All in order'
              description='Turn off if anything needs attention.'
              checked={field.value}
              onCheckedChange={field.onChange}
            />
          )}
        />
        <FormField
          id='round-issues'
          label='What was found'
          required={!allOk}
          error={errors.issues?.message}
          hint={allOk ? 'Optional' : undefined}
        >
          <Textarea
            id='round-issues'
            maxLength={500}
            placeholder='Room A-104 lights on after 23:00'
            aria-invalid={Boolean(errors.issues)}
            {...register('issues')}
          />
        </FormField>
      </form>
    </AppModal>
  )
}
