import { useState, type FormEvent } from 'react'
import { AppModal } from '@/components/common/app-modal'
import { FormField } from '@/components/common/form-field'
import { Input, Textarea } from '@/components/ui/input'
import { alerts } from '@/lib/alerts'
import { toApiError } from '@/lib/api/errors'
import { inventoryApi, useInventoryMutation, type Requisition } from '../api'
import { qty } from '../labels'
import { isDecimal, remaining } from './stock-form'
import { FormAlert } from './stock-lines'

const APPROVE_FORM = 'requisition-approve-form'
const ISSUE_FORM = 'requisition-issue-form'

export function ApproveRequisitionModal({
  open,
  onOpenChange,
  requisition,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  requisition: Requisition | null
}) {
  const approve = useInventoryMutation(
    (input: { lines: { item_id: number; approved_quantity: number }[]; note: string | null }) =>
      inventoryApi.approveRequisition(requisition!.id, input)
  )
  return (
    <AppModal
      open={open}
      onOpenChange={onOpenChange}
      title={requisition ? `Approve ${requisition.requisition_no}` : 'Approve requisition'}
      description='Lower a quantity to give less; 0 drops the item.'
      formId={APPROVE_FORM}
      submitText='Approve'
      loading={approve.isPending}
      size='lg'
    >
      {open && requisition && (
        <ApproveForm
          requisition={requisition}
          onSubmit={async (input) => {
            await approve.mutateAsync(input)
            alerts.success('Requisition approved')
            onOpenChange(false)
          }}
        />
      )}
    </AppModal>
  )
}

function ApproveForm({
  requisition,
  onSubmit,
}: {
  requisition: Requisition
  onSubmit: (input: {
    lines: { item_id: number; approved_quantity: number }[]
    note: string | null
  }) => Promise<void>
}) {
  const [amounts, setAmounts] = useState(() =>
    requisition.lines.map((line) => String(line.quantity))
  )
  const [note, setNote] = useState('')
  const [errors, setErrors] = useState<(string | undefined)[]>([])
  const [rootError, setRootError] = useState<string>()

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    const next = amounts.map((value) => (isDecimal(value) ? undefined : 'Enter 0 or more'))
    setErrors(next)
    if (next.some(Boolean)) return
    if (amounts.every((value) => Number(value) === 0)) {
      setRootError('Approve at least one item, or reject the requisition instead')
      return
    }
    setRootError(undefined)
    try {
      await onSubmit({
        lines: requisition.lines.map((line, index) => ({
          item_id: line.item.id,
          approved_quantity: Number(amounts[index]),
        })),
        note: note.trim() || null,
      })
    } catch (error) {
      setRootError(toApiError(error).message)
    }
  }

  return (
    <form id={APPROVE_FORM} onSubmit={submit} noValidate className='grid gap-4'>
      <FormAlert message={rootError} />
      <ul className='grid divide-y rounded-lg border'>
        {requisition.lines.map((line, index) => (
          <li
            key={line.item.id}
            className='grid gap-2 px-3 py-2.5 sm:grid-cols-[minmax(0,1fr)_8rem] sm:items-center'
          >
            <span className='grid min-w-0'>
              <span className='truncate font-semibold'>{line.item.name}</span>
              <span className='text-xs text-muted-foreground'>
                Asked {qty(line.quantity, line.unit)} · {qty(line.available, line.unit)} in store
              </span>
            </span>
            <div className='grid gap-1'>
              <Input
                aria-label={`Approved quantity of ${line.item.name}`}
                inputMode='decimal'
                className='tabular'
                value={amounts[index]}
                aria-invalid={Boolean(errors[index])}
                onChange={(event) =>
                  setAmounts(
                    amounts.map((value, at) => (at === index ? event.target.value : value))
                  )
                }
              />
              {errors[index] && (
                <p role='alert' className='text-xs font-medium text-destructive'>
                  {errors[index]}
                </p>
              )}
            </div>
          </li>
        ))}
      </ul>
      <FormField id='approve-note' label='Note (optional)'>
        <Textarea
          id='approve-note'
          maxLength={255}
          value={note}
          onChange={(event) => setNote(event.target.value)}
        />
      </FormField>
    </form>
  )
}

export function IssueRequisitionModal({
  open,
  onOpenChange,
  requisition,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  requisition: Requisition | null
}) {
  const issue = useInventoryMutation((lines: { item_id: number; quantity: number }[]) =>
    inventoryApi.issueRequisition(requisition!.id, { lines })
  )
  return (
    <AppModal
      open={open}
      onOpenChange={onOpenChange}
      title={requisition ? `Issue ${requisition.requisition_no}` : 'Issue requisition'}
      description='Give all of it now, or part; the rest can be issued later.'
      formId={ISSUE_FORM}
      submitText='Issue stock'
      loading={issue.isPending}
      size='lg'
    >
      {open && requisition && (
        <IssueForm
          requisition={requisition}
          onSubmit={async (lines) => {
            const saved = await issue.mutateAsync(lines)
            alerts.success(saved.status === 'issued' ? 'Requisition issued' : 'Part issued')
            onOpenChange(false)
          }}
        />
      )}
    </AppModal>
  )
}

function IssueForm({
  requisition,
  onSubmit,
}: {
  requisition: Requisition
  onSubmit: (lines: { item_id: number; quantity: number }[]) => Promise<void>
}) {
  const lines = requisition.lines.filter((line) => remaining(line) > 0)
  const [amounts, setAmounts] = useState(() =>
    lines.map((line) => String(Math.min(remaining(line), Math.max(0, line.available))))
  )
  const [errors, setErrors] = useState<(string | undefined)[]>([])
  const [rootError, setRootError] = useState<string>()

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    const next = amounts.map((value, index) =>
      !isDecimal(value)
        ? 'Enter 0 or more'
        : Number(value) > remaining(lines[index])
          ? `At most ${remaining(lines[index])}`
          : undefined
    )
    setErrors(next)
    if (next.some(Boolean)) return
    if (amounts.every((value) => Number(value) === 0)) {
      setRootError('Enter a quantity for at least one item')
      return
    }
    setRootError(undefined)
    try {
      await onSubmit(
        lines.map((line, index) => ({ item_id: line.item.id, quantity: Number(amounts[index]) }))
      )
    } catch (error) {
      setRootError(toApiError(error).message)
    }
  }

  return (
    <form id={ISSUE_FORM} onSubmit={submit} noValidate className='grid gap-4'>
      <FormAlert message={rootError} />
      {lines.length === 0 ? (
        <p className='text-sm text-muted-foreground'>Everything on this requisition is issued.</p>
      ) : (
        <ul className='grid divide-y rounded-lg border'>
          {lines.map((line, index) => (
            <li
              key={line.item.id}
              className='grid gap-2 px-3 py-2.5 sm:grid-cols-[minmax(0,1fr)_8rem] sm:items-center'
            >
              <span className='grid min-w-0'>
                <span className='truncate font-semibold'>{line.item.name}</span>
                <span className='text-xs text-muted-foreground'>
                  Due {qty(remaining(line), line.unit)} ·{' '}
                  <span className={line.available < remaining(line) ? 'text-destructive' : ''}>
                    {qty(line.available, line.unit)} in store
                  </span>
                </span>
              </span>
              <div className='grid gap-1'>
                <Input
                  aria-label={`Quantity of ${line.item.name} to give`}
                  inputMode='decimal'
                  className='tabular'
                  value={amounts[index]}
                  aria-invalid={Boolean(errors[index])}
                  onChange={(event) =>
                    setAmounts(
                      amounts.map((value, at) => (at === index ? event.target.value : value))
                    )
                  }
                />
                {errors[index] && (
                  <p role='alert' className='text-xs font-medium text-destructive'>
                    {errors[index]}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </form>
  )
}
