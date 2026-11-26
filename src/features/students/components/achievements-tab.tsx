import { useState } from 'react'
import { EyeOff, FileText, Medal, Paperclip, PenLine, Plus, Trash, Trophy } from 'lucide-react'
import { AppModal } from '@/components/common/app-modal'
import { Combobox } from '@/components/common/combobox'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import { EmptyState, ErrorState } from '@/components/common/display'
import { FormField } from '@/components/common/form-field'
import { SegmentedControl } from '@/components/common/segmented-control'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { alerts } from '@/lib/alerts'
import { toApiError } from '@/lib/api/errors'
import { filesApi, openFile } from '@/lib/files'
import { formatDate } from '@/lib/format'
import {
  CATEGORY_LABELS,
  LEVEL_LABELS,
  LEVEL_TONE,
  optionsOf,
  PARTICIPATION_LABELS,
  RESULT_LABELS,
  RESULT_TONE,
  SCOPE_LABELS,
  VENUE_LABELS,
} from '../achievement-labels'
import { useStudentMutation } from '../api'
import {
  recordsApi,
  useAchievements,
  type Achievement,
  type AchievementCategory,
  type AchievementInput,
  type AchievementLevel,
  type AchievementResult,
  type EventScope,
  type Participation,
  type VenueType,
} from '../records-api'

const today = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })

export function AchievementsTab({
  studentId,
  canManage,
}: {
  studentId: number
  canManage: boolean
}) {
  const list = useAchievements(studentId)
  const [editing, setEditing] = useState<Achievement | 'new' | null>(null)
  const [removing, setRemoving] = useState<Achievement | null>(null)
  const remove = useStudentMutation((id: number) => recordsApi.removeAchievement(studentId, id))

  if (list.isError)
    return <ErrorState message={list.error.message} onRetry={() => list.refetch()} />
  if (!list.data) return <Skeleton className='h-60' />

  return (
    <div className='grid gap-3'>
      <div className='flex flex-wrap items-center justify-between gap-2'>
        <p className='text-sm text-muted-foreground'>
          Awards, competitions and certificates. Parents see them in the Parent app and get a
          notification.
        </p>
        {canManage && (
          <Button variant='primary' size='sm' onClick={() => setEditing('new')}>
            <Plus className='size-4 stroke-[1.75]' />
            Add achievement
          </Button>
        )}
      </div>
      {list.data.length === 0 ? (
        <EmptyState
          icon={Trophy}
          title='No achievements yet'
          description='Add prizes, competition results and certificates. Teachers can add them from the Staff app too.'
          className='border-dashed'
        />
      ) : (
        <ul className='grid gap-3 sm:grid-cols-2' aria-label='Achievements'>
          {list.data.map((item) => (
            <li key={item.id} className='flex gap-3 rounded-xl border p-3'>
              <span className='grid size-10 shrink-0 place-items-center rounded-full bg-warning/10 text-warning'>
                <Medal className='size-5' />
              </span>
              <div className='grid min-w-0 flex-1 gap-1'>
                <span className='font-semibold'>{item.title}</span>
                <div className='flex flex-wrap items-center gap-1.5'>
                  <Badge tone='info'>{CATEGORY_LABELS[item.category]}</Badge>
                  <Badge tone={LEVEL_TONE[item.level]}>{LEVEL_LABELS[item.level]} level</Badge>
                  <Badge tone={RESULT_TONE[item.result]}>{RESULT_LABELS[item.result]}</Badge>
                  <Badge tone='neutral'>{SCOPE_LABELS[item.event_scope]}</Badge>
                  {item.venue_type && <Badge tone='neutral'>{VENUE_LABELS[item.venue_type]}</Badge>}
                  {item.participation === 'team' && (
                    <Badge tone='neutral'>
                      {item.team_name ? `Team · ${item.team_name}` : 'Team'}
                    </Badge>
                  )}
                  {item.position && <Badge tone='warning'>{item.position}</Badge>}
                  <Badge tone='warning'>{item.points} pts</Badge>
                  {!item.visible_to_parent && (
                    <Badge tone='neutral'>
                      <EyeOff className='size-3' />
                      Staff only
                    </Badge>
                  )}
                </div>
                {(item.prize_received || item.school_reward) && (
                  <dl className='grid gap-0.5 text-sm'>
                    {item.prize_received && (
                      <div className='flex gap-1.5'>
                        <dt className='text-muted-foreground'>Prize won:</dt>
                        <dd className='font-medium'>{item.prize_received}</dd>
                      </div>
                    )}
                    {item.school_reward && (
                      <div className='flex gap-1.5'>
                        <dt className='text-muted-foreground'>From school:</dt>
                        <dd className='font-medium'>{item.school_reward}</dd>
                      </div>
                    )}
                  </dl>
                )}
                {item.description && <p className='text-sm'>{item.description}</p>}
                <div className='flex flex-wrap items-center justify-between gap-2'>
                  <span className='text-xs text-muted-foreground'>
                    {formatDate(item.achieved_on)}
                    {item.added_by ? ` · ${item.added_by.name}` : ''}
                  </span>
                  <span className='flex gap-1'>
                    {item.file && (
                      <Button
                        size='icon-sm'
                        variant='ghost'
                        aria-label={`Open certificate of ${item.title}`}
                        onClick={() =>
                          void openFile(`/files/${item.file!.id}/content`).catch((error: unknown) =>
                            alerts.error(toApiError(error).message)
                          )
                        }
                      >
                        <FileText />
                      </Button>
                    )}
                    {canManage && (
                      <>
                        <Button
                          size='icon-sm'
                          variant='ghost'
                          aria-label={`Edit ${item.title}`}
                          onClick={() => setEditing(item)}
                        >
                          <PenLine className='size-4 stroke-[1.75]' />
                        </Button>
                        <Button
                          size='icon-sm'
                          variant='ghost'
                          aria-label={`Delete ${item.title}`}
                          className='text-destructive hover:bg-destructive/10'
                          onClick={() => setRemoving(item)}
                        >
                          <Trash className='size-4 stroke-[1.75]' />
                        </Button>
                      </>
                    )}
                  </span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
      {editing && (
        <AchievementModal
          studentId={studentId}
          achievement={editing === 'new' ? undefined : editing}
          onClose={() => setEditing(null)}
        />
      )}
      <ConfirmDialog
        open={Boolean(removing)}
        onOpenChange={(open) => !open && setRemoving(null)}
        title='Delete this achievement?'
        description='Parents will no longer see it.'
        confirmText='Delete'
        destructive
        loading={remove.isPending}
        onConfirm={async () => {
          if (!removing) return
          try {
            await remove.mutateAsync(removing.id)
            alerts.success('Achievement deleted')
          } catch (error) {
            alerts.error(toApiError(error).message)
          }
          setRemoving(null)
        }}
      />
    </div>
  )
}

function AchievementModal({
  studentId,
  achievement,
  onClose,
}: {
  studentId: number
  achievement?: Achievement
  onClose: () => void
}) {
  const [draft, setDraft] = useState({
    title: achievement?.title ?? '',
    category: achievement?.category ?? ('competition' as AchievementCategory),
    level: achievement?.level ?? ('school' as AchievementLevel),
    result: achievement?.result ?? ('participated' as AchievementResult),
    event_scope: achievement?.event_scope ?? ('in_school' as EventScope),
    venue_type: achievement?.venue_type ?? (null as VenueType | null),
    participation: achievement?.participation ?? ('individual' as Participation),
    team_name: achievement?.team_name ?? '',
    prize_received: achievement?.prize_received ?? '',
    school_reward: achievement?.school_reward ?? '',
    position: achievement?.position ?? '',
    achieved_on: achievement?.achieved_on ?? today(),
    description: achievement?.description ?? '',
    visible_to_parent: achievement?.visible_to_parent ?? true,
  })
  const [file, setFile] = useState<{ id: number; name: string } | null>(
    achievement?.file ? { id: achievement.file.id, name: achievement.file.name } : null
  )
  const [uploading, setUploading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const save = useStudentMutation((input: AchievementInput) =>
    achievement
      ? recordsApi.updateAchievement(studentId, achievement.id, input)
      : recordsApi.addAchievement(studentId, input)
  )
  const set = <K extends keyof typeof draft>(key: K, value: (typeof draft)[K]) => {
    setDraft((current) => ({ ...current, [key]: value }))
    setErrors((current) => ({ ...current, [key]: '' }))
  }

  return (
    <AppModal
      open
      onOpenChange={(open) => !open && onClose()}
      title={achievement ? 'Edit achievement' : 'Add achievement'}
      formId='achievement-form'
      submitText='Save'
      loading={save.isPending || uploading}
      size='lg'
    >
      <form
        id='achievement-form'
        noValidate
        className='grid gap-4 sm:grid-cols-2'
        onSubmit={async (event) => {
          event.preventDefault()
          const next: Record<string, string> = {}
          if (draft.title.trim().length < 3)
            next.title = 'Enter the achievement, at least 3 letters'
          if (!draft.achieved_on) next.achieved_on = 'Choose the date'
          if (draft.achieved_on > today()) next.achieved_on = 'The date cannot be in the future'
          if (draft.category === 'sports' && !draft.venue_type)
            next.venue_type = 'Choose indoor or outdoor for a sports achievement'
          if (Object.keys(next).length) {
            setErrors(next)
            return
          }
          try {
            await save.mutateAsync({
              title: draft.title.trim(),
              category: draft.category,
              level: draft.level,
              result: draft.result,
              event_scope: draft.event_scope,
              venue_type: draft.venue_type,
              participation: draft.participation,
              team_name: draft.participation === 'team' ? draft.team_name.trim() || null : null,
              prize_received: draft.prize_received.trim() || null,
              school_reward: draft.school_reward.trim() || null,
              position: draft.position.trim() || null,
              achieved_on: draft.achieved_on,
              description: draft.description.trim() || null,
              file_id: file?.id ?? null,
              visible_to_parent: draft.visible_to_parent,
            })
            alerts.success(achievement ? 'Achievement saved' : 'Achievement added')
            onClose()
          } catch (caught) {
            const apiError = toApiError(caught)
            if (apiError.fieldErrors.length) {
              setErrors(
                Object.fromEntries(apiError.fieldErrors.map((item) => [item.field, item.message]))
              )
            } else {
              alerts.error(apiError.message)
            }
          }
        }}
      >
        <FormField
          id='achievement-title'
          label='Achievement'
          required
          error={errors.title}
          className='sm:col-span-2'
        >
          <Input
            id='achievement-title'
            maxLength={120}
            placeholder='Inter-school football tournament'
            value={draft.title}
            onChange={(event) => set('title', event.target.value)}
            aria-invalid={Boolean(errors.title) || undefined}
          />
        </FormField>
        <FormField id='achievement-category' label='Category' required>
          <Combobox
            id='achievement-category'
            label='Category'
            value={draft.category}
            placeholder='Choose category'
            options={optionsOf(CATEGORY_LABELS)}
            onChange={(value) => value && set('category', value as AchievementCategory)}
            className='sm:w-full'
          />
        </FormField>
        <FormField id='achievement-level' label='Level' required>
          <Combobox
            id='achievement-level'
            label='Level'
            value={draft.level}
            placeholder='Choose level'
            options={optionsOf(LEVEL_LABELS)}
            onChange={(value) => value && set('level', value as AchievementLevel)}
            className='sm:w-full'
          />
        </FormField>
        <FormField id='achievement-result' label='Result' required>
          <Combobox
            id='achievement-result'
            label='Result'
            value={draft.result}
            placeholder='Choose result'
            options={optionsOf(RESULT_LABELS)}
            onChange={(value) => value && set('result', value as AchievementResult)}
            className='sm:w-full'
          />
        </FormField>
        <FormField id='achievement-scope' label='Event' required>
          <Combobox
            id='achievement-scope'
            label='Event'
            value={draft.event_scope}
            placeholder='Choose event'
            options={optionsOf(SCOPE_LABELS)}
            onChange={(value) => value && set('event_scope', value as EventScope)}
            className='sm:w-full'
          />
        </FormField>
        {draft.category === 'sports' && (
          <FormField
            id='achievement-venue'
            label='Indoor or outdoor'
            required
            error={errors.venue_type}
          >
            <SegmentedControl
              label='Indoor or outdoor'
              value={draft.venue_type ?? ''}
              onChange={(value) => set('venue_type', value as VenueType)}
              options={optionsOf(VENUE_LABELS)}
              className='w-fit'
            />
          </FormField>
        )}
        <FormField id='achievement-participation' label='Took part as'>
          <SegmentedControl
            label='Took part as'
            value={draft.participation}
            onChange={(value) => set('participation', value as Participation)}
            options={optionsOf(PARTICIPATION_LABELS)}
            className='w-fit'
          />
        </FormField>
        {draft.participation === 'team' && (
          <FormField id='achievement-team' label='Team name' hint='Optional'>
            <Input
              id='achievement-team'
              maxLength={80}
              placeholder='School U-14 football team'
              value={draft.team_name}
              onChange={(event) => set('team_name', event.target.value)}
            />
          </FormField>
        )}
        <FormField id='achievement-prize' label='Prize won' hint='Optional, what the event gave'>
          <Input
            id='achievement-prize'
            maxLength={120}
            placeholder='Gold medal and ₹2,000'
            value={draft.prize_received}
            onChange={(event) => set('prize_received', event.target.value)}
          />
        </FormField>
        <FormField id='achievement-reward' label='Prize from school' hint='Optional'>
          <Input
            id='achievement-reward'
            maxLength={120}
            placeholder='Trophy at the annual day'
            value={draft.school_reward}
            onChange={(event) => set('school_reward', event.target.value)}
          />
        </FormField>
        <FormField id='achievement-position' label='Position' hint='Optional, like 1st of 40 teams'>
          <Input
            id='achievement-position'
            maxLength={30}
            value={draft.position}
            onChange={(event) => set('position', event.target.value)}
          />
        </FormField>
        <FormField id='achievement-date' label='Date' required error={errors.achieved_on}>
          <Input
            id='achievement-date'
            type='date'
            max={today()}
            value={draft.achieved_on}
            onChange={(event) => set('achieved_on', event.target.value)}
            aria-invalid={Boolean(errors.achieved_on) || undefined}
          />
        </FormField>
        <FormField id='achievement-description' label='Details' className='sm:col-span-2'>
          <Input
            id='achievement-description'
            maxLength={500}
            placeholder='Optional'
            value={draft.description}
            onChange={(event) => set('description', event.target.value)}
          />
        </FormField>
        <FormField
          id='achievement-file'
          label='Certificate or photo'
          hint='PDF or image, optional'
          error={errors.file_id}
        >
          {file ? (
            <div className='flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm'>
              <span className='flex min-w-0 items-center gap-2'>
                <Paperclip className='size-4 shrink-0' />
                <span className='truncate'>{file.name}</span>
              </span>
              <Button type='button' size='sm' variant='ghost' onClick={() => setFile(null)}>
                Remove
              </Button>
            </div>
          ) : (
            <Input
              id='achievement-file'
              type='file'
              accept='application/pdf,image/*'
              disabled={uploading}
              onChange={async (event) => {
                const picked = event.target.files?.[0]
                if (!picked) return
                setUploading(true)
                try {
                  const uploaded = await filesApi.upload(picked, 'achievement')
                  setFile({ id: uploaded.id, name: uploaded.name })
                } catch (caught) {
                  alerts.error(toApiError(caught).message)
                } finally {
                  setUploading(false)
                }
              }}
            />
          )}
        </FormField>
        <FormField id='achievement-visible' label='Show to parents'>
          <div className='flex h-9 items-center gap-2'>
            <Switch
              id='achievement-visible'
              checked={draft.visible_to_parent}
              onCheckedChange={(checked) => set('visible_to_parent', checked)}
            />
            <span className='text-sm text-muted-foreground'>
              {draft.visible_to_parent ? 'Parents see it and get a notification' : 'Staff only'}
            </span>
          </div>
        </FormField>
      </form>
    </AppModal>
  )
}
