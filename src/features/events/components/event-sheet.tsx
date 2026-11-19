import { useState, type ReactNode } from 'react'
import { Ban, CalendarCheck, Pencil, Send, Trash2, UsersRound } from 'lucide-react'
import { AppModal } from '@/components/common/app-modal'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import { DataTable, type Column } from '@/components/common/data-table'
import { ErrorState } from '@/components/common/display'
import { FormField } from '@/components/common/form-field'
import { FilterSelect, ListToolbar, SearchBox } from '@/components/common/list-toolbar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/input'
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { useClasses } from '@/features/setup/api'
import { alerts } from '@/lib/alerts'
import { toApiError } from '@/lib/api/errors'
import { dayTitle } from '@/lib/calendar'
import { formatDateTime } from '@/lib/format'
import { cn } from '@/lib/utils'
import {
  eventsApi,
  useEvent,
  useEventAction,
  useEventResponses,
  type EventResponseRow,
  type ResponseFilter,
  type ResponseParams,
  type SchoolEvent,
} from '../api'
import { EVENT_STATUS, RESPONSE_LABEL, eventTime } from '../labels'

const RESPONSES_LIMIT = 10

export function EventSheet({
  eventId,
  canManage,
  onEdit,
  onClose,
}: {
  eventId: number | null
  canManage: boolean
  onEdit: (event: SchoolEvent) => void
  onClose: () => void
}) {
  const [shownId, setShownId] = useState(eventId)
  if (eventId && eventId !== shownId) setShownId(eventId)
  const query = useEvent(shownId)
  const data = query.data
  const [confirm, setConfirm] = useState<'delete' | 'publish' | null>(null)
  const [cancelling, setCancelling] = useState(false)
  const [reason, setReason] = useState('')
  const publish = useEventAction((id: number) => eventsApi.publish(id))
  const remove = useEventAction((id: number) => eventsApi.remove(id))
  const cancel = useEventAction((input: { id: number; reason: string | null }) =>
    eventsApi.cancel(input.id, input.reason)
  )

  const run = async (action: () => Promise<unknown>, message: string, close = false) => {
    try {
      await action()
      alerts.success(message)
      setConfirm(null)
      setCancelling(false)
      if (close) onClose()
    } catch (error) {
      alerts.error(toApiError(error).message)
    }
  }

  return (
    <Sheet open={Boolean(eventId)} onOpenChange={(open) => !open && onClose()}>
      <SheetContent aria-describedby={undefined} className='sm:max-w-2xl'>
        {query.isError && !data ? (
          <ErrorState message={query.error.message} onRetry={() => query.refetch()} />
        ) : !data ? (
          <div className='grid gap-4 p-6'>
            <Skeleton className='h-16' />
            <Skeleton className='h-48' />
          </div>
        ) : (
          <>
            <SheetHeader>
              <div className='flex items-center gap-3'>
                <span className='grid size-11 shrink-0 place-items-center rounded-full bg-primary/10 text-primary'>
                  <CalendarCheck className='size-5' />
                </span>
                <div className='grid min-w-0 gap-0.5'>
                  <SheetTitle className='break-words'>{data.title}</SheetTitle>
                  <SheetDescription>
                    {dayTitle(data.event_date)} · {eventTime(data)}
                    {data.venue ? ` · ${data.venue}` : ''}
                  </SheetDescription>
                  <div className='mt-1 flex flex-wrap gap-1.5'>
                    <Badge tone={EVENT_STATUS[data.status].tone} dot>
                      {EVENT_STATUS[data.status].label}
                    </Badge>
                    {data.rsvp_required && (
                      <Badge tone={data.rsvp_open ? 'info' : 'neutral'}>
                        {data.rsvp_open ? 'Replies open' : 'Replies closed'}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </SheetHeader>
            <SheetBody className='grid content-start gap-6'>
              {canManage && (
                <div className='flex flex-wrap gap-2 rounded-lg border bg-muted/30 p-3'>
                  {data.status === 'draft' && (
                    <Button size='sm' onClick={() => setConfirm('publish')}>
                      <Send />
                      Publish
                    </Button>
                  )}
                  {data.status !== 'cancelled' && (
                    <Button size='sm' variant='outline' onClick={() => onEdit(data)}>
                      <Pencil />
                      Edit
                    </Button>
                  )}
                  {data.status === 'published' && (
                    <Button
                      size='sm'
                      variant='outline'
                      onClick={() => {
                        setReason('')
                        setCancelling(true)
                      }}
                    >
                      <Ban />
                      Cancel event
                    </Button>
                  )}
                  <Button
                    size='sm'
                    variant='ghost'
                    className='text-destructive'
                    onClick={() => setConfirm('delete')}
                  >
                    <Trash2 />
                    Delete
                  </Button>
                </div>
              )}

              {data.status === 'cancelled' && (
                <p className='rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm'>
                  Cancelled {formatDateTime(data.cancelled_at)}
                  {data.cancel_reason ? `: ${data.cancel_reason}` : ''}
                </p>
              )}

              {data.description && (
                <Block title='About'>
                  <p className='rounded-lg border bg-muted/40 p-3 text-sm whitespace-pre-line'>
                    {data.description}
                  </p>
                </Block>
              )}

              <Block title='Details'>
                <dl className='grid gap-x-6 gap-y-3 rounded-lg border p-3 sm:grid-cols-2'>
                  {[
                    ['Invited', data.audience_label],
                    [
                      'Reply by',
                      data.rsvp_required
                        ? data.rsvp_deadline
                          ? formatDateTime(data.rsvp_deadline)
                          : 'Until it starts'
                        : 'No reply asked',
                    ],
                    ['Created by', data.created_by.name],
                    ['Published', formatDateTime(data.published_at)],
                  ].map(([label, value]) => (
                    <div key={label} className='grid gap-0.5'>
                      <dt className='text-[11px] font-bold tracking-wider text-muted-foreground uppercase'>
                        {label}
                      </dt>
                      <dd className='text-sm font-semibold break-words'>{value}</dd>
                    </div>
                  ))}
                </dl>
              </Block>

              <Block title='Replies'>
                <div className='grid grid-cols-2 gap-2 sm:grid-cols-5'>
                  <Count label='Invited' value={data.counts.invited} />
                  <Count label='Attending' value={data.counts.attending} tone='success' />
                  <Count label='Maybe' value={data.counts.maybe} tone='warning' />
                  <Count label='Not attending' value={data.counts.not_attending} tone='danger' />
                  <Count label='No reply' value={data.counts.no_response} />
                </div>
              </Block>

              {data.status !== 'draft' && <Responses key={data.id} eventId={data.id} />}
            </SheetBody>

            <ConfirmDialog
              open={confirm !== null}
              onOpenChange={(open) => !open && setConfirm(null)}
              title={confirm === 'delete' ? 'Delete this event?' : 'Publish this event?'}
              description={
                confirm === 'delete'
                  ? data.status === 'published'
                    ? 'It disappears from the parent calendar without a notice. Cancel it instead to tell parents.'
                    : 'It goes away for good.'
                  : `Parents of ${data.counts.invited} students get a notification now.`
              }
              confirmText={confirm === 'delete' ? 'Delete' : 'Publish'}
              destructive={confirm === 'delete'}
              loading={remove.isPending || publish.isPending}
              onConfirm={() =>
                confirm === 'delete'
                  ? run(() => remove.mutateAsync(data.id), 'Event deleted', true)
                  : run(() => publish.mutateAsync(data.id), 'Event published')
              }
            />
            <AppModal
              open={cancelling}
              onOpenChange={setCancelling}
              title='Cancel this event?'
              description='Parents of every invited student get a notification.'
              formId='cancel-event-form'
              submitText='Cancel event'
              loading={cancel.isPending}
              size='sm'
            >
              <form
                id='cancel-event-form'
                noValidate
                onSubmit={(submit) => {
                  submit.preventDefault()
                  void run(
                    () => cancel.mutateAsync({ id: data.id, reason: reason.trim() || null }),
                    'Event cancelled'
                  )
                }}
              >
                <FormField id='cancel-reason' label='Reason' hint='Parents see this'>
                  <Textarea
                    id='cancel-reason'
                    rows={3}
                    maxLength={300}
                    value={reason}
                    placeholder='Postponed because of heavy rain'
                    onChange={(change) => setReason(change.target.value)}
                  />
                </FormField>
              </form>
            </AppModal>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}

function Count({
  label,
  value,
  tone,
}: {
  label: string
  value: number
  tone?: 'success' | 'warning' | 'danger'
}) {
  return (
    <div className='grid gap-0.5 rounded-lg border p-3'>
      <span className='text-[11px] font-bold tracking-wider text-muted-foreground uppercase'>
        {label}
      </span>
      <span
        className={cn(
          'tabular text-xl font-bold',
          tone === 'success' && 'text-success',
          tone === 'warning' && 'text-warning',
          tone === 'danger' && 'text-destructive'
        )}
      >
        {value}
      </span>
    </div>
  )
}

function Responses({ eventId }: { eventId: number }) {
  const classes = useClasses()
  const [params, setParams] = useState<ResponseParams>({ page: 1, limit: RESPONSES_LIMIT })
  const responses = useEventResponses(eventId, params)
  const update = (patch: Partial<ResponseParams>) =>
    setParams((current) => ({ ...current, page: 1, ...patch }))
  const filtered = Boolean(params.response || params.class_id || params.search)

  const columns: Column<EventResponseRow>[] = [
    {
      key: 'student',
      header: 'Student',
      cell: (row) => (
        <span className='grid min-w-0'>
          <span className='font-semibold break-words'>{row.student.name}</span>
          <span className='text-xs text-muted-foreground'>
            {[row.class_section, row.admission_no].filter(Boolean).join(' · ')}
          </span>
        </span>
      ),
    },
    {
      key: 'response',
      header: 'Reply',
      cell: (row) => (
        <Badge tone={RESPONSE_LABEL[row.response].tone} dot>
          {RESPONSE_LABEL[row.response].label}
        </Badge>
      ),
    },
    {
      key: 'when',
      header: 'Replied',
      align: 'right',
      cell: (row) => (
        <span className='grid text-xs text-muted-foreground'>
          <span className='tabular'>
            {row.responded_at ? formatDateTime(row.responded_at) : '—'}
          </span>
          {row.responded_by && <span>{row.responded_by.name}</span>}
          {!row.responded_at && row.parent_mobile && (
            <span className='tabular'>+91 {row.parent_mobile}</span>
          )}
        </span>
      ),
    },
  ]

  return (
    <Block title='Who replied'>
      <div className='overflow-hidden rounded-lg border'>
        <ListToolbar
          summary={responses.data ? `${responses.data.total} students` : ''}
          onClear={
            filtered
              ? () => update({ response: undefined, class_id: undefined, search: undefined })
              : undefined
          }
        >
          <SearchBox
            value={params.search ?? ''}
            onChange={(value) => update({ search: value || undefined })}
            placeholder='Student or admission no'
            label='Search students'
          />
          <FilterSelect
            id='event-response-filter'
            label='Filter by reply'
            allLabel='Any reply'
            value={params.response}
            options={(Object.keys(RESPONSE_LABEL) as ResponseFilter[]).map((value) => ({
              value,
              label: RESPONSE_LABEL[value].label,
            }))}
            onChange={(value) => update({ response: value as ResponseFilter | undefined })}
          />
          <FilterSelect
            id='event-response-class'
            label='Filter by class'
            allLabel='All classes'
            value={params.class_id ? String(params.class_id) : undefined}
            options={(classes.data ?? []).map((item) => ({
              value: String(item.id),
              label: `Class ${item.name}`,
            }))}
            onChange={(value) => update({ class_id: value ? Number(value) : undefined })}
          />
        </ListToolbar>
        <DataTable
          rows={responses.data?.items ?? []}
          columns={columns}
          rowKey={(row) => row.student.id}
          loading={responses.isFetching}
          error={responses.isError ? responses.error.message : null}
          onRetry={() => responses.refetch()}
          empty={{
            icon: UsersRound,
            title: filtered ? 'Nobody matches these filters' : 'No students invited',
          }}
          card={(row) => (
            <div className='grid gap-1'>
              <div className='flex items-start justify-between gap-2'>
                <span className='font-semibold break-words'>{row.student.name}</span>
                <Badge tone={RESPONSE_LABEL[row.response].tone} dot>
                  {RESPONSE_LABEL[row.response].label}
                </Badge>
              </div>
              <span className='text-xs break-words text-muted-foreground'>
                {[
                  row.class_section,
                  row.responded_at ? formatDateTime(row.responded_at) : null,
                  row.responded_by?.name,
                  !row.responded_at && row.parent_mobile ? `+91 ${row.parent_mobile}` : null,
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </span>
            </div>
          )}
          pagination={{
            page: params.page,
            limit: RESPONSES_LIMIT,
            total: responses.data?.total ?? 0,
            label: 'students',
            onPageChange: (page) => setParams((current) => ({ ...current, page })),
          }}
        />
      </div>
    </Block>
  )
}

function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className='grid gap-3'>
      <h3 className='text-xs font-bold tracking-wider text-muted-foreground uppercase'>{title}</h3>
      {children}
    </section>
  )
}
