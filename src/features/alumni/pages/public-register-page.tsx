import { useState } from 'react'
import { getRouteApi } from '@tanstack/react-router'
import { Controller, useForm, type Control } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { CheckCircle2, SearchX } from 'lucide-react'
import { z } from 'zod'
import { FormField } from '@/components/common/form-field'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toApiError } from '@/lib/api/errors'
import { usePublicRegister, usePublicSchool } from '../api'
import {
  applyApiErrors,
  batchYearText,
  CAREER_FIELDS,
  contactShape,
  currentYear,
  emptyContact,
  orNull,
  publicErrorMessage,
  text,
  type ContactValues,
} from '../form'
import {
  ConsentField,
  ContactTextFields,
  FormSection,
  OccupationField,
  RootError,
} from '../components/form-parts'
import { Honeypot, PublicMessage, PublicShell } from '../components/public-shell'

const route = getRouteApi('/alumni-register/$schoolCode')

const schema = z
  .object({
    first_name: z
      .string()
      .trim()
      .min(1, 'Enter your first name')
      .max(60, 'Must be 60 characters or less'),
    last_name: text(60),
    batch_year: batchYearText,
    final_class_name: text(30),
    admission_no: text(30),
    mobile: contactShape.mobile,
    email: contactShape.email,
    city: contactShape.city,
    occupation_status: contactShape.occupation_status,
    institution: contactShape.institution,
    course: contactShape.course,
    organization: contactShape.organization,
    designation: contactShape.designation,
    contact_consent: contactShape.contact_consent,
    website: z.string(),
  })
  .superRefine((values, context) => {
    if (!values.mobile.trim() && !values.email.trim()) {
      context.addIssue({
        code: 'custom',
        path: ['mobile'],
        message: 'Give a mobile number or an email address',
      })
    }
  })

type FormValues = z.infer<typeof schema>
const FIELDS = [
  'first_name',
  'last_name',
  'batch_year',
  'final_class_name',
  'admission_no',
  'mobile',
  'email',
  'city',
  'occupation_status',
  'institution',
  'course',
  'organization',
  'designation',
  'contact_consent',
] as const

export function PublicRegisterPage() {
  const { schoolCode } = route.useParams()
  const school = usePublicSchool(schoolCode)
  const [done, setDone] = useState(false)

  if (school.isError) {
    const error = toApiError(school.error)
    return (
      <PublicShell school={null}>
        <PublicMessage
          icon={SearchX}
          tone='danger'
          title={error.status === 404 ? 'School not found' : 'Could not open the form'}
          description={
            error.status === 404
              ? publicErrorMessage('SCHOOL_NOT_FOUND', error.message)
              : error.message
          }
        />
      </PublicShell>
    )
  }

  return (
    <PublicShell school={school.data} loading={school.isPending}>
      {done ? (
        <PublicMessage
          icon={CheckCircle2}
          tone='success'
          title='Thank you'
          description='The school will review your details and add you to the alumni records. They may call or email you to confirm.'
        />
      ) : (
        <RegisterForm code={schoolCode} disabled={school.isPending} onDone={() => setDone(true)} />
      )}
    </PublicShell>
  )
}

function RegisterForm({
  code,
  disabled,
  onDone,
}: {
  code: string
  disabled: boolean
  onDone: () => void
}) {
  const register = usePublicRegister(code)
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      first_name: '',
      last_name: '',
      batch_year: '',
      final_class_name: '',
      admission_no: '',
      mobile: emptyContact.mobile,
      email: emptyContact.email,
      city: emptyContact.city,
      occupation_status: emptyContact.occupation_status,
      institution: '',
      course: '',
      organization: '',
      designation: '',
      contact_consent: true,
      website: '',
    },
  })
  const {
    control,
    handleSubmit,
    setError,
    register: field,
    formState: { errors },
  } = form
  const contactControl = control as unknown as Control<ContactValues>

  const submit = handleSubmit(async (values) => {
    try {
      await register.mutateAsync({
        first_name: values.first_name.trim(),
        last_name: orNull(values.last_name),
        batch_year: Number(values.batch_year),
        final_class_name: orNull(values.final_class_name),
        admission_no: orNull(values.admission_no),
        mobile: orNull(values.mobile),
        email: orNull(values.email),
        city: orNull(values.city),
        occupation_status: values.occupation_status,
        institution: orNull(values.institution),
        course: orNull(values.course),
        organization: orNull(values.organization),
        designation: orNull(values.designation),
        contact_consent: values.contact_consent,
        ...(values.website ? { website: values.website } : {}),
      })
      onDone()
    } catch (error) {
      const apiError = toApiError(error)
      if (apiError.fieldErrors.length) {
        applyApiErrors(apiError, FIELDS, setError)
      } else {
        setError('root', { message: publicErrorMessage(apiError.code, apiError.message) })
      }
    }
  })

  const input = (
    name: 'first_name' | 'last_name' | 'batch_year' | 'final_class_name' | 'admission_no',
    label: string,
    options: {
      placeholder: string
      required?: boolean
      maxLength?: number
      numeric?: boolean
      hint?: string
    }
  ) => (
    <FormField
      id={`r-${name}`}
      label={label}
      required={options.required}
      error={errors[name]?.message}
      hint={options.hint}
    >
      <Input
        id={`r-${name}`}
        placeholder={options.placeholder}
        maxLength={options.maxLength}
        inputMode={options.numeric ? 'numeric' : undefined}
        aria-invalid={Boolean(errors[name])}
        {...field(name)}
      />
    </FormField>
  )

  return (
    <form onSubmit={submit} noValidate className='relative grid gap-6'>
      <div className='grid gap-1'>
        <h1 className='text-xl font-extrabold tracking-tight'>Join the alumni network</h1>
        <p className='text-sm text-muted-foreground'>
          Studied here? Leave your details so the school can stay in touch. Staff check every form
          before adding you.
        </p>
      </div>
      <RootError message={errors.root?.message} />

      <FormSection title='About you'>
        {input('first_name', 'First name', { placeholder: 'Priya', required: true, maxLength: 60 })}
        {input('last_name', 'Last name', { placeholder: 'Narayanan', maxLength: 60 })}
        {input('batch_year', 'Year you left school', {
          placeholder: String(currentYear()),
          required: true,
          maxLength: 4,
          numeric: true,
        })}
        {input('final_class_name', 'Last class you studied', {
          placeholder: 'Class 12',
          maxLength: 30,
        })}
        {input('admission_no', 'Admission number', {
          placeholder: 'If you remember it',
          maxLength: 30,
        })}
      </FormSection>

      <FormSection title='How to reach you' description='Give a mobile number or an email.'>
        <ContactTextFields
          control={contactControl}
          fields={['mobile', 'email', 'city']}
          prefix='r'
        />
        <ConsentField
          control={contactControl}
          prefix='r'
          label='The school may contact me'
          hint='About alumni meets, events and school news.'
        />
      </FormSection>

      <FormSection title='What you do now'>
        <OccupationField control={contactControl} prefix='r' />
        <ContactTextFields control={contactControl} fields={CAREER_FIELDS} prefix='r' />
      </FormSection>

      <Controller
        control={control}
        name='website'
        render={({ field: honeypot }) => (
          <Honeypot value={honeypot.value} onChange={honeypot.onChange} />
        )}
      />

      <Button type='submit' size='lg' loading={register.isPending} disabled={disabled}>
        Send my details
      </Button>
    </form>
  )
}
