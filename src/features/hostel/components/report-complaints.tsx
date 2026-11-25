import { ClipboardList, DoorClosed, IndianRupee, Star, Timer, Wrench } from 'lucide-react'
import { StatCard } from '@/components/common/display'
import { rupees } from '@/features/fees/labels'
import { useComplaintsReport, type ReportCount, type ReportParams } from '../api-reports'
import {
  COMPLAINT_CATEGORY,
  COMPLAINT_STATUS,
  MAINTENANCE_CATEGORY,
  TICKET_STATUS,
  type Tone,
} from '../labels'
import { decimal, labelFor, percent } from './report-helpers'
import { BarList, ReportFrame, Section, StatGrid } from './report-parts'

const toned = (rows: ReportCount[], labels: Record<string, Tone>) =>
  rows.map((row) => ({
    key: row.key,
    label: labelFor(labels, row.key),
    value: row.count,
    tone: labels[row.key]?.tone,
  }))

const plain = (rows: ReportCount[], labels: Record<string, string>) =>
  rows.map((row) => ({ key: row.key, label: labelFor(labels, row.key), value: row.count }))

export function ComplaintsReportView({ params }: { params: ReportParams }) {
  const query = useComplaintsReport(params)
  return (
    <ReportFrame query={query}>
      {(data) => {
        const complaints = data.complaints
        const tickets = data.maintenance
        return (
          <>
            <StatGrid className='xl:grid-cols-3 2xl:grid-cols-3'>
              <StatCard
                label='Complaints raised'
                value={complaints.total}
                hint={`${complaints.open} still open · ${complaints.resolved} resolved`}
                icon={ClipboardList}
                tone={complaints.open > 0 ? 'warning' : 'primary'}
              />
              <StatCard
                label='Resolved on time'
                value={percent(complaints.sla_met_percent)}
                hint={`Average ${decimal(complaints.average_resolution_hours, ' h')} to resolve`}
                icon={Timer}
                tone='success'
              />
              <StatCard
                label='Parent rating'
                value={complaints.average_rating === null ? '—' : `${complaints.average_rating}/5`}
                hint={`${complaints.rated} complaints rated`}
                icon={Star}
                tone='neutral'
              />
              <StatCard
                label='Maintenance tickets'
                value={tickets.total}
                hint={`${tickets.open} still open · ${tickets.done} done`}
                icon={Wrench}
                tone={tickets.open > 0 ? 'warning' : 'primary'}
              />
              <StatCard
                label='Maintenance cost'
                value={rupees(tickets.total_cost)}
                hint={`Average ${decimal(tickets.average_days_to_done, ' days')} to finish`}
                icon={IndianRupee}
                tone='neutral'
              />
              <StatCard
                label='Rooms closed now'
                value={tickets.rooms_blocked_now}
                hint='Closed for maintenance right now'
                icon={DoorClosed}
                tone={tickets.rooms_blocked_now > 0 ? 'danger' : 'neutral'}
              />
            </StatGrid>

            <div className='grid gap-6 lg:grid-cols-2'>
              <Section title='Complaints by category'>
                <BarList tone='warning' items={plain(complaints.by_category, COMPLAINT_CATEGORY)} />
              </Section>
              <Section title='Complaints by status'>
                <BarList items={toned(complaints.by_status, COMPLAINT_STATUS)} />
              </Section>
              <Section title='Maintenance by category'>
                <BarList tone='info' items={plain(tickets.by_category, MAINTENANCE_CATEGORY)} />
              </Section>
              <Section title='Maintenance by status'>
                <BarList items={toned(tickets.by_status, TICKET_STATUS)} />
              </Section>
            </div>
          </>
        )
      }}
    </ReportFrame>
  )
}
