import { useState } from 'react'
import { AppModal } from '@/components/common/app-modal'
import { Combobox } from '@/components/common/combobox'
import { DatePicker } from '@/components/common/date-picker'
import { FormField } from '@/components/common/form-field'
import { SegmentedControl } from '@/components/common/segmented-control'
import { TimePicker } from '@/components/common/time-picker'
import { Input, Textarea } from '@/components/ui/input'
import { fieldErrorsOf } from '@/features/setup/form-actions'
import { useSections, useSubjects } from '@/features/setup/api'
import { useAssignments } from '@/features/staff/api'
import { useStudents } from '@/features/students/api'
import { useBellSchedule } from '@/features/timetable/api'
import { alerts } from '@/lib/alerts'
import { toApiError } from '@/lib/api/errors'
import { cn } from '@/lib/utils'
import {
  performanceApi,
  usePerformanceMutation,
  type DayPart,
  type SpecialClass,
  type SpecialClassInput,
  type SpecialKind,
  type SpecialTiming,
} from '../api'

const PERIOD_DAYS = [
  { value: '1', label: 'Monday' },
  { value: '2', label: 'Tuesday' },
  { value: '3', label: 'Wednesday' },
  { value: '4', label: 'Thursday' },
  { value: '5', label: 'Friday' },
  { value: '6', label: 'Saturday' },
]

const WEEK = [
  { value: 1, label: 'Mon' },
  { value: 2, label: 'Tue' },
  { value: 3, label: 'Wed' },
  { value: 4, label: 'Thu' },
  { value: 5, label: 'Fri' },
  { value: 6, label: 'Sat' },
  { value: 0, label: 'Sun' },
]

const DAY_PARTS: { value: DayPart; label: string }[] = [
  { value: 'custom', label: 'Custom hours' },
  { value: 'full', label: 'Full day' },
  { value: 'morning', label: 'Morning half' },
  { value: 'afternoon', label: 'Afternoon half' },
]

export function SpecialClassModal({
  section,
  special,
  studentIds,
  kind: initialKind,
  prefill,
  onClose,
  onSaved,
}: {
  section: { id: number; name: string; class_id?: number }
  special?: SpecialClass
  studentIds?: number[]
  kind?: SpecialKind
  prefill?: { days: number[]; start_time: string; end_time: string }
  onClose: () => void
  onSaved?: () => void
}) {
  const [kind, setKind] = useState<SpecialKind>(special?.kind ?? initialKind ?? 'extra')
  const [timing, setTiming] = useState<SpecialTiming>(special?.timing ?? 'extra_time')
  const [draft, setDraft] = useState(() => ({
    title: special?.title ?? '',
    subject_id: special?.subject ? String(special.subject.id) : '',
    teacher_user_id: special ? String(special.teacher.id) : '',
    day_of_week: special?.day_of_week ? String(special.day_of_week) : '',
    period_no: special?.period_no ? String(special.period_no) : '',
    start_time:
      special?.timing === 'extra_time'
        ? (special.start_time ?? '')
        : (prefill?.start_time ?? '16:00'),
    end_time:
      special?.timing === 'extra_time' ? (special.end_time ?? '') : (prefill?.end_time ?? '17:00'),
    start_date:
      special?.start_date ??
      (prefill ? new Date(Date.now() + 5.5 * 3600 * 1000).toISOString().slice(0, 10) : ''),
    end_date: special?.end_date ?? '',
    day_part: (special?.day_part ?? 'custom') as DayPart,
    notes: special?.notes ?? '',
  }))
  const [days, setDays] = useState<number[]>(
    special?.timing === 'extra_time' ? special.days : (prefill?.days ?? [1, 3])
  )
  const [chosen, setChosen] = useState<Set<number>>(
    new Set(special ? special.students.map((student) => student.id) : (studentIds ?? []))
  )
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [alsoFor, setAlsoFor] = useState<number[]>([])
  const sections = useSections()
  const otherSections = (sections.data ?? []).filter(
    (item) => item.id !== section.id && item.student_count > 0
  )
  const subjects = useSubjects()
  const teachers = useAssignments({})
  const students = useStudents({ page: 1, limit: 100, section_id: section.id })
  const bells = useBellSchedule(section.class_id)
  const save = usePerformanceMutation((input: SpecialClassInput) =>
    special ? performanceApi.updateSpecial(special.id, input) : performanceApi.createSpecial(input)
  )

  const set = (field: keyof typeof draft, value: string) => {
    setDraft((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: '', root: '' }))
  }
  const periods = (bells.data ?? []).filter((period) => !period.is_break && period.period_no)
  const teaching = [...periods].sort((a, b) => a.start_time.localeCompare(b.start_time))
  const roster = students.data?.items ?? []
  const word = kind === 'special' ? 'special class' : 'extra class'

  const applyPart = (part: DayPart) => {
    set('day_part', part)
    if (part === 'custom' || !teaching.length) return
    const first = teaching[0]
    const last = teaching[teaching.length - 1]
    const afternoon = teaching.find((period) => (period.period_no ?? 0) >= 5) ?? last
    const before = teaching.filter((period) => (period.period_no ?? 0) < 5)
    const morningEnd = before.length ? before[before.length - 1].end_time : afternoon.start_time
    const [start, end] =
      part === 'full'
        ? [first.start_time, last.end_time]
        : part === 'morning'
          ? [first.start_time, morningEnd]
          : [afternoon.start_time, last.end_time]
    setDraft((current) => ({ ...current, day_part: part, start_time: start, end_time: end }))
  }

  const submit = async () => {
    const missing: Record<string, string> = {}
    if (draft.title.trim().length < 2)
      missing.title = 'Give the class a name, for example Maths support'
    if (!draft.teacher_user_id) missing.teacher_user_id = 'Choose the teacher'
    if (timing === 'period') {
      if (!draft.day_of_week) missing.day_of_week = 'Choose the day'
      if (!draft.period_no) missing.period_no = 'Choose the period'
    } else {
      if (!draft.start_time) missing.start_time = 'Choose the start time'
      if (!draft.end_time) missing.end_time = 'Choose the end time'
      if (draft.start_time && draft.end_time && draft.end_time <= draft.start_time)
        missing.end_time = 'Must end after it starts'
      if (!draft.start_date) missing.start_date = 'Choose the first day'
      if (!draft.end_date) missing.end_date = 'Choose the last day'
      if (draft.start_date && draft.end_date && draft.end_date < draft.start_date)
        missing.end_date = 'Cannot be before the first day'
      if (!days.length && draft.start_date !== draft.end_date)
        missing.days = 'Choose the weekdays, or the same first and last day for one day'
    }
    if (kind === 'extra' && !chosen.size) missing.student_ids = 'Choose at least one student'
    if (Object.keys(missing).length) return setErrors(missing)
    const base = {
      kind,
      timing,
      section_id: section.id,
      subject_id: draft.subject_id ? Number(draft.subject_id) : null,
      teacher_user_id: Number(draft.teacher_user_id),
      title: draft.title.trim(),
      notes: draft.notes.trim() || null,
      ...(kind === 'extra' ? { student_ids: [...chosen] } : {}),
    }
    const failed: string[] = []
    if (!special && kind === 'special') {
      for (const otherId of alsoFor) {
        const other = otherSections.find((item) => item.id === otherId)
        const payload =
          timing === 'period'
            ? {
                ...base,
                section_id: otherId,
                day_of_week: Number(draft.day_of_week),
                period_no: Number(draft.period_no),
              }
            : {
                ...base,
                section_id: otherId,
                days,
                start_time: draft.start_time,
                end_time: draft.end_time,
                start_date: draft.start_date,
                end_date: draft.end_date,
                day_part: draft.day_part,
              }
        try {
          await performanceApi.createSpecial(payload)
        } catch (error) {
          failed.push(
            `${other ? `${other.class_name} - ${other.name}` : otherId}: ${toApiError(error).message}`
          )
        }
      }
    }
    try {
      await save.mutateAsync(
        timing === 'period'
          ? { ...base, day_of_week: Number(draft.day_of_week), period_no: Number(draft.period_no) }
          : {
              ...base,
              days,
              start_time: draft.start_time,
              end_time: draft.end_time,
              start_date: draft.start_date,
              end_date: draft.end_date,
              day_part: draft.day_part,
            }
      )
      const count = 1 + alsoFor.length - failed.length
      alerts.success(
        special
          ? `${draft.title.trim()} saved`
          : `${draft.title.trim()} created for ${count} ${count === 1 ? 'section' : 'sections'}. The teacher and parents have been told.`
      )
      if (failed.length) alerts.error(`Not created for ${failed.join('; ')}`)
      onSaved?.()
      onClose()
    } catch (error) {
      const fields = fieldErrorsOf(error)
      if (fields.root) alerts.error(fields.root)
      else setErrors(fields)
    }
  }

  return (
    <AppModal
      open
      onOpenChange={(open) => !open && onClose()}
      title={special ? `Edit ${special.title}` : `New ${word} for ${section.name}`}
      description={
        kind === 'special'
          ? 'Every student of the class attends, including students who join later.'
          : 'Only the students you choose attend.'
      }
      formId='special-class-form'
      submitText={special ? 'Save' : `Create ${word}`}
      loading={save.isPending}
    >
      <form
        id='special-class-form'
        noValidate
        className='grid gap-4 sm:grid-cols-2'
        onSubmit={(event) => {
          event.preventDefault()
          void submit()
        }}
      >
        <FormField id='special-kind' label='Who attends' className='sm:col-span-2'>
          <SegmentedControl
            label='Who attends'
            value={kind}
            onChange={(value: SpecialKind) => setKind(value)}
            options={[
              { value: 'extra', label: 'Chosen students (extra class)' },
              { value: 'special', label: 'Whole class (special class)' },
            ]}
          />
        </FormField>
        {!special && kind === 'special' && otherSections.length > 0 && (
          <FormField
            id='special-also'
            label='Also create for'
            hint='The same special class for other sections, for example 9-B and 9-C'
            className='sm:col-span-2'
          >
            <div
              id='special-also'
              role='group'
              aria-label='Also create for'
              className='flex flex-wrap gap-1.5'
            >
              {otherSections.map((item) => {
                const on = alsoFor.includes(item.id)
                return (
                  <button
                    key={item.id}
                    type='button'
                    role='checkbox'
                    aria-checked={on}
                    onClick={() =>
                      setAlsoFor((current) =>
                        on ? current.filter((id) => id !== item.id) : [...current, item.id]
                      )
                    }
                    className={cn(
                      'h-8 rounded-full border px-3 text-xs font-semibold',
                      on
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'text-muted-foreground'
                    )}
                  >
                    {item.class_name} - {item.name}
                  </button>
                )
              })}
            </div>
          </FormField>
        )}
        <FormField
          id='special-title'
          label='Name'
          required
          error={errors.title}
          className='sm:col-span-2'
        >
          <Input
            id='special-title'
            value={draft.title}
            maxLength={120}
            placeholder={kind === 'special' ? 'Board exam revision' : 'Maths support'}
            onChange={(event) => set('title', event.target.value)}
          />
        </FormField>
        <FormField id='special-subject' label='Subject' error={errors.subject_id}>
          <Combobox
            className='sm:w-full'
            id='special-subject'
            label='Subject'
            value={draft.subject_id || undefined}
            placeholder='Any subject'
            searchPlaceholder='Search subjects'
            options={(subjects.data?.items ?? []).map((subject) => ({
              value: String(subject.id),
              label: subject.name,
              hint: subject.code,
            }))}
            onChange={(value) => set('subject_id', value ?? '')}
          />
        </FormField>
        <FormField id='special-teacher' label='Teacher' required error={errors.teacher_user_id}>
          <Combobox
            className='sm:w-full'
            id='special-teacher'
            label='Teacher'
            value={draft.teacher_user_id || undefined}
            placeholder='Choose a teacher'
            searchPlaceholder='Search teachers'
            invalid={Boolean(errors.teacher_user_id)}
            options={(teachers.data?.teachers ?? []).map((teacher) => ({
              value: String(teacher.user_id),
              label: teacher.name,
              hint: `${teacher.load_periods}/${teacher.max_periods_per_week} a week`,
            }))}
            onChange={(value) => set('teacher_user_id', value ?? '')}
          />
        </FormField>
        <FormField
          id='special-timing'
          label='When'
          className='sm:col-span-2'
          hint={
            timing === 'extra_time'
              ? 'Before or after school, a break or lunch, or a Sunday or holiday. No regular class is missed.'
              : 'Takes one period every week; the students miss that regular period.'
          }
        >
          <SegmentedControl
            label='When'
            value={timing}
            onChange={(value: SpecialTiming) => setTiming(value)}
            options={[
              { value: 'extra_time', label: 'Extra time' },
              { value: 'period', label: 'During a period' },
            ]}
          />
        </FormField>
        {timing === 'period' ? (
          <>
            <FormField id='special-day' label='Day' required error={errors.day_of_week}>
              <Combobox
                className='sm:w-full'
                id='special-day'
                label='Day'
                value={draft.day_of_week || undefined}
                placeholder='Choose a day'
                invalid={Boolean(errors.day_of_week)}
                options={PERIOD_DAYS}
                onChange={(value) => set('day_of_week', value ?? '')}
              />
            </FormField>
            <FormField id='special-period' label='Period' required error={errors.period_no}>
              <Combobox
                className='sm:w-full'
                id='special-period'
                label='Period'
                value={draft.period_no || undefined}
                placeholder='Choose a period'
                invalid={Boolean(errors.period_no)}
                options={periods.map((period) => ({
                  value: String(period.period_no),
                  label: `Period ${period.period_no}`,
                  hint: `${period.start_time} – ${period.end_time}`,
                }))}
                onChange={(value) => set('period_no', value ?? '')}
              />
            </FormField>
          </>
        ) : (
          <>
            <FormField
              id='special-days'
              label='Repeats on'
              error={errors.days}
              className='sm:col-span-2'
            >
              <div
                id='special-days'
                role='group'
                aria-label='Repeats on'
                className='flex flex-wrap gap-1.5'
              >
                {WEEK.map((day) => {
                  const on = days.includes(day.value)
                  return (
                    <button
                      key={day.value}
                      type='button'
                      role='checkbox'
                      aria-checked={on}
                      onClick={() => {
                        setDays((current) =>
                          on
                            ? current.filter((item) => item !== day.value)
                            : [...current, day.value]
                        )
                        setErrors((current) => ({ ...current, days: '' }))
                      }}
                      className={cn(
                        'h-8 min-w-12 rounded-full border px-3 text-xs font-semibold',
                        on
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'text-muted-foreground'
                      )}
                    >
                      {day.label}
                    </button>
                  )
                })}
              </div>
            </FormField>
            <FormField id='special-start-date' label='First day' required error={errors.start_date}>
              <DatePicker
                id='special-start-date'
                value={draft.start_date}
                invalid={Boolean(errors.start_date)}
                onChange={(value: string) => set('start_date', value)}
              />
            </FormField>
            <FormField
              id='special-end-date'
              label='Last day'
              required
              error={errors.end_date}
              hint='Same as the first day for a one-day class'
            >
              <DatePicker
                id='special-end-date'
                value={draft.end_date}
                min={draft.start_date || undefined}
                invalid={Boolean(errors.end_date)}
                onChange={(value: string) => set('end_date', value)}
              />
            </FormField>
            <FormField
              id='special-part'
              label='Hours'
              className='sm:col-span-2'
              hint='Full day and half day use the bell schedule; good for Sundays and holidays'
            >
              <SegmentedControl
                label='Hours'
                value={draft.day_part}
                onChange={(value: DayPart) => applyPart(value)}
                options={DAY_PARTS}
              />
            </FormField>
            <FormField id='special-start' label='Starts at' required error={errors.start_time}>
              <TimePicker
                id='special-start'
                value={draft.start_time}
                invalid={Boolean(errors.start_time)}
                onChange={(value) => {
                  set('start_time', value)
                  set('day_part', 'custom')
                }}
              />
            </FormField>
            <FormField id='special-end' label='Ends at' required error={errors.end_time}>
              <TimePicker
                id='special-end'
                value={draft.end_time}
                invalid={Boolean(errors.end_time)}
                onChange={(value) => {
                  set('end_time', value)
                  set('day_part', 'custom')
                }}
              />
            </FormField>
          </>
        )}
        <FormField id='special-notes' label='Notes' error={errors.notes} className='sm:col-span-2'>
          <Textarea
            id='special-notes'
            value={draft.notes}
            maxLength={500}
            rows={2}
            placeholder='What the class will cover'
            onChange={(event) => set('notes', event.target.value)}
          />
        </FormField>
        {kind === 'extra' ? (
          <fieldset className='grid gap-2 sm:col-span-2'>
            <legend className='mb-1 text-sm font-medium'>
              Students <span className='text-muted-foreground'>({chosen.size} chosen)</span>
            </legend>
            {errors.student_ids && (
              <p className='text-xs text-destructive' role='alert'>
                {errors.student_ids}
              </p>
            )}
            <ul className='grid max-h-56 gap-1.5 overflow-auto sm:grid-cols-2'>
              {roster.map((student) => {
                const on = chosen.has(student.id)
                return (
                  <li key={student.id}>
                    <label
                      className={cn(
                        'flex cursor-pointer items-center gap-2.5 rounded-lg border p-2 text-sm',
                        on && 'border-primary/40 bg-primary/5'
                      )}
                    >
                      <input
                        type='checkbox'
                        className='size-4 accent-[var(--primary)]'
                        checked={on}
                        onChange={() => {
                          setChosen((current) => {
                            const next = new Set(current)
                            if (on) next.delete(student.id)
                            else next.add(student.id)
                            return next
                          })
                          setErrors((current) => ({ ...current, student_ids: '' }))
                        }}
                      />
                      <span className='truncate'>{student.full_name}</span>
                    </label>
                  </li>
                )
              })}
            </ul>
          </fieldset>
        ) : (
          <p className='rounded-lg border bg-muted/40 px-3 py-2 text-sm text-muted-foreground sm:col-span-2'>
            {roster.length === 1 ? 'The 1 student' : `All ${roster.length} students`} of{' '}
            {section.name} {roster.length === 1 ? 'attends' : 'attend'}.
          </p>
        )}
      </form>
    </AppModal>
  )
}
