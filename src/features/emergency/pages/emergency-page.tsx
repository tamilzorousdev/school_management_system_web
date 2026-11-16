import { useState } from 'react'
import { getRouteApi, useNavigate } from '@tanstack/react-router'
import { BellRing, CheckCheck, Loader, Plus, Siren, UsersRound } from 'lucide-react'
import { DataTable, type Column } from '@/components/common/data-table'
import { InsightCards, type Insight } from '@/components/common/insight-cards'
import { FilterSelect, ListToolbar, SearchBox } from '@/components/common/list-toolbar'
import { Page, PageHeader } from '@/components/common/page'
import { useShortcut } from '@/components/shortcuts/shortcut-context'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { can, useMe } from '@/features/auth/api'
import { formatDate, formatDateTime } from '@/lib/format'
import {
  useEmergencyInsights,
  useEmergencyList,
  type BroadcastStatus,
  type EmergencyBroadcast,
  type EmergencyCategory,
} from '../api'
import { BroadcastSheet } from '../components/broadcast-sheet'
import { ComposeModal, type ComposePrefill } from '../components/compose-modal'
import { BROADCAST_STATUS, CATEGORY_LABEL, SEVERITY } from '../labels'
import type { EmergencySearch } from '../search'

const route = getRouteApi('/_app/emergency')
const LIMIT = 20

const pct = (value: number | null | undefined) =>
  value === null || value === undefined ? '—' : `${value}%`

export function EmergencyPage() {
  const search = route.useSearch()
  const navigate = useNavigate({ from: '/emergency' })
  const canSend = can(useMe().data, 'emergency.send')
  const setSearch = (patch: Partial<EmergencySearch>) =>
    navigate({ search: (prev) => ({ ...prev, page: 1, ...patch }), replace: true })
  const list = useEmergencyList({
    page: search.page,
    limit: LIMIT,
    search: search.search,
    category: search.category,
    status: search.status,
  })
  const insights = useEmergencyInsights()
  const [composing, setComposing] = useState<ComposePrefill | null>(null)

  useShortcut('app.refresh', () => void list.refetch())

  const last = insights.data?.last
  const cards: Insight[] = [
    {
      key: 'month',
      label: 'Broadcasts this month',
      value: insights.data?.this_month ?? 0,
      hint: `${insights.data?.recipients ?? 0} people`,
      icon: Siren,
      tone: 'danger',
    },
    {
      key: 'reached',
      label: 'Reached by push or SMS',
      value: pct(insights.data?.reached_percent),
      hint: 'This month',
      icon: BellRing,
      tone: 'primary',
    },
    {
      key: 'ack',
      label: 'Acknowledged',
      value: pct(insights.data?.acknowledged_percent),
      hint: 'Pressed “I have seen this”',
      icon: CheckCheck,
      tone: 'success',
    },
    {
      key: 'last',
      label: insights.data?.sending ? 'Sending now' : 'Last broadcast',
      value: insights.data?.sending
        ? insights.data.sending
        : last
          ? formatDate(last.sent_at)
          : '—',
      hint: last ? last.title : 'None yet',
      icon: insights.data?.sending ? Loader : UsersRound,
      tone: insights.data?.sending ? 'warning' : 'neutral',
      onClick: last ? () => setSearch({ id: last.id }) : undefined,
    },
  ]

  const columns: Column<EmergencyBroadcast>[] = [
    {
      key: 'title',
      header: 'Message',
      cell: (row) => (
        <span className='grid min-w-0'>
          <span className='truncate font-semibold'>{row.title}</span>
          <span className='flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground'>
            <Badge tone={SEVERITY[row.severity].tone} className='px-1 py-0 text-[10px]'>
              {SEVERITY[row.severity].label}
            </Badge>
            {CATEGORY_LABEL[row.category]} · {row.audience_label}
          </span>
        </span>
      ),
    },
    {
      key: 'sent',
      header: 'Sent',
      hideBelow: 'lg',
      cell: (row) => (
        <span className='grid'>
          <span className='text-sm'>{formatDateTime(row.sent_at)}</span>
          <span className='text-xs text-muted-foreground'>{row.sent_by?.name ?? ''}</span>
        </span>
      ),
    },
    {
      key: 'people',
      header: 'People',
      cell: (row) => <span className='tabular'>{row.counts.total}</span>,
    },
    {
      key: 'reached',
      header: 'Reached',
      cell: (row) => <span className='tabular'>{pct(row.counts.reached_percent)}</span>,
    },
    {
      key: 'ack',
      header: 'Acknowledged',
      cell: (row) => <span className='tabular'>{pct(row.counts.acknowledged_percent)}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      cell: (row) => (
        <Badge tone={BROADCAST_STATUS[row.status].tone} dot>
          {BROADCAST_STATUS[row.status].label}
        </Badge>
      ),
    },
  ]

  const filtered = Boolean(search.search || search.category || search.status)
  return (
    <Page>
      <PageHeader
        eyebrow='Communication'
        title='Emergency broadcast'
        description='Send an urgent message to all parents, staff or chosen classes at once, by app, push and SMS, and see who has read and acknowledged it.'
        actions={
          canSend ? (
            <Button variant='destructive' onClick={() => setComposing({})}>
              <Plus />
              New emergency broadcast
            </Button>
          ) : undefined
        }
      />
      <InsightCards items={cards} loading={insights.isPending} />
      <Card className='overflow-hidden'>
        <ListToolbar
          summary={list.data ? `${list.data.total} broadcasts` : ''}
          onClear={
            filtered
              ? () => setSearch({ search: undefined, category: undefined, status: undefined })
              : undefined
          }
        >
          <SearchBox
            value={search.search ?? ''}
            onChange={(value) => setSearch({ search: value || undefined })}
            placeholder='Title or message'
            label='Search broadcasts'
          />
          <FilterSelect
            id='emergency-category'
            label='Type'
            allLabel='All types'
            value={search.category}
            options={Object.entries(CATEGORY_LABEL).map(([value, label]) => ({ value, label }))}
            onChange={(value) => setSearch({ category: value as EmergencyCategory | undefined })}
          />
          <FilterSelect
            id='emergency-status'
            label='Status'
            allLabel='All statuses'
            value={search.status}
            options={Object.entries(BROADCAST_STATUS).map(([value, item]) => ({
              value,
              label: item.label,
            }))}
            onChange={(value) => setSearch({ status: value as BroadcastStatus | undefined })}
          />
        </ListToolbar>
        <DataTable
          rows={list.data?.items ?? []}
          columns={columns}
          rowKey={(row) => row.id}
          loading={list.isPending}
          error={list.error?.message}
          onRetry={() => void list.refetch()}
          onRowClick={(row) => setSearch({ id: row.id })}
          empty={{
            icon: Siren,
            title: filtered ? 'No broadcasts match' : 'No emergency broadcasts yet',
            description: filtered
              ? 'Clear the filters to see all broadcasts.'
              : 'Use New emergency broadcast when something urgent needs every parent to know at once.',
          }}
          card={(row) => (
            <div className='grid gap-1'>
              <div className='flex items-center justify-between gap-2'>
                <span className='font-semibold'>{row.title}</span>
                <Badge tone={BROADCAST_STATUS[row.status].tone} dot>
                  {BROADCAST_STATUS[row.status].label}
                </Badge>
              </div>
              <span className='text-xs text-muted-foreground'>
                {formatDateTime(row.sent_at)} · {row.counts.total} people · reached{' '}
                {pct(row.counts.reached_percent)} · acknowledged{' '}
                {pct(row.counts.acknowledged_percent)}
              </span>
            </div>
          )}
          pagination={
            list.data
              ? {
                  page: search.page,
                  limit: list.data.limit,
                  total: list.data.total,
                  label: 'broadcasts',
                  onPageChange: (page) =>
                    navigate({ search: (prev) => ({ ...prev, page }), replace: true }),
                }
              : undefined
          }
        />
      </Card>
      <BroadcastSheet
        broadcastId={search.id}
        canSend={canSend}
        onClose={() => setSearch({ id: undefined })}
        onAllClear={(broadcast) => setComposing({ follow_up_of: broadcast })}
      />
      {composing && (
        <ComposeModal
          prefill={composing}
          onClose={() => setComposing(null)}
          onSent={(broadcast) => {
            setComposing(null)
            setSearch({ id: broadcast.id })
          }}
        />
      )}
    </Page>
  )
}
