import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { getRouteApi, useNavigate } from '@tanstack/react-router'
import { CircleOff, Plus, Shirt } from 'lucide-react'
import { DataTable, type Column } from '@/components/common/data-table'
import { EmptyState, ErrorState } from '@/components/common/display'
import { FilterSelect, ListToolbar } from '@/components/common/list-toolbar'
import { Page, PageHeader } from '@/components/common/page'
import { useShortcut } from '@/components/shortcuts/shortcut-context'
import { Kbd } from '@/components/shortcuts/kbd'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { can, useMe } from '@/features/auth/api'
import { formatDate } from '@/lib/format'
import { useHostelModules } from '../api'
import { careKeys, useLaundryBatches, type LaundryBatch } from '../api-care'
import { HostelLifeTabs, ModuleOffState } from '../components/hostel-life-tabs'
import { ToggleFilter } from '../components/leave-form-parts'
import { LaundryBatchModal } from '../components/laundry-batch-modal'
import { LaundryBatchSheet } from '../components/laundry-batch-sheet'
import { LAUNDRY_STATUS } from '../components/laundry-helpers'
import { LaundryMissingSection } from '../components/laundry-missing'
import { HostelSelect } from '../components/pickers'
import { toneOptions } from '../labels'
import type { LaundrySearch } from '../search-life'

const route = getRouteApi('/_app/hostel/laundry')
const LIMIT = 20

export function LaundryPage() {
  const me = useMe().data
  const canView = can(me, 'hostel.view')
  const modules = useHostelModules(canView)
  const header = (
    <PageHeader
      eyebrow='Hostel'
      title='Laundry'
      description='Clothes collected from residents, sent to the laundry and returned.'
    />
  )

  if (me && !canView) {
    return (
      <Page>
        {header}
        <EmptyState
          icon={Shirt}
          title='No access to the hostel'
          description='Ask the school admin for the hostel permission.'
        />
      </Page>
    )
  }

  if (modules.data?.enabled_modules.laundry === false) {
    return (
      <Page>
        {header}
        <HostelLifeTabs active='/hostel/laundry' />
        <ModuleOffState module='laundry' />
      </Page>
    )
  }

  if (!modules.data) {
    return (
      <Page>
        {header}
        <HostelLifeTabs active='/hostel/laundry' />
        {modules.isError ? (
          <ErrorState message={modules.error.message} onRetry={() => modules.refetch()} />
        ) : (
          <Skeleton className='h-64' />
        )}
      </Page>
    )
  }

  return <LaundryBody />
}

function LaundryBody() {
  const search = route.useSearch()
  const navigate = useNavigate({ from: '/hostel/laundry' })
  const queryClient = useQueryClient()
  const me = useMe().data
  const canEdit = can(me, 'hostel.laundry')
  const [creating, setCreating] = useState(false)
  const batches = useLaundryBatches({
    page: search.page,
    limit: LIMIT,
    hostel_id: search.hostel_id,
    status: search.status,
  })

  const setSearch = (patch: Partial<LaundrySearch>) =>
    navigate({ search: (prev) => ({ ...prev, page: 1, ...patch }), replace: true })
  const openBatch = (id?: number) => navigate({ search: (prev) => ({ ...prev, batch: id }) })

  useShortcut('hostel.create', () => setCreating(true), { enabled: canEdit })
  useShortcut('app.refresh', () => {
    void queryClient.invalidateQueries({ queryKey: careKeys.all })
  })

  const filtered = Boolean(search.hostel_id || search.status)

  const columns: Column<LaundryBatch>[] = [
    {
      key: 'batch',
      header: 'Batch',
      cell: (row) => (
        <div className='grid gap-0.5'>
          <span className='font-mono text-sm font-semibold'>{row.batch_no}</span>
          <span className='text-xs text-muted-foreground'>
            Collected {formatDate(row.collected_on)}
          </span>
        </div>
      ),
    },
    {
      key: 'hostel',
      header: 'Hostel',
      hideBelow: 'lg',
      cell: (row) => (
        <div className='grid gap-0.5 text-sm'>
          <span>{row.hostel_name}</span>
          {row.vendor_name && (
            <span className='text-xs text-muted-foreground'>{row.vendor_name}</span>
          )}
        </div>
      ),
    },
    {
      key: 'residents',
      header: 'Residents',
      align: 'right',
      hideBelow: 'xl',
      cell: (row) => <span className='tabular'>{row.students}</span>,
    },
    {
      key: 'clothes',
      header: 'Clothes',
      cell: (row) => <ClothesCell batch={row} />,
    },
    {
      key: 'dates',
      header: 'Sent / back',
      hideBelow: 'xl',
      cell: (row) => (
        <span className='text-xs text-muted-foreground'>
          {formatDate(row.sent_on)} / {formatDate(row.returned_on)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (row) => (
        <Badge tone={LAUNDRY_STATUS[row.status].tone} dot>
          {LAUNDRY_STATUS[row.status].label}
        </Badge>
      ),
    },
  ]

  return (
    <Page>
      <PageHeader
        eyebrow='Hostel'
        title='Laundry'
        description='Clothes collected from residents, sent to the laundry and returned.'
        actions={
          canEdit ? (
            <Button onClick={() => setCreating(true)}>
              <Plus />
              New batch
              <Kbd id='hostel.create' inverted />
            </Button>
          ) : undefined
        }
      />
      <HostelLifeTabs active='/hostel/laundry' />

      {search.missing && (
        <LaundryMissingSection hostelId={search.hostel_id} onOpenBatch={(id) => openBatch(id)} />
      )}

      <Card className='overflow-hidden'>
        <ListToolbar
          summary={batches.data ? `${batches.data.total} batches` : ''}
          onClear={
            filtered || search.missing
              ? () => navigate({ search: { page: 1 }, replace: true })
              : undefined
          }
        >
          <HostelSelect
            id='laundry-hostel-filter'
            allLabel='All hostels'
            value={search.hostel_id ? String(search.hostel_id) : undefined}
            onChange={(value) => setSearch({ hostel_id: value ? Number(value) : undefined })}
          />
          <FilterSelect
            id='laundry-status'
            label='Filter by status'
            allLabel='Any status'
            value={search.status}
            options={toneOptions(LAUNDRY_STATUS)}
            onChange={(value) => setSearch({ status: value as LaundrySearch['status'] })}
          />
          <ToggleFilter
            id='laundry-missing'
            label='Show missing clothes'
            checked={Boolean(search.missing)}
            onChange={(missing) => setSearch({ missing })}
          />
        </ListToolbar>
        <DataTable
          rows={batches.data?.items ?? []}
          columns={columns}
          rowKey={(row) => row.id}
          loading={batches.isFetching}
          error={batches.isError ? batches.error.message : null}
          onRetry={() => batches.refetch()}
          onRowClick={(row) => openBatch(row.id)}
          empty={{
            icon: filtered ? CircleOff : Shirt,
            title: filtered ? 'No batches match these filters' : 'No laundry batches yet',
            description: filtered
              ? 'Try another filter or clear the filters.'
              : 'Start a batch when clothes are collected from the residents.',
            action:
              canEdit && !filtered ? (
                <Button onClick={() => setCreating(true)}>
                  <Plus />
                  New batch
                </Button>
              ) : undefined,
          }}
          card={(row) => (
            <div className='grid gap-2'>
              <div className='flex items-start justify-between gap-2'>
                <div className='grid gap-0.5'>
                  <span className='font-mono text-sm font-semibold'>{row.batch_no}</span>
                  <span className='text-xs text-muted-foreground'>
                    {row.hostel_name} · collected {formatDate(row.collected_on)}
                  </span>
                </div>
                <Badge tone={LAUNDRY_STATUS[row.status].tone} dot className='shrink-0'>
                  {LAUNDRY_STATUS[row.status].label}
                </Badge>
              </div>
              <div className='flex flex-wrap items-center gap-2 text-sm'>
                <span>
                  {row.students} {row.students === 1 ? 'resident' : 'residents'}
                </span>
                <ClothesCell batch={row} />
              </div>
            </div>
          )}
          pagination={{
            page: search.page,
            limit: LIMIT,
            total: batches.data?.total ?? 0,
            label: 'batches',
            onPageChange: (page) => navigate({ search: (prev) => ({ ...prev, page }) }),
          }}
        />
      </Card>

      <LaundryBatchSheet batchId={search.batch} onClose={() => openBatch(undefined)} />

      {creating && (
        <LaundryBatchModal
          defaultHostelId={search.hostel_id}
          onClose={() => setCreating(false)}
          onCreated={(batch) => openBatch(batch.id)}
        />
      )}
    </Page>
  )
}

function ClothesCell({ batch }: { batch: LaundryBatch }) {
  return (
    <div className='flex flex-wrap items-center gap-1'>
      <span className='tabular text-sm'>
        {batch.items_returned !== null
          ? `${batch.items_returned}/${batch.items_given} back`
          : `${batch.items_given} given`}
      </span>
      {batch.items_missing > 0 && <Badge tone='danger'>{batch.items_missing} missing</Badge>}
    </div>
  )
}
