import { useState } from 'react'
import { getRouteApi, Link, useNavigate } from '@tanstack/react-router'
import {
  BedDouble,
  BedSingle,
  CircleOff,
  DoorClosed,
  Layers,
  Plus,
  Settings2,
  UserRound,
  Wrench,
} from 'lucide-react'
import { DataTable, type Column } from '@/components/common/data-table'
import { EmptyState } from '@/components/common/display'
import { InsightCards, type Insight } from '@/components/common/insight-cards'
import { FilterSelect, ListToolbar, SearchBox } from '@/components/common/list-toolbar'
import { Page, PageHeader } from '@/components/common/page'
import { useShortcut } from '@/components/shortcuts/shortcut-context'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { can, useMe } from '@/features/auth/api'
import { useHostelDashboard, useHostels, useRooms, type Room, type RoomStatus } from '../api'
import { HostelTabs } from '../components/hostel-tabs'
import { BlockSelect, HostelSelect, RoomTypeSelect } from '../components/pickers'
import { AddRoomModal, BulkRoomsModal } from '../components/room-forms'
import { BedDots } from '../components/room-parts'
import { RoomSheet } from '../components/room-sheet'
import { ROOM_STATUS, toneOptions } from '../labels'
import type { RoomsSearch } from '../search'

const route = getRouteApi('/_app/hostel/rooms')
const LIMIT = 20

export function RoomsPage() {
  const search = route.useSearch()
  const navigate = useNavigate({ from: '/hostel/rooms' })
  const me = useMe().data
  const canView = can(me, 'hostel.view')
  const canManage = can(me, 'hostel.manage')
  const [adding, setAdding] = useState(false)
  const [bulk, setBulk] = useState(false)

  const hostels = useHostels(canView)
  const dashboard = useHostelDashboard(search.hostel_id, canView)
  const rooms = useRooms(
    {
      page: search.page,
      limit: LIMIT,
      search: search.search,
      hostel_id: search.hostel_id,
      block_id: search.block_id,
      room_type_id: search.room_type_id,
      status: search.status,
      has_vacancy: search.has_vacancy,
      sort: search.sort,
      order: search.order,
    },
    canView
  )

  const setSearch = (patch: Partial<RoomsSearch>) =>
    void navigate({ search: (prev) => ({ ...prev, page: 1, ...patch }), replace: true })
  const openRoom = (id?: number) => void navigate({ search: (prev) => ({ ...prev, room: id }) })

  useShortcut('hostel.create', () => setAdding(true), { enabled: canManage })
  useShortcut('app.refresh', () => {
    void rooms.refetch()
    void dashboard.refetch()
  })

  if (me && !canView) {
    return (
      <Page>
        <PageHeader eyebrow='Hostel' title='Rooms and beds' />
        <EmptyState
          icon={BedDouble}
          title='No access to the hostel'
          description='Ask the school admin for the hostel permission.'
        />
      </Page>
    )
  }

  const defaults = { hostelId: search.hostel_id, blockId: search.block_id }
  const beds = dashboard.data
  const cards: Insight[] = [
    {
      key: 'total',
      label: 'Total beds',
      value: beds?.total_beds ?? 0,
      hint: `${beds?.rooms ?? 0} rooms`,
      icon: BedDouble,
      tone: 'primary',
      active: !search.has_vacancy && !search.status,
      onClick: () => setSearch({ has_vacancy: undefined, status: undefined }),
    },
    {
      key: 'vacant',
      label: 'Vacant',
      value: beds?.vacant_beds ?? 0,
      hint: `${beds?.reserved_beds ?? 0} reserved`,
      icon: BedSingle,
      tone: 'success',
      active: search.has_vacancy === true,
      onClick: () => setSearch({ has_vacancy: search.has_vacancy ? undefined : true }),
    },
    {
      key: 'occupied',
      label: 'Occupied',
      value: beds?.occupied_beds ?? 0,
      hint: `${beds?.occupancy_percent ?? 0}% full`,
      icon: UserRound,
      tone: 'info',
    },
    {
      key: 'maintenance',
      label: 'Rooms under maintenance',
      value: beds?.rooms_under_maintenance ?? 0,
      hint: `${beds?.unavailable_beds ?? 0} beds out of use`,
      icon: Wrench,
      tone: (beds?.rooms_under_maintenance ?? 0) > 0 ? 'warning' : 'neutral',
      active: search.status === 'maintenance',
      onClick: () =>
        setSearch({ status: search.status === 'maintenance' ? undefined : 'maintenance' }),
    },
  ]

  const columns: Column<Room>[] = [
    {
      key: 'room_no',
      header: 'Room',
      sortKey: 'room_no',
      cell: (row) => (
        <div className='grid min-w-0'>
          <span className='font-mono font-bold'>{row.room_no}</span>
          <span className='truncate text-xs text-muted-foreground lg:hidden'>
            {row.block_name} · {row.floor_name}
          </span>
        </div>
      ),
    },
    {
      key: 'location',
      header: 'Hostel · block · floor',
      hideBelow: 'lg',
      cell: (row) => (
        <span className='text-sm'>
          {row.hostel_name} · {row.block_name} · {row.floor_name}
        </span>
      ),
    },
    { key: 'type', header: 'Room type', cell: (row) => row.room_type_name },
    {
      key: 'capacity',
      header: 'Beds',
      sortKey: 'capacity',
      cell: (row) => <span className='tabular'>{row.capacity}</span>,
    },
    {
      key: 'vacant_beds',
      header: 'In use',
      sortKey: 'vacant_beds',
      cell: (row) => (
        <BedDots capacity={row.capacity} occupied={row.occupied_beds} vacant={row.vacant_beds} />
      ),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (row) => (
        <Badge tone={ROOM_STATUS[row.status].tone} dot>
          {ROOM_STATUS[row.status].label}
        </Badge>
      ),
    },
  ]

  const filtered = Boolean(
    search.search ||
    search.hostel_id ||
    search.block_id ||
    search.room_type_id ||
    search.status ||
    search.has_vacancy
  )
  const noHostels = hostels.data?.length === 0

  return (
    <Page>
      <PageHeader
        eyebrow='Hostel'
        title='Rooms and beds'
        description='Every room with its beds and who sleeps where. Open a room to block a bed or change it.'
        actions={
          canManage && !noHostels ? (
            <>
              <Button variant='outline' onClick={() => setBulk(true)}>
                <Layers />
                Add rooms in bulk
              </Button>
              <Button onClick={() => setAdding(true)}>
                <Plus />
                Add room
              </Button>
            </>
          ) : undefined
        }
      />
      <HostelTabs active='/hostel/rooms' />

      <InsightCards items={cards} loading={dashboard.isPending} />

      <Card className='overflow-hidden'>
        <ListToolbar
          summary={
            rooms.data ? `${rooms.data.total} ${rooms.data.total === 1 ? 'room' : 'rooms'}` : ''
          }
          onClear={
            filtered ? () => void navigate({ search: { page: 1 }, replace: true }) : undefined
          }
        >
          <SearchBox
            value={search.search ?? ''}
            onChange={(value) => setSearch({ search: value || undefined })}
            placeholder='Search room number'
            label='Search rooms'
          />
          {(hostels.data?.length ?? 0) > 1 && (
            <HostelSelect
              id='rooms-hostel'
              label='Filter by hostel'
              allLabel='All hostels'
              value={search.hostel_id ? String(search.hostel_id) : undefined}
              onChange={(value) =>
                setSearch({ hostel_id: value ? Number(value) : undefined, block_id: undefined })
              }
            />
          )}
          <BlockSelect
            id='rooms-block'
            label='Filter by block'
            allLabel='All blocks'
            hostelId={search.hostel_id}
            value={search.block_id ? String(search.block_id) : undefined}
            onChange={(value) => setSearch({ block_id: value ? Number(value) : undefined })}
          />
          <RoomTypeSelect
            id='rooms-type'
            label='Filter by room type'
            allLabel='All room types'
            value={search.room_type_id ? String(search.room_type_id) : undefined}
            onChange={(value) => setSearch({ room_type_id: value ? Number(value) : undefined })}
          />
          <FilterSelect
            id='rooms-status'
            label='Filter by status'
            allLabel='Any status'
            value={search.status}
            options={toneOptions(ROOM_STATUS)}
            onChange={(value) => setSearch({ status: value as RoomStatus | undefined })}
          />
          <Button
            variant={search.has_vacancy ? 'default' : 'outline'}
            aria-pressed={Boolean(search.has_vacancy)}
            onClick={() => setSearch({ has_vacancy: search.has_vacancy ? undefined : true })}
          >
            <BedSingle />
            Has a vacant bed
          </Button>
        </ListToolbar>

        <DataTable
          rows={rooms.data?.items ?? []}
          columns={columns}
          rowKey={(row) => row.id}
          loading={rooms.isFetching}
          error={rooms.isError ? rooms.error.message : null}
          onRetry={() => rooms.refetch()}
          onRowClick={(row) => openRoom(row.id)}
          sort={{ sort: search.sort ?? 'room_no', order: search.order ?? 'asc' }}
          onSortChange={(next) => setSearch(next as Partial<RoomsSearch>)}
          empty={
            noHostels
              ? {
                  icon: Settings2,
                  title: 'No hostel set up yet',
                  description: 'Add a hostel, its blocks, floors and room types first.',
                  action: canManage ? (
                    <Button asChild>
                      <Link to='/hostel/setup' search={{ tab: 'hostels' }}>
                        <Settings2 />
                        Set up the hostel
                      </Link>
                    </Button>
                  ) : undefined,
                }
              : {
                  icon: filtered ? CircleOff : DoorClosed,
                  title: filtered ? 'No rooms match these filters' : 'No rooms yet',
                  description: filtered
                    ? 'Try another block or status, or clear the filters.'
                    : 'Add rooms one by one, or a whole floor at once.',
                  action:
                    canManage && !filtered ? (
                      <Button onClick={() => setAdding(true)}>
                        <Plus />
                        Add room
                      </Button>
                    ) : undefined,
                }
          }
          card={(row) => (
            <div className='grid gap-1.5'>
              <div className='flex items-start justify-between gap-2'>
                <div className='grid min-w-0'>
                  <span className='font-mono font-bold'>{row.room_no}</span>
                  <span className='truncate text-xs text-muted-foreground'>
                    {row.hostel_name} · {row.block_name} · {row.floor_name}
                  </span>
                </div>
                <Badge tone={ROOM_STATUS[row.status].tone} dot className='shrink-0'>
                  {ROOM_STATUS[row.status].label}
                </Badge>
              </div>
              <div className='flex flex-wrap items-center justify-between gap-2'>
                <span className='text-xs text-muted-foreground'>{row.room_type_name}</span>
                <BedDots
                  capacity={row.capacity}
                  occupied={row.occupied_beds}
                  vacant={row.vacant_beds}
                />
              </div>
            </div>
          )}
          pagination={{
            page: search.page,
            limit: LIMIT,
            total: rooms.data?.total ?? 0,
            label: 'rooms',
            onPageChange: (page) => void navigate({ search: (prev) => ({ ...prev, page }) }),
          }}
        />
      </Card>

      <RoomSheet roomId={search.room} onClose={() => openRoom(undefined)} />
      <AddRoomModal
        open={adding}
        defaults={defaults}
        onOpenChange={setAdding}
        onCreated={(room) => openRoom(room.id)}
      />
      <BulkRoomsModal open={bulk} defaults={defaults} onOpenChange={setBulk} />
    </Page>
  )
}
