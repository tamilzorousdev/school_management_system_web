import { Star, Trash2 } from 'lucide-react'
import { Combobox } from '@/components/common/combobox'
import { FormField } from '@/components/common/form-field'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import type { GuardianInput } from '../api'
import type { GuardianDraft } from '../guardian-draft'
import { RELATION_LABELS, toOptions } from '../labels'

const LANGUAGE_OPTIONS = [
  { value: 'en', label: 'English' },
  { value: 'ta', label: 'தமிழ் (Tamil)' },
]

interface GuardianFieldsProps {
  value: GuardianDraft
  index: number
  primary: boolean
  errors?: Partial<Record<keyof GuardianInput, string>>
  onChange: (value: GuardianDraft) => void
  onMakePrimary?: () => void
  onRemove?: () => void
}

export function GuardianFields({
  value,
  index,
  primary,
  errors,
  onChange,
  onMakePrimary,
  onRemove,
}: GuardianFieldsProps) {
  const id = (field: string) => `guardian-${index}-${field}`
  const set = <K extends keyof GuardianDraft>(field: K, next: GuardianDraft[K]) =>
    onChange({ ...value, [field]: next })

  const isParentOrGuardian =
    value.relation === 'father' || value.relation === 'mother' || value.relation === 'guardian'
  const displayTitle = isParentOrGuardian
    ? RELATION_LABELS[value.relation]
    : 'Emergency Contact / Authorized Caregiver'

  return (
    <fieldset className='grid gap-3 rounded-lg border bg-muted/30 p-3 sm:p-4'>
      <div className='flex items-center justify-between gap-2'>
        <legend className='text-sm font-bold'>
          {displayTitle}
          {!isParentOrGuardian && (
            <span className='ml-2 rounded-full bg-secondary/80 px-2 py-0.5 text-[11px] font-semibold text-secondary-foreground'>
              {RELATION_LABELS[value.relation]}
            </span>
          )}
          {primary && (
            <span className='ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary'>
              Main contact
            </span>
          )}
        </legend>
        <div className='flex gap-1'>
          {!primary && onMakePrimary && (
            <Button type='button' variant='ghost' size='sm' onClick={onMakePrimary}>
              <Star />
              Make main
            </Button>
          )}
          {onRemove && (
            <Button
              type='button'
              variant='ghost'
              size='icon-sm'
              aria-label='Remove this contact'
              className='text-destructive hover:bg-destructive/10'
              onClick={onRemove}
            >
              <Trash2 />
            </Button>
          )}
        </div>
      </div>
      <div className='grid gap-3 sm:grid-cols-2'>
        <FormField id={id('name')} label='Full name' required error={errors?.name}>
          <Input
            id={id('name')}
            value={value.name}
            onChange={(event) => set('name', event.target.value)}
          />
        </FormField>
        <FormField
          id={id('mobile')}
          label='Mobile'
          required
          error={errors?.mobile}
          hint='Reused if already a parent here'
        >
          <div className='flex'>
            <span className='inline-flex h-9 items-center rounded-l-md border border-r-0 border-input bg-muted px-2.5 text-sm font-semibold text-muted-foreground'>
              +91
            </span>
            <Input
              id={id('mobile')}
              type='tel'
              inputMode='numeric'
              maxLength={10}
              className='tabular rounded-l-none'
              value={value.mobile}
              onChange={(event) => set('mobile', event.target.value.replace(/\D/g, '').slice(-10))}
            />
          </div>
        </FormField>
        <FormField id={id('relation')} label='Relation' required>
          <Combobox
            id={id('relation')}
            label='Relation'
            value={value.relation}
            placeholder='Choose relation'
            options={toOptions(RELATION_LABELS)}
            onChange={(next) => set('relation', (next ?? 'other') as GuardianInput['relation'])}
            highlightSelected={false}
            className='sm:w-full'
          />
        </FormField>
        <FormField id={id('language')} label='Language' hint='App and messages'>
          <Combobox
            id={id('language')}
            label='Language'
            value={value.language ?? 'en'}
            placeholder='Choose language'
            options={LANGUAGE_OPTIONS}
            onChange={(next) => set('language', (next ?? 'en') as GuardianInput['language'])}
            highlightSelected={false}
            className='sm:w-full'
          />
        </FormField>
        <FormField id={id('occupation')} label='Occupation' error={errors?.occupation}>
          <Input
            id={id('occupation')}
            value={value.occupation ?? ''}
            onChange={(event) => set('occupation', event.target.value)}
          />
        </FormField>
        <FormField id={id('qualification')} label='Qualification' error={errors?.qualification}>
          <Input
            id={id('qualification')}
            value={value.qualification ?? ''}
            onChange={(event) => set('qualification', event.target.value)}
          />
        </FormField>
      </div>
      <label className='flex items-center justify-between gap-3 text-sm'>
        <span className='grid'>
          <span className='font-semibold'>Authorized for campus pickup</span>
          <span className='text-xs text-muted-foreground'>
            Permitted to collect student from school
          </span>
        </span>
        <Switch
          checked={value.can_pickup ?? true}
          onCheckedChange={(checked) => set('can_pickup', checked)}
        />
      </label>
      <label className='flex items-center justify-between gap-3 text-sm'>
        <span className='grid'>
          <span className='font-semibold'>Parent app login and alerts</span>
          <span className='text-xs text-muted-foreground'>Sends an invite to this mobile</span>
        </span>
        <Switch
          checked={value.receives_alerts ?? true}
          onCheckedChange={(checked) => set('receives_alerts', checked)}
        />
      </label>
    </fieldset>
  )
}
