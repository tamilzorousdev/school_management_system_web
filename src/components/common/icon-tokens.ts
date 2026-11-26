export type IconSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 12 | 16 | 20 | 24 | 32
export type IconColor =
  | 'primary'
  | 'secondary'
  | 'brand'
  | 'success'
  | 'warning'
  | 'error'
  | 'info'
  | 'accent'
  | 'disabled'
  | 'on-sidebar'
  | 'on-brand'

export const iconSizes: Record<string, string> = {
  xs: 'size-3', // 12px
  sm: 'size-4', // 16px
  md: 'size-5', // 20px
  lg: 'size-6', // 24px
  xl: 'size-8', // 32px
  '12': 'size-3',
  '16': 'size-4',
  '20': 'size-5',
  '24': 'size-6',
  '32': 'size-8',
}

export const iconColors: Record<IconColor, string> = {
  primary: 'text-[#344054]',
  secondary: 'text-[#667085]',
  brand: 'text-[#127D48]',
  success: 'text-[#127D48]',
  warning: 'text-[#F79009]',
  error: 'text-[#D92D20]',
  info: 'text-[#1570EF]',
  accent: 'text-[#7F56D9]',
  disabled: 'text-[#D0D5DD]',
  'on-sidebar': 'text-white',
  'on-brand': 'text-white',
}

export function getIconClass(size: IconSize = 'md', color: IconColor = 'primary'): string {
  const sizeClass = iconSizes[String(size)] || 'size-5'
  const colorClass = iconColors[color] || 'text-[#344054]'
  return `shrink-0 transition-colors ${sizeClass} ${colorClass}`
}
