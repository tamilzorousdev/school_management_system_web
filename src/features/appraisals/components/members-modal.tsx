import { useState } from 'react'
import { AppModal } from '@/components/common/app-modal'
import { ErrorState } from '@/components/common/display'
import { FormField } from '@/components/common/form-field'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useStaffList } from '@/features/staff/api'
import { alerts } from '@/lib/alerts'
import { toApiError } from '@/lib/api/errors'
import {
  appraisalsApi,
  useAppraisalMutation,
  useGroupMembers,
  type AppraisalGroup,
  type GroupMember,
  type GroupMembers,
} from '../api'
import { PickChips } from './chips'

type Picked = { key: string; label: string }

const REASON: Record<GroupMember['reason'], string> = {
  rules: 'Rules',
  included: 'Added by hand',
  default: 'Catch-all',
}

export function MembersModal({
  group,
  canEdit,
  onClose,
}: {
  group: AppraisalGroup
  canEdit: boolean
  onClose: () => void
}) {
  const members = useGroupMembers(group.id)
  const save = useAppraisalMutation(appraisalsApi.setMembers)

  return (
    <AppModal
      open
      onOpenChange={(open) => !open && !save.isPending && onClose()}
      title={`People in ${group.name}`}
      description='Who the group holds today. A cycle takes a snapshot when it opens.'
      size='xl'
      formId={canEdit ? 'group-members-form' : undefined}
      submitText='Save people'
      loading={save.isPending}
    >
      {members.isPending ? (
        <Skeleton className='h-40' />
      ) : members.isError ? (
        <ErrorState message={members.error.message} onRetry={() => void members.refetch()} />
      ) : (
        <MembersForm
          key={group.id}
          group={group}
          data={members.data}
          canEdit={canEdit}
          onSave={async (include, exclude) => {
            try {
              const saved = await save.mutateAsync({
                id: group.id,
                include_staff_ids: include.map((item) => Number(item.key)),
                exclude_staff_ids: exclude.map((item) => Number(item.key)),
              })
              alerts.success(saved.message)
              onClose()
            } catch (error) {
              alerts.error(toApiError(error).message)
            }
          }}
        />
      )}
    </AppModal>
  )
}

function MembersForm({
  data,
  canEdit,
  onSave,
}: {
  group: AppraisalGroup
  data: GroupMembers
  canEdit: boolean
  onSave: (include: Picked[], exclude: Picked[]) => Promise<void>
}) {
  const names = new Map([...data.members, ...data.elsewhere].map((person) => [person.staff_id, person.name]))
  const label = (id: number) => ({ key: String(id), label: names.get(id) ?? `Staff #${id}` })
  const [include, setInclude] = useState<Picked[]>(() => data.include_staff_ids.map(label))
  const [exclude, setExclude] = useState<Picked[]>(() => data.exclude_staff_ids.map(label))
  const [query, setQuery] = useState('')
  const staff = useStaffList({ page: 1, limit: 30, search: query || undefined, status: 'active' })
  const options = (staff.data?.items ?? []).map((person) => ({
    value: String(person.id),
    label: `${person.name} · ${person.designation}${person.department ? ` · ${person.department}` : ''}`,
  }))

  return (
    <form
      id='group-members-form'
      className='grid gap-4 lg:grid-cols-2'
      onSubmit={(event) => {
        event.preventDefault()
        void onSave(include, exclude)
      }}
    >
      <section className='grid content-start gap-2'>
        <h3 className='text-sm font-semibold'>In this group ({data.members.length})</h3>
        <ul className='max-h-80 divide-y overflow-auto rounded-lg border text-sm'>
          {data.members.map((person) => (
            <li key={person.staff_id} className='flex items-center justify-between gap-2 px-3 py-2'>
              <span className='grid min-w-0'>
                <span className='truncate font-medium'>{person.name}</span>
                <span className='truncate text-xs text-muted-foreground'>
                  {person.designation}
                  {person.department ? ` · ${person.department}` : ''}
                  {person.also_matches.length
                    ? ` · also matches ${person.also_matches.map((item) => item.name).join(', ')}`
                    : ''}
                </span>
              </span>
              <Badge tone={person.reason === 'included' ? 'info' : 'neutral'}>{REASON[person.reason]}</Badge>
            </li>
          ))}
          {!data.members.length && <li className='px-3 py-6 text-center text-muted-foreground'>Nobody matches yet.</li>}
        </ul>
        {data.elsewhere.length > 0 && (
          <p className='text-xs text-muted-foreground'>
            Match these rules but sit in another group: {data.elsewhere.map((person) => person.name).join(', ')}
          </p>
        )}
      </section>
      {canEdit && (
        <section className='grid content-start gap-4'>
          <FormField id='members-include' label='Always in this group' hint='Added by hand, even when the rules do not match'>
            <PickChips
              id='members-include'
              label='Add a person'
              options={options}
              values={include}
              onChange={setInclude}
              onSearch={setQuery}
            />
          </FormField>
          <FormField id='members-exclude' label='Never in this group' hint='Kept out even when the rules match'>
            <PickChips
              id='members-exclude'
              label='Add a person'
              options={options}
              values={exclude}
              onChange={setExclude}
              onSearch={setQuery}
            />
          </FormField>
        </section>
      )}
    </form>
  )
}
