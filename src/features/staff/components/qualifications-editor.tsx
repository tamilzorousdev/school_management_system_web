import { GraduationCap, Plus, Trash } from 'lucide-react'
import { FormField } from '@/components/common/form-field'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  emptyQualification,
  MAX_QUALIFICATIONS,
  type QualificationDraft,
} from '../qualification-draft'

export function QualificationsEditor({
  value,
  onChange,
  errors,
  prefix = 'qualifications',
}: {
  value: QualificationDraft[]
  onChange: (next: QualificationDraft[]) => void
  errors: Record<string, string>
  prefix?: string
}) {
  const update = (index: number, field: keyof QualificationDraft, text: string) =>
    onChange(
      value.map((item, position) => (position === index ? { ...item, [field]: text } : item))
    )

  return (
    <div className='grid gap-3'>
      {value.length === 0 && (
        <p className='flex items-center gap-2 rounded-lg border border-dashed px-3 py-4 text-sm text-muted-foreground'>
          <GraduationCap className='size-4' />
          No qualifications added
        </p>
      )}
      {value.map((item, index) => {
        const id = (field: string) => `${prefix}-${item.key}-${field}`
        return (
          <div key={item.key} className='grid gap-3 rounded-xl border p-3'>
            <div className='flex items-center justify-between gap-2'>
              <span className='text-xs font-bold text-muted-foreground'>
                Qualification {index + 1}
              </span>
              <Button
                type='button'
                size='icon-sm'
                variant='outline'
                aria-label={`Remove qualification ${index + 1}`}
                className='size-8 border border-[#FDA29B] text-[#D92D20] bg-white hover:bg-rose-50'
                onClick={() => onChange(value.filter((_item, position) => position !== index))}
              >
                <Trash className='size-4 stroke-[1.75]' />
              </Button>
            </div>
            <div className='grid gap-4 sm:grid-cols-2'>
              <FormField
                id={id('degree')}
                label='Degree'
                required
                error={errors[`${prefix}.${index}.degree`]}
              >
                <Input
                  id={id('degree')}
                  placeholder='M.Sc., B.Ed.'
                  maxLength={60}
                  size='sm'
                  className='h-8 w-full sm:w-[320px] border-[#9AA49F] bg-white px-3 text-[13px] rounded-md focus-visible:border-[#127D48] focus-visible:ring-2 focus-visible:ring-[#127D48]/20'
                  value={item.degree}
                  onChange={(event) => update(index, 'degree', event.target.value)}
                />
              </FormField>
              <FormField
                id={id('specialization')}
                label='Subject / specialisation'
                error={errors[`${prefix}.${index}.specialization`]}
              >
                <Input
                  id={id('specialization')}
                  placeholder='Mathematics'
                  maxLength={80}
                  size='sm'
                  className='h-8 w-full sm:w-[320px] border-[#9AA49F] bg-white px-3 text-[13px] rounded-md focus-visible:border-[#127D48] focus-visible:ring-2 focus-visible:ring-[#127D48]/20'
                  value={item.specialization}
                  onChange={(event) => update(index, 'specialization', event.target.value)}
                />
              </FormField>
              <FormField
                id={id('institution')}
                label='College / university'
                error={errors[`${prefix}.${index}.institution`]}
              >
                <Input
                  id={id('institution')}
                  maxLength={150}
                  size='sm'
                  className='h-8 w-full sm:w-[320px] border-[#9AA49F] bg-white px-3 text-[13px] rounded-md focus-visible:border-[#127D48] focus-visible:ring-2 focus-visible:ring-[#127D48]/20'
                  value={item.institution}
                  onChange={(event) => update(index, 'institution', event.target.value)}
                />
              </FormField>
              <FormField
                id={id('year')}
                label='Year completed'
                error={errors[`${prefix}.${index}.year_completed`]}
              >
                <Input
                  id={id('year')}
                  inputMode='numeric'
                  maxLength={4}
                  placeholder='2012'
                  size='sm'
                  className='h-8 w-full sm:w-[320px] border-[#9AA49F] bg-white px-3 text-[13px] rounded-md font-mono tabular focus-visible:border-[#127D48] focus-visible:ring-2 focus-visible:ring-[#127D48]/20'
                  value={item.year_completed}
                  onChange={(event) =>
                    update(index, 'year_completed', event.target.value.replace(/\D/g, ''))
                  }
                />
              </FormField>
            </div>
          </div>
        )
      })}
      {value.length < MAX_QUALIFICATIONS && (
        <Button
          type='button'
          variant='secondary'
          size='sm'
          className='border border-[#C6CEC9] bg-white text-[#171B19] hover:bg-[#F9FAFB] font-medium h-8 px-3 gap-1.5 justify-self-start'
          onClick={() => onChange([...value, emptyQualification()])}
        >
          <Plus className='size-3.5 stroke-[1.75]' />
          Add qualification
        </Button>
      )}
    </div>
  )
}
