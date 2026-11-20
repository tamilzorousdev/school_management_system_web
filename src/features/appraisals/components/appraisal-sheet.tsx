import { useState, type ReactNode } from 'react'
import { Award, CheckCheck, MessageSquareQuote, Pencil } from 'lucide-react'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import { ErrorState } from '@/components/common/display'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { useAcademicYears } from '@/features/setup/api'
import { alerts } from '@/lib/alerts'
import { toApiError } from '@/lib/api/errors'
import { formatDate, formatDateTime } from '@/lib/format'
import { appraisalsApi, useAppraisal, useAppraisalAction, type StaffAppraisal } from '../api'
import { APPRAISAL_STATUS, CRITERIA, OVERALL_RATING, RECOMMENDATION, scoreText } from '../labels'

export function AppraisalSheet({
  appraisalId,
  canManage,
  onEdit,
  onClose,
}: {
  appraisalId: number | null
  canManage: boolean
  onEdit: (appraisal: StaffAppraisal) => void
  onClose: () => void
}) {
  const [shownId, setShownId] = useState(appraisalId)
  if (appraisalId && appraisalId !== shownId) setShownId(appraisalId)
  const query = useAppraisal(shownId)
  const data = query.data
  const years = useAcademicYears()
  const [confirming, setConfirming] = useState(false)
  const finalize = useAppraisalAction((id: number) => appraisalsApi.finalize(id))

  const onFinalize = async (id: number) => {
    try {
      await finalize.mutateAsync(id)
      alerts.success('Appraisal finalized and published to the Staff app')
      setConfirming(false)
    } catch (error) {
      alerts.error(toApiError(error).message)
    }
  }

  const yearName = (id: number) => years.data?.find((year) => year.id === id)?.name ?? `#${id}`

  return (
    <Sheet open={Boolean(appraisalId)} onOpenChange={(open) => !open && onClose()}>
      <SheetContent aria-describedby={undefined} className='sm:max-w-2xl'>
        {query.isError && !data ? (
          <ErrorState message={query.error.message} onRetry={() => query.refetch()} />
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
                  <Award className='size-5' />
                </span>
                <div className='grid min-w-0 gap-0.5'>
                  <SheetTitle className='break-words'>{data.staff.name}</SheetTitle>
                  <SheetDescription>
                    {[data.employee_no, data.designation, data.department]
                      .filter(Boolean)
                      .join(' · ')}
                  </SheetDescription>
                  <div className='mt-1 flex flex-wrap gap-1.5'>
                    <Badge tone={APPRAISAL_STATUS[data.status].tone} dot>
                      {APPRAISAL_STATUS[data.status].label}
                    </Badge>
                    <Badge tone={OVERALL_RATING[data.overall_rating].tone}>
                      {OVERALL_RATING[data.overall_rating].label}
                    </Badge>
                  </div>
                </div>
              </div>
            </SheetHeader>
            <SheetBody className='grid content-start gap-6'>
              {canManage && data.status !== 'finalized' && (
                <div className='flex flex-wrap gap-2 rounded-lg border bg-muted/30 p-3'>
                  <Button size='sm' onClick={() => setConfirming(true)}>
                    <CheckCheck />
                    Finalize and publish
                  </Button>
                  <Button size='sm' variant='outline' onClick={() => onEdit(data)}>
                    <Pencil />
                    Edit
                  </Button>
                </div>
              )}

              <Block title='Scores'>
                <div className='grid gap-3 rounded-lg border p-3'>
                  {CRITERIA.map((item) => (
                    <ScoreRow key={item.key} label={item.label} value={data[item.key]} />
                  ))}
                  <div className='flex items-center justify-between gap-3 border-t pt-3'>
                    <span className='text-sm font-semibold'>Overall</span>
                    <span className='tabular text-xl font-bold'>
                      {scoreText(data.overall_score)}
                      <span className='text-sm font-normal text-muted-foreground'> / 5</span>
                    </span>
                  </div>
                </div>
              </Block>

              <Block title='Details'>
                <dl className='grid gap-x-6 gap-y-3 rounded-lg border p-3 sm:grid-cols-2'>
                  {[
                    ['Period', data.period],
                    ['Academic year', yearName(data.academic_year_id)],
                    ['Review date', formatDate(data.review_date)],
                    ['Reviewer', data.reviewer.name],
                    ['Recommendation', RECOMMENDATION[data.recommendation]],
                    ['Increment', `${data.increment_percent}%`],
                    ['Finalized', data.finalized_at ? formatDateTime(data.finalized_at) : '—'],
                    ['Created', formatDateTime(data.created_at)],
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

              <TextBlock title='Strengths' value={data.strengths} />
              <TextBlock title='Areas for improvement' value={data.areas_for_improvement} />
              <TextBlock title='Goals for next period' value={data.goals_next_period} />
              <TextBlock title='Reviewer remarks' value={data.reviewer_remarks} />

              <Block title='Teacher comment'>
                {data.staff_remarks ? (
                  <div className='flex gap-3 rounded-lg border border-info/30 bg-info/5 p-3'>
                    <MessageSquareQuote className='mt-0.5 size-4 shrink-0 text-info' />
                    <p className='text-sm whitespace-pre-line'>{data.staff_remarks}</p>
                  </div>
                ) : (
                  <p className='rounded-lg border border-dashed p-3 text-sm text-muted-foreground'>
                    {data.status === 'finalized'
                      ? 'The teacher has not commented yet. They can reply from the Staff app.'
                      : 'The teacher can comment in the Staff app once this appraisal is finalized.'}
                  </p>
                )}
              </Block>
            </SheetBody>

            <ConfirmDialog
              open={confirming}
              onOpenChange={setConfirming}
              title='Finalize this appraisal?'
              description={`${data.staff.name} sees it in the Staff app and can comment. It cannot be edited afterwards.`}
              confirmText='Finalize'
              loading={finalize.isPending}
              onConfirm={() => void onFinalize(data.id)}
            />
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}

function ScoreRow({ label, value }: { label: string; value: number }) {
  return (
    <div className='grid gap-1'>
      <div className='flex items-center justify-between gap-3 text-sm'>
        <span>{label}</span>
        <span className='tabular font-semibold'>{scoreText(value)}</span>
      </div>
      <span
        className='flex h-1.5 overflow-hidden rounded-full bg-muted'
        role='img'
        aria-label={`${label}: ${scoreText(value)} of 5`}
      >
        <span className='bg-primary' style={{ width: `${(value / 5) * 100}%` }} />
      </span>
    </div>
  )
}

function TextBlock({ title, value }: { title: string; value: string | null }) {
  if (!value) return null
  return (
    <Block title={title}>
      <p className='rounded-lg border bg-muted/40 p-3 text-sm whitespace-pre-line'>{value}</p>
    </Block>
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
