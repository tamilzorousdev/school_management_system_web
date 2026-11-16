import { useState } from 'react'
import { ClipboardCheck, Lock, PencilLine, RotateCcw, Save } from 'lucide-react'
import { Combobox } from '@/components/common/combobox'
import { EmptyState, ErrorState } from '@/components/common/display'
import { useShortcut } from '@/components/shortcuts/shortcut-context'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { alerts } from '@/lib/alerts'
import { toApiError } from '@/lib/api/errors'
import { formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import {
  examsApi,
  useExam,
  useExamMutation,
  useExamOptions,
  useMarksSheet,
  type MarkEntry,
  type MarksSheet,
} from '../api'
import { classOfSection, pickExam, pickSection } from '../labels'
import type { ExamsSearch } from '../search'
import { ExamPicker, SectionPicker } from './exam-pickers'

export function MarksTab({
  examId,
  sectionId,
  subjectId,
  canManage,
  onChange,
}: {
  examId?: number
  sectionId?: number
  subjectId?: number
  canManage: boolean
  onChange: (patch: Partial<ExamsSearch>) => void
}) {
  const exams = useExamOptions()
  const list = exams.data?.items ?? []
  const chosenExam = pickExam(list, examId, 'draft')
  const exam = useExam(chosenExam)
  const detail = exam.data?.id === chosenExam ? exam.data : undefined
  const chosenSection = pickSection(detail, sectionId)
  const papers = classOfSection(detail, chosenSection)?.subjects ?? []
  const chosenSubject =
    subjectId && papers.some((paper) => paper.subject_id === subjectId)
      ? subjectId
      : papers[0]?.subject_id
  const sheet = useMarksSheet(chosenExam, chosenSection, chosenSubject)

  useShortcut('app.refresh', () => void sheet.refetch())

  if (exams.isError) {
    return (
      <Card>
        <ErrorState message={exams.error.message} onRetry={() => exams.refetch()} />
      </Card>
    )
  }
  if (exams.data && !list.length) {
    return (
      <Card>
        <EmptyState
          icon={ClipboardCheck}
          title='No exams yet'
          description='Create an exam in the Exams tab, then view student marks here.'
        />
      </Card>
    )
  }

  return (
    <div className='grid gap-4'>
      <div className='flex flex-wrap items-center gap-2'>
        <ExamPicker
          exams={list}
          value={chosenExam}
          onChange={(exam_id) =>
            onChange({ exam_id, section_id: undefined, subject_id: undefined })
          }
        />
        <SectionPicker
          exam={detail}
          value={chosenSection}
          onChange={(section_id) => onChange({ section_id, subject_id: undefined })}
        />
        <Combobox
          id='exam-subject-picker'
          label='Subject'
          value={chosenSubject ? String(chosenSubject) : undefined}
          placeholder='Choose subject'
          searchPlaceholder='Search subjects'
          emptyText='No subjects in this exam'
          highlightSelected={false}
          options={papers.map((paper) => ({
            value: String(paper.subject_id),
            label: paper.subject_name,
            hint: `Max ${paper.max_marks}`,
          }))}
          onChange={(value) => value && onChange({ subject_id: Number(value) })}
        />
      </div>
      {sheet.isError ? (
        <Card>
          <ErrorState message={sheet.error.message} onRetry={() => sheet.refetch()} />
        </Card>
      ) : detail && !chosenSection ? (
        <Card>
          <EmptyState
            icon={PencilLine}
            title='No sections write this exam'
            description='Add classes to the exam in the Exams tab.'
          />
        </Card>
      ) : !sheet.data ? (
        <Skeleton className='h-96 w-full rounded-xl' />
      ) : (
        <MarksGrid
          key={`${sheet.dataUpdatedAt}-${chosenExam}-${chosenSection}-${chosenSubject}`}
          sheet={sheet.data}
          canManage={canManage}
        />
      )}
    </div>
  )
}

interface Draft {
  marks: string
  absent: boolean
}

const MARK_PATTERN = /^\d{1,3}(\.\d{1,2})?$/

function markError(draft: Draft, max: number): string | null {
  if (draft.absent || draft.marks.trim() === '') return null
  const value = Number(draft.marks)
  if (!MARK_PATTERN.test(draft.marks.trim()) || Number.isNaN(value) || value < 0 || value > max) {
    return `0 to ${max}`
  }
  return null
}

function MarksGrid({ sheet, canManage }: { sheet: MarksSheet; canManage: boolean }) {
  const original = Object.fromEntries(
    sheet.students.map((row) => [
      row.student_id,
      { marks: row.marks === null ? '' : String(row.marks), absent: row.is_absent },
    ])
  ) as Record<number, Draft>
  const [drafts, setDrafts] = useState<Record<number, Draft>>(original)
  const [serverErrors, setServerErrors] = useState<Record<number, string>>({})
  const save = useExamMutation((items: MarkEntry[]) =>
    examsApi.saveMarks(sheet.exam.id, sheet.section.id, sheet.subject.id, items)
  )
  const max = sheet.subject.max_marks
  const editable = sheet.editable

  const changed = sheet.students.filter((row) => {
    const draft = drafts[row.student_id]
    const before = original[row.student_id]
    return draft.absent !== before.absent || draft.marks.trim() !== before.marks
  })
  const errors = Object.fromEntries(
    sheet.students
      .map((row) => [row.student_id, markError(drafts[row.student_id], max)] as const)
      .filter(([, message]) => message)
  ) as Record<number, string>
  const entered = sheet.students.filter(
    (row) => drafts[row.student_id].absent || drafts[row.student_id].marks.trim() !== ''
  ).length

  const setDraft = (studentId: number, patch: Partial<Draft>) => {
    setDrafts((current) => ({ ...current, [studentId]: { ...current[studentId], ...patch } }))
    if (serverErrors[studentId]) {
      setServerErrors((current) => {
        const next = { ...current }
        delete next[studentId]
        return next
      })
    }
  }

  const focusRow = (index: number) => {
    const input = document.getElementById(`mark-input-${index}`)
    if (input instanceof HTMLInputElement) {
      input.focus()
      input.select()
    }
  }

  const submit = async () => {
    if (Object.keys(errors).length) {
      alerts.error('Fix the highlighted marks first')
      focusRow(sheet.students.findIndex((row) => errors[row.student_id]))
      return
    }
    if (!changed.length) {
      alerts.info('No changes to save')
      return
    }
    const items = changed.map((row) => {
      const draft = drafts[row.student_id]
      return {
        student_id: row.student_id,
        marks: draft.absent || draft.marks.trim() === '' ? null : Number(draft.marks),
        is_absent: draft.absent,
      }
    })
    try {
      const result = await save.mutateAsync(items)
      alerts.success('Marks saved', {
        description: `${sheet.subject.name}, ${sheet.section.name}: ${result.entered} of ${result.total} entered`,
      })
    } catch (error) {
      const apiError = toApiError(error)
      const next: Record<number, string> = {}
      apiError.fieldErrors.forEach((field) => {
        const index = Number(field.field.match(/^items\.(\d+)\./)?.[1])
        const item = items[index]
        if (item) next[item.student_id] = field.message
      })
      setServerErrors(next)
      alerts.error(apiError.message)
    }
  }

  useShortcut('modal.submit', () => void submit(), { enabled: editable })

  return (
    <Card className='overflow-hidden'>
      <div className='flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3'>
        <div className='grid min-w-0'>
          <h2 className='flex items-center gap-2 font-bold'>
            <span className='font-mono text-xs text-primary'>{sheet.subject.code}</span>
            <span className='truncate'>
              {sheet.subject.name} · Class {sheet.section.name}
            </span>
          </h2>
          <span className='text-xs text-muted-foreground'>
            Max {max} · Pass {sheet.subject.pass_marks}
            {sheet.subject.exam_date && ` · ${formatDate(sheet.subject.exam_date)}`}
            {(sheet.teacher || sheet.class_teacher) && (
              <span>
                {' · '}
                {sheet.teacher ? `Subject Teacher: ${sheet.teacher.name}` : ''}
                {sheet.teacher && sheet.class_teacher ? ' · ' : ''}
                {sheet.class_teacher ? `Class Teacher: ${sheet.class_teacher.name}` : ''}
              </span>
            )}
          </span>
        </div>
        <div className='flex flex-wrap items-center gap-2'>
          <Badge tone={entered === sheet.total ? 'success' : 'warning'}>
            {entered} of {sheet.total} entered
          </Badge>
          {!editable && (
            <Badge tone='neutral' className='flex items-center gap-1 font-medium'>
              <Lock className='size-3 text-muted-foreground' />
              View only
            </Badge>
          )}
          {editable && (
            <>
              <Button
                variant='outline'
                size='sm'
                disabled={!changed.length || save.isPending}
                onClick={() => {
                  setDrafts(original)
                  setServerErrors({})
                }}
              >
                <RotateCcw />
                Undo changes
              </Button>
              <Button size='sm' loading={save.isPending} onClick={() => void submit()}>
                <Save />
                Save marks{changed.length ? ` (${changed.length})` : ''}
              </Button>
            </>
          )}
        </div>
      </div>
      {!editable && (
        <div className='flex items-center gap-2.5 border-b bg-amber-500/10 px-4 py-2.5 text-xs font-medium text-amber-900 dark:text-amber-200'>
          <Lock className='size-4 shrink-0 text-amber-600 dark:text-amber-400' />
          <span>
            <strong>Marks entry is restricted to staff:</strong> Only the assigned class teacher or subject teacher can enter marks.
            {sheet.teacher || sheet.class_teacher ? (
              <span className='ml-1 font-normal opacity-90'>
                (Assigned staff: {sheet.teacher ? `Subject Teacher: ${sheet.teacher.name}` : ''}
                {sheet.teacher && sheet.class_teacher ? ' · ' : ''}
                {sheet.class_teacher ? `Class Teacher: ${sheet.class_teacher.name}` : ''})
              </span>
            ) : (
              <span className='ml-1 font-normal opacity-90'>
                (No teacher is assigned to this subject/class yet. Assign a teacher in <strong>Staff → Teacher assignments</strong> to enable marks entry.)
              </span>
            )}
          </span>
        </div>
      )}
      {sheet.exam.status === 'published' && (
        <p className='border-b bg-info/5 px-4 py-2 text-xs text-info'>
          Results are published. {canManage ? 'Changes here update the results parents see.' : ''}
        </p>
      )}
      {!sheet.students.length ? (
        <EmptyState
          icon={PencilLine}
          title='No students in this section'
          description='Place students in this section from the Students page.'
        />
      ) : (
        <>
          <div className='hidden grid-cols-[3rem_minmax(0,1fr)_7rem_6rem] gap-3 border-b bg-muted/40 px-4 py-2 text-[11px] font-bold tracking-wide text-muted-foreground uppercase sm:grid'>
            <span>Roll</span>
            <span>Student</span>
            <span className={cn(!editable && 'text-right')}>Marks</span>
            <span>{editable ? 'Absent' : 'Status'}</span>
          </div>
          <ul className='divide-y' aria-label={`Marks for ${sheet.subject.name}`}>
            {sheet.students.map((row, index) => {
              const draft = drafts[row.student_id]
              const error = errors[row.student_id] ?? serverErrors[row.student_id]
              const value = draft.marks.trim() === '' ? null : Number(draft.marks)
              const below =
                !error && !draft.absent && value !== null && value < sheet.subject.pass_marks
              return (
                <li
                  key={row.student_id}
                  className={cn(
                    'flex items-center gap-3 px-4 py-2 sm:grid sm:grid-cols-[3rem_minmax(0,1fr)_7rem_6rem]',
                    error && 'bg-destructive/5'
                  )}
                >
                  <span className='tabular hidden text-sm text-muted-foreground sm:block'>
                    {row.roll_no ?? '—'}
                  </span>
                  <label htmlFor={`mark-input-${index}`} className='grid min-w-0 flex-1'>
                    <span className='truncate text-sm font-semibold'>
                      <span className='tabular mr-1.5 text-muted-foreground sm:hidden'>
                        {row.roll_no ?? '—'}.
                      </span>
                      {row.full_name}
                    </span>
                    <span className='truncate text-xs text-muted-foreground'>
                      {row.admission_no}
                    </span>
                  </label>
                  {editable ? (
                    <>
                      <div className='grid w-24 shrink-0 gap-0.5 sm:w-auto'>
                        <Input
                          id={`mark-input-${index}`}
                          inputMode='decimal'
                          autoComplete='off'
                          placeholder={draft.absent ? 'AB' : '—'}
                          value={draft.absent ? '' : draft.marks}
                          disabled={draft.absent}
                          aria-invalid={Boolean(error)}
                          aria-describedby={error ? `mark-error-${index}` : undefined}
                          aria-label={`Marks for ${row.full_name}`}
                          onChange={(event) => setDraft(row.student_id, { marks: event.target.value })}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter' || event.key === 'ArrowDown') {
                              event.preventDefault()
                              focusRow(index + 1)
                            }
                            if (event.key === 'ArrowUp') {
                              event.preventDefault()
                              focusRow(index - 1)
                            }
                          }}
                          onFocus={(event) => event.currentTarget.select()}
                          className={cn('tabular h-9 text-right', below && 'text-destructive')}
                        />
                        {error && (
                          <span
                            id={`mark-error-${index}`}
                            role='alert'
                            className='text-[11px] font-medium text-destructive'
                          >
                            {error}
                          </span>
                        )}
                      </div>
                      <label className='flex shrink-0 cursor-pointer items-center gap-1.5 text-xs font-semibold text-muted-foreground'>
                        <input
                          type='checkbox'
                          className='size-4 accent-primary'
                          checked={draft.absent}
                          aria-label={`${row.full_name} was absent`}
                          onChange={(event) =>
                            setDraft(row.student_id, { absent: event.target.checked })
                          }
                        />
                        <span className='hidden sm:inline'>Absent</span>
                        <span className='sm:hidden'>AB</span>
                      </label>
                    </>
                  ) : (
                    <>
                      <div className='text-right'>
                        {row.is_absent ? (
                          <span className='text-xs font-medium text-muted-foreground'>—</span>
                        ) : row.marks !== null ? (
                          <div className='flex items-baseline justify-end gap-1'>
                            <span className={cn('tabular text-sm font-bold', below && 'text-destructive')}>
                              {row.marks}
                            </span>
                            <span className='text-xs font-normal text-muted-foreground'>/ {max}</span>
                          </div>
                        ) : (
                          <span className='text-xs italic text-muted-foreground'>Not entered</span>
                        )}
                      </div>
                      <div className='flex items-center'>
                        {row.is_absent ? (
                          <Badge tone='danger' className='text-[11px] font-medium'>
                            Absent
                          </Badge>
                        ) : row.marks !== null ? (
                          <span className='text-xs text-muted-foreground'>Present</span>
                        ) : (
                          <span className='text-xs text-muted-foreground'>—</span>
                        )}
                      </div>
                    </>
                  )}
                </li>
              )
            })}
          </ul>
          <p className='border-t px-4 py-2 text-xs text-muted-foreground'>
            {editable
              ? `Press Enter or ↓ to move to the next student. Leave a box empty to clear it. Marks below ${sheet.subject.pass_marks} show in red.`
              : 'Marks entered by the assigned class staff are displayed above. Administrators have read-only access to prevent unauthorized mark changes.'}
          </p>
        </>
      )}
    </Card>
  )
}
