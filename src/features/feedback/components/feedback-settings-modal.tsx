import { useState } from 'react'
import { AppModal } from '@/components/common/app-modal'
import { SegmentedControl } from '@/components/common/segmented-control'
import { Switch } from '@/components/ui/switch'
import { alerts } from '@/lib/alerts'
import { toApiError } from '@/lib/api/errors'
import { formatDate } from '@/lib/format'
import { Input } from '@/components/ui/input'
import {
  feedbackApi,
  RATING_MONTHS,
  RATING_PERIODS,
  useFeedbackMutation,
  type FeedbackSettings,
  type RatingPeriodKind,
} from '../api'

const PERIOD_LABELS: Record<RatingPeriodKind, string> = {
  months: 'Every few months',
  term: 'Once a term',
  year: 'Once a year',
}

const monthsLabel = (months: number) =>
  months === 12 ? '1 year' : months === 1 ? '1 month' : `${months} months`

function Toggle({
  id,
  title,
  description,
  checked,
  onChange,
}: {
  id: string
  title: string
  description: string
  checked: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <label
      htmlFor={id}
      className='flex cursor-pointer items-start justify-between gap-4 rounded-lg border p-3'
    >
      <span className='grid gap-0.5'>
        <span className='text-sm font-semibold'>{title}</span>
        <span className='text-xs text-muted-foreground'>{description}</span>
      </span>
      <Switch id={id} checked={checked} onCheckedChange={onChange} aria-label={title} />
    </label>
  )
}

export function FeedbackSettingsModal({
  settings,
  onClose,
}: {
  settings: FeedbackSettings
  onClose: () => void
}) {
  const [rating, setRating] = useState(settings.teacher_rating_enabled)
  const [months, setMonths] = useState(settings.teacher_rating_months)
  const [period, setPeriod] = useState(settings.teacher_rating_period)
  const [minResponses, setMinResponses] = useState(String(settings.teacher_rating_min_responses))
  const [studentFeedback, setStudentFeedback] = useState(settings.student_feedback_enabled)
  const save = useFeedbackMutation(feedbackApi.saveSettings)

  return (
    <AppModal
      open
      onOpenChange={(open) => !open && onClose()}
      title='Feedback settings'
      description='Parents rate teachers in the Parent app; teachers give students feedback in the Staff app.'
      formId='feedback-settings-form'
      submitText='Save settings'
      loading={save.isPending}
    >
      <form
        id='feedback-settings-form'
        className='grid gap-4'
        onSubmit={async (event) => {
          event.preventDefault()
          try {
            await save.mutateAsync({
              teacher_rating_enabled: rating,
              teacher_rating_months: months,
              teacher_rating_period: period,
              teacher_rating_min_responses: Math.min(50, Math.max(1, Number(minResponses) || 1)),
              student_feedback_enabled: studentFeedback,
            })
            alerts.success('Feedback settings saved')
            onClose()
          } catch (error) {
            alerts.error(toApiError(error).message)
          }
        }}
      >
        <Toggle
          id='feedback-rating-enabled'
          title='Parents can rate teachers'
          description='Stars, behaviour good or bad and a remark. You are told about every rating; the teacher never sees who rated.'
          checked={rating}
          onChange={setRating}
        />
        <div className='grid gap-1.5'>
          <span className='text-sm font-semibold'>How often parents can rate each teacher</span>
          <SegmentedControl
            label='Rating period'
            value={period}
            onChange={setPeriod}
            options={RATING_PERIODS.map((value) => ({ value, label: PERIOD_LABELS[value] }))}
            className='flex-wrap'
          />
          {period === 'months' && (
            <SegmentedControl
              label='How often parents can rate'
              value={months}
              onChange={setMonths}
              options={RATING_MONTHS.map((value) => ({ value, label: monthsLabel(value) }))}
              className='flex-wrap'
            />
          )}
          {settings.cycle &&
            period === settings.teacher_rating_period &&
            months === settings.teacher_rating_months && (
              <span className='text-xs text-muted-foreground'>
                This window: {formatDate(settings.cycle.start)} to {formatDate(settings.cycle.end)}
              </span>
            )}
        </div>
        <div className='grid gap-1.5'>
          <label htmlFor='feedback-min-responses' className='text-sm font-semibold'>
            Ratings needed before a teacher sees an average
          </label>
          <Input
            id='feedback-min-responses'
            type='number'
            min={1}
            max={50}
            value={minResponses}
            onChange={(event) => setMinResponses(event.target.value)}
            className='w-28'
          />
          <span className='text-xs text-muted-foreground'>
            Keeps a single parent from being identified by the score. 1 shows it at once.
          </span>
        </div>
        <Toggle
          id='feedback-student-enabled'
          title='Teachers give students feedback'
          description='Once a term per student: studies, behaviour and sports in stars. Parents are notified.'
          checked={studentFeedback}
          onChange={setStudentFeedback}
        />
        {settings.term && (
          <span className='text-xs text-muted-foreground'>
            Current term: {settings.term.name} ({formatDate(settings.term.start)} to{' '}
            {formatDate(settings.term.end)})
          </span>
        )}
      </form>
    </AppModal>
  )
}
