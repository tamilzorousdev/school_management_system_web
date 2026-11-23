import { useState } from 'react'
import { getRouteApi, useNavigate } from '@tanstack/react-router'
import { CircleOff, FileSpreadsheet, ScrollText } from 'lucide-react'
import { DataTable, type Column } from '@/components/common/data-table'
import { EmptyState } from '@/components/common/display'
import { FilterSelect, ListToolbar, SearchBox } from '@/components/common/list-toolbar'
import { Page, PageHeader } from '@/components/common/page'
import { useShortcut } from '@/components/shortcuts/shortcut-context'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { can, useMe } from '@/features/auth/api'
import { alerts } from '@/lib/alerts'
import { toApiError } from '@/lib/api/errors'
import { downloadFile } from '@/lib/files'
import { formatDateTime } from '@/lib/format'
import { galleryApi, useGalleryAudit, type AuditLog } from '../api'
import { GalleryTabs } from '../components/gallery-tabs'
import { UserFilter } from '../components/pickers'
import { AUDIT_ACTION_OPTIONS, auditActionLabel } from '../labels'
import type { GalleryAuditSearch } from '../search'

const route = getRouteApi('/_app/gallery/audit')
const LIMIT = 25

function Details({ log }: { log: AuditLog }) {
  const entries = Object.entries(log.details ?? {}).filter(
    ([, value]) => value !== null && value !== undefined && value !== ''
  )
  const refs = [
    log.album_id ? `Album #${log.album_id}` : null,
    log.media_id ? `Media #${log.media_id}` : null,
    log.class_id ? `Class #${log.class_id}` : null,
    log.section_id ? `Section #${log.section_id}` : null,
    log.ip ? `IP ${log.ip}` : null,
  ].filter(Boolean)
  if (!entries.length && !refs.length) return <span className='text-muted-foreground'>—</span>
  return (
    <details className='group text-xs'>
      <summary className='cursor-pointer font-semibold text-primary select-none'>
        {entries.length ? `${entries.length} details` : 'Details'}
      </summary>
      <dl className='mt-2 grid gap-1 rounded-md border bg-muted/40 p-2'>
        {refs.length > 0 && <div className='text-muted-foreground'>{refs.join(' · ')}</div>}
        {entries.map(([key, value]) => (
          <div key={key} className='grid grid-cols-[minmax(0,8rem)_1fr] gap-2'>
            <dt className='truncate text-muted-foreground'>{key.replace(/_/g, ' ')}</dt>
            <dd className='font-mono break-all'>
              {typeof value === 'object' ? JSON.stringify(value) : String(value)}
            </dd>
          </div>
        ))}
      </dl>
    </details>
  )
}

export function GalleryAuditPage() {
  const search = route.useSearch()
  const navigate = useNavigate({ from: '/gallery/audit' })
  const me = useMe().data
  const allowed = can(me, 'gallery.audit')
  const audit = useGalleryAudit({ ...search, limit: LIMIT }, allowed)
  const [exporting, setExporting] = useState(false)

  const setSearch = (patch: Partial<GalleryAuditSearch>) =>
    navigate({ search: (prev) => ({ ...prev, page: 1, ...patch }), replace: true })

  useShortcut('app.refresh', () => void audit.refetch())

  const columns: Column<AuditLog>[] = [
    {
      key: 'created_at',
      header: 'When',
      sortKey: 'created_at',
      cell: (log) => (
        <span className='tabular whitespace-nowrap'>{formatDateTime(log.created_at)}</span>
      ),
    },
    {
      key: 'user_name',
      header: 'User',
      sortKey: 'user_name',
      cell: (log) => (
        <div className='grid'>
          <span className='font-semibold'>{log.user_name ?? 'System'}</span>
          <span className='text-xs text-muted-foreground'>{log.user_role ?? '—'}</span>
        </div>
      ),
    },
    {
      key: 'action',
      header: 'Action',
      sortKey: 'action',
      cell: (log) => <span className='font-medium'>{auditActionLabel(log.action)}</span>,
    },
    {
      key: 'result',
      header: 'Result',
      cell: (log) =>
        log.result === 'success' ? (
          <Badge tone='success' dot>
            Success
          </Badge>
        ) : (
          <Badge tone='danger' dot>
            Failure
          </Badge>
        ),
    },
    {
      key: 'details',
      header: 'Details',
      className: 'w-[28rem]',
      cell: (log) => <Details log={log} />,
    },
  ]

  const filtered = Boolean(
    search.search || search.action || search.user_id || search.result || search.from || search.to
  )

  const exportLog = async () => {
    setExporting(true)
    try {
      await downloadFile(galleryApi.auditExportUrl, 'gallery-audit-log.xlsx', {
        search: search.search,
        action: search.action,
        user_id: search.user_id,
        result: search.result,
        from: search.from,
        to: search.to,
        sort: search.sort,
        order: search.order,
        page: search.page,
        limit: 100,
      })
    } catch (error) {
      alerts.error(toApiError(error).message)
    } finally {
      setExporting(false)
    }
  }

  if (me && !allowed) {
    return (
      <Page>
        <PageHeader eyebrow='Gallery' title='Audit log' />
        <EmptyState
          icon={ScrollText}
          title='No access to the gallery audit log'
          description='Ask the school admin for the gallery audit permission.'
        />
      </Page>
    )
  }

  return (
    <Page>
      <PageHeader
        eyebrow='Gallery'
        title='Audit log'
        description='Every upload, edit, deletion, restore, permanent deletion, setting change, hold and cleanup run. Rows can never be changed.'
        actions={
          <Button variant='outline' loading={exporting} onClick={() => void exportLog()}>
            <FileSpreadsheet />
            Export
          </Button>
        }
      />
      <GalleryTabs active='/gallery/audit' />

      <Card className='overflow-hidden'>
        <ListToolbar
          summary={audit.data ? `${audit.data.total} entries` : ''}
          onClear={filtered ? () => navigate({ search: { page: 1 }, replace: true }) : undefined}
        >
          <SearchBox
            value={search.search ?? ''}
            onChange={(value) => setSearch({ search: value || undefined })}
            placeholder='Search user or action'
            label='Search audit log'
          />
          <FilterSelect
            id='audit-action'
            label='Filter by action'
            allLabel='All actions'
            value={search.action}
            options={AUDIT_ACTION_OPTIONS}
            onChange={(action) => setSearch({ action })}
          />
          <UserFilter
            id='audit-user'
            label='Filter by user'
            allLabel='All users'
            value={search.user_id}
            onChange={(user_id) => setSearch({ user_id })}
          />
          <FilterSelect
            id='audit-result'
            label='Filter by result'
            allLabel='Any result'
            value={search.result}
            options={[
              { value: 'success', label: 'Success' },
              { value: 'failure', label: 'Failure' },
            ]}
            onChange={(result) => setSearch({ result: result as GalleryAuditSearch['result'] })}
          />
          <div className='flex items-center gap-2'>
            <Input
              type='date'
              aria-label='From date'
              placeholder='From'
              value={search.from ?? ''}
              max={search.to}
              className='w-36'
              onChange={(event) => setSearch({ from: event.target.value || undefined })}
            />
            <span className='text-xs text-muted-foreground'>to</span>
            <Input
              type='date'
              aria-label='To date'
              placeholder='To'
              value={search.to ?? ''}
              min={search.from}
              className='w-36'
              onChange={(event) => setSearch({ to: event.target.value || undefined })}
            />
          </div>
        </ListToolbar>
        <DataTable
          rows={audit.data?.items ?? []}
          columns={columns}
          rowKey={(log) => log.id}
          loading={audit.isFetching}
          error={audit.isError ? audit.error.message : null}
          onRetry={() => audit.refetch()}
          sort={{ sort: search.sort, order: search.order ?? 'desc' }}
          onSortChange={(next) => setSearch(next as Partial<GalleryAuditSearch>)}
          empty={{
            icon: filtered ? CircleOff : ScrollText,
            title: filtered ? 'No entries match these filters' : 'No audit entries yet',
            description: filtered ? 'Try another filter or clear them.' : undefined,
          }}
          card={(log) => (
            <div className='grid gap-1'>
              <div className='flex items-start justify-between gap-2'>
                <span className='font-semibold'>{auditActionLabel(log.action)}</span>
                <Badge tone={log.result === 'success' ? 'success' : 'danger'} dot>
                  {log.result === 'success' ? 'Success' : 'Failure'}
                </Badge>
              </div>
              <span className='text-xs text-muted-foreground'>
                {log.user_name ?? 'System'} · {log.user_role ?? '—'} ·{' '}
                {formatDateTime(log.created_at)}
              </span>
              <Details log={log} />
            </div>
          )}
          pagination={{
            page: search.page,
            limit: LIMIT,
            total: audit.data?.total ?? 0,
            label: 'entries',
            onPageChange: (page) => navigate({ search: (prev) => ({ ...prev, page }) }),
          }}
        />
      </Card>
    </Page>
  )
}
