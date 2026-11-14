import { useState } from 'react'
import { AppModal } from '@/components/common/app-modal'
import { SegmentedControl } from '@/components/common/segmented-control'
import { Switch } from '@/components/ui/switch'
import { alerts } from '@/lib/alerts'
import { toApiError } from '@/lib/api/errors'
import { formatDate } from '@/lib/format'
import { feedbackApi, RATING_MONTHS, useFeedbackMutation, type FeedbackSettings } from '../api'

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
          <span className='text-sm font-semibold'>Parents can rate each teacher once every</span>
          <SegmentedControl
            label='How often parents can rate'
            value={months}
            onChange={setMonths}
            options={RATING_MONTHS.map((value) => ({ value, label: monthsLabel(value) }))}
            className='flex-wrap'
          />
          {settings.cycle && months === settings.teacher_rating_months && (
            <span className='text-xs text-muted-foreground'>
              This window: {formatDate(settings.cycle.start)} to {formatDate(settings.cycle.end)}
            </span>
          )}
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
