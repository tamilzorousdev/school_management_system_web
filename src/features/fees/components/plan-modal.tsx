import { useState } from 'react'
import { CalendarPlus, CheckCircle2, History, Send, Trash2, Undo2 } from 'lucide-react'
import { AppModal } from '@/components/common/app-modal'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import { ErrorState } from '@/components/common/display'
import { FormField } from '@/components/common/form-field'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DialogFooter } from '@/components/ui/dialog'
import { Input, Textarea } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { alerts } from '@/lib/alerts'
import { formatDate, formatDateTime } from '@/lib/format'
import type { FeeAccess } from '../access'
import {
  feesApi,
  useFeesMutation,
  useFeePlan,
  usePlanVersions,
  type FeeHead,
  type FeePlan,
  type FeePlanLineInput,
  type FeePlanVersion,
} from '../api'
import { MAX_AMOUNT, PLAN_VERSION_STATUS, amountError, formErrors, round2, rupees } from '../labels'

const FORM_ID = 'fee-plan-form'
const REVIEW_FORM_ID = 'fee-plan-review-form'
const LINE_FIELD = /^lines\.(\d+)\.(\w+)$/

interface InstallmentDraft {
  key: number
  name: string
  due_date: string
  amounts: Record<number, string>
}

interface PlanLineLike {
  fee_head_id: number
  installment: string
  amount: number
  due_date: string
}

type NamedLine = PlanLineLike & { head_name: string }

const amountOf = (value: string | undefined) => {
  const number = Number(value)
  return !value?.trim() || Number.isNaN(number) ? 0 : number
}

function draftsOf(lines: PlanLineLike[]): InstallmentDraft[] {
  const groups = new Map<string, InstallmentDraft>()
  for (const line of lines) {
    const draft = groups.get(line.installment) ?? {
      key: groups.size + 1,
      name: line.installment,
      due_date: line.due_date,
      amounts: {},
    }
    draft.amounts[line.fee_head_id] = String(line.amount)
    groups.set(line.installment, draft)
  }
  const drafts = [...groups.values()].sort((a, b) => a.due_date.localeCompare(b.due_date))
  return drafts.length ? drafts : [{ key: 1, name: 'Term 1', due_date: '', amounts: {} }]
}

export function PlanModal({
  classId,
  className,
  heads,
  access,
  onClose,
}: {
  classId: number
  className: string
  heads: FeeHead[]
  access: FeeAccess
  onClose: () => void
}) {
  const plan = useFeePlan(classId)
  const draft = plan.data?.draft ?? null
  const pending = draft?.status === 'pending_approval'
  const editing = Boolean(plan.data) && access.configure && !pending
  const reviewing = pending && access.approve
  const ownFooter = editing || reviewing

  return (
    <AppModal
      open
      onOpenChange={(open) => !open && onClose()}
      title={`Fee plan for class ${className}`}
      description={
        plan.data
          ? `${plan.data.academic_year}. Amounts per student for each installment. Transport is added from each student’s bus stop when invoices are raised. Changes are used only after they are approved.`
          : undefined
      }
      size='xl'
      footer={
        ownFooter ? null : (
          <DialogFooter>
            <Button onClick={onClose}>Done</Button>
          </DialogFooter>
        )
      }
    >
      {plan.isPending ? (
        <div className='grid gap-3'>
          <Skeleton className='h-10' />
          <Skeleton className='h-40' />
        </div>
      ) : plan.isError || !plan.data ? (
        <ErrorState message={plan.error?.message ?? 'Not found'} onRetry={() => plan.refetch()} />
      ) : (
        <div className='grid min-w-0 gap-4'>
          <PlanStatus plan={plan.data} />
          {editing ? (
            <PlanForm
              key={draft?.id ?? 'published'}
              plan={plan.data}
              heads={heads}
              onClose={onClose}
            />
          ) : pending && draft ? (
            <PendingReview
              plan={plan.data}
              draft={draft}
              canApprove={access.approve}
              onClose={onClose}
            />
          ) : (
            <PlanLines lines={plan.data.lines} />
          )}
          <VersionHistory classId={classId} />
        </div>
      )}
    </AppModal>
  )
}

function PlanStatus({ plan }: { plan: FeePlan }) {
  const draft = plan.draft
  return (
    <div className='grid gap-2'>
      <div className='flex flex-wrap items-center gap-2 text-sm'>
        {plan.version ? (
          <Badge tone='success'>Version {plan.version} in use</Badge>
        ) : (
          !plan.lines.length && <Badge tone='neutral'>No plan in use yet</Badge>
        )}
        {draft && (
          <Badge tone={PLAN_VERSION_STATUS[draft.status].tone}>
            Version {draft.version}: {PLAN_VERSION_STATUS[draft.status].label.toLowerCase()}
          </Badge>
        )}
        <span className='text-muted-foreground'>
          In use:{' '}
          <span className='tabular font-semibold text-foreground'>{rupees(plan.total)}</span> a year
        </span>
      </div>
      {draft?.status === 'draft' && draft.review_comment && (
        <p className='rounded-lg border border-warning/40 bg-warning/10 px-3 py-2 text-sm'>
          <span className='font-semibold'>
            Sent back{draft.reviewed_by ? ` by ${draft.reviewed_by.name}` : ''}:
          </span>{' '}
          {draft.review_comment}
        </p>
      )}
    </div>
  )
}

function PlanForm({
  plan,
  heads,
  onClose,
}: {
  plan: FeePlan
  heads: FeeHead[]
  onClose: () => void
}) {
  const classId = plan.class_id
  const draft = plan.draft
  const source: PlanLineLike[] = draft ? draft.lines : plan.lines
  const [drafts, setDrafts] = useState<InstallmentDraft[]>(() => draftsOf(source))
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [discarding, setDiscarding] = useState(false)
  const save = useFeesMutation((lines: FeePlanLineInput[]) => feesApi.setPlan(classId, lines))
  const submit = useFeesMutation(() => feesApi.submitPlan(classId))
  const discard = useFeesMutation(() => feesApi.discardPlanDraft(classId))
  const planHeadIds = new Set(source.map((line) => line.fee_head_id))
  const columns = heads.filter(
    (head) =>
      !head.is_transport &&
      ((head.is_active &&
        (!head.applicable_class_ids.length || head.applicable_class_ids.includes(classId))) ||
        planHeadIds.has(head.id))
  )
  const busy = save.isPending || submit.isPending || discard.isPending

  const update = (key: number, patch: Partial<InstallmentDraft>) =>
    setDrafts((prev) => prev.map((item) => (item.key === key ? { ...item, ...patch } : item)))
  const subtotal = (item: InstallmentDraft) =>
    round2(columns.reduce((sum, head) => sum + amountOf(item.amounts[head.id]), 0))
  const total = round2(drafts.reduce((sum, item) => sum + subtotal(item), 0))

  return (
    <form
      id={FORM_ID}
      noValidate
      className='grid min-w-0 gap-4'
      onSubmit={async (event) => {
        event.preventDefault()
        const intent = (event.nativeEvent as SubmitEvent).submitter?.getAttribute('value')
        const next: Record<string, string> = {}
        const names = new Set<string>()
        for (const item of drafts) {
          const name = item.name.trim()
          if (!name) next[`${item.key}.name`] = 'Enter the installment name'
          else if (names.has(name.toLowerCase())) next[`${item.key}.name`] = 'Name used twice'
          names.add(name.toLowerCase())
          if (!item.due_date) next[`${item.key}.due_date`] = 'Choose the due date'
          for (const head of columns) {
            const value = item.amounts[head.id] ?? ''
            const message = value.trim() ? amountError(value, MAX_AMOUNT) : undefined
            if (message) next[`${item.key}.${head.id}`] = message
          }
        }
        setErrors(next)
        if (Object.keys(next).length) return
        const lines = drafts.flatMap((item) =>
          columns
            .filter((head) => amountOf(item.amounts[head.id]) > 0)
            .map((head) => ({
              fee_head_id: head.id,
              installment: item.name.trim(),
              amount: amountOf(item.amounts[head.id]),
              due_date: item.due_date,
            }))
        )
        try {
          await save.mutateAsync(lines)
        } catch (error) {
          setErrors(mapLineErrors(error, lines, drafts))
          return
        }
        if (intent !== 'submit') {
          alerts.success('Draft saved', {
            description:
              'Send it for approval when it is ready. Invoices still use the plan in use.',
          })
          return
        }
        try {
          await submit.mutateAsync(undefined)
          alerts.success('Sent for approval', {
            description: `${drafts.length} installments · ${rupees(total)} a year. It is used for invoices once approved.`,
          })
          onClose()
        } catch (error) {
          setErrors(mapLineErrors(error, lines, drafts))
        }
      }}
    >
      {!columns.length && (
        <p className='rounded-lg border bg-muted/40 px-3 py-2 text-sm text-muted-foreground'>
          Add a fee head such as tuition first.
        </p>
      )}
      {drafts.map((item) => (
        <fieldset key={item.key} className='grid min-w-0 gap-3 rounded-xl border p-3 sm:p-4'>
          <legend className='sr-only'>{item.name || 'Installment'}</legend>
          <div className='grid gap-3 sm:grid-cols-[1fr_12rem_auto] sm:items-start'>
            <FormField
              id={`plan-${item.key}-name`}
              label='Installment'
              required
              error={errors[`${item.key}.name`]}
            >
              <Input
                id={`plan-${item.key}-name`}
                value={item.name}
                maxLength={40}
                placeholder='Term 1'
                aria-invalid={Boolean(errors[`${item.key}.name`]) || undefined}
                onChange={(event) => update(item.key, { name: event.target.value })}
              />
            </FormField>
            <FormField
              id={`plan-${item.key}-due`}
              label='Due date'
              required
              error={errors[`${item.key}.due_date`]}
            >
              <Input
                id={`plan-${item.key}-due`}
                type='date'
                value={item.due_date}
                aria-invalid={Boolean(errors[`${item.key}.due_date`]) || undefined}
                onChange={(event) => update(item.key, { due_date: event.target.value })}
              />
            </FormField>
            <Button
              type='button'
              variant='ghost'
              size='sm'
              className='text-destructive hover:bg-destructive/10 sm:mt-6'
              disabled={drafts.length === 1}
              aria-label={`Remove ${item.name || 'installment'}`}
              onClick={() => setDrafts((prev) => prev.filter((other) => other.key !== item.key))}
            >
              <Trash2 />
              Remove
            </Button>
          </div>
          <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-3'>
            {columns.map((head) => {
              const id = `plan-${item.key}-${head.id}`
              return (
                <FormField
                  key={head.id}
                  id={id}
                  label={head.is_active ? head.name : `${head.name} (switched off)`}
                  error={errors[`${item.key}.${head.id}`]}
                >
                  <div className='relative'>
                    <span className='pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-muted-foreground'>
                      ₹
                    </span>
                    <Input
                      id={id}
                      type='number'
                      inputMode='decimal'
                      min={0}
                      step='0.01'
                      placeholder='0'
                      className='tabular pl-7'
                      value={item.amounts[head.id] ?? ''}
                      aria-invalid={Boolean(errors[`${item.key}.${head.id}`]) || undefined}
                      onChange={(event) =>
                        update(item.key, {
                          amounts: { ...item.amounts, [head.id]: event.target.value },
                        })
                      }
                    />
                  </div>
                </FormField>
              )
            })}
          </div>
          <div className='flex justify-end text-sm'>
            <span className='text-muted-foreground'>
              {item.name.trim() || 'Installment'} total{' '}
              <span className='tabular font-bold text-foreground'>{rupees(subtotal(item))}</span>
            </span>
          </div>
        </fieldset>
      ))}
      <div className='flex flex-wrap items-center justify-between gap-3'>
        <Button
          type='button'
          variant='outline'
          onClick={() =>
            setDrafts((prev) => [
              ...prev,
              {
                key: Math.max(0, ...prev.map((other) => other.key)) + 1,
                name: `Term ${prev.length + 1}`,
                due_date: '',
                amounts: {},
              },
            ])
          }
        >
          <CalendarPlus />
          Add installment
        </Button>
        <span className='text-sm text-muted-foreground'>
          Year total{' '}
          <span className='tabular text-base font-extrabold text-foreground'>{rupees(total)}</span>
          {total !== plan.total && (
            <span className='ml-1 text-xs'>(in use: {rupees(plan.total)})</span>
          )}
        </span>
      </div>
      <DialogFooter className='flex-wrap gap-2'>
        {draft && (
          <Button
            type='button'
            variant='ghost'
            className='text-destructive hover:bg-destructive/10 sm:mr-auto'
            disabled={busy}
            onClick={() => setDiscarding(true)}
          >
            <Trash2 />
            Discard draft
          </Button>
        )}
        <Button type='button' variant='outline' disabled={busy} onClick={onClose}>
          Close
        </Button>
        <Button
          type='submit'
          variant='outline'
          value='save'
          disabled={busy}
          loading={save.isPending && !submit.isPending}
        >
          Save draft
        </Button>
        <Button type='submit' value='submit' disabled={busy} loading={submit.isPending}>
          <Send />
          Send for approval
        </Button>
      </DialogFooter>
      <ConfirmDialog
        open={discarding}
        onOpenChange={setDiscarding}
        title='Discard this draft?'
        description='Your changes are thrown away. The plan in use stays as it is.'
        confirmText='Discard draft'
        destructive
        loading={discard.isPending}
        onConfirm={async () => {
          try {
            await discard.mutateAsync(undefined)
            alerts.success('Draft discarded')
            setDiscarding(false)
            onClose()
          } catch (error) {
            formErrors(error)
          }
        }}
      />
    </form>
  )
}

function mapLineErrors(
  error: unknown,
  lines: FeePlanLineInput[],
  drafts: InstallmentDraft[]
): Record<string, string> {
  const fields = formErrors(error)
  const mapped: Record<string, string> = {}
  for (const [field, message] of Object.entries(fields)) {
    const match = field.match(LINE_FIELD)
    const line = match ? lines[Number(match[1])] : undefined
    const item = line && drafts.find((other) => other.name.trim() === line.installment)
    if (!match || !item || !line) {
      alerts.error(message)
      continue
    }
    mapped[
      match[2] === 'fee_head_id' || match[2] === 'amount'
        ? `${item.key}.${line.fee_head_id}`
        : `${item.key}.${match[2] === 'installment' ? 'name' : 'due_date'}`
    ] = message
  }
  return mapped
}

function PendingReview({
  plan,
  draft,
  canApprove,
  onClose,
}: {
  plan: FeePlan
  draft: FeePlanVersion
  canApprove: boolean
  onClose: () => void
}) {
  const [comment, setComment] = useState('')
  const [error, setError] = useState<string>()
  const approve = useFeesMutation(() => feesApi.approvePlan(plan.class_id, comment.trim()))
  const reject = useFeesMutation(() => feesApi.rejectPlan(plan.class_id, comment.trim()))
  const busy = approve.isPending || reject.isPending

  return (
    <form
      id={REVIEW_FORM_ID}
      noValidate
      className='grid min-w-0 gap-4'
      onSubmit={async (event) => {
        event.preventDefault()
        const intent = (event.nativeEvent as SubmitEvent).submitter?.getAttribute('value')
        if (intent === 'reject' && comment.trim().length < 3) {
          setError('Say what needs to change before sending it back')
          return
        }
        setError(undefined)
        try {
          if (intent === 'reject') {
            await reject.mutateAsync(undefined)
            alerts.success('Sent back as a draft')
          } else {
            await approve.mutateAsync(undefined)
            alerts.success('Fee plan approved', {
              description: `Version ${draft.version} is now used for invoices raised from now on.`,
            })
          }
          onClose()
        } catch (caught) {
          const fields = formErrors(caught, {
            SELF_APPROVAL: 'comment',
            PLAN_NOT_PENDING: 'comment',
          })
          if (fields.comment) setError(fields.comment)
        }
      }}
    >
      <div className='rounded-lg border bg-muted/40 px-3 py-2 text-sm'>
        <span className='font-semibold'>Version {draft.version} is waiting for approval.</span>{' '}
        <span className='text-muted-foreground'>
          Sent{draft.submitted_by ? ` by ${draft.submitted_by.name}` : ''}
          {draft.submitted_at ? ` on ${formatDateTime(draft.submitted_at)}` : ''}.
          {draft.note ? ` “${draft.note}”` : ''}
        </span>
      </div>
      <PlanLines lines={draft.lines} compareTo={plan.lines} />
      <p className='text-right text-sm text-muted-foreground'>
        Year total{' '}
        <span className='tabular text-base font-extrabold text-foreground'>
          {rupees(draft.total)}
        </span>{' '}
        <span className='text-xs'>(in use: {rupees(plan.total)})</span>
      </p>
      {canApprove ? (
        <>
          <FormField id='plan-review-comment' label='Comment' error={error}>
            <Textarea
              id='plan-review-comment'
              rows={2}
              maxLength={300}
              value={comment}
              placeholder='Needed when sending it back, for example: Term 3 due date is a holiday'
              aria-invalid={Boolean(error) || undefined}
              onChange={(event) => setComment(event.target.value)}
            />
          </FormField>
          <DialogFooter className='flex-wrap gap-2'>
            <Button type='button' variant='outline' disabled={busy} onClick={onClose}>
              Close
            </Button>
            <Button
              type='submit'
              variant='outline'
              value='reject'
              disabled={busy}
              loading={reject.isPending}
            >
              <Undo2 />
              Send back
            </Button>
            <Button type='submit' value='approve' disabled={busy} loading={approve.isPending}>
              <CheckCircle2 />
              Approve
            </Button>
          </DialogFooter>
        </>
      ) : (
        <p className='text-sm text-muted-foreground'>
          The AO or school admin approves it. You can edit it again if it is sent back.
        </p>
      )}
    </form>
  )
}

function PlanLines({ lines, compareTo }: { lines: NamedLine[]; compareTo?: NamedLine[] }) {
  if (!lines.length) {
    return <p className='text-sm text-muted-foreground'>No fee lines.</p>
  }
  const previous = new Map(
    (compareTo ?? []).map((line) => [`${line.fee_head_id}|${line.installment}`, line])
  )
  const groups = new Map<string, { due_date: string; lines: NamedLine[] }>()
  for (const line of [...lines].sort((a, b) => a.due_date.localeCompare(b.due_date))) {
    const group = groups.get(line.installment) ?? { due_date: line.due_date, lines: [] }
    group.lines.push(line)
    groups.set(line.installment, group)
  }
  const removed = (compareTo ?? []).filter(
    (line) =>
      !lines.some(
        (other) => other.fee_head_id === line.fee_head_id && other.installment === line.installment
      )
  )
  return (
    <div className='overflow-x-auto rounded-lg border'>
      <table className='w-full text-sm'>
        <thead className='bg-muted/40 text-left text-xs text-muted-foreground'>
          <tr>
            <th className='px-3 py-2 font-semibold'>Installment</th>
            <th className='px-3 py-2 font-semibold'>Fee head</th>
            <th className='px-3 py-2 text-right font-semibold'>Amount</th>
          </tr>
        </thead>
        <tbody className='divide-y'>
          {[...groups.entries()].map(([installment, group]) =>
            group.lines.map((line, index) => {
              const old = previous.get(`${line.fee_head_id}|${line.installment}`)
              const changed =
                Boolean(compareTo) &&
                (!old || old.amount !== line.amount || old.due_date !== line.due_date)
              return (
                <tr key={`${installment}-${line.fee_head_id}`}>
                  <td className='px-3 py-2 align-top'>
                    {index === 0 && (
                      <span className='grid'>
                        <span className='font-semibold'>{installment}</span>
                        <span className='text-xs text-muted-foreground'>
                          Due {formatDate(group.due_date)}
                        </span>
                      </span>
                    )}
                  </td>
                  <td className='px-3 py-2'>{line.head_name}</td>
                  <td className='tabular px-3 py-2 text-right'>
                    <span className={changed ? 'font-bold' : undefined}>{rupees(line.amount)}</span>
                    {changed && (
                      <span className='block text-xs text-muted-foreground'>
                        {old
                          ? old.amount !== line.amount
                            ? `was ${rupees(old.amount)}`
                            : `was due ${formatDate(old.due_date)}`
                          : 'new'}
                      </span>
                    )}
                  </td>
                </tr>
              )
            })
          )}
          {removed.map((line) => (
            <tr
              key={`removed-${line.installment}-${line.fee_head_id}`}
              className='text-muted-foreground'
            >
              <td className='px-3 py-2'>{line.installment}</td>
              <td className='px-3 py-2 line-through'>{line.head_name}</td>
              <td className='tabular px-3 py-2 text-right'>
                <span className='line-through'>{rupees(line.amount)}</span>
                <span className='block text-xs'>removed</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function VersionHistory({ classId }: { classId: number }) {
  const [open, setOpen] = useState(false)
  const versions = usePlanVersions(classId, open)
  return (
    <div className='grid gap-2'>
      <Button
        type='button'
        variant='ghost'
        size='sm'
        className='justify-self-start'
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <History />
        {open ? 'Hide history' : 'Show history'}
      </Button>
      {open &&
        (versions.isPending ? (
          <Skeleton className='h-16' />
        ) : versions.isError ? (
          <ErrorState message={versions.error.message} onRetry={() => versions.refetch()} />
        ) : versions.data.length ? (
          <ul className='grid gap-2 rounded-lg border p-3 text-sm'>
            {versions.data.map((version) => (
              <li key={version.id} className='flex flex-wrap items-center gap-2'>
                <span className='font-semibold'>Version {version.version}</span>
                <Badge tone={PLAN_VERSION_STATUS[version.status].tone}>
                  {PLAN_VERSION_STATUS[version.status].label}
                </Badge>
                <span className='tabular'>{rupees(version.total)} a year</span>
                <span className='text-xs text-muted-foreground'>
                  {[
                    version.created_by && `drafted by ${version.created_by.name}`,
                    version.submitted_by && `sent by ${version.submitted_by.name}`,
                    version.reviewed_by &&
                      `${version.status === 'draft' ? 'sent back' : 'approved'} by ${version.reviewed_by.name}`,
                    version.published_at && `in use from ${formatDateTime(version.published_at)}`,
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className='text-sm text-muted-foreground'>No changes recorded yet.</p>
        ))}
    </div>
  )
}
