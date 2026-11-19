import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { CheckCircle2, UserPlus } from 'lucide-react'
import { AppModal } from '@/components/common/app-modal'
import { FormField } from '@/components/common/form-field'
import { SegmentedControl } from '@/components/common/segmented-control'
import { Avatar } from '@/components/common/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DialogFooter } from '@/components/ui/dialog'
import { alerts } from '@/lib/alerts'
import { toApiError } from '@/lib/api/errors'
import {
  libraryApi,
  useLibraryMutation,
  type MemberBulkInput,
  type MemberBulkResult,
  type Person,
} from '../api'
import { MEMBER_TYPE, plural } from '../labels'
import { FormError } from './library-parts'
import { PersonSearch } from './person-search'
import { ClassPicker, SectionPicker } from './school-pickers'

export function EnrolModal({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate()
  const [person, setPerson] = useState<Person | null>(null)
  const [error, setError] = useState<string | null>(null)
  const enrol = useLibraryMutation((target: Person) =>
    libraryApi.createMember(
      target.student_id ? { student_id: target.student_id } : { user_id: target.user_id! }
    )
  )

  const openMember = (id: number) =>
    navigate({ to: '/library/members/$memberId', params: { memberId: String(id) }, search: {} })

  return (
    <AppModal
      open
      onOpenChange={(open) => !open && onClose()}
      title='Enrol a member'
      description='Find a student or staff member. A library card number is given on enrolment.'
      footer={
        <DialogFooter>
          <Button variant='outline' onClick={onClose}>
            Cancel
          </Button>
          {person?.member_id ? (
            <Button onClick={() => openMember(person.member_id!)}>Open member</Button>
          ) : (
            <Button
              disabled={!person}
              loading={enrol.isPending}
              onClick={async () => {
                if (!person) return
                setError(null)
                try {
                  const member = await enrol.mutateAsync(person)
                  alerts.success(`${member.name} enrolled`, {
                    description: `Card ${member.card_no}`,
                  })
                  onClose()
                } catch (caught) {
                  setError(toApiError(caught).message)
                }
              }}
            >
              <UserPlus />
              Enrol
            </Button>
          )}
        </DialogFooter>
      }
    >
      <div className='grid gap-4'>
        <FormError message={error} />
        <PersonSearch id='enrol-person' onSelect={setPerson} className='sm:w-full' />
        {person && (
          <div className='flex items-center gap-3 rounded-lg border p-3'>
            <Avatar name={person.name} src={person.photo_url} />
            <div className='grid min-w-0 flex-1'>
              <span className='truncate font-bold'>{person.name}</span>
              <span className='truncate text-xs text-muted-foreground'>
                {[MEMBER_TYPE[person.member_type], person.detail].filter(Boolean).join(' · ')}
              </span>
            </div>
            {person.member_id ? (
              <Badge tone='info'>Member · {person.card_no}</Badge>
            ) : (
              <Badge>Not a member</Badge>
            )}
          </div>
        )}
      </div>
    </AppModal>
  )
}

type BulkScope = 'section' | 'class' | 'students' | 'staff'

export function BulkEnrolModal({ onClose }: { onClose: () => void }) {
  const [scope, setScope] = useState<BulkScope>('section')
  const [sectionId, setSectionId] = useState<number | undefined>()
  const [classId, setClassId] = useState<number | undefined>()
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<MemberBulkResult | null>(null)
  const bulk = useLibraryMutation((input: MemberBulkInput) => libraryApi.bulkMembers(input))

  const input: MemberBulkInput | null =
    scope === 'section'
      ? sectionId
        ? { section_id: sectionId }
        : null
      : scope === 'class'
        ? classId
          ? { class_id: classId }
          : null
        : scope === 'students'
          ? { all_students: true }
          : { all_staff: true }

  return (
    <AppModal
      open
      onOpenChange={(open) => !open && onClose()}
      title='Enrol many'
      description='Give library cards to a whole section, a class, every student or every staff member. People who are members already are skipped.'
      footer={
        <DialogFooter>
          {result ? (
            <Button onClick={onClose}>Done</Button>
          ) : (
            <>
              <Button variant='outline' onClick={onClose}>
                Cancel
              </Button>
              <Button
                disabled={!input}
                loading={bulk.isPending}
                onClick={async () => {
                  if (!input) return
                  setError(null)
                  try {
                    const next = await bulk.mutateAsync(input)
                    alerts.success(`${plural(next.created, 'member')} enrolled`)
                    setResult(next)
                  } catch (caught) {
                    setError(toApiError(caught).message)
                  }
                }}
              >
                <UserPlus />
                Enrol
              </Button>
            </>
          )}
        </DialogFooter>
      }
    >
      {result ? (
        <div className='flex items-center gap-3 rounded-lg border border-success/30 bg-success/10 p-3 text-sm'>
          <CheckCircle2 className='size-5 shrink-0 text-success' />
          <span>
            {plural(result.created, 'new member')} enrolled.{' '}
            {result.already_members ? `${result.already_members} were members already.` : ''}
          </span>
        </div>
      ) : (
        <div className='grid gap-4'>
          <FormError message={error} />
          <SegmentedControl
            label='Who to enrol'
            value={scope}
            onChange={setScope}
            options={[
              { value: 'section', label: 'A section' },
              { value: 'class', label: 'A class' },
              { value: 'students', label: 'All students' },
              { value: 'staff', label: 'All staff' },
            ]}
            className='flex-wrap self-start'
          />
          {scope === 'section' && (
            <FormField id='bulk-section' label='Section' required>
              <SectionPicker id='bulk-section' value={sectionId} onChange={setSectionId} />
            </FormField>
          )}
          {scope === 'class' && (
            <FormField id='bulk-class' label='Class' required>
              <ClassPicker id='bulk-class' value={classId} onChange={setClassId} />
            </FormField>
          )}
        </div>
      )}
    </AppModal>
  )
}
