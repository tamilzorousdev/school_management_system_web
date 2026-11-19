import { BarChart3, Users, Award, Percent, CheckCircle2 } from 'lucide-react'
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
import { useQuizAnalytics } from '../api'

interface QuizAnalyticsModalProps {
  quizId: number | null
  onClose: () => void
}

export function QuizAnalyticsModal({ quizId, onClose }: QuizAnalyticsModalProps) {
  const { data: analytics, isLoading } = useQuizAnalytics(quizId)

  if (!quizId) return null

  return (
    <Dialog open={Boolean(quizId)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className='max-w-3xl max-h-[90vh] flex flex-col p-0'>
        <DialogHeader className='p-6 pb-2 border-b'>
          <div className='flex items-center gap-2'>
            <BarChart3 className='h-5 w-5 text-primary' />
            <DialogTitle className='text-xl font-bold'>Quiz Results & Analytics</DialogTitle>
          </div>
          <DialogDescription>
            {analytics ? analytics.title : 'Performance analytics and question difficulty insights'}
          </DialogDescription>
        </DialogHeader>

        <div className='flex-1 overflow-y-auto p-6 space-y-6'>
          {isLoading || !analytics ? (
            <div className='py-12 text-center text-muted-foreground'>Loading quiz analytics...</div>
          ) : (
            <>
              {/* Summary Metrics */}
              <div className='grid grid-cols-2 sm:grid-cols-4 gap-4'>
                <div className='p-4 rounded-lg border bg-card'>
                  <span className='text-xs text-muted-foreground block flex items-center gap-1'>
                    <Users className='h-3.5 w-3.5' />
                    Submissions
                  </span>
                  <div className='text-2xl font-bold mt-1'>
                    {analytics.total_submissions}
                    <span className='text-xs font-normal text-muted-foreground ml-1'>
                      / {analytics.total_students}
                    </span>
                  </div>
                  <span className='text-[11px] text-muted-foreground'>
                    {analytics.completed_count} completed · {analytics.expired_count} missed/expired
                  </span>
                </div>

                <div className='p-4 rounded-lg border bg-card'>
                  <span className='text-xs text-muted-foreground block flex items-center gap-1'>
                    <Award className='h-3.5 w-3.5' />
                    Average Score
                  </span>
                  <div className='text-2xl font-bold mt-1 text-primary'>
                    {analytics.average_score.toFixed(1)}
                  </div>
                  <span className='text-[11px] text-muted-foreground'>
                    High: {analytics.highest_score} · Low: {analytics.lowest_score}
                  </span>
                </div>

                <div className='p-4 rounded-lg border bg-card'>
                  <span className='text-xs text-muted-foreground block flex items-center gap-1'>
                    <Percent className='h-3.5 w-3.5' />
                    Pass Rate
                  </span>
                  <div className='text-2xl font-bold mt-1 text-emerald-600'>
                    {analytics.pass_percentage.toFixed(0)}%
                  </div>
                  <span className='text-[11px] text-muted-foreground'>
                    {analytics.pass_count} Passed · {analytics.fail_count} Failed
                  </span>
                </div>

                <div className='p-4 rounded-lg border bg-card'>
                  <span className='text-xs text-muted-foreground block flex items-center gap-1'>
                    <CheckCircle2 className='h-3.5 w-3.5' />
                    Completion Rate
                  </span>
                  <div className='text-2xl font-bold mt-1'>
                    {analytics.total_students > 0
                      ? `${Math.round((analytics.completed_count / analytics.total_students) * 100)}%`
                      : '0%'}
                  </div>
                  <span className='text-[11px] text-muted-foreground'>
                    of enrolled students participated
                  </span>
                </div>
              </div>

              {/* Question Accuracy Analysis */}
              <div className='space-y-4'>
                <h3 className='font-semibold text-sm'>Question Difficulty & Accuracy</h3>

                {analytics.question_stats.length === 0 ? (
                  <div className='p-6 text-center text-sm text-muted-foreground border rounded-lg'>
                    No attempts submitted yet for this quiz.
                  </div>
                ) : (
                  <div className='space-y-3'>
                    {analytics.question_stats.map((q, idx) => {
                      const rate = q.success_rate
                      const isTough = rate < 50
                      return (
                        <div key={q.question_id || idx} className='p-3 border rounded-lg space-y-2 bg-card'>
                          <div className='flex items-start justify-between gap-4'>
                            <span className='text-xs font-medium leading-relaxed flex-1'>
                              <span className='font-bold mr-1'>Q{idx + 1}.</span>
                              {q.question_text}
                            </span>
                            <div className='text-right shrink-0'>
                              <span
                                className={`text-xs font-bold ${
                                  isTough ? 'text-amber-600' : 'text-emerald-600'
                                }`}
                              >
                                {rate.toFixed(0)}% Correct
                              </span>
                              <span className='block text-[10px] text-muted-foreground'>
                                {q.correct_count} of {q.total_attempts} attempts
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

        <DialogFooter className='p-4 border-t bg-muted/20'>
          <Button variant='outline' onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
