import { X } from 'lucide-react'
import { Combobox } from '@/components/common/combobox'
import { FormField } from '@/components/common/form-field'
import { SegmentedControl } from '@/components/common/segmented-control'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { useClasses, useSections } from '@/features/setup/api'
import type { StaffGroup } from '../api'
import { hasStaff, STAFF_GROUP_OPTIONS, type AudienceValue, type PickerAudience } from '../audience'
import { AUDIENCE_OPTIONS } from '../labels'

export function AudiencePicker({
  idPrefix,
  value,
  onChange,
  errors,
  teachersSwitch = false,
  staffGroups = false,
}: {
  idPrefix: string
  value: AudienceValue
  onChange: (patch: Partial<AudienceValue>) => void
  errors: Record<string, string | undefined>
  teachersSwitch?: boolean
  staffGroups?: boolean
}) {
  const classes = useClasses()
  const sections = useSections()

  const sectionName = (id: number) => {
    const section = sections.data?.find((item) => item.id === id)
    return section ? `${section.class_name} - ${section.name}` : String(id)
  }
  const className = (id: number) =>
    `Class ${classes.data?.find((item) => item.id === id)?.name ?? id}`

  const chips = (ids: number[], key: 'class_ids' | 'section_ids', label: (id: number) => string) =>
    ids.length > 0 && (
      <span className='flex flex-wrap gap-1.5'>
        {ids.map((id) => (
          <Badge key={id} tone='info'>
            {label(id)}
            <button
              type='button'
              aria-label={`Remove ${label(id)}`}
              className='rounded-full hover:bg-info/20'
              onClick={() => onChange({ [key]: ids.filter((item) => item !== id) })}
            >
              <X className='size-3' />
            </button>
          </Badge>
        ))}
      </span>
    )

  const toggleGroup = (group: StaffGroup, on: boolean) =>
    onChange({
      staff_groups: on
        ? [...value.staff_groups, group]
        : value.staff_groups.filter((item) => item !== group),
    })

  return (
    <>
      <FormField id={`${idPrefix}-audience`} label='Send to' className='sm:col-span-2'>
        <SegmentedControl
          label='Send to'
          value={value.audience}
          onChange={(audience: PickerAudience) => onChange({ audience })}
          options={AUDIENCE_OPTIONS}
          className='flex-wrap'
        />
      </FormField>
      {value.audience === 'classes' && (
        <FormField
          id={`${idPrefix}-classes`}
          label='Classes'
          required
          error={errors.class_ids}
          className='sm:col-span-2'
        >
          <div className='grid gap-2'>
            <Combobox
              id={`${idPrefix}-classes`}
              label='Add a class'
              placeholder='Add a class'
              invalid={Boolean(errors.class_ids)}
              options={(classes.data ?? [])
                .filter((item) => !value.class_ids.includes(item.id))
                .map((item) => ({ value: String(item.id), label: `Class ${item.name}` }))}
              onChange={(picked) =>
                picked && onChange({ class_ids: [...value.class_ids, Number(picked)] })
              }
              highlightSelected={false}
              className='sm:w-full'
            />
            {chips(value.class_ids, 'class_ids', className)}
          </div>
        </FormField>
      )}
      {value.audience === 'sections' && (
        <FormField
          id={`${idPrefix}-sections`}
          label='Sections'
          required
          error={errors.section_ids}
          className='sm:col-span-2'
        >
          <div className='grid gap-2'>
            <Combobox
              id={`${idPrefix}-sections`}
              label='Add a section'
              placeholder='Add a section'
              invalid={Boolean(errors.section_ids)}
              options={(sections.data ?? [])
                .filter((item) => !value.section_ids.includes(item.id))
                .map((item) => ({
                  value: String(item.id),
                  label: `${item.class_name} - ${item.name}`,
                }))}
              onChange={(picked) =>
                picked && onChange({ section_ids: [...value.section_ids, Number(picked)] })
              }
              highlightSelected={false}
              className='sm:w-full'
            />
            {chips(value.section_ids, 'section_ids', sectionName)}
          </div>
        </FormField>
      )}
      {teachersSwitch && ['classes', 'sections'].includes(value.audience) && (
        <label className='flex items-center gap-2 text-sm sm:col-span-2'>
          <Switch
            checked={value.include_teachers}
            onCheckedChange={(include_teachers) => onChange({ include_teachers })}
            aria-label='Also their teachers'
          />
          Also send to their teachers
        </label>
      )}
      {staffGroups && hasStaff(value.audience) && (
        <FormField
          id={`${idPrefix}-staff-groups`}
          label='Which staff'
          error={errors.staff_groups}
          className='sm:col-span-2'
        >
          <div id={`${idPrefix}-staff-groups`} className='flex flex-wrap gap-x-5 gap-y-2 pt-1'>
            {STAFF_GROUP_OPTIONS.map((option) => (
              <label key={option.value} className='flex items-center gap-2 text-sm'>
                <Switch
                  checked={value.staff_groups.includes(option.value)}
                  onCheckedChange={(on) => toggleGroup(option.value, on)}
                  aria-label={option.label}
                />
                <span className='grid leading-tight'>
                  <span className='font-medium'>{option.label}</span>
                  <span className='text-xs text-muted-foreground'>{option.hint}</span>
                </span>
              </label>
            ))}
          </div>
        </FormField>
      )}
    </>
  )
}
