import * as React from 'react'
import { cn } from '@/lib/utils'
import { DatePicker } from '@/components/common/date-picker'
import { TimePicker } from '@/components/common/time-picker'

const fieldBase =
  'w-full min-w-0 rounded-md border border-input bg-card px-3 text-sm shadow-xs transition-[color,box-shadow] outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20'

export interface InputProps extends Omit<React.ComponentProps<'input'>, 'size'> {
  size?: 'default' | 'sm'
}

export function Input({ className, type = 'text', size = 'default', ...props }: InputProps) {
  if (type === 'date') {
    return (
      <DatePicker
        id={props.id}
        name={props.name}
        value={
          typeof props.value === 'string'
            ? props.value
            : props.value !== undefined
              ? String(props.value)
              : undefined
        }
        defaultValue={
          typeof props.defaultValue === 'string'
            ? props.defaultValue
            : props.defaultValue !== undefined
              ? String(props.defaultValue)
              : undefined
        }
        min={typeof props.min === 'string' ? props.min : undefined}
        max={typeof props.max === 'string' ? props.max : undefined}
        placeholder={props.placeholder || 'dd-mm-yyyy'}
        disabled={props.disabled}
        required={props.required}
        invalid={props['aria-invalid'] === true || props['aria-invalid'] === 'true'}
        size={size}
        className={className}
        onChange={(_val, event) => {
          if (props.onChange && event) {
            props.onChange(event as React.ChangeEvent<HTMLInputElement>)
          }
        }}
      />
    )
  }

  if (type === 'time') {
    return (
      <TimePicker
        id={props.id}
        name={props.name}
        value={typeof props.value === 'string' ? props.value : ''}
        placeholder={props.placeholder}
        disabled={props.disabled}
        required={props.required}
        invalid={props['aria-invalid'] === true || props['aria-invalid'] === 'true'}
        className={className}
        onChange={(next) => {
          const target = { value: next, id: props.id ?? '', name: props.name ?? '' }
          props.onChange?.({ target, currentTarget: target } as React.ChangeEvent<HTMLInputElement>)
        }}
      />
    )
  }

  return (
    <input
      type={type}
      data-slot='input'
      className={cn(fieldBase, size === 'sm' ? 'h-8 text-[13px]' : 'h-9 text-sm', className)}
      {...props}
    />
  )
}

export function Textarea({ className, ...props }: React.ComponentProps<'textarea'>) {
  return (
    <textarea
      data-slot='textarea'
      className={cn(fieldBase, 'min-h-20 py-2 leading-relaxed', className)}
      {...props}
    />
  )
}

export function Label({ className, ...props }: React.ComponentProps<'label'>) {
  return (
    <label
      data-slot='label'
      className={cn('text-xs font-semibold text-foreground select-none', className)}
      {...props}
    />
  )
}
