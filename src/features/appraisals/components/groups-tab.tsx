import { useState } from 'react'
import { Copy, ListChecks, Pencil, Plus, Trash2, Users, UsersRound } from 'lucide-react'
import { AppModal } from '@/components/common/app-modal'
import { Combobox } from '@/components/common/combobox'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import { EmptyState, ErrorState } from '@/components/common/display'
import { FormField } from '@/components/common/form-field'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useAcademicYears } from '@/features/setup/api'
import { alerts } from '@/lib/alerts'
import { toApiError } from '@/lib/api/errors'
import { appraisalsApi, useAppraisalGroups, useAppraisalMutation, type AppraisalGroup } from '../api'
import { CATEGORY, METRIC, STAFF_TYPE } from '../labels'
import { GroupModal } from './group-modal'
import { KraEditor } from './kra-editor'
import { MembersModal } from './members-modal'

function rulesText(group: AppraisalGroup): string {
  if (group.is_default) return 'Everyone in no other group'
  const parts = [
    group.rules.staff_types.map((type) => STAFF_TYPE[type]).join(' or '),
    group.rules.departments.join(', '),
    group.rules.designations.join(', '),
    group.rules.roles.map((role) => role.toLowerCase()).join(', '),
  ].filter(Boolean)
  return parts.length ? parts.join(' · ') : 'Only people added by hand'
}

export function GroupsTab({ canEdit }: { canEdit: boolean }) {
  const groups = useAppraisalGroups()
  const [editing, setEditing] = useState<AppraisalGroup | 'new' | null>(null)
  const [kras, setKras] = useState<AppraisalGroup | null>(null)
  const [people, setPeople] = useState<AppraisalGroup | null>(null)
  const [removing, setRemoving] = useState<AppraisalGroup | null>(null)
  const [copying, setCopying] = useState(false)
  const remove = useAppraisalMutation(appraisalsApi.removeGroup)

  return (
    <div className='grid gap-4 p-4'>
      <div className='flex flex-wrap items-center justify-between gap-2'>
        <p className='max-w-2xl text-sm text-muted-foreground'>
          Each group is a team with its own KRAs for this academic year. A person is placed by the rules, unless
          added or kept out by hand; the catch-all group takes everyone else.
        </p>
        {canEdit && (
          <div className='flex gap-2'>
            <Button variant='outline' onClick={() => setCopying(true)}>
              <Copy />
              Copy from another year
            </Button>
            <Button onClick={() => setEditing('new')}>
              <Plus />
              New group
            </Button>
          </div>
        )}
      </div>
      {groups.isPending ? (
        <Skeleton className='h-48' />
      ) : groups.isError ? (
        <ErrorState message={groups.error.message} onRetry={() => void groups.refetch()} />
      ) : !groups.data.length ? (
        <EmptyState
          icon={UsersRound}
          title='No appraisal groups this year'
          description='Create a group such as Teaching staff, then its KRAs, or copy last year’s groups.'
        />
      ) : (
        <div className='grid gap-4 lg:grid-cols-2'>
          {groups.data.map((group) => (
            <Card key={group.id} className='grid content-start gap-3 p-4' data-testid='appraisal-group'>
              <div className='flex items-start justify-between gap-2'>
                <span className='grid min-w-0'>
                  <span className='flex items-center gap-2 font-semibold'>
                    {group.name}
                    {group.is_default && <Badge tone='info'>Catch-all</Badge>}
                    {!group.is_active && <Badge>Off</Badge>}
                  </span>
                  <span className='text-xs text-muted-foreground'>{rulesText(group)}</span>
                </span>
                <Badge tone={group.weight_total === 100 ? 'success' : 'danger'} dot>
                  {group.weight_total}%
                </Badge>
              </div>
              <ul className='grid gap-1 text-sm'>
                {group.kras.map((kra) => (
                  <li key={kra.id} className='flex items-center justify-between gap-2'>
                    <span className='min-w-0 truncate'>
                      {kra.title}
                      <span className='ml-1 text-xs text-muted-foreground'>
                        {CATEGORY[kra.category]}
                        {kra.auto_metric ? ` · from ${METRIC[kra.auto_metric].label.toLowerCase()}` : ''}
                      </span>
                    </span>
                    <span className='tabular text-muted-foreground'>{kra.weightage_percent}%</span>
                  </li>
                ))}
                {!group.kras.length && <li className='text-muted-foreground'>No KRAs yet.</li>}
              </ul>
              <div className='flex flex-wrap gap-2'>
                <Button variant='outline' size='sm' onClick={() => setPeople(group)}>
                  <Users />
                  {group.member_count} {group.member_count === 1 ? 'person' : 'people'}
                </Button>
                {canEdit && (
                  <>
                    <Button variant='outline' size='sm' onClick={() => setKras(group)}>
                      <ListChecks />
                      KRAs
                    </Button>
                    <Button variant='ghost' size='sm' onClick={() => setEditing(group)}>
                      <Pencil />
                      Edit
                    </Button>
                    <Button variant='ghost' size='sm' onClick={() => setRemoving(group)}>
                      <Trash2 />
                      Delete
                    </Button>
                  </>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
      {editing && <GroupModal group={editing === 'new' ? null : editing} onClose={() => setEditing(null)} />}
      {kras && <KraEditor group={kras} onClose={() => setKras(null)} />}
      {people && <MembersModal group={people} canEdit={canEdit} onClose={() => setPeople(null)} />}
      {copying && <CopyYearModal onClose={() => setCopying(false)} />}
      <ConfirmDialog
        open={Boolean(removing)}
        onOpenChange={(open) => !open && setRemoving(null)}
        title={`Delete ${removing?.name ?? 'group'}?`}
        description='Its KRAs and people go too. Closed cycles keep their results.'
        confirmText='Delete group'
        destructive
        loading={remove.isPending}
        onConfirm={async () => {
          try {
            const done = await remove.mutateAsync(removing!.id)
            alerts.success(done.message)
            setRemoving(null)
          } catch (error) {
            alerts.error(toApiError(error).message)
          }
        }}
      />
    </div>
  )
}

function CopyYearModal({ onClose }: { onClose: () => void }) {
  const years = useAcademicYears()
  const [from, setFrom] = useState<string>()
  const [to, setTo] = useState<string>()
  const copy = useAppraisalMutation(appraisalsApi.copyYear)
  const options = (years.data ?? []).map((year) => ({
    value: String(year.id),
    label: `${year.name}${year.is_current ? ' (current)' : ''}`,
  }))

  const submit = async () => {
    if (!from || !to) return alerts.error('Choose both years')
    try {
      const done = await copy.mutateAsync({ from_academic_year_id: Number(from), to_academic_year_id: Number(to) })
      alerts.success(
        `${done.data.copied} ${done.data.copied === 1 ? 'group' : 'groups'} copied${done.data.skipped ? `, ${done.data.skipped} already there` : ''}`,
      )
      onClose()
    } catch (error) {
      alerts.error(toApiError(error).message)
    }
  }

  return (
    <AppModal
      open
      onOpenChange={(open) => !open && !copy.isPending && onClose()}
      title='Copy groups to another year'
      description='Copies each group with its rules, people and KRAs. Groups whose name already exists are skipped.'
      formId='copy-year-form'
      submitText='Copy groups'
      loading={copy.isPending}
    >
      <form
        id='copy-year-form'
        className='grid gap-4'
        onSubmit={(event) => {
          event.preventDefault()
          void submit()
        }}
      >
        <FormField id='copy-from' label='From year' required>
          <Combobox id='copy-from' label='From year' placeholder='Choose a year' value={from} options={options} onChange={setFrom} className='sm:w-full' />
        </FormField>
        <FormField id='copy-to' label='To year' required>
          <Combobox id='copy-to' label='To year' placeholder='Choose a year' value={to} options={options} onChange={setTo} className='sm:w-full' />
        </FormField>
      </form>
    </AppModal>
  )
}
