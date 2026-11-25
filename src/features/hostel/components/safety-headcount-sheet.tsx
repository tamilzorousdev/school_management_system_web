import { useState } from 'react'
import { Ban, CheckCheck, CircleCheck, Lock, Save, Siren, UserRoundX } from 'lucide-react'
import { ErrorState } from '@/components/common/display'
import { Badge, type BadgeTone } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { can, useMe } from '@/features/auth/api'
import { alerts } from '@/lib/alerts'
import { formatDateTime } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useHostelMutation } from '../api'
import {
  safetyApi,
  useSos,
  type SosCloseInput,
  type SosDetail,
  type SosEntry,
  type SosMark,
  type SosMarkItem,
} from '../api-safety'
import { InfoNote, NoteModal, StudentCell } from './leave-form-parts'
import {
  groupEntries,
  MARK_BATCH,
  SOS_COUNT_KEYS,
  SOS_KIND,
  SOS_MARK,
  SOS_MARKS,
  SOS_STATUS,
  safetyErrorMessage,
} from './safety-helpers'

const activeTone: Record<BadgeTone, string> = {
  success: 'border-success/50 bg-success/15 text-success',
  danger: 'border-destructive/50 bg-destructive/15 text-destructive',
  warning: 'border-warning/50 bg-warning/15 text-warning',
  info: 'border-info/50 bg-info/15 text-info',
  neutral: 'border-border bg-muted text-foreground',
}

export function SafetyHeadcountSheet({ sosId, onClose }: { sosId?: number; onClose: () => void }) {
  const [shownId, setShownId] = useState(sosId)
  if (sosId && sosId !== shownId) setShownId(sosId)
  const sos = useSos(shownId ?? 0, Boolean(shownId))
  const data = sos.data

  return (
    <Sheet open={Boolean(sosId)} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className='sm:max-w-3xl'>
        <SheetHeader>
          <SheetTitle className='flex flex-wrap items-center gap-2'>
            {data?.status === 'open' && <Siren className='size-5 text-destructive' />}
            {data ? `${SOS_KIND[data.kind]} · ${data.sos_no}` : 'Emergency headcount'}
          </SheetTitle>
          <SheetDescription>
            {data
              ? [
                  data.hostel_name,
                  data.raised_by_name ? `raised by ${data.raised_by_name}` : null,
                  formatDateTime(data.created_at),
                ]
                  .filter(Boolean)
                  .join(' · ')
              : 'Loading'}
          </SheetDescription>
        </SheetHeader>
        <SheetBody>
          {sos.isError && !data ? (
            <ErrorState message={safetyErrorMessage(sos.error)} onRetry={() => sos.refetch()} />
          ) : !data ? (
            <div className='grid gap-3'>
              <Skeleton className='h-20' />
              <Skeleton className='h-10' />
              <Skeleton className='h-64' />
            </div>
          ) : (
            <HeadcountBody key={data.id} sos={data} />
          )}
        </SheetBody>
      </SheetContent>
    </Sheet>
  )
}

function HeadcountBody({ sos }: { sos: SosDetail }) {
  const me = useMe().data
  const canMark = can(me, 'hostel.attendance')
  const open = sos.status === 'open'
  const editable = canMark && open
  const [pending, setPending] = useState<Record<number, SosMark>>({})
  const [closing, setClosing] = useState<'resolve' | 'cancel' | null>(null)
  const mark = useHostelMutation((entries: SosMarkItem[]) => safetyApi.mark(sos.id, entries))
  const resolve = useHostelMutation((input: SosCloseInput) => safetyApi.resolve(sos.id, input))
  const cancel = useHostelMutation((input: SosCloseInput) => safetyApi.cancel(sos.id, input))

  const nextFor = (entry: SosEntry) =>
    pending[entry.admission_id] ??
    (entry.status ? undefined : (entry.suggested_status ?? undefined))
  const shownFor = (entry: SosEntry) => nextFor(entry) ?? entry.status ?? null
  const changes = editable
    ? sos.students.flatMap((entry) => {
        const next = nextFor(entry)
        return next && next !== entry.status
          ? [{ admission_id: entry.admission_id, status: next }]
          : []
      })
    : []
  const blankCount = sos.students.filter(
    (entry) => !entry.status && !entry.suggested_status && !pending[entry.admission_id]
  ).length
  const groups = groupEntries(sos.students)

  const setMark = (entry: SosEntry, status: SosMark) =>
    setPending((prev) => ({ ...prev, [entry.admission_id]: status }))

  const fillSafe = () =>
    setPending((prev) => {
      const next = { ...prev }
      sos.students.forEach((entry) => {
        if (!entry.status && !entry.suggested_status && !next[entry.admission_id]) {
          next[entry.admission_id] = 'safe'
        }
      })
      return next
    })

  const pushChanges = async () => {
    for (let start = 0; start < changes.length; start += MARK_BATCH) {
      await mark.mutateAsync(changes.slice(start, start + MARK_BATCH))
    }
    setPending({})
  }

  const save = async () => {
    try {
      const count = changes.length
      await pushChanges()
      alerts.success('Headcount saved', {
        description: `${count} ${count === 1 ? 'mark' : 'marks'} saved`,
      })
    } catch (error) {
      alerts.error(safetyErrorMessage(error))
    }
  }

  const close = async (kind: 'resolve' | 'cancel', note: string | null) => {
    try {
      if (changes.length) await pushChanges()
      if (kind === 'resolve') await resolve.mutateAsync({ note })
      else await cancel.mutateAsync({ note })
      alerts.success(kind === 'resolve' ? 'Alert resolved' : 'Alert cancelled', {
        description: sos.sos_no,
      })
    } catch (error) {
      throw new Error(safetyErrorMessage(error), { cause: error })
    }
  }

  const stillOpen = sos.counts.unmarked + sos.counts.missing
  const resolveHint =
    stillOpen > 0
      ? `${sos.counts.missing} missing and ${sos.counts.unmarked} not marked yet. Resolve only when everyone is accounted for.`
      : 'Everyone is accounted for. Add a short note on what happened.'

  return (
    <div className='grid gap-4'>
      <div className='flex flex-wrap items-center gap-2'>
        <Badge tone={SOS_STATUS[sos.status].tone} dot pulse={open}>
          {SOS_STATUS[sos.status].label}
        </Badge>
        {sos.is_drill && <Badge tone='info'>Drill</Badge>}
        {sos.notify_parents && <Badge tone='warning'>Parents told</Badge>}
      </div>

      <div
        className={cn(
          'grid gap-1 rounded-lg border px-4 py-3',
          open && !sos.is_drill
            ? 'border-destructive/40 bg-destructive/10'
            : 'border-border bg-muted/40'
        )}
      >
        <p className='font-semibold break-words'>{sos.message}</p>
        {sos.student && (
          <p className='text-sm text-muted-foreground'>
            About {sos.student.name} · {sos.student.admission_no}
          </p>
        )}
      </div>

      {!open && (
        <InfoNote icon={Lock} tone={sos.status === 'resolved' ? 'success' : 'info'}>
          {SOS_STATUS[sos.status].label}
          {sos.resolved_by_name ? ` by ${sos.resolved_by_name}` : ''}
          {sos.resolved_at ? ` on ${formatDateTime(sos.resolved_at)}` : ''}.
          {sos.resolution ? ` ${sos.resolution}` : ''} The headcount is read-only now.
        </InfoNote>
      )}
      {open && !canMark && (
        <InfoNote>
          You can follow the headcount here. Marking and closing the alert need the hostel
          attendance permission.
        </InfoNote>
      )}

      <div className='flex flex-wrap items-center gap-2'>
        {SOS_COUNT_KEYS.map((item) => (
          <Badge key={item.key} tone={item.tone} className='px-2.5 py-1'>
            {item.label}
            <span className='tabular font-extrabold'>{sos.counts[item.key]}</span>
          </Badge>
        ))}
        <span className='tabular text-xs text-muted-foreground'>
          of {sos.counts.total} residents
        </span>
      </div>

      {editable && (
        <div className='flex flex-wrap gap-2'>
          <Button variant='outline' size='sm' disabled={blankCount === 0} onClick={fillSafe}>
            <CheckCheck />
            Mark all unmarked safe
          </Button>
          <div className='flex flex-wrap gap-2 sm:ml-auto'>
            <Button size='sm' variant='outline' onClick={() => setClosing('cancel')}>
              <Ban />
              Cancel alert
            </Button>
            <Button size='sm' onClick={() => setClosing('resolve')}>
              <CircleCheck />
              Resolve
            </Button>
          </div>
        </div>
      )}

      {sos.students.length === 0 ? (
        <InfoNote icon={UserRoundX}>No residents in this hostel to count.</InfoNote>
      ) : (
        groups.map((group) => (
          <Card
            key={group.key}
            className={cn('overflow-hidden', group.missing && 'border-destructive/50')}
          >
            <div
              className={cn(
                'flex items-center justify-between gap-2 border-b px-4 py-2',
                group.missing ? 'bg-destructive/10 text-destructive' : 'bg-muted/40'
              )}
            >
              <span className='text-sm font-semibold'>{group.title}</span>
              <span className='tabular text-xs text-muted-foreground'>{group.entries.length}</span>
            </div>
            <ul className='divide-y'>
              {group.entries.map((entry) => (
                <li
                  key={entry.admission_id}
                  className='flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between'
                >
                  <div className='grid min-w-0 gap-1'>
                    <StudentCell
                      student={entry.student}
                      extra={group.missing ? (entry.room_no ?? 'No room') : undefined}
                    />
                    <MarkState entry={entry} pending={pending[entry.admission_id]} />
                  </div>
                  <MarkButtons
                    name={entry.student.name}
                    value={shownFor(entry)}
                    disabled={!editable}
                    onChange={(status) => setMark(entry, status)}
                  />
                </li>
              ))}
            </ul>
          </Card>
        ))
      )}

      {editable && changes.length > 0 && (
        <div className='sticky bottom-0 z-10'>
          <Card className='flex flex-row flex-wrap items-center justify-between gap-3 border-primary/40 px-4 py-3 shadow-lg'>
            <span className='text-sm font-semibold'>
              {changes.length} {changes.length === 1 ? 'mark' : 'marks'} not saved
            </span>
            <div className='flex gap-2'>
              <Button variant='ghost' size='sm' onClick={() => setPending({})}>
                Discard
              </Button>
              <Button size='sm' loading={mark.isPending} onClick={() => void save()}>
                <Save />
                Save {changes.length} {changes.length === 1 ? 'mark' : 'marks'}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {closing && (
        <NoteModal
          title={closing === 'resolve' ? 'Resolve alert' : 'Cancel alert'}
          description={
            closing === 'resolve'
              ? resolveHint
              : 'Use this when the alert was raised by mistake. Everyone who was told sees it is cancelled.'
          }
          label={closing === 'resolve' ? 'What happened' : 'Why it is cancelled'}
          submitText={closing === 'resolve' ? 'Resolve' : 'Cancel alert'}
          onSubmit={(note) => close(closing, note)}
          onClose={() => setClosing(null)}
        />
      )}
    </div>
  )
}

function MarkState({ entry, pending }: { entry: SosEntry; pending?: SosMark }) {
  return (
    <div className='flex flex-wrap items-center gap-1'>
      {entry.status ? (
        <Badge tone={SOS_MARK[entry.status].tone} dot>
          {SOS_MARK[entry.status].label}
          {entry.marked_at ? ` · ${formatDateTime(entry.marked_at)}` : ''}
        </Badge>
      ) : (
        <Badge tone='neutral'>Not marked</Badge>
      )}
      {!entry.status && entry.suggested_status === 'away' && (
        <span className='text-xs text-muted-foreground'>Out on a pass</span>
      )}
      {pending && pending !== entry.status && <Badge tone='warning'>Not saved</Badge>}
    </div>
  )
}

function MarkButtons({
  name,
  value,
  disabled,
  onChange,
}: {
  name: string
  value: SosMark | null
  disabled: boolean
  onChange: (status: SosMark) => void
}) {
  return (
    <div role='radiogroup' aria-label={`Mark ${name}`} className='flex flex-wrap gap-1'>
      {SOS_MARKS.map((status) => {
        const active = value === status
        return (
          <button
            key={status}
            type='button'
            role='radio'
            aria-checked={active}
            disabled={disabled}
            onClick={() => onChange(status)}
            className={cn(
              'h-9 min-w-16 rounded-md border px-2.5 text-xs font-semibold transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40 disabled:cursor-not-allowed disabled:opacity-60',
              active
                ? activeTone[SOS_MARK[status].tone]
                : 'bg-card text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            {SOS_MARK[status].label}
          </button>
        )
      })}
    </div>
  )
}
