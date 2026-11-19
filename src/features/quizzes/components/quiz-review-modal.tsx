import { useState, type ChangeEvent } from 'react'
import { CheckCircle2, XCircle, AlertCircle, Clock, BookOpen, User } from 'lucide-react'
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
import {
  quizzesApi,
  useQuiz,
  useQuizActionMutation,
} from '../api'

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
    if (!rejectionReason.trim()) {
      alerts.error('Please enter a reason for rejection')
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
      <DialogContent className='max-w-3xl max-h-[90vh] flex flex-col p-0'>
        <DialogHeader className='p-6 pb-2 border-b'>
          <div className='flex items-center justify-between'>
            <DialogTitle className='text-xl font-bold'>Review Online Quiz</DialogTitle>
            {quiz && (
              <Badge tone={statusTone}>
                {quiz.status.replace('_', ' ').toUpperCase()}
              </Badge>
            )}
          </div>
          <DialogDescription>
            Verify quiz details, schedule, and question bank before publishing to students.
          </DialogDescription>
        </DialogHeader>

        <div className='flex-1 overflow-y-auto p-6 space-y-6'>
          {isLoading || !quiz ? (
            <div className='py-12 text-center text-muted-foreground'>Loading quiz details...</div>
          ) : (
            <>
              {/* Quiz Summary Info */}
              <div className='grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-lg bg-muted/40 text-sm'>
                <div>
                  <span className='text-xs text-muted-foreground block'>Subject & Class</span>
                  <span className='font-semibold'>
                    {quiz.subject?.name} ({quiz.class?.name} - {quiz.section?.name})
                  </span>
                </div>
                <div>
                  <span className='text-xs text-muted-foreground block'>Created By</span>
                  <span className='font-semibold flex items-center gap-1'>
                    <User className='h-3.5 w-3.5' />
                    {quiz.teacher ? `${quiz.teacher.first_name} ${quiz.teacher.last_name}` : 'Teacher'}
                  </span>
                </div>
                <div>
                  <span className='text-xs text-muted-foreground block'>Duration</span>
                  <span className='font-semibold flex items-center gap-1'>
                    <Clock className='h-3.5 w-3.5' />
                    {quiz.duration_minutes} mins
                  </span>
                </div>
                <div>
                  <span className='text-xs text-muted-foreground block'>Total Marks</span>
                  <span className='font-semibold'>
                    {quiz.total_marks} Marks ({quiz.questions?.length ?? 0} Questions)
                  </span>
                </div>
                <div className='col-span-2'>
                  <span className='text-xs text-muted-foreground block'>Available Window</span>
                  <span className='font-medium text-xs'>
                    {formatDate(quiz.start_at)} — {formatDate(quiz.end_at)}
                  </span>
                </div>
                <div className='col-span-2'>
                  <span className='text-xs text-muted-foreground block'>Passing Cutoff</span>
                  <span className='font-medium text-xs'>{quiz.pass_percentage}% minimum to pass</span>
                </div>
              </div>

              {quiz.instructions && (
                <div className='p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-md text-xs space-y-1'>
                  <div className='font-semibold text-amber-900 dark:text-amber-200'>Instructions for Students:</div>
                  <div className='text-amber-800 dark:text-amber-300 whitespace-pre-wrap'>{quiz.instructions}</div>
                </div>
              )}

              {quiz.rejection_reason && (
                <div className='p-3 bg-destructive/10 border border-destructive/20 rounded-md text-xs space-y-1'>
                  <div className='font-semibold text-destructive'>Previous Rejection Notes:</div>
                  <div className='text-destructive/90'>{quiz.rejection_reason}</div>
                </div>
              )}

              {/* Questions List */}
              <div className='space-y-4'>
                <h3 className='font-semibold text-sm flex items-center gap-2'>
                  <BookOpen className='h-4 w-4' />
                  Question Bank ({quiz.questions?.length || 0} MCQs)
                </h3>

                <div className='space-y-4'>
                  {quiz.questions?.map((q, idx) => (
                    <div
                      key={q.id || idx}
                      className='p-4 border rounded-lg bg-card space-y-3'
                    >
                      <div className='flex items-start justify-between gap-2'>
                        <span className='font-medium text-sm leading-relaxed'>
                          <span className='font-bold text-muted-foreground mr-1'>Q{idx + 1}.</span>
                          {q.question_text}
                        </span>
                        <Badge tone='neutral' className='shrink-0 text-xs'>
                          {q.marks} {q.marks === 1 ? 'Mark' : 'Marks'}
                        </Badge>
                      </div>

                      {/* Options */}
                      <div className='grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1'>
                        {q.options?.map((opt) => {
                          const isCorrect = opt.key === q.correct_option
                          return (
                            <div
                              key={opt.key}
                              className={`p-2.5 rounded-md border text-xs flex items-center gap-2 ${
                                isCorrect
                                  ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-500 font-semibold text-emerald-900 dark:text-emerald-200'
                                  : 'bg-muted/30 border-muted'
                              }`}
                            >
                              <span
                                className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                                  isCorrect
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-muted text-muted-foreground'
                                }`}
                              >
                                {opt.key}
                              </span>
                              <span className='flex-1'>{opt.text}</span>
                              {isCorrect && <CheckCircle2 className='h-4 w-4 text-emerald-600 shrink-0' />}
                            </div>
                          )
                        })}
                      </div>

                      {q.explanation && (
                        <div className='pt-2 border-t text-xs text-muted-foreground flex items-start gap-1.5'>
                          <AlertCircle className='h-3.5 w-3.5 text-blue-500 shrink-0 mt-0.5' />
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
                <div className='p-4 border border-destructive/30 rounded-lg bg-destructive/5 space-y-3'>
                  <label htmlFor='rejectReason' className='block text-sm font-semibold text-destructive'>
                    Reason for Rejection / Changes Required
                  </label>
                  <textarea
                    id='rejectReason'
                    placeholder='Explain what the teacher needs to fix or modify (e.g. Question 3 options are ambiguous, extend duration, etc.)...'
                    value={rejectionReason}
                    onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setRejectionReason(e.target.value)}
                    rows={3}
                    className='w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
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

        <DialogFooter className='p-4 border-t bg-muted/20 flex items-center justify-between'>
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
                <XCircle className='h-4 w-4 mr-1.5' />
                Reject
              </Button>
              <Button
                size='sm'
                className='bg-emerald-600 hover:bg-emerald-700 text-white'
                onClick={handleApprove}
                disabled={approveMutation.isPending}
              >
                <CheckCircle2 className='h-4 w-4 mr-1.5' />
                {approveMutation.isPending ? 'Approving...' : 'Approve & Notify Parents'}
              </Button>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
