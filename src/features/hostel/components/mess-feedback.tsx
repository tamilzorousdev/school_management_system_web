import { useState } from 'react'
import { CircleOff, MessageSquareText, Star } from 'lucide-react'
import { DataTable, type Column } from '@/components/common/data-table'
import { DatePicker } from '@/components/common/date-picker'
import { InsightCards, type Insight } from '@/components/common/insight-cards'
import { ListToolbar } from '@/components/common/list-toolbar'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { formatDate, formatDateTime } from '@/lib/format'
import { useMessFeedback, useMessFeedbackSummary, type Meal, type MessFeedback } from '../api-care'
import { RatingStars } from './complaint-parts'
import { ToggleFilter } from './leave-form-parts'
import { shiftDate, todayIso } from './leave-helpers'
import { MEAL } from './mess-helpers'
import { HostelSelect } from './pickers'

const LIMIT = 20

export function MessFeedbackView({
  hostelId,
  page,
  onHostelChange,
  onPageChange,
}: {
  hostelId?: number
  page: number
  onHostelChange: (hostelId?: number) => void
  onPageChange: (page: number) => void
}) {
  const today = todayIso()
  const [from, setFrom] = useState(() => shiftDate(today, -30))
  const [to, setTo] = useState(today)
  const [meal, setMeal] = useState<Meal | undefined>()
  const [lowOnly, setLowOnly] = useState(false)
  const summary = useMessFeedbackSummary({ hostel_id: hostelId, from, to })
  const feedback = useMessFeedback({
    page,
    limit: LIMIT,
    hostel_id: hostelId,
    from,
    to,
    meal,
    max_rating: lowOnly ? 2 : undefined,
  })
  const data = summary.data
  const filtered = Boolean(hostelId || meal || lowOnly)

  const reset = (patch: () => void) => {
    patch()
    onPageChange(1)
  }

  const cards: Insight[] = (data?.meals ?? []).map((item) => ({
    key: item.meal,
    label: MEAL[item.meal],
    value: item.average !== null ? `${item.average}/5` : '—',
    hint: `${item.count} ${item.count === 1 ? 'rating' : 'ratings'}${item.low ? ` · ${item.low} low` : ''}`,
    icon: Star,
    tone:
      item.average === null
        ? 'neutral'
        : item.average >= 4
          ? 'success'
          : item.average >= 3
            ? 'warning'
            : 'danger',
    active: meal === item.meal,
    onClick: () => reset(() => setMeal(meal === item.meal ? undefined : item.meal)),
  }))

  const columns: Column<MessFeedback>[] = [
    {
      key: 'meal',
      header: 'Meal',
      cell: (row) => (
        <div className='grid gap-0.5'>
          <span className='font-semibold'>{MEAL[row.meal]}</span>
          <span className='text-xs text-muted-foreground'>{formatDate(row.meal_date)}</span>
        </div>
      ),
    },
    { key: 'rating', header: 'Rating', cell: (row) => <RatingStars rating={row.rating} /> },
    {
      key: 'comment',
      header: 'Comment',
      cell: (row) => (
        <span className='line-clamp-2 text-sm'>
          {row.comment ?? <span className='text-muted-foreground'>No comment</span>}
        </span>
      ),
    },
    {
      key: 'by',
      header: 'From',
      hideBelow: 'lg',
      cell: (row) => <FeedbackBy row={row} />,
    },
    {
      key: 'hostel',
      header: 'Hostel',
      hideBelow: 'xl',
      cell: (row) => <span className='text-sm'>{row.hostel_name}</span>,
    },
  ]

  return (
    <div className='grid gap-4'>
      <Card className='flex flex-row flex-wrap items-end gap-3 px-4 py-3'>
        <div className='grid gap-1'>
          <label htmlFor='feedback-from' className='text-xs font-semibold'>
            From
          </label>
          <DatePicker
            id='feedback-from'
            value={from}
            max={to}
            clearable={false}
            className='w-full sm:w-44'
            onChange={(value: string) => value && reset(() => setFrom(value))}
          />
        </div>
        <div className='grid gap-1'>
          <label htmlFor='feedback-to' className='text-xs font-semibold'>
            To
          </label>
          <DatePicker
            id='feedback-to'
            value={to}
            min={from}
            max={today}
            clearable={false}
            className='w-full sm:w-44'
            onChange={(value: string) => value && reset(() => setTo(value))}
          />
        </div>
        <div className='ml-auto grid gap-0.5 text-right'>
          <span className='text-xs text-muted-foreground'>Overall</span>
          <span className='tabular text-2xl font-extrabold'>
            {data?.average !== null && data?.average !== undefined ? `${data.average}/5` : '—'}
          </span>
          <span className='tabular text-xs text-muted-foreground'>{data?.count ?? 0} ratings</span>
        </div>
      </Card>

      <InsightCards items={cards} loading={summary.isPending} />

      <Card className='overflow-hidden'>
        <ListToolbar
          summary={feedback.data ? `${feedback.data.total} ratings` : ''}
          onClear={
            filtered
              ? () => {
                  setMeal(undefined)
                  setLowOnly(false)
                  onHostelChange(undefined)
                }
              : undefined
          }
        >
          <HostelSelect
            id='feedback-hostel'
            allLabel='All hostels'
            value={hostelId ? String(hostelId) : undefined}
            onChange={(value) => onHostelChange(value ? Number(value) : undefined)}
          />
          <ToggleFilter
            id='feedback-low'
            label='Low ratings only (1–2)'
            checked={lowOnly}
            onChange={(checked) => reset(() => setLowOnly(Boolean(checked)))}
          />
          {meal && (
            <Badge tone='info' className='px-2.5 py-1'>
              {MEAL[meal]} only
            </Badge>
          )}
        </ListToolbar>
        <DataTable
          rows={feedback.data?.items ?? []}
          columns={columns}
          rowKey={(row) => row.id}
          loading={feedback.isFetching}
          error={feedback.isError ? feedback.error.message : null}
          onRetry={() => feedback.refetch()}
          empty={{
            icon: filtered ? CircleOff : MessageSquareText,
            title: filtered ? 'No ratings match these filters' : 'No ratings in these dates',
            description: filtered
              ? 'Try another filter or clear the filters.'
              : 'Parents rate meals in the Parent app.',
          }}
          card={(row) => (
            <div className='grid gap-2'>
              <div className='flex items-start justify-between gap-2'>
                <div className='grid gap-0.5'>
                  <span className='font-semibold'>
                    {MEAL[row.meal]} · {formatDate(row.meal_date)}
                  </span>
                  <span className='text-xs text-muted-foreground'>{row.hostel_name}</span>
                </div>
                <RatingStars rating={row.rating} />
              </div>
              {row.comment && <p className='text-sm'>{row.comment}</p>}
              <FeedbackBy row={row} />
            </div>
          )}
          pagination={{
            page,
            limit: LIMIT,
            total: feedback.data?.total ?? 0,
            label: 'ratings',
            onPageChange,
          }}
        />
      </Card>
    </div>
  )
}

function FeedbackBy({ row }: { row: MessFeedback }) {
  return (
    <div className='grid gap-0.5 text-sm'>
      <span>
        {row.by_role === 'parent'
          ? `Parent${row.student_name ? ` of ${row.student_name}` : ''}`
          : (row.created_by_name ?? 'Staff')}
      </span>
      <span className='text-xs text-muted-foreground'>{formatDateTime(row.created_at)}</span>
    </div>
  )
}
