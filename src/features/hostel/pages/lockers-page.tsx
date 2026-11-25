import { useState } from 'react'
import { getRouteApi, useNavigate } from '@tanstack/react-router'
import {
  Ban,
  CircleOff,
  KeyRound,
  Layers,
  Lock,
  LockOpen,
  Plus,
  UserRound,
  Wrench,
} from 'lucide-react'
import { DataTable, type Column } from '@/components/common/data-table'
import { EmptyState, ErrorState } from '@/components/common/display'
import { InsightCards, type Insight } from '@/components/common/insight-cards'
import { FilterSelect, ListToolbar, SearchBox } from '@/components/common/list-toolbar'
import { Page, PageHeader } from '@/components/common/page'
import { useShortcut } from '@/components/shortcuts/shortcut-context'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { can, useMe } from '@/features/auth/api'
import { formatDate } from '@/lib/format'
import { useHostelModules, useHostels } from '../api'
import { useLockers, useLockerSummary, type Locker, type LockerStatus } from '../api-rooms'
import { LOCKER_SIZE, LOCKER_STATUS, placeLine } from '../components/asset-labels'
import { HostelLifeTabs, ModuleOffState } from '../components/hostel-life-tabs'
import { AddLockerModal, BulkLockersModal } from '../components/locker-forms'
import { LockerSheet } from '../components/locker-sheet'
import { BlockSelect, HostelSelect } from '../components/pickers'
import { studentLine, toneOptions } from '../labels'
import type { LockersSearch } from '../search-life'

const route = getRouteApi('/_app/hostel/lockers')
const LIMIT = 20

export function LockersPage() {
  const me = useMe().data
  const canView = can(me, 'hostel.view')
  const modules = useHostelModules(canView)
  const header = <PageHeader eyebrow='Hostel' title='Lockers' />

  if (me && !canView) {
    return (
      <Page>
        {header}
        <EmptyState
          icon={Lock}
          title='No access to the hostel'
          description='Ask the school admin for the hostel permission.'
        />
      </Page>
    )
  }
  if (!modules.data) {
    return (
      <Page>
        {header}
        <HostelLifeTabs active='/hostel/lockers' />
        {modules.isError ? (
          <ErrorState message={modules.error.message} onRetry={() => modules.refetch()} />
        ) : (
          <>
            <Skeleton className='h-24' />
            <Skeleton className='h-80' />
          </>
        )}
      </Page>
    )
  }
  if (!modules.data.enabled_modules.lockers) {
    return (
      <Page>
        {header}
        <HostelLifeTabs active='/hostel/lockers' />
        <ModuleOffState module='lockers' />
      </Page>
    )
  }
  return <LockersView />
}

function LockersView() {
  const search = route.useSearch()
  const navigate = useNavigate({ from: '/hostel/lockers' })
  const me = useMe().data
  const canManage = can(me, 'hostel.locker')
  const [adding, setAdding] = useState(false)
  const [bulk, setBulk] = useState(false)

  const hostels = useHostels()
  const summary = useLockerSummary(search.hostel_id)
  const sort = search.sort ?? 'locker_no'
  const order = search.order ?? (sort === 'locker_no' ? 'asc' : 'desc')
  const lockers = useLockers({
    page: search.page,
    limit: LIMIT,
    search: search.search,
    hostel_id: search.hostel_id,
    block_id: search.block_id,
    status: search.status,
    available: search.available,
    sort,
    order,
  })

  const setSearch = (patch: Partial<LockersSearch>) =>
    void navigate({ search: (prev) => ({ ...prev, page: 1, ...patch }), replace: true })
  const openLocker = (id?: number) => void navigate({ search: (prev) => ({ ...prev, locker: id }) })
  const toggleStatus = (status: LockerStatus) =>
    setSearch({ status: search.status === status ? undefined : status, available: undefined })

  useShortcut('hostel.create', () => setAdding(true), { enabled: canManage })
  useShortcut('app.refresh', () => {
    void lockers.refetch()
    void summary.refetch()
  })

  const counts = summary.data
  const cards: Insight[] = [
    {
      key: 'total',
      label: 'Lockers',
      value: counts?.total ?? 0,
      icon: Lock,
      tone: 'primary',
      active: !search.status && !search.available,
      onClick: () => setSearch({ status: undefined, available: undefined }),
    },
    {
      key: 'available',
      label: 'Available',
      value: counts?.available ?? 0,
      icon: LockOpen,
      tone: 'success',
      active: search.available === true,
      onClick: () =>
        setSearch({ available: search.available ? undefined : true, status: undefined }),
    },
    {
      key: 'allotted',
      label: 'Allotted',
      value: counts?.allotted ?? 0,
      icon: UserRound,
      tone: 'info',
      active: search.status === 'allotted',
      onClick: () => toggleStatus('allotted'),
    },
    {
      key: 'damaged',
      label: 'Damaged',
      value: counts?.damaged ?? 0,
      icon: Wrench,
      tone: (counts?.damaged ?? 0) > 0 ? 'danger' : 'neutral',
      active: search.status === 'damaged',
      onClick: () => toggleStatus('damaged'),
    },
    {
      key: 'blocked',
      label: 'Blocked',
      value: counts?.blocked ?? 0,
      icon: Ban,
      tone: 'neutral',
      active: search.status === 'blocked',
      onClick: () => toggleStatus('blocked'),
    },
  ]

  const columns: Column<Locker>[] = [
    {
      key: 'locker_no',
      header: 'Locker',
      sortKey: 'locker_no',
      cell: (row) => (
        <div className='grid min-w-0'>
          <span className='font-mono font-bold'>{row.locker_no}</span>
          <span className='truncate text-xs text-muted-foreground lg:hidden'>
            {placeLine([row.block_name, row.room_no && `Room ${row.room_no}`]) || row.hostel_name}
          </span>
        </div>
      ),
    },
    {
      key: 'place',
      header: 'Hostel · block · room',
      hideBelow: 'lg',
      cell: (row) => (
        <span className='text-sm'>
          {placeLine([row.hostel_name, row.block_name, row.room_no && `Room ${row.room_no}`])}
        </span>
      ),
    },
    {
      key: 'size',
      header: 'Size',
      hideBelow: 'xl',
      cell: (row) => (
        <span className='text-muted-foreground'>{row.size ? LOCKER_SIZE[row.size] : '—'}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortKey: 'status',
      cell: (row) => (
        <Badge tone={LOCKER_STATUS[row.status].tone} dot>
          {LOCKER_STATUS[row.status].label}
        </Badge>
      ),
    },
    {
      key: 'holder',
      header: 'Held by',
      cell: (row) =>
        row.holder ? (
          <div className='grid min-w-0 gap-0.5'>
            <span className='truncate font-semibold'>{row.holder.student.name}</span>
            <span className='truncate text-xs text-muted-foreground'>
              {studentLine(row.holder.student)} · since {formatDate(row.holder.from_date)}
            </span>
            <span className='inline-flex items-center gap-1 text-xs text-muted-foreground'>
              <KeyRound className='size-3' />
              {row.holder.keys_given} {row.holder.keys_given === 1 ? 'key' : 'keys'}
            </span>
          </div>
        ) : (
          <span className='text-muted-foreground'>—</span>
        ),
    },
  ]

  const filtered = Boolean(
    search.search || search.hostel_id || search.block_id || search.status || search.available
  )
  const multiHostel = (hostels.data?.length ?? 0) > 1
  const defaults = { hostelId: search.hostel_id, blockId: search.block_id }

  return (
    <Page>
      <PageHeader
        eyebrow='Hostel'
        title='Lockers'
        description='Every locker, who holds it and its keys. Open a locker to allot it or take it back.'
        actions={
          canManage ? (
            <>
              <Button variant='outline' onClick={() => setBulk(true)}>
                <Layers />
                Add lockers in bulk
              </Button>
              <Button onClick={() => setAdding(true)}>
                <Plus />
                Add locker
              </Button>
            </>
          ) : undefined
        }
      />
      <HostelLifeTabs active='/hostel/lockers' />

      <InsightCards items={cards} loading={summary.isPending} />

      <Card className='overflow-hidden'>
        <ListToolbar
          summary={
            lockers.data
              ? `${lockers.data.total} ${lockers.data.total === 1 ? 'locker' : 'lockers'}`
              : ''
          }
          onClear={
            filtered ? () => void navigate({ search: { page: 1 }, replace: true }) : undefined
          }
        >
          <SearchBox
            value={search.search ?? ''}
            onChange={(value) => setSearch({ search: value || undefined })}
            placeholder='Search locker, student or admission no.'
            label='Search lockers'
          />
          {multiHostel && (
            <HostelSelect
              id='lockers-hostel'
              label='Filter by hostel'
              allLabel='All hostels'
              value={search.hostel_id ? String(search.hostel_id) : undefined}
              onChange={(value) =>
                setSearch({ hostel_id: value ? Number(value) : undefined, block_id: undefined })
              }
            />
          )}
          <BlockSelect
            id='lockers-block'
            label='Filter by block'
            allLabel='All blocks'
            hostelId={search.hostel_id}
            value={search.block_id ? String(search.block_id) : undefined}
            onChange={(value) => setSearch({ block_id: value ? Number(value) : undefined })}
          />
          <FilterSelect
            id='lockers-status'
            label='Filter by status'
            allLabel='Any status'
            value={search.status}
            options={toneOptions(LOCKER_STATUS)}
            onChange={(value) =>
              setSearch({ status: value as LockerStatus | undefined, available: undefined })
            }
          />
        </ListToolbar>

        <DataTable
          rows={lockers.data?.items ?? []}
          columns={columns}
          rowKey={(row) => row.id}
          loading={lockers.isFetching}
          error={lockers.isError ? lockers.error.message : null}
          onRetry={() => lockers.refetch()}
          onRowClick={(row) => openLocker(row.id)}
          sort={{ sort, order }}
          onSortChange={(next) => setSearch(next as Partial<LockersSearch>)}
          empty={{
            icon: filtered ? CircleOff : Lock,
            title: filtered ? 'No lockers match these filters' : 'No lockers yet',
            description: filtered
              ? 'Try another block or status, or clear the filters.'
              : 'Add lockers one by one, or a numbered run at once.',
            action:
              canManage && !filtered ? (
                <Button onClick={() => setBulk(true)}>
                  <Layers />
                  Add lockers in bulk
                </Button>
              ) : undefined,
          }}
          card={(row) => (
            <div className='grid gap-1.5'>
              <div className='flex items-start justify-between gap-2'>
                <div className='grid min-w-0'>
                  <span className='font-mono font-bold'>{row.locker_no}</span>
                  <span className='truncate text-xs text-muted-foreground'>
                    {placeLine([
                      row.hostel_name,
                      row.block_name,
                      row.room_no && `Room ${row.room_no}`,
                      row.size && LOCKER_SIZE[row.size],
                    ])}
                  </span>
                </div>
                <Badge tone={LOCKER_STATUS[row.status].tone} dot className='shrink-0'>
                  {LOCKER_STATUS[row.status].label}
                </Badge>
              </div>
              {row.holder && (
                <div className='flex flex-wrap items-center justify-between gap-2 text-xs'>
                  <span className='min-w-0 truncate'>
                    <span className='font-semibold'>{row.holder.student.name}</span>
                    <span className='text-muted-foreground'>
                      {' '}
                      · since {formatDate(row.holder.from_date)}
                    </span>
                  </span>
                  <span className='inline-flex items-center gap-1 text-muted-foreground'>
                    <KeyRound className='size-3' />
                    {row.holder.keys_given}
                  </span>
                </div>
              )}
            </div>
          )}
          pagination={{
            page: search.page,
            limit: LIMIT,
            total: lockers.data?.total ?? 0,
            label: 'lockers',
            onPageChange: (page) => void navigate({ search: (prev) => ({ ...prev, page }) }),
          }}
        />
      </Card>

      <LockerSheet lockerId={search.locker} onClose={() => openLocker(undefined)} />
      <AddLockerModal
        open={adding}
        defaults={defaults}
        onOpenChange={setAdding}
        onCreated={(locker) => openLocker(locker.id)}
      />
      <BulkLockersModal open={bulk} defaults={defaults} onOpenChange={setBulk} />
    </Page>
  )
}
