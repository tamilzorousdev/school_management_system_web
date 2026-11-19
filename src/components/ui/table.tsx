import * as React from 'react'
import { cn } from '@/lib/utils'

export function Table({ className, ...props }: React.ComponentProps<'table'>) {
  return (
    <div className='relative w-full overflow-x-auto'>
      <table className={cn('w-full caption-bottom text-[13px] leading-[18px] table-typography', className)} {...props} />
    </div>
  )
}

export function TableHeader({ className, ...props }: React.ComponentProps<'thead'>) {
  return (
    <thead
      className={cn(
        'bg-[#F8FAFC] border-b border-[#F1F5F9] dark:bg-slate-900/60 dark:border-slate-800 [&_tr]:border-0',
        className
      )}
      {...props}
    />
  )
}

export function TableBody({ className, ...props }: React.ComponentProps<'tbody'>) {
  return <tbody className={cn('[&_tr:last-child]:border-0', className)} {...props} />
}

export function TableRow({ className, ...props }: React.ComponentProps<'tr'>) {
  return (
    <tr
      className={cn(
        'border-b border-[#F1F5F9] transition-colors hover:bg-[#F8FAFC]/90 data-[active=true]:bg-[#ECFDF5]/50 data-[state=selected]:bg-[#ECFDF5]/60 dark:border-slate-800/80 dark:hover:bg-slate-850/50 dark:data-[active=true]:bg-emerald-950/20 dark:data-[state=selected]:bg-emerald-950/30',
        className
      )}
      {...props}
    />
  )
}

export function TableHead({ className, ...props }: React.ComponentProps<'th'>) {
  return (
    <th
      className={cn(
        'h-11 px-4 text-left align-middle text-[11px] font-semibold tracking-wider whitespace-nowrap text-[#64748B] uppercase dark:text-slate-400 select-none',
        className
      )}
      {...props}
    />
  )
}

export function TableCell({ className, ...props }: React.ComponentProps<'td'>) {
  return (
    <td
      className={cn('px-4 py-3 align-middle text-[13px] leading-[18px] text-slate-700 dark:text-slate-300', className)}
      {...props}
    />
  )
}
