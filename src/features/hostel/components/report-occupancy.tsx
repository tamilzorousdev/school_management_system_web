import { BedDouble, BedSingle, Bookmark, Percent, Wrench } from 'lucide-react'
import { DataTable, type Column } from '@/components/common/data-table'
import { StatCard } from '@/components/common/display'
import { formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useOccupancyReport, type OccupancyCounts, type SnapshotParams } from '../api-reports'
import { percent } from './report-helpers'
import { BarList, CardFacts, ReportFrame, Section, StackBar, StatGrid } from './report-parts'

interface Row extends OccupancyCounts {
  key: string
  name: string
  hostel: boolean
}

const segments = (counts: OccupancyCounts) => [
  { key: 'occupied', label: 'Occupied', value: counts.occupied, tone: 'primary' as const },
  { key: 'vacant', label: 'Vacant', value: counts.vacant, tone: 'success' as const },
  { key: 'reserved', label: 'Reserved', value: counts.reserved, tone: 'info' as const },
  { key: 'blocked', label: 'Blocked', value: counts.blocked, tone: 'warning' as const },
  {
    key: 'maintenance',
    label: 'Maintenance',
    value: counts.maintenance,
    tone: 'danger' as const,
  },
]

const columns: Column<Row>[] = [
  {
    key: 'name',
    header: 'Hostel / block',
    cell: (row) => (
      <span className={cn(row.hostel ? 'font-bold' : 'pl-4 text-muted-foreground')}>
        {row.name}
      </span>
    ),
  },
  { key: 'rooms', header: 'Rooms', align: 'right', cell: (row) => row.rooms },
  { key: 'beds', header: 'Beds', align: 'right', cell: (row) => row.beds },
  { key: 'occupied', header: 'Occupied', align: 'right', cell: (row) => row.occupied },
  { key: 'vacant', header: 'Vacant', align: 'right', cell: (row) => row.vacant },
  {
    key: 'reserved',
    header: 'Reserved',
    align: 'right',
    hideBelow: 'lg',
    cell: (row) => row.reserved,
  },
  {
    key: 'out',
    header: 'Out of use',
    align: 'right',
    hideBelow: 'lg',
    cell: (row) => row.blocked + row.maintenance,
  },
  {
    key: 'percent',
    header: 'Occupancy',
    align: 'right',
    cell: (row) => <span className='font-semibold'>{percent(row.occupancy_percent)}</span>,
  },
]

export function OccupancyReportView({ params }: { params: SnapshotParams }) {
  const query = useOccupancyReport(params)
  return (
    <ReportFrame query={query}>
      {(data) => {
        const totals = data.totals
        const rows: Row[] = data.hostels.flatMap((hostel) => [
          { ...hostel, key: `h${hostel.hostel_id}`, name: hostel.hostel_name, hostel: true },
          ...hostel.blocks.map((block) => ({
            ...block,
            key: `h${hostel.hostel_id}-b${block.block_id ?? 'none'}`,
            name: block.block_name ?? 'No block',
            hostel: false,
          })),
        ])
        return (
          <>
            <StatGrid>
              <StatCard
                label='Occupancy'
                value={percent(totals.occupancy_percent)}
                hint={`${totals.occupied} of ${totals.beds} beds · as of ${formatDate(data.as_of)}`}
                icon={Percent}
              />
              <StatCard
                label='Vacant beds'
                value={totals.vacant}
                hint={`${totals.rooms} rooms in all`}
                icon={BedDouble}
                tone='success'
              />
              <StatCard
                label='Reserved beds'
                value={totals.reserved}
                hint='Held for an incoming resident'
                icon={Bookmark}
                tone='neutral'
              />
              <StatCard
                label='Beds out of use'
                value={totals.blocked + totals.maintenance}
                hint={`${totals.blocked} blocked · ${totals.maintenance} under maintenance`}
                icon={Wrench}
                tone={totals.blocked + totals.maintenance > 0 ? 'warning' : 'neutral'}
              />
            </StatGrid>

            <Section
              title='Beds by status'
              description={`Snapshot as of ${formatDate(data.as_of)}; the date range does not apply.`}
            >
              <StackBar segments={segments(totals)} />
            </Section>

            <div className='grid gap-6 xl:grid-cols-[2fr_1fr]'>
              <Section title='By hostel and block' flush>
                <DataTable
                  rows={rows}
                  columns={columns}
                  rowKey={(row) => row.key}
                  empty={{ icon: BedSingle, title: 'No beds set up yet' }}
                  card={(row) => (
                    <div className='grid gap-2'>
                      <div className='flex items-center justify-between gap-3'>
                        <span
                          className={cn('font-semibold', !row.hostel && 'text-muted-foreground')}
                        >
                          {row.hostel ? row.name : `↳ ${row.name}`}
                        </span>
                        <span className='tabular font-bold'>{percent(row.occupancy_percent)}</span>
                      </div>
                      <CardFacts
                        items={[
                          { label: 'Beds', value: row.beds },
                          { label: 'Occupied', value: row.occupied },
                          { label: 'Vacant', value: row.vacant },
                        ]}
                      />
                    </div>
                  )}
                />
              </Section>

              <Section title='By room type' description='Occupied beds out of all beds'>
                <BarList
                  max={100}
                  empty='No room types yet.'
                  items={data.room_types.map((type) => ({
                    key: String(type.room_type_id),
                    label: type.room_type_name,
                    value: type.occupancy_percent ?? 0,
                    display: `${percent(type.occupancy_percent)} · ${type.occupied}/${type.beds}`,
                  }))}
                />
              </Section>
            </div>
          </>
        )
      }}
    </ReportFrame>
  )
}
