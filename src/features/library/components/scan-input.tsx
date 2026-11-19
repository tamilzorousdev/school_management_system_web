import { useEffect, useRef, useState } from 'react'
import { Loader2, ScanBarcode } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface ScanInputProps {
  id: string
  label: string
  onScan: (code: string) => void | Promise<void>
  placeholder?: string
  hint?: string
  busy?: boolean
  autoFocus?: boolean
  size?: 'default' | 'lg'
  className?: string
}

export function ScanInput({
  id,
  label,
  onScan,
  placeholder = 'Scan or type, then press Enter',
  hint = 'Scan or type',
  busy = false,
  autoFocus = true,
  size = 'default',
  className,
}: ScanInputProps) {
  const ref = useRef<HTMLInputElement>(null)
  const [value, setValue] = useState('')

  useEffect(() => {
    if (autoFocus) ref.current?.focus()
  }, [autoFocus])

  const submit = async () => {
    const code = value.trim()
    if (!code) return
    setValue('')
    try {
      await onScan(code)
    } finally {
      ref.current?.focus()
    }
  }

  return (
    <div className={cn('grid gap-1', className)}>
      <label htmlFor={id} className='sr-only'>
        {label}
      </label>
      <div className='relative'>
        {busy ? (
          <Loader2 className='pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 animate-spin text-muted-foreground' />
        ) : (
          <ScanBarcode className='pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground' />
        )}
        <Input
          ref={ref}
          id={id}
          value={value}
          autoComplete='off'
          spellCheck={false}
          placeholder={placeholder}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault()
              void submit()
            }
          }}
          className={cn('pl-9 font-mono', size === 'lg' && 'h-12 text-base')}
        />
      </div>
      <span className='text-[11px] text-muted-foreground'>{hint}</span>
    </div>
  )
}
