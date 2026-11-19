import { SegmentedControl } from '@/components/common/segmented-control'
import { DepartmentPicker, SectionPicker, StaffPicker } from './pickers'

export type IssueTarget = 'department' | 'staff' | 'section'

const TARGETS: { value: IssueTarget; label: string }[] = [
  { value: 'department', label: 'Department' },
  { value: 'staff', label: 'Staff member' },
  { value: 'section', label: 'Class' },
]

export function IssueTargetFields({
  idPrefix,
  target,
  departmentId,
  userId,
  sectionId,
  onChange,
  error,
}: {
  idPrefix: string
  target: IssueTarget
  departmentId: string
  userId: string
  sectionId: string
  onChange: (patch: {
    target?: IssueTarget
    department_id?: string
    user_id?: string
    section_id?: string
  }) => void
  error?: string
}) {
  return (
    <div className='grid gap-2'>
      <SegmentedControl
        label='For'
        value={target}
        onChange={(next) => onChange({ target: next })}
        options={TARGETS}
        className='justify-self-start'
      />
      {target === 'department' && (
        <DepartmentPicker
          id={`${idPrefix}-department`}
          label='Department'
          value={departmentId || undefined}
          invalid={Boolean(error)}
          onChange={(value) => onChange({ department_id: value ?? '' })}
        />
      )}
      {target === 'staff' && (
        <StaffPicker
          id={`${idPrefix}-staff`}
          label='Staff member'
          value={userId || undefined}
          invalid={Boolean(error)}
          onChange={(value) => onChange({ user_id: value ?? '' })}
        />
      )}
      {target === 'section' && (
        <SectionPicker
          id={`${idPrefix}-section`}
          label='Class'
          value={sectionId || undefined}
          invalid={Boolean(error)}
          onChange={(value) => onChange({ section_id: value ?? '' })}
        />
      )}
      {error && (
        <p role='alert' className='text-xs font-medium text-destructive'>
          {error}
        </p>
      )}
    </div>
  )
}
