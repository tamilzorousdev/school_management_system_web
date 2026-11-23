import { useState } from 'react'
import { AppModal } from '@/components/common/app-modal'
import { FormField } from '@/components/common/form-field'
import { SegmentedControl } from '@/components/common/segmented-control'
import { Input, Textarea } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { alerts } from '@/lib/alerts'
import { toApiError } from '@/lib/api/errors'
import {
  appraisalsApi,
  useAppraisalMutation,
  type AppraisalGroup,
  type GroupRules,
  type StaffTypeRule,
} from '../api'
import { fieldMap, ROLE_OPTIONS, STAFF_TYPE } from '../labels'
import { PickChips, TextChips } from './chips'

type Starter = 'teaching' | 'staff' | 'none'

export function GroupModal({ group, onClose }: { group: AppraisalGroup | null; onClose: () => void }) {
  const [name, setName] = useState(group?.name ?? '')
  const [description, setDescription] = useState(group?.description ?? '')
  const [rules, setRules] = useState<GroupRules>(
    group?.rules ?? { staff_types: [], departments: [], designations: [], roles: [] },
  )
  const [isDefault, setIsDefault] = useState(group?.is_default ?? false)
  const [sortOrder, setSortOrder] = useState(String(group?.sort_order ?? 1))
  const [starter, setStarter] = useState<Starter>('teaching')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const create = useAppraisalMutation(appraisalsApi.createGroup)
  const update = useAppraisalMutation(appraisalsApi.updateGroup)
  const busy = create.isPending || update.isPending

  const toggleType = (type: StaffTypeRule) =>
    setRules((current) => ({
      ...current,
      staff_types: current.staff_types.includes(type)
        ? current.staff_types.filter((item) => item !== type)
        : [...current.staff_types, type],
    }))

  const submit = async () => {
    if (!name.trim()) return setErrors({ name: 'Give the group a name' })
    const input = {
      name: name.trim(),
      description: description.trim() || null,
      rules,
      is_default: isDefault,
      sort_order: Number(sortOrder) || 0,
    }
    try {
      const saved = group
        ? await update.mutateAsync({ id: group.id, ...input })
        : await create.mutateAsync({ ...input, starter_kras: starter })
      alerts.success(saved.message)
      onClose()
    } catch (error) {
      const apiError = toApiError(error)
      setErrors(fieldMap(apiError.fieldErrors))
      alerts.error(apiError.message)
    }
  }

  return (
    <AppModal
      open
      onOpenChange={(open) => !open && !busy && onClose()}
      title={group ? `Edit ${group.name}` : 'New appraisal group'}
      description='A group is a team of staff with its own KRAs for this academic year.'
      size='lg'
      formId='appraisal-group-form'
      submitText={group ? 'Save group' : 'Create group'}
      loading={busy}
    >
      <form
        id='appraisal-group-form'
        className='grid gap-4 sm:grid-cols-2'
        onSubmit={(event) => {
          event.preventDefault()
          void submit()
        }}
      >
        <FormField id='group-name' label='Name' required error={errors.name} className='sm:col-span-2'>
          <Input
            id='group-name'
            value={name}
            placeholder='Teaching – Senior school'
            onChange={(event) => setName(event.target.value)}
          />
        </FormField>
        <FormField id='group-description' label='Description' className='sm:col-span-2'>
          <Textarea
            id='group-description'
            rows={2}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
        </FormField>
        <label className='flex items-start gap-2 text-sm sm:col-span-2'>
          <Switch checked={isDefault} onCheckedChange={setIsDefault} aria-label='Catch-all group' className='mt-0.5' />
          <span className='grid'>
            <span className='font-medium'>Catch-all group</span>
            <span className='text-xs text-muted-foreground'>
              Everyone who is in no other group lands here. Only one group can be the catch-all.
            </span>
          </span>
        </label>
        {!isDefault && (
          <>
            <FormField id='group-types' label='Staff type' hint='Leave empty for any type' className='sm:col-span-2'>
              <div className='flex flex-wrap gap-2' id='group-types'>
                {(Object.keys(STAFF_TYPE) as StaffTypeRule[]).map((type) => (
                  <label key={type} className='flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm'>
                    <Switch
                      checked={rules.staff_types.includes(type)}
                      onCheckedChange={() => toggleType(type)}
                      aria-label={STAFF_TYPE[type]}
                    />
                    {STAFF_TYPE[type]}
                  </label>
                ))}
              </div>
            </FormField>
            <FormField id='group-departments' label='Departments' hint='Any of these; leave empty for all'>
              <TextChips
                id='group-departments'
                values={rules.departments}
                placeholder='Department'
                onChange={(departments) => setRules((current) => ({ ...current, departments }))}
              />
            </FormField>
            <FormField id='group-designations' label='Designations' hint='Any of these; leave empty for all'>
              <TextChips
                id='group-designations'
                values={rules.designations}
                placeholder='Designation'
                onChange={(designations) => setRules((current) => ({ ...current, designations }))}
              />
            </FormField>
            <FormField id='group-roles' label='Roles' hint='Any of these; leave empty for all' className='sm:col-span-2'>
              <PickChips
                id='group-roles'
                label='Add a role'
                options={ROLE_OPTIONS}
                values={rules.roles.map((role) => ({
                  key: role,
                  label: ROLE_OPTIONS.find((option) => option.value === role)?.label ?? role,
                }))}
                onChange={(roles) => setRules((current) => ({ ...current, roles: roles.map((role) => role.key) }))}
              />
            </FormField>
          </>
        )}
        <FormField
          id='group-sort'
          label='Priority'
          hint='When a person matches two groups, the lower number wins'
          error={errors.sort_order}
        >
          <Input
            id='group-sort'
            type='number'
            min={0}
            inputMode='numeric'
            value={sortOrder}
            onChange={(event) => setSortOrder(event.target.value)}
          />
        </FormField>
        {!group && (
          <FormField id='group-starter' label='Start with'>
            <SegmentedControl
              label='Start with'
              value={starter}
              onChange={(value: Starter) => setStarter(value)}
              options={[
                { value: 'teaching', label: 'Teacher KRAs' },
                { value: 'staff', label: 'Staff KRAs' },
                { value: 'none', label: 'Empty' },
              ]}
            />
          </FormField>
        )}
      </form>
    </AppModal>
  )
}
