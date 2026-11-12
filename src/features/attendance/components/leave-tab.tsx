import { useState } from 'react'
import { Check, CircleOff, Inbox, X } from 'lucide-react'
import { AppModal } from '@/components/common/app-modal'
import { DataTable, type Column } from '@/components/common/data-table'
import { FormField } from '@/components/common/form-field'
import { FilterSelect, ListToolbar, SearchBox } from '@/components/common/list-toolbar'
import { useShortcut } from '@/components/shortcuts/shortcut-context'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Textarea } from '@/components/ui/input'
import { alerts } from '@/lib/alerts'
import { toApiError } from '@/lib/api/errors'
import { formatDate } from '@/lib/format'
import { fieldErrorsOf } from '@/features/setup/form-actions'
import {
  attendanceApi,
  useAttendanceMutation,
  useLeaveBalances,
  useStaffLeaves,
  type DecisionInput,
  type StaffLeave,
  type StaffLeaveStatus,
  type StudentLeave,
} from '../api'
import { STAFF_LEAVE_STATUS } from '../labels'
import type { AttendanceSearch, LeaveKind } from '../search'

const LIMIT = 20

interface Rejecting {
  kind: LeaveKind
  id: number
  name: string
  userId?: number
  summary: string
}

const range = (from: string, to: string) =>
  from === to ? formatDate(from) : `${formatDate(from)} to ${formatDate(to)}`

const daysText = (days: number, halfDay: boolean | 'morning' | 'afternoon' | null = false) =>
  halfDay === 'morning'
    ? 'Half day · morning'
    : halfDay === 'afternoon'
      ? 'Half day · afternoon'
      : halfDay
        ? 'Half day'
        : `${days} ${days === 1 ? 'day' : 'days'}`

const optionsOf = <T extends string>(labels: Record<T, { label: string }>) =>
  (Object.keys(labels) as T[]).map((value) => ({ value, label: labels[value].label }))

const DEFAULT_STATUS: Record<LeaveKind, string> = { student: 'pending', staff: 'waiting' }

const STAFF_STATUS_OPTIONS = [
  { value: 'waiting', label: 'Waiting (HOD or principal)' },
  ...optionsOf(STAFF_LEAVE_STATUS),
]

const statusOf = (search: AttendanceSearch, kind: LeaveKind) =>
  search.status ?? DEFAULT_STATUS[kind]

export function LeaveTab({
  search,
  canDecideStaff,
  onSearchChange,
}: {
  search: AttendanceSearch
  canDecideStaff: boolean
  onSearchChange: (patch: Partial<AttendanceSearch>) => void
}) {
  const [rejecting, setRejecting] = useState<Rejecting | null>(null)
  const filtered = Boolean(search.search) || statusOf(search, 'staff') !== DEFAULT_STATUS.staff

  return (
    <div className='grid gap-4'>
      <p className='text-sm text-muted-foreground'>
        Staff leave waiting for a decision. Student leave from parents is approved by the class
        teacher in the Staff app.
      </p>
      <Card className='overflow-hidden'>
        <StaffLeaves
          search={search}
          filtered={filtered}
          canDecide={canDecideStaff}
          onSearchChange={onSearchChange}
          onReject={setRejecting}
        />
      </Card>
      {rejecting && <RejectModal target={rejecting} onClose={() => setRejecting(null)} />}
    </div>
  )
}

interface ListProps {
  search: AttendanceSearch
  filtered: boolean
  canDecide: boolean
  onSearchChange: (patch: Partial<AttendanceSearch>) => void
  onReject: (target: Rejecting) => void
}

function useApprove(kind: LeaveKind) {
  return useAttendanceMutation(
    ({ id, input }: { id: number; input: DecisionInput }): Promise<StudentLeave | StaffLeave> =>
      kind === 'student'
        ? attendanceApi.decideStudentLeave(id, input)
        : attendanceApi.decideStaffLeave(id, input)
  )
}

function DecisionButtons({
  name,
  loading,
  onApprove,
  onReject,
}: {
  name: string
  loading: boolean
  onApprove: () => void
  onReject: () => void
}) {
  return (
    <span className='flex flex-wrap gap-1.5'>
      <Button
        size='sm'
        aria-label={`Approve leave for ${name}`}
        loading={loading}
        onClick={(event) => {
          event.stopPropagation()
          onApprove()
        }}
      >
        <Check />
        Approve
      </Button>
      <Button
        size='sm'
        variant='outline'
        aria-label={`Reject leave for ${name}`}
        disabled={loading}
        className='text-destructive hover:bg-destructive/10'
        onClick={(event) => {
          event.stopPropagation()
          onReject()
        }}
      >
        <X />
        Reject
      </Button>
    </span>
  )
}

function Toolbar({
  search,
  status,
  filtered,
  total,
  statusOptions,
  placeholder,
  onSearchChange,
}: {
  search: AttendanceSearch
  status: string
  filtered: boolean
  total?: number
  statusOptions: { value: string; label: string }[]
  placeholder: string
  onSearchChange: (patch: Partial<AttendanceSearch>) => void
}) {
  return (
    <ListToolbar
      summary={total !== undefined ? `${total} ${total === 1 ? 'request' : 'requests'}` : ''}
      onClear={
        filtered ? () => onSearchChange({ search: undefined, status: undefined }) : undefined
      }
    >
      <SearchBox
        value={search.search ?? ''}
        onChange={(value) => onSearchChange({ search: value || undefined })}
        placeholder={placeholder}
        label='Search leave requests'
      />
      <FilterSelect
        id='leave-status-filter'
        label='Filter by status'
        allLabel='Any status'
        value={status === 'all' ? undefined : status}
        options={statusOptions}
        onChange={(value) =>
          onSearchChange({ status: (value ?? 'all') as AttendanceSearch['status'] })
        }
      />
    </ListToolbar>
  )
}

function StaffLeaves({ search, filtered, canDecide, onSearchChange, onReject }: ListProps) {
  const status = statusOf(search, 'staff')
  const leaves = useStaffLeaves({
    page: search.page,
    limit: LIMIT,
    search: search.search,
    status:
      status === 'waiting'
        ? 'waiting'
        : status in STAFF_LEAVE_STATUS
          ? (status as StaffLeaveStatus)
          : undefined,
  })
  const approve = useApprove('staff')
  const [busy, setBusy] = useState<number | null>(null)

  useShortcut('app.refresh', () => void leaves.refetch())

  const pending = (leave: StaffLeave) =>
    leave.status === 'pending_hod' || leave.status === 'pending_principal'

  const approveLeave = async (leave: StaffLeave) => {
    setBusy(leave.id)
    try {
      await approve.mutateAsync({ id: leave.id, input: { status: 'approved' } })
      alerts.success(`Leave approved for ${leave.staff.name}`)
    } catch (error) {
      alerts.error(toApiError(error).message)
    } finally {
      setBusy(null)
    }
  }

  const actions = (leave: StaffLeave) =>
    canDecide && pending(leave) ? (
      <DecisionButtons
        name={leave.staff.name}
        loading={busy === leave.id}
        onApprove={() => void approveLeave(leave)}
        onReject={() =>
          onReject({
            kind: 'staff',
            id: leave.id,
            name: leave.staff.name,
            userId: leave.staff.id,
            summary: `${leave.leave_type.name} · ${range(leave.from_date, leave.to_date)} · ${leave.reason}`,
          })
        }
      />
    ) : null

  const stage = (leave: StaffLeave) => (
    <span className='grid gap-0.5'>
      <Badge tone={STAFF_LEAVE_STATUS[leave.status].tone} className='justify-self-start'>
        {STAFF_LEAVE_STATUS[leave.status].label}
      </Badge>
      {leave.status === 'pending_hod' && leave.hod && (
        <span className='text-xs text-muted-foreground'>{leave.hod.name}</span>
      )}
      {leave.principal && leave.status !== 'pending_principal' && (
        <span className='text-xs text-muted-foreground'>by {leave.principal.name}</span>
      )}
      {(leave.principal_note ?? leave.hod_note) && (
        <span className='max-w-56 truncate text-xs text-muted-foreground'>
          Note: {leave.principal_note ?? leave.hod_note}
        </span>
      )}
    </span>
  )

  const columns: Column<StaffLeave>[] = [
    {
      key: 'staff',
      header: 'Staff',
      cell: (leave) => (
        <div className='grid min-w-0'>
          <span className='truncate font-bold'>{leave.staff.name}</span>
          <span className='text-xs text-muted-foreground'>{leave.department ?? '—'}</span>
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Leave type',
      cell: (leave) => (
        <span className='flex items-center gap-1.5'>
          <Badge tone='info'>{leave.leave_type.code}</Badge>
          <span className='text-sm'>{leave.leave_type.name}</span>
        </span>
      ),
    },
    {
      key: 'dates',
      header: 'Dates',
      cell: (leave) => (
        <div className='grid'>
          <span className='text-sm'>{range(leave.from_date, leave.to_date)}</span>
          <span className='text-xs text-muted-foreground'>
            {daysText(leave.days, leave.half_day)}
          </span>
        </div>
      ),
    },
    {
      key: 'reason',
      header: 'Reason',
      hideBelow: 'xl',
      cell: (leave) => <span className='line-clamp-2 max-w-64 text-sm'>{leave.reason}</span>,
    },
    { key: 'stage', header: 'Stage', cell: stage },
    ...(canDecide ? [{ key: 'actions', header: '', align: 'right' as const, cell: actions }] : []),
  ]

  return (
    <>
      <Toolbar
        search={search}
        status={status}
        filtered={filtered}
        total={leaves.data?.total}
        statusOptions={STAFF_STATUS_OPTIONS}
        placeholder='Staff name or reason'
        onSearchChange={onSearchChange}
      />
      <DataTable
        rows={leaves.data?.items ?? []}
        columns={columns}
        rowKey={(leave) => leave.id}
        loading={leaves.isFetching}
        error={leaves.isError ? leaves.error.message : null}
        onRetry={() => leaves.refetch()}
        empty={{
          icon: filtered ? CircleOff : Inbox,
          title: filtered
            ? 'No leave requests match these filters'
            : 'Nothing waiting for a decision',
          description: filtered
            ? 'Try another name, or clear the filters.'
            : 'Choose Any status to see approved, rejected and cancelled requests.',
        }}
        card={(leave) => (
          <div className='grid gap-1.5'>
            <div className='flex items-start justify-between gap-2'>
              <span className='grid min-w-0'>
                <span className='truncate font-bold'>{leave.staff.name}</span>
                <span className='text-xs text-muted-foreground'>
                  {leave.leave_type.name} · {range(leave.from_date, leave.to_date)} ·{' '}
                  {daysText(leave.days, leave.half_day)}
                </span>
              </span>
              <Badge tone={STAFF_LEAVE_STATUS[leave.status].tone}>
                {STAFF_LEAVE_STATUS[leave.status].label}
              </Badge>
            </div>
            <span className='text-sm'>{leave.reason}</span>
            {actions(leave)}
          </div>
        )}
        pagination={{
          page: search.page,
          limit: LIMIT,
          total: leaves.data?.total ?? 0,
          label: 'requests',
          onPageChange: (page) => onSearchChange({ page }),
        }}
      />
    </>
  )
}

function RejectModal({ target, onClose }: { target: Rejecting; onClose: () => void }) {
  const [note, setNote] = useState('')
  const [error, setError] = useState<string>()
  const balances = useLeaveBalances(target.kind === 'staff' ? (target.userId ?? null) : null)
  const reject = useApprove(target.kind)

  return (
    <AppModal
      open
      onOpenChange={(open) => !open && onClose()}
      title={`Reject leave for ${target.name}`}
      description={target.summary}
      formId='reject-leave-form'
      submitText='Reject'
      loading={reject.isPending}
    >
      <form
        id='reject-leave-form'
        noValidate
        className='grid gap-4'
        onSubmit={async (event) => {
          event.preventDefault()
          if (note.trim().length < 3) {
            setError('Give a reason for rejecting')
            return
          }
          setError(undefined)
          try {
            await reject.mutateAsync({
              id: target.id,
              input: { status: 'rejected', note: note.trim() },
            })
            alerts.success(`Leave rejected for ${target.name}`)
            onClose()
          } catch (failure) {
            const fields = fieldErrorsOf(failure)
            if (fields.note) setError(fields.note)
            else alerts.error(fields.root ?? toApiError(failure).message)
          }
        }}
      >
        {balances.data && balances.data.length > 0 && (
          <div className='flex flex-wrap gap-1.5'>
            {balances.data.map((balance) => (
              <Badge key={balance.leave_type.id} tone='neutral'>
                {balance.leave_type.code}{' '}
                {balance.remaining === null
                  ? `${balance.used} used`
                  : `${balance.remaining} of ${balance.allowed} left`}
              </Badge>
            ))}
          </div>
        )}
        <FormField id='reject-note' label='Reason for rejecting' required error={error}>
          <Textarea
            id='reject-note'
            autoFocus
            maxLength={255}
            placeholder='Exams that week, please choose other dates'
            value={note}
            aria-invalid={Boolean(error) || undefined}
            onChange={(event) => setNote(event.target.value)}
          />
        </FormField>
      </form>
    </AppModal>
  )
}
