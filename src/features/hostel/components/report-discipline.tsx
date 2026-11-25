import { Gavel, IndianRupee, Repeat, ShieldAlert } from 'lucide-react'
import { DataTable, type Column } from '@/components/common/data-table'
import { StatCard } from '@/components/common/display'
import { Badge } from '@/components/ui/badge'
import { FINE_STATUS, rupees } from '@/features/fees/labels'
import { formatDate } from '@/lib/format'
import { useDisciplineReport, type RepeatResident, type ReportParams } from '../api-reports'
import { CASE_STATUS, DISCIPLINE_ACTION, DISCIPLINE_CATEGORY, SEVERITY } from '../labels'
import { labelFor, monthLabel } from './report-helpers'
import { BarList, CardFacts, ReportFrame, ResidentCell, Section, StatGrid } from './report-parts'

const FINE_LABELS = { ...FINE_STATUS, not_raised: { label: 'No fee fine raised' } }

const categories = (row: RepeatResident) => (
  <div className='flex flex-wrap gap-1'>
    {row.categories.map((category) => (
      <Badge key={category}>{labelFor(DISCIPLINE_CATEGORY, category)}</Badge>
    ))}
  </div>
)

const columns: Column<RepeatResident>[] = [
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
    key: 'cases',
    header: 'Cases',
    align: 'right',
    cell: (row) => <span className='font-bold'>{row.cases}</span>,
  },
  {
    key: 'serious',
    header: 'Major or critical',
    align: 'right',
    cell: (row) => row.major_or_critical,
  },
  {
    key: 'last',
    header: 'Last incident',
    hideBelow: 'lg',
    cell: (row) => formatDate(row.last_incident_on),
  },
  { key: 'categories', header: 'Categories', hideBelow: 'xl', cell: categories },
]

export function DisciplineReportView({ params }: { params: ReportParams }) {
  const query = useDisciplineReport(params)
  return (
    <ReportFrame query={query}>
      {(data) => (
        <>
          <StatGrid>
            <StatCard
              label='Cases'
              value={data.total}
              hint='Incidents in the period, withdrawn left out'
              icon={Gavel}
            />
            <StatCard
              label='Still open'
              value={data.open}
              hint='Waiting for action'
              icon={ShieldAlert}
              tone={data.open > 0 ? 'warning' : 'success'}
            />
            <StatCard
              label='Fines'
              value={data.fines.count}
              hint={`${rupees(data.fines.amount)} in all`}
              icon={IndianRupee}
              tone='neutral'
            />
            <StatCard
              label='Repeat residents'
              value={data.repeat_residents.length}
              hint='3 or more cases in the period'
              icon={Repeat}
              tone={data.repeat_residents.length > 0 ? 'danger' : 'success'}
            />
          </StatGrid>

          <div className='grid gap-6 lg:grid-cols-2'>
            <Section title='By category'>
              <BarList
                tone='warning'
                items={data.by_category.map((row) => ({
                  key: row.key,
                  label: labelFor(DISCIPLINE_CATEGORY, row.key),
                  value: row.count,
                }))}
              />
            </Section>
            <Section title='By month'>
              <BarList
                items={data.by_month.map((row) => ({
                  key: row.key,
                  label: monthLabel(row.key),
                  value: row.count,
                }))}
              />
            </Section>
            <Section title='By severity'>
              <BarList
                items={data.by_severity.map((row) => ({
                  key: row.key,
                  label: labelFor(SEVERITY, row.key),
                  value: row.count,
                  tone: SEVERITY[row.key as keyof typeof SEVERITY]?.tone,
                }))}
              />
            </Section>
            <Section title='By status' description='Withdrawn cases included'>
              <BarList
                items={data.by_status.map((row) => ({
                  key: row.key,
                  label: labelFor(CASE_STATUS, row.key),
                  value: row.count,
                  tone: CASE_STATUS[row.key as keyof typeof CASE_STATUS]?.tone,
                }))}
              />
            </Section>
            <Section title='Actions taken'>
              <BarList
                tone='info'
                items={data.actions.map((row) => ({
                  key: row.key,
                  label: labelFor(DISCIPLINE_ACTION, row.key),
                  value: row.count,
                }))}
              />
            </Section>
            <Section
              title='Fines by fee status'
              description={`${rupees(data.fines.amount)} in all`}
            >
              <BarList
                items={data.fines.by_status.map((row) => ({
                  key: row.key,
                  label: labelFor(FINE_LABELS, row.key),
                  value: row.count,
                  display: `${row.count} · ${rupees(row.amount)}`,
                  tone: FINE_STATUS[row.key as keyof typeof FINE_STATUS]?.tone ?? 'neutral',
                }))}
              />
            </Section>
          </div>

          <Section title='Repeat residents' description='3 or more cases in the period' flush>
            <DataTable
              rows={data.repeat_residents}
              columns={columns}
              rowKey={(row) => row.admission_id}
              empty={{ icon: Repeat, title: 'No resident has 3 or more cases' }}
              card={(row) => (
                <div className='grid gap-2'>
                  <ResidentCell
                    admissionId={row.admission_id}
                    student={row.student}
                    hostelName={row.hostel_name}
                  />
                  <CardFacts
                    items={[
                      { label: 'Cases', value: row.cases },
                      { label: 'Major or critical', value: row.major_or_critical },
                      { label: 'Last', value: formatDate(row.last_incident_on) },
                    ]}
                  />
                  {categories(row)}
                </div>
              )}
            />
          </Section>
        </>
      )}
    </ReportFrame>
  )
}
