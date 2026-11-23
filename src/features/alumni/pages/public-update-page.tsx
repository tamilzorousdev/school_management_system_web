import { useState } from 'react'
import { getRouteApi } from '@tanstack/react-router'
import { Controller, useForm, type Control } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { CheckCircle2, Link2Off } from 'lucide-react'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { toApiError } from '@/lib/api/errors'
import { formatDateTime } from '@/lib/format'
import { usePublicProfile, usePublicUpdate, type PublicProfile } from '../api'
import {
  applyApiErrors,
  CAREER_FIELDS,
  CONTACT_FIELDS,
  contactInput,
  contactShape,
  contactValues,
  publicErrorMessage,
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

const route = getRouteApi('/alumni-update/$token')

const schema = z.object({ ...contactShape, website: z.string() })
type FormValues = z.infer<typeof schema>
const FIELDS = Object.keys(contactShape)

export function PublicUpdatePage() {
  const { token } = route.useParams()
  const profile = usePublicProfile(token)
  const [done, setDone] = useState(false)

  if (profile.isError) {
    const error = toApiError(profile.error)
    return (
      <PublicShell school={null}>
        <PublicMessage
          icon={Link2Off}
          tone='warning'
          title={error.status === 404 ? 'This link no longer works' : 'Could not open the form'}
          description={
            error.status === 404 ? publicErrorMessage('LINK_INVALID', error.message) : error.message
          }
        />
      </PublicShell>
    )
  }

  const data = profile.data
  return (
    <PublicShell school={data?.school} loading={profile.isPending}>
      {done ? (
        <PublicMessage
          icon={CheckCircle2}
          tone='success'
          title='Thank you'
          description='The school will review your changes. This link has now been used.'
        />
      ) : data ? (
        <UpdateForm token={token} profile={data} onDone={() => setDone(true)} />
      ) : (
        <div className='grid gap-3'>
          <Skeleton className='h-8 w-2/3' />
          <Skeleton className='h-40' />
          <Skeleton className='h-40' />
        </div>
      )}
    </PublicShell>
  )
}

function UpdateForm({
  token,
  profile,
  onDone,
}: {
  token: string
  profile: PublicProfile
  onDone: () => void
}) {
  const update = usePublicUpdate(token)
  const {
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { ...contactValues(profile), website: '' },
  })
  const contactControl = control as unknown as Control<ContactValues>

  const submit = handleSubmit(async (values) => {
    try {
      await update.mutateAsync({
        ...contactInput(values),
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

  return (
    <form onSubmit={submit} noValidate className='relative grid gap-6'>
      <div className='grid gap-1'>
        <h1 className='text-xl font-extrabold tracking-tight'>Hello, {profile.full_name}</h1>
        <p className='text-sm text-muted-foreground'>
          Batch of {profile.batch_year}. Check your details and correct anything that has changed.
          The school reviews changes before they apply. This link works once, until{' '}
          {formatDateTime(profile.expires_at)}.
        </p>
      </div>
      <RootError message={errors.root?.message} />

      <FormSection title='Contact'>
        <ContactTextFields control={contactControl} fields={CONTACT_FIELDS} prefix='u' />
        <ConsentField
          control={contactControl}
          prefix='u'
          label='The school may contact me'
          hint='About alumni meets, events and school news.'
        />
      </FormSection>

      <FormSection title='What you do now'>
        <OccupationField control={contactControl} prefix='u' />
        <ContactTextFields control={contactControl} fields={CAREER_FIELDS} prefix='u' />
      </FormSection>

      <Controller
        control={control}
        name='website'
        render={({ field }) => <Honeypot value={field.value} onChange={field.onChange} />}
      />

      <Button type='submit' size='lg' loading={update.isPending}>
        Send changes
      </Button>
    </form>
  )
}
