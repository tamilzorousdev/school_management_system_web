import { useState } from 'react'
import { CircleOff, Download, DoorOpen, Plus } from 'lucide-react'
import { DataTable, type Column } from '@/components/common/data-table'
import { FilterSelect, ListToolbar, SearchBox } from '@/components/common/list-toolbar'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useClasses } from '@/features/setup/api'
import { DateRangeInputs } from '@/features/maintenance/components/shared'
import { alerts } from '@/lib/alerts'
import { toApiError } from '@/lib/api/errors'
import { formatDate, formatDateTime } from '@/lib/format'
import { gateApi, useGatePasses, type GatePass, type PassListParams } from '../api'
import { useDetail } from '../helpers'
import {
  CHECK_METHOD_OPTIONS,
  EMERGENCY_OPTIONS,
  PASS_SOURCE,
  PASS_SOURCE_OPTIONS,
  PASS_STATUS_OPTIONS,
} from '../labels'
import type { GateSearch, GateTabProps } from '../search'
import { GateDetail } from './gate-detail'
import { PassFormModal } from './pass-form-modal'
import { PassBadges, PassStatusBadge, PersonCell, StudentCell } from './shared'

const LIMIT = 20
const SORTS = ['pass_date', 'created_at', 'released_at'] as const

export function PassesTab({
  search,
  setSearch,
  onPageChange,
  onClear,
  canManage,
  canApprove,
  adding,
  onAddingChange,
}: GateTabProps) {
  const detail = useDetail()
  const classes = useClasses()
  const [downloading, setDownloading] = useState(false)
  const sort = SORTS.find((item) => item === search.sort)
  const filters: Omit<PassListParams, 'page' | 'limit'> = {
    search: search.search,
    sort,
    order: sort ? search.order : undefined,
    from: search.from,
    to: search.to,
    status: search.status,
    source: search.source,
    method: search.method,
    emergency: search.emergency,
    class_id: search.class_id,
    section_id: search.section_id,
  }
  const passes = useGatePasses({ page: search.page, limit: LIMIT, ...filters })
  const rows = passes.data?.items ?? []

  const classOptions = (classes.data ?? []).map((item) => ({
    value: String(item.id),
    label: `Class ${item.name}`,
  }))
  const sectionOptions = (
    classes.data?.find((item) => item.id === search.class_id)?.sections ?? []
  ).map((item) => ({ value: String(item.id), label: `Section ${item.name}` }))

  const download = async () => {
    setDownloading(true)
    try {
      await gateApi.downloadPasses(filters)
    } catch (error) {
      alerts.error(toApiError(error).message)
    } finally {
      setDownloading(false)
    }
  }

  const columns: Column<GatePass>[] = [
    {
      key: 'pass',
      header: 'Pass',
      sortKey: 'pass_date',
      cell: (pass) => (
        <div className='grid min-w-0'>
          <span className='font-mono text-xs font-semibold'>{pass.pass_no}</span>
          <span className='tabular text-sm font-semibold whitespace-nowrap'>
            {formatDate(pass.pass_date)}
          </span>
          <span className='tabular text-xs text-muted-foreground'>
            {pass.from_time} – {pass.until_time}
          </span>
        </div>
      ),
    },
    { key: 'student', header: 'Student', cell: (pass) => <StudentCell student={pass.student} /> },
    {
      key: 'pickup',
      header: 'Picked up by',
      cell: (pass) => <PersonCell person={pass.pickup} size='sm' />,
    },
    {
      key: 'status',
      header: 'Status',
      cell: (pass) => (
        <div className='grid justify-items-start gap-1'>
          <PassStatusBadge pass={pass} />
          <PassBadges pass={pass} />
        </div>
      ),
    },
    {
      key: 'created_at',
      header: 'Requested',
      sortKey: 'created_at',
      hideBelow: 'lg',
      cell: (pass) => (
        <div className='grid'>
          <span className='text-sm'>{PASS_SOURCE[pass.source]}</span>
          <span className='tabular text-xs text-muted-foreground'>
            {formatDateTime(pass.created_at)}
          </span>
        </div>
      ),
    },
    {
      key: 'released_at',
      header: 'Released',
      sortKey: 'released_at',
      hideBelow: 'xl',
      cell: (pass) =>
        pass.released_at ? (
          <div className='grid'>
            <span className='tabular text-sm'>{formatDateTime(pass.released_at)}</span>
            {pass.released_by && (
              <span className='text-xs text-muted-foreground'>{pass.released_by.name}</span>
            )}
          </div>
        ) : (
          <span className='text-muted-foreground'>—</span>
        ),
    },
  ]

  const filtered = Boolean(
    search.search ||
    search.from ||
    search.to ||
    search.status ||
    search.source ||
    search.method ||
    search.emergency !== undefined ||
    search.class_id ||
    search.section_id
  )

  return (
    <>
      <Card className='overflow-hidden'>
        <ListToolbar
          summary={
            passes.data ? `${passes.data.total} ${passes.data.total === 1 ? 'pass' : 'passes'}` : ''
          }
          onClear={filtered ? onClear : undefined}
        >
          <SearchBox
            value={search.search ?? ''}
            onChange={(value) => setSearch({ search: value || undefined })}
            placeholder='Search pass number, student or pickup'
            label='Search gate passes'
          />
          <DateRangeInputs from={search.from} to={search.to} onChange={setSearch} />
          <FilterSelect
            id='pass-status-filter'
            label='Filter by status'
            allLabel='All statuses'
            value={search.status}
            options={PASS_STATUS_OPTIONS}
            onChange={(value) => setSearch({ status: value as GateSearch['status'] })}
          />
          <FilterSelect
            id='pass-emergency-filter'
            label='Filter by emergency'
            allLabel='Emergency or planned'
            value={search.emergency === undefined ? undefined : String(search.emergency)}
            options={EMERGENCY_OPTIONS}
            onChange={(value) => setSearch({ emergency: value ? value === 'true' : undefined })}
          />
          <FilterSelect
            id='pass-method-filter'
            label='Filter by check'
            allLabel='Any check'
            value={search.method}
            options={CHECK_METHOD_OPTIONS}
            onChange={(value) => setSearch({ method: value as GateSearch['method'] })}
          />
          <FilterSelect
            id='pass-source-filter'
            label='Filter by requested from'
            allLabel='Requested from anywhere'
            value={search.source}
            options={PASS_SOURCE_OPTIONS}
            onChange={(value) => setSearch({ source: value as GateSearch['source'] })}
          />
          <FilterSelect
            id='pass-class-filter'
            label='Filter by class'
            allLabel='All classes'
            value={search.class_id ? String(search.class_id) : undefined}
            options={classOptions}
            onChange={(value) =>
              setSearch({ class_id: value ? Number(value) : undefined, section_id: undefined })
            }
          />
          {search.class_id && (
            <FilterSelect
              id='pass-section-filter'
              label='Filter by section'
              allLabel='All sections'
              value={search.section_id ? String(search.section_id) : undefined}
              options={sectionOptions}
              onChange={(value) => setSearch({ section_id: value ? Number(value) : undefined })}
            />
          )}
          <Button variant='outline' onClick={download} loading={downloading}>
            <Download />
            Excel
          </Button>
        </ListToolbar>
        <DataTable
          rows={rows}
          columns={columns}
          rowKey={(pass) => pass.id}
          loading={passes.isFetching}
          error={passes.isError ? passes.error.message : null}
          onRetry={() => passes.refetch()}
          onRowClick={(pass) => detail.show({ kind: 'pass', id: pass.id })}
          sort={{ sort, order: search.order ?? 'desc' }}
          onSortChange={(next) => setSearch(next as Partial<GateSearch>)}
          empty={{
            icon: filtered ? CircleOff : DoorOpen,
            title: filtered ? 'No gate passes match these filters' : 'No gate passes yet',
            description: filtered
              ? 'Try another date, status or class, or clear the filters.'
              : 'Parents ask for passes in the app. The office can also create one for a parent who phoned.',
            action: !filtered && canApprove && (
              <Button onClick={() => onAddingChange(true)}>
                <Plus />
                New gate pass
              </Button>
            ),
          }}
          card={(pass) => (
            <div className='grid gap-2'>
              <div className='flex items-start justify-between gap-2'>
                <StudentCell student={pass.student} />
                <PassStatusBadge pass={pass} />
              </div>
              <span className='flex min-w-0 items-center gap-2 text-xs text-muted-foreground'>
                With
                <PersonCell person={pass.pickup} size='sm' />
              </span>
              <span className='tabular text-xs text-muted-foreground'>
                <span className='font-mono font-semibold text-foreground'>{pass.pass_no}</span> ·{' '}
                {formatDate(pass.pass_date)} · {pass.from_time} – {pass.until_time}
              </span>
              <PassBadges pass={pass} />
            </div>
          )}
          pagination={{
            page: search.page,
            limit: LIMIT,
            total: passes.data?.total ?? 0,
            label: 'passes',
            onPageChange,
          }}
        />
      </Card>
      <PassFormModal
        open={adding}
        onOpenChange={onAddingChange}
        onCreated={(pass) => detail.show({ kind: 'pass', id: pass.id })}
      />
      <GateDetail
        target={detail.target}
        open={detail.open}
        onOpenChange={detail.setOpen}
        canManage={canManage}
        canApprove={canApprove}
      />
    </>
  )
}
