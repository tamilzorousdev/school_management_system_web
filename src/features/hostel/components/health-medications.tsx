import { useState } from 'react'
import { Ban, Check, CircleOff, Clock, Pill, Plus, Square, X } from 'lucide-react'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import { DataTable, type Column } from '@/components/common/data-table'
import { EmptyState, ErrorState } from '@/components/common/display'
import { ListToolbar, SearchBox } from '@/components/common/list-toolbar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { alerts } from '@/lib/alerts'
import { toApiError } from '@/lib/api/errors'
import { formatDate, formatDateTime } from '@/lib/format'
import { useHostelMutation } from '../api'
import {
  careApi,
  useMedications,
  useMedicationsDue,
  type DoseStatus,
  type Medication,
  type MedicationDue,
} from '../api-care'
import { DOSE_BACK_DAYS, DOSE_STATUS } from './health-helpers'
import { MedicationModal } from './health-medication-modal'
import { InfoNote, NoteModal, StudentCell, ToggleFilter } from './leave-form-parts'
import { shiftDate, timeLabel } from './leave-helpers'

const LIMIT = 20

type DoseTarget = { row: MedicationDue; status: DoseStatus }

const doseKey = (row: MedicationDue) => `${row.medication_id}-${row.dose_time}`

export function MedicationsDueBoard({
  hostelId,
  date,
  today,
  canEdit,
}: {
  hostelId?: number
  date: string
  today: string
  canEdit: boolean
}) {
  const due = useMedicationsDue({ hostel_id: hostelId, date })
  const [noting, setNoting] = useState<DoseTarget | null>(null)
  const record = useHostelMutation(
    (input: { row: MedicationDue; status: DoseStatus; note?: string | null }) =>
      careApi.recordDose(input.row.medication_id, {
        dose_date: input.row.dose_date,
        dose_time: input.row.dose_time,
        status: input.status,
        note: input.note ?? null,
      })
  )
  const lockedReason =
    date > today
      ? 'Doses can be recorded once the day comes.'
      : date < shiftDate(today, -DOSE_BACK_DAYS)
        ? `Doses can be recorded for today and the last ${DOSE_BACK_DAYS} days only.`
        : undefined
  const editable = canEdit && !lockedReason
  const rows = due.data ?? []
  const groups = [...new Set(rows.map((row) => row.dose_time))]
    .sort()
    .map((time) => ({ time, rows: rows.filter((row) => row.dose_time === time) }))
  const pendingCount = rows.filter((row) => row.status === 'pending').length
  const overdueCount = rows.filter((row) => row.overdue).length

  const give = async (row: MedicationDue) => {
    try {
      await record.mutateAsync({ row, status: 'given' })
      alerts.success('Dose recorded as given', {
        description: `${row.student.name} · ${row.medicine} · ${timeLabel(row.dose_time)}`,
      })
    } catch (error) {
      alerts.error(toApiError(error).message)
    }
  }

  const busyKey = record.isPending && record.variables ? doseKey(record.variables.row) : null

  return (
    <Card className='overflow-hidden'>
      <div className='flex flex-wrap items-center gap-2 border-b px-4 py-3'>
        <div className='grid gap-0.5'>
          <h2 className='text-sm font-bold'>Doses for {formatDate(date)}</h2>
          <p className='text-xs text-muted-foreground'>
            Recording again replaces the earlier entry for that dose.
          </p>
        </div>
        <div className='ml-auto flex flex-wrap gap-1.5'>
          <Badge tone='neutral' className='px-2.5 py-1'>
            Due <span className='tabular font-extrabold'>{pendingCount}</span>
          </Badge>
          {overdueCount > 0 && (
            <Badge tone='danger' className='px-2.5 py-1'>
              Overdue <span className='tabular font-extrabold'>{overdueCount}</span>
            </Badge>
          )}
        </div>
      </div>
      {lockedReason && (
        <div className='border-b px-4 py-3'>
          <InfoNote tone='warning'>{lockedReason}</InfoNote>
        </div>
      )}
      {due.isError && !due.data ? (
        <ErrorState message={due.error.message} onRetry={() => due.refetch()} />
      ) : !due.data ? (
        <div className='grid gap-2 p-4'>
          <Skeleton className='h-16' />
          <Skeleton className='h-16' />
        </div>
      ) : groups.length === 0 ? (
        <EmptyState
          icon={Pill}
          title='No doses on this date'
          description='Running medication courses show their doses here.'
        />
      ) : (
        <div className='divide-y'>
          {groups.map((group) => (
            <section key={group.time} className='grid gap-2 px-4 py-3'>
              <h3 className='flex items-center gap-1.5 text-sm font-bold'>
                <Clock className='size-4 text-primary' />
                {timeLabel(group.time)}
              </h3>
              <ul className='grid gap-2'>
                {group.rows.map((row) => {
                  const status = DOSE_STATUS[row.status]
                  const busy = busyKey === doseKey(row)
                  return (
                    <li
                      key={doseKey(row)}
                      className='grid gap-2 rounded-lg border bg-card p-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-center'
                    >
                      <div className='grid min-w-0 gap-1'>
                        <StudentCell student={row.student} extra={row.bed ?? undefined} />
                        <span className='text-sm'>
                          <span className='font-semibold'>{row.medicine}</span> · {row.dose}
                          {row.instructions ? (
                            <span className='text-muted-foreground'> · {row.instructions}</span>
                          ) : null}
                        </span>
                        <div className='flex flex-wrap items-center gap-1.5'>
                          <Badge tone={row.overdue ? 'danger' : status.tone} dot>
                            {row.overdue ? 'Overdue' : status.label}
                          </Badge>
                          {row.given_by_name && (
                            <span className='text-xs text-muted-foreground'>
                              {row.given_by_name} · {formatDateTime(row.given_at)}
                            </span>
                          )}
                          {row.note && (
                            <span className='text-xs text-muted-foreground italic'>{row.note}</span>
                          )}
                        </div>
                      </div>
                      {editable && (
                        <div className='flex flex-wrap gap-1.5'>
                          <Button
                            size='sm'
                            variant={row.status === 'given' ? 'outline' : 'default'}
                            loading={busy}
                            disabled={record.isPending}
                            onClick={() => void give(row)}
                          >
                            <Check />
                            Given
                          </Button>
                          <Button
                            size='sm'
                            variant='outline'
                            disabled={record.isPending}
                            onClick={() => setNoting({ row, status: 'missed' })}
                          >
                            <X />
                            Missed
                          </Button>
                          <Button
                            size='sm'
                            variant='outline'
                            disabled={record.isPending}
                            onClick={() => setNoting({ row, status: 'refused' })}
                          >
                            <Ban />
                            Refused
                          </Button>
                        </div>
                      )}
                    </li>
                  )
                })}
              </ul>
            </section>
          ))}
        </div>
      )}

      {noting && (
        <NoteModal
          title={noting.status === 'missed' ? 'Dose missed' : 'Dose refused'}
          description={`${noting.row.student.name} · ${noting.row.medicine} at ${timeLabel(noting.row.dose_time)}`}
          label='Note'
          maxLength={255}
          submitText={noting.status === 'missed' ? 'Record missed' : 'Record refused'}
          onClose={() => setNoting(null)}
          onSubmit={async (note) => {
            await record.mutateAsync({ row: noting.row, status: noting.status, note })
            alerts.success(`Dose recorded as ${noting.status}`, {
              description: noting.row.student.name,
            })
          }}
        />
      )}
    </Card>
  )
}

export function MedicationsList({
  hostelId,
  search,
  page,
  canEdit,
  adding,
  onAddingChange,
  onSearchChange,
  onPageChange,
}: {
  hostelId?: number
  search?: string
  page: number
  canEdit: boolean
  adding: boolean
  onAddingChange: (adding: boolean) => void
  onSearchChange: (search?: string) => void
  onPageChange: (page: number) => void
}) {
  const [all, setAll] = useState(false)
  const [stopping, setStopping] = useState<Medication | null>(null)
  const medications = useMedications({
    page,
    limit: LIMIT,
    hostel_id: hostelId,
    search,
    active: all ? undefined : true,
  })
  const stop = useHostelMutation(careApi.stopMedication)
  const filtered = Boolean(search || all)

  const confirmStop = async () => {
    if (!stopping) return
    try {
      await stop.mutateAsync(stopping.id)
      alerts.success('Medication stopped', {
        description: `${stopping.student.name} · ${stopping.medicine}`,
      })
      setStopping(null)
    } catch (error) {
      alerts.error(toApiError(error).message)
    }
  }

  const stopButton = (row: Medication) =>
    canEdit && row.active ? (
      <Button variant='ghost' size='sm' onClick={() => setStopping(row)}>
        <Square />
        Stop
      </Button>
    ) : null

  const columns: Column<Medication>[] = [
    {
      key: 'student',
      header: 'Student',
      cell: (row) => <StudentCell student={row.student} extra={row.bed ?? row.hostel_name} />,
    },
    {
      key: 'medicine',
      header: 'Medicine',
      cell: (row) => (
        <div className='grid min-w-0 gap-0.5'>
          <span className='truncate font-semibold'>{row.medicine}</span>
          <span className='truncate text-xs text-muted-foreground'>
            {row.dose}
            {row.instructions ? ` · ${row.instructions}` : ''}
          </span>
        </div>
      ),
    },
    { key: 'times', header: 'Times', cell: (row) => <TimeChips times={row.times} /> },
    {
      key: 'dates',
      header: 'Course',
      hideBelow: 'lg',
      cell: (row) => (
        <span className='text-sm whitespace-nowrap'>
          {formatDate(row.from_date)} – {row.to_date ? formatDate(row.to_date) : 'ongoing'}
        </span>
      ),
    },
    {
      key: 'prescribed',
      header: 'Prescribed by',
      hideBelow: 'xl',
      cell: (row) => <span className='text-sm'>{row.prescribed_by ?? '—'}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      cell: (row) => (
        <Badge tone={row.active ? 'success' : 'neutral'} dot>
          {row.active ? 'Running' : 'Stopped'}
        </Badge>
      ),
    },
    { key: 'actions', header: '', align: 'right', cell: stopButton },
  ]

  return (
    <Card className='overflow-hidden'>
      <ListToolbar
        summary={medications.data ? `${medications.data.total} courses` : ''}
        onClear={
          filtered
            ? () => {
                setAll(false)
                onSearchChange(undefined)
              }
            : undefined
        }
      >
        <SearchBox
          value={search ?? ''}
          onChange={(value) => onSearchChange(value || undefined)}
          placeholder='Search student or medicine'
          label='Search medications'
        />
        <ToggleFilter
          id='medications-all'
          label='Include stopped and finished'
          checked={all}
          onChange={(checked) => {
            setAll(Boolean(checked))
            onPageChange(1)
          }}
        />
        {canEdit && (
          <Button size='sm' variant='outline' onClick={() => onAddingChange(true)}>
            <Plus />
            Add medication
          </Button>
        )}
      </ListToolbar>
      <DataTable
        rows={medications.data?.items ?? []}
        columns={columns}
        rowKey={(row) => row.id}
        loading={medications.isFetching}
        error={medications.isError ? medications.error.message : null}
        onRetry={() => medications.refetch()}
        empty={{
          icon: filtered ? CircleOff : Pill,
          title: filtered ? 'No courses match these filters' : 'No medication running',
          description: filtered
            ? 'Try another search or clear the filters.'
            : 'Add a course to see its doses on the board above.',
          action:
            canEdit && !filtered ? (
              <Button onClick={() => onAddingChange(true)}>
                <Plus />
                Add medication
              </Button>
            ) : undefined,
        }}
        card={(row) => (
          <div className='grid gap-2'>
            <div className='flex items-start justify-between gap-2'>
              <StudentCell student={row.student} extra={row.bed ?? row.hostel_name} />
              <Badge tone={row.active ? 'success' : 'neutral'} dot className='shrink-0'>
                {row.active ? 'Running' : 'Stopped'}
              </Badge>
            </div>
            <span className='text-sm'>
              <span className='font-semibold'>{row.medicine}</span> · {row.dose}
            </span>
            <TimeChips times={row.times} />
            <span className='text-xs text-muted-foreground'>
              {formatDate(row.from_date)} – {row.to_date ? formatDate(row.to_date) : 'ongoing'}
              {row.instructions ? ` · ${row.instructions}` : ''}
            </span>
            {stopButton(row) && <div className='justify-self-start'>{stopButton(row)}</div>}
          </div>
        )}
        pagination={{
          page,
          limit: LIMIT,
          total: medications.data?.total ?? 0,
          label: 'courses',
          onPageChange,
        }}
      />

      {adding && (
        <MedicationModal defaultHostelId={hostelId} onClose={() => onAddingChange(false)} />
      )}
      <ConfirmDialog
        open={Boolean(stopping)}
        onOpenChange={(open) => !open && setStopping(null)}
        title='Stop this medication?'
        description={
          stopping
            ? `${stopping.student.name} stops getting ${stopping.medicine}. Its doses leave the board.`
            : ''
        }
        confirmText='Stop medication'
        destructive
        loading={stop.isPending}
        onConfirm={() => void confirmStop()}
      />
    </Card>
  )
}

function TimeChips({ times }: { times: string[] }) {
  return (
    <div className='flex flex-wrap gap-1'>
      {times.map((time) => (
        <Badge key={time} tone='info'>
          {timeLabel(time)}
        </Badge>
      ))}
    </div>
  )
}
