import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { CalendarDays, Check } from 'lucide-react'
import { AppModal } from '@/components/common/app-modal'
import { Combobox } from '@/components/common/combobox'
import { FormField } from '@/components/common/form-field'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { RootError } from '@/features/setup/components/setup-shared'
import { fieldErrorsOf } from '@/features/setup/form-actions'
import { setupApi, useAcademicYears, useClasses } from '@/features/setup/api'
import { alerts } from '@/lib/alerts'
import { cn } from '@/lib/utils'
import {
  examsApi,
  useExam,
  useExamMutation,
  type Exam,
  type ExamDetail,
  type ExamInput,
  type PaperInput,
} from '../api'
import { studentsText } from '../labels'

const EXAM_TYPE_PRESETS = [
  { label: 'Monthly exam' },
  { label: 'Quarterly exam' },
  { label: 'Half-yearly exam' },
  { label: 'Annual exam' },
] as const

export function ExamModal({
  open,
  exam,
  onClose,
  onCreated,
}: {
  open: boolean
  exam?: Exam
  onClose: () => void
  onCreated: (exam: Exam) => void
}) {
  const detail = useExam(exam?.id)

  return (
    <AppModal
      open={open}
      onOpenChange={(next) => !next && onClose()}
      title={exam ? `Edit ${exam.name}` : 'New exam'}
      description={
        exam
          ? 'Update exam details, classes and specific subject exam dates.'
          : 'Choose exam type, term, dates, classes and assign specific exam dates to each subject.'
      }
      formId='exam-form'
      submitText={exam ? 'Save exam' : 'Create exam'}
      size='xl'
    >
      {open && (!exam || detail.data) && (
        <ExamForm
          key={exam ? detail.dataUpdatedAt : 'new-exam'}
          exam={exam}
          initialDetail={detail.data}
          onClose={onClose}
          onCreated={onCreated}
        />
      )}
    </AppModal>
  )
}

function ExamForm({
  exam,
  initialDetail,
  onClose,
  onCreated,
}: {
  exam?: Exam
  initialDetail?: ExamDetail
  onClose: () => void
  onCreated: (exam: Exam) => void
}) {
  const years = useAcademicYears()
  const classes = useClasses()
  const [name, setName] = useState(exam?.name ?? '')
  const [termId, setTermId] = useState<string | undefined>(
    exam?.term ? String(exam.term.id) : undefined
  )
  const [start, setStart] = useState(exam?.start_date ?? '')
  const [end, setEnd] = useState(exam?.end_date ?? '')
  const [classIds, setClassIds] = useState<number[]>(exam?.classes.map((item) => item.id) ?? [])
  const [subjectDates, setSubjectDates] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {}
    if (initialDetail?.class_details) {
      for (const cd of initialDetail.class_details) {
        for (const sub of cd.subjects) {
          if (sub.exam_date) {
            map[`${cd.id}-${sub.subject_id}`] = sub.exam_date
          }
        }
      }
    }
    return map
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const save = useExamMutation((input: ExamInput) =>
    exam ? examsApi.update(exam.id, input) : examsApi.create(input)
  )

  const year = (years.data ?? []).find((item) =>
    exam ? item.id === exam.academic_year.id : item.is_current
  )
  const termOptions = (year?.terms ?? []).map((term) => ({
    value: String(term.id),
    label: term.name,
    hint: `${term.start_date} to ${term.end_date}`,
  }))

  const classSubjectsQuery = useQuery({
    queryKey: ['exam-form-class-subjects', classIds],
    queryFn: async () => {
      const results = await Promise.all(
        classIds.map(async (cid) => {
          const list = await setupApi.classSubjects(cid)
          return {
            class_id: cid,
            subjects: list.filter((s) => s.type !== 'activity'),
          }
        })
      )
      return results
    },
    enabled: !exam && classIds.length > 0,
  })

  const applyPreset = (presetLabel: string) => {
    setName(presetLabel)
    if (termOptions.length) {
      if (presetLabel.includes('Quarterly') || presetLabel.includes('Monthly')) {
        const t = termOptions.find(
          (opt) => opt.label.includes('1') || opt.label.toLowerCase().includes('term 1')
        )
        if (t) setTermId(t.value)
      } else if (presetLabel.includes('Half-yearly')) {
        const t = termOptions.find(
          (opt) => opt.label.includes('2') || opt.label.toLowerCase().includes('term 2')
        )
        if (t) setTermId(t.value)
      } else if (presetLabel.includes('Annual')) {
        const t = termOptions.find(
          (opt) =>
            opt.label.includes('3') ||
            opt.label.toLowerCase().includes('term 3') ||
            opt.label.toLowerCase().includes('final')
        )
        if (t) setTermId(t.value)
      }
    }
  }

  const toggleClass = (id: number) => {
    setClassIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
    )
  }

  const displayedClasses = exam
    ? (initialDetail?.class_details ?? [])
        .filter((cd) => classIds.includes(cd.id))
        .map((cd) => ({
          id: cd.id,
          name: cd.name,
          subjects: cd.subjects.map((sub) => ({
            subject_id: sub.subject_id,
            subject_name: sub.subject_name,
            subject_code: sub.subject_code,
          })),
        }))
    : classIds.map((cid) => {
        const cls = classes.data?.find((c) => c.id === cid)
        const item = classSubjectsQuery.data?.find((res) => res.class_id === cid)
        return {
          id: cid,
          name: cls?.name ?? String(cid),
          subjects:
            item?.subjects.map((sub) => ({
              subject_id: sub.subject_id,
              subject_name: sub.name,
              subject_code: sub.code,
            })) ?? [],
        }
      })

  const validate = () => {
    const next: Record<string, string> = {}
    if (name.trim().length < 2) next.name = 'Enter the exam name'
    if (!start) next.start_date = 'Choose the first day'
    if (!end) next.end_date = 'Choose the last day'
    if (start && end && end < start) next.end_date = 'Must be on or after the first day'
    if (!classIds.length) next.class_ids = 'Pick at least one class'

    for (const dateVal of Object.values(subjectDates)) {
      if (dateVal) {
        if (start && dateVal < start) {
          next.subjects = 'Subject exam dates cannot be earlier than the exam start date'
          break
        }
        if (end && dateVal > end) {
          next.subjects = 'Subject exam dates cannot be later than the exam end date'
          break
        }
      }
    }
    return next
  }

  const allSubjects = displayedClasses.flatMap((c) =>
    c.subjects.map((s) => ({
      class_id: c.id,
      subject_id: s.subject_id,
      max_marks: 100,
      pass_marks: 35,
      exam_date: subjectDates[`${c.id}-${s.subject_id}`] || null,
    }))
  )

  return (
    <form
      id='exam-form'
      noValidate
      className='grid max-h-[75vh] gap-4 overflow-y-auto pr-1'
      onSubmit={async (event) => {
        event.preventDefault()
        const next = validate()
        setErrors(next)
        if (Object.keys(next).length) return

        try {
          const saved = await save.mutateAsync({
            name: name.trim(),
            term_id: termId ? Number(termId) : null,
            start_date: start,
            end_date: end,
            class_ids: classIds,
            subjects: allSubjects as PaperInput[],
          })
          if (exam) {
            alerts.success(`${saved.name} saved`)
            onClose()
          } else {
            alerts.success(`${saved.name} created with subject schedules`)
            onCreated(saved)
          }
        } catch (error) {
          setErrors(fieldErrorsOf(error))
        }
      }}
    >
      <RootError message={errors.root} />

      <div className='grid gap-1.5'>
        <span className='text-xs font-semibold text-muted-foreground'>Exam type presets</span>
        <div className='flex flex-wrap gap-1.5'>
          {EXAM_TYPE_PRESETS.map((preset) => {
            const active = name === preset.label
            return (
              <Button
                key={preset.label}
                type='button'
                variant={active ? 'default' : 'outline'}
                size='sm'
                onClick={() => applyPreset(preset.label)}
                className='h-7 text-xs font-semibold'
              >
                {preset.label}
              </Button>
            )
          })}
        </div>
      </div>

      <div className='grid gap-4 sm:grid-cols-2'>
        <FormField id='exam-name' label='Exam name' required error={errors.name}>
          <Input
            id='exam-name'
            autoFocus
            placeholder='Quarterly exam'
            value={name}
            aria-invalid={Boolean(errors.name)}
            onChange={(event) => setName(event.target.value)}
          />
        </FormField>

        <FormField
          id='exam-term'
          label='Term'
          error={errors.term_id}
          hint={year ? `Academic year ${year.name}` : undefined}
        >
          <Combobox
            id='exam-term'
            label='Term'
            value={termId}
            options={termOptions}
            allLabel='No term'
            placeholder='No term'
            searchPlaceholder='Search terms'
            emptyText='No terms in this year'
            onChange={setTermId}
            className='sm:w-full'
          />
        </FormField>

        <FormField id='exam-start' label='First day' required error={errors.start_date}>
          <Input
            id='exam-start'
            type='date'
            value={start}
            min={year?.start_date}
            max={year?.end_date}
            aria-invalid={Boolean(errors.start_date)}
            onChange={(event) => setStart(event.target.value)}
          />
        </FormField>

        <FormField id='exam-end' label='Last day' required error={errors.end_date}>
          <Input
            id='exam-end'
            type='date'
            value={end}
            min={start || year?.start_date}
            max={year?.end_date}
            aria-invalid={Boolean(errors.end_date)}
            onChange={(event) => setEnd(event.target.value)}
          />
        </FormField>
      </div>

      <div className='grid gap-1.5'>
        <span className='text-sm font-medium'>
          Classes<span className='ml-0.5 text-destructive'>*</span>
        </span>
        <div role='group' aria-label='Classes writing this exam' className='flex flex-wrap gap-1.5'>
          {(classes.data ?? []).map((item) => {
            const selected = classIds.includes(item.id)
            return (
              <button
                key={item.id}
                type='button'
                aria-pressed={selected}
                title={studentsText(item.student_count)}
                onClick={() => toggleClass(item.id)}
                className={cn(
                  'inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-xs font-semibold transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40',
                  selected
                    ? 'border-primary/50 bg-primary/10 text-primary'
                    : 'bg-card text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                {selected && <Check className='size-3.5' />}
                Class {item.name}
                <span className='tabular font-normal opacity-70'>{item.student_count}</span>
              </button>
            )
          })}
        </div>
        {errors.class_ids ? (
          <p role='alert' className='text-xs font-medium text-destructive'>
            {errors.class_ids}
          </p>
        ) : (
          <p className='text-xs text-muted-foreground'>
            {classIds.length
              ? `${classIds.length} ${classIds.length === 1 ? 'class' : 'classes'} selected`
              : 'The number is the students in each class'}
          </p>
        )}
      </div>

      {errors.subjects && (
        <p role='alert' className='text-xs font-medium text-destructive'>
          {errors.subjects}
        </p>
      )}

      {displayedClasses.some((c) => c.subjects.length > 0) && (
        <div className='grid gap-3 border-t pt-3'>
          <div className='flex items-center gap-2'>
            <CalendarDays className='size-4 text-primary' />
            <h4 className='text-sm font-bold'>Subject exam dates</h4>
          </div>
          <p className='text-xs text-muted-foreground'>
            Assign specific exam dates for each subject below (must be between{' '}
            {start || 'first day'} and {end || 'last day'}).
          </p>

          <div className='grid gap-3'>
            {displayedClasses.map((cls) => {
              if (!cls.subjects.length) return null
              return (
                <div key={cls.id} className='grid gap-2 rounded-lg border bg-muted/20 p-3'>
                  <span className='text-xs font-bold text-foreground'>
                    Class {cls.name} ({cls.subjects.length} subjects)
                  </span>
                  <div className='grid gap-2 sm:grid-cols-2 md:grid-cols-3'>
                    {cls.subjects.map((sub) => {
                      const key = `${cls.id}-${sub.subject_id}`
                      return (
                        <div
                          key={key}
                          className='flex flex-col justify-between gap-1.5 rounded-md border bg-card p-2.5 shadow-2xs'
                        >
                          <div className='flex items-center justify-between gap-1'>
                            <span className='truncate text-xs font-bold'>{sub.subject_name}</span>
                            <span className='font-mono text-[10px] font-bold text-primary'>
                              {sub.subject_code}
                            </span>
                          </div>
                          <div className='grid gap-1'>
                            <span className='text-[10px] font-semibold text-muted-foreground'>
                              Subject exam date
                            </span>
                            <Input
                              type='date'
                              min={start}
                              max={end}
                              value={subjectDates[key] ?? ''}
                              className='h-8 text-xs'
                              onChange={(e) =>
                                setSubjectDates((prev) => ({
                                  ...prev,
                                  [key]: e.target.value,
                                }))
                              }
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </form>
  )
}
