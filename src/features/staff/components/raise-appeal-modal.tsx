import { useState } from 'react'
import { HelpCircle, Send } from 'lucide-react'
import { AppModal } from '@/components/common/app-modal'
import { FormField } from '@/components/common/form-field'
import { Button } from '@/components/ui/button'
import { Input, Textarea } from '@/components/ui/input'
import { alerts } from '@/lib/alerts'
import { appraisalsApi, type StaffAppraisal } from '../api'

export function RaiseAppealModal({
  item,
  open,
  onClose,
  onAppealed,
}: {
  item: StaffAppraisal | null
  open: boolean
  onClose: () => void
  onAppealed: () => void
}) {
  const [reason, setReason] = useState('')
  const [requestedHike, setRequestedHike] = useState<number>(15)
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!item) return null

  const handleSubmit = async () => {
    if (!reason.trim()) {
      alerts.error('Please enter justification for your appraisal appeal.')
      return
    }

    try {
      setIsSubmitting(true)
      await appraisalsApi.appeal(item.id, {
        reason: reason.trim(),
        requested_hike: Number(requestedHike),
      })
      alerts.success('Appeal submitted to School Admin & Principal', {
        description: 'Management will review your performance justification and respond with feedback.',
      })
      onAppealed()
    } catch (err: unknown) {
      alerts.error(err instanceof Error ? err.message : 'Failed to submit appeal')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AppModal
      open={open}
      onOpenChange={(op) => !op && onClose()}
      title='Raise Performance Appraisal Appeal / Hike Review'
      description={`${item.period} · Current Approved Increment: ${item.increment_percent}%`}
      size='md'
    >
      <div className='flex flex-col gap-4 text-xs max-h-[75vh] overflow-y-auto pr-1'>
        <div className='rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs text-muted-foreground space-y-1.5'>
          <div className='flex items-center gap-1.5 font-semibold text-primary'>
            <HelpCircle className='h-4 w-4' />
            <span>How does the review appeal work?</span>
          </div>
          <p className='leading-relaxed'>
            If you believe your evaluation score or salary increment does not reflect your extra contributions (such as board exam pass percentages, remedial coaching, or institutional initiatives), you can submit this appeal for management re-evaluation.
          </p>
        </div>

        <FormField
          id='appeal-requested-hike'
          label='Requested Salary Increment %'
          hint={`Currently approved: ${item.increment_percent}%. What increment percentage are you requesting?`}
          required
        >
          <div className='relative'>
            <Input
              id='appeal-requested-hike'
              type='number'
              min={0}
              max={100}
              step={0.5}
              value={requestedHike}
              onChange={(e) => setRequestedHike(Number(e.target.value))}
              className='pr-8 text-sm font-bold'
            />
            <span className='absolute right-2.5 top-2 text-muted-foreground font-semibold'>%</span>
          </div>
        </FormField>

        <FormField
          id='appeal-justification'
          label='Detailed Justification & Achievements'
          hint='Mention specific classes taught, exam outcomes, special projects, or extra hours contributed.'
          required
        >
          <Textarea
            id='appeal-justification'
            rows={4}
            placeholder='e.g. Under my guidance, Grade 10 Mathematics achieved 100% pass results with 14 distinctions. Also spearheaded the Annual Science & Robotics Exhibition.'
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </FormField>

        <div className='flex items-center justify-end gap-2 border-t border-border pt-3'>
          <Button variant='outline' size='sm' onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant='default'
            size='sm'
            onClick={() => void handleSubmit()}
            disabled={isSubmitting}
          >
            <Send className='mr-1.5 h-3.5 w-3.5' />
            {isSubmitting ? 'Submitting…' : 'Submit Appeal to Management'}
          </Button>
        </div>
      </div>
    </AppModal>
  )
}
