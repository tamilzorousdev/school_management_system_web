import { useState } from 'react'
import { UsersRound } from 'lucide-react'
import { AppModal } from '@/components/common/app-modal'
import { DatePicker } from '@/components/common/date-picker'
import { FormField } from '@/components/common/form-field'
import { SegmentedControl } from '@/components/common/segmented-control'
import { TimePicker } from '@/components/common/time-picker'
import { Switch } from '@/components/ui/switch'
import {
  ALL_STAFF_GROUPS,
  audienceErrors,
  chosenStaffGroups,
  hasParents,
  hasStaff,
  type AudienceValue,
} from '@/features/emergency/audience'
import { AudiencePicker } from '@/features/emergency/components/audience-picker'
import { alerts } from '@/lib/alerts'
import { toApiError } from '@/lib/api/errors'
import {
  surveysApi,
  useSurveyMutation,
  useSurveyPreview,
  type Survey,
  type SurveyAudienceInput,
} from '../api'
import { fieldMap } from '../builder'
import { daysFromNow, fromLocalParts, localParts } from '../labels'

type When = 'now' | 'later'

const audienceInput = (value: AudienceValue, perChild: boolean): SurveyAudienceInput => ({
  audience: value.audience,
  ...(value.audience === 'classes' ? { class_ids: value.class_ids } : {}),
  ...(value.audience === 'sections' ? { section_ids: value.section_ids } : {}),
  ...(hasStaff(value.audience) ? { staff_groups: chosenStaffGroups(value.staff_groups) } : {}),
  per_child: hasParents(value.audience) && perChild,
})

export function SendModal({
  survey,
  onClose,
  onSent,
}: {
  survey: Survey
  onClose: () => void
  onSent: (survey: Survey) => void
}) {
  const [audience, setAudience] = useState<AudienceValue>({
    audience: survey.audience,
    class_ids: survey.class_ids,
    section_ids: survey.section_ids,
    include_teachers: false,
    staff_groups: survey.staff_groups.length ? survey.staff_groups : ALL_STAFF_GROUPS,
  })
  const [anonymous, setAnonymous] = useState(survey.is_anonymous)
  const [perChild, setPerChild] = useState(survey.per_child)
  const [when, setWhen] = useState<When>('now')
  const [sendAt, setSendAt] = useState(() => localParts(daysFromNow(1, 9)))
  const [closesAt, setClosesAt] = useState(() => localParts(daysFromNow(7, 18)))
  const [errors, setErrors] = useState<Record<string, string>>({})
  const save = useSurveyMutation(surveysApi.update)
  const send = useSurveyMutation(surveysApi.send)
  const busy = save.isPending || send.isPending

  const clear = (...keys: string[]) =>
    setErrors((current) => ({ ...current, ...Object.fromEntries(keys.map((key) => [key, ''])) }))
  const ready =
    Object.keys(audienceErrors(audience)).length === 0 ? audienceInput(audience, perChild) : null
  const preview = useSurveyPreview(ready)
  const count = preview.isPlaceholderData ? undefined : preview.data

  const validate = () => {
    const next = audienceErrors(audience)
    if (when === 'later' && !fromLocalParts(sendAt.date, sendAt.time))
      next.send_at = 'Pick the day and time to send'
    if (!fromLocalParts(closesAt.date, closesAt.time))
      next.closes_at = 'Pick the day and time it closes'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const submit = async () => {
    if (!validate()) return
    try {
      await save.mutateAsync({
        id: survey.id,
        ...audienceInput(audience, perChild),
        is_anonymous: anonymous,
      })
      const sent = await send.mutateAsync({
        id: survey.id,
        closes_at: fromLocalParts(closesAt.date, closesAt.time)!,
        ...(when === 'later' ? { send_at: fromLocalParts(sendAt.date, sendAt.time)! } : {}),
      })
      alerts.success(sent.message)
      onSent(sent.data)
    } catch (error) {
      const apiError = toApiError(error)
      setErrors(fieldMap(apiError.fieldErrors))
      alerts.error(apiError.message)
    }
  }

  return (
    <AppModal
      open
      onOpenChange={(open) => !open && !busy && onClose()}
      title='Send the form'
      description={`"${survey.title}" with ${survey.questions.length} ${survey.questions.length === 1 ? 'question' : 'questions'}. People get a push and an in-app notice.`}
      size='lg'
      formId='survey-send-form'
      submitText={when === 'now' ? 'Send now' : 'Schedule'}
      loading={busy}
    >
      <form
        id='survey-send-form'
        className='grid gap-4 sm:grid-cols-2'
        onSubmit={(event) => {
          event.preventDefault()
          void submit()
        }}
      >
        <AudiencePicker
          idPrefix='survey-send'
          value={audience}
          onChange={(patch) => {
            setAudience((current) => ({ ...current, ...patch }))
            clear(...Object.keys(patch))
          }}
          errors={errors}
          staffGroups
        />
        <div
          role='status'
          className='grid gap-1 rounded-lg border border-primary/30 bg-primary/5 p-3 text-sm sm:col-span-2'
        >
          {!ready ? (
            <span className='text-muted-foreground'>Choose who gets it to see the count.</span>
          ) : !count ? (
            <span className='text-muted-foreground'>Counting…</span>
          ) : (
            <>
              <span className='flex items-center gap-1.5 font-semibold' data-testid='survey-count'>
                <UsersRound className='size-4' />
                Goes to {count.people} {count.people === 1 ? 'person' : 'people'} with the app
                {count.recipients !== count.people &&
                  ` · ${count.recipients} answers, one per child`}
              </span>
              <span className='text-xs text-muted-foreground'>
                {count.parents} parents, {count.staff} staff
                {count.without_app > 0 && ` · ${count.without_app} without the app cannot answer`}
              </span>
            </>
          )}
        </div>
        <FormField id='survey-when' label='When' className='sm:col-span-2'>
          <SegmentedControl
            label='When'
            value={when}
            onChange={(value: When) => {
              setWhen(value)
              clear('send_at')
            }}
            options={[
              { value: 'now', label: 'Send now' },
              { value: 'later', label: 'Send later' },
            ]}
          />
        </FormField>
        {when === 'later' && (
          <FormField
            id='survey-send-date'
            label='Send on'
            required
            error={errors.send_at}
            className='sm:col-span-2'
          >
            <div className='grid gap-2 sm:grid-cols-2'>
              <DatePicker
                id='survey-send-date'
                value={sendAt.date}
                min={localParts(new Date()).date}
                invalid={Boolean(errors.send_at)}
                onChange={(date: string) => {
                  setSendAt((current) => ({ ...current, date }))
                  clear('send_at')
                }}
              />
              <TimePicker
                id='survey-send-time'
                value={sendAt.time}
                invalid={Boolean(errors.send_at)}
                onChange={(time) => {
                  setSendAt((current) => ({ ...current, time }))
                  clear('send_at')
                }}
              />
            </div>
          </FormField>
        )}
        <FormField
          id='survey-close-date'
          label='Closes on'
          required
          error={errors.closes_at}
          hint='Answers are refused after this. A reminder goes a day before to those who have not answered.'
          className='sm:col-span-2'
        >
          <div className='grid gap-2 sm:grid-cols-2'>
            <DatePicker
              id='survey-close-date'
              value={closesAt.date}
              min={localParts(new Date()).date}
              invalid={Boolean(errors.closes_at)}
              onChange={(date: string) => {
                setClosesAt((current) => ({ ...current, date }))
                clear('closes_at')
              }}
            />
            <TimePicker
              id='survey-close-time'
              value={closesAt.time}
              invalid={Boolean(errors.closes_at)}
              onChange={(time) => {
                setClosesAt((current) => ({ ...current, time }))
                clear('closes_at')
              }}
            />
          </div>
        </FormField>
        <label className='flex items-start gap-2 text-sm sm:col-span-2'>
          <Switch
            checked={anonymous}
            onCheckedChange={setAnonymous}
            aria-label='Anonymous'
            className='mt-0.5'
          />
          <span className='grid'>
            <span className='font-medium'>Anonymous</span>
            <span className='text-xs text-muted-foreground'>
              Names are never shown or downloaded. The app still makes sure each person answers
              once.
            </span>
          </span>
        </label>
        {hasParents(audience.audience) && (
          <label className='flex items-start gap-2 text-sm sm:col-span-2'>
            <Switch
              checked={perChild}
              onCheckedChange={setPerChild}
              aria-label='One answer per child'
              className='mt-0.5'
            />
            <span className='grid'>
              <span className='font-medium'>One answer per child</span>
              <span className='text-xs text-muted-foreground'>
                A parent with two children answers twice, once for each child. Off: one answer per
                family.
              </span>
            </span>
          </label>
        )}
      </form>
    </AppModal>
  )
}
