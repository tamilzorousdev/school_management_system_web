import { useState } from 'react'
import { Award, BarChart3, CheckCircle2, Percent, Users } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { useQuizAnalytics, type QuizAttendance, type QuizStudentResult } from '../api'

interface QuizAnalyticsModalProps {
  quizId: number | null
  onClose: () => void
}

type Filter = 'all' | QuizAttendance

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'attended', label: 'Attended' },
  { value: 'not_attended', label: 'Not attended' },
]

function StudentRow({ student, total }: { student: QuizStudentResult; total: number }) {
  return (
    <div className='flex items-center justify-between gap-3 rounded-md border bg-card px-3 py-2'>
      <div className='min-w-0'>
        <div className='truncate text-sm font-medium'>{student.full_name}</div>
        {student.roll_number !== null && (
          <div className='text-[11px] text-muted-foreground'>Roll no. {student.roll_number}</div>
        )}
      </div>
      {student.attendance === 'attended' ? (
        <div className='flex shrink-0 items-center gap-2'>
          <span className='text-sm font-semibold'>
            {student.score} / {total}
          </span>
          {student.passed !== null && (
            <Badge tone={student.passed ? 'success' : 'danger'}>
              {student.passed ? 'Pass' : 'Fail'}
            </Badge>
          )}
        </div>
      ) : student.attendance === 'in_progress' ? (
        <Badge tone='warning'>In progress</Badge>
      ) : (
        <Badge tone='danger'>Not attended</Badge>
      )}
    </div>
  )
}

export function QuizAnalyticsModal({ quizId, onClose }: QuizAnalyticsModalProps) {
  const { data: analytics, isLoading } = useQuizAnalytics(quizId)
  const [filter, setFilter] = useState<Filter>('all')

  if (!quizId) return null

  const students = (analytics?.students ?? []).filter(
    (student) => filter === 'all' || student.attendance === filter
  )
  const summary = analytics?.summary

  return (
    <Dialog open={Boolean(quizId)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className='flex max-h-[90vh] max-w-3xl flex-col p-0'>
        <DialogHeader className='border-b p-6 pb-2'>
          <div className='flex items-center gap-2'>
            <BarChart3 className='h-5 w-5 text-primary' />
            <DialogTitle className='text-xl font-bold'>Quiz Results & Analytics</DialogTitle>
          </div>
          <DialogDescription>
            {analytics
              ? `${analytics.quiz.title} · ${analytics.quiz.subject ?? ''} · Class ${analytics.quiz.class_section}`
              : 'Attendance, scores and question difficulty'}
          </DialogDescription>
        </DialogHeader>

        <div className='flex-1 space-y-6 overflow-y-auto p-6'>
          {isLoading || !analytics || !summary ? (
            <div className='py-12 text-center text-muted-foreground'>Loading quiz analytics...</div>
          ) : (
            <>
              <div className='grid grid-cols-2 gap-4 sm:grid-cols-4'>
                <div className='rounded-lg border bg-card p-4'>
                  <span className='flex items-center gap-1 text-xs text-muted-foreground'>
                    <Users className='h-3.5 w-3.5' />
                    Attended
                  </span>
                  <div className='mt-1 text-2xl font-bold'>
                    {summary.attended_count}
                    <span className='ml-1 text-xs font-normal text-muted-foreground'>
                      / {summary.total_enrolled}
                    </span>
                  </div>
                  <span className='text-[11px] text-muted-foreground'>
                    {summary.not_attended_count} not attended
                    {summary.in_progress_count > 0
                      ? ` · ${summary.in_progress_count} in progress`
                      : ''}
                  </span>
                </div>

                <div className='rounded-lg border bg-card p-4'>
                  <span className='flex items-center gap-1 text-xs text-muted-foreground'>
                    <Award className='h-3.5 w-3.5' />
                    Average Score
                  </span>
                  <div className='mt-1 text-2xl font-bold text-primary'>
                    {summary.average_score.toFixed(1)}
                  </div>
                  <span className='text-[11px] text-muted-foreground'>
                    Highest {summary.highest_score} of {analytics.quiz.total_marks}
                  </span>
                </div>

                <div className='rounded-lg border bg-card p-4'>
                  <span className='flex items-center gap-1 text-xs text-muted-foreground'>
                    <Percent className='h-3.5 w-3.5' />
                    Pass Rate
                  </span>
                  <div className='mt-1 text-2xl font-bold text-emerald-600'>
                    {summary.pass_percent === null ? '—' : `${summary.pass_percent}%`}
                  </div>
                  <span className='text-[11px] text-muted-foreground'>
                    {analytics.quiz.pass_marks === null
                      ? 'No pass mark set'
                      : `Pass mark ${analytics.quiz.pass_marks}`}
                  </span>
                </div>

                <div className='rounded-lg border bg-card p-4'>
                  <span className='flex items-center gap-1 text-xs text-muted-foreground'>
                    <CheckCircle2 className='h-3.5 w-3.5' />
                    Participation
                  </span>
                  <div className='mt-1 text-2xl font-bold'>
                    {summary.total_enrolled > 0
                      ? `${Math.round((summary.attended_count / summary.total_enrolled) * 100)}%`
                      : '0%'}
                  </div>
                  <span className='text-[11px] text-muted-foreground'>of the class attended</span>
                </div>
              </div>

              <div className='space-y-3'>
                <div className='flex flex-wrap items-center justify-between gap-2'>
                  <h3 className='text-sm font-semibold'>
                    Students in Class {analytics.quiz.class_section}
                  </h3>
                  <div className='flex gap-1'>
                    {FILTERS.map((item) => (
                      <Button
                        key={item.value}
                        size='sm'
                        variant={filter === item.value ? 'default' : 'outline'}
                        className='h-7 px-2.5 text-xs'
                        onClick={() => setFilter(item.value)}
                      >
                        {item.label}
                      </Button>
                    ))}
                  </div>
                </div>
                {students.length === 0 ? (
                  <div className='rounded-lg border p-6 text-center text-sm text-muted-foreground'>
                    No students in this list.
                  </div>
                ) : (
                  <div className='space-y-2'>
                    {students.map((student) => (
                      <StudentRow
                        key={student.student_id}
                        student={student}
                        total={analytics.quiz.total_marks}
                      />
                    ))}
                  </div>
                )}
              </div>

              <div className='space-y-4'>
                <h3 className='text-sm font-semibold'>Question Difficulty & Accuracy</h3>
                {analytics.questions.length === 0 ? (
                  <div className='rounded-lg border p-6 text-center text-sm text-muted-foreground'>
                    No questions in this quiz.
                  </div>
                ) : (
                  <div className='space-y-3'>
                    {analytics.questions.map((q) => {
                      const rate = q.accuracy_percent
                      const isTough = rate < 50
                      return (
                        <div
                          key={q.question_id}
                          className='space-y-2 rounded-lg border bg-card p-3'
                        >
                          <div className='flex items-start justify-between gap-4'>
                            <span className='flex-1 text-xs leading-relaxed font-medium'>
                              <span className='mr-1 font-bold'>Q{q.sequence}.</span>
                              {q.question_text}
                            </span>
                            <div className='shrink-0 text-right'>
                              <span
                                className={`text-xs font-bold ${
                                  isTough ? 'text-amber-600' : 'text-emerald-600'
                                }`}
                              >
                                {rate}% Correct
                              </span>
                              <span className='block text-[10px] text-muted-foreground'>
                                {q.correct_count} of {q.total_answers} answers
                              </span>
                            </div>
                          </div>
                          <div
                            role='progressbar'
                            aria-valuenow={rate}
                            aria-valuemin={0}
                            aria-valuemax={100}
                            className='h-2 w-full overflow-hidden rounded-full bg-muted'
                          >
                            <div
                              className={cn(
                                'h-full rounded-full transition-all',
                                isTough ? 'bg-amber-500' : 'bg-emerald-500'
                              )}
                              style={{ width: `${Math.min(Math.max(rate, 0), 100)}%` }}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        <DialogFooter className='border-t bg-muted/20 p-4'>
          <Button variant='outline' onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
