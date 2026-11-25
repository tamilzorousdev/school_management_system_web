import { Clock, ListChecks, Plane, UserRoundCheck, UserRoundX } from 'lucide-react'
import { DataTable, type Column } from '@/components/common/data-table'
import { StatCard } from '@/components/common/display'
import { useAttendanceReport, type AttendanceResident, type ReportParams } from '../api-reports'
import { ROLL_SLOT } from '../labels'
import { percent, shortDate } from './report-helpers'
import {
  BarList,
  CardFacts,
  ColumnChart,
  ReportFrame,
  ResidentCell,
  Section,
  StackBar,
  StatGrid,
} from './report-parts'

const columns: Column<AttendanceResident>[] = [
  {
    key: 'resident',
    header: 'Resident',
    cell: (row) => (
      <ResidentCell
        admissionId={row.admission_id}
        student={row.student}
        hostelName={row.hostel_name}
      />
    ),
  },
  {
    key: 'absent',
    header: 'Absent',
    align: 'right',
    cell: (row) => <span className='font-bold text-destructive'>{row.absent}</span>,
  },
  { key: 'late', header: 'Late', align: 'right', cell: (row) => row.late },
  { key: 'marked', header: 'Marked', align: 'right', cell: (row) => row.marked },
]

export function AttendanceReportView({ params }: { params: ReportParams }) {
  const query = useAttendanceReport(params)
  return (
    <ReportFrame query={query}>
      {(data) => {
        const totals = data.totals
        const counted = totals.present + totals.late + totals.absent
        return (
          <>
            <StatGrid>
              <StatCard
                label='Present'
                value={percent(totals.present_percent)}
                hint={`${totals.present + totals.late} of ${counted} marked in the hostel`}
                icon={UserRoundCheck}
                tone='success'
              />
              <StatCard
                label='Absent marks'
                value={totals.absent}
                hint={`${totals.total} marks in all`}
                icon={UserRoundX}
                tone={totals.absent > 0 ? 'danger' : 'neutral'}
              />
              <StatCard
                label='Late marks'
                value={totals.late}
                hint='Counted as present'
                icon={Clock}
                tone={totals.late > 0 ? 'warning' : 'neutral'}
              />
              <StatCard
                label='Away or sick'
                value={totals.away + totals.sick}
                hint={`${totals.away} on leave or outing · ${totals.sick} sick`}
                icon={Plane}
                tone='neutral'
              />
            </StatGrid>

            <Section
              title='Present % by day'
              description='Days with at least one roll call; hover a bar for the numbers'
            >
              <ColumnChart
                label='Present percent by day'
                tone='success'
                max={100}
                empty='No roll call in this period.'
                points={data.days.map((day) => ({
                  key: day.date,
                  label: shortDate(day.date),
                  value: day.present_percent ?? 0,
                  display: `${percent(day.present_percent)} · ${day.absent} absent · ${day.roll_calls} roll calls`,
                }))}
              />
            </Section>

            <div className='grid gap-6 lg:grid-cols-2'>
              <Section title='By slot' description='Present % per roll call slot'>
                <BarList
                  max={100}
                  tone='success'
                  empty='No roll call in this period.'
                  items={data.slots.map((slot) => ({
                    key: slot.slot,
                    label: ROLL_SLOT[slot.slot] ?? slot.slot,
                    value: slot.present_percent ?? 0,
                    display: `${percent(slot.present_percent)} · ${slot.absent} absent`,
                  }))}
                />
              </Section>
              <Section title='Marks by status' description={`${totals.total} marks in the period`}>
                <StackBar
                  segments={[
                    { key: 'present', label: 'Present', value: totals.present, tone: 'success' },
                    { key: 'late', label: 'Late', value: totals.late, tone: 'warning' },
                    { key: 'absent', label: 'Absent', value: totals.absent, tone: 'danger' },
                    { key: 'away', label: 'Away', value: totals.away, tone: 'info' },
                    { key: 'sick', label: 'Sick', value: totals.sick, tone: 'neutral' },
                  ]}
                />
              </Section>
            </div>

            <Section title='Most absent residents' flush>
              <DataTable
                rows={data.top_absentees}
                columns={columns}
                rowKey={(row) => row.admission_id}
                empty={{ icon: ListChecks, title: 'No absences in this period' }}
                card={(row) => (
                  <div className='grid gap-2'>
                    <ResidentCell
                      admissionId={row.admission_id}
                      student={row.student}
                      hostelName={row.hostel_name}
                    />
                    <CardFacts
                      items={[
                        { label: 'Absent', value: row.absent },
                        { label: 'Late', value: row.late },
                        { label: 'Marked', value: row.marked },
                      ]}
                    />
                  </div>
                )}
              />
            </Section>
          </>
        )
      }}
    </ReportFrame>
  )
}
