import { useState } from 'react'
import { BadgePercent, GraduationCap, Pencil, Plus, UserMinus, UserPlus, X } from 'lucide-react'
import { AppModal } from '@/components/common/app-modal'
import { Combobox, type ComboboxOption } from '@/components/common/combobox'
import { DataTable, type Column } from '@/components/common/data-table'
import { FilterSelect, ListToolbar, SearchBox } from '@/components/common/list-toolbar'
import { FormField } from '@/components/common/form-field'
import { useShortcut } from '@/components/shortcuts/shortcut-context'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input, Textarea } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { useDebouncedValue } from '@/hooks/use-debounce'
import { alerts } from '@/lib/alerts'
import { formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useClasses } from '@/features/setup/api'
import { useStudents } from '@/features/students/api'
import type { FeeAccess } from '../access'
import {
  feesApi,
  useFeeAwards,
  useFeeBenefits,
  useFeeHeads,
  useFeesMutation,
  type AwardStatus,
  type BenefitCalcType,
  type BenefitKind,
  type BenefitType,
  type FeeAward,
  type FeeBenefit,
  type FeeBenefitInput,
  type FeeStudentRef,
} from '../api'
import {
  AWARD_STATUS,
  AWARD_STATUS_OPTIONS,
  BENEFIT_KINDS,
  BENEFIT_KIND_OPTIONS,
  BENEFIT_TYPES,
  TYPES_BY_KIND,
  amountError,
  benefitValue,
  formErrors,
  rupees,
} from '../labels'
import type { FeesSearch } from '../search'

const LIMIT = 20

export function BenefitsTab({
  search,
  access,
  onChange,
}: {
  search: FeesSearch
  access: FeeAccess
  onChange: (patch: Partial<FeesSearch>) => void
}) {
  const page = search.page ?? 1
  const schemes = useFeeBenefits({
    page: 1,
    limit: 100,
    kind: search.kind,
    sort: 'name',
    order: 'asc',
  })
  const awards = useFeeAwards({
    page,
    limit: LIMIT,
    search: search.search,
    kind: search.kind,
    benefit_id: search.benefit_id,
    status: search.award_status,
  })
  const [editing, setEditing] = useState<FeeBenefit | 'new' | null>(null)
  const [giving, setGiving] = useState<FeeBenefit | 'any' | null>(null)
  const [revoking, setRevoking] = useState<FeeAward | null>(null)
  const schemeRows = schemes.data?.items ?? []
  const filtered = Boolean(search.search || search.benefit_id || search.award_status)

  useShortcut('app.refresh', () => {
    void schemes.refetch()
    void awards.refetch()
  })

  const schemeColumns: Column<FeeBenefit>[] = [
    {
      key: 'name',
      header: 'Name',
      cell: (row) => (
        <span className='grid min-w-0'>
          <span className='font-semibold'>{row.name}</span>
          <span className='text-xs text-muted-foreground'>
            {BENEFIT_KINDS[row.kind]} · {BENEFIT_TYPES[row.type]}
          </span>
        </span>
      ),
    },
    {
      key: 'value',
      header: 'Off',
      cell: (row) => <span className='tabular font-semibold'>{benefitValue(row)}</span>,
    },
    {
      key: 'students',
      header: 'Students',
      align: 'right',
      cell: (row) => <span className='tabular'>{row.active_awards}</span>,
    },
    {
      key: 'given',
      header: 'Given so far',
      align: 'right',
      hideBelow: 'lg',
      cell: (row) => <span className='tabular'>{rupees(row.amount_given)}</span>,
    },
    {
      key: 'state',
      header: '',
      cell: (row) => !row.is_active && <Badge>Switched off</Badge>,
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      cell: (row) => (
        <span className='flex justify-end gap-1'>
          {access.adjust && row.is_active && (
            <Button
              size='sm'
              variant='outline'
              aria-label={`Give ${row.name} to students`}
              onClick={(event) => {
                event.stopPropagation()
                setGiving(row)
              }}
            >
              <UserPlus />
              Give
            </Button>
          )}
          {access.configure && (
            <Button
              size='sm'
              variant='ghost'
              aria-label={`Edit ${row.name}`}
              onClick={(event) => {
                event.stopPropagation()
                setEditing(row)
              }}
            >
              <Pencil />
            </Button>
          )}
        </span>
      ),
    },
  ]

  const awardColumns: Column<FeeAward>[] = [
    {
      key: 'student',
      header: 'Student',
      sortKey: 'student',
      cell: (row) => <StudentCell student={row.student} />,
    },
    {
      key: 'benefit',
      header: 'Concession or scholarship',
      cell: (row) => (
        <span className='grid'>
          <span className='font-semibold'>{row.benefit.name}</span>
          <span className='text-xs text-muted-foreground'>{benefitValue(row.benefit)}</span>
        </span>
      ),
    },
    {
      key: 'reason',
      header: 'Reason',
      hideBelow: 'lg',
      cell: (row) => (
        <span className='line-clamp-2 text-muted-foreground'>
          {row.status === 'revoked' ? `Withdrawn: ${row.revoke_reason ?? ''}` : (row.reason ?? '—')}
        </span>
      ),
    },
    {
      key: 'given',
      header: 'Taken off',
      align: 'right',
      cell: (row) => <span className='tabular'>{rupees(row.amount_given)}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      cell: (row) => (
        <Badge tone={AWARD_STATUS[row.status].tone}>{AWARD_STATUS[row.status].label}</Badge>
      ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      cell: (row) =>
        access.adjust &&
        row.status === 'active' && (
          <Button
            size='sm'
            variant='ghost'
            className='text-destructive hover:bg-destructive/10'
            aria-label={`Withdraw ${row.benefit.name} from ${row.student.full_name}`}
            onClick={() => setRevoking(row)}
          >
            <UserMinus />
            Withdraw
          </Button>
        ),
    },
  ]

  return (
    <div className='grid gap-4'>
      <Card className='overflow-hidden'>
        <div className='flex flex-wrap items-start justify-between gap-2 border-b px-4 py-3'>
          <div className='grid gap-0.5'>
            <h2 className='font-bold'>Concessions and scholarships</h2>
            <p className='max-w-3xl text-xs text-muted-foreground'>
              Taken off invoices raised from now on. Concessions come first, then scholarships. A
              percentage is taken from each fee head’s amount, a fixed amount is spread over the
              year’s installments, and no fee goes below ₹0.
            </p>
          </div>
          {access.configure && (
            <Button size='sm' onClick={() => setEditing('new')}>
              <Plus />
              Add
            </Button>
          )}
        </div>
        <ListToolbar summary={schemes.data ? `${schemes.data.total} in all` : ''}>
          <FilterSelect
            id='benefit-kind-filter'
            label='Filter by kind'
            allLabel='Concessions and scholarships'
            value={search.kind}
            options={BENEFIT_KIND_OPTIONS}
            onChange={(value) =>
              onChange({ kind: value as BenefitKind | undefined, benefit_id: undefined })
            }
          />
        </ListToolbar>
        <DataTable
          rows={schemeRows}
          columns={schemeColumns}
          rowKey={(row) => row.id}
          loading={schemes.isFetching}
          error={schemes.isError ? schemes.error.message : null}
          onRetry={() => schemes.refetch()}
          empty={{
            icon: BadgePercent,
            title: 'None yet',
            description: access.configure
              ? 'Add a concession such as sibling or staff child, or a scholarship.'
              : 'The school has not added any yet.',
          }}
          card={(row) => (
            <div className='grid gap-1.5'>
              <div className='flex items-start justify-between gap-2'>
                <span className='grid'>
                  <span className='font-semibold'>{row.name}</span>
                  <span className='text-xs text-muted-foreground'>
                    {BENEFIT_KINDS[row.kind]} · {BENEFIT_TYPES[row.type]}
                  </span>
                </span>
                <span className='tabular font-bold'>{benefitValue(row)}</span>
              </div>
              <span className='text-xs text-muted-foreground'>
                {row.active_awards} {row.active_awards === 1 ? 'student' : 'students'} ·{' '}
                {rupees(row.amount_given)} given
                {!row.is_active && ' · switched off'}
              </span>
              <span className='flex gap-2'>
                {access.adjust && row.is_active && (
                  <Button size='sm' variant='outline' onClick={() => setGiving(row)}>
                    <UserPlus />
                    Give
                  </Button>
                )}
                {access.configure && (
                  <Button size='sm' variant='ghost' onClick={() => setEditing(row)}>
                    <Pencil />
                    Edit
                  </Button>
                )}
              </span>
            </div>
          )}
        />
      </Card>
      <Card className='overflow-hidden'>
        <div className='flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3'>
          <h2 className='font-bold'>Students given one</h2>
          {access.adjust && schemeRows.some((row) => row.is_active) && (
            <Button size='sm' variant='outline' onClick={() => setGiving('any')}>
              <UserPlus />
              Give to students
            </Button>
          )}
        </div>
        <ListToolbar
          summary={awards.data ? `${awards.data.total} students` : ''}
          onClear={
            filtered
              ? () =>
                  onChange({ search: undefined, benefit_id: undefined, award_status: undefined })
              : undefined
          }
        >
          <SearchBox
            value={search.search ?? ''}
            onChange={(value) => onChange({ search: value || undefined })}
            placeholder='Student or admission no.'
            label='Search students given a concession or scholarship'
          />
          <FilterSelect
            id='award-benefit-filter'
            label='Filter by concession or scholarship'
            allLabel='All of them'
            value={search.benefit_id ? String(search.benefit_id) : undefined}
            options={schemeRows.map((row) => ({ value: String(row.id), label: row.name }))}
            onChange={(value) => onChange({ benefit_id: value ? Number(value) : undefined })}
          />
          <FilterSelect
            id='award-status-filter'
            label='Filter by status'
            allLabel='Active and withdrawn'
            value={search.award_status}
            options={AWARD_STATUS_OPTIONS}
            onChange={(value) => onChange({ award_status: value as AwardStatus | undefined })}
          />
        </ListToolbar>
        <DataTable
          rows={awards.data?.items ?? []}
          columns={awardColumns}
          rowKey={(row) => row.id}
          loading={awards.isFetching}
          error={awards.isError ? awards.error.message : null}
          onRetry={() => awards.refetch()}
          empty={{
            icon: GraduationCap,
            title: filtered ? 'No students match' : 'No student has one yet',
            description: filtered
              ? 'Try other filters or clear them.'
              : 'Give a concession or scholarship to students to see them here.',
          }}
          pagination={
            awards.data
              ? {
                  page,
                  limit: LIMIT,
                  total: awards.data.total,
                  label: 'students',
                  onPageChange: (next) => onChange({ page: next }),
                }
              : undefined
          }
          card={(row) => (
            <div className='grid gap-1.5'>
              <div className='flex items-start justify-between gap-2'>
                <StudentCell student={row.student} />
                <Badge tone={AWARD_STATUS[row.status].tone}>{AWARD_STATUS[row.status].label}</Badge>
              </div>
              <span className='text-sm'>
                <span className='font-semibold'>{row.benefit.name}</span>{' '}
                <span className='text-muted-foreground'>
                  · {benefitValue(row.benefit)} · {rupees(row.amount_given)} taken off
                </span>
              </span>
              <span className='text-xs text-muted-foreground'>
                Given {formatDate(row.awarded_at)}
                {row.awarded_by ? ` by ${row.awarded_by.name}` : ''}
                {row.status === 'revoked' && row.revoke_reason
                  ? ` · withdrawn: ${row.revoke_reason}`
                  : row.reason
                    ? ` · ${row.reason}`
                    : ''}
              </span>
              {access.adjust && row.status === 'active' && (
                <Button
                  size='sm'
                  variant='ghost'
                  className='justify-self-start text-destructive hover:bg-destructive/10'
                  onClick={() => setRevoking(row)}
                >
                  <UserMinus />
                  Withdraw
                </Button>
              )}
            </div>
          )}
        />
      </Card>
      {editing && (
        <BenefitModal
          benefit={editing === 'new' ? null : editing}
          defaultKind={search.kind ?? 'concession'}
          onClose={() => setEditing(null)}
        />
      )}
      {giving && (
        <AwardModal
          benefits={schemeRows.filter((row) => row.is_active)}
          initial={giving === 'any' ? null : giving}
          onClose={() => setGiving(null)}
        />
      )}
      {revoking && <RevokeModal award={revoking} onClose={() => setRevoking(null)} />}
    </div>
  )
}

function StudentCell({ student }: { student: FeeStudentRef }) {
  return (
    <span className='grid min-w-0'>
      <span className='truncate font-semibold'>{student.full_name}</span>
      <span className='text-xs text-muted-foreground'>
        {student.admission_no}
        {student.class_section ? ` · ${student.class_section}` : ''}
      </span>
    </span>
  )
}

function BenefitModal({
  benefit,
  defaultKind,
  onClose,
}: {
  benefit: FeeBenefit | null
  defaultKind: BenefitKind
  onClose: () => void
}) {
  const heads = useFeeHeads()
  const classes = useClasses()
  const [kind, setKind] = useState<BenefitKind>(benefit?.kind ?? defaultKind)
  const [name, setName] = useState(benefit?.name ?? '')
  const [type, setType] = useState<BenefitType>(benefit?.type ?? TYPES_BY_KIND[defaultKind][0]!)
  const [calcType, setCalcType] = useState<BenefitCalcType>(benefit?.calc_type ?? 'percent')
  const [value, setValue] = useState(benefit ? String(benefit.value) : '')
  const [headIds, setHeadIds] = useState<number[]>(benefit?.fee_head_ids ?? [])
  const [classIds, setClassIds] = useState<number[]>(benefit?.class_ids ?? [])
  const [description, setDescription] = useState(benefit?.description ?? '')
  const [active, setActive] = useState(benefit?.is_active ?? true)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [removing, setRemoving] = useState(false)
  const save = useFeesMutation((input: FeeBenefitInput) =>
    benefit ? feesApi.updateBenefit(benefit.id, input) : feesApi.createBenefit(input)
  )
  const remove = useFeesMutation(() => feesApi.removeBenefit(benefit!.id))
  const headRows = (heads.data?.items ?? []).filter(
    (head) => head.is_active || headIds.includes(head.id)
  )
  const flip = (list: number[], id: number) =>
    list.includes(id) ? list.filter((item) => item !== id) : [...list, id]

  const chips = (
    items: { id: number; label: string }[],
    selected: number[],
    onFlip: (id: number) => void
  ) => (
    <div className='flex flex-wrap gap-1.5'>
      {items.map((item) => {
        const on = selected.includes(item.id)
        return (
          <button
            key={item.id}
            type='button'
            aria-pressed={on}
            onClick={() => onFlip(item.id)}
            className={cn(
              'rounded-md border px-2.5 py-1 text-xs font-semibold transition-colors',
              on
                ? 'border-primary bg-primary text-primary-foreground'
                : 'bg-muted/40 text-muted-foreground hover:text-foreground'
            )}
          >
            {item.label}
          </button>
        )
      })}
    </div>
  )

  return (
    <AppModal
      open
      onOpenChange={(open) => !open && onClose()}
      title={benefit ? `Edit ${benefit.name}` : `Add a ${BENEFIT_KINDS[kind].toLowerCase()}`}
      description='Changes apply to invoices raised from now on. Invoices already raised keep their amounts.'
      size='lg'
      formId='fee-benefit-form'
      loading={save.isPending}
    >
      <form
        id='fee-benefit-form'
        noValidate
        className='grid gap-4 sm:grid-cols-2'
        onSubmit={async (event) => {
          event.preventDefault()
          const next: Record<string, string> = {}
          if (name.trim().length < 2) next.name = 'Enter the name'
          const percent = calcType === 'percent'
          const valueError = amountError(
            value,
            percent ? Number.MAX_SAFE_INTEGER : 10000000,
            percent ? 'percentage' : 'amount'
          )
          if (valueError) next.value = valueError
          else if (!(Number(value) > 0)) next.value = 'Enter more than 0'
          else if (percent && Number(value) > 100) next.value = 'A percentage can be at most 100'
          setErrors(next)
          if (Object.keys(next).length) return
          try {
            await save.mutateAsync({
              kind,
              name: name.trim(),
              type,
              calc_type: calcType,
              value: Number(value),
              fee_head_ids: headIds,
              class_ids: classIds,
              description: description.trim() || null,
              is_active: active,
            })
            alerts.success(`${name.trim()} saved`)
            onClose()
          } catch (error) {
            setErrors(formErrors(error, { BENEFIT_EXISTS: 'name', YEAR_CLOSED: 'name' }))
          }
        }}
      >
        {!benefit && (
          <FormField id='benefit-kind' label='Kind' required className='sm:col-span-2'>
            <Combobox
              id='benefit-kind'
              label='Kind'
              value={kind}
              options={BENEFIT_KIND_OPTIONS}
              placeholder='Choose'
              onChange={(next) => {
                if (!next) return
                const nextKind = next as BenefitKind
                setKind(nextKind)
                setType(TYPES_BY_KIND[nextKind][0]!)
              }}
            />
          </FormField>
        )}
        <FormField id='benefit-name' label='Name' required error={errors.name}>
          <Input
            id='benefit-name'
            value={name}
            maxLength={80}
            placeholder={kind === 'concession' ? 'Sibling concession' : 'Merit scholarship'}
            aria-invalid={Boolean(errors.name) || undefined}
            onChange={(event) => setName(event.target.value)}
          />
        </FormField>
        <FormField
          id='benefit-type'
          label={kind === 'concession' ? 'Type' : 'Funded by'}
          required
          error={errors.type}
        >
          <Combobox
            id='benefit-type'
            label={kind === 'concession' ? 'Type' : 'Funded by'}
            value={type}
            options={TYPES_BY_KIND[kind].map((item) => ({
              value: item,
              label: BENEFIT_TYPES[item],
            }))}
            placeholder='Choose'
            onChange={(next) => next && setType(next as BenefitType)}
          />
        </FormField>
        <FormField id='benefit-calc' label='How much' required>
          <Combobox
            id='benefit-calc'
            label='How much'
            value={calcType}
            options={[
              { value: 'percent', label: 'Percentage of the fee' },
              { value: 'fixed', label: 'Fixed amount a year' },
            ]}
            placeholder='Choose'
            onChange={(next) => next && setCalcType(next as BenefitCalcType)}
          />
        </FormField>
        <FormField
          id='benefit-value'
          label={calcType === 'percent' ? 'Percentage' : 'Amount a year'}
          required
          error={errors.value}
        >
          <div className='relative'>
            <span className='pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-muted-foreground'>
              {calcType === 'percent' ? '%' : '₹'}
            </span>
            <Input
              id='benefit-value'
              type='number'
              inputMode='decimal'
              min={0}
              step='0.01'
              className='tabular pl-7'
              value={value}
              placeholder={calcType === 'percent' ? '10' : '5000'}
              aria-invalid={Boolean(errors.value) || undefined}
              onChange={(event) => setValue(event.target.value)}
            />
          </div>
        </FormField>
        <fieldset className='grid gap-2 sm:col-span-2'>
          <legend className='text-sm font-semibold'>Fee heads</legend>
          <span className='text-xs text-muted-foreground'>
            {headIds.length
              ? `Only on the ${headIds.length} selected ${headIds.length === 1 ? 'head' : 'heads'}`
              : 'On every fee head except transport. Pick heads to limit it.'}
          </span>
          {chips(
            headRows.map((head) => ({ id: head.id, label: head.name })),
            headIds,
            (id) => setHeadIds((prev) => flip(prev, id))
          )}
          {errors.fee_head_ids && (
            <p role='alert' className='text-xs font-medium text-destructive'>
              {errors.fee_head_ids}
            </p>
          )}
        </fieldset>
        <fieldset className='grid gap-2 sm:col-span-2'>
          <legend className='text-sm font-semibold'>Classes</legend>
          <span className='text-xs text-muted-foreground'>
            {classIds.length
              ? `Only for students in the ${classIds.length} selected ${classIds.length === 1 ? 'class' : 'classes'}`
              : 'Open to every class. Pick classes to limit it.'}
          </span>
          {chips(
            (classes.data ?? []).map((item) => ({ id: item.id, label: `Class ${item.name}` })),
            classIds,
            (id) => setClassIds((prev) => flip(prev, id))
          )}
        </fieldset>
        <FormField
          id='benefit-description'
          label='Notes'
          error={errors.description}
          className='sm:col-span-2'
        >
          <Textarea
            id='benefit-description'
            rows={2}
            maxLength={300}
            value={description}
            placeholder='Who qualifies and what proof to keep'
            onChange={(event) => setDescription(event.target.value)}
          />
        </FormField>
        <div className='flex items-start justify-between gap-3 rounded-lg border px-3 py-2.5 sm:col-span-2'>
          <span className='grid min-w-0 gap-0.5'>
            <label htmlFor='benefit-active' className='text-sm font-semibold'>
              Switched on
            </label>
            <span className='text-xs text-muted-foreground'>
              Off stops it on new invoices and it cannot be given to more students
            </span>
          </span>
          <Switch
            id='benefit-active'
            aria-label='Switched on'
            checked={active}
            onCheckedChange={setActive}
          />
        </div>
        {benefit && benefit.active_awards === 0 && benefit.amount_given === 0 && (
          <div className='sm:col-span-2'>
            {removing ? (
              <span className='flex flex-wrap items-center gap-2 text-sm'>
                Delete {benefit.name}?
                <Button
                  type='button'
                  size='sm'
                  variant='destructive'
                  loading={remove.isPending}
                  onClick={async () => {
                    try {
                      await remove.mutateAsync(undefined)
                      alerts.success(`${benefit.name} deleted`)
                      onClose()
                    } catch (error) {
                      formErrors(error)
                    }
                  }}
                >
                  Delete
                </Button>
                <Button type='button' size='sm' variant='ghost' onClick={() => setRemoving(false)}>
                  Keep
                </Button>
              </span>
            ) : (
              <Button
                type='button'
                size='sm'
                variant='ghost'
                className='text-destructive hover:bg-destructive/10'
                onClick={() => setRemoving(true)}
              >
                Delete
              </Button>
            )}
          </div>
        )}
      </form>
    </AppModal>
  )
}

function AwardModal({
  benefits,
  initial,
  onClose,
}: {
  benefits: FeeBenefit[]
  initial: FeeBenefit | null
  onClose: () => void
}) {
  const [benefitId, setBenefitId] = useState<number | undefined>(initial?.id)
  const [chosen, setChosen] = useState<{ id: number; name: string; hint: string }[]>([])
  const [query, setQuery] = useState('')
  const [reason, setReason] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const debounced = useDebouncedValue(query)
  const students = useStudents({
    page: 1,
    limit: 20,
    search: debounced || undefined,
    status: 'active',
  })
  const give = useFeesMutation(() =>
    feesApi.award(
      benefitId!,
      chosen.map((item) => item.id),
      reason.trim()
    )
  )
  const benefit = benefits.find((item) => item.id === benefitId)
  const options: ComboboxOption[] = (students.data?.items ?? [])
    .filter((item) => !chosen.some((other) => other.id === item.id))
    .filter(
      (item) =>
        !benefit?.class_ids.length || (item.class && benefit.class_ids.includes(item.class.id))
    )
    .map((item) => ({
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
      title='Give to students'
      description='It is taken off their invoices raised from now on. Invoices already raised keep their amounts.'
      size='lg'
      formId='fee-award-form'
      submitText='Give'
      loading={give.isPending}
    >
      <form
        id='fee-award-form'
        noValidate
        className='grid gap-4'
        onSubmit={async (event) => {
          event.preventDefault()
          const next: Record<string, string> = {}
          if (!benefitId) next.benefit_id = 'Choose the concession or scholarship'
          if (!chosen.length) next.student_ids = 'Add at least one student'
          if (reason.trim().length < 3)
            next.reason = 'Give the reason, for example: elder brother in class 9'
          setErrors(next)
          if (Object.keys(next).length) return
          try {
            const result = await give.mutateAsync(undefined)
            alerts.success(
              result.awarded === 1 ? 'Given to 1 student' : `Given to ${result.awarded} students`,
              result.already_awarded
                ? { description: `${result.already_awarded} already had it` }
                : undefined
            )
            onClose()
          } catch (error) {
            const fields = formErrors(error, {
              BENEFIT_INACTIVE: 'benefit_id',
              YEAR_CLOSED: 'benefit_id',
            })
            const studentErrors = Object.entries(fields)
              .filter(([field]) => field.startsWith('student_ids.'))
              .map(([field, message]) => {
                const item = chosen[Number(field.split('.')[1])]
                return item ? `${item.name}: ${message}` : message
              })
            setErrors({
              ...fields,
              ...(studentErrors.length ? { student_ids: studentErrors.join('. ') } : {}),
            })
          }
        }}
      >
        <FormField
          id='award-benefit'
          label='Concession or scholarship'
          required
          error={errors.benefit_id}
        >
          <Combobox
            id='award-benefit'
            label='Concession or scholarship'
            value={benefitId ? String(benefitId) : undefined}
            options={benefits.map((item) => ({
              value: String(item.id),
              label: item.name,
              hint: `${BENEFIT_KINDS[item.kind]} · ${benefitValue(item)}`,
            }))}
            placeholder='Choose'
            invalid={Boolean(errors.benefit_id)}
            onChange={(value) => setBenefitId(value ? Number(value) : undefined)}
          />
        </FormField>
        <FormField id='award-student' label='Students' required error={errors.student_ids}>
          <Combobox
            id='award-student'
            label='Add a student'
            value={undefined}
            options={options}
            highlightSelected={false}
            onSearch={setQuery}
            placeholder='Search name or admission number to add'
            searchPlaceholder='Search students'
            emptyText={students.isPending ? 'Loading students…' : 'No matching students'}
            invalid={Boolean(errors.student_ids)}
            onChange={(value) => {
              const item = students.data?.items.find((other) => String(other.id) === value)
              if (!item) return
              setChosen((prev) => [
                ...prev,
                {
                  id: item.id,
                  name: item.full_name,
                  hint: [item.admission_no, item.class && `Class ${item.class.name}`]
                    .filter(Boolean)
                    .join(' · '),
                },
              ])
            }}
          />
        </FormField>
        {chosen.length > 0 && (
          <ul className='flex flex-wrap gap-1.5' aria-label='Students to give it to'>
            {chosen.map((item) => (
              <li
                key={item.id}
                className='inline-flex items-center gap-1 rounded-md border bg-muted/40 py-0.5 pr-1 pl-2 text-xs'
              >
                <span className='font-semibold'>{item.name}</span>
                <span className='text-muted-foreground'>{item.hint}</span>
                <Button
                  type='button'
                  size='sm'
                  variant='ghost'
                  className='size-6 p-0'
                  aria-label={`Remove ${item.name}`}
                  onClick={() => setChosen((prev) => prev.filter((other) => other.id !== item.id))}
                >
                  <X />
                </Button>
              </li>
            ))}
          </ul>
        )}
        <FormField id='award-reason' label='Reason' required error={errors.reason}>
          <Textarea
            id='award-reason'
            rows={2}
            maxLength={300}
            value={reason}
            placeholder='Elder brother in class 9'
            aria-invalid={Boolean(errors.reason) || undefined}
            onChange={(event) => setReason(event.target.value)}
          />
        </FormField>
      </form>
    </AppModal>
  )
}

function RevokeModal({ award, onClose }: { award: FeeAward; onClose: () => void }) {
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string>()
  const revoke = useFeesMutation(() => feesApi.revokeAward(award.id, reason.trim()))
  return (
    <AppModal
      open
      onOpenChange={(open) => !open && onClose()}
      title={`Withdraw ${award.benefit.name}?`}
      description={`${award.student.full_name} will not get it on invoices raised from now on. Invoices already raised keep their amounts.`}
      formId='fee-revoke-form'
      submitText='Withdraw'
      cancelText='Keep it'
      loading={revoke.isPending}
    >
      <form
        id='fee-revoke-form'
        noValidate
        onSubmit={async (event) => {
          event.preventDefault()
          if (reason.trim().length < 3) {
            setError('Give the reason, for example: sibling left the school')
            return
          }
          setError(undefined)
          try {
            await revoke.mutateAsync(undefined)
            alerts.success(`${award.benefit.name} withdrawn from ${award.student.full_name}`)
            onClose()
          } catch (caught) {
            const fields = formErrors(caught, { AWARD_REVOKED: 'reason' })
            setError(fields.reason)
          }
        }}
      >
        <FormField id='revoke-reason' label='Reason' required error={error}>
          <Textarea
            id='revoke-reason'
            autoFocus
            rows={3}
            maxLength={300}
            value={reason}
            placeholder='Sibling left the school'
            aria-invalid={Boolean(error) || undefined}
            onChange={(event) => setReason(event.target.value)}
          />
        </FormField>
      </form>
    </AppModal>
  )
}
