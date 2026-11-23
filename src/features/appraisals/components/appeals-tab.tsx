import { useState } from 'react'
import { Scale } from 'lucide-react'
import { AppModal } from '@/components/common/app-modal'
import { DataTable, type Column } from '@/components/common/data-table'
import { FormField } from '@/components/common/form-field'
import { SegmentedControl } from '@/components/common/segmented-control'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input, Textarea } from '@/components/ui/input'
import { alerts } from '@/lib/alerts'
import { toApiError } from '@/lib/api/errors'
import { formatDateTime } from '@/lib/format'
import { appraisalsApi, useAppeals, useAppraisalMutation, type Appeal, type AppealStatus } from '../api'
import { fieldMap } from '../labels'

const STATUS: Record<AppealStatus, { label: string; tone: 'danger' | 'success' | 'neutral' }> = {
  pending: { label: 'Waiting', tone: 'danger' },
  accepted: { label: 'Accepted', tone: 'success' },
  rejected: { label: 'Not accepted', tone: 'neutral' },
}

export function AppealsTab({ canFinalize, onOpen }: { canFinalize: boolean; onOpen: (appraisalId: number) => void }) {
  const [status, setStatus] = useState<AppealStatus>('pending')
  const appeals = useAppeals(status)
  const [deciding, setDeciding] = useState<Appeal | null>(null)

  const columns: Column<Appeal>[] = [
    {
      key: 'staff',
      header: 'Staff',
      cell: (row) => (
        <span className='grid min-w-0'>
          <span className='truncate font-semibold'>{row.staff.name}</span>
          <span className='truncate text-xs text-muted-foreground'>{row.cycle_title}</span>
        </span>
      ),
    },
    {
      key: 'reason',
      header: 'Reason',
      cell: (row) => (
        <span className='line-clamp-2 text-sm'>
          {row.reason}
          {row.requested_increment !== null && ` (asks ${row.requested_increment}%)`}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (row) => (
        <Badge tone={STATUS[row.status].tone} dot>
          {STATUS[row.status].label}
        </Badge>
      ),
    },
    { key: 'raised', header: 'Raised', hideBelow: 'lg', cell: (row) => formatDateTime(row.created_at) },
    {
      key: 'actions',
      header: '',
      cell: (row) =>
        canFinalize && row.status === 'pending' ? (
          <Button
            size='sm'
            onClick={(event) => {
              event.stopPropagation()
              setDeciding(row)
            }}
          >
            Decide
          </Button>
        ) : null,
    },
  ]

  return (
    <div className='grid gap-3'>
      <div className='px-4 pt-3'>
        <SegmentedControl
          label='Appeal status'
          value={status}
          onChange={(value: AppealStatus) => setStatus(value)}
          options={(Object.keys(STATUS) as AppealStatus[]).map((value) => ({ value, label: STATUS[value].label }))}
        />
      </div>
      <DataTable
        rows={appeals.data?.items ?? []}
        columns={columns}
        rowKey={(row) => row.id}
        loading={appeals.isPending}
        error={appeals.error?.message}
        onRetry={() => void appeals.refetch()}
        onRowClick={(row) => onOpen(row.appraisal_id)}
        empty={{ icon: Scale, title: 'No appeals here', description: 'Staff appeal a published result from the app.' }}
        card={(row) => (
          <div className='grid gap-1'>
            <span className='font-semibold'>{row.staff.name}</span>
            <span className='text-xs text-muted-foreground'>{row.reason}</span>
          </div>
        )}
      />
      {deciding && <DecideModal appeal={deciding} onClose={() => setDeciding(null)} />}
    </div>
  )
}

function DecideModal({ appeal, onClose }: { appeal: Appeal; onClose: () => void }) {
  const [decision, setDecision] = useState<'accept' | 'reject'>('accept')
  const [note, setNote] = useState('')
  const [increment, setIncrement] = useState(appeal.requested_increment === null ? '' : String(appeal.requested_increment))
  const [errors, setErrors] = useState<Record<string, string>>({})
  const decide = useAppraisalMutation(appraisalsApi.decideAppeal)

  const submit = async () => {
    if (note.trim().length < 2) return setErrors({ note: 'Write what you decided and why' })
    try {
      const done = await decide.mutateAsync({
        id: appeal.id,
        decision,
        note: note.trim(),
        increment_percent: decision === 'accept' && increment !== '' ? Number(increment) : undefined,
      })
      alerts.success(done.message)
      onClose()
    } catch (error) {
      const apiError = toApiError(error)
      setErrors(fieldMap(apiError.fieldErrors))
      alerts.error(apiError.message)
    }
  }

  return (
    <AppModal
      open
      onOpenChange={(open) => !open && !decide.isPending && onClose()}
      title={`Appeal from ${appeal.staff.name}`}
      description={appeal.reason}
      formId='appeal-decide-form'
      submitText='Send decision'
      loading={decide.isPending}
    >
      <form
        id='appeal-decide-form'
        className='grid gap-4'
        onSubmit={(event) => {
          event.preventDefault()
          void submit()
        }}
      >
        <FormField id='appeal-decision' label='Decision'>
          <SegmentedControl
            label='Decision'
            value={decision}
            onChange={(value: 'accept' | 'reject') => setDecision(value)}
            options={[
              { value: 'accept', label: 'Accept' },
              { value: 'reject', label: 'Do not accept' },
            ]}
          />
        </FormField>
        {decision === 'accept' && (
          <FormField
            id='appeal-increment'
            label='Increment %'
            hint='The published KRA scores stay; set the revised increment here'
          >
            <Input id='appeal-increment' type='number' min={0} max={100} step='0.5' value={increment} onChange={(event) => setIncrement(event.target.value)} />
          </FormField>
        )}
        <FormField id='appeal-note' label='Note to the staff member' required error={errors.note}>
          <Textarea id='appeal-note' rows={3} value={note} onChange={(event) => setNote(event.target.value)} />
        </FormField>
      </form>
    </AppModal>
  )
}
