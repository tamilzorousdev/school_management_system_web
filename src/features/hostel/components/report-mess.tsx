import { CalendarX, MessageSquareText, Utensils, UtensilsCrossed } from 'lucide-react'
import { DataTable, type Column } from '@/components/common/data-table'
import { StatCard } from '@/components/common/display'
import { useMessReport, type MessMeal, type ReportParams } from '../api-reports'
import { MEAL, SKIP_SOURCE } from './mess-helpers'
import { decimal, labelFor, percent, ratio } from './report-helpers'
import { BarList, CardFacts, ReportFrame, Section, StatGrid } from './report-parts'

const rating = (value: number | null) => (value === null ? '—' : `${value}/5`)

const columns: Column<MessMeal>[] = [
  {
    key: 'meal',
    header: 'Meal',
    cell: (row) => <span className='font-semibold'>{MEAL[row.meal] ?? row.meal}</span>,
  },
  { key: 'ate', header: 'Ate', align: 'right', cell: (row) => row.ate },
  { key: 'skipped', header: 'Skipped', align: 'right', cell: (row) => row.skipped },
  {
    key: 'percent',
    header: 'Ate %',
    align: 'right',
    cell: (row) => <span className='font-semibold'>{percent(row.ate_percent)}</span>,
  },
  {
    key: 'requests',
    header: 'Skip requests',
    align: 'right',
    hideBelow: 'lg',
    cell: (row) => row.skip_requests,
  },
  {
    key: 'feedback',
    header: 'Feedback',
    align: 'right',
    cell: (row) => `${rating(row.feedback_average)} (${row.feedback_count})`,
  },
]

export function MessReportView({ params }: { params: ReportParams }) {
  const query = useMessReport(params)
  return (
    <ReportFrame query={query} module='mess'>
      {(data) => (
        <>
          <StatGrid>
            <StatCard
              label='Meals eaten'
              value={data.ate}
              hint={`${percent(ratio(data.ate, data.ate + data.skipped))} of marked meals`}
              icon={Utensils}
              tone='success'
            />
            <StatCard
              label='Meals skipped'
              value={data.skipped}
              hint='Marked as not eaten'
              icon={UtensilsCrossed}
              tone={data.skipped > 0 ? 'warning' : 'neutral'}
            />
            <StatCard
              label='Feedback'
              value={rating(data.feedback_average)}
              hint={`${data.feedback_count} ratings`}
              icon={MessageSquareText}
              tone='neutral'
            />
            <StatCard
              label='Skip requests'
              value={data.meal_skips}
              hint='Overlapping the period, cancelled left out'
              icon={CalendarX}
              tone='neutral'
            />
          </StatGrid>

          <Section title='By meal' flush>
            <DataTable
              rows={data.meals}
              columns={columns}
              rowKey={(row) => row.meal}
              empty={{ icon: Utensils, title: 'No meals marked in this period' }}
              card={(row) => (
                <div className='grid gap-2'>
                  <div className='flex items-center justify-between gap-3'>
                    <span className='font-semibold'>{MEAL[row.meal] ?? row.meal}</span>
                    <span className='tabular text-sm font-bold'>{percent(row.ate_percent)}</span>
                  </div>
                  <CardFacts
                    items={[
                      { label: 'Ate', value: row.ate },
                      { label: 'Skipped', value: row.skipped },
                      { label: 'Feedback', value: rating(row.feedback_average) },
                    ]}
                  />
                </div>
              )}
            />
          </Section>

          <div className='grid gap-6 lg:grid-cols-2 2xl:grid-cols-3'>
            <Section title='Eaten % by meal'>
              <BarList
                max={100}
                tone='success'
                items={data.meals.map((row) => ({
                  key: row.meal,
                  label: MEAL[row.meal] ?? row.meal,
                  value: row.ate_percent ?? 0,
                  display: percent(row.ate_percent),
                }))}
              />
            </Section>
            <Section title='Skip requests by who asked'>
              <BarList
                tone='info'
                items={data.meal_skips_by_source.map((row) => ({
                  key: row.key,
                  label: labelFor(SKIP_SOURCE, row.key),
                  value: row.count,
                }))}
              />
            </Section>
            <Section title='Feedback by meal' description='Average out of 5'>
              <BarList
                max={5}
                tone='warning'
                items={data.meals.map((row) => ({
                  key: row.meal,
                  label: MEAL[row.meal] ?? row.meal,
                  value: row.feedback_average ?? 0,
                  display: `${decimal(row.feedback_average)} · ${row.feedback_count} ratings`,
                }))}
              />
            </Section>
          </div>
        </>
      )}
    </ReportFrame>
  )
}
