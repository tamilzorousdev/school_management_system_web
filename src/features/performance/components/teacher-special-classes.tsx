import { Badge } from '@/components/ui/badge'
import { useSpecialClasses } from '../api'

export function TeacherSpecialClasses({ userId }: { userId: number }) {
  const specials = useSpecialClasses({ teacher_user_id: userId })
  const rows = specials.data ?? []
  if (!rows.length) {
    return (
      <p className='text-sm text-muted-foreground'>
        No special or extra classes. Add them in Class performance.
      </p>
    )
  }
  return (
    <ul className='grid gap-2'>
      {rows.map((row) => (
        <li key={row.id} className='grid gap-0.5 rounded-lg border px-3 py-2'>
          <span className='flex flex-wrap items-center gap-1.5'>
            <Badge tone={row.kind === 'special' ? 'info' : 'warning'}>
              {row.kind === 'special' ? 'Special' : 'Extra'}
            </Badge>
            <span className='text-sm font-semibold'>{row.title}</span>
          </span>
          <span className='text-xs text-muted-foreground'>
            {row.section.name} · {row.when} · {row.students.length}{' '}
            {row.students.length === 1 ? 'student' : 'students'}
          </span>
        </li>
      ))}
    </ul>
  )
}
