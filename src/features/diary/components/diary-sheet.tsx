import { useState, type ReactNode } from 'react'
import { BookOpenCheck, Check, CheckCheck, Eye, EyeOff, Paperclip, Undo2 } from 'lucide-react'
import { AppModal } from '@/components/common/app-modal'
import { Avatar } from '@/components/common/avatar'
import { ErrorState } from '@/components/common/display'
import { FormField } from '@/components/common/form-field'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input, Textarea } from '@/components/ui/input'
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { alerts } from '@/lib/alerts'
import { toApiError } from '@/lib/api/errors'
import { formatDate, formatDateTime } from '@/lib/format'
import {
  diaryApi,
  useDiaryAction,
  useDiaryEntry,
  useDiarySubmissions,
  useGradeSubmission,
  type DiaryDetail,
  type DiarySubmission,
} from '../api'
import { DIARY_STATUS, DIARY_TYPE } from '../labels'

type ReasonAction = 'reject' | 'hide'

export function DiarySheet({
  entryId,
  canModerate,
  onClose,
}: {
  entryId: number | null
  canModerate: boolean
  onClose: () => void
}) {
  const [shownId, setShownId] = useState(entryId)
  if (entryId && entryId !== shownId) setShownId(entryId)
  const entry = useDiaryEntry(shownId)
  const data = entry.data
  const [reason, setReason] = useState<ReasonAction | null>(null)
  const approve = useDiaryAction((id: number) => diaryApi.approve(id))
  const restore = useDiaryAction((id: number) => diaryApi.restore(id))

  const act = async (run: () => Promise<unknown>, message: string) => {
    try {
      await run()
      alerts.success(message)
    } catch (error) {
      alerts.error(toApiError(error).message)
    }
  }

  return (
    <Sheet open={Boolean(entryId)} onOpenChange={(open) => !open && onClose()}>
      <SheetContent aria-describedby={undefined}>
        {entry.isError && !data ? (
          <ErrorState message={entry.error.message} onRetry={() => entry.refetch()} />
        ) : !data ? (
          <div className='grid gap-4 p-6'>
            <Skeleton className='h-16' />
            <Skeleton className='h-48' />
          </div>
        ) : (
          <>
            <SheetHeader>
              <div className='flex items-center gap-3'>
                <span className='grid size-11 shrink-0 place-items-center rounded-full bg-primary/10 text-primary'>
                  <BookOpenCheck className='size-5' />
                </span>
                <div className='grid min-w-0 gap-0.5'>
                  <SheetTitle className='truncate'>{data.title}</SheetTitle>
                  <SheetDescription>
                    {data.author.name} · to {data.target_label}
                  </SheetDescription>
                  <div className='mt-1 flex flex-wrap gap-1.5'>
                    <Badge tone={DIARY_STATUS[data.status].tone} dot>
                      {DIARY_STATUS[data.status].label}
                    </Badge>
                    <Badge tone={DIARY_TYPE[data.type].tone}>{DIARY_TYPE[data.type].label}</Badge>
                    {data.subject && <Badge tone='neutral'>{data.subject.name}</Badge>}
                  </div>
                </div>
              </div>
            </SheetHeader>
            <SheetBody className='grid content-start gap-6'>
              {canModerate && (
                <Actions
                  data={data}
                  onReason={setReason}
                  approve={approve}
                  restore={restore}
                  act={act}
                />
              )}

              <Block title='Message'>
                <p className='rounded-lg border bg-muted/40 p-3 text-sm whitespace-pre-line'>
                  {data.body}
                </p>
                {data.due_date && (
                  <p className='text-sm'>
                    Due on <span className='font-semibold'>{formatDate(data.due_date)}</span>
                  </p>
                )}
                {data.attachments.length > 0 && (
                  <ul className='grid gap-1.5'>
                    {data.attachments.map((file) => (
                      <li key={file.id}>
                        <a
                          href={file.url}
                          target='_blank'
                          rel='noreferrer'
                          className='inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline'
                        >
                          <Paperclip className='size-4' />
                          {file.name}
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
              </Block>

              <Block title='Review'>
                <dl className='grid gap-x-6 gap-y-3 rounded-lg border p-3 sm:grid-cols-2'>
                  {[
                    ['Posted', formatDateTime(data.created_at)],
                    ['Published', formatDateTime(data.published_at)],
                    ['Reviewed by', data.review.by?.name ?? '—'],
                    ['Reviewed', formatDateTime(data.review.at)],
                    ['Note', data.review.note ?? '—'],
                    ['Academic year', data.academic_year.name],
                  ].map(([label, value]) => (
                    <div key={label} className='grid gap-0.5'>
                      <dt className='text-[11px] font-bold tracking-wider text-muted-foreground uppercase'>
                        {label}
                      </dt>
                      <dd className='text-sm font-semibold break-words'>{value}</dd>
                    </div>
                  ))}
                </dl>
              </Block>

              {data.type === 'homework' && (
                <SubmissionsBlock entryId={data.id} totalStudents={data.recipient_count} />
              )}

              <Block title={`Seen by parents · ${data.seen_count} of ${data.recipient_count}`}>
                <ul className='grid gap-2'>
                  {data.recipients.map((row) => (
                    <li
                      key={row.student.id}
                      className='flex items-center gap-3 rounded-lg border p-3'
                    >
                      <Avatar name={row.student.name} size='sm' />
                      <span className='grid min-w-0 flex-1'>
                        <span className='truncate font-semibold'>{row.student.name}</span>
                        <span className='text-xs text-muted-foreground'>
                          {row.class_section ?? 'Not placed'}
                        </span>
                      </span>
                      {row.seen_at ? (
                        <Badge tone='success' dot>
                          <CheckCheck className='size-3' />
                          {row.seen_by?.name ?? 'Seen'} · {formatDateTime(row.seen_at)}
                        </Badge>
                      ) : (
                        <Badge tone='neutral'>Not seen</Badge>
                      )}
                    </li>
                  ))}
                </ul>
              </Block>
            </SheetBody>
            {reason && (
              <ReasonModal
                action={reason}
                entry={data}
                onOpenChange={(open) => !open && setReason(null)}
              />
            )}
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}

function Actions({
  data,
  onReason,
  approve,
  restore,
  act,
}: {
  data: DiaryDetail
  onReason: (action: ReasonAction) => void
  approve: ReturnType<typeof useDiaryAction<number>>
  restore: ReturnType<typeof useDiaryAction<number>>
  act: (run: () => Promise<unknown>, message: string) => Promise<void>
}) {
  if (data.status === 'rejected') return null
  return (
    <div className='flex flex-wrap gap-2 rounded-lg border bg-muted/30 p-3'>
      {data.status === 'pending_review' && (
        <>
          <Button
            size='sm'
            loading={approve.isPending}
            onClick={() => act(() => approve.mutateAsync(data.id), 'Published to parents')}
          >
            <Check />
            Approve and publish
          </Button>
          <Button size='sm' variant='outline' onClick={() => onReason('reject')}>
            <Undo2 />
            Send back
          </Button>
        </>
      )}
      {data.status === 'published' && (
        <Button size='sm' variant='outline' onClick={() => onReason('hide')}>
          <EyeOff />
          Hide from parents
        </Button>
      )}
      {data.status === 'hidden' && (
        <Button
          size='sm'
          variant='outline'
          loading={restore.isPending}
          onClick={() => act(() => restore.mutateAsync(data.id), 'Shown to parents again')}
        >
          <Eye />
          Show again
        </Button>
      )}
    </div>
  )
}

function ReasonModal({
  action,
  entry,
  onOpenChange,
}: {
  action: ReasonAction
  entry: DiaryDetail
  onOpenChange: (open: boolean) => void
}) {
  const [note, setNote] = useState('')
  const [error, setError] = useState('')
  const save = useDiaryAction((text: string) =>
    action === 'reject' ? diaryApi.reject(entry.id, text) : diaryApi.hide(entry.id, text || null)
  )
  const reject = action === 'reject'

  return (
    <AppModal
      open
      onOpenChange={onOpenChange}
      title={reject ? 'Send back to the teacher' : 'Hide from parents'}
      description={
        reject
          ? `${entry.author.name} gets your reason and can edit the post.`
          : 'The post leaves the parent feed. You can show it again later.'
      }
      formId='diary-reason-form'
      submitText={reject ? 'Send back' : 'Hide'}
      loading={save.isPending}
    >
      <form
        id='diary-reason-form'
        noValidate
        className='grid gap-3'
        onSubmit={async (event) => {
          event.preventDefault()
          if (reject && !note.trim()) return setError('Give the teacher a reason')
          try {
            await save.mutateAsync(note.trim())
            alerts.success(reject ? 'Sent back to the teacher' : 'Hidden from parents')
            onOpenChange(false)
          } catch (caught) {
            const apiError = toApiError(caught)
            setError(apiError.fieldErrors[0]?.message ?? apiError.message)
          }
        }}
      >
        <FormField
          id='diary-reason'
          label={reject ? 'Reason' : 'Note (optional)'}
          required={reject}
          error={error}
        >
          <Textarea
            id='diary-reason'
            value={note}
            maxLength={255}
            placeholder={
              reject ? 'For example: please write this more kindly' : 'For example: posted twice'
            }
            onChange={(event) => {
              setNote(event.target.value)
              setError('')
            }}
          />
        </FormField>
      </form>
    </AppModal>
  )
}

function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className='grid gap-3'>
      <h3 className='text-xs font-bold tracking-wider text-muted-foreground uppercase'>{title}</h3>
      {children}
    </section>
  )
}

function SubmissionsBlock({
  entryId,
  totalStudents,
}: {
  entryId: number
  totalStudents: number
}) {
  const submissions = useDiarySubmissions(entryId)
  const [evaluating, setEvaluating] = useState<DiarySubmission | null>(null)
  const list = submissions.data ?? []

  return (
    <Block title={`Student Submissions · ${list.length} of ${totalStudents}`}>
      {submissions.isLoading ? (
        <Skeleton className='h-20' />
      ) : list.length === 0 ? (
        <div className='rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground'>
          No students have submitted homework yet.
        </div>
      ) : (
        <ul className='grid gap-2'>
          {list.map((sub) => (
            <li
              key={sub.id}
              className='grid gap-2 rounded-lg border p-3 bg-card shadow-2xs'
            >
              <div className='flex flex-wrap items-center justify-between gap-2'>
                <div className='flex items-center gap-2.5 min-w-0'>
                  <Avatar name={sub.student_name} size='sm' />
                  <span className='grid min-w-0'>
                    <span className='font-semibold truncate'>{sub.student_name}</span>
                    <span className='text-xs text-muted-foreground'>
                      {sub.class_section ?? 'Class'} · {formatDateTime(sub.submitted_at)}
                    </span>
                  </span>
                </div>
                <div className='flex items-center gap-1.5'>
                  {sub.is_late && <Badge tone='danger'>Late</Badge>}
                  {sub.status === 'graded' ? (
                    <Badge tone='success' dot>
                      {sub.grade ? `Grade ${sub.grade}` : sub.marks ? `${sub.marks}/${sub.max_marks ?? 10}` : 'Graded'}
                    </Badge>
                  ) : sub.status === 'resubmit_requested' ? (
                    <Badge tone='warning' dot>
                      Resubmit Requested
                    </Badge>
                  ) : (
                    <Badge tone='info' dot>
                      Submitted
                    </Badge>
                  )}
                  <Button
                    type='button'
                    variant='outline'
                    size='sm'
                    onClick={() => setEvaluating(sub)}
                  >
                    {sub.status === 'graded' ? 'Edit Grade' : 'Grade'}
                  </Button>
                </div>
              </div>

              {sub.student_notes && (
                <p className='text-xs text-muted-foreground italic bg-muted/40 p-2 rounded'>
                  "{sub.student_notes}"
                </p>
              )}

              {sub.attachments.length > 0 && (
                <div className='flex flex-wrap gap-2 pt-1'>
                  {sub.attachments.map((file) => (
                    <a
                      key={file.id}
                      href={file.url}
                      target='_blank'
                      rel='noreferrer'
                      className='inline-flex items-center gap-1.5 rounded-md border bg-muted/50 px-2 py-1 text-xs font-medium text-primary hover:bg-muted'
                    >
                      <Paperclip className='size-3' />
                      {file.name}
                    </a>
                  ))}
                </div>
              )}

              {sub.teacher_feedback && (
                <div className='text-xs border-l-2 border-primary pl-2 text-foreground font-medium'>
                  Teacher note: {sub.teacher_feedback}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
      {evaluating && (
        <GradeModal
          submission={evaluating}
          entryId={entryId}
          onClose={() => setEvaluating(null)}
        />
      )}
    </Block>
  )
}

function GradeModal({
  submission,
  entryId,
  onClose,
}: {
  submission: DiarySubmission
  entryId: number
  onClose: () => void
}) {
  const [grade, setGrade] = useState(submission.grade ?? 'A')
  const [marks, setMarks] = useState(submission.marks ? String(submission.marks) : '')
  const [maxMarks, setMaxMarks] = useState(submission.max_marks ? String(submission.max_marks) : '10')
  const [status, setStatus] = useState<'graded' | 'resubmit_requested'>(
    submission.status === 'resubmit_requested' ? 'resubmit_requested' : 'graded',
  )
  const [feedback, setFeedback] = useState(submission.teacher_feedback ?? '')
  const gradeMutation = useGradeSubmission(entryId)

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await gradeMutation.mutateAsync({
        submissionId: submission.id,
        data: {
          status,
          grade: grade.trim() || null,
          marks: marks ? Number(marks) : null,
          max_marks: maxMarks ? Number(maxMarks) : null,
          teacher_feedback: feedback.trim() || null,
        },
      })
      alerts.success('Submission graded successfully')
      onClose()
    } catch (err) {
      alerts.error(toApiError(err).message)
    }
  }

  return (
    <AppModal
      open
      onOpenChange={(open) => !open && onClose()}
      title={`Evaluate ${submission.student_name}'s Homework`}
      description='Assign letter grade or score with teacher feedback.'
    >
      <form onSubmit={handleSave} className='grid gap-4 py-2'>
        <div className='grid grid-cols-2 gap-3'>
          <FormField id='grade-letter' label='Letter Grade'>
            <Input
              id='grade-letter'
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
              placeholder='e.g. A+, A, B'
              className='w-full'
            />
          </FormField>
          <FormField id='grade-marks' label='Marks (Score)'>
            <div className='flex items-center gap-1.5'>
              <Input
                id='grade-marks'
                type='number'
                step='0.5'
                value={marks}
                onChange={(e) => setMarks(e.target.value)}
                placeholder='Score'
                className='w-full'
              />
              <span className='text-muted-foreground'>/</span>
              <Input
                type='number'
                value={maxMarks}
                onChange={(e) => setMaxMarks(e.target.value)}
                placeholder='10'
                className='w-16'
              />
            </div>
          </FormField>
        </div>

        <FormField id='grade-status' label='Status Decision'>
          <div className='flex gap-2'>
            <Button
              type='button'
              size='sm'
              variant={status === 'graded' ? 'default' : 'outline'}
              onClick={() => setStatus('graded')}
            >
              Approved & Graded
            </Button>
            <Button
              type='button'
              size='sm'
              variant={status === 'resubmit_requested' ? 'destructive' : 'outline'}
              onClick={() => setStatus('resubmit_requested')}
            >
              Request Resubmission
            </Button>
          </div>
        </FormField>

        <FormField id='grade-feedback' label='Teacher Feedback & Notes'>
          <Textarea
            id='grade-feedback'
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder='Add remarks for student and parent...'
            rows={3}
          />
        </FormField>

        <div className='flex justify-end gap-2 pt-2'>
          <Button type='button' variant='outline' onClick={onClose}>
            Cancel
          </Button>
          <Button type='submit' loading={gradeMutation.isPending}>
            Save Grade
          </Button>
        </div>
      </form>
    </AppModal>
  )
}
