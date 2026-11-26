import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { ArrowRight, Check, UserPlus, X } from 'lucide-react'
import { AppModal } from '@/components/common/app-modal'
import { FormField } from '@/components/common/form-field'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DialogFooter } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/input'
import { alerts } from '@/lib/alerts'
import { toApiError } from '@/lib/api/errors'
import { formatDateTime } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useApproveSubmission, useRejectSubmission, type Submission } from '../api'
import {
  fieldLabel,
  fieldValue,
  PAYLOAD_ORDER,
  SUBMISSION_STATUS,
  SUBMISSION_TYPE,
} from '../labels'
import { RootError } from './form-parts'

export function SubmissionReviewModal({
  submission,
  onOpenChange,
  canManage,
}: {
  submission: Submission | null
  onOpenChange: (open: boolean) => void
  canManage: boolean
}) {
  const approve = useApproveSubmission()
  const reject = useRejectSubmission()
  const busy = approve.isPending || reject.isPending
  const [shown, setShown] = useState(submission)
  if (submission && submission !== shown) setShown(submission)

  return (
    <AppModal
      open={Boolean(submission)}
      onOpenChange={onOpenChange}
      title={shown?.type === 'update' ? 'Review details update' : 'Review alumni registration'}
      description={shown ? `From ${shown.name}` : undefined}
      size='lg'
      loading={busy}
      footer={<></>}
    >
      {submission && (
        <Review
          key={submission.id}
          submission={submission}
          canManage={canManage}
          busy={busy}
          onClose={() => onOpenChange(false)}
          onApprove={async (alumniId) => {
            await approve.mutateAsync({ id: submission.id, alumni_id: alumniId })
            alerts.success(
              submission.type === 'update'
                ? 'Changes applied'
                : alumniId
                  ? 'Details merged into the existing record'
                  : 'Alumni record created'
            )
            onOpenChange(false)
          }}
          onReject={async (note) => {
            await reject.mutateAsync({ id: submission.id, note })
            alerts.success('Submission rejected')
            onOpenChange(false)
          }}
        />
      )}
    </AppModal>
  )
}

function Review({
  submission,
  canManage,
  busy,
  onClose,
  onApprove,
  onReject,
}: {
  submission: Submission
  canManage: boolean
  busy: boolean
  onClose: () => void
  onApprove: (alumniId: number | null) => Promise<void>
  onReject: (note: string) => Promise<void>
}) {
  const [target, setTarget] = useState<number | null>(null)
  const [rejecting, setRejecting] = useState(false)
  const [note, setNote] = useState('')
  const [noteError, setNoteError] = useState<string>()
  const [rootError, setRootError] = useState<string>()
  const pending = submission.status === 'pending'
  const actionable = pending && canManage

  const attempt = async (action: () => Promise<void>) => {
    setRootError(undefined)
    try {
      await action()
    } catch (error) {
      const apiError = toApiError(error)
      const field = apiError.fieldError('note')
      if (field) setNoteError(field)
      else setRootError(apiError.message)
    }
  }

  const payloadKeys = [
    ...PAYLOAD_ORDER.filter((key) => key in submission.payload),
    ...Object.keys(submission.payload).filter((key) => !PAYLOAD_ORDER.includes(key)),
  ]
  const changes = submission.changes ? Object.entries(submission.changes) : null

  return (
    <div className='grid gap-4'>
      <div className='flex flex-wrap items-center gap-1.5'>
        <Badge tone={SUBMISSION_TYPE[submission.type].tone}>
          {SUBMISSION_TYPE[submission.type].label}
        </Badge>
        <Badge tone={SUBMISSION_STATUS[submission.status].tone} dot>
          {SUBMISSION_STATUS[submission.status].label}
        </Badge>
        <span className='text-xs text-muted-foreground'>
          Sent {formatDateTime(submission.created_at)}
        </span>
        {submission.alumni_id && submission.alumni_no && (
          <Link
            to='/alumni/$id'
            params={{ id: String(submission.alumni_id) }}
            className='text-xs font-semibold text-primary hover:underline'
          >
            {submission.alumni_no}
          </Link>
        )}
      </div>

      <RootError message={rootError} />

      {submission.type === 'update' && changes ? (
        <section className='grid gap-2'>
          <h3 className='text-xs font-bold tracking-wider text-muted-foreground uppercase'>
            What would change
          </h3>
          {changes.length === 0 ? (
            <p className='rounded-lg border border-dashed p-3 text-sm text-muted-foreground'>
              The record already has these details.
            </p>
          ) : (
            <ul className='grid overflow-hidden rounded-lg border'>
              {changes.map(([field, [before, after]]) => (
                <li
                  key={field}
                  className='grid gap-1 border-b px-3 py-2.5 text-sm last:border-0 sm:grid-cols-[10rem_1fr] sm:items-center'
                >
                  <span className='text-xs font-bold text-muted-foreground'>
                    {fieldLabel(field)}
                  </span>
                  <span className='flex flex-wrap items-center gap-1.5 break-all'>
                    <span className='text-muted-foreground line-through'>
                      {fieldValue(field, before)}
                    </span>
                    <ArrowRight className='size-3.5 shrink-0 text-muted-foreground' />
                    <span className='font-semibold'>{fieldValue(field, after)}</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : (
        <section className='grid gap-2'>
          <h3 className='text-xs font-bold tracking-wider text-muted-foreground uppercase'>
            Submitted details
          </h3>
          <dl className='grid gap-x-6 gap-y-3 rounded-lg border p-3 sm:grid-cols-2'>
            {payloadKeys.map((key) => (
              <div key={key} className='grid gap-0.5'>
                <dt className='text-[11px] font-bold tracking-wider text-muted-foreground uppercase'>
                  {fieldLabel(key)}
                </dt>
                <dd className='text-sm font-semibold break-words'>
                  {fieldValue(key, submission.payload[key])}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      {submission.type === 'registration' && actionable && (
        <section className='grid gap-2'>
          <h3 className='text-xs font-bold tracking-wider text-muted-foreground uppercase'>
            On approval
          </h3>
          {submission.possible_matches.length > 0 && (
            <p className='text-xs text-muted-foreground'>
              These records have the same mobile, or the same first name and batch. Merge if it is
              the same person.
            </p>
          )}
          <div className='grid gap-2' role='radiogroup' aria-label='What to do on approval'>
            <Choice
              selected={target === null}
              onSelect={() => setTarget(null)}
              title='Create a new alumni record'
              hint='A new alumni number is given.'
            />
            {submission.possible_matches.map((match) => (
              <Choice
                key={match.id}
                selected={target === match.id}
                onSelect={() => setTarget(match.id)}
                title={`Merge into ${match.full_name}`}
                hint={[match.alumni_no, `Batch ${match.batch_year}`, match.mobile]
                  .filter(Boolean)
                  .join(' · ')}
              />
            ))}
          </div>
        </section>
      )}

      {!pending && (
        <section className='grid gap-1 rounded-lg border bg-muted/40 p-3 text-sm'>
          <span className='font-semibold'>
            {SUBMISSION_STATUS[submission.status].label}
            {submission.reviewed_by_name ? ` by ${submission.reviewed_by_name}` : ''}
            {submission.reviewed_at ? ` · ${formatDateTime(submission.reviewed_at)}` : ''}
          </span>
          {submission.review_note && (
            <span className='text-muted-foreground'>{submission.review_note}</span>
          )}
        </section>
      )}

      {actionable && rejecting && (
        <FormField
          id='reject-note'
          label='Reason for rejecting'
          required
          error={noteError}
          hint='Kept with the submission.'
        >
          <Textarea
            id='reject-note'
            rows={2}
            maxLength={255}
            autoFocus
            value={note}
            placeholder='Could not verify this person studied here'
            onChange={(event) => {
              setNote(event.target.value)
              setNoteError(undefined)
            }}
          />
        </FormField>
      )}

      <DialogFooter>
        {!actionable ? (
          <Button onClick={onClose}>Close</Button>
        ) : rejecting ? (
          <>
            <Button variant='outline' disabled={busy} onClick={() => setRejecting(false)}>
              Back
            </Button>
            <Button
              variant='outline'
              className='border-[#FDA29B] text-[#D92D20] bg-white hover:bg-rose-50 font-medium'
              loading={busy}
              onClick={() => {
                if (note.trim().length < 3) {
                  setNoteError('Give a reason of at least 3 characters')
                  return
                }
                void attempt(() => onReject(note.trim()))
              }}
            >
              <X className='size-4 stroke-[1.75]' />
              Reject
            </Button>
          </>
        ) : (
          <>
            <Button
              variant='outline'
              className='border-[#FDA29B] text-[#D92D20] bg-white hover:bg-rose-50 font-medium'
              disabled={busy}
              onClick={() => setRejecting(true)}
            >
              <X className='size-4 stroke-[1.75]' />
              Reject
            </Button>
            <Button
              className='bg-[#127D48] text-white hover:bg-[#0E6339] font-medium'
              loading={busy}
              onClick={() => void attempt(() => onApprove(target))}
            >
              {target === null && submission.type === 'registration' ? (
                <UserPlus className='size-4 stroke-[1.75]' />
              ) : (
                <Check className='size-4 stroke-[1.75]' />
              )}
              {submission.type === 'update'
                ? 'Approve changes'
                : target === null
                  ? 'Approve and create'
                  : 'Approve and merge'}
            </Button>
          </>
        )}
      </DialogFooter>
    </div>
  )
}

function Choice({
  selected,
  onSelect,
  title,
  hint,
}: {
  selected: boolean
  onSelect: () => void
  title: string
  hint: string
}) {
  return (
    <button
      type='button'
      role='radio'
      aria-checked={selected}
      onClick={onSelect}
      className={cn(
        'flex items-start gap-3 rounded-lg border p-3 text-left transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40',
        selected ? 'border-primary/60 bg-primary/5' : 'hover:bg-muted/60'
      )}
    >
      <span
        className={cn(
          'mt-0.5 grid size-4 shrink-0 place-items-center rounded-full border',
          selected ? 'border-primary' : 'border-input'
        )}
      >
        {selected && <span className='size-2 rounded-full bg-primary' />}
      </span>
      <span className='grid min-w-0 gap-0.5'>
        <span className='text-sm font-semibold'>{title}</span>
        <span className='text-xs text-muted-foreground'>{hint}</span>
      </span>
    </button>
  )
}
