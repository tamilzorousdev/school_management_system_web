import { Controller, useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { AppModal } from '@/components/common/app-modal'
import { Combobox } from '@/components/common/combobox'
import { DatePicker } from '@/components/common/date-picker'
import { FormField } from '@/components/common/form-field'
import { Badge } from '@/components/ui/badge'
import { Input, Textarea } from '@/components/ui/input'
import { today } from '@/features/attendance/labels'
import { useAcademicYears } from '@/features/setup/api'
import { alerts } from '@/lib/alerts'
import { toApiError } from '@/lib/api/errors'
import {
  appraisalsApi,
  useAppraisalAction,
  type AppraisalInput,
  type AppraisalRecommendation,
  type StaffAppraisal,
} from '../api'
import {
  CRITERIA,
  OVERALL_RATING,
  RECOMMENDATION,
  overallScore,
  ratingOf,
  scoreText,
} from '../labels'
import { AppraisalStaffPicker } from './staff-picker'

const FORM_ID = 'appraisal-form'

const numberBetween = (min: number, max: number, message: string) =>
  z
    .string()
    .trim()
    .min(1, message)
    .refine((value) => {
      const number = Number(value)
      return Number.isFinite(number) && number >= min && number <= max
    }, message)

const score = numberBetween(1, 5, 'Enter a score from 1 to 5')

const schema = z.object({
  academic_year_id: z.string(),
  staff_id: z.string().min(1, 'Choose the staff member'),
  period: z.string().trim().min(1, 'Enter the review period').max(50, 'Keep it under 50 letters'),
  review_date: z.string().min(1, 'Choose the review date'),
  teaching_effectiveness: score,
  student_outcomes: score,
  classroom_management: score,
  professional_conduct: score,
  extracurricular_contribution: score,
  strengths: z.string().trim(),
  areas_for_improvement: z.string().trim(),
  goals_next_period: z.string().trim(),
  reviewer_remarks: z.string().trim(),
  recommendation: z.enum(['increment', 'promotion', 'retention', 'pip']),
  increment_percent: numberBetween(0, 50, 'Enter a percentage from 0 to 50'),
})

type FormValues = z.infer<typeof schema>

const text = (value: number | null | undefined, fallback: string) =>
  value === null || value === undefined ? fallback : String(value)

const RECOMMENDATION_OPTIONS = (Object.keys(RECOMMENDATION) as AppraisalRecommendation[]).map(
  (value) => ({ value, label: RECOMMENDATION[value] })
)

export function AppraisalFormModal({
  appraisal,
  onOpenChange,
}: {
  appraisal: StaffAppraisal | null
  onOpenChange: (open: boolean) => void
}) {
  const years = useAcademicYears()
  const currentYear = years.data?.find((year) => year.is_current)
  const save = useAppraisalAction((input: AppraisalInput) =>
    appraisal ? appraisalsApi.update(appraisal.id, input) : appraisalsApi.create(input)
  )
  const {
    control,
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      academic_year_id: text(appraisal?.academic_year_id, ''),
      staff_id: text(appraisal?.staff_id, ''),
      period: appraisal?.period ?? '',
      review_date: appraisal?.review_date ?? today(),
      teaching_effectiveness: text(appraisal?.teaching_effectiveness, '3'),
      student_outcomes: text(appraisal?.student_outcomes, '3'),
      classroom_management: text(appraisal?.classroom_management, '3'),
      professional_conduct: text(appraisal?.professional_conduct, '3'),
      extracurricular_contribution: text(appraisal?.extracurricular_contribution, '3'),
      strengths: appraisal?.strengths ?? '',
      areas_for_improvement: appraisal?.areas_for_improvement ?? '',
      goals_next_period: appraisal?.goals_next_period ?? '',
      reviewer_remarks: appraisal?.reviewer_remarks ?? '',
      recommendation: appraisal?.recommendation ?? 'increment',
      increment_percent: text(appraisal?.increment_percent, '0'),
    },
  })
  const scores = useWatch({ control, name: CRITERIA.map((item) => item.key) })
  const overall = overallScore(
    Object.fromEntries(CRITERIA.map((item, index) => [item.key, Number(scores[index])]))
  )
  const selectedYear = useWatch({ control, name: 'academic_year_id' })
  const yearValue = selectedYear || (currentYear ? String(currentYear.id) : '')

  const onSubmit = handleSubmit(async (values) => {
    const yearId = Number(values.academic_year_id || yearValue)
    if (!yearId) {
      setError('academic_year_id', { message: 'Choose the academic year' })
      return
    }
    const input: AppraisalInput = {
      academic_year_id: yearId,
      staff_id: Number(values.staff_id),
      period: values.period,
      review_date: values.review_date,
      teaching_effectiveness: Number(values.teaching_effectiveness),
      student_outcomes: Number(values.student_outcomes),
      classroom_management: Number(values.classroom_management),
      professional_conduct: Number(values.professional_conduct),
      extracurricular_contribution: Number(values.extracurricular_contribution),
      strengths: values.strengths,
      areas_for_improvement: values.areas_for_improvement,
      goals_next_period: values.goals_next_period,
      reviewer_remarks: values.reviewer_remarks,
      recommendation: values.recommendation,
      increment_percent: Number(values.increment_percent),
    }
    try {
      await save.mutateAsync(input)
      alerts.success(appraisal ? 'Appraisal updated' : 'Appraisal saved as draft')
      onOpenChange(false)
    } catch (error) {
      const apiError = toApiError(error)
      if (apiError.code === 'STAFF_NOT_FOUND') {
        setError('staff_id', { message: apiError.message })
        return
      }
      if (!apiError.fieldErrors.length) {
        setError('root', { message: apiError.message })
        return
      }
      for (const item of apiError.fieldErrors) {
        if (item.field in values)
          setError(item.field as keyof FormValues, { message: item.message })
        else setError('root', { message: item.message })
      }
    }
  })

  return (
    <AppModal
      open
      onOpenChange={onOpenChange}
      title={appraisal ? `Edit appraisal · ${appraisal.staff.name}` : 'New appraisal'}
      description='Saved as a draft. Teachers see it in the Staff app only after you finalize it.'
      formId={FORM_ID}
      submitText={appraisal ? 'Save changes' : 'Save draft'}
      loading={save.isPending}
      size='lg'
    >
      <form id={FORM_ID} noValidate className='grid gap-3 sm:grid-cols-2' onSubmit={onSubmit}>
        {errors.root && (
          <p role='alert' className='text-sm font-medium text-destructive sm:col-span-2'>
            {errors.root.message}
          </p>
        )}
        {appraisal ? (
          <FormField id='a-staff' label='Staff member' className='sm:col-span-2'>
            <p className='rounded-lg border bg-muted/40 px-3 py-2 text-sm font-semibold'>
              {appraisal.staff.name}
              <span className='ml-2 text-xs font-normal text-muted-foreground'>
                {[appraisal.employee_no, appraisal.designation].filter(Boolean).join(' · ')}
              </span>
            </p>
          </FormField>
        ) : (
          <Controller
            control={control}
            name='staff_id'
            render={({ field }) => (
              <FormField
                id='a-staff'
                label='Staff member'
                required
                error={errors.staff_id?.message}
                className='sm:col-span-2'
              >
                <AppraisalStaffPicker
                  id='a-staff'
                  label='Staff member'
                  value={field.value ? Number(field.value) : undefined}
                  onChange={(value) => field.onChange(value ? String(value) : '')}
                  invalid={Boolean(errors.staff_id)}
                  className='sm:w-full'
                />
              </FormField>
            )}
          />
        )}
        <Controller
          control={control}
          name='academic_year_id'
          render={({ field }) => (
            <FormField
              id='a-year'
              label='Academic year'
              required
              error={errors.academic_year_id?.message}
            >
              <Combobox
                id='a-year'
                label='Academic year'
                placeholder='Choose the year'
                value={yearValue || undefined}
                options={(years.data ?? []).map((year) => ({
                  value: String(year.id),
                  label: year.name,
                  hint: year.is_current ? 'Current' : undefined,
                }))}
                onChange={(value) => field.onChange(value ?? '')}
                invalid={Boolean(errors.academic_year_id)}
                highlightSelected={false}
                className='sm:w-full'
              />
            </FormField>
          )}
        />
        <FormField id='a-period' label='Review period' required error={errors.period?.message}>
          <Input
            id='a-period'
            maxLength={50}
            placeholder='2026-27 Annual Review'
            {...register('period')}
          />
        </FormField>
        <Controller
          control={control}
          name='review_date'
          render={({ field }) => (
            <FormField id='a-date' label='Review date' required error={errors.review_date?.message}>
              <DatePicker
                id='a-date'
                value={field.value}
                onChange={(value: string) => field.onChange(value)}
                invalid={Boolean(errors.review_date)}
              />
            </FormField>
          )}
        />
        <div className='flex items-center justify-between gap-3 rounded-lg border bg-muted/30 p-3 sm:col-span-2'>
          <span className='grid'>
            <span className='text-sm font-semibold'>Scores (1 to 5)</span>
            <span className='text-xs text-muted-foreground'>
              The overall score is the average of the five
            </span>
          </span>
          {overall !== null ? (
            <span className='flex items-center gap-2'>
              <span className='tabular text-xl font-bold'>{scoreText(overall)}</span>
              <Badge tone={OVERALL_RATING[ratingOf(overall)].tone}>
                {OVERALL_RATING[ratingOf(overall)].label}
              </Badge>
            </span>
          ) : (
            <span className='text-sm text-muted-foreground'>—</span>
          )}
        </div>
        {CRITERIA.map((item) => (
          <FormField
            key={item.key}
            id={`a-${item.key}`}
            label={item.label}
            required
            error={errors[item.key]?.message}
          >
            <Input
              id={`a-${item.key}`}
              type='number'
              inputMode='decimal'
              min={1}
              max={5}
              step={0.1}
              aria-invalid={Boolean(errors[item.key]) || undefined}
              {...register(item.key)}
            />
          </FormField>
        ))}
        <Controller
          control={control}
          name='recommendation'
          render={({ field }) => (
            <FormField
              id='a-recommendation'
              label='Recommendation'
              error={errors.recommendation?.message}
            >
              <Combobox
                id='a-recommendation'
                label='Recommendation'
                placeholder='Choose a recommendation'
                value={field.value}
                options={RECOMMENDATION_OPTIONS}
                onChange={(value) => value && field.onChange(value)}
                highlightSelected={false}
                className='sm:w-full'
              />
            </FormField>
          )}
        />
        <FormField
          id='a-increment'
          label='Increment %'
          hint='0 to 50'
          error={errors.increment_percent?.message}
        >
          <Input
            id='a-increment'
            type='number'
            inputMode='decimal'
            min={0}
            max={50}
            step={0.5}
            aria-invalid={Boolean(errors.increment_percent) || undefined}
            {...register('increment_percent')}
          />
        </FormField>
        <FormField
          id='a-strengths'
          label='Strengths'
          error={errors.strengths?.message}
          className='sm:col-span-2'
        >
          <Textarea id='a-strengths' rows={2} {...register('strengths')} />
        </FormField>
        <FormField
          id='a-improve'
          label='Areas for improvement'
          error={errors.areas_for_improvement?.message}
          className='sm:col-span-2'
        >
          <Textarea id='a-improve' rows={2} {...register('areas_for_improvement')} />
        </FormField>
        <FormField
          id='a-goals'
          label='Goals for next period'
          error={errors.goals_next_period?.message}
          className='sm:col-span-2'
        >
          <Textarea id='a-goals' rows={2} {...register('goals_next_period')} />
        </FormField>
        <FormField
          id='a-remarks'
          label='Reviewer remarks'
          error={errors.reviewer_remarks?.message}
          className='sm:col-span-2'
        >
          <Textarea id='a-remarks' rows={2} {...register('reviewer_remarks')} />
        </FormField>
      </form>
    </AppModal>
  )
}
