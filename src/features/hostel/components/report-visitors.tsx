import { DoorOpen, ShieldAlert, UserRoundSearch, UsersRound } from 'lucide-react'
import { StatCard } from '@/components/common/display'
import { useVisitorsReport, type ReportParams } from '../api-reports'
import { humanize, minutesText, shortDate } from './report-helpers'
import { BarList, ColumnChart, ReportFrame, Section, StatGrid } from './report-parts'

export function VisitorsReportView({ params }: { params: ReportParams }) {
  const query = useVisitorsReport(params)
  return (
    <ReportFrame query={query}>
      {(data) => (
        <>
          <StatGrid>
            <StatCard
              label='Visits'
              value={data.visits}
              hint={`${data.people} people · average stay ${minutesText(data.average_visit_minutes)}`}
              icon={UsersRound}
            />
            <StatCard
              label='Turned away'
              value={data.denied}
              hint='Denied at the gate'
              icon={ShieldAlert}
              tone={data.denied > 0 ? 'danger' : 'neutral'}
            />
            <StatCard
              label='Unknown visitors'
              value={data.unknown_visitors}
              hint='Not on the approved visitor list'
              icon={UserRoundSearch}
              tone={data.unknown_visitors > 0 ? 'warning' : 'neutral'}
            />
            <StatCard
              label='Inside now'
              value={data.inside_now}
              hint='Checked in and not left yet'
              icon={DoorOpen}
              tone='neutral'
            />
          </StatGrid>

          <div className='grid gap-6 xl:grid-cols-[2fr_1fr]'>
            <Section title='Visits per day' description='Hover a bar for the numbers'>
              <ColumnChart
                label='Visits per day'
                points={data.by_day.map((day) => ({
                  key: day.date,
                  label: shortDate(day.date),
                  value: day.visits,
                  display: `${day.visits} visits · ${day.people} people · ${day.denied} turned away`,
                }))}
              />
            </Section>
            <Section title='By relation'>
              <BarList
                tone='info'
                items={data.by_relation.map((row) => ({
                  key: row.key || 'none',
                  label: humanize(row.key ?? ''),
                  value: row.count,
                }))}
              />
            </Section>
          </div>
        </>
      )}
    </ReportFrame>
  )
}
