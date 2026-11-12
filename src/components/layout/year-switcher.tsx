import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Combobox } from '@/components/common/combobox'
import { useAcademicYears } from '@/features/setup/api'
import { yearContext, useViewingYear } from '@/lib/auth/year-context'

export function YearSwitcher() {
  const queryClient = useQueryClient()
  const viewing = useViewingYear()
  const years = useAcademicYears()
  const items = [...(years.data ?? [])].sort((a, b) => b.start_date.localeCompare(a.start_date))
  const current = items.find((year) => year.is_current)
  const chosen = items.find((year) => year.id === viewing)

  useEffect(() => {
    if (!years.data || viewing === null) return
    if (!chosen || chosen.is_current) {
      yearContext.set(null)
      void queryClient.invalidateQueries()
    }
  }, [years.data, viewing, chosen, queryClient])

  if (!current) return null

  return (
    <div className='grid gap-1'>
      <span className='px-0.5 text-[10px] font-bold tracking-[0.14em] text-sidebar-muted uppercase'>
        Academic year
      </span>
      <Combobox
        id='year-switcher'
        label='Choose academic year'
        value={String(chosen?.id ?? current.id)}
        placeholder='Choose a year'
        searchPlaceholder='Search years'
        options={items.map((year) => ({
          value: String(year.id),
          label: year.name,
          hint: year.is_current ? 'Current' : 'Read only',
        }))}
        onChange={(value) => {
          if (!value) return
          const id = Number(value)
          yearContext.set(id === current.id ? null : id)
          void queryClient.invalidateQueries()
        }}
        highlightSelected={false}
        className='h-auto border-sidebar-border bg-white/[0.04] py-2 text-xs font-bold text-sidebar-accent-foreground sm:w-full'
      />
    </div>
  )
}

export function PastYearBanner() {
  const queryClient = useQueryClient()
  const viewing = useViewingYear()
  const years = useAcademicYears()
  const chosen = years.data?.find((year) => year.id === viewing && !year.is_current)
  if (!chosen) return null

  return (
    <div
      role='status'
      className='flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-amber-300 bg-amber-50 px-4 py-2 text-sm text-amber-900 sm:px-6 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-100'
    >
      <span>
        Viewing <strong>{chosen.name}</strong>. Earlier years are read only.
      </span>
      <button
        type='button'
        className='font-semibold underline underline-offset-2'
        onClick={() => {
          yearContext.set(null)
          void queryClient.invalidateQueries()
        }}
      >
        Back to current year
      </button>
    </div>
  )
}
