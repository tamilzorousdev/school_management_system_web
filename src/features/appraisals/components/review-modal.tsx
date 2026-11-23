import { useState } from 'react'
import { Paperclip, Send } from 'lucide-react'
import { AppModal } from '@/components/common/app-modal'
import { Combobox } from '@/components/common/combobox'
import { ErrorState } from '@/components/common/display'
import { FormField } from '@/components/common/form-field'
import { SegmentedControl } from '@/components/common/segmented-control'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input, Textarea } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { alerts } from '@/lib/alerts'
import { toApiError } from '@/lib/api/errors'
import { formatDate, formatDateTime } from '@/lib/format'
import {
  appraisalsApi,
  useAppraisal,
  useAppraisalMutation,
  useDossier,
  type AppraisalDetail,
  type Recommendation,
  type Score,
} from '../api'
import { fieldMap, METRIC, pct, RATING, RECOMMENDATION, STAGE } from '../labels'

type Draft = { score: string; reason: string }

const proposed = (score: Score) => score.hod_score ?? (score.scoring_mode === 'auto' ? score.auto_score : null) ?? score.self_score

const show = (value: number | null, max: number) => (value === null ? '—' : `${value}/${max}`)

export function ReviewModal({
  id,
  canFinalize,
  onClose,
}: {
  id: number
  canFinalize: boolean
  onClose: () => void
}) {
  const appraisal = useAppraisal(id)
  return (
    <AppModal
      open
      onOpenChange={(open) => !open && onClose()}
      title={appraisal.data ? `${appraisal.data.staff.name} — ${appraisal.data.cycle.name}` : 'Appraisal'}
      description={
        appraisal.data
          ? `${appraisal.data.staff.designation}${appraisal.data.staff.department ? ` · ${appraisal.data.staff.department}` : ''} · ${appraisal.data.group.name}`
          : undefined
      }
      size='xl'
      footer={<span />}
    >
      {appraisal.isPending ? (
        <Skeleton className='h-80' />
      ) : appraisal.isError ? (
        <ErrorState message={appraisal.error.message} onRetry={() => void appraisal.refetch()} />
      ) : (
        <ReviewBody
          key={`${appraisal.data.id}-${appraisal.data.stage}-${appraisal.data.final_percent}`}
          appraisal={appraisal.data}
          canFinalize={canFinalize}
          onClose={onClose}
        />
      )}
    </AppModal>
  )
}

function ReviewBody({
  appraisal,
  canFinalize,
  onClose,
}: {
  appraisal: AppraisalDetail
  canFinalize: boolean
  onClose: () => void
}) {
  const editable = canFinalize && appraisal.stage === 'principal_pending'
  const [drafts, setDrafts] = useState<Record<number, Draft>>(() =>
    Object.fromEntries(
      appraisal.scores.map((score) => [
        score.kra_id ?? score.id,
        { score: score.final_score === null ? '' : String(score.final_score), reason: score.override_reason ?? '' },
      ]),
    ),
  )
  const [recommendation, setRecommendation] = useState<Recommendation | undefined>(appraisal.recommendation ?? undefined)
  const [increment, setIncrement] = useState(String(appraisal.increment_percent ?? appraisal.suggested_increment ?? ''))
  const [texts, setTexts] = useState({
    strengths: appraisal.strengths ?? '',
    improvements: appraisal.improvements ?? '',
    goals: appraisal.goals ?? '',
    principal_remarks: appraisal.principal_remarks ?? '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const save = useAppraisalMutation(appraisalsApi.saveFinal)
  const publish = useAppraisalMutation(appraisalsApi.publish)
  const busy = save.isPending || publish.isPending


  const input = () => ({
    id: appraisal.id,
    scores: appraisal.scores
      .filter((score) => score.kra_id !== null && drafts[score.kra_id]?.score !== '')
      .map((score) => ({
        kra_id: score.kra_id!,
        score: Number(drafts[score.kra_id!]!.score),
        override_reason: drafts[score.kra_id!]!.reason.trim() || null,
      })),
    recommendation,
    increment_percent: increment === '' ? null : Number(increment),
    strengths: texts.strengths.trim() || null,
    improvements: texts.improvements.trim() || null,
    goals: texts.goals.trim() || null,
    principal_remarks: texts.principal_remarks.trim() || null,
  })

  const run = async (andPublish: boolean) => {
    try {
      const saved = await save.mutateAsync(input())
      if (andPublish) {
        const done = await publish.mutateAsync(appraisal.id)
        alerts.success(done.message)
        onClose()
      } else {
        alerts.success(saved.message)
      }
      setErrors({})
    } catch (error) {
      const apiError = toApiError(error)
      setErrors(fieldMap(apiError.fieldErrors))
      alerts.error(apiError.message)
    }
  }

  return (
    <div className='grid gap-5'>
      <div className='flex flex-wrap items-center gap-2 text-sm'>
        <Badge tone={STAGE[appraisal.stage].tone} dot>
          {STAGE[appraisal.stage].label}
        </Badge>
        {appraisal.self_missed && <Badge tone='danger'>Self-appraisal missed</Badge>}
        <span className='text-muted-foreground'>
          Self {pct(appraisal.self_percent)} · HOD {appraisal.hod ? pct(appraisal.hod_percent) : 'none'} · Final{' '}
          {pct(appraisal.final_percent)}
        </span>
        {appraisal.rating && <Badge tone={RATING[appraisal.rating].tone}>{RATING[appraisal.rating].label}</Badge>}
      </div>

      <div className='overflow-x-auto rounded-lg border'>
        <table className='w-full min-w-[760px] text-sm'>
          <thead className='bg-muted/50 text-left text-xs text-muted-foreground'>
            <tr>
              <th className='px-3 py-2'>KRA</th>
              <th className='px-3 py-2'>School data</th>
              <th className='px-3 py-2'>Self</th>
              <th className='px-3 py-2'>HOD</th>
              <th className='px-3 py-2'>Final</th>
            </tr>
          </thead>
          <tbody className='divide-y'>
            {appraisal.scores.map((score) => {
              const key = score.kra_id ?? score.id
              const draft = drafts[key] ?? { score: '', reason: '' }
              const suggestion = proposed(score)
              const changed = draft.score !== '' && suggestion !== null && Number(draft.score) !== suggestion
              return (
                <tr key={score.id} className='align-top'>
                  <td className='px-3 py-2'>
                    <span className='grid'>
                      <span className='font-medium'>{score.title}</span>
                      <span className='text-xs text-muted-foreground'>
                        {score.weightage_percent}% · out of {score.max_score}
                      </span>
                    </span>
                  </td>
                  <td className='px-3 py-2 tabular'>
                    {score.auto_metric ? (
                      <span className='grid'>
                        <span>{show(score.auto_score, score.max_score)}</span>
                        <span className='text-xs text-muted-foreground'>
                          {METRIC[score.auto_metric].label}: {score.auto_value ?? 'no data'}
                        </span>
                      </span>
                    ) : (
                      <span className='text-muted-foreground'>—</span>
                    )}
                  </td>
                  <td className='px-3 py-2'>
                    <span className='grid'>
                      <span className='tabular'>{show(score.self_score, score.max_score)}</span>
                      {score.self_comment && <span className='text-xs text-muted-foreground'>{score.self_comment}</span>}
                    </span>
                  </td>
                  <td className='px-3 py-2'>
                    <span className='grid'>
                      <span className='tabular'>{show(score.hod_score, score.max_score)}</span>
                      {score.hod_comment && <span className='text-xs text-muted-foreground'>{score.hod_comment}</span>}
                    </span>
                  </td>
                  <td className='px-3 py-2'>
                    {editable && score.kra_id !== null ? (
                      <div className='grid gap-1'>
                        <Input
                          type='number'
                          min={1}
                          max={score.max_score}
                          step='0.5'
                          className='w-24'
                          aria-label={`Final score for ${score.title}`}
                          placeholder={suggestion === null ? '' : String(suggestion)}
                          value={draft.score}
                          aria-invalid={Boolean(errors[`scores.${score.kra_id}`])}
                          onChange={(event) =>
                            setDrafts((current) => ({ ...current, [key]: { ...draft, score: event.target.value } }))
                          }
                        />
                        {changed && (
                          <Input
                            aria-label={`Why ${score.title} changed`}
                            placeholder='Why it changed'
                            value={draft.reason}
                            onChange={(event) =>
                              setDrafts((current) => ({ ...current, [key]: { ...draft, reason: event.target.value } }))
                            }
                          />
                        )}
                        {errors[`scores.${score.kra_id}`] && (
                          <span className='text-xs text-destructive'>{errors[`scores.${score.kra_id}`]}</span>
                        )}
                      </div>
                    ) : (
                      <span className='grid'>
                        <span className='tabular font-medium'>{show(score.final_score, score.max_score)}</span>
                        {score.override_reason && (
                          <span className='text-xs text-muted-foreground'>{score.override_reason}</span>
                        )}
                      </span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {(appraisal.expected_increment_percent !== null || appraisal.hike_justification || appraisal.hod_remarks) && (
        <div className='grid gap-1 rounded-lg border bg-muted/30 p-3 text-sm'>
          {appraisal.expected_increment_percent !== null && (
            <span>
              Asked for <b>{appraisal.expected_increment_percent}%</b>
              {appraisal.hike_justification ? ` — ${appraisal.hike_justification}` : ''}
            </span>
          )}
          {appraisal.hod_remarks && (
            <span>
              HOD ({appraisal.hod?.name}): {appraisal.hod_remarks}
            </span>
          )}
        </div>
      )}

      {editable ? (
        <div className='grid gap-4 sm:grid-cols-2'>
          <FormField id='final-recommendation' label='Recommendation'>
            <Combobox
              id='final-recommendation'
              label='Recommendation'
              placeholder='From the rating'
              value={recommendation}
              options={(Object.keys(RECOMMENDATION) as Recommendation[]).map((value) => ({
                value,
                label: RECOMMENDATION[value],
              }))}
              onChange={(value) => setRecommendation(value as Recommendation | undefined)}
              className='sm:w-full'
            />
          </FormField>
          <FormField
            id='final-increment'
            label='Increment %'
            hint={appraisal.suggested_increment !== null ? `Suggested ${appraisal.suggested_increment}%` : 'Suggested from the rating when you save'}
          >
            <Input
              id='final-increment'
              type='number'
              min={0}
              max={100}
              step='0.5'
              value={increment}
              onChange={(event) => setIncrement(event.target.value)}
            />
          </FormField>
          {(['strengths', 'improvements', 'goals', 'principal_remarks'] as const).map((field) => (
            <FormField
              key={field}
              id={`final-${field}`}
              label={
                { strengths: 'Strengths', improvements: 'To improve', goals: 'Goals for next year', principal_remarks: 'Remarks' }[field]
              }
            >
              <Textarea
                id={`final-${field}`}
                rows={2}
                value={texts[field]}
                onChange={(event) => setTexts((current) => ({ ...current, [field]: event.target.value }))}
              />
            </FormField>
          ))}
          <div className='flex flex-wrap justify-end gap-2 sm:col-span-2'>
            <Button variant='outline' disabled={busy} onClick={() => void run(false)}>
              Save
            </Button>
            <Button disabled={busy} onClick={() => void run(true)}>
              <Send />
              Save & publish
            </Button>
          </div>
        </div>
      ) : (
        <div className='grid gap-2 text-sm sm:grid-cols-2'>
          {appraisal.recommendation && (
            <span>
              Recommendation: <b>{RECOMMENDATION[appraisal.recommendation]}</b>
            </span>
          )}
          {appraisal.increment_percent !== null && (
            <span>
              Increment: <b>{appraisal.increment_percent}%</b>
            </span>
          )}
          {appraisal.strengths && <span>Strengths: {appraisal.strengths}</span>}
          {appraisal.improvements && <span>To improve: {appraisal.improvements}</span>}
          {appraisal.goals && <span>Goals: {appraisal.goals}</span>}
          {appraisal.principal_remarks && <span>Remarks: {appraisal.principal_remarks}</span>}
          {appraisal.staff_remarks && <span>Staff: {appraisal.staff_remarks}</span>}
          {appraisal.published_at && <span className='text-muted-foreground'>Published {formatDateTime(appraisal.published_at)}</span>}
        </div>
      )}

      {appraisal.evidence.length > 0 && (
        <div className='grid gap-1 text-sm'>
          <span className='font-semibold'>Evidence</span>
          {appraisal.evidence.map((file) => (
            <a
              key={file.id}
              href={file.url ?? undefined}
              target='_blank'
              rel='noreferrer'
              className='flex items-center gap-1 text-primary hover:underline'
            >
              <Paperclip className='size-3.5' />
              {file.name}
            </a>
          ))}
        </div>
      )}

      {appraisal.appeals.length > 0 && (
        <div className='grid gap-2 text-sm'>
          <span className='font-semibold'>Appeals</span>
          {appraisal.appeals.map((appeal) => (
            <div key={appeal.id} className='rounded-lg border p-3'>
              <Badge tone={appeal.status === 'pending' ? 'danger' : appeal.status === 'accepted' ? 'success' : 'neutral'}>
                {appeal.status}
              </Badge>{' '}
              {appeal.reason}
              {appeal.decision_note && <span className='block text-xs text-muted-foreground'>Decision: {appeal.decision_note}</span>}
            </div>
          ))}
        </div>
      )}

      <Dossier staffId={appraisal.staff.staff_id} yearId={appraisal.academic_year_id} />
    </div>
  )
}

type DossierTab = 'attendance' | 'classes' | 'homework' | 'ratings'

function Dossier({ staffId, yearId }: { staffId: number; yearId: number }) {
  const dossier = useDossier(staffId, yearId)
  const [tab, setTab] = useState<DossierTab>('classes')
  if (dossier.isPending) return <Skeleton className='h-24' />
  if (dossier.isError) return null
  const data = dossier.data
  return (
    <section className='grid gap-3 rounded-lg border p-3'>
      <div className='flex flex-wrap items-center justify-between gap-2'>
        <span className='text-sm font-semibold'>School data this year</span>
        <SegmentedControl
          label='School data'
          value={tab}
          onChange={(value: DossierTab) => setTab(value)}
          options={[
            { value: 'classes', label: 'Classes' },
            { value: 'attendance', label: 'Attendance' },
            { value: 'homework', label: 'Homework' },
            { value: 'ratings', label: 'Ratings' },
          ]}
        />
      </div>
      {tab === 'classes' && (
        <div className='grid gap-1 text-sm'>
          <span className='text-muted-foreground'>
            {data.workload.periods_per_week} periods a week · {data.workload.sections} sections · pass{' '}
            {pct(data.metrics.exam_pass_percent)}
          </span>
          {data.workload.classes.map((row) => (
            <span key={`${row.section_id}-${row.subject}`} className='flex justify-between gap-2'>
              <span>
                {row.section} · {row.subject}
              </span>
              <span className='tabular text-muted-foreground'>
                {row.papers ? `pass ${pct(row.pass_percent)} · avg ${pct(row.average_percent)}` : 'no marks yet'}
              </span>
            </span>
          ))}
          {!data.workload.classes.length && <span className='text-muted-foreground'>No classes this year.</span>}
        </div>
      )}
      {tab === 'attendance' && (
        <span className='text-sm'>
          {pct(data.metrics.attendance_percent)} — {data.attendance.present} present, {data.attendance.late} late,{' '}
          {data.attendance.half_day} half days, {data.attendance.absent} absent of {data.attendance.marked_days} marked days
        </span>
      )}
      {tab === 'homework' && (
        <div className='grid gap-1 text-sm'>
          <span>{data.homework.count} homework posts this year</span>
          {data.homework.recent.map((item) => (
            <span key={item.id} className='text-muted-foreground'>
              {formatDate(item.published_at)} · {item.title}
              {item.section ? ` · ${item.section}` : ''}
            </span>
          ))}
        </div>
      )}
      {tab === 'ratings' && (
        <span className='text-sm'>
          Parents: {data.ratings.parent_average ?? '—'}★ from {data.ratings.parent_count} ratings, behaviour good{' '}
          {pct(data.ratings.good_behaviour_percent)}
          {data.driver.count > 0 && ` · as driver ${data.driver.average}★ from ${data.driver.count}`}
        </span>
      )}
    </section>
  )
}
