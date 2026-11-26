import * as React from 'react'
import {
  Plus,
  Save,
  PenLine,
  Play,
  Trash,
  Download,
  Filter,
  ChevronDown,
  Copy,
  Printer,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button, type ButtonProps } from '@/components/ui/button'
import { IconButton, type IconButtonProps } from '@/components/ui/icon-button'

export { Button, IconButton }
export type { ButtonProps, IconButtonProps }

/* -------------------------------------------------------------------------- */
/*                                1. CREATE                                   */
/* -------------------------------------------------------------------------- */

export interface CreateButtonProps extends ButtonProps {
  label?: React.ReactNode
}

/**
 * Standard Primary Action Button with Plus leading icon.
 * Used for creating entities, adding rules, etc.
 */
export function CreateButton({
  children,
  label = 'Create',
  variant = 'primary',
  leadingIcon = <Plus className="size-4" />,
  ...props
}: CreateButtonProps) {
  return (
    <Button variant={variant} leadingIcon={leadingIcon} {...props}>
      {children ?? label}
    </Button>
  )
}

export function CreateTicketButton(props: CreateButtonProps) {
  return <CreateButton label="Create ticket" {...props} />
}

export function CreateUserButton(props: CreateButtonProps) {
  return <CreateButton label="Create user" {...props} />
}

export function AddRuleButton(props: CreateButtonProps) {
  return <CreateButton label="Add rule" {...props} />
}

/* -------------------------------------------------------------------------- */
/*                                 2. SAVE                                    */
/* -------------------------------------------------------------------------- */

export interface SaveButtonProps extends ButtonProps {
  label?: React.ReactNode
}

/**
 * Standard Primary Save Action Button with Save leading icon and "Saving" loading state.
 */
export function SaveButton({
  children,
  label = 'Save changes',
  loadingText = 'Saving',
  variant = 'primary',
  leadingIcon = <Save className="size-4" />,
  ...props
}: SaveButtonProps) {
  return (
    <Button variant={variant} leadingIcon={leadingIcon} loadingText={loadingText} {...props}>
      {children ?? label}
    </Button>
  )
}

/* -------------------------------------------------------------------------- */
/*                                 3. EDIT                                    */
/* -------------------------------------------------------------------------- */

export interface EditButtonProps extends ButtonProps {
  label?: React.ReactNode
}

/**
 * Standard Secondary Edit Action Button with PenLine leading icon (Figma Spec).
 */
export function EditButton({
  children,
  label = 'Edit',
  variant = 'secondary',
  size = 'md',
  leadingIcon = <PenLine className="size-4 stroke-[1.75] text-[#3C4440] dark:text-slate-300" />,
  className,
  ...props
}: EditButtonProps) {
  return (
    <Button
      variant={variant}
      size={size}
      leadingIcon={leadingIcon}
      className={cn(
        'w-[85px] h-9 px-4 gap-2 font-medium border border-[#C6CEC9] bg-white text-[#171B19] hover:bg-[#F9FAFB]',
        className
      )}
      {...props}
    >
      {children ?? label}
    </Button>
  )
}

/* -------------------------------------------------------------------------- */
/*                                4. CANCEL                                   */
/* -------------------------------------------------------------------------- */

export interface CancelButtonProps extends ButtonProps {
  label?: React.ReactNode
}

/**
 * Standard Secondary Cancel Action Button (no icon).
 */
export function CancelButton({
  children,
  label = 'Cancel',
  variant = 'secondary',
  ...props
}: CancelButtonProps) {
  return (
    <Button variant={variant} {...props}>
      {children ?? label}
    </Button>
  )
}

/* -------------------------------------------------------------------------- */
/*                             5. TEST WORKFLOW                               */
/* -------------------------------------------------------------------------- */

export interface TestWorkflowButtonProps extends ButtonProps {
  label?: React.ReactNode
}

/**
 * Standard Tertiary Action Button (#EAF7F0 subtle green) with Play leading icon.
 */
export function TestWorkflowButton({
  children,
  label = 'Test workflow',
  variant = 'tertiary',
  leadingIcon = <Play className="size-4" />,
  ...props
}: TestWorkflowButtonProps) {
  return (
    <Button variant={variant} leadingIcon={leadingIcon} {...props}>
      {children ?? label}
    </Button>
  )
}

/* -------------------------------------------------------------------------- */
/*                                6. DELETE                                   */
/* -------------------------------------------------------------------------- */

export interface DeleteButtonProps extends ButtonProps {
  label?: React.ReactNode
}

/**
 * Standard Destructive Action Button (#D92D20 danger red) with Trash2 leading icon.
 */
export function DeleteButton({
  children,
  label = 'Delete',
  variant = 'destructive',
  leadingIcon = <Trash className="size-4 stroke-[1.75]" />,
  ...props
}: DeleteButtonProps) {
  return (
    <Button variant={variant} leadingIcon={leadingIcon} {...props}>
      {children ?? label}
    </Button>
  )
}

/* -------------------------------------------------------------------------- */
/*                                7. EXPORT                                   */
/* -------------------------------------------------------------------------- */

export interface ExportButtonProps extends ButtonProps {
  label?: React.ReactNode
}

/**
 * Standard Secondary Export Action Button with Download leading icon.
 */
export function ExportButton({
  children,
  label = 'Export',
  variant = 'secondary',
  leadingIcon = <Download className="size-4" />,
  ...props
}: ExportButtonProps) {
  return (
    <Button variant={variant} leadingIcon={leadingIcon} {...props}>
      {children ?? label}
    </Button>
  )
}

/* -------------------------------------------------------------------------- */
/*                                8. FILTERS                                  */
/* -------------------------------------------------------------------------- */

export interface FilterButtonProps extends ButtonProps {
  label?: React.ReactNode
  activeCount?: number
}

/**
 * Standard Secondary Filter Button with Filter leading icon and ChevronDown trailing icon.
 * Optionally displays active filter badge count.
 */
export function FilterButton({
  children,
  label = 'Filters',
  variant = 'secondary',
  leadingIcon = <Filter className="size-4" />,
  trailingIcon = <ChevronDown className="size-4" />,
  activeCount,
  ...props
}: FilterButtonProps) {
  return (
    <Button variant={variant} leadingIcon={leadingIcon} trailingIcon={trailingIcon} {...props}>
      {children ?? (
        <>
          <span>{label}</span>
          {typeof activeCount === 'number' && activeCount > 0 && (
            <span className="ml-1 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold text-primary">
              {activeCount}
            </span>
          )}
        </>
      )}
    </Button>
  )
}

/* -------------------------------------------------------------------------- */
/*                               9. DUPLICATE                                 */
/* -------------------------------------------------------------------------- */

export interface DuplicateButtonProps extends ButtonProps {
  label?: React.ReactNode
}

/**
 * Standard Text (Ghost) Action Button with Copy leading icon.
 */
export function DuplicateButton({
  children,
  label = 'Duplicate',
  variant = 'text',
  leadingIcon = <Copy className="size-4" />,
  ...props
}: DuplicateButtonProps) {
  return (
    <Button variant={variant} leadingIcon={leadingIcon} {...props}>
      {children ?? label}
    </Button>
  )
}

/* -------------------------------------------------------------------------- */
/*                               10. DOWNLOAD                                 */
/* -------------------------------------------------------------------------- */

export interface DownloadButtonProps extends ButtonProps {
  label?: React.ReactNode
}

/**
 * Standard Secondary Download Action Button matching Figma specs (w: 134px, h: 36px, gap: 8px, px: 16px).
 */
export function DownloadButton({
  children,
  label = 'Download PDF',
  variant = 'outline',
  leadingIcon = <Download className="size-4" />,
  className,
  ...props
}: DownloadButtonProps) {
  return (
    <Button
      variant={variant}
      leadingIcon={leadingIcon}
      className={cn(
        'h-9 w-[134px] px-4 gap-2 font-medium border-[#C6CEC9] bg-white text-[#171B19] hover:bg-[#F9FAFB] dark:bg-card dark:text-foreground dark:border-border',
        className
      )}
      {...props}
    >
      {children ?? label}
    </Button>
  )
}

/* -------------------------------------------------------------------------- */
/*                                11. PRINT                                   */
/* -------------------------------------------------------------------------- */

export interface PrintButtonProps extends ButtonProps {
  label?: React.ReactNode
}

/**
 * Standard Primary Print Action Button matching Figma specs (w: 112px, h: 36px, gap: 8px, px: 16px).
 */
export function PrintButton({
  children,
  label = 'Print',
  variant = 'primary',
  leadingIcon = <Printer className="size-4" />,
  className,
  ...props
}: PrintButtonProps) {
  return (
    <Button
      variant={variant}
      leadingIcon={leadingIcon}
      className={cn('h-9 w-[112px] px-4 gap-2 font-medium', className)}
      {...props}
    >
      {children ?? label}
    </Button>
  )
}
