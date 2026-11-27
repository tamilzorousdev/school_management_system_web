import { Undo2, X } from 'lucide-react'
import { Combobox } from '@/components/common/combobox'
import { FormField } from '@/components/common/form-field'
import { Input } from '@/components/ui/input'
import {
  COMMUNITY_OPTIONS,
  RELIGION_OPTIONS,
  type Community,
  type IdentityDraft,
  type Religion,
} from '@/lib/identity'
import { cn } from '@/lib/utils'

export function IdentityFields({
  idPrefix,
  value,
  onChange,
  errors,
  savedAadhaar,
  size,
  inputClassName = 'sm:w-full',
}: {
  idPrefix: string
  value: IdentityDraft
  onChange: <K extends keyof IdentityDraft>(field: K, next: IdentityDraft[K]) => void
  errors: Record<string, string | undefined>
  savedAadhaar?: string | null
  size?: 'default' | 'sm'
  inputClassName?: string
}) {
  const id = (field: string) => `${idPrefix}-${field}`
  const text = (
    field: 'caste' | 'nationality' | 'mother_tongue' | 'community_certificate_no',
    label: string,
    maxLength: number,
    placeholder: string
  ) => (
    <FormField id={id(field)} label={label} error={errors[field]}>
      <Input
        id={id(field)}
        size={size}
        maxLength={maxLength}
        placeholder={placeholder}
        className={inputClassName}
        value={value[field]}
        onChange={(event) => onChange(field, event.target.value)}
      />
    </FormField>
  )
  const aadhaarHint = value.remove_aadhaar ? (
    <span className='inline-flex flex-wrap items-center gap-1.5'>
      Saved number will be removed.
      <button
        type='button'
        className='inline-flex items-center gap-1 font-semibold text-primary hover:underline'
        onClick={() => onChange('remove_aadhaar', false)}
      >
        <Undo2 className='size-3' />
        Keep it
      </button>
    </span>
  ) : savedAadhaar ? (
    <span className='inline-flex flex-wrap items-center gap-1.5'>
      Saved: <span className='font-mono'>{savedAadhaar}</span>, type a new number to replace.
      <button
        type='button'
        className='inline-flex items-center gap-1 font-semibold text-destructive hover:underline'
        onClick={() => {
          onChange('aadhaar_no', '')
          onChange('remove_aadhaar', true)
        }}
      >
        <X className='size-3' />
        Remove Aadhaar
      </button>
    </span>
  ) : (
    '12 digits. Stored encrypted; only the last 4 are shown.'
  )

  return (
    <div className='grid gap-3 sm:grid-cols-2'>
      <FormField id={id('community')} label='Community' error={errors.community}>
        <Combobox
          id={id('community')}
          label='Community'
          value={value.community || undefined}
          placeholder='Not recorded'
          allLabel='Not recorded'
          options={COMMUNITY_OPTIONS}
          onChange={(next) => onChange('community', (next ?? '') as Community | '')}
          invalid={Boolean(errors.community)}
          highlightSelected={false}
          size={size}
          className={inputClassName}
        />
      </FormField>
      {text('caste', 'Caste', 80, 'e.g. Vanniyar')}
      <FormField id={id('religion')} label='Religion' error={errors.religion}>
        <Combobox
          id={id('religion')}
          label='Religion'
          value={value.religion || undefined}
          placeholder='Not recorded'
          allLabel='Not recorded'
          options={RELIGION_OPTIONS}
          onChange={(next) => onChange('religion', (next ?? '') as Religion | '')}
          invalid={Boolean(errors.religion)}
          highlightSelected={false}
          size={size}
          className={inputClassName}
        />
      </FormField>
      {text('community_certificate_no', 'Community certificate number', 40, 'e.g. TN-123456')}
      {text('nationality', 'Nationality', 40, 'Indian')}
      {text('mother_tongue', 'Mother tongue', 40, 'Tamil')}
      <FormField
        id={id('aadhaar_no')}
        label='Aadhaar number'
        error={errors.aadhaar_no}
        hint={aadhaarHint}
        className='sm:col-span-2'
      >
        <Input
          id={id('aadhaar_no')}
          size={size}
          inputMode='numeric'
          autoComplete='off'
          maxLength={14}
          placeholder={savedAadhaar ? 'Leave empty to keep' : 'XXXX XXXX XXXX'}
          className={cn('font-mono', inputClassName)}
          value={value.aadhaar_no}
          disabled={value.remove_aadhaar}
          onChange={(event) => onChange('aadhaar_no', event.target.value.replace(/[^\d\s-]/g, ''))}
        />
      </FormField>
    </div>
  )
}
