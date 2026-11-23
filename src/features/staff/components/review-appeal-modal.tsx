import { useState } from 'react'
import {
  AlertCircle,
  CheckCircle2,
  Sparkles,
} from 'lucide-react'
import { AppModal } from '@/components/common/app-modal'
import { FormField } from '@/components/common/form-field'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input, Textarea } from '@/components/ui/input'
import { alerts } from '@/lib/alerts'
import { appraisalsApi, type StaffAppraisal } from '../api'
import { APPRAISAL_RATING_LABELS } from '../labels'
import type { OverallRating } from '../search'

export function ReviewAppealModal({
  item,
  onClose,
  onResolved,
}: {
  item: StaffAppraisal | null
  onClose: () => void
  onResolved: () => void
}) {
  const [decision, setDecision] = useState<'accept' | 'reject'>('accept')
  const [revisedHike, setRevisedHike] = useState<number>(
    item?.appeal_requested_hike ?? (item?.increment_percent ?? 10)
  )
  const [revisedRating, setRevisedRating] = useState<OverallRating>(
    item?.overall_rating ?? 'exceeds_expectations'
  )
  const [feedback, setFeedback] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!item) return null

  const handleResolve = async () => {
    if (!feedback.trim()) {
      alerts.error('Please enter management feedback/remarks explaining this decision.')
      return
    }

    try {
      setIsSubmitting(true)
      await appraisalsApi.resolveAppeal(item.id, {
        decision,
        revised_rating: decision === 'accept' ? revisedRating : undefined,
        revised_hike: decision === 'accept' ? Number(revisedHike) : undefined,
        feedback: feedback.trim(),
      })

      alerts.success(
        decision === 'accept'
          ? `Appeal accepted. Revised hike set to ${revisedHike}%.`
          : 'Appeal review completed with management feedback.',
        {
          description: `${item.staff.name}'s appraisal is finalized and updated in payroll records.`,
        }
      )
      onResolved()
    } catch (err: unknown) {
      alerts.error(err instanceof Error ? err.message : 'Failed to resolve appeal')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AppModal
      open={Boolean(item)}
      onOpenChange={(op) => !op && onClose()}
      title={`Review Teacher Appraisal Appeal — ${item.staff.name}`}
      description={`${item.period} · Emp ID: ${item.employee_no || 'N/A'} · Designation: ${item.designation}`}
      size='lg'
    >
      <div className='flex flex-col gap-4 text-xs max-h-[75vh] overflow-y-auto pr-1'>
        {/* Appeal Summary Banner */}
        <div className='rounded-lg border border-amber-500/30 bg-amber-500/10 p-3.5 space-y-2'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-1.5 font-semibold text-amber-700 dark:text-amber-300 text-sm'>
              <AlertCircle className='h-4 w-4' />
              <span>Teacher Appraisal Appeal & Dispute</span>
            </div>
            <Badge tone='danger' className='text-xs px-2.5 py-0.5 font-bold'>
              Requested: {item.appeal_requested_hike !== null ? `${item.appeal_requested_hike}% Hike` : 'Review Requested'}
            </Badge>
          </div>

          <div className='bg-card/70 rounded p-2.5 border border-border/50 text-xs space-y-1'>
            <span className='font-semibold text-foreground block'>Teacher's Justification:</span>
            <p className='text-muted-foreground leading-relaxed italic'>
              "{item.appeal_reason || 'No justification text provided by teacher.'}"
            </p>
          </div>

          <div className='flex items-center justify-between text-[11px] text-muted-foreground pt-1'>
            <span>
              Initial Evaluation: <strong>{item.overall_score.toFixed(1)} / 5.0</strong> (
              {APPRAISAL_RATING_LABELS[item.overall_rating]?.label ?? item.overall_rating})
            </span>
            <span>
              Originally Approved Hike: <strong>{item.increment_percent}%</strong>
            </span>
          </div>
        </div>

        {/* Management Decision Selector */}
        <div className='rounded-lg border border-border p-3 space-y-3'>
          <h4 className='font-semibold text-foreground flex items-center gap-1.5'>
            <Sparkles className='h-3.5 w-3.5 text-primary' />
            Management Decision & Hike Revision
          </h4>

          <div className='grid grid-cols-2 gap-3'>
            <button
              type='button'
              onClick={() => setDecision('accept')}
              className={`flex flex-col items-center justify-center gap-1 p-3 rounded-lg border text-xs font-semibold transition-all ${
                decision === 'accept'
                  ? 'border-emerald-500 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 ring-2 ring-emerald-500/20'
                  : 'border-border bg-card text-muted-foreground hover:bg-muted/50'
              }`}
            >
              <CheckCircle2 className='h-5 w-5 text-emerald-600' />
              <span>Accept Appeal & Revise Hike</span>
              <span className='text-[10px] font-normal text-muted-foreground'>
                Approve higher hike percentage
              </span>
            </button>

            <button
              type='button'
              onClick={() => setDecision('reject')}
              className={`flex flex-col items-center justify-center gap-1 p-3 rounded-lg border text-xs font-semibold transition-all ${
                decision === 'reject'
                  ? 'border-amber-500 bg-amber-500/10 text-amber-800 dark:text-amber-300 ring-2 ring-amber-500/20'
                  : 'border-border bg-card text-muted-foreground hover:bg-muted/50'
              }`}
            >
              <AlertCircle className='h-5 w-5 text-amber-600' />
              <span>Maintain Current Rating & Hike</span>
              <span className='text-[10px] font-normal text-muted-foreground'>
                Provide formal feedback explaining decision
              </span>
            </button>
          </div>

          {decision === 'accept' && (
            <div className='grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-border/50'>
              <FormField
                id='revised-hike'
                label='Revised Approved Salary Hike %'
                hint={`Teacher asked for ${item.appeal_requested_hike ?? 15}%. Previous: ${item.increment_percent}%`}
                required
              >
                <div className='relative'>
                  <Input
                    id='revised-hike'
                    type='number'
                    min={0}
                    max={100}
                    step={0.5}
                    value={revisedHike}
                    onChange={(e) => setRevisedHike(Number(e.target.value))}
                    className='pr-8 text-sm font-bold'
                  />
                  <span className='absolute right-2.5 top-2 text-muted-foreground font-semibold'>
                    %
                  </span>
                </div>
              </FormField>

              <FormField id='revised-rating' label='Revised Performance Rating Tier'>
                <select
                  id='revised-rating'
                  className='w-full rounded-md border border-input bg-background px-3 py-2 text-xs font-medium'
                  value={revisedRating}
                  onChange={(e) => setRevisedRating(e.target.value as OverallRating)}
                >
                  <option value='outstanding'>Outstanding (4.6+)</option>
                  <option value='exceeds_expectations'>Exceeds Expectations (3.8 - 4.5)</option>
                  <option value='meets_expectations'>Meets Expectations (3.0 - 3.7)</option>
                  <option value='needs_improvement'>Needs Improvement (2.0 - 2.9)</option>
                  <option value='unsatisfactory'>Unsatisfactory (&lt; 2.0)</option>
                </select>
              </FormField>
            </div>
          )}

          <div className='pt-1'>
            <FormField
              id='appeal-feedback'
              label='Official Management Feedback & Notes to Teacher'
              hint='This will appear on the teacher mobile scorecard and explain the appeal decision.'
              required
            >
              <Textarea
                id='appeal-feedback'
                rows={3}
                placeholder='e.g. Validated student board exam pass rate and remedial classes. Performance recognized and increment adjusted.'
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
              />
            </FormField>
          </div>
        </div>

        {/* Footer actions */}
        <div className='flex items-center justify-between border-t border-border pt-3'>
          <span className='text-[11px] text-muted-foreground'>
            Resolving will finalize appraisal and sync revised salary to Payroll records.
          </span>
          <div className='flex items-center gap-2'>
            <Button variant='outline' size='sm' onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant='default'
              size='sm'
              className='bg-primary text-primary-foreground'
              onClick={() => void handleResolve()}
              disabled={isSubmitting}
            >
              <CheckCircle2 className='mr-1.5 h-3.5 w-3.5' />
              {isSubmitting ? 'Resolving…' : 'Finalize & Update Payroll'}
            </Button>
          </div>
        </div>
      </div>
    </AppModal>
  )
}
