import { useState, type ChangeEvent } from 'react'
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  BookOpen,
  User,
  Camera,
  Mic,
  ShieldAlert,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge, type BadgeTone } from '@/components/ui/badge'
import { alerts } from '@/lib/alerts'
import { toApiError } from '@/lib/api/errors'
import { formatDate } from '@/lib/format'
import { quizzesApi, useQuiz, useQuizActionMutation } from '../api'

const QUESTION_TYPE_LABEL: Record<string, string> = {
  single_choice: 'Single choice',
  multiple_choice: 'Multiple choice',
  true_false: 'Yes / No',
}

interface QuizReviewModalProps {
  quizId: number | null
  onClose: () => void
  onApproved?: () => void
}

export function QuizReviewModal({ quizId, onClose, onApproved }: QuizReviewModalProps) {
  const { data: quiz, isLoading } = useQuiz(quizId)
  const [rejecting, setRejecting] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')
  const [prevQuizId, setPrevQuizId] = useState(quizId)

  if (quizId !== prevQuizId) {
    setPrevQuizId(quizId)
    setRejecting(false)
    setRejectionReason('')
  }

  const approveMutation = useQuizActionMutation(() => quizzesApi.approve(quizId!))
  const rejectMutation = useQuizActionMutation((reason: string) =>
    quizzesApi.reject(quizId!, reason)
  )

  if (!quizId) return null

  const handleClose = () => {
    setRejecting(false)
    setRejectionReason('')
    onClose()
  }

  const handleApprove = async () => {
    try {
      await approveMutation.mutateAsync()
      alerts.success('Quiz approved successfully. Parents and students have been notified.')
      onApproved?.()
      handleClose()
    } catch (err) {
      alerts.error(toApiError(err).message)
    }
  }

  const handleReject = async () => {
    if (rejectionReason.trim().length < 3) {
      alerts.error('Please enter a reason for rejection (at least 3 characters)')
      return
    }
    try {
      await rejectMutation.mutateAsync(rejectionReason.trim())
      alerts.success('Quiz returned with rejection notes.')
      handleClose()
    } catch (err) {
      alerts.error(toApiError(err).message)
    }
  }

  const statusTone: BadgeTone =
    quiz?.status === 'approved'
      ? 'success'
      : quiz?.status === 'pending_approval'
        ? 'warning'
        : quiz?.status === 'rejected'
          ? 'danger'
          : 'neutral'

  return (
    <Dialog open={Boolean(quizId)} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className='flex max-h-[90vh] max-w-3xl flex-col p-0'>
        <DialogHeader className='border-b p-6 pb-2'>
          <div className='flex items-center justify-between'>
            <DialogTitle className='text-xl font-bold'>Review Online Quiz</DialogTitle>
            {quiz && <Badge tone={statusTone}>{quiz.status.replace('_', ' ').toUpperCase()}</Badge>}
          </div>
          <DialogDescription>
            Verify quiz details, schedule, and question bank before publishing to students.
          </DialogDescription>
        </DialogHeader>

        <div className='flex-1 space-y-6 overflow-y-auto p-6'>
          {isLoading || !quiz ? (
            <div className='py-12 text-center text-muted-foreground'>Loading quiz details...</div>
          ) : (
            <>
              {/* Quiz Summary Info */}
              <div className='grid grid-cols-2 gap-4 rounded-lg bg-muted/40 p-4 text-sm sm:grid-cols-4'>
                <div>
                  <span className='block text-xs text-muted-foreground'>Subject & Class</span>
                  <span className='font-semibold'>
                    {quiz.subject?.name ?? '—'}
                    {quiz.class
                      ? ` (${quiz.class.name}${quiz.section ? ` - ${quiz.section.name}` : ''})`
                      : ''}
                  </span>
                </div>
                <div>
                  <span className='block text-xs text-muted-foreground'>Created By</span>
                  <span className='flex items-center gap-1 font-semibold'>
                    <User className='h-3.5 w-3.5' />
                    {quiz.teacher?.name ?? '—'}
                  </span>
                </div>
                <div>
                  <span className='block text-xs text-muted-foreground'>Duration</span>
                  <span className='flex items-center gap-1 font-semibold'>
                    <Clock className='h-3.5 w-3.5' />
                    {quiz.duration_minutes} mins
                  </span>
                </div>
                <div>
                  <span className='block text-xs text-muted-foreground'>Total Marks</span>
                  <span className='font-semibold'>
                    {quiz.total_marks} Marks ({quiz.questions?.length ?? 0} Questions)
                  </span>
                </div>
                <div className='col-span-2'>
                  <span className='block text-xs text-muted-foreground'>Available Window</span>
                  <span className='text-xs font-medium'>
                    {formatDate(quiz.start_at)} — {formatDate(quiz.end_at)}
                  </span>
                </div>
                <div className='col-span-2'>
                  <span className='block text-xs text-muted-foreground'>Passing Cutoff</span>
                  <span className='text-xs font-medium'>
                    {quiz.pass_percentage === null
                      ? 'No pass mark set: students see only their score'
                      : `${quiz.pass_marks} marks (${quiz.pass_percentage}%) minimum to pass`}
                  </span>
                </div>
              </div>

              {quiz.instructions && (
                <div className='space-y-1 rounded-md border border-amber-200 bg-amber-50 p-3 text-xs dark:border-amber-800 dark:bg-amber-950/20'>
                  <div className='font-semibold text-amber-900 dark:text-amber-200'>
                    Instructions for Students:
                  </div>
                  <div className='whitespace-pre-wrap text-amber-800 dark:text-amber-300'>
                    {quiz.instructions}
                  </div>
                </div>
              )}

              <div className='space-y-2 rounded-md border bg-slate-50 p-3 text-xs dark:bg-slate-900'>
                <div className='flex items-center gap-1.5 font-semibold text-foreground'>
                  <ShieldAlert className='h-3.5 w-3.5 text-primary' />
                  Proctoring & Anti-Cheat Rules:
                </div>
                <div className='flex flex-wrap items-center gap-4'>
                  <span
                    className={`inline-flex items-center gap-1 rounded px-2 py-0.5 font-medium ${quiz.require_camera ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300' : 'bg-muted text-muted-foreground line-through'}`}
                  >
                    <Camera className='h-3 w-3' /> Camera Monitoring{' '}
                    {quiz.require_camera ? '(Active)' : '(Disabled)'}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 rounded px-2 py-0.5 font-medium ${quiz.require_microphone ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300' : 'bg-muted text-muted-foreground line-through'}`}
                  >
                    <Mic className='h-3 w-3' /> Voice Monitoring{' '}
                    {quiz.require_microphone ? '(Active)' : '(Disabled)'}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 rounded px-2 py-0.5 font-medium ${quiz.expire_on_exit ? 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300' : 'bg-muted text-muted-foreground line-through'}`}
                  >
                    <ShieldAlert className='h-3 w-3' /> Expire on Exit{' '}
                    {quiz.expire_on_exit ? '(Strict Disqualification)' : '(Permissive)'}
                  </span>
                </div>
              </div>

              {quiz.rejection_reason && (
                <div className='space-y-1 rounded-md border border-destructive/20 bg-destructive/10 p-3 text-xs'>
                  <div className='font-semibold text-destructive'>Previous Rejection Notes:</div>
                  <div className='text-destructive/90'>{quiz.rejection_reason}</div>
                </div>
              )}

              {/* Questions List */}
              <div className='space-y-4'>
                <h3 className='flex items-center gap-2 text-sm font-semibold'>
                  <BookOpen className='h-4 w-4' />
                  Question Bank ({quiz.questions?.length || 0} Questions)
                </h3>

                <div className='space-y-4'>
                  {quiz.questions?.map((q, idx) => (
                    <div key={q.id || idx} className='space-y-3 rounded-lg border bg-card p-4'>
                      <div className='flex items-start justify-between gap-2'>
                        <span className='text-sm leading-relaxed font-medium'>
                          <span className='mr-1 font-bold text-muted-foreground'>Q{idx + 1}.</span>
                          {q.question_text}
                        </span>
                        <div className='flex shrink-0 items-center gap-1.5'>
                          <Badge tone='info' className='text-xs'>
                            {QUESTION_TYPE_LABEL[q.question_type] ?? 'Single choice'}
                          </Badge>
                          <Badge tone='neutral' className='text-xs'>
                            {q.marks} {q.marks === 1 ? 'Mark' : 'Marks'}
                          </Badge>
                        </div>
                      </div>

                      {/* Options */}
                      <div className='grid grid-cols-1 gap-2 pt-1 sm:grid-cols-2'>
                        {q.options?.map((opt) => {
                          const isCorrect = q.correct_option.split(',').includes(opt.key)
                          return (
                            <div
                              key={opt.key}
                              className={`flex items-center gap-2 rounded-md border p-2.5 text-xs ${
                                isCorrect
                                  ? 'border-emerald-500 bg-emerald-50 font-semibold text-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200'
                                  : 'border-muted bg-muted/30'
                              }`}
                            >
                              <span
                                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                                  isCorrect
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-muted text-muted-foreground'
                                }`}
                              >
                                {opt.key}
                              </span>
                              <span className='flex-1'>{opt.text}</span>
                              {isCorrect && (
                                <CheckCircle2 className='h-4 w-4 shrink-0 text-emerald-600' />
                              )}
                            </div>
                          )
                        })}
                      </div>

                      {q.explanation && (
                        <div className='flex items-start gap-1.5 border-t pt-2 text-xs text-muted-foreground'>
                          <AlertCircle className='mt-0.5 h-3.5 w-3.5 shrink-0 text-blue-500' />
                          <span>
                            <strong>Explanation:</strong> {q.explanation}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Rejection Form Input */}
              {rejecting && (
                <div className='space-y-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4'>
                  <label
                    htmlFor='rejectReason'
                    className='block text-sm font-semibold text-destructive'
                  >
                    Reason for Rejection / Changes Required
                  </label>
                  <textarea
                    id='rejectReason'
                    placeholder='Explain what the teacher needs to fix or modify (e.g. Question 3 options are ambiguous, extend duration, etc.)...'
                    value={rejectionReason}
                    onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                      setRejectionReason(e.target.value)
                    }
                    rows={3}
                    maxLength={500}
                    className='w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none'
                  />
                  <div className='flex justify-end gap-2'>
                    <Button variant='outline' size='sm' onClick={() => setRejecting(false)}>
                      Cancel
                    </Button>
                    <Button
                      variant='destructive'
                      size='sm'
                      disabled={rejectMutation.isPending}
                      onClick={handleReject}
                    >
                      {rejectMutation.isPending ? 'Rejecting...' : 'Confirm Rejection'}
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <DialogFooter className='flex items-center justify-between border-t bg-muted/20 p-4'>
          <Button variant='outline' onClick={handleClose}>
            Close
          </Button>

          {quiz && quiz.status === 'pending_approval' && !rejecting && (
            <div className='flex gap-2'>
              <Button
                variant='destructive'
                size='sm'
                onClick={() => setRejecting(true)}
                disabled={approveMutation.isPending}
              >
                <XCircle className='mr-1.5 h-4 w-4' />
                Reject
              </Button>
              <Button
                size='sm'
                className='bg-emerald-600 text-white hover:bg-emerald-700'
                onClick={handleApprove}
                disabled={approveMutation.isPending}
              >
                <CheckCircle2 className='mr-1.5 h-4 w-4' />
                {approveMutation.isPending ? 'Approving...' : 'Approve & Notify Parents'}
              </Button>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
