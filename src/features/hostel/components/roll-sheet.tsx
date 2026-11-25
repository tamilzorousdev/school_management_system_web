import { useState } from 'react'
import { BellRing, CheckCheck, CircleOff, Flag, ListChecks, PartyPopper, Save } from 'lucide-react'
import { AppModal } from '@/components/common/app-modal'
import { DataTable, type Column } from '@/components/common/data-table'
import { SegmentedControl } from '@/components/common/segmented-control'
import { Badge, type BadgeTone } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { alerts } from '@/lib/alerts'
import { toApiError } from '@/lib/api/errors'
import { formatDateTime } from '@/lib/format'
import { cn } from '@/lib/utils'
import {
  hostelApi,
  useHostelMutation,
  useRollSheet,
  type RollCounts,
  type RollEntry,
  type RollFinishInput,
  type RollMarkInput,
  type RollSlot,
  type RollStatus,
} from '../api'
import { ROLL_SLOT, ROLL_STATUS } from '../labels'
import { InfoNote, StudentCell } from './leave-form-parts'

const QUICK: RollStatus[] = ['present', 'absent', 'late', 'sick']
const AWAY: RollStatus[] = ['on_leave', 'outing']

const activeTone: Record<BadgeTone, string> = {
  success: 'border-success/50 bg-success/15 text-success',
  danger: 'border-destructive/50 bg-destructive/15 text-destructive',
  warning: 'border-warning/50 bg-warning/15 text-warning',
  info: 'border-info/50 bg-info/15 text-info',
  neutral: 'border-border bg-muted text-foreground',
}

const COUNT_KEYS: { key: keyof RollCounts; label: string; tone: BadgeTone }[] = [
  { key: 'present', label: 'Present', tone: 'success' },
  { key: 'absent', label: 'Absent', tone: 'danger' },
  { key: 'late', label: 'Late', tone: 'warning' },
  { key: 'on_leave', label: 'On leave', tone: 'info' },
  { key: 'outing', label: 'Outing', tone: 'info' },
  { key: 'sick', label: 'Sick', tone: 'warning' },
  { key: 'unmarked', label: 'Not marked', tone: 'neutral' },
]

interface RollSheetViewProps {
  hostelId: number
  slot: RollSlot
  date: string
  blockId?: number
  blockName?: string
  unmarked?: boolean
  canMark: boolean
  lockedReason?: string
}

export function RollSheetView({
  hostelId,
  slot,
  date,
  blockId,
  blockName,
  unmarked,
  canMark,
  lockedReason,
}: RollSheetViewProps) {
  const sheet = useRollSheet({ hostel_id: hostelId, slot, date, block_id: blockId, unmarked })
  const [pending, setPending] = useState<Record<number, RollStatus>>({})
  const [finishing, setFinishing] = useState(false)
  const mark = useHostelMutation((entries: RollMarkInput['entries']) =>
    hostelApi.markRoll({ hostel_id: hostelId, slot, date, entries })
  )
  const finish = useHostelMutation((input: RollFinishInput) => hostelApi.finishRoll(input))

  const data = sheet.data
  const students = data?.students ?? []
  const holiday = data?.holiday_mode ?? false
  const editable = canMark && !holiday && !lockedReason

  const nextFor = (entry: RollEntry) =>
    pending[entry.admission_id] ??
    (entry.status ? undefined : (entry.suggested_status ?? undefined))
  const shownFor = (entry: RollEntry) => nextFor(entry) ?? entry.status ?? null
  const changes = students.flatMap((entry) => {
    const next = nextFor(entry)
    return next && next !== entry.status ? [{ admission_id: entry.admission_id, status: next }] : []
  })
  const blankCount = students.filter(
    (entry) => !entry.status && !entry.suggested_status && !pending[entry.admission_id]
  ).length

  const setMark = (entry: RollEntry, status: RollStatus) =>
    setPending((prev) => ({ ...prev, [entry.admission_id]: status }))

  const fillPresent = () =>
    setPending((prev) => {
      const next = { ...prev }
      students.forEach((entry) => {
        if (!entry.status && !entry.suggested_status && !next[entry.admission_id]) {
          next[entry.admission_id] = 'present'
        }
      })
      return next
    })

  const save = async () => {
    try {
      await mark.mutateAsync(changes)
      alerts.success(`${changes.length} ${changes.length === 1 ? 'mark' : 'marks'} saved`)
      setPending({})
    } catch (error) {
      alerts.error(toApiError(error).message)
    }
  }

  const finishRoll = async (unmarkedAs: 'present' | 'absent') => {
    try {
      if (changes.length) await mark.mutateAsync(changes)
      await finish.mutateAsync({
        hostel_id: hostelId,
        slot,
        date,
        unmarked_as: unmarkedAs,
        block_id: blockId,
      })
      setPending({})
      setFinishing(false)
      alerts.success(`${ROLL_SLOT[slot]} roll call finished`)
    } catch (error) {
      alerts.error(toApiError(error).message)
    }
  }

  const optionsFor = (entry: RollEntry) => {
    const away = AWAY.filter(
      (status) => status === entry.suggested_status || status === entry.status
    )
    return [...QUICK, ...away]
  }

  const columns: Column<RollEntry>[] = [
    {
      key: 'student',
      header: 'Student',
      cell: (row) => <StudentCell student={row.student} />,
    },
    {
      key: 'room',
      header: 'Room / bed',
      cell: (row) => <RoomText entry={row} />,
    },
    {
      key: 'status',
      header: 'Status',
      hideBelow: 'lg',
      cell: (row) => <StatusCell entry={row} pending={pending[row.admission_id]} />,
    },
    {
      key: 'mark',
      header: 'Mark',
      cell: (row) => (
        <MarkButtons
          name={row.student.name}
          value={shownFor(row)}
          options={optionsFor(row)}
          disabled={!editable}
          onChange={(status) => setMark(row, status)}
        />
      ),
    },
  ]

  return (
    <div className='grid gap-4'>
      {holiday && (
        <InfoNote tone='warning' icon={PartyPopper}>
          Holiday mode is on, so roll call is paused. Turn it off in hostel settings to mark again.
        </InfoNote>
      )}
      {lockedReason && !holiday && <InfoNote tone='warning'>{lockedReason}</InfoNote>}

      <div className='flex flex-wrap items-center gap-2'>
        {COUNT_KEYS.map((item) => (
          <Badge key={item.key} tone={item.tone} className='px-2.5 py-1'>
            {item.label}
            <span className='tabular font-extrabold'>{data?.counts[item.key] ?? 0}</span>
          </Badge>
        ))}
        <span className='tabular text-xs text-muted-foreground'>
          of {data?.counts.total ?? 0} residents
        </span>
        {data?.finished_at && (
          <Badge tone='success' dot className='ml-auto'>
            Finished {formatDateTime(data.finished_at)}
          </Badge>
        )}
      </div>

      <InfoNote icon={BellRing}>
        Parents of a student marked absent get one alert per roll call (push, then SMS if the push
        does not reach them).
      </InfoNote>

      <Card className='overflow-hidden'>
        <div className='flex flex-wrap items-center gap-2 border-b px-4 py-3'>
          <span className='text-sm font-semibold'>
            {ROLL_SLOT[slot]} roll call{blockName ? ` · ${blockName}` : ''}
          </span>
          {editable && (
            <div className='ml-auto flex flex-wrap gap-2'>
              <Button variant='outline' size='sm' disabled={blankCount === 0} onClick={fillPresent}>
                <CheckCheck />
                Mark all unmarked present
              </Button>
              <Button size='sm' variant='outline' onClick={() => setFinishing(true)}>
                <Flag />
                Finish roll call
              </Button>
            </div>
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
            icon: unmarked ? CircleOff : ListChecks,
            title: unmarked ? 'Everyone is marked' : 'No residents to mark',
            description: unmarked
              ? 'Turn off "Only unmarked" to see the whole list.'
              : 'Residents with a bed in this hostel appear here.',
          }}
          card={(row) => (
            <div className='grid gap-3'>
              <div className='flex items-start justify-between gap-2'>
                <StudentCell student={row.student} />
                <StatusCell entry={row} pending={pending[row.admission_id]} />
              </div>
              <RoomText entry={row} />
              <MarkButtons
                name={row.student.name}
                value={shownFor(row)}
                options={optionsFor(row)}
                disabled={!editable}
                onChange={(status) => setMark(row, status)}
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

      {finishing && (
        <FinishModal
          blankCount={blankCount}
          unsaved={changes.length}
          blockName={blockName}
          loading={mark.isPending || finish.isPending}
          onSubmit={(value) => void finishRoll(value)}
          onClose={() => setFinishing(false)}
        />
      )}
    </div>
  )
}

function RoomText({ entry }: { entry: RollEntry }) {
  return (
    <div className='grid gap-0.5 text-sm'>
      <span className='tabular'>
        {entry.room_no ? `${entry.room_no} / ${entry.bed_no ?? '—'}` : 'No bed'}
      </span>
      {entry.block_name && (
        <span className='text-xs text-muted-foreground'>{entry.block_name}</span>
      )}
    </div>
  )
}

function StatusCell({ entry, pending }: { entry: RollEntry; pending?: RollStatus }) {
  return (
    <div className='flex flex-wrap items-center gap-1'>
      {entry.status ? (
        <Badge tone={ROLL_STATUS[entry.status].tone} dot>
          {ROLL_STATUS[entry.status].label}
        </Badge>
      ) : (
        <Badge tone='neutral'>Not marked</Badge>
      )}
      {!entry.status && entry.suggested_status && (
        <span className='text-xs text-muted-foreground'>
          Out on a pass: {ROLL_STATUS[entry.suggested_status].label.toLowerCase()}
        </span>
      )}
      {pending && pending !== entry.status && <Badge tone='warning'>Not saved</Badge>}
    </div>
  )
}

function MarkButtons({
  name,
  value,
  options,
  disabled,
  onChange,
}: {
  name: string
  value: RollStatus | null
  options: RollStatus[]
  disabled: boolean
  onChange: (status: RollStatus) => void
}) {
  return (
    <div role='radiogroup' aria-label={`Mark ${name}`} className='flex flex-wrap gap-1'>
      {options.map((status) => {
        const active = value === status
        return (
          <button
            key={status}
            type='button'
            role='radio'
            aria-checked={active}
            disabled={disabled}
            onClick={() => onChange(status)}
            className={cn(
              'h-8 rounded-md border px-2.5 text-xs font-semibold transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40 disabled:cursor-not-allowed disabled:opacity-60',
              active
                ? activeTone[ROLL_STATUS[status].tone]
                : 'bg-card text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            {ROLL_STATUS[status].label}
          </button>
        )
      })}
    </div>
  )
}

function FinishModal({
  blankCount,
  unsaved,
  blockName,
  loading,
  onSubmit,
  onClose,
}: {
  blankCount: number
  unsaved: number
  blockName?: string
  loading: boolean
  onSubmit: (value: 'present' | 'absent') => void
  onClose: () => void
}) {
  const formId = 'roll-finish-form'
  const [value, setValue] = useState<'present' | 'absent'>('present')
  return (
    <AppModal
      open
      onOpenChange={(open) => !open && onClose()}
      title='Finish roll call'
      description={
        blockName
          ? `Closes the roll call for ${blockName} only.`
          : 'Closes the roll call for the whole hostel.'
      }
      formId={formId}
      submitText='Finish'
      loading={loading}
      size='sm'
    >
      <form
        id={formId}
        noValidate
        className='grid gap-4'
        onSubmit={(event) => {
          event.preventDefault()
          onSubmit(value)
        }}
      >
        <div className='grid gap-2'>
          <span className='text-xs font-semibold'>Mark everyone still unmarked as</span>
          <SegmentedControl
            label='Mark unmarked students as'
            value={value}
            onChange={setValue}
            options={[
              { value: 'present', label: 'Present' },
              { value: 'absent', label: 'Absent' },
            ]}
          />
          <p className='text-xs text-muted-foreground'>
            {blankCount} {blankCount === 1 ? 'student is' : 'students are'} not marked on this
            screen.
          </p>
        </div>
        <InfoNote>
          Students out on an approved pass stay marked as on leave or outing, whatever you pick.
          {value === 'absent' && ' Parents of students marked absent get an alert.'}
        </InfoNote>
        {unsaved > 0 && (
          <InfoNote tone='warning'>
            Your {unsaved} unsaved {unsaved === 1 ? 'mark is' : 'marks are'} saved first.
          </InfoNote>
        )}
      </form>
    </AppModal>
  )
}
