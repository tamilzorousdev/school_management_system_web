import { useState } from 'react'
import { LayoutGrid } from 'lucide-react'
import { Combobox } from '@/components/common/combobox'
import { EmptyState, ErrorState } from '@/components/common/display'
import { useShortcut } from '@/components/shortcuts/shortcut-context'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useSections } from '@/features/setup/api'
import { cn } from '@/lib/utils'
import { useSpecialClasses, type SpecialClass } from '@/features/performance/api'
import { SpecialClassModal } from '@/features/performance/components/special-class-modal'
import { weeklySpecialLoad } from '@/features/performance/special-week'
import { useSectionTimetable } from '../api'
import { SlotModal, type SlotTarget } from './slot-modal'
import { SlotContent, WeekGrid, type SpecialPrefill } from './week-grid'

export function BuilderTab({
  sectionId,
  canManage,
  onSectionChange,
}: {
  sectionId?: number
  canManage: boolean
  onSectionChange: (sectionId: number | undefined) => void
}) {
  const sections = useSections()
  const chosen = sectionId ?? sections.data?.[0]?.id
  const timetable = useSectionTimetable(chosen)
  const [target, setTarget] = useState<SlotTarget | null>(null)
  const [adding, setAdding] = useState<SpecialPrefill | null>(null)
  const [editing, setEditing] = useState<SpecialClass | null>(null)
  const specials = useSpecialClasses({ section_id: chosen })
  const section = sections.data?.find((item) => item.id === chosen)
  const extra = weeklySpecialLoad(specials.data ?? [])
  const data = timetable.data

  useShortcut('app.refresh', () => void timetable.refetch())

  const all = sections.data ?? []
  const classOptions = [
    ...new Map(all.map((item) => [item.class_id, item.class_name])).entries(),
  ].map(([id, name]) => ({ value: String(id), label: `Class ${name}` }))
  const sectionOptions = all
    .filter((item) => item.class_id === section?.class_id)
    .map((item) => ({
      value: String(item.id),
      label: `Section ${item.name}`,
    }))
  const pickClass = (classId: number) => {
    const first = all.find((item) => item.class_id === classId)
    if (first) onSectionChange(first.id)
  }

  return (
    <div className='grid gap-4'>
      <div className='flex flex-wrap items-center gap-2'>
        <Combobox
          id='timetable-class'
          label='Class'
          value={section ? String(section.class_id) : undefined}
          placeholder='Choose class'
          searchPlaceholder='Search classes'
          options={classOptions}
          onChange={(value) => value && pickClass(Number(value))}
          highlightSelected={false}
          className='w-40'
        />
        <Combobox
          id='timetable-section'
          label='Section'
          value={chosen ? String(chosen) : undefined}
          placeholder='Choose section'
          searchPlaceholder='Search sections'
          options={sectionOptions}
          onChange={(value) => value && onSectionChange(Number(value))}
          highlightSelected={false}
          className='w-40'
        />
        {data?.room && <Badge tone='neutral'>Room {data.room}</Badge>}
        {extra.sessions > 0 && (
          <Badge tone='warning'>
            {extra.sessions} special {extra.sessions === 1 ? 'class' : 'classes'} a week
          </Badge>
        )}
        {!canManage && <Badge tone='neutral'>View only</Badge>}
      </div>

      {sections.data && sections.data.length === 0 ? (
        <Card>
          <EmptyState
            icon={LayoutGrid}
            title='No sections this year'
            description='Add classes and sections in School setup first.'
          />
        </Card>
      ) : timetable.isError && !data ? (
        <Card>
          <ErrorState message={timetable.error.message} onRetry={() => timetable.refetch()} />
        </Card>
      ) : !data ? (
        <Skeleton className='h-[28rem] w-full rounded-xl' />
      ) : (
        <Card
          className={cn(
            'min-w-0 overflow-hidden transition-opacity',
            timetable.isFetching && 'opacity-70'
          )}
        >
          <div className='flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3'>
            <h2 className='font-bold'>Class {data.section.name}</h2>
            <span className='text-xs text-muted-foreground'>
              {canManage
                ? 'Click a period to set the subject. Add special class slots in the Bell schedule.'
                : `${data.slots.length} periods a week`}
            </span>
          </div>
          <WeekGrid
            label={`Timetable of ${data.section.name}`}
            periods={data.periods}
            days={data.days}
            slots={data.slots}
            renderSlot={(slot) => (
              <SlotContent
                code={slot.subject.code}
                title={slot.subject.name}
                lines={[
                  slot.teacher?.name ?? 'No teacher',
                  slot.room !== data.room ? slot.room : null,
                ]}
              />
            )}
            onCellClick={
              canManage ? (day, period, slot) => setTarget({ day, period, slot }) : undefined
            }
            specials={specials.data ?? []}
            sectionId={chosen}
            onAddSpecial={canManage ? setAdding : undefined}
            onOpenSpecial={canManage ? setEditing : undefined}
          />
        </Card>
      )}
      {target && data && (
        <SlotModal timetable={data} target={target} onClose={() => setTarget(null)} />
      )}
      {adding && data && (
        <SpecialClassModal
          section={{ id: data.section.id, name: data.section.name, class_id: section?.class_id }}
          kind='special'
          prefill={adding}
          onClose={() => setAdding(null)}
        />
      )}
      {editing && (
        <SpecialClassModal
          section={{
            id: editing.section.id,
            name: editing.section.name,
            class_id: editing.class_id,
          }}
          special={editing}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  )
}
