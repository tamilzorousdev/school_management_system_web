import { Trophy } from 'lucide-react'
import { AppModal } from '@/components/common/app-modal'
import { EmptyState } from '@/components/common/display'
import { Badge } from '@/components/ui/badge'
import type { BoardOnDuty } from '../api'

const sessionText = (session: BoardOnDuty['session']) =>
  session === 'morning' ? 'Morning only' : session === 'afternoon' ? 'Afternoon only' : 'Full day'

export function OnDutyModal({
  open,
  students,
  dateText,
  onClose,
  onOpenSection,
}: {
  open: boolean
  students: BoardOnDuty[]
  dateText: string
  onClose: () => void
  onOpenSection: (sectionId: number) => void
}) {
  const sections = [...new Set(students.map((student) => student.section))]
  return (
    <AppModal
      open={open}
      onOpenChange={(next) => !next && onClose()}
      title='Students on duty (OD)'
      description={`${dateText}. They count as present and cannot be marked absent. Map OD in Sports & activities.`}
      size='lg'
    >
      {students.length === 0 ? (
        <EmptyState
          icon={Trophy}
          title='No one on duty'
          description='No Sports OD for this date and session.'
        />
      ) : (
        <div className='grid max-h-[60vh] gap-3 overflow-y-auto pr-1'>
          {sections.map((section) => (
            <section key={section} className='grid gap-1.5'>
              <h3 className='text-xs font-bold tracking-wide text-muted-foreground uppercase'>
                Class {section}
              </h3>
              <ul className='grid gap-1.5'>
                {students
                  .filter((student) => student.section === section)
                  .map((student) => (
                    <li key={student.student_id}>
                      <button
                        type='button'
                        onClick={() => onOpenSection(student.section_id)}
                        className='flex w-full flex-wrap items-center justify-between gap-2 rounded-lg border bg-card px-3 py-2 text-left hover:bg-muted/50'
                      >
                        <span className='grid min-w-0'>
                          <span className='truncate font-semibold'>{student.name}</span>
                          {student.admission_no && (
                            <span className='tabular text-xs text-muted-foreground'>
                              {student.admission_no}
                            </span>
                          )}
                        </span>
                        <span className='grid min-w-0 justify-items-end text-right'>
                          <span className='truncate text-sm'>{student.title}</span>
                          <span className='flex items-center gap-1.5 text-xs text-muted-foreground'>
                            {student.sport_name}
                            <Badge tone='success' className='px-1 py-0 text-[10px]'>
                              {sessionText(student.session)}
                            </Badge>
                          </span>
                        </span>
                      </button>
                    </li>
                  ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </AppModal>
  )
}
