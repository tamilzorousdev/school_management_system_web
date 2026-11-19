import { useState } from 'react'
import { CheckCircle2, Gavel, Pencil, Plus, Trash2, Undo2, XCircle } from 'lucide-react'
import { AppModal } from '@/components/common/app-modal'
import { Combobox, type ComboboxOption } from '@/components/common/combobox'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import { DataTable, type Column } from '@/components/common/data-table'
import { FormField } from '@/components/common/form-field'
import { FilterSelect, ListToolbar, SearchBox } from '@/components/common/list-toolbar'
import { useShortcut } from '@/components/shortcuts/shortcut-context'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input, Textarea } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { useDebouncedValue } from '@/hooks/use-debounce'
import { alerts } from '@/lib/alerts'
import { formatDate, formatDateTime } from '@/lib/format'
import { today } from '@/features/attendance/labels'
import { useMe } from '@/features/auth/api'
import { useStudents } from '@/features/students/api'
import type { FeeAccess } from '../access'
import {
  feesApi,
  useFeesMutation,
  useFineTypes,
  useFines,
  type Fine,
  type FineStatus,
  type FineType,
} from '../api'
import { FINE_STATUS, FINE_STATUS_OPTIONS, amountError, formErrors, rupees } from '../labels'
import type { FeesSearch } from '../search'

const LIMIT = 20

function inDays(days: number) {
  const date = new Date(`${today()}T00:00:00Z`)
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

export function FinesTab({
  search,
  access,
  onChange,
  onOpenInvoice,
}: {
  search: FeesSearch
  access: FeeAccess
  onChange: (patch: Partial<FeesSearch>) => void
  onOpenInvoice: (invoiceId: number) => void
}) {
  const me = useMe().data
  const page = search.page ?? 1
  const status = search.fine_status ?? (access.approve ? 'pending' : 'all')
  const fines = useFines({
    page,
    limit: LIMIT,
    search: search.search,
    status: status === 'all' ? undefined : (status as FineStatus),
  })
  const [raising, setRaising] = useState(false)
  const [deciding, setDeciding] = useState<{ fine: Fine; approve: boolean } | null>(null)
  const withdraw = useFeesMutation((id: number) => feesApi.withdrawFine(id))
  const filtered = Boolean(search.search || search.fine_status)

  useShortcut('app.refresh', () => void fines.refetch())

  const actions = (row: Fine) => {
    if (row.status !== 'pending') return null
    const mine = me?.id === row.raised_by?.id
    return (
      <span className='flex flex-wrap justify-end gap-1.5'>
        {access.approve && !mine && (
          <>
            <Button
              size='sm'
              variant='outline'
              aria-label={`Reject fine ${row.fine_no}`}
              onClick={(event) => {
                event.stopPropagation()
                setDeciding({ fine: row, approve: false })
              }}
            >
              <XCircle />
              Reject
            </Button>
            <Button
              size='sm'
              aria-label={`Approve fine ${row.fine_no}`}
              onClick={(event) => {
                event.stopPropagation()
                setDeciding({ fine: row, approve: true })
              }}
            >
              <CheckCircle2 />
              Approve
            </Button>
          </>
        )}
        {mine && (
          <Button
            size='sm'
            variant='ghost'
            loading={withdraw.isPending && withdraw.variables === row.id}
            onClick={async (event) => {
              event.stopPropagation()
              try {
                await withdraw.mutateAsync(row.id)
                alerts.success('Fine withdrawn')
              } catch (error) {
                formErrors(error)
              }
            }}
          >
            <Undo2 />
            Withdraw
          </Button>
        )}
      </span>
    )
  }

  const columns: Column<Fine>[] = [
    {
      key: 'fine',
      header: 'Fine',
      cell: (row) => (
        <span className='grid'>
          <span className='font-semibold'>{row.title}</span>
          <span className='text-xs text-muted-foreground'>
            {row.fine_no}
            {row.fine_type ? ` · ${row.fine_type.name}` : ''} · {formatDate(row.incident_on)}
          </span>
        </span>
      ),
    },
    {
      key: 'student',
      header: 'Student',
      cell: (row) => (
        <span className='grid'>
          <span>{row.student.full_name}</span>
          <span className='text-xs text-muted-foreground'>
            {row.student.class_section ?? row.student.admission_no}
          </span>
        </span>
      ),
    },
    {
      key: 'amount',
      header: 'Amount',
      align: 'right',
      cell: (row) => <span className='font-semibold tabular-nums'>{rupees(row.amount)}</span>,
    },
    {
      key: 'by',
      header: 'Raised by',
      hideBelow: 'xl',
      cell: (row) => (
        <span className='grid'>
          <span>{row.raised_by?.name ?? '—'}</span>
          <span className='text-xs text-muted-foreground'>{formatDateTime(row.raised_at)}</span>
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (row) => (
        <span className='grid gap-0.5'>
          <Badge tone={FINE_STATUS[row.status].tone}>{FINE_STATUS[row.status].label}</Badge>
          {row.invoice && (
            <span className='text-xs text-muted-foreground'>
              {row.invoice.invoice_no} ·{' '}
              {row.invoice.balance > 0 ? `${rupees(row.invoice.balance)} due` : 'paid'}
            </span>
          )}
          {row.status === 'rejected' && row.decision_comment && (
            <span className='line-clamp-2 text-xs text-muted-foreground'>
              {row.decision_comment}
            </span>
          )}
        </span>
      ),
    },
    { key: 'actions', header: '', align: 'right', cell: actions },
  ]

  return (
    <div className='grid gap-4'>
      <Card className='overflow-hidden'>
        <div className='flex flex-wrap items-start justify-between gap-3 border-b px-4 py-3'>
          <div>
            <h2 className='font-bold'>Fines</h2>
            <p className='text-xs text-muted-foreground'>
              Fines for misconduct or damage on campus. A fine is charged only after the AO,
              Principal or Admin approves it; it then becomes an invoice the parent pays like any
              fee. Nobody approves their own fine.
            </p>
          </div>
          {access.fine && (
            <Button onClick={() => setRaising(true)}>
              <Plus />
              Raise fine
            </Button>
          )}
        </div>
        <ListToolbar
          summary={
            fines.data ? `${fines.data.total} ${fines.data.total === 1 ? 'fine' : 'fines'}` : ''
          }
          onClear={
            filtered ? () => onChange({ search: undefined, fine_status: undefined }) : undefined
          }
        >
          <SearchBox
            value={search.search ?? ''}
            onChange={(value) => onChange({ search: value || undefined })}
            placeholder='Student, fine no. or title'
            label='Search fines'
          />
          <FilterSelect
            id='fine-status-filter'
            label='Filter by status'
            allLabel={access.approve ? 'Waiting' : 'All fines'}
            value={search.fine_status}
            options={FINE_STATUS_OPTIONS.filter((option) =>
              access.approve ? option.value !== 'pending' : option.value !== 'all'
            )}
            onChange={(value) =>
              onChange({ fine_status: (value as FeesSearch['fine_status']) || undefined })
            }
          />
        </ListToolbar>
        <DataTable
          rows={fines.data?.items ?? []}
          columns={columns}
          rowKey={(row) => row.id}
          loading={fines.isFetching}
          error={fines.isError ? fines.error.message : null}
          onRetry={() => fines.refetch()}
          onRowClick={(row) => row.invoice && onOpenInvoice(row.invoice.id)}
          empty={{
            icon: Gavel,
            title: status === 'pending' && !filtered ? 'No fine is waiting' : 'No fines match',
            description:
              status === 'pending' && !filtered
                ? 'Fines raised by teachers in the staff app or by the office appear here.'
                : 'Try other filters or clear them.',
          }}
          pagination={
            fines.data
              ? {
                  page,
                  limit: LIMIT,
                  total: fines.data.total,
                  label: 'fines',
                  onPageChange: (next) => onChange({ page: next }),
                }
              : undefined
          }
          card={(row) => (
            <div className='grid gap-1.5'>
              <div className='flex items-start justify-between gap-2'>
                <span className='font-semibold'>
                  {row.title} · {rupees(row.amount)}
                </span>
                <Badge tone={FINE_STATUS[row.status].tone}>{FINE_STATUS[row.status].label}</Badge>
              </div>
              <span className='text-xs text-muted-foreground'>
                {row.student.full_name} · {row.fine_no} · raised by {row.raised_by?.name ?? '—'}
              </span>
              {actions(row)}
            </div>
          )}
        />
      </Card>
      <FineTypesCard canEdit={access.configure} />
      {raising && <RaiseFineModal onClose={() => setRaising(false)} />}
      {deciding && (
        <DecideFineModal
          fine={deciding.fine}
          approve={deciding.approve}
          onClose={() => setDeciding(null)}
        />
      )}
    </div>
  )
}

function FineTypesCard({ canEdit }: { canEdit: boolean }) {
  const types = useFineTypes()
  const [editing, setEditing] = useState<FineType | 'new' | null>(null)
  const [deleting, setDeleting] = useState<FineType | null>(null)
  const remove = useFeesMutation((id: number) => feesApi.removeFineType(id))
  const columns: Column<FineType>[] = [
    {
      key: 'name',
      header: 'Fine type',
      cell: (row) => (
        <span className='grid'>
          <span className='font-semibold'>{row.name}</span>
          {row.description && (
            <span className='text-xs text-muted-foreground'>{row.description}</span>
          )}
        </span>
      ),
    },
    {
      key: 'amount',
      header: 'Default amount',
      align: 'right',
      cell: (row) => <span className='tabular-nums'>{rupees(row.default_amount)}</span>,
    },
    { key: 'fines', header: 'Fines', align: 'right', hideBelow: 'lg', cell: (row) => row.fines },
    {
      key: 'active',
      header: 'Status',
      cell: (row) => (
        <Badge tone={row.is_active ? 'success' : 'neutral'}>
          {row.is_active ? 'In use' : 'Off'}
        </Badge>
      ),
    },
    ...(canEdit
      ? [
          {
            key: 'actions',
            header: '',
            align: 'right' as const,
            cell: (row: FineType) => (
              <span className='flex justify-end gap-1'>
                <Button
                  size='icon'
                  variant='ghost'
                  aria-label={`Edit ${row.name}`}
                  onClick={() => setEditing(row)}
                >
                  <Pencil />
                </Button>
                <Button
                  size='icon'
                  variant='ghost'
                  aria-label={`Delete ${row.name}`}
                  onClick={() => setDeleting(row)}
                >
                  <Trash2 />
                </Button>
              </span>
            ),
          },
        ]
      : []),
  ]
  return (
    <Card className='overflow-hidden'>
      <div className='flex flex-wrap items-start justify-between gap-3 border-b px-4 py-3'>
        <div>
          <h2 className='font-bold'>Fine types</h2>
          <p className='text-xs text-muted-foreground'>
            The amount fills in when a fine is raised and can be changed for each fine.
          </p>
        </div>
        {canEdit && (
          <Button variant='outline' onClick={() => setEditing('new')}>
            <Plus />
            Add fine type
          </Button>
        )}
      </div>
      <DataTable
        rows={types.data ?? []}
        columns={columns}
        rowKey={(row) => row.id}
        loading={types.isFetching}
        error={types.isError ? types.error.message : null}
        onRetry={() => types.refetch()}
        empty={{
          icon: Gavel,
          title: 'No fine types yet',
          description: 'Add types such as Property damage or Mobile phone in class.',
        }}
        card={(row) => (
          <div className='flex items-center justify-between gap-2'>
            <span className='grid'>
              <span className='font-semibold'>{row.name}</span>
              <span className='text-xs text-muted-foreground'>
                {rupees(row.default_amount)} · {row.fines} {row.fines === 1 ? 'fine' : 'fines'}
              </span>
            </span>
            <span className='flex items-center gap-1'>
              <Badge tone={row.is_active ? 'success' : 'neutral'}>
                {row.is_active ? 'In use' : 'Off'}
              </Badge>
              {canEdit && (
                <Button
                  size='icon'
                  variant='ghost'
                  aria-label={`Edit ${row.name}`}
                  onClick={() => setEditing(row)}
                >
                  <Pencil />
                </Button>
              )}
            </span>
          </div>
        )}
      />
      {editing && (
        <FineTypeModal type={editing === 'new' ? null : editing} onClose={() => setEditing(null)} />
      )}
      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={`Delete ${deleting?.name ?? 'this fine type'}?`}
        description='Fines already raised keep their title and amount. To stop using it for now, switch it off instead.'
        confirmText='Delete'
        destructive
        loading={remove.isPending}
        onConfirm={async () => {
          if (!deleting) return
          try {
            await remove.mutateAsync(deleting.id)
            alerts.success('Fine type deleted')
            setDeleting(null)
          } catch (error) {
            formErrors(error)
          }
        }}
      />
    </Card>
  )
}

function FineTypeModal({ type, onClose }: { type: FineType | null; onClose: () => void }) {
  const [name, setName] = useState(type?.name ?? '')
  const [amount, setAmount] = useState(type ? String(type.default_amount) : '')
  const [description, setDescription] = useState(type?.description ?? '')
  const [active, setActive] = useState(type?.is_active ?? true)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const save = useFeesMutation(() => {
    const input = {
      name: name.trim(),
      default_amount: Number(amount),
      description: description.trim() || null,
      is_active: active,
    }
    return type ? feesApi.updateFineType(type.id, input) : feesApi.createFineType(input)
  })
  return (
    <AppModal
      open
      onOpenChange={(open) => !open && onClose()}
      title={type ? `Edit ${type.name}` : 'Add fine type'}
      formId='fine-type-form'
      submitText='Save'
      loading={save.isPending}
    >
      <form
        id='fine-type-form'
        noValidate
        className='grid gap-4'
        onSubmit={async (event) => {
          event.preventDefault()
          const next: Record<string, string> = {}
          if (name.trim().length < 2) next.name = 'Enter the name'
          const amountProblem = amountError(amount, 1000000)
          if (amountProblem) next.default_amount = amountProblem
          setErrors(next)
          if (Object.keys(next).length) return
          try {
            await save.mutateAsync(undefined)
            alerts.success(type ? 'Fine type updated' : 'Fine type added')
            onClose()
          } catch (error) {
            setErrors(formErrors(error, { FINE_TYPE_EXISTS: 'name' }))
          }
        }}
      >
        <FormField id='fine-type-name' label='Name' required error={errors.name}>
          <Input
            id='fine-type-name'
            autoFocus
            maxLength={80}
            value={name}
            placeholder='Property damage'
            onChange={(event) => setName(event.target.value)}
          />
        </FormField>
        <FormField
          id='fine-type-amount'
          label='Default amount (₹)'
          required
          error={errors.default_amount}
        >
          <Input
            id='fine-type-amount'
            inputMode='decimal'
            value={amount}
            placeholder='500'
            onChange={(event) => setAmount(event.target.value)}
          />
        </FormField>
        <FormField id='fine-type-description' label='Description' error={errors.description}>
          <Textarea
            id='fine-type-description'
            rows={2}
            maxLength={300}
            value={description}
            placeholder='Broken furniture, lab equipment or windows'
            onChange={(event) => setDescription(event.target.value)}
          />
        </FormField>
        <label className='flex items-center gap-3 text-sm'>
          <Switch checked={active} onCheckedChange={setActive} aria-label='In use' />
          In use (shown when raising a fine)
        </label>
      </form>
    </AppModal>
  )
}

export function RaiseFineModal({
  student,
  onClose,
}: {
  student?: { id: number; name: string }
  onClose: () => void
}) {
  const types = useFineTypes()
  const [studentId, setStudentId] = useState<number | undefined>(student?.id)
  const [query, setQuery] = useState('')
  const [typeId, setTypeId] = useState<number | undefined>()
  const [title, setTitle] = useState('')
  const [amount, setAmount] = useState('')
  const [incidentOn, setIncidentOn] = useState(today())
  const [details, setDetails] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const debounced = useDebouncedValue(query)
  const students = useStudents(
    { page: 1, limit: 20, search: debounced || undefined, status: 'active' },
    !student
  )
  const raise = useFeesMutation(() =>
    feesApi.raiseFine({
      student_id: studentId!,
      fine_type_id: typeId,
      title: title.trim() || undefined,
      amount: amount.trim() ? Number(amount) : undefined,
      incident_on: incidentOn,
      details: details.trim() || undefined,
    })
  )
  const activeTypes = (types.data ?? []).filter((item) => item.is_active)
  const studentOptions: ComboboxOption[] = (students.data?.items ?? []).map((item) => ({
    value: String(item.id),
    label: item.full_name,
    hint: [item.admission_no, item.class && `Class ${item.class.name}`, item.section?.name]
      .filter(Boolean)
      .join(' · '),
  }))
  return (
    <AppModal
      open
      onOpenChange={(open) => !open && onClose()}
      title={student ? `Raise a fine on ${student.name}` : 'Raise a fine'}
      description='It waits for approval by the AO, Principal or Admin. The parent sees it, and can pay it, only after approval. A disciplinary note is added to the student’s behaviour record.'
      formId='raise-fine-form'
      submitText='Send for approval'
      loading={raise.isPending}
      size='lg'
    >
      <form
        id='raise-fine-form'
        noValidate
        className='grid gap-4 sm:grid-cols-2'
        onSubmit={async (event) => {
          event.preventDefault()
          const next: Record<string, string> = {}
          if (!studentId) next.student_id = 'Choose the student'
          if (!typeId && title.trim().length < 3)
            next.title = 'Choose a fine type or say what it is for'
          if (!typeId || amount.trim()) {
            const amountProblem = amountError(amount, 1000000)
            if (amountProblem) next.amount = amountProblem
          }
          setErrors(next)
          if (Object.keys(next).length) return
          try {
            await raise.mutateAsync(undefined)
            alerts.success('Fine sent for approval')
            onClose()
          } catch (error) {
            setErrors(
              formErrors(error, {
                STUDENT_NOT_FOUND: 'student_id',
                FINE_TYPE_INACTIVE: 'fine_type_id',
                YEAR_CLOSED: 'student_id',
              })
            )
          }
        }}
      >
        {!student && (
          <FormField
            id='fine-student'
            label='Student'
            required
            error={errors.student_id}
            className='sm:col-span-2'
          >
            <Combobox
              id='fine-student'
              label='Student'
              value={studentId ? String(studentId) : undefined}
              options={studentOptions}
              onSearch={setQuery}
              placeholder='Search name or admission number'
              searchPlaceholder='Search students'
              emptyText={students.isPending ? 'Loading students…' : 'No matching students'}
              invalid={Boolean(errors.student_id)}
              onChange={(value) => setStudentId(value ? Number(value) : undefined)}
            />
          </FormField>
        )}
        <FormField id='fine-type' label='Fine type' error={errors.fine_type_id}>
          <Combobox
            id='fine-type'
            label='Fine type'
            value={typeId ? String(typeId) : undefined}
            options={activeTypes.map((item) => ({
              value: String(item.id),
              label: item.name,
              hint: rupees(item.default_amount),
            }))}
            placeholder={activeTypes.length ? 'Choose' : 'No fine types yet'}
            allLabel='Other (type it below)'
            onChange={(value) => {
              const chosen = activeTypes.find((item) => String(item.id) === value)
              setTypeId(chosen?.id)
              if (chosen) setAmount(String(chosen.default_amount))
            }}
          />
        </FormField>
        <FormField id='fine-amount' label='Amount (₹)' required={!typeId} error={errors.amount}>
          <Input
            id='fine-amount'
            inputMode='decimal'
            value={amount}
            placeholder='500'
            onChange={(event) => setAmount(event.target.value)}
          />
        </FormField>
        <FormField
          id='fine-title'
          label='What happened'
          required={!typeId}
          error={errors.title}
          className='sm:col-span-2'
        >
          <Input
            id='fine-title'
            maxLength={120}
            value={title}
            placeholder={
              typeId ? 'Optional; the fine type name is used' : 'Broke the lab microscope'
            }
            onChange={(event) => setTitle(event.target.value)}
          />
        </FormField>
        <FormField id='fine-date' label='Date of the incident' error={errors.incident_on}>
          <Input
            id='fine-date'
            type='date'
            value={incidentOn}
            max={today()}
            onChange={(event) => setIncidentOn(event.target.value)}
          />
        </FormField>
        <FormField
          id='fine-details'
          label='Details'
          error={errors.details}
          className='sm:col-span-2'
        >
          <Textarea
            id='fine-details'
            rows={3}
            maxLength={1000}
            value={details}
            placeholder='Dropped it while playing during the lab period'
            onChange={(event) => setDetails(event.target.value)}
          />
        </FormField>
      </form>
    </AppModal>
  )
}

function DecideFineModal({
  fine,
  approve,
  onClose,
}: {
  fine: Fine
  approve: boolean
  onClose: () => void
}) {
  const [comment, setComment] = useState('')
  const [dueDate, setDueDate] = useState(inDays(7))
  const [errors, setErrors] = useState<Record<string, string>>({})
  const decide = useFeesMutation(() =>
    approve
      ? feesApi.approveFine(fine.id, { due_date: dueDate, comment: comment.trim() || undefined })
      : feesApi.rejectFine(fine.id, comment.trim())
  )
  const what = `${fine.title} · ${rupees(fine.amount)}`
  return (
    <AppModal
      open
      onOpenChange={(open) => !open && onClose()}
      title={
        approve
          ? `Charge ${fine.student.full_name}?`
          : `Reject the fine on ${fine.student.full_name}?`
      }
      description={`${what}, raised by ${fine.raised_by?.name ?? 'someone'}${fine.details ? `: “${fine.details}”` : ''}. ${approve ? 'An invoice is raised and the parents are told.' : 'Nothing is charged.'}`}
      formId='fine-decide-form'
      submitText={approve ? 'Approve and charge' : 'Reject'}
      cancelText='Not now'
      loading={decide.isPending}
    >
      <form
        id='fine-decide-form'
        noValidate
        className='grid gap-4'
        onSubmit={async (event) => {
          event.preventDefault()
          if (!approve && comment.trim().length < 3) {
            setErrors({ comment: 'Say why, so the person who raised it knows' })
            return
          }
          setErrors({})
          try {
            await decide.mutateAsync(undefined)
            alerts.success(approve ? 'Fine approved and charged' : 'Fine rejected')
            onClose()
          } catch (caught) {
            setErrors(
              formErrors(caught, {
                SELF_APPROVAL: 'comment',
                FINE_NOT_PENDING: 'comment',
                FINE_OTHER_YEAR: 'comment',
                YEAR_CLOSED: 'comment',
              })
            )
          }
        }}
      >
        {approve && (
          <FormField id='fine-due' label='Pay by' required error={errors.due_date}>
            <Input
              id='fine-due'
              type='date'
              value={dueDate}
              min={today()}
              onChange={(event) => setDueDate(event.target.value)}
            />
          </FormField>
        )}
        <FormField
          id='fine-comment'
          label={approve ? 'Comment' : 'Reason'}
          required={!approve}
          error={errors.comment}
        >
          <Textarea
            id='fine-comment'
            autoFocus
            rows={2}
            maxLength={300}
            value={comment}
            placeholder={approve ? 'Optional' : 'A warning is enough for a first time'}
            onChange={(event) => setComment(event.target.value)}
          />
        </FormField>
      </form>
    </AppModal>
  )
}
