import type { ReactNode } from 'react'
import { GraduationCap, type LucideIcon } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import type { PublicSchool } from '../api'

export function PublicShell({
  school,
  loading,
  children,
}: {
  school?: PublicSchool | null
  loading?: boolean
  children: ReactNode
}) {
  return (
    <div className='flex min-h-dvh flex-col bg-background'>
      <main className='mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 px-4 py-6 sm:py-10'>
        <header className='flex items-center gap-3'>
          {loading ? (
            <>
              <Skeleton className='size-12 rounded-xl' />
              <Skeleton className='h-6 w-48' />
            </>
          ) : (
            <>
              {school?.logo_url ? (
                <img
                  src={school.logo_url}
                  alt=''
                  className='size-12 shrink-0 rounded-xl border bg-card object-contain p-1'
                />
              ) : (
                <span className='grid size-12 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary'>
                  <GraduationCap className='size-6' />
                </span>
              )}
              <div className='grid min-w-0'>
                <span className='text-[11px] font-bold tracking-[0.14em] text-primary uppercase'>
                  Alumni
                </span>
                <span className='truncate text-lg font-extrabold tracking-tight'>
                  {school?.name ?? 'School alumni'}
                </span>
              </div>
            </>
          )}
        </header>
        <Card className='gap-5 p-4 sm:p-6'>{children}</Card>
        <p className='text-center text-xs text-muted-foreground'>
          Your details are shared only with the school.
        </p>
      </main>
    </div>
  )
}

export function PublicMessage({
  icon: Icon,
  title,
  description,
  tone = 'primary',
}: {
  icon: LucideIcon
  title: string
  description: ReactNode
  tone?: 'primary' | 'success' | 'warning' | 'danger'
}) {
  const tones = {
    primary: 'bg-primary/10 text-primary',
    success: 'bg-success/10 text-success',
    warning: 'bg-warning/10 text-warning',
    danger: 'bg-destructive/10 text-destructive',
  }
  return (
    <div className='flex flex-col items-center gap-3 py-6 text-center'>
      <span className={`grid size-14 place-items-center rounded-full ${tones[tone]}`}>
        <Icon className='size-6' />
      </span>
      <h1 className='text-xl font-extrabold tracking-tight'>{title}</h1>
      <p className='max-w-md text-sm text-muted-foreground'>{description}</p>
    </div>
  )
}

export function Honeypot({
  value,
  onChange,
}: {
  value: string
  onChange: (value: string) => void
}) {
  return (
    <div aria-hidden className='absolute -left-[10000px] size-px overflow-hidden'>
      <label htmlFor='website'>Website</label>
      <input
        id='website'
        name='website'
        type='text'
        tabIndex={-1}
        autoComplete='off'
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  )
}
