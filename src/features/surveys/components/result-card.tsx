import { Star } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { formatDate } from '@/lib/format'
import type { QuestionResult } from '../api'
import { QUESTION_TYPES } from '../labels'

function Bar({ label, count, percent }: { label: string; count: number; percent: number }) {
  return (
    <div className='grid gap-1'>
      <div className='flex items-baseline justify-between gap-3 text-sm'>
        <span className='min-w-0 break-words'>{label}</span>
        <span className='tabular shrink-0 text-xs text-muted-foreground'>
          {count} · <span className='font-semibold text-foreground'>{percent}%</span>
        </span>
      </div>
      <div className='h-2 overflow-hidden rounded-full bg-muted'>
        <div
          className='h-full rounded-full bg-primary transition-[width]'
          style={{ width: `${Math.min(percent, 100)}%` }}
        />
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: number | null }) {
  return (
    <div className='grid gap-0.5 rounded-lg border p-3'>
      <span className='text-xs text-muted-foreground'>{label}</span>
      <span className='tabular text-xl font-extrabold'>{value ?? '—'}</span>
    </div>
  )
}

export function ResultCard({ result, index }: { result: QuestionResult; index: number }) {
  const Icon = QUESTION_TYPES[result.type].icon
  const rating = result.rating
  return (
    <Card className='grid content-start gap-4 p-4' data-testid='survey-result'>
      <div className='grid gap-1'>
        <span className='flex items-center gap-1.5 text-xs text-muted-foreground'>
          <Icon className='size-3.5' />
          {QUESTION_TYPES[result.type].label} · {result.answered}{' '}
          {result.answered === 1 ? 'answer' : 'answers'}
        </span>
        <h3 className='font-semibold break-words'>
          {index + 1}. {result.text}
        </h3>
      </div>
      {result.choices && (
        <div className='grid gap-3'>
          {result.choices.map((choice) => (
            <Bar
              key={choice.option}
              label={choice.option}
              count={choice.count}
              percent={choice.percent}
            />
          ))}
        </div>
      )}
      {rating && (
        <div className='grid gap-3'>
          <div className='flex items-center gap-3'>
            <span className='tabular text-3xl font-extrabold'>{rating.average ?? '—'}</span>
            <span className='flex text-warning' aria-label={`Average ${rating.average ?? 0} of 5`}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className='size-5'
                  fill={star <= Math.round(rating.average ?? 0) ? 'currentColor' : 'none'}
                />
              ))}
            </span>
          </div>
          {[5, 4, 3, 2, 1].map((star) => {
            const count = rating.counts[String(star)] ?? 0
            const percent = result.answered ? Math.round((count / result.answered) * 1000) / 10 : 0
            return (
              <Bar
                key={star}
                label={`${star} ${star === 1 ? 'star' : 'stars'}`}
                count={count}
                percent={percent}
              />
            )
          })}
        </div>
      )}
      {result.number && (
        <div className='grid grid-cols-3 gap-2'>
          <Stat label='Average' value={result.number.average} />
          <Stat label='Lowest' value={result.number.min} />
          <Stat label='Highest' value={result.number.max} />
        </div>
      )}
      {result.answers &&
        (result.answers.length ? (
          <ul className='grid max-h-80 gap-2 overflow-y-auto pr-1'>
            {result.answers.map((answer, position) => (
              <li key={position} className='grid gap-0.5 rounded-lg bg-muted/60 p-2.5 text-sm'>
                <span className='break-words whitespace-pre-wrap'>
                  {result.type === 'date' ? formatDate(answer.value) : answer.value}
                </span>
                {(answer.name || answer.class_section) && (
                  <span className='text-xs text-muted-foreground'>
                    {[answer.name, answer.class_section].filter(Boolean).join(' · ')}
                  </span>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className='text-sm text-muted-foreground'>No written answers match.</p>
        ))}
    </Card>
  )
}
