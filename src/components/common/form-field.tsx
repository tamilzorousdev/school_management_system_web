import * as React from 'react'
import { Label } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface FormFieldProps {
  id: string
  label: string
  error?: string
  hint?: React.ReactNode
  required?: boolean
  className?: string
  children: React.ReactNode
}

export function FormField({
  id,
  label,
  error,
  hint,
  required,
  className,
  children,
}: FormFieldProps) {
  return (
    <div className={cn('grid content-start gap-2', className)}>
      <Label htmlFor={id}>
        {label}
        {required && <span className='ml-0.5 text-destructive'>*</span>}
      </Label>
      {children}
      {error ? (
        <p id={`${id}-error`} role='alert' className='text-xs font-medium text-destructive'>
          {error}
        </p>
      ) : (
        hint && <p className='text-xs text-muted-foreground'>{hint}</p>
      )}
    </div>
  )
}
