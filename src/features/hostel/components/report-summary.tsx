import {
  ClipboardList,
  DoorOpen,
  Gavel,
  HeartPulse,
  IndianRupee,
  ListChecks,
  LogOut,
  Percent,
  TimerOff,
  UsersRound,
  Wrench,
} from 'lucide-react'
import { rupees } from '@/features/fees/labels'
import { formatDate } from '@/lib/format'
import { useSummaryReport, type ReportParams } from '../api-reports'
import type { HostelReport } from '../search'
import { percent } from './report-helpers'
import { ReportFrame, StatGrid, StatLink } from './report-parts'

export function SummaryReportView({
  params,
  onOpen,
}: {
  params: ReportParams
  onOpen: (report: HostelReport) => void
}) {
  const query = useSummaryReport(params)
  return (
    <ReportFrame query={query}>
      {(data) => (
        <>
          <section className='grid gap-3'>
            <h2 className='text-sm font-bold'>Right now</h2>
            <StatGrid>
              <StatLink
                label='Residents'
                value={data.residents}
                hint={`${data.beds} beds in all`}
                icon={UsersRound}
                onOpen={() => onOpen('occupancy')}
              />
              <StatLink
                label='Occupancy'
                value={percent(data.occupancy_percent)}
                hint={`${data.occupied_beds} of ${data.beds} beds occupied`}
                icon={Percent}
                onOpen={() => onOpen('occupancy')}
              />
              <StatLink
                label='Open leaves'
                value={data.open_leaves}
                hint={`${data.out_now} residents out now`}
                icon={LogOut}
                tone={data.out_now > 0 ? 'warning' : 'primary'}
                onOpen={() => onOpen('leaves')}
              />
              <StatLink
                label='Visitors inside'
                value={data.visitors_inside}
                hint='Checked in and not left'
                icon={DoorOpen}
                tone='neutral'
                onOpen={() => onOpen('visitors')}
              />
              <StatLink
                label='Open complaints'
                value={data.open_complaints}
                hint='Open or in progress'
                icon={ClipboardList}
                tone={data.open_complaints > 0 ? 'warning' : 'success'}
                onOpen={() => onOpen('complaints')}
              />
              <StatLink
                label='Open maintenance tickets'
                value={data.open_tickets}
                hint='Not done or cancelled'
                icon={Wrench}
                tone={data.open_tickets > 0 ? 'warning' : 'success'}
                onOpen={() => onOpen('complaints')}
              />
              <StatLink
                label='In the sick bay'
                value={data.sick_bay_now}
                hint='Residents resting now'
                icon={HeartPulse}
                tone={data.sick_bay_now > 0 ? 'danger' : 'neutral'}
                onOpen={() => onOpen('health')}
              />
              <StatLink
                label='Hostel rent due'
                value={rupees(data.outstanding_fees)}
                hint={`${data.residents_with_dues} residents owe · academic year being viewed`}
                icon={IndianRupee}
                tone={data.outstanding_fees > 0 ? 'warning' : 'success'}
                onOpen={() => onOpen('fees')}
              />
            </StatGrid>
          </section>

          <section className='grid gap-3'>
            <h2 className='text-sm font-bold'>
              {formatDate(data.period.from)} to {formatDate(data.period.to)}
              <span className='font-normal text-muted-foreground'> · {data.period.days} days</span>
            </h2>
            <StatGrid className='lg:grid-cols-3 2xl:grid-cols-3'>
              <StatLink
                label='Roll call present'
                value={percent(data.attendance_percent)}
                hint='Present and late, out of those marked in the hostel'
                icon={ListChecks}
                tone='success'
                onOpen={() => onOpen('attendance')}
              />
              <StatLink
                label='Late returns'
                value={data.late_returns}
                hint='Came back after the expected time'
                icon={TimerOff}
                tone={data.late_returns > 0 ? 'warning' : 'success'}
                onOpen={() => onOpen('leaves')}
              />
              <StatLink
                label='Discipline cases'
                value={data.discipline_cases}
                hint='Incidents in the period, withdrawn left out'
                icon={Gavel}
                tone={data.discipline_cases > 0 ? 'danger' : 'success'}
                onOpen={() => onOpen('discipline')}
              />
            </StatGrid>
          </section>
        </>
      )}
    </ReportFrame>
  )
}
