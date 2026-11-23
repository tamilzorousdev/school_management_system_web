import type { ReactNode } from 'react'
import { Controller, useFormState, type Control } from 'react-hook-form'
import { Combobox } from '@/components/common/combobox'
import { FormField } from '@/components/common/form-field'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { digitsOnly, type ContactTextKey, type ContactValues } from '../form'
import { OCCUPATION, toOptions } from '../labels'

const TEXT_FIELDS: Record<
  ContactTextKey,
  { label: string; placeholder: string; type?: string; mobile?: boolean; wide?: boolean }
> = {
  mobile: { label: 'Mobile', placeholder: '9876543210', type: 'tel', mobile: true },
  alt_mobile: { label: 'Alternate mobile', placeholder: '9840011122', type: 'tel', mobile: true },
  email: { label: 'Email', placeholder: 'priya@example.com', type: 'email' },
  linkedin_url: {
    label: 'LinkedIn',
    placeholder: 'https://www.linkedin.com/in/priya',
    type: 'url',
  },
  address_line: { label: 'Address', placeholder: '12, Gandhi Street', wide: true },
  city: { label: 'City', placeholder: 'Chennai' },
  state: { label: 'State', placeholder: 'Tamil Nadu' },
  pincode: { label: 'Pincode', placeholder: '600001' },
  country: { label: 'Country', placeholder: 'India' },
  institution: { label: 'College / institution', placeholder: 'Anna University' },
  course: { label: 'Course', placeholder: 'B.E. Computer Science' },
  organization: { label: 'Organisation', placeholder: 'Company or business name' },
  designation: { label: 'Designation', placeholder: 'Software Engineer' },
}

const OCCUPATION_OPTIONS = toOptions(OCCUPATION)

export function FormSection({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: ReactNode
}) {
  return (
    <section className='grid gap-3'>
      <div className='grid gap-0.5'>
        <h3 className='text-xs font-bold tracking-wider text-muted-foreground uppercase'>
          {title}
        </h3>
        {description && <p className='text-xs text-muted-foreground'>{description}</p>}
      </div>
      <div className='grid gap-4 sm:grid-cols-2'>{children}</div>
    </section>
  )
}

export function RootError({ message }: { message?: string }) {
  if (!message) return null
  return (
    <p
      role='alert'
      className='rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive'
    >
      {message}
    </p>
  )
}

export function ContactTextFields({
  control,
  fields,
  prefix,
  required = [],
}: {
  control: Control<ContactValues>
  fields: ContactTextKey[]
  prefix: string
  required?: ContactTextKey[]
}) {
  const { errors } = useFormState({ control })
  return fields.map((name) => {
    const meta = TEXT_FIELDS[name]
    const id = `${prefix}-${name}`
    const error = errors[name]?.message
    return (
      <FormField
        key={name}
        id={id}
        label={meta.label}
        required={required.includes(name)}
        error={error}
        className={meta.wide ? 'sm:col-span-2' : undefined}
      >
        <Controller
          control={control}
          name={name}
          render={({ field }) => (
            <Input
              id={id}
              type={meta.type ?? 'text'}
              inputMode={meta.mobile || name === 'pincode' ? 'numeric' : undefined}
              maxLength={meta.mobile ? 10 : name === 'pincode' ? 6 : undefined}
              autoComplete='off'
              placeholder={meta.placeholder}
              aria-invalid={Boolean(error)}
              className={meta.mobile || name === 'pincode' ? 'tabular' : undefined}
              name={field.name}
              ref={field.ref}
              value={field.value}
              onBlur={field.onBlur}
              onChange={(event) =>
                field.onChange(
                  meta.mobile
                    ? digitsOnly(event.target.value)
                    : name === 'pincode'
                      ? event.target.value.replace(/\D/g, '').slice(0, 6)
                      : event.target.value
                )
              }
            />
          )}
        />
      </FormField>
    )
  })
}

export function OccupationField({
  control,
  prefix,
}: {
  control: Control<ContactValues>
  prefix: string
}) {
  const { errors } = useFormState({ control })
  const id = `${prefix}-occupation`
  return (
    <FormField id={id} label='What they do now' error={errors.occupation_status?.message}>
      <Controller
        control={control}
        name='occupation_status'
        render={({ field }) => (
          <Combobox
            id={id}
            label='What they do now'
            value={field.value}
            placeholder='Choose one'
            searchPlaceholder='Search'
            options={OCCUPATION_OPTIONS}
            onChange={(value) => field.onChange(value ?? 'unknown')}
            highlightSelected={false}
            className='sm:w-full'
          />
        )}
      />
    </FormField>
  )
}

export function ConsentField({
  control,
  prefix,
  label = 'Agrees to be contacted',
  hint = 'The school may call, message or email about alumni events and news.',
}: {
  control: Control<ContactValues>
  prefix: string
  label?: string
  hint?: string
}) {
  const id = `${prefix}-consent`
  return (
    <Controller
      control={control}
      name='contact_consent'
      render={({ field }) => (
        <div className='flex items-center justify-between gap-4 rounded-lg border bg-muted/40 px-4 py-3 sm:col-span-2'>
          <div className='grid gap-0.5'>
            <label htmlFor={id} className='text-sm font-semibold'>
              {label}
            </label>
            <p className='text-xs text-muted-foreground'>{hint}</p>
          </div>
          <Switch id={id} checked={field.value} onCheckedChange={field.onChange} />
        </div>
      )}
    />
  )
}
