import { Combobox } from '@/components/common/combobox'
import { cn } from '@/lib/utils'
import { useFloors } from '../api'
import { floorLevelLabel } from './setup-helpers'

const MAX_DOTS = 12

export function BedDots({
  capacity,
  occupied,
  vacant,
}: {
  capacity: number
  occupied: number
  vacant: number
}) {
  const other = Math.max(0, capacity - occupied - vacant)
  const label = `${occupied} of ${capacity} beds in use, ${vacant} vacant`
  return (
    <span className='inline-flex items-center gap-2' title={label}>
      {capacity <= MAX_DOTS && (
        <span className='flex flex-wrap gap-1' aria-hidden>
          {Array.from({ length: capacity }, (_, index) => (
            <span
              key={index}
              className={cn(
                'size-2.5 rounded-full',
                index < occupied
                  ? 'bg-info'
                  : index < occupied + vacant
                    ? 'border border-success bg-success/15'
                    : 'bg-muted-foreground/30'
              )}
            />
          ))}
        </span>
      )}
      <span className='tabular text-xs text-muted-foreground'>
        <span className='sr-only'>{label}</span>
        <span aria-hidden>
          {occupied}/{capacity}
          {other > 0 ? ` · ${other} off` : ''}
        </span>
      </span>
    </span>
  )
}

export function FloorSelect({
  id,
  blockId,
  value,
  onChange,
  invalid,
}: {
  id: string
  blockId?: number
  value?: string
  onChange: (value: string | undefined) => void
  invalid?: boolean
}) {
  const floors = useFloors(blockId, Boolean(blockId))
  const options = (floors.data ?? []).map((floor) => ({
    value: String(floor.id),
    label: floor.name,
    hint: `${floorLevelLabel(floor.level)} · ${floor.room_count} rooms`,
  }))
  return (
    <Combobox
      id={id}
      label='Floor'
      value={value}
      options={options}
      placeholder={blockId ? 'Choose floor' : 'Choose a block first'}
      emptyText={
        !blockId ? 'Choose a block first' : floors.isPending ? 'Loading…' : 'No floors yet'
      }
      invalid={invalid}
      highlightSelected={false}
      className='sm:w-full'
      onChange={onChange}
    />
  )
}
