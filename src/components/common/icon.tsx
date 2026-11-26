import * as React from 'react'
import { cn } from '@/lib/utils'
import { iconSizes, iconColors, type IconSize, type IconColor } from './icon-tokens'

export type { IconSize, IconColor }

export interface IconTileProps extends React.ComponentProps<'div'> {
  icon: React.ReactNode
  size?: IconSize
  color?: IconColor
}

/**
 * Standard Figma 50x50px Icon Tile Box.
 * Token: width: 50; height: 50; padding: 14px; border-radius: radius/md; border: 1px solid var(--border-default, #DFE4E1); background: var(--bg-surface, #FFFFFF);
 */
export function IconTile({
  icon,
  size = 'md',
  color = 'primary',
  className,
  ...props
}: IconTileProps) {
  const sizeClass = iconSizes[String(size)] || 'size-5'
  const colorClass = iconColors[color] || 'text-[#344054]'

  return (
    <div
      data-slot="icon-tile"
      className={cn(
        'flex size-[50px] shrink-0 items-center justify-center rounded-md border border-[#DFE4E1] bg-white p-[14px] shadow-2xs transition-colors',
        className
      )}
      {...props}
    >
      <div className={cn('flex items-center justify-center', sizeClass, colorClass)}>
        {icon}
      </div>
    </div>
  )
}
