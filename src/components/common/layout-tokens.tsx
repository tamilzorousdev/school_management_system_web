import * as React from 'react'
import { cn } from '@/lib/utils'

/* -------------------------------------------------------------------------- */
/*                      1. PAGE CONTAINER (1472 x 824)                        */
/* -------------------------------------------------------------------------- */

export interface PageCanvasProps extends React.ComponentProps<'div'> {
  asCard?: boolean
}

/**
 * Standard Figma Page Canvas Token:
 * width: 1472; height: 824; gap: 24px; padding: 32px; border-radius: radius/lg;
 */
export function PageCanvas({
  asCard = false,
  className,
  children,
  ...props
}: PageCanvasProps) {
  return (
    <div
      data-slot="page-canvas"
      className={cn(
        'mx-auto flex w-full max-w-[1472px] min-h-[824px] flex-col gap-6 p-8 transition-colors',
        asCard && 'rounded-xl border border-[#DFE4E1] bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*                      2. METRIC BADGE / ACTION PILL (73 x 42)               */
/* -------------------------------------------------------------------------- */

export interface MetricBadgeProps extends React.ComponentProps<'div'> {
  label?: React.ReactNode
  value?: React.ReactNode
  icon?: React.ReactNode
}

/**
 * Standard Figma Metric/Action Badge Token:
 * width: 73; height: 42; gap: 6;
 */
export function MetricBadge({
  label,
  value,
  icon,
  className,
  children,
  ...props
}: MetricBadgeProps) {
  return (
    <div
      data-slot="metric-badge"
      className={cn(
        'inline-flex h-[42px] w-[73px] shrink-0 items-center justify-center gap-1.5 rounded-md border border-[#DFE4E1] bg-white px-2 py-1 shadow-2xs transition-colors dark:border-slate-800 dark:bg-slate-900',
        className
      )}
      {...props}
    >
      {children ?? (
        <>
          {icon && <span className="size-3.5 text-[#127D48]">{icon}</span>}
          <div className="flex flex-col items-center leading-none">
            {value && <span className="text-xs font-bold text-[#0F1A15]">{value}</span>}
            {label && <span className="text-[10px] text-[#5A6A62]">{label}</span>}
          </div>
        </>
      )}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*                      3. SIDEBAR ITEM (216 x 44)                            */
/* -------------------------------------------------------------------------- */

export interface SidebarNavItemProps extends React.ComponentProps<'div'> {
  icon?: React.ReactNode
  label: React.ReactNode
  active?: boolean
  badge?: React.ReactNode
}

/**
 * Standard Figma Sidebar Navigation Item Token:
 * width: 216; height: 44; gap: 12; padding: space/12 (12px); border-radius: radius/md; background: var(--bg-sidebar, #083419);
 */
export function SidebarNavItem({
  icon,
  label,
  active = false,
  badge,
  className,
  ...props
}: SidebarNavItemProps) {
  return (
    <div
      data-slot="sidebar-nav-item"
      data-active={active || undefined}
      className={cn(
        'group relative flex h-[44px] w-[216px] items-center gap-3 rounded-md px-3 text-sm font-semibold transition-colors outline-none cursor-pointer select-none',
        'bg-[var(--bg-sidebar,#083419)] text-[#C9D6CF] hover:text-white hover:bg-white/10',
        active && 'bg-white/15 text-white',
        className
      )}
      {...props}
    >
      {active && (
        <span className="absolute left-0 top-2.5 bottom-2.5 w-1 rounded-r-full bg-[#2BC275]" />
      )}
      {icon && (
        <span className={cn('size-5 shrink-0 text-[#C9D6CF] group-hover:text-white', active && 'text-[#2BC275]')}>
          {icon}
        </span>
      )}
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {badge && <span className="shrink-0">{badge}</span>}
    </div>
  )
}
