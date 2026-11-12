import { useState } from 'react'
import { AppModal } from '@/components/common/app-modal'
import { Combobox } from '@/components/common/combobox'
import { FormField } from '@/components/common/form-field'
import { SegmentedControl } from '@/components/common/segmented-control'
import { Input } from '@/components/ui/input'
import { useSections } from '@/features/setup/api'
import { cn } from '@/lib/utils'
import type { BreakGap, SlotSide } from '../special-slots'

const HOURS = [0, 1, 2, 3, 4].map((value) => ({
  value: String(value),
  label: value === 1 ? '1 hr' : `${value} hrs`,
}))
const MINUTES = Array.from({ length: 12 }, (_, index) => index * 5).map((value) => ({
  value: String(value),
  label: `${value} min`,
}))

const BREAKS = [0, 5, 10, 15, 20, 30].map((value) => ({
  value: String(value),
  label: value ? `${value} min break` : 'No break',
}))

const lengthError = (total: number) =>
  total < 5 ? 'Make it at least 5 minutes' : total > 240 ? 'Keep it within 4 hours' : ''

const lengthText = (total: number) => {
  const hours = Math.floor(total / 60)
  const minutes = total % 60
  return (
    [hours ? `${hours} hr` : '', minutes ? `${minutes} min` : ''].filter(Boolean).join(' ') ||
    '0 min'
  )
}

function DurationField({
  id,
  label,
  value,
  error,
  onChange,
}: {
  id: string
  label: string
  value: number
  error?: string
  onChange: (minutes: number) => void
}) {
  const hours = Math.floor(value / 60)
  const minutes = value % 60
  return (
    <FormField id={id} label={label} error={error} hint={error ? undefined : lengthText(value)}>
      <div className='grid grid-cols-2 gap-2'>
        <Combobox
          id={id}
          label='Hours'
          value={String(hours)}
          placeholder='Hours'
          options={HOURS}
          onChange={(next) => onChange(Number(next ?? 0) * 60 + minutes)}
          highlightSelected={false}
          className='sm:w-full'
        />
        <Combobox
          id={`${id}-minutes`}
          label='Minutes'
          value={String(minutes - (minutes % 5))}
          placeholder='Minutes'
          options={MINUTES}
          onChange={(next) => onChange(hours * 60 + Number(next ?? 0))}
          highlightSelected={false}
          className='sm:w-full'
        />
      </div>
    </FormField>
  )
}

export function SpecialSlotModal({
  defaultName,
  firstPeriod,
  lastPeriod,
  classId,
  sectionId,
  onAdd,
  onClose,
}: {
  defaultName: string
  firstPeriod: string
  lastPeriod: string
  classId?: number
  sectionId?: number
  onAdd: (
    side: SlotSide,
    name: string,
    minutes: number,
    sectionIds: number[] | null,
    breakMinutes: number
  ) => void
  onClose: () => void
}) {
  const sections = useSections()
  const choices = (sections.data ?? []).filter((item) => !classId || item.class_id === classId)
  const [some, setSome] = useState(Boolean(sectionId))
  const [sectionIds, setSectionIds] = useState<number[]>(sectionId ? [sectionId] : [])
  const [side, setSide] = useState<SlotSide>('evening')
  const [name, setName] = useState(defaultName)
  const [minutes, setMinutes] = useState(45)
  const [lengthErr, setLengthErr] = useState('')
  const [breakMinutes, setBreakMinutes] = useState(0)
  const [error, setError] = useState('')

  return (
    <AppModal
      open
      onOpenChange={(open) => !open && onClose()}
      title='Add a special class slot'
      description='A time kept for special classes. It is not a teaching period and does not change the period numbers.'
      formId='special-slot-form'
      submitText='Add slot'
    >
      <form
        id='special-slot-form'
        noValidate
        className='grid gap-4'
        onSubmit={(event) => {
          event.preventDefault()
          if (name.trim().length < 2) return setError('Give the slot a name')
          if (some && !sectionIds.length) return setError('Choose at least one section')
          if (lengthError(minutes)) return setLengthErr(lengthError(minutes))
          if (breakMinutes && minutes - breakMinutes < 5)
            return setLengthErr('Leave at least 5 minutes for the class after the break')
          onAdd(side, name.trim(), minutes, some ? sectionIds : null, breakMinutes)
          onClose()
        }}
      >
        <FormField id='special-slot-side' label='When'>
          <SegmentedControl
            label='When'
            value={side}
            onChange={(value: SlotSide) => setSide(value)}
            options={[
              { value: 'morning', label: `Morning, before ${firstPeriod}` },
              { value: 'evening', label: `Evening, after ${lastPeriod}` },
            ]}
          />
        </FormField>
        <FormField id='special-slot-name' label='Name' required error={error}>
          <Input
            id='special-slot-name'
            value={name}
            maxLength={30}
            onChange={(event) => {
              setName(event.target.value)
              setError('')
            }}
          />
        </FormField>
        <FormField
          id='special-slot-sections'
          label='For'
          hint={some ? 'Only these sections show this slot in the timetable' : undefined}
        >
          <div className='grid gap-2.5'>
            <SegmentedControl
              label='For'
              value={some ? 'some' : 'all'}
              onChange={(value: string) => setSome(value === 'some')}
              options={[
                { value: 'all', label: 'All sections' },
                { value: 'some', label: 'Only these sections' },
              ]}
            />
            {some && (
              <div
                id='special-slot-sections'
                role='group'
                aria-label='Sections'
                className='flex max-h-40 flex-wrap gap-1.5 overflow-auto'
              >
                {choices.map((item) => {
                  const on = sectionIds.includes(item.id)
                  return (
                    <button
                      key={item.id}
                      type='button'
                      role='checkbox'
                      aria-checked={on}
                      onClick={() => {
                        setSectionIds((current) =>
                          on ? current.filter((id) => id !== item.id) : [...current, item.id]
                        )
                        setError('')
                      }}
                      className={cn(
                        'h-8 rounded-full border px-3 text-xs font-semibold',
                        on
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'text-muted-foreground'
                      )}
                    >
                      {item.class_name} - {item.name}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </FormField>
        <DurationField
          id='special-slot-length'
          label='Length'
          value={minutes}
          error={lengthErr}
          onChange={(next) => {
            setMinutes(next)
            setLengthErr('')
          }}
        />
        <FormField
          id='special-slot-break'
          label='Break with it'
          hint={
            breakMinutes
              ? side === 'morning'
                ? `Class ${lengthText(minutes - breakMinutes)}, then a ${breakMinutes} min break before the first period`
                : `A ${breakMinutes} min break after the last period, then class ${lengthText(minutes - breakMinutes)}`
              : 'The break comes out of the length, so the periods keep their times'
          }
        >
          <Combobox
            id='special-slot-break'
            label='Break with it'
            value={String(breakMinutes)}
            placeholder='No break'
            options={BREAKS}
            onChange={(next) => {
              setBreakMinutes(Number(next ?? 0))
              setLengthErr('')
            }}
            highlightSelected={false}
            className='sm:w-full'
          />
        </FormField>
      </form>
    </AppModal>
  )
}

export function SpecialBreakModal({
  gaps,
  onAdd,
  onClose,
}: {
  gaps: BreakGap[]
  onAdd: (gap: BreakGap, minutes: number) => void
  onClose: () => void
}) {
  const [chosen, setChosen] = useState(0)
  const [minutes, setMinutes] = useState(10)
  const [error, setError] = useState('')

  return (
    <AppModal
      open
      onOpenChange={(open) => !open && onClose()}
      title='Add a special class break'
      description='Choose where the break goes. The special classes move so the periods keep their times.'
      formId='special-break-form'
      submitText='Add break'
    >
      <form
        id='special-break-form'
        noValidate
        className='grid gap-4'
        onSubmit={(event) => {
          event.preventDefault()
          if (lengthError(minutes)) return setError(lengthError(minutes))
          onAdd(gaps[chosen], minutes)
          onClose()
        }}
      >
        <fieldset className='grid gap-2'>
          <legend className='mb-1 text-sm font-medium'>Where</legend>
          {gaps.map((gap, index) => (
            <label
              key={`${gap.side}-${gap.index}`}
              className={cn(
                'flex cursor-pointer items-center gap-2.5 rounded-lg border p-2.5 text-sm',
                chosen === index && 'border-primary/40 bg-primary/5'
              )}
            >
              <input
                type='radio'
                name='special-break-gap'
                className='size-4 accent-[var(--primary)]'
                checked={chosen === index}
                onChange={() => setChosen(index)}
              />
              <span className='font-medium'>{gap.label}</span>
              <span className='ml-auto text-xs text-muted-foreground'>
                {gap.side === 'morning' ? 'Morning' : 'Evening'}
              </span>
            </label>
          ))}
        </fieldset>
        <DurationField
          id='special-break-length'
          label='Length'
          value={minutes}
          error={error}
          onChange={(next) => {
            setMinutes(next)
            setError('')
          }}
        />
      </form>
    </AppModal>
  )
}
