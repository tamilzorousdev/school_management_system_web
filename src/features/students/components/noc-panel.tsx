import { useState } from 'react'
import {
  Ban,
  CircleCheck,
  Clock3,
  FileCheck2,
  Printer,
  ShieldAlert,
  Undo2,
  type LucideIcon,
} from 'lucide-react'
import { AppModal } from '@/components/common/app-modal'
import { FormField } from '@/components/common/form-field'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { alerts } from '@/lib/alerts'
import { toApiError } from '@/lib/api/errors'
import { openFile } from '@/lib/files'
import { formatDate, formatDateTime } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useStudentMutation, type StudentDetail } from '../api'
import {
  EXIT_TYPE_LABELS,
  NOC_DEPARTMENT_HINTS,
  NOC_DEPARTMENT_LABELS,
  NOC_STATUS,
} from '../labels'
import {
  recordsApi,
  studentFiles,
  useStudentNoc,
  type ClearNocItemInput,
  type NocDepartment,
  type NocItem,
} from '../records-api'

export function NocPanel({
  student,
  canManage,
  onIssueTc,
}: {
  student: StudentDetail
  canManage: boolean
  onIssueTc: () => void
}) {
  const noc = useStudentNoc(student.id, true)
  const [clearing, setClearing] = useState<NocItem | null>(null)
  const [cancelling, setCancelling] = useState(false)
  const reopen = useStudentMutation((department: NocDepartment) =>
    recordsApi.reopenNocItem(student.id, department)
  )

  if (noc.isPending) return <Skeleton className='h-72 w-full rounded-xl' />
  if (!noc.data) {
    return (
      <Card className='p-4 text-sm text-muted-foreground'>
        {noc.error ? toApiError(noc.error).message : 'No leaving request found.'}
      </Card>
    )
  }

  const data = noc.data
  const total = data.items.length
  const cleared = data.status === 'cleared'
  const status = NOC_STATUS[cleared ? 'cleared' : 'open']

  return (
    <Card className='grid gap-4 border-warning/40 p-4 sm:p-5'>
      <div className='flex flex-wrap items-start justify-between gap-3'>
        <div className='grid min-w-0 gap-1'>
          <div className='flex flex-wrap items-center gap-2'>
            <h2 className='text-base font-semibold'>Leaving request (NOC)</h2>
            <Badge tone={status.tone} dot>
              {status.label}
            </Badge>
          </div>
          <p className='text-sm text-muted-foreground'>
            {EXIT_TYPE_LABELS[data.exit_type]} · leaving {formatDate(data.leaving_date)} ·{' '}
            {data.reason}
          </p>
          <p className='text-xs text-muted-foreground'>
            Started {formatDateTime(data.requested_at)}
            {data.requested_by_name ? ` by ${data.requested_by_name}` : ''}
          </p>
        </div>
        <div className='grid justify-items-end gap-1'>
          <span className='text-sm font-semibold'>
            {data.cleared_count} of {total} cleared
          </span>
          <div
            className='h-2 w-36 overflow-hidden rounded-full bg-muted'
            role='progressbar'
            aria-valuemin={0}
            aria-valuemax={total}
            aria-valuenow={data.cleared_count}
            aria-label='Departments cleared'
          >
            <div
              className='h-full rounded-full bg-success transition-[width]'
              style={{ width: `${total ? (data.cleared_count / total) * 100 : 0}%` }}
            />
          </div>
        </div>
      </div>

      <ul className='divide-y rounded-lg border'>
        {data.items.map((item) => (
          <NocRow
            key={item.department}
            item={item}
            reopening={reopen.isPending && reopen.variables === item.department}
            onClear={() => setClearing(item)}
            onReopen={async () => {
              try {
                await reopen.mutateAsync(item.department)
                alerts.success(`${NOC_DEPARTMENT_LABELS[item.department]} reopened`)
              } catch (error) {
                alerts.error(toApiError(error).message)
              }
            }}
          />
        ))}
      </ul>

      <div className='flex flex-col-reverse gap-2 sm:flex-row sm:flex-wrap sm:justify-end'>
        {canManage && (
          <Button variant='ghost' onClick={() => setCancelling(true)}>
            <Ban />
            Cancel request
          </Button>
        )}
        <Button
          variant='outline'
          onClick={() =>
            void openFile(studentFiles.noc(student.id)).catch((error: unknown) =>
              alerts.error(toApiError(error).message)
            )
          }
        >
          <Printer />
          Print NOC
        </Button>
        {canManage && (
          <Button disabled={!cleared} onClick={onIssueTc}>
            <FileCheck2 />
            Issue TC
          </Button>
        )}
      </div>
      {canManage && !cleared && (
        <p className='text-xs text-muted-foreground sm:text-right'>
          The TC can be issued once every department has cleared.
        </p>
      )}

      <ClearLineModal studentId={student.id} item={clearing} onClose={() => setClearing(null)} />
      <CancelNocModal
        studentId={student.id}
        open={cancelling}
        onClose={() => setCancelling(false)}
      />
    </Card>
  )
}

function NocRow({
  item,
  reopening,
  onClear,
  onReopen,
}: {
  item: NocItem
  reopening: boolean
  onClear: () => void
  onReopen: () => void
}) {
  const done = item.status === 'cleared'
  const Icon: LucideIcon = done ? CircleCheck : item.blocking ? ShieldAlert : Clock3

  return (
    <li className='flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between'>
      <div className='flex min-w-0 items-start gap-3'>
        <span
          className={cn(
            'grid size-9 shrink-0 place-items-center rounded-lg',
            done
              ? 'bg-success/15 text-success'
              : item.blocking
                ? 'bg-destructive/10 text-destructive'
                : 'bg-warning/15 text-warning'
          )}
        >
          <Icon className='size-4' />
        </span>
        <div className='grid min-w-0 gap-0.5'>
          <span className='flex flex-wrap items-center gap-2 text-sm font-semibold'>
            {NOC_DEPARTMENT_LABELS[item.department]}
            <Badge tone={done ? 'success' : 'warning'}>{done ? 'Cleared' : 'Pending'}</Badge>
          </span>
          {done ? (
            <span className='text-xs text-muted-foreground'>
              {item.cleared_by_name ?? 'Someone'}
              {item.cleared_at ? `, ${formatDateTime(item.cleared_at)}` : ''}
              {item.remarks ? ` · ${item.remarks}` : ''}
              {item.blocker_snapshot ? ` · ${item.blocker_snapshot}` : ''}
            </span>
          ) : (
            <>
              <span className='text-xs text-muted-foreground'>
                {NOC_DEPARTMENT_HINTS[item.department]}
              </span>
              {item.blocker && (
                <span
                  className={cn(
                    'text-xs font-medium',
                    item.blocking ? 'text-destructive' : 'text-warning'
                  )}
                >
                  {item.blocker}
                </span>
              )}
            </>
          )}
        </div>
      </div>
      {item.can_clear &&
        (done ? (
          <Button variant='ghost' size='sm' loading={reopening} onClick={onReopen}>
            <Undo2 />
            Reopen
          </Button>
        ) : (
          <Button variant='outline' size='sm' disabled={item.blocking} onClick={onClear}>
            <CircleCheck />
            Clear
          </Button>
        ))}
    </li>
  )
}

function ClearLineModal({
  studentId,
  item,
  onClose,
}: {
  studentId: number
  item: NocItem | null
  onClose: () => void
}) {
  const [shown, setShown] = useState(item)
  if (item && item !== shown) setShown(item)
  const [remarks, setRemarks] = useState('')
  const [acknowledge, setAcknowledge] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const save = useStudentMutation((input: ClearNocItemInput) =>
    recordsApi.clearNocItem(studentId, input)
  )
  const close = () => {
    onClose()
    setRemarks('')
    setAcknowledge(false)
    setError(null)
  }
  const dues = shown?.department === 'fees' && shown.amount > 0
  const label = shown ? NOC_DEPARTMENT_LABELS[shown.department] : ''

  return (
    <AppModal
      open={Boolean(item)}
      onOpenChange={(open) => !open && close()}
      title={`Clear ${label}`}
      description={shown ? NOC_DEPARTMENT_HINTS[shown.department] : undefined}
      formId='noc-clear-form'
      submitText={dues ? 'Clear with dues' : 'Clear'}
      loading={save.isPending}
      size='sm'
    >
      <form
        id='noc-clear-form'
        noValidate
        className='grid gap-4'
        onSubmit={async (event) => {
          event.preventDefault()
          if (!shown) return
          if (dues && !acknowledge) {
            setError('Confirm that the dues stay on record')
            return
          }
          try {
            await save.mutateAsync({
              department: shown.department,
              remarks: remarks.trim() || null,
              acknowledge_dues: dues ? true : undefined,
            })
            alerts.success(`${label} cleared`)
            close()
          } catch (caught) {
            setError(toApiError(caught).message)
          }
        }}
      >
        {shown?.department === 'transport' && shown.blocker && (
          <p className='rounded-lg border border-warning/40 bg-warning/10 px-3 py-2 text-sm'>
            {shown.blocker}. Clearing takes the student off this bus.
          </p>
        )}
        {dues && (
          <label className='flex items-start justify-between gap-3 rounded-lg border border-warning/40 bg-warning/10 p-3'>
            <span className='grid gap-0.5'>
              <span className='text-sm font-semibold'>{shown.blocker}</span>
              <span className='text-xs text-muted-foreground'>
                The dues stay on record. To stop collecting them, ask for a write-off on each
                invoice in Fees.
              </span>
            </span>
            <Switch
              checked={acknowledge}
              onCheckedChange={(value) => {
                setAcknowledge(value)
                setError(null)
              }}
              aria-label='Clear with dues'
            />
          </label>
        )}
        {error && (
          <p role='alert' className='text-sm font-medium text-destructive'>
            {error}
          </p>
        )}
        <FormField id='noc-clear-remarks' label='Remarks'>
          <Input
            id='noc-clear-remarks'
            autoFocus
            maxLength={255}
            placeholder='All items returned'
            value={remarks}
            onChange={(event) => setRemarks(event.target.value)}
          />
        </FormField>
      </form>
    </AppModal>
  )
}

function CancelNocModal({
  studentId,
  open,
  onClose,
}: {
  studentId: number
  open: boolean
  onClose: () => void
}) {
  const [note, setNote] = useState('')
  const [error, setError] = useState<string | null>(null)
  const cancel = useStudentMutation((value: string) => recordsApi.cancelNoc(studentId, value))
  const close = () => {
    onClose()
    setNote('')
    setError(null)
  }

  return (
    <AppModal
      open={open}
      onOpenChange={(next) => !next && close()}
      title='Cancel the leaving request?'
      description='The student stays in school. Lines already cleared are kept on the cancelled request.'
      formId='noc-cancel-form'
      submitText='Cancel request'
      cancelText='Keep request'
      loading={cancel.isPending}
      size='sm'
    >
      <form
        id='noc-cancel-form'
        noValidate
        className='grid gap-4'
        onSubmit={async (event) => {
          event.preventDefault()
          if (note.trim().length < 3) {
            setError('Write why the request is cancelled')
            return
          }
          try {
            await cancel.mutateAsync(note.trim())
            alerts.success('Leaving request cancelled')
            close()
          } catch (caught) {
            setError(toApiError(caught).message)
          }
        }}
      >
        <FormField id='noc-cancel-note' label='Reason' required error={error ?? undefined}>
          <Input
            id='noc-cancel-note'
            autoFocus
            maxLength={255}
            placeholder='Parents decided to continue here'
            value={note}
            onChange={(event) => {
              setNote(event.target.value)
              setError(null)
            }}
          />
        </FormField>
      </form>
    </AppModal>
  )
}
