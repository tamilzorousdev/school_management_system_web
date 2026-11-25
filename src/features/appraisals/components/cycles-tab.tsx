import { useState } from 'react'
import { Bell, CalendarClock, Download, Lock, Pencil, PlayCircle, Plus, Trash2 } from 'lucide-react'
import { AppModal } from '@/components/common/app-modal'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import { DatePicker } from '@/components/common/date-picker'
import { EmptyState, ErrorState } from '@/components/common/display'
import { FormField } from '@/components/common/form-field'
import { TimePicker } from '@/components/common/time-picker'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input, Textarea } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { alerts } from '@/lib/alerts'
import { toApiError } from '@/lib/api/errors'
import { downloadFile } from '@/lib/files'
import { formatDateTime } from '@/lib/format'
import {
  appraisalsApi,
  useAppraisalGroups,
  useAppraisalMutation,
  useCycles,
  type Cycle,
  type IncrementBands,
} from '../api'
import {
  CYCLE_STATUS,
  daysFromNow,
  DEFAULT_BANDS,
  fieldMap,
  fromLocalParts,
  localParts,
  RATING,
  RATINGS,
  STAGE,
} from '../labels'

type Confirm = { cycle: Cycle; action: 'open' | 'close' | 'remove' }

export function CyclesTab({ canEdit, onShowReviews }: { canEdit: boolean; onShowReviews: (cycleId: number) => void }) {
  const cycles = useCycles()
  const [editing, setEditing] = useState<Cycle | 'new' | null>(null)
  const [extending, setExtending] = useState<Cycle | null>(null)
  const [confirm, setConfirm] = useState<Confirm | null>(null)
  const open = useAppraisalMutation(appraisalsApi.openCycle)
  const close = useAppraisalMutation(appraisalsApi.closeCycle)
  const remove = useAppraisalMutation(appraisalsApi.removeCycle)
  const remind = useAppraisalMutation(appraisalsApi.remindCycle)

  const run = async () => {
    if (!confirm) return
    const actions = { open: open.mutateAsync, close: close.mutateAsync, remove: remove.mutateAsync }
    try {
      const done = await actions[confirm.action](confirm.cycle.id)
      alerts.success(done.message)
      setConfirm(null)
    } catch (error) {
      alerts.error(toApiError(error).message)
    }
  }

  return (
    <div className='grid gap-4 p-4'>
      <div className='flex flex-wrap items-center justify-between gap-2'>
        <p className='max-w-2xl text-sm text-muted-foreground'>
          A cycle asks the chosen groups for a self-appraisal, then the HOD and the Principal score. Opening it
          creates one appraisal per person with the KRAs of their group.
        </p>
        {canEdit && (
          <Button onClick={() => setEditing('new')}>
            <Plus />
            New cycle
          </Button>
        )}
      </div>
      {cycles.isPending ? (
        <Skeleton className='h-40' />
      ) : cycles.isError ? (
        <ErrorState message={cycles.error.message} onRetry={() => void cycles.refetch()} />
      ) : !cycles.data.items.length ? (
        <EmptyState
          icon={CalendarClock}
          title='No appraisal cycles this year'
          description='Set up the groups and their KRAs first, then create a cycle.'
        />
      ) : (
        <div className='grid gap-4'>
          {cycles.data.items.map((cycle) => (
            <Card key={cycle.id} className='grid gap-3 p-4' data-testid='appraisal-cycle'>
              <div className='flex flex-wrap items-start justify-between gap-2'>
                <span className='grid min-w-0'>
                  <span className='flex items-center gap-2 font-semibold'>
                    {cycle.title}
                    <Badge tone={CYCLE_STATUS[cycle.status].tone} dot>
                      {CYCLE_STATUS[cycle.status].label}
                    </Badge>
                  </span>
                  <span className='text-xs text-muted-foreground'>
                    {cycle.groups.map((group) => group.name).join(', ')}
                  </span>
                </span>
                <span className='grid text-right text-xs text-muted-foreground'>
                  {cycle.self_opens_at && cycle.status === 'scheduled' && (
                    <span>Opens {formatDateTime(cycle.self_opens_at)}</span>
                  )}
                  <span>Self by {formatDateTime(cycle.self_due_at)}</span>
                  <span>HOD by {formatDateTime(cycle.hod_due_at)}</span>
                  <span>Final by {formatDateTime(cycle.final_due_at)}</span>
                </span>
              </div>
              {cycle.counts.total > 0 && (
                <div className='flex flex-wrap gap-2'>
                  {(Object.keys(STAGE) as (keyof typeof STAGE)[]).map((stage) => (
                    <Badge key={stage} tone={cycle.counts[stage] ? STAGE[stage].tone : 'neutral'}>
                      {STAGE[stage].label} {cycle.counts[stage]}
                    </Badge>
                  ))}
                  {cycle.counts.self_missed > 0 && <Badge tone='danger'>Self missed {cycle.counts.self_missed}</Badge>}
                </div>
              )}
              <div className='flex flex-wrap gap-2'>
                {cycle.counts.total > 0 && (
                  <Button variant='outline' size='sm' onClick={() => onShowReviews(cycle.id)}>
                    {cycle.counts.total} appraisals
                  </Button>
                )}
                {canEdit && cycle.status === 'draft' && (
                  <>
                    <Button size='sm' onClick={() => setConfirm({ cycle, action: 'open' })}>
                      <PlayCircle />
                      Open
                    </Button>
                    <Button variant='ghost' size='sm' onClick={() => setEditing(cycle)}>
                      <Pencil />
                      Edit
                    </Button>
                    <Button variant='ghost' size='sm' onClick={() => setConfirm({ cycle, action: 'remove' })}>
                      <Trash2 />
                      Delete
                    </Button>
                  </>
                )}
                {canEdit && (cycle.status === 'open' || cycle.status === 'scheduled') && (
                  <>
                    {cycle.status === 'open' && (
                      <Button
                        variant='outline'
                        size='sm'
                        disabled={remind.isPending}
                        onClick={async () => {
                          try {
                            const done = await remind.mutateAsync(cycle.id)
                            alerts.success(`${done.data.reminded} reminders sent`)
                          } catch (error) {
                            alerts.error(toApiError(error).message)
                          }
                        }}
                      >
                        <Bell />
                        Remind
                      </Button>
                    )}
                    <Button variant='outline' size='sm' onClick={() => setExtending(cycle)}>
                      <CalendarClock />
                      Extend
                    </Button>
                    <Button variant='ghost' size='sm' onClick={() => setConfirm({ cycle, action: 'close' })}>
                      <Lock />
                      Close
                    </Button>
                  </>
                )}
                {cycle.counts.total > 0 && (
                  <Button
                    variant='ghost'
                    size='sm'
                    onClick={() =>
                      void downloadFile(appraisalsApi.exportUrl(cycle.id), `${cycle.title}.xlsx`).catch((error) =>
                        alerts.error(toApiError(error).message),
                      )
                    }
                  >
                    <Download />
                    Excel
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
      {editing && <CycleModal cycle={editing === 'new' ? null : editing} onClose={() => setEditing(null)} />}
      {extending && <ExtendModal cycle={extending} onClose={() => setExtending(null)} />}
      <ConfirmDialog
        open={Boolean(confirm)}
        onOpenChange={(value) => !value && setConfirm(null)}
        title={
          confirm?.action === 'open'
            ? `Open ${confirm.cycle.title}?`
            : confirm?.action === 'close'
              ? `Close ${confirm.cycle.title}?`
              : `Delete ${confirm?.cycle.title ?? 'cycle'}?`
        }
        description={
          confirm?.action === 'open'
            ? 'Everyone in the chosen groups gets an appraisal and a push to score themselves. Weights of every group must add up to 100%.'
            : confirm?.action === 'close'
              ? 'Staff and HODs can no longer change scores. You can still finalise, publish and decide appeals.'
              : 'Only a draft cycle can be deleted.'
        }
        confirmText={confirm?.action === 'open' ? 'Open cycle' : confirm?.action === 'close' ? 'Close cycle' : 'Delete'}
        destructive={confirm?.action !== 'open'}
        loading={open.isPending || close.isPending || remove.isPending}
        onConfirm={() => void run()}
      />
    </div>
  )
}

type Parts = { date: string; time: string }

function DateTime({
  id,
  label,
  value,
  error,
  onChange,
  hint,
}: {
  id: string
  label: string
  value: Parts
  error?: string
  onChange: (value: Parts) => void
  hint?: string
}) {
  return (
    <FormField id={id} label={label} required error={error} hint={hint}>
      <div className='grid gap-2 sm:grid-cols-2'>
        <DatePicker
          id={id}
          value={value.date}
          min={localParts(new Date()).date}
          invalid={Boolean(error)}
          onChange={(date: string) => onChange({ ...value, date })}
        />
        <TimePicker
          id={`${id}-time`}
          value={value.time}
          invalid={Boolean(error)}
          onChange={(time) => onChange({ ...value, time })}
        />
      </div>
    </FormField>
  )
}

function CycleModal({ cycle, onClose }: { cycle: Cycle | null; onClose: () => void }) {
  const groups = useAppraisalGroups()
  const [title, setTitle] = useState(cycle?.title ?? '')
  const [description, setDescription] = useState(cycle?.description ?? '')
  const [groupIds, setGroupIds] = useState<number[]>(cycle?.groups.map((group) => group.id) ?? [])
  const [later, setLater] = useState(Boolean(cycle?.self_opens_at))
  const [opensAt, setOpensAt] = useState(localParts(cycle?.self_opens_at ?? daysFromNow(1, 9)))
  const [selfDue, setSelfDue] = useState(localParts(cycle?.self_due_at ?? daysFromNow(10)))
  const [hodDue, setHodDue] = useState(localParts(cycle?.hod_due_at ?? daysFromNow(17)))
  const [finalDue, setFinalDue] = useState(localParts(cycle?.final_due_at ?? daysFromNow(24)))
  const [appealDays, setAppealDays] = useState(String(cycle?.appeal_days ?? 7))
  const [bands, setBands] = useState<IncrementBands>(cycle?.increment_bands ?? DEFAULT_BANDS)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const create = useAppraisalMutation(appraisalsApi.createCycle)
  const update = useAppraisalMutation(appraisalsApi.updateCycle)
  const busy = create.isPending || update.isPending

  const submit = async () => {
    const next: Record<string, string> = {}
    if (!title.trim()) next.title = 'Give the cycle a title'
    if (!groupIds.length) next.group_ids = 'Choose at least one group'
    const input = {
      title: title.trim(),
      description: description.trim() || null,
      group_ids: groupIds,
      self_opens_at: later ? fromLocalParts(opensAt.date, opensAt.time) : null,
      self_due_at: fromLocalParts(selfDue.date, selfDue.time) ?? '',
      hod_due_at: fromLocalParts(hodDue.date, hodDue.time) ?? '',
      final_due_at: fromLocalParts(finalDue.date, finalDue.time) ?? '',
      appeal_days: Number(appealDays) || 0,
      increment_bands: bands,
    }
    if (!input.self_due_at) next.self_due_at = 'Pick the day and time'
    if (!input.hod_due_at) next.hod_due_at = 'Pick the day and time'
    if (!input.final_due_at) next.final_due_at = 'Pick the day and time'
    setErrors(next)
    if (Object.keys(next).length) return
    try {
      const saved = cycle ? await update.mutateAsync({ id: cycle.id, ...input }) : await create.mutateAsync(input)
      alerts.success(saved.message)
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
      onOpenChange={(value) => !value && !busy && onClose()}
      title={cycle ? `Edit ${cycle.title}` : 'New appraisal cycle'}
      description='Saved as a draft. Open it when the groups and KRAs are ready.'
      size='xl'
      formId='appraisal-cycle-form'
      submitText='Save cycle'
      loading={busy}
    >
      <form
        id='appraisal-cycle-form'
        className='grid gap-4 sm:grid-cols-2'
        onSubmit={(event) => {
          event.preventDefault()
          void submit()
        }}
      >
        <FormField id='cycle-title' label='Title' required error={errors.title} className='sm:col-span-2'>
          <Input
            id='cycle-title'
            value={title}
            placeholder='Annual review 2026-27'
            onChange={(event) => setTitle(event.target.value)}
          />
        </FormField>
        <FormField id='cycle-description' label='Note for staff' className='sm:col-span-2'>
          <Textarea id='cycle-description' rows={2} value={description} onChange={(event) => setDescription(event.target.value)} />
        </FormField>
        <FormField id='cycle-groups' label='Groups' required error={errors.group_ids} className='sm:col-span-2'>
          <div className='flex flex-wrap gap-2' id='cycle-groups'>
            {(groups.data ?? []).map((group) => (
              <label key={group.id} className='flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm'>
                <Switch
                  checked={groupIds.includes(group.id)}
                  onCheckedChange={(checked) =>
                    setGroupIds((current) => (checked ? [...current, group.id] : current.filter((id) => id !== group.id)))
                  }
                  aria-label={group.name}
                />
                {group.name}
                <span className='text-xs text-muted-foreground'>{group.member_count}</span>
                {group.weight_total !== 100 && <Badge tone='danger'>KRAs {group.weight_total}%</Badge>}
              </label>
            ))}
          </div>
        </FormField>
        <label className='flex items-start gap-2 text-sm sm:col-span-2'>
          <Switch checked={later} onCheckedChange={setLater} aria-label='Open later' className='mt-0.5' />
          <span className='grid'>
            <span className='font-medium'>Open at a set time</span>
            <span className='text-xs text-muted-foreground'>Otherwise it opens when you press Open.</span>
          </span>
        </label>
        {later && (
          <DateTime id='cycle-opens' label='Self-appraisal opens' value={opensAt} error={errors.self_opens_at} onChange={setOpensAt} />
        )}
        <DateTime
          id='cycle-self-due'
          label='Self-appraisal by'
          value={selfDue}
          error={errors.self_due_at}
          onChange={setSelfDue}
          hint='Not sent by then: moves on and is marked missed'
        />
        <DateTime id='cycle-hod-due' label='HOD review by' value={hodDue} error={errors.hod_due_at} onChange={setHodDue} />
        <DateTime id='cycle-final-due' label='Final review by' value={finalDue} error={errors.final_due_at} onChange={setFinalDue} />
        <FormField id='cycle-appeal' label='Days to appeal' hint='After the result is published' error={errors.appeal_days}>
          <Input id='cycle-appeal' type='number' min={0} max={60} value={appealDays} onChange={(event) => setAppealDays(event.target.value)} />
        </FormField>
        <FormField id='cycle-bands' label='Suggested increment % by rating' className='sm:col-span-2'>
          <div className='grid gap-2 sm:grid-cols-5' id='cycle-bands'>
            {RATINGS.map((rating) => (
              <label key={rating} className='grid gap-1 text-xs'>
                <span className='text-muted-foreground'>
                  {RATING[rating].label} ({RATING[rating].from}%+)
                </span>
                <Input
                  type='number'
                  min={0}
                  max={100}
                  step='0.5'
                  value={bands[rating]}
                  aria-label={`Increment for ${RATING[rating].label}`}
                  onChange={(event) => setBands((current) => ({ ...current, [rating]: Number(event.target.value) }))}
                />
              </label>
            ))}
          </div>
        </FormField>
      </form>
    </AppModal>
  )
}

function ExtendModal({ cycle, onClose }: { cycle: Cycle; onClose: () => void }) {
  const [selfDue, setSelfDue] = useState(localParts(cycle.self_due_at))
  const [hodDue, setHodDue] = useState(localParts(cycle.hod_due_at))
  const [finalDue, setFinalDue] = useState(localParts(cycle.final_due_at))
  const [errors, setErrors] = useState<Record<string, string>>({})
  const extend = useAppraisalMutation(appraisalsApi.extendCycle)

  const submit = async () => {
    try {
      const done = await extend.mutateAsync({
        id: cycle.id,
        self_due_at: fromLocalParts(selfDue.date, selfDue.time) ?? undefined,
        hod_due_at: fromLocalParts(hodDue.date, hodDue.time) ?? undefined,
        final_due_at: fromLocalParts(finalDue.date, finalDue.time) ?? undefined,
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
      onOpenChange={(value) => !value && !extend.isPending && onClose()}
      title={`Extend ${cycle.title}`}
      description='Move the deadlines later. Reminders are sent again before the new dates.'
      size='lg'
      formId='appraisal-extend-form'
      submitText='Save deadlines'
      loading={extend.isPending}
    >
      <form
        id='appraisal-extend-form'
        className='grid gap-4'
        onSubmit={(event) => {
          event.preventDefault()
          void submit()
        }}
      >
        <DateTime id='extend-self' label='Self-appraisal by' value={selfDue} error={errors.self_due_at} onChange={setSelfDue} />
        <DateTime id='extend-hod' label='HOD review by' value={hodDue} error={errors.hod_due_at} onChange={setHodDue} />
        <DateTime id='extend-final' label='Final review by' value={finalDue} error={errors.final_due_at} onChange={setFinalDue} />
      </form>
    </AppModal>
  )
}
