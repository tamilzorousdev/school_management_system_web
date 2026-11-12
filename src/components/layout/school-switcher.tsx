import { useQueryClient } from '@tanstack/react-query'
import { Combobox } from '@/components/common/combobox'
import { useSchoolOptions } from '@/features/schools/api'
import { schoolContext, useSelectedSchool } from '@/lib/auth/school-context'
import { yearContext } from '@/lib/auth/year-context'

export function SchoolSwitcher() {
  const queryClient = useQueryClient()
  const selected = useSelectedSchool()
  const schools = useSchoolOptions(true)
  const items = schools.data?.items ?? []

  return (
    <div className='grid gap-1'>
      <span className='px-0.5 text-[10px] font-bold tracking-[0.14em] text-sidebar-muted uppercase'>
        Working on
      </span>
      <Combobox
        id='school-switcher'
        label='Choose school'
        value={selected ? String(selected) : undefined}
        placeholder={schools.isPending ? 'Loading schools' : 'Choose a school'}
        searchPlaceholder='Search schools'
        options={items.map((school) => ({
          value: String(school.id),
          label: school.name,
          hint: school.code,
        }))}
        onChange={(value) => {
          if (!value) return
          schoolContext.set(Number(value))
          yearContext.set(null)
          void queryClient.invalidateQueries()
        }}
        highlightSelected={false}
        className='h-auto border-sidebar-border bg-white/[0.04] py-2 text-xs font-bold text-sidebar-accent-foreground sm:w-full'
      />
    </div>
  )
}
