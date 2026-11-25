import { BedSingle, Hospital, NotebookPen, Pill } from 'lucide-react'
import { StatCard } from '@/components/common/display'
import { useHealthReport, type ReportParams } from '../api-reports'
import { HEALTH_KIND } from './health-helpers'
import { decimal, labelFor, percent } from './report-helpers'
import { BarList, ReportFrame, Section, StackBar, StatGrid } from './report-parts'

export function HealthReportView({ params }: { params: ReportParams }) {
  const query = useHealthReport(params)
  return (
    <ReportFrame query={query} module='medical'>
      {(data) => (
        <>
          <StatGrid>
            <StatCard
              label='Health logs'
              value={data.total_logs}
              hint='Illness, injury, check-ups and rest'
              icon={NotebookPen}
            />
            <StatCard
              label='Hospital visits'
              value={data.hospital_visits}
              hint='Taken to a hospital or clinic'
              icon={Hospital}
              tone={data.hospital_visits > 0 ? 'warning' : 'neutral'}
            />
            <StatCard
              label='Sick bay stays'
              value={data.sick_bay_admissions}
              hint={`Average ${decimal(data.average_sick_bay_hours, ' h')} per finished stay`}
              icon={BedSingle}
              tone='neutral'
            />
            <StatCard
              label='In the sick bay now'
              value={data.sick_bay_now}
              hint='Resting right now'
              icon={BedSingle}
              tone={data.sick_bay_now > 0 ? 'danger' : 'success'}
            />
          </StatGrid>

          <div className='grid gap-6 lg:grid-cols-2'>
            <Section title='Logs by kind'>
              <BarList
                items={data.by_kind.map((row) => ({
                  key: row.key,
                  label: labelFor(HEALTH_KIND, row.key),
                  value: row.count,
                }))}
              />
            </Section>
            <Section
              title='Medication doses'
              description={`${percent(data.doses.given_percent)} of due doses given`}
              action={<Pill className='size-4 text-muted-foreground' />}
            >
              <StackBar
                segments={[
                  { key: 'given', label: 'Given', value: data.doses.given, tone: 'success' },
                  { key: 'missed', label: 'Missed', value: data.doses.missed, tone: 'danger' },
                  {
                    key: 'refused',
                    label: 'Refused',
                    value: data.doses.refused,
                    tone: 'warning',
                  },
                ]}
              />
            </Section>
          </div>
        </>
      )}
    </ReportFrame>
  )
}
