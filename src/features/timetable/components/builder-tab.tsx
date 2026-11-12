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
import { useSectionTimetable } from '../api'
import { SlotModal, type SlotTarget } from './slot-modal'
import { SlotContent, WeekGrid } from './week-grid'

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
  const data = timetable.data

  useShortcut('app.refresh', () => void timetable.refetch())

  const options = (sections.data ?? []).map((section) => ({
    value: String(section.id),
    label: `${section.class_name} - ${section.name}`,
    hint: section.room ?? undefined,
  }))

  return (
    <div className='grid gap-4'>
      <div className='flex flex-wrap items-center gap-2'>
        <Combobox
          id='timetable-section'
          label='Section'
          value={chosen ? String(chosen) : undefined}
          placeholder='Choose section'
          searchPlaceholder='Search sections'
          options={options}
          onChange={(value) => value && onSectionChange(Number(value))}
          highlightSelected={false}
        />
        {data?.room && <Badge tone='neutral'>Room {data.room}</Badge>}
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
                ? 'Click a period to set the subject'
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
          />
        </Card>
      )}
      {target && data && (
        <SlotModal timetable={data} target={target} onClose={() => setTarget(null)} />
      )}
    </div>
  )
}
