import { useState, type FormEvent } from 'react'
import { ImageUp, Save, Trash2 } from 'lucide-react'
import { Combobox } from '@/components/common/combobox'
import { ErrorState } from '@/components/common/display'
import { FormField } from '@/components/common/form-field'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { alerts } from '@/lib/alerts'
import { toApiError } from '@/lib/api/errors'
import { filesApi } from '@/lib/files'
import { setupApi, useSchoolProfile, useSetupMutation, type SchoolProfile } from '../api'
import { fieldErrorsOf } from '../form-actions'
import { GeofencePicker } from './geofence-picker'
import { RootError, Section } from './setup-shared'

const BOARDS = [
  { value: 'CBSE', label: 'CBSE' },
  { value: 'STATE', label: 'State board' },
  { value: 'ICSE', label: 'ICSE' },
  { value: 'OTHER', label: 'Other' },
]

export function ProfileTab({ canManage }: { canManage: boolean }) {
  const profile = useSchoolProfile()
  if (profile.isError)
    return <ErrorState message={profile.error.message} onRetry={() => profile.refetch()} />
  if (!profile.data) return <Skeleton className='h-96' />
  return <ProfileForm key={profile.data.id} school={profile.data} canManage={canManage} />
}

function ProfileForm({ school, canManage }: { school: SchoolProfile; canManage: boolean }) {
  const [draft, setDraft] = useState({
    name: school.name,
    board: school.board ?? '',
    address: school.address ?? '',
    city: school.city ?? '',
    state: school.state ?? '',
    pincode: school.pincode ?? '',
    phone: school.phone ?? '',
    emergency_phone: school.emergency_phone ?? '',
    email: school.email ?? '',
    latitude: school.latitude?.toString() ?? '',
    longitude: school.longitude?.toString() ?? '',
    geofence_radius_m: String(school.geofence_radius_m),
    attendance_grace_minutes: String(school.attendance_grace_minutes ?? 15),
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const save = useSetupMutation((input: Partial<SchoolProfile>) => setupApi.updateSchool(input))
  const set = (field: keyof typeof draft, value: string) => {
    setDraft((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: '' }))
  }
  const text = (value: string) => value.trim() || null
  const number = (value: string) => (value.trim() === '' ? null : Number(value))

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    try {
      await save.mutateAsync({
        name: draft.name.trim(),
        board: (draft.board || null) as SchoolProfile['board'],
        address: text(draft.address),
        city: text(draft.city),
        state: text(draft.state),
        pincode: text(draft.pincode),
        phone: text(draft.phone),
        emergency_phone: text(draft.emergency_phone),
        email: text(draft.email),
        latitude: number(draft.latitude),
        longitude: number(draft.longitude),
        geofence_radius_m: Number(draft.geofence_radius_m) || 200,
        attendance_grace_minutes:
          draft.attendance_grace_minutes.trim() === ''
            ? 15
            : Number(draft.attendance_grace_minutes),
      })
      alerts.success('School profile saved')
      setErrors({})
    } catch (error) {
      setErrors(fieldErrorsOf(error))
    }
  }

  const field = (
    id: keyof typeof draft,
    label: string,
    props: Partial<React.ComponentProps<typeof Input>> = {},
    hint?: string
  ) => (
    <FormField id={`school-${id}`} label={label} error={errors[id]} hint={hint}>
      <Input
        id={`school-${id}`}
        value={draft[id]}
        disabled={!canManage}
        onChange={(event) => set(id, event.target.value)}
        {...props}
      />
    </FormField>
  )

  return (
    <Section
      title='School profile'
      description={`School code ${school.code} · ${school.student_count} students · ${school.user_count} users`}
    >
      <form noValidate onSubmit={submit} className='grid gap-4 sm:grid-cols-2'>
        <RootError message={errors.root} />
        <SchoolLogo school={school} canManage={canManage} />
        <SchoolSignature school={school} canManage={canManage} />
        <SchoolSeal school={school} canManage={canManage} />
        {field('name', 'School name')}
        <FormField id='school-board' label='Board'>
          <Combobox
            id='school-board'
            label='Board'
            value={draft.board || undefined}
            placeholder='Choose board'
            options={BOARDS}
            onChange={(value) => set('board', value ?? '')}
            highlightSelected={false}
            className='sm:w-full'
          />
        </FormField>
        <div className='sm:col-span-2'>{field('address', 'Address')}</div>
        {field('city', 'City')}
        {field('state', 'State')}
        {field('pincode', 'Pincode', { inputMode: 'numeric', maxLength: 6 })}
        {field('email', 'Office email', { type: 'email' })}
        {field('phone', 'Office phone', { type: 'tel' })}
        {field(
          'emergency_phone',
          'Emergency phone',
          { type: 'tel' },
          'Shown to parents in SOS and emergency messages'
        )}
        <GeofencePicker
          value={{
            latitude: draft.latitude,
            longitude: draft.longitude,
            radius: draft.geofence_radius_m,
          }}
          searchHint={[draft.name, draft.city].filter(Boolean).join(' ')}
          disabled={!canManage}
          onChange={(next) => {
            setDraft((current) => ({
              ...current,
              latitude: next.latitude,
              longitude: next.longitude,
              geofence_radius_m: next.radius,
            }))
            setErrors((current) => ({
              ...current,
              latitude: '',
              longitude: '',
              geofence_radius_m: '',
            }))
          }}
        />
        {(errors.latitude || errors.longitude || errors.geofence_radius_m) && (
          <p className='text-xs text-destructive sm:col-span-2' role='alert'>
            {errors.latitude || errors.longitude || errors.geofence_radius_m}
          </p>
        )}
        {field(
          'attendance_grace_minutes',
          'Attendance grace (minutes)',
          { inputMode: 'numeric' },
          '0 to 30. Extra time after the 1st and 5th period; after that the session shows as missed'
        )}
        {canManage && (
          <div className='flex justify-end sm:col-span-2'>
            <Button type='submit' loading={save.isPending}>
              <Save />
              Save profile
            </Button>
          </div>
        )}
      </form>
    </Section>
  )
}

const LOGO_TYPES = ['image/png', 'image/jpeg', 'image/webp']

function SchoolLogo({ school, canManage }: { school: SchoolProfile; canManage: boolean }) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const save = useSetupMutation((logo_file_id: number | null) =>
    setupApi.updateSchool({ logo_file_id })
  )

  const upload = async (file: File | undefined) => {
    if (!file) return
    setError('')
    if (!LOGO_TYPES.includes(file.type)) return setError('Choose a PNG, JPG or WEBP image')
    if (file.size > 2 * 1024 * 1024) return setError('The logo must be 2 MB or smaller')
    setUploading(true)
    try {
      const uploaded = await filesApi.upload(file, 'school_logo')
      await save.mutateAsync(uploaded.id)
      alerts.success('School logo saved')
    } catch (caught) {
      setError(toApiError(caught).message)
    } finally {
      setUploading(false)
    }
  }

  return (
    <FormField
      id='school-logo'
      label='School logo'
      error={error}
      hint='Square PNG or JPG, up to 2 MB. Shown in the apps, ID cards, fee receipts, payslips and TCs.'
      className='sm:col-span-2'
    >
      <div className='flex flex-wrap items-center gap-4'>
        <div className='grid size-20 shrink-0 place-items-center overflow-hidden rounded-xl border bg-white'>
          {school.logo_url ? (
            <img
              src={school.logo_url}
              alt={`${school.name} logo`}
              className='size-full object-contain p-1'
            />
          ) : (
            <ImageUp className='size-7 text-muted-foreground' aria-hidden />
          )}
        </div>
        {canManage && (
          <div className='flex flex-wrap gap-2'>
            <Button asChild variant='outline' size='sm' disabled={uploading}>
              <label htmlFor='school-logo' className='cursor-pointer'>
                <ImageUp />
                {uploading ? 'Uploading…' : school.logo_url ? 'Change logo' : 'Upload logo'}
                <input
                  id='school-logo'
                  type='file'
                  accept={LOGO_TYPES.join(',')}
                  className='sr-only'
                  disabled={uploading}
                  onChange={(event) => {
                    void upload(event.target.files?.[0])
                    event.target.value = ''
                  }}
                />
              </label>
            </Button>
            {school.logo_url && (
              <Button
                type='button'
                variant='ghost'
                size='sm'
                className='text-destructive hover:bg-destructive/10'
                loading={save.isPending && !uploading}
                onClick={async () => {
                  try {
                    await save.mutateAsync(null)
                    alerts.success('School logo removed')
                  } catch (caught) {
                    setError(toApiError(caught).message)
                  }
                }}
              >
                <Trash2 />
                Remove
              </Button>
            )}
          </div>
        )}
      </div>
    </FormField>
  )
}

function SchoolSignature({ school, canManage }: { school: SchoolProfile; canManage: boolean }) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const save = useSetupMutation((signature_file_id: number | null) =>
    setupApi.updateSchool({ signature_file_id })
  )

  const upload = async (file: File | undefined) => {
    if (!file) return
    setError('')
    if (!LOGO_TYPES.includes(file.type)) return setError('Choose a PNG, JPG or WEBP image')
    if (file.size > 2 * 1024 * 1024) return setError('The signature must be 2 MB or smaller')
    setUploading(true)
    try {
      const uploaded = await filesApi.upload(file, 'school_signature')
      await save.mutateAsync(uploaded.id)
      alerts.success('Authorized signature saved')
    } catch (caught) {
      setError(toApiError(caught).message)
    } finally {
      setUploading(false)
    }
  }

  return (
    <FormField
      id='school-signature'
      label='Authorized digital signature'
      error={error}
      hint='PNG with transparent background or JPG, up to 2 MB. Displayed on receipts, payslips and report cards.'
      className='sm:col-span-2'
    >
      <div className='flex flex-wrap items-center gap-4'>
        <div className='grid h-16 w-36 shrink-0 place-items-center overflow-hidden rounded-xl border bg-white p-2'>
          {school.signature_url ? (
            <img
              src={school.signature_url}
              alt='Authorized signature'
              className='size-full object-contain'
            />
          ) : (
            <ImageUp className='size-6 text-muted-foreground' aria-hidden />
          )}
        </div>
        {canManage && (
          <div className='flex flex-wrap gap-2'>
            <Button asChild variant='outline' size='sm' disabled={uploading}>
              <label htmlFor='school-signature' className='cursor-pointer'>
                <ImageUp />
                {uploading
                  ? 'Uploading…'
                  : school.signature_url
                    ? 'Change signature'
                    : 'Upload signature'}
                <input
                  id='school-signature'
                  type='file'
                  accept={LOGO_TYPES.join(',')}
                  className='sr-only'
                  disabled={uploading}
                  onChange={(event) => {
                    void upload(event.target.files?.[0])
                    event.target.value = ''
                  }}
                />
              </label>
            </Button>
            {school.signature_url && (
              <Button
                type='button'
                variant='ghost'
                size='sm'
                className='text-destructive hover:bg-destructive/10'
                loading={save.isPending && !uploading}
                onClick={async () => {
                  try {
                    await save.mutateAsync(null)
                    alerts.success('Authorized signature removed')
                  } catch (caught) {
                    setError(toApiError(caught).message)
                  }
                }}
              >
                <Trash2 />
                Remove
              </Button>
            )}
          </div>
        )}
      </div>
    </FormField>
  )
}

function SchoolSeal({ school, canManage }: { school: SchoolProfile; canManage: boolean }) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const save = useSetupMutation((seal_file_id: number | null) =>
    setupApi.updateSchool({ seal_file_id })
  )

  const upload = async (file: File | undefined) => {
    if (!file) return
    setError('')
    if (!LOGO_TYPES.includes(file.type)) return setError('Choose a PNG, JPG or WEBP image')
    if (file.size > 2 * 1024 * 1024) return setError('The seal must be 2 MB or smaller')
    setUploading(true)
    try {
      const uploaded = await filesApi.upload(file, 'school_seal')
      await save.mutateAsync(uploaded.id)
      alerts.success('Official school seal saved')
    } catch (caught) {
      setError(toApiError(caught).message)
    } finally {
      setUploading(false)
    }
  }

  return (
    <FormField
      id='school-seal'
      label='Official school seal / stamp'
      error={error}
      hint='Circular or oval stamp PNG with transparent background or JPG, up to 2 MB. Stamped on fee receipts, payslips, report cards and TCs.'
      className='sm:col-span-2'
    >
      <div className='flex flex-wrap items-center gap-4'>
        <div className='grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-full border-2 border-dashed border-emerald-600/40 bg-white p-2 shadow-xs'>
          {school.seal_url ? (
            <img
              src={school.seal_url}
              alt='Official school seal'
              className='size-full object-contain'
            />
          ) : (
            <ImageUp className='size-6 text-muted-foreground' aria-hidden />
          )}
        </div>
        {canManage && (
          <div className='flex flex-wrap gap-2'>
            <Button asChild variant='outline' size='sm' disabled={uploading}>
              <label htmlFor='school-seal' className='cursor-pointer'>
                <ImageUp />
                {uploading ? 'Uploading…' : school.seal_url ? 'Change seal' : 'Upload seal'}
                <input
                  id='school-seal'
                  type='file'
                  accept={LOGO_TYPES.join(',')}
                  className='sr-only'
                  disabled={uploading}
                  onChange={(event) => {
                    void upload(event.target.files?.[0])
                    event.target.value = ''
                  }}
                />
              </label>
            </Button>
            {school.seal_url && (
              <Button
                type='button'
                variant='ghost'
                size='sm'
                className='text-destructive hover:bg-destructive/10'
                loading={save.isPending && !uploading}
                onClick={async () => {
                  try {
                    await save.mutateAsync(null)
                    alerts.success('Official school seal removed')
                  } catch (caught) {
                    setError(toApiError(caught).message)
                  }
                }}
              >
                <Trash2 />
                Remove
              </Button>
            )}
          </div>
        )}
      </div>
    </FormField>
  )
}
