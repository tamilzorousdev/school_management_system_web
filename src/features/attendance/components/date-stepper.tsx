import { ChevronLeft, ChevronRight } from 'lucide-react'
import { DatePicker } from '@/components/common/date-picker'
import { shiftDate, today, weekdayOf } from '../labels'

export function DateStepper({
  id,
  value,
  onChange,
  allowFuture = false,
}: {
  id: string
  value: string
  onChange: (value: string) => void
  allowFuture?: boolean
}) {
  const now = today()
  const max = allowFuture ? undefined : now
  return (
    <div className='flex flex-wrap items-center gap-2.5'>
      <div className='flex items-center gap-1.5'>
        <button
          type='button'
          aria-label='Previous day'
          onClick={() => onChange(shiftDate(value, -1))}
          className='flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-xs transition-colors hover:bg-slate-50 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'
        >
          <ChevronLeft className='size-4' />
        </button>

        <DatePicker
          id={id}
          value={value}
          max={max}
          onChange={(newVal: string) => onChange(newVal || now)}
          clearable
          className='w-44 h-9'
        />

        <button
          type='button'
          aria-label='Next day'
          disabled={max !== undefined && value >= max}
          onClick={() => onChange(shiftDate(value, 1))}
          className='flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-xs transition-colors hover:bg-slate-50 hover:text-slate-900 disabled:pointer-events-none disabled:opacity-40 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'
        >
          <ChevronRight className='size-4' />
        </button>
      </div>

      <span className='text-[13px] font-medium text-slate-600 dark:text-slate-400 table-typography'>
        {weekdayOf(value)}
      </span>
    </div>
  )
}
