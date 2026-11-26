import type { ReactNode } from 'react'
import { Card } from '@/components/ui/card'

export function Section({
  title,
  description,
  action,
  children,
}: {
  title: string
  description?: string
  action?: ReactNode
  children: ReactNode
}) {
  return (
    <Card className='overflow-hidden border border-[#EDF0EE] bg-white dark:border-slate-800 dark:bg-slate-900'>
      <div className='flex flex-wrap items-start justify-between gap-3 border-b border-[#EDF0EE] px-4 py-3 sm:px-5 dark:border-slate-800'>
        <div className='grid gap-0.5'>
          <h2 className='text-[14px] leading-[20px] font-bold text-slate-900 dark:text-slate-100'>{title}</h2>
          {description && <p className='text-[12px] leading-[16px] text-slate-500 dark:text-slate-400'>{description}</p>}
        </div>
        {action && <div className='flex flex-wrap gap-2'>{action}</div>}
      </div>
      <div className='p-4 sm:p-5'>{children}</div>
    </Card>
  )
}

export function RootError({ message }: { message?: string }) {
  if (!message) return null
  return (
    <p
      role='alert'
      className='rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive sm:col-span-2'
    >
      {message}
    </p>
  )
}
