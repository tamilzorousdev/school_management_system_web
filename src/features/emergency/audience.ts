import type { EmergencyAudience, StaffGroup } from './api'

export type PickerAudience = Exclude<EmergencyAudience, 'students'>

export interface AudienceValue {
  audience: PickerAudience
  class_ids: number[]
  section_ids: number[]
  include_teachers: boolean
  staff_groups: StaffGroup[]
}

export const STAFF_GROUP_OPTIONS: { value: StaffGroup; label: string; hint: string }[] = [
  { value: 'teachers', label: 'Teachers', hint: 'Teachers and HODs' },
  { value: 'drivers', label: 'Bus crew', hint: 'Drivers and attendants' },
  { value: 'office', label: 'Office staff', hint: 'Everyone else on the staff' },
]

export const ALL_STAFF_GROUPS = STAFF_GROUP_OPTIONS.map((option) => option.value)

export const hasStaff = (audience: PickerAudience) =>
  audience === 'everyone' || audience === 'staff'

export const hasParents = (audience: PickerAudience) => audience !== 'staff'

export const audienceComplete = (value: AudienceValue) =>
  !(value.audience === 'classes' && !value.class_ids.length) &&
  !(value.audience === 'sections' && !value.section_ids.length)

export const chosenStaffGroups = (groups: StaffGroup[]) =>
  groups.length === ALL_STAFF_GROUPS.length ? [] : groups

export function audienceErrors(value: AudienceValue): Record<string, string> {
  const errors: Record<string, string> = {}
  if (value.audience === 'classes' && !value.class_ids.length)
    errors.class_ids = 'Choose at least one class'
  if (value.audience === 'sections' && !value.section_ids.length)
    errors.section_ids = 'Choose at least one section'
  if (hasStaff(value.audience) && !value.staff_groups.length)
    errors.staff_groups = 'Choose at least one group of staff'
  return errors
}
