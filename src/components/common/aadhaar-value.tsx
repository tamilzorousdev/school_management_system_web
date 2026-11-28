import { Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

const groupDigits = (value: string) => value.replace(/(\d{4})(?=\d)/g, '$1 ')

export function AadhaarValue({
  masked,
  canReveal,
  shown,
  loading,
  revealed,
  onToggle,
}: {
  masked: string | null
  canReveal: boolean
  shown: boolean
  loading: boolean
  revealed?: string | null
  onToggle: () => void
}) {
  if (!masked) return <>—</>
  return (
    <span className='inline-flex flex-wrap items-center gap-2'>
      {shown && loading ? (
        <Skeleton className='h-5 w-32' />
      ) : (
        <span className='font-mono'>{shown && revealed ? groupDigits(revealed) : masked}</span>
      )}
      {canReveal && (
        <Button
          type='button'
          variant='ghost'
          size='sm'
          className='h-6 gap-1 px-1.5 text-xs'
          onClick={onToggle}
        >
          {shown ? <EyeOff className='size-3.5' /> : <Eye className='size-3.5' />}
          {shown ? 'Hide' : 'Show'}
        </Button>
      )}
    </span>
  )
}
