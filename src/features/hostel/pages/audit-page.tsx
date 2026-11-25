import { getRouteApi, useNavigate } from '@tanstack/react-router'
import { BedDouble, CircleOff, ScrollText } from 'lucide-react'
import { DataTable, type Column } from '@/components/common/data-table'
import { DatePicker } from '@/components/common/date-picker'
import { EmptyState } from '@/components/common/display'
import { FilterSelect, ListToolbar, SearchBox } from '@/components/common/list-toolbar'
import { Page, PageHeader } from '@/components/common/page'
import { useShortcut } from '@/components/shortcuts/shortcut-context'
import { Card } from '@/components/ui/card'
import { can, useMe } from '@/features/auth/api'
import { formatDateTime } from '@/lib/format'
import { useHostelAudit, type AuditEntry } from '../api'
import { AUDIT_ENTITIES, auditTitle, changeLines } from '../components/audit-format'
import { HostelTabs } from '../components/hostel-tabs'
import { labelOptions } from '../labels'
import type { HostelAuditSearch } from '../search'

const route = getRouteApi('/_app/hostel/audit')
const LIMIT = 25
const ENTITY_OPTIONS = labelOptions(AUDIT_ENTITIES)

function Changes({ entry }: { entry: AuditEntry }) {
  const lines = changeLines(entry.changes)
  if (!lines.length) return <span className='text-xs text-muted-foreground'>—</span>
  return (
    <ul className='grid gap-0.5 text-xs'>
      {lines.map((line) => (
        <li key={line.key} className='break-words'>
          <span className='text-muted-foreground'>{line.label}:</span>{' '}
          {line.before !== undefined ? (
            <>
              <span className='text-muted-foreground line-through'>{line.before}</span> →{' '}
              <span className='font-semibold'>{line.after}</span>
            </>
          ) : (
            <span className='font-semibold'>{line.after}</span>
          )}
        </li>
      ))}
    </ul>
  )
}

export function HostelAuditPage() {
  const search = route.useSearch()
  const navigate = useNavigate({ from: '/hostel/audit' })
  const me = useMe().data
  const canView = can(me, 'hostel.view')
  const audit = useHostelAudit(
    {
      page: search.page,
      limit: LIMIT,
      search: search.search,
      entity: search.entity,
      from: search.from,
      to: search.to,
    },
    canView
  )

  const setSearch = (patch: Partial<HostelAuditSearch>) =>
    void navigate({ search: (prev) => ({ ...prev, page: 1, ...patch }), replace: true })

  useShortcut('app.refresh', () => void audit.refetch())

  if (me && !canView) {
    return (
      <Page>
        <PageHeader eyebrow='Hostel' title='Hostel audit log' />
        <EmptyState
          icon={BedDouble}
          title='No access to the hostel'
          description='Ask the school admin for the hostel permission.'
        />
      </Page>
    )
  }

  const columns: Column<AuditEntry>[] = [
    {
      key: 'when',
      header: 'When',
      className: 'whitespace-nowrap',
      cell: (row) => (
        <span className='tabular text-sm text-muted-foreground'>
          {formatDateTime(row.created_at)}
        </span>
      ),
    },
    {
      key: 'actor',
      header: 'By',
      cell: (row) => <span className='font-semibold'>{row.actor_name ?? 'System'}</span>,
    },
    {
      key: 'what',
      header: 'What',
      cell: (row) => (
        <div className='grid min-w-0 gap-0.5'>
          <span className='font-semibold first-letter:uppercase'>
            {auditTitle(row.entity, row.action)}
          </span>
          <span className='font-mono text-xs text-muted-foreground'>#{row.entity_id}</span>
        </div>
      ),
    },
    {
      key: 'student',
      header: 'Student',
      hideBelow: 'lg',
      cell: (row) => row.student_name ?? '—',
    },
    {
      key: 'details',
      header: 'Details',
      className: 'max-w-md',
      cell: (row) => (
        <div className='grid gap-1'>
          {row.note && <span className='text-sm'>{row.note}</span>}
          <Changes entry={row} />
        </div>
      ),
    },
  ]

  const filtered = Boolean(search.search || search.entity || search.from || search.to)

  return (
    <Page>
      <PageHeader
        eyebrow='Hostel'
        title='Hostel audit log'
        description='Who changed what in the hostel: admissions, transfers, leave, visitors, checkouts, discipline, maintenance and fees.'
      />
      <HostelTabs active='/hostel/audit' />

      <Card className='overflow-hidden'>
        <ListToolbar
          summary={
            audit.data ? `${audit.data.total} ${audit.data.total === 1 ? 'entry' : 'entries'}` : ''
          }
          onClear={
            filtered ? () => void navigate({ search: { page: 1 }, replace: true }) : undefined
          }
        >
          <SearchBox
            value={search.search ?? ''}
            onChange={(value) => setSearch({ search: value || undefined })}
            placeholder='Search action, staff, note or student'
            label='Search audit log'
          />
          <FilterSelect
            id='audit-entity'
            label='Filter by record'
            allLabel='All records'
            value={search.entity}
            options={ENTITY_OPTIONS}
            onChange={(value) => setSearch({ entity: value })}
          />
          <div className='flex w-full items-center gap-2 sm:w-auto'>
            <DatePicker
              id='audit-from'
              value={search.from ?? ''}
              max={search.to}
              placeholder='From date'
              className='sm:w-40'
              onChange={(value: string) => setSearch({ from: value || undefined })}
            />
            <span className='text-xs text-muted-foreground'>to</span>
            <DatePicker
              id='audit-to'
              value={search.to ?? ''}
              min={search.from}
              placeholder='To date'
              align='end'
              className='sm:w-40'
              onChange={(value: string) => setSearch({ to: value || undefined })}
            />
          </div>
        </ListToolbar>

        <DataTable
          rows={audit.data?.items ?? []}
          columns={columns}
          rowKey={(row) => row.id}
          loading={audit.isFetching}
          error={audit.isError ? audit.error.message : null}
          onRetry={() => audit.refetch()}
          empty={{
            icon: filtered ? CircleOff : ScrollText,
            title: filtered ? 'Nothing matches these filters' : 'Nothing logged yet',
            description: filtered
              ? 'Try another record type or date range, or clear the filters.'
              : 'Hostel changes show up here as soon as staff make them.',
          }}
          card={(row) => (
            <div className='grid gap-1.5'>
              <div className='flex items-start justify-between gap-2'>
                <span className='font-semibold first-letter:uppercase'>
                  {auditTitle(row.entity, row.action)}
                </span>
                <span className='tabular shrink-0 text-xs text-muted-foreground'>
                  {formatDateTime(row.created_at)}
                </span>
              </div>
              <span className='text-xs text-muted-foreground'>
                {[row.actor_name ?? 'System', row.student_name].filter(Boolean).join(' · ')}
              </span>
              {row.note && <span className='text-sm'>{row.note}</span>}
              <Changes entry={row} />
            </div>
          )}
          pagination={{
            page: search.page,
            limit: LIMIT,
            total: audit.data?.total ?? 0,
            label: 'entries',
            onPageChange: (page) => void navigate({ search: (prev) => ({ ...prev, page }) }),
          }}
        />
      </Card>
    </Page>
  )
}
