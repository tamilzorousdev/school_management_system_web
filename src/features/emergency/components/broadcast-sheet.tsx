import { useState } from 'react'
import { Download, RefreshCcw, ShieldCheck, Siren } from 'lucide-react'
import { DataTable, type Column } from '@/components/common/data-table'
import { ErrorState } from '@/components/common/display'
import { SearchBox } from '@/components/common/list-toolbar'
import { SegmentedControl } from '@/components/common/segmented-control'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { alerts } from '@/lib/alerts'
import { toApiError } from '@/lib/api/errors'
import { formatDateTime } from '@/lib/format'
import {
  emergencyApi,
  useEmergency,
  useEmergencyMutation,
  useEmergencyRecipients,
  type EmergencyBroadcast,
  type EmergencyRecipient,
  type RecipientFilter,
} from '../api'
import { BROADCAST_STATUS, CATEGORY_LABEL, DELIVERY, SEVERITY } from '../labels'

const LIMIT = 20

const FILTERS: { value: RecipientFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'not_acknowledged', label: 'Not acknowledged' },
  { value: 'not_read', label: 'Not read' },
  { value: 'failed', label: 'Failed' },
  { value: 'sms_only', label: 'SMS only' },
]

const pct = (value: number | null) => (value === null ? '—' : `${value}%`)

function Stat({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className='grid gap-0.5 rounded-lg border bg-card p-3'>
      <span className='text-xs text-muted-foreground'>{label}</span>
      <span className='tabular text-lg font-bold'>{value}</span>
      {hint && <span className='text-xs text-muted-foreground'>{hint}</span>}
    </div>
  )
}

const csvCell = (value: string) => `"${value.replace(/"/g, '""')}"`

async function exportCsv(broadcast: EmergencyBroadcast, filter: RecipientFilter) {
  const rows: EmergencyRecipient[] = []
  for (let page = 1; page <= 50; page += 1) {
    const result = await emergencyApi.recipients(broadcast.id, { page, limit: 100, filter })
    rows.push(...result.items)
    if (!result.has_next) break
  }
  const header = ['Name', 'Type', 'Mobile', 'Children', 'Push', 'SMS', 'Read at', 'Acknowledged at']
  const lines = rows.map((row) =>
    [
      row.name,
      row.kind,
      row.mobile ?? '',
      row.students.map((student) => `${student.name} (${student.section ?? ''})`).join('; '),
      DELIVERY[row.push_status].label,
      DELIVERY[row.sms_status].label,
      row.read_at ? formatDateTime(row.read_at) : '',
      row.acknowledged_at ? formatDateTime(row.acknowledged_at) : '',
    ]
      .map(csvCell)
      .join(',')
  )
  const blob = new Blob([[header.map(csvCell).join(','), ...lines].join('\n')], {
    type: 'text/csv',
  })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `emergency-${broadcast.id}-${filter}.csv`
  link.click()
  URL.revokeObjectURL(link.href)
}

export function BroadcastSheet({
  broadcastId,
  canSend,
  onClose,
  onAllClear,
}: {
  broadcastId: number | undefined
  canSend: boolean
  onClose: () => void
  onAllClear: (broadcast: EmergencyBroadcast) => void
}) {
  const broadcast = useEmergency(broadcastId)
  const data = broadcast.data
  const [filter, setFilter] = useState<RecipientFilter>('all')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [exporting, setExporting] = useState(false)
  const recipients = useEmergencyRecipients(
    broadcastId,
    { page, limit: LIMIT, filter, search: search || undefined },
    data?.status === 'sending'
  )
  const resend = useEmergencyMutation((target: 'failed' | 'not_acknowledged') =>
    emergencyApi.resend(broadcastId!, target)
  )

  const runResend = async (target: 'failed' | 'not_acknowledged') => {
    try {
      const result = await resend.mutateAsync(target)
      alerts.success(
        result.queued ? `Sending again to ${result.queued} people` : 'Nobody to send to'
      )
    } catch (error) {
      alerts.error(toApiError(error).message)
    }
  }

  const columns: Column<EmergencyRecipient>[] = [
    {
      key: 'name',
      header: 'Person',
      cell: (row) => (
        <span className='grid min-w-0'>
          <span className='truncate font-semibold'>{row.name}</span>
          <span className='truncate text-xs text-muted-foreground'>
            {row.kind === 'staff' ? 'Staff' : row.kind === 'both' ? 'Staff, parent' : 'Parent'}
            {row.students.length
              ? ` · ${row.students.map((student) => student.name).join(', ')}`
              : ''}
          </span>
        </span>
      ),
    },
    {
      key: 'push',
      header: 'Push',
      cell: (row) => (
        <Badge tone={DELIVERY[row.push_status].tone} title={row.push_error ?? undefined}>
          {row.has_app ? DELIVERY[row.push_status].label : 'No app'}
        </Badge>
      ),
    },
    {
      key: 'sms',
      header: 'SMS',
      cell: (row) => (
        <Badge tone={DELIVERY[row.sms_status].tone} title={row.sms_error ?? undefined}>
          {row.mobile ? DELIVERY[row.sms_status].label : 'No mobile'}
        </Badge>
      ),
    },
    {
      key: 'ack',
      header: 'Seen',
      cell: (row) =>
        row.acknowledged_at ? (
          <Badge tone='success'>Acknowledged</Badge>
        ) : row.read_at ? (
          <Badge tone='info'>Read</Badge>
        ) : (
          <span className='text-xs text-muted-foreground'>Not yet</span>
        ),
    },
  ]

  return (
    <Sheet open={Boolean(broadcastId)} onOpenChange={(open) => !open && onClose()}>
      <SheetContent aria-describedby={undefined} className='sm:max-w-2xl'>
        {broadcast.isError && !data ? (
          <ErrorState message={broadcast.error.message} onRetry={() => broadcast.refetch()} />
        ) : !data ? (
          <div className='grid gap-4 p-6'>
            <Skeleton className='h-16' />
            <Skeleton className='h-48' />
          </div>
        ) : (
          <>
            <SheetHeader>
              <div className='flex items-start gap-3'>
                <span className='grid size-11 shrink-0 place-items-center rounded-full bg-destructive/10 text-destructive'>
                  <Siren className='size-5' />
                </span>
                <div className='grid min-w-0 gap-0.5'>
                  <SheetTitle className='break-words'>{data.title}</SheetTitle>
                  <SheetDescription>
                    {data.audience_label} · {formatDateTime(data.sent_at)}
                    {data.sent_by ? ` · by ${data.sent_by.name}` : ''}
                  </SheetDescription>
                  <div className='mt-1 flex flex-wrap gap-1.5'>
                    <Badge tone={BROADCAST_STATUS[data.status].tone} dot>
                      {BROADCAST_STATUS[data.status].label}
                    </Badge>
                    <Badge tone={SEVERITY[data.severity].tone}>
                      {SEVERITY[data.severity].label}
                    </Badge>
                    <Badge tone='neutral'>{CATEGORY_LABEL[data.category]}</Badge>
                    {data.follow_up_of && (
                      <Badge tone='info'>Follows “{data.follow_up_of.name}”</Badge>
                    )}
                  </div>
                </div>
              </div>
            </SheetHeader>
            <SheetBody className='grid content-start gap-5'>
              <p className='rounded-lg border bg-muted/30 p-3 text-sm whitespace-pre-line'>
                {data.message}
                {data.message_ta && (
                  <span className='mt-2 block text-muted-foreground'>{data.message_ta}</span>
                )}
              </p>
              <div className='grid grid-cols-2 gap-2 sm:grid-cols-4'>
                <Stat
                  label='People'
                  value={data.counts.total}
                  hint={`${data.counts.parents} parents · ${data.counts.staff} staff`}
                />
                <Stat
                  label='Reached'
                  value={pct(data.counts.reached_percent)}
                  hint={`push ${data.counts.push.sent} · SMS ${data.counts.sms.sent}`}
                />
                <Stat
                  label='Read'
                  value={data.counts.read}
                  hint={`of ${data.counts.in_app} in the app`}
                />
                <Stat
                  label='Acknowledged'
                  value={pct(data.counts.acknowledged_percent)}
                  hint={`${data.counts.acknowledged} people`}
                />
              </div>
              {(data.counts.push.failed > 0 ||
                data.counts.sms.failed > 0 ||
                data.counts.push.skipped > 0) && (
                <p className='text-xs text-muted-foreground'>
                  Push: {data.counts.push.failed} failed, {data.counts.push.skipped} not sent · SMS:{' '}
                  {data.counts.sms.failed} failed, {data.counts.sms.skipped} not sent. Hover a
                  status to see why.
                </p>
              )}
              {canSend && (
                <div className='flex flex-wrap gap-2 rounded-lg border bg-muted/30 p-3'>
                  <Button
                    size='sm'
                    variant='outline'
                    disabled={
                      data.status === 'sending' || data.counts.acknowledged === data.counts.total
                    }
                    loading={resend.isPending && resend.variables === 'not_acknowledged'}
                    onClick={() => void runResend('not_acknowledged')}
                  >
                    <RefreshCcw />
                    Send again to not acknowledged
                  </Button>
                  <Button
                    size='sm'
                    variant='outline'
                    disabled={
                      data.status === 'sending' ||
                      data.counts.push.failed + data.counts.sms.failed === 0
                    }
                    loading={resend.isPending && resend.variables === 'failed'}
                    onClick={() => void runResend('failed')}
                  >
                    <RefreshCcw />
                    Retry failed
                  </Button>
                  {data.category !== 'all_clear' && (
                    <Button size='sm' onClick={() => onAllClear(data)}>
                      <ShieldCheck />
                      Send all clear
                    </Button>
                  )}
                </div>
              )}
              <div className='grid gap-3'>
                <div className='flex flex-wrap items-center justify-between gap-2'>
                  <SegmentedControl
                    label='Show people'
                    value={filter}
                    onChange={(value: RecipientFilter) => {
                      setFilter(value)
                      setPage(1)
                    }}
                    options={FILTERS}
                    className='flex-wrap'
                  />
                  <Button
                    size='sm'
                    variant='ghost'
                    loading={exporting}
                    onClick={async () => {
                      setExporting(true)
                      try {
                        await exportCsv(data, filter)
                      } catch (error) {
                        alerts.error(toApiError(error).message)
                      } finally {
                        setExporting(false)
                      }
                    }}
                  >
                    <Download />
                    Export CSV
                  </Button>
                </div>
                <SearchBox
                  value={search}
                  onChange={(value) => {
                    setSearch(value)
                    setPage(1)
                  }}
                  placeholder='Name, mobile or child'
                  label='Search people'
                />
                <DataTable
                  rows={recipients.data?.items ?? []}
                  columns={columns}
                  rowKey={(row) => row.id}
                  loading={recipients.isPending}
                  error={recipients.error?.message}
                  onRetry={() => void recipients.refetch()}
                  empty={{ icon: Siren, title: 'Nobody here', description: 'Try another filter.' }}
                  card={(row) => (
                    <div className='grid gap-1.5'>
                      <span className='font-semibold'>{row.name}</span>
                      <span className='flex flex-wrap gap-1.5'>
                        <Badge tone={DELIVERY[row.push_status].tone}>
                          Push: {row.has_app ? DELIVERY[row.push_status].label : 'No app'}
                        </Badge>
                        <Badge tone={DELIVERY[row.sms_status].tone}>
                          SMS: {row.mobile ? DELIVERY[row.sms_status].label : 'No mobile'}
                        </Badge>
                        {row.acknowledged_at && <Badge tone='success'>Acknowledged</Badge>}
                      </span>
                    </div>
                  )}
                  pagination={
                    recipients.data
                      ? {
                          page,
                          limit: recipients.data.limit,
                          total: recipients.data.total,
                          label: 'people',
                          onPageChange: setPage,
                        }
                      : undefined
                  }
                />
              </div>
            </SheetBody>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
