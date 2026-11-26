import { useState } from 'react'
import { Check, CircleOff, Inbox, X } from 'lucide-react'
import { AppModal } from '@/components/common/app-modal'
import { DataTable, type Column } from '@/components/common/data-table'
import { FormField } from '@/components/common/form-field'
import { FilterSelect, ListToolbar, SearchBox } from '@/components/common/list-toolbar'
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
  useStudentLeaves,
  type DecisionInput,
  type StaffLeave,
  type StaffLeaveStatus,
  type StudentLeave,
  type StudentLeaveStatus,
} from '../api'
import { STAFF_LEAVE_STATUS, STUDENT_LEAVE_STATUS } from '../labels'
import type { AttendanceSearch, LeaveKind } from '../search'
import { BulkActionBar } from './bulk-action-bar'
import { TableCheckbox, StatusPill } from './students-tab'

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

const STUDENT_STATUS_OPTIONS = [
  { value: 'pending', label: 'Waiting for approval' },
  ...optionsOf(STUDENT_LEAVE_STATUS),
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
  const kind: LeaveKind = search.leave === 'student' ? 'student' : 'staff'
  const filtered = Boolean(search.search) || statusOf(search, kind) !== DEFAULT_STATUS[kind]

  return (
    <div className='grid gap-4'>
      <div className='flex flex-wrap items-center justify-between gap-3'>
        <p className='text-xs text-muted-foreground'>
          Student leave from parents is approved by the class teacher in the Staff app. Staff leave
          requests are decided here by the HOD or Principal.
        </p>
      </div>

      <Card className='overflow-hidden'>
        {kind === 'staff' ? (
          <StaffLeaves
            search={search}
            filtered={filtered}
            canDecide={canDecideStaff}
            onSearchChange={onSearchChange}
            onReject={setRejecting}
          />
        ) : (
          <StudentLeaves
            search={search}
            filtered={filtered}
            canDecide={canDecideStaff}
            onSearchChange={onSearchChange}
            onReject={setRejecting}
          />
        )}
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
        compact
        showShortcut={false}
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
  const [selected, setSelected] = useState<Set<number>>(new Set())

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
      <StatusPill
        label={STAFF_LEAVE_STATUS[leave.status].label}
        tone={STAFF_LEAVE_STATUS[leave.status].tone}
      />
      {leave.status === 'pending_hod' && leave.hod && (
        <span className='text-[11.5px] text-slate-500'>{leave.hod.name}</span>
      )}
      {leave.principal && leave.status !== 'pending_principal' && (
        <span className='text-[11.5px] text-slate-500'>by {leave.principal.name}</span>
      )}
      {(leave.principal_note ?? leave.hod_note) && (
        <span className='max-w-56 truncate text-[11.5px] text-slate-500'>
          Note: {leave.principal_note ?? leave.hod_note}
        </span>
      )}
    </span>
  )

  const items = leaves.data?.items ?? []
  const pageIds = items.map((l) => l.id)
  const allOnPage = pageIds.length > 0 && pageIds.every((id) => selected.has(id))
  const isIndeterminate = !allOnPage && pageIds.some((id) => selected.has(id))
  const toggle = (id: number) =>
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  const togglePage = () =>
    setSelected((prev) => {
      const next = new Set(prev)
      if (allOnPage) pageIds.forEach((id) => next.delete(id))
      else pageIds.forEach((id) => next.add(id))
      return next
    })

  const columns: Column<StaffLeave>[] = [
    ...(canDecide
      ? [
          {
            key: 'select',
            header: (
              <TableCheckbox
                ariaLabel='Select all staff leave requests on this page'
                checked={allOnPage}
                indeterminate={isIndeterminate}
                onChange={togglePage}
              />
            ),
            className: 'w-12 text-center',
            cell: (leave: StaffLeave) => (
              <TableCheckbox
                ariaLabel={`Select ${leave.staff.name}`}
                checked={selected.has(leave.id)}
                onChange={() => toggle(leave.id)}
              />
            ),
          },
        ]
      : []),
    {
      key: 'staff',
      header: 'Staff',
      cell: (leave) => (
        <div className='grid min-w-0'>
          <span className='truncate text-[13px] leading-[18px] font-semibold text-slate-900 dark:text-slate-100'>
            {leave.staff.name}
          </span>
          <span className='text-[12px] leading-[16px] text-slate-500 dark:text-slate-400'>
            {leave.department ?? '—'}
          </span>
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Leave type',
      cell: (leave) => (
        <span className='text-[13px] leading-[18px] font-medium text-slate-800 dark:text-slate-200'>
          {leave.leave_type.name}
        </span>
      ),
    },
    {
      key: 'dates',
      header: 'Dates',
      cell: (leave) => (
        <div className='grid'>
          <span className='text-[13px] leading-[18px] text-slate-800 dark:text-slate-200'>
            {range(leave.from_date, leave.to_date)}
          </span>
          <span className='text-[12px] leading-[16px] text-slate-500 dark:text-slate-400'>
            {daysText(leave.days, leave.half_day)}
          </span>
        </div>
      ),
    },
    {
      key: 'reason',
      header: 'Reason',
      hideBelow: 'xl',
      cell: (leave) => (
        <span className='line-clamp-2 max-w-64 text-[13px] leading-[18px] text-slate-600 dark:text-slate-400'>
          {leave.reason}
        </span>
      ),
    },
    { key: 'stage', header: 'Stage', cell: stage },
    ...(canDecide ? [{ key: 'actions', header: 'Actions', align: 'right' as const, cell: actions }] : []),
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
      {canDecide && selected.size > 0 && (
        <BulkActionBar
          count={selected.size}
          onClear={() => setSelected(new Set())}
          primaryAction={{
            label: 'Approve selected',
            icon: <Check className='size-3.5' />,
            onClick: async () => {
              for (const id of selected) {
                try {
                  await approve.mutateAsync({ id, input: { status: 'approved' } })
                } catch {
                  // continue
                }
              }
              alerts.success(`Approved ${selected.size} staff leave requests`)
              setSelected(new Set())
            },
            variant: 'primary',
          }}
        />
      )}
      <DataTable
        rows={items}
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

function StudentLeaves({ search, filtered, canDecide, onSearchChange, onReject }: ListProps) {
  const status = statusOf(search, 'student')
  const leaves = useStudentLeaves({
    page: search.page,
    limit: LIMIT,
    search: search.search,
    status:
      status === 'pending'
        ? 'pending'
        : status in STUDENT_LEAVE_STATUS
          ? (status as StudentLeaveStatus)
          : undefined,
  })
  const approve = useApprove('student')
  const [busy, setBusy] = useState<number | null>(null)
  const [selected, setSelected] = useState<Set<number>>(new Set())

  const pending = (leave: StudentLeave) => leave.status === 'pending'

  const approveLeave = async (leave: StudentLeave) => {
    setBusy(leave.id)
    try {
      await approve.mutateAsync({ id: leave.id, input: { status: 'approved' } })
      alerts.success(`Leave approved for ${leave.student.name}`)
    } catch (error) {
      alerts.error(toApiError(error).message)
    } finally {
      setBusy(null)
    }
  }

  const actions = (leave: StudentLeave) =>
    canDecide && pending(leave) ? (
      <DecisionButtons
        name={leave.student.name}
        loading={busy === leave.id}
        onApprove={() => void approveLeave(leave)}
        onReject={() =>
          onReject({
            kind: 'student',
            id: leave.id,
            name: leave.student.name,
            summary: `${leave.class_section ?? 'Student'} · ${range(leave.from_date, leave.to_date)} · ${leave.reason}`,
          })
        }
      />
    ) : null

  const stage = (leave: StudentLeave) => (
    <span className='grid gap-0.5'>
      <StatusPill
        label={STUDENT_LEAVE_STATUS[leave.status].label}
        tone={STUDENT_LEAVE_STATUS[leave.status].tone}
      />
      {leave.decided_by && (
        <span className='text-[11.5px] text-slate-500'>by {leave.decided_by.name}</span>
      )}
      {leave.decision_note && (
        <span className='max-w-56 truncate text-[11.5px] text-slate-500'>
          Note: {leave.decision_note}
        </span>
      )}
    </span>
  )

  const items = leaves.data?.items ?? []
  const pageIds = items.map((l) => l.id)
  const allOnPage = pageIds.length > 0 && pageIds.every((id) => selected.has(id))
  const isIndeterminate = !allOnPage && pageIds.some((id) => selected.has(id))
  const toggle = (id: number) =>
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  const togglePage = () =>
    setSelected((prev) => {
      const next = new Set(prev)
      if (allOnPage) pageIds.forEach((id) => next.delete(id))
      else pageIds.forEach((id) => next.add(id))
      return next
    })

  const columns: Column<StudentLeave>[] = [
    ...(canDecide
      ? [
          {
            key: 'select',
            header: (
              <TableCheckbox
                ariaLabel='Select all student leave requests on this page'
                checked={allOnPage}
                indeterminate={isIndeterminate}
                onChange={togglePage}
              />
            ),
            className: 'w-12 text-center',
            cell: (leave: StudentLeave) => (
              <TableCheckbox
                ariaLabel={`Select ${leave.student.name}`}
                checked={selected.has(leave.id)}
                onChange={() => toggle(leave.id)}
              />
            ),
          },
        ]
      : []),
    {
      key: 'student',
      header: 'Student',
      cell: (leave) => (
        <div className='grid min-w-0'>
          <span className='truncate text-[13px] leading-[18px] font-semibold text-slate-900 dark:text-slate-100'>
            {leave.student.name}
          </span>
          <span className='text-[12px] leading-[16px] text-slate-500 dark:text-slate-400'>
            {leave.class_section ?? '—'}
          </span>
        </div>
      ),
    },
    {
      key: 'dates',
      header: 'Dates',
      cell: (leave) => (
        <div className='grid'>
          <span className='text-[13px] leading-[18px] text-slate-800 dark:text-slate-200'>
            {range(leave.from_date, leave.to_date)}
          </span>
          <span className='text-[12px] leading-[16px] text-slate-500 dark:text-slate-400'>
            {daysText(leave.days, leave.half_day)}
          </span>
        </div>
      ),
    },
    {
      key: 'reason',
      header: 'Reason',
      hideBelow: 'xl',
      cell: (leave) => (
        <span className='line-clamp-2 max-w-64 text-[13px] leading-[18px] text-slate-600 dark:text-slate-400'>
          {leave.reason}
        </span>
      ),
    },
    { key: 'stage', header: 'Stage', cell: stage },
    ...(canDecide ? [{ key: 'actions', header: 'Actions', align: 'right' as const, cell: actions }] : []),
  ]

  return (
    <>
      <Toolbar
        search={search}
        status={status}
        filtered={filtered}
        total={leaves.data?.total}
        statusOptions={STUDENT_STATUS_OPTIONS}
        placeholder='Student name or reason'
        onSearchChange={onSearchChange}
      />
      {canDecide && selected.size > 0 && (
        <BulkActionBar
          count={selected.size}
          onClear={() => setSelected(new Set())}
          primaryAction={{
            label: 'Approve selected',
            icon: <Check className='size-3.5' />,
            onClick: async () => {
              for (const id of selected) {
                try {
                  await approve.mutateAsync({ id, input: { status: 'approved' } })
                } catch {
                  // continue
                }
              }
              alerts.success(`Approved ${selected.size} student leave requests`)
              setSelected(new Set())
            },
            variant: 'primary',
          }}
        />
      )}
      <DataTable
        rows={items}
        columns={columns}
        rowKey={(leave) => leave.id}
        loading={leaves.isFetching}
        error={leaves.isError ? leaves.error.message : null}
        onRetry={() => leaves.refetch()}
        empty={{
          icon: filtered ? CircleOff : Inbox,
          title: filtered
            ? 'No leave requests match these filters'
            : 'No student leave requests waiting',
          description: filtered
            ? 'Try another name, or clear the filters.'
            : 'Choose Any status to see approved, rejected and cancelled requests.',
        }}
        card={(leave) => (
          <div className='grid gap-1.5'>
            <div className='flex items-start justify-between gap-2'>
              <span className='grid min-w-0'>
                <span className='truncate font-bold'>{leave.student.name}</span>
                <span className='text-xs text-muted-foreground'>
                  {leave.class_section ?? 'Student'} · {range(leave.from_date, leave.to_date)} ·{' '}
                  {daysText(leave.days, leave.half_day)}
                </span>
              </span>
              <StatusPill
                label={STUDENT_LEAVE_STATUS[leave.status].label}
                tone={STUDENT_LEAVE_STATUS[leave.status].tone}
              />
            </div>
            <span className='text-sm'>{leave.reason}</span>
            {actions(leave)}
          </div>
        )}
        pagination={{
          page: search.page,
          limit: LIMIT,
          total: leaves.data?.total ?? 0,
          label: 'student requests',
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
      showSubmitShortcut={false}
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
