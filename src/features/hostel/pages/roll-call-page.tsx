import { getRouteApi, Link, useNavigate } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import { BedDouble, ListChecks, Settings2 } from 'lucide-react'
import { DatePicker } from '@/components/common/date-picker'
import { EmptyState } from '@/components/common/display'
import { Page, PageHeader } from '@/components/common/page'
import { SegmentedControl } from '@/components/common/segmented-control'
import { useShortcut } from '@/components/shortcuts/shortcut-context'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { can, useMe } from '@/features/auth/api'
import { hostelKeys, useBlocks, useHostels } from '../api'
import { HostelTabs } from '../components/hostel-tabs'
import { shiftDate, todayIso } from '../components/leave-helpers'
import { BlockSelect, HostelSelect } from '../components/pickers'
import { RollHistoryView } from '../components/roll-history'
import { RollSheetView } from '../components/roll-sheet'
import { labelOptions, ROLL_SLOT } from '../labels'
import type { RollCallSearch } from '../search'

const route = getRouteApi('/_app/hostel/roll-call')

const VIEW_OPTIONS: { value: RollCallSearch['view']; label: string }[] = [
  { value: 'sheet', label: 'Mark' },
  { value: 'history', label: 'History' },
]

export function RollCallPage() {
  const search = route.useSearch()
  const navigate = useNavigate({ from: '/hostel/roll-call' })
  const queryClient = useQueryClient()
  const me = useMe().data
  const canView = can(me, 'hostel.view')
  const canMark = can(me, 'hostel.attendance')
  const hostels = useHostels(canView)
  const hostelId = search.hostel_id ?? hostels.data?.[0]?.id
  const blocks = useBlocks(hostelId, canView && Boolean(hostelId))
  const today = todayIso()
  const minDate = shiftDate(today, -2)
  const date = search.date ?? today
  const blockName = blocks.data?.find((block) => block.id === search.block_id)?.name

  const setSearch = (patch: Partial<RollCallSearch>) =>
    navigate({ search: (prev) => ({ ...prev, ...patch }), replace: true })

  useShortcut('app.refresh', () => {
    void queryClient.invalidateQueries({ queryKey: hostelKeys.all })
  })

  const header = (
    <PageHeader
      eyebrow='Hostel'
      title='Roll call'
      description='Mark residents morning, evening and night. Students out on a hostel pass are shown as away.'
      actions={
        canView ? (
          <SegmentedControl
            label='Roll call view'
            value={search.view}
            options={VIEW_OPTIONS}
            onChange={(view) => setSearch({ view, page: 1 })}
          />
        ) : undefined
      }
    />
  )

  if (me && !canView) {
    return (
      <Page>
        {header}
        <EmptyState
          icon={ListChecks}
          title='No access to the hostel'
          description='Ask the school admin for the hostel permission.'
        />
      </Page>
    )
  }

  if (hostels.data && hostels.data.length === 0) {
    return (
      <Page>
        {header}
        <HostelTabs active='/hostel/roll-call' />
        <EmptyState
          icon={BedDouble}
          title='No hostel set up yet'
          description='Add a hostel with rooms and admit residents before taking roll call.'
          action={
            can(me, 'hostel.manage') ? (
              <Button asChild>
                <Link to='/hostel/setup' search={{ tab: 'hostels' }}>
                  <Settings2 />
                  Set up the hostel
                </Link>
              </Button>
            ) : undefined
          }
        />
      </Page>
    )
  }

  const lockedReason =
    date > today
      ? 'Roll call cannot be marked for a future date.'
      : date < minDate
        ? 'Marks can be changed only for today and the last 2 days. This sheet is read only.'
        : undefined

  return (
    <Page>
      {header}
      <HostelTabs active='/hostel/roll-call' />

      {search.view === 'history' ? (
        <RollHistoryView
          hostelId={search.hostel_id}
          page={search.page}
          onHostelChange={(value) => setSearch({ hostel_id: value, page: 1 })}
          onPageChange={(page) => navigate({ search: (prev) => ({ ...prev, page }) })}
          onOpen={(row) =>
            setSearch({
              view: 'sheet',
              hostel_id: row.hostel_id,
              slot: row.slot,
              date: row.roll_date.slice(0, 10),
              block_id: undefined,
              unmarked: undefined,
            })
          }
        />
      ) : (
        <>
          <Card className='flex flex-row flex-wrap items-center gap-3 px-4 py-3'>
            <HostelSelect
              id='roll-hostel'
              value={hostelId ? String(hostelId) : undefined}
              className='sm:w-56'
              onChange={(value) =>
                setSearch({ hostel_id: value ? Number(value) : undefined, block_id: undefined })
              }
            />
            <SegmentedControl
              label='Slot'
              value={search.slot}
              options={labelOptions(ROLL_SLOT)}
              onChange={(slot) => setSearch({ slot })}
            />
            <DatePicker
              id='roll-date'
              value={date}
              min={minDate}
              max={today}
              clearable={false}
              className='w-full sm:w-44'
              onChange={(value: string) =>
                setSearch({ date: value && value !== today ? value : undefined })
              }
            />
            <BlockSelect
              id='roll-block'
              hostelId={hostelId}
              allLabel='All blocks'
              value={search.block_id ? String(search.block_id) : undefined}
              onChange={(value) => setSearch({ block_id: value ? Number(value) : undefined })}
            />
            <div className='flex items-center gap-2'>
              <Switch
                id='roll-unmarked'
                checked={Boolean(search.unmarked)}
                onCheckedChange={(checked) => setSearch({ unmarked: checked || undefined })}
              />
              <label htmlFor='roll-unmarked' className='text-sm font-medium'>
                Only unmarked
              </label>
            </div>
          </Card>

          {hostelId ? (
            <RollSheetView
              key={`${hostelId}-${search.slot}-${date}-${search.block_id ?? 'all'}`}
              hostelId={hostelId}
              slot={search.slot}
              date={date}
              blockId={search.block_id}
              blockName={blockName}
              unmarked={search.unmarked}
              canMark={canMark}
              lockedReason={lockedReason}
            />
          ) : (
            <EmptyState
              icon={ListChecks}
              title='Choose a hostel'
              description='Pick the hostel to take roll call for.'
            />
          )}
        </>
      )}
    </Page>
  )
}
