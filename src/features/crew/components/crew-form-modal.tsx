import { useState } from 'react'
import { Controller, useForm, useWatch, type Control, type FieldErrors } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Camera, Trash2 } from 'lucide-react'
import { z } from 'zod'
import { AppModal } from '@/components/common/app-modal'
import { Avatar } from '@/components/common/avatar'
import { Combobox } from '@/components/common/combobox'
import { FormField } from '@/components/common/form-field'
import { SegmentedControl } from '@/components/common/segmented-control'
import { Input, Textarea } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { today } from '@/features/attendance/labels'
import { GENDER_LABELS, LANGUAGE_OPTIONS, toOptions } from '@/features/staff/labels'
import { alerts } from '@/lib/alerts'
import { toApiError } from '@/lib/api/errors'
import { filesApi } from '@/lib/files'
import {
  crewApi,
  useCrewMutation,
  type CreateCrewInput,
  type CrewDetail,
  type CrewRole,
  type LicenceType,
  type UpdateCrewInput,
} from '../api'
import { LICENCE_TYPE_LABELS, ROLE_LABELS } from '../labels'

const FORM_ID = 'crew-form'
const MOBILE = /^[6-9]\d{9}$/
const CODE = /^[A-Z0-9-/]+$/
const EMPLOYEE_NO = /^[A-Za-z0-9/_-]{1,30}$/

const optional = (test: (value: string) => boolean, message: string) =>
  z
    .string()
    .trim()
    .refine((value) => value === '' || test(value), message)

const code = (min: number, max: number, message: string) =>
  optional((value) => {
    const clean = value.toUpperCase().replace(/\s+/g, '')
    return clean.length >= min && clean.length <= max && CODE.test(clean)
  }, message)

const schema = z
  .object({
    role: z.enum(['driver', 'attendant']),
    name: z.string().trim().min(2, 'Enter the full name').max(120, 'Name is too long'),
    mobile: z.string().regex(MOBILE, 'Enter a 10-digit mobile number'),
    email: optional((value) => z.string().email().safeParse(value).success, 'Enter a valid email'),
    language: z.enum(['en', 'ta']),
    gender: z.string(),
    dob: z.string(),
    employee_no: optional(
      (value) => EMPLOYEE_NO.test(value),
      'Use letters, digits, / _ and -, up to 30'
    ),
    joining_date: z.string(),
    prior_experience_years: optional((value) => {
      const years = Number(value)
      return Number.isInteger(years) && years >= 0 && years <= 50
    }, 'Enter years from 0 to 50'),
    address: z.string().trim().max(255, 'Address is too long'),
    emergency_contact_name: z.string().trim().max(120, 'Name is too long'),
    emergency_contact_mobile: optional((value) => MOBILE.test(value), 'Enter a 10-digit mobile'),
    licence_no: code(6, 20, 'Enter the licence number, 6 to 20 letters and digits'),
    licence_type: z.string(),
    licence_issued_on: z.string(),
    licence_expiry: z.string(),
    badge_no: code(3, 30, 'Enter the badge number, 3 to 30 letters and digits'),
    badge_expiry: z.string(),
    medical_fitness_expiry: z.string(),
    police_verified_on: z.string(),
    police_verification_expiry: z.string(),
    send_invite: z.boolean(),
  })
  .superRefine((values, context) => {
    const now = today()
    const issue = (path: string, message: string) =>
      context.addIssue({ code: 'custom', path: [path], message })
    if (values.licence_issued_on && values.licence_issued_on > now) {
      issue('licence_issued_on', 'Issue date cannot be in the future')
    }
    if (
      values.licence_issued_on &&
      values.licence_expiry &&
      values.licence_issued_on >= values.licence_expiry
    ) {
      issue('licence_expiry', 'Expiry must be after the issue date')
    }
    if (values.police_verified_on && values.police_verified_on > now) {
      issue('police_verified_on', 'Verification date cannot be in the future')
    }
    if (
      values.police_verified_on &&
      values.police_verification_expiry &&
      values.police_verified_on >= values.police_verification_expiry
    ) {
      issue('police_verification_expiry', 'Valid till must be after the verification date')
    }
  })

type FormValues = z.infer<typeof schema>
type FieldName = Exclude<keyof FormValues, 'send_invite' | 'role'>

const FIELDS = Object.keys(schema.shape) as (keyof FormValues)[]

const ROLE_OPTIONS = (Object.keys(ROLE_LABELS) as CrewRole[]).map((value) => ({
  value,
  label: ROLE_LABELS[value],
}))

interface CrewFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  member?: CrewDetail
  onSaved?: (id: number) => void
}

export function CrewFormModal({ open, onOpenChange, member, onSaved }: CrewFormModalProps) {
  const save = useCrewMutation((input: CreateCrewInput | UpdateCrewInput) =>
    member ? crewApi.update(member.id, input) : crewApi.create(input as CreateCrewInput)
  )
  return (
    <AppModal
      open={open}
      onOpenChange={onOpenChange}
      title={member ? `Edit ${member.name}` : 'Add driver or attendant'}
      description={
        member
          ? 'Changing a licence, badge, medical or police detail takes them off duty until approved again.'
          : 'They get a driver app login. Upload and verify their documents next, then approve them for duty.'
      }
      formId={FORM_ID}
      submitText={member ? 'Save changes' : 'Add'}
      loading={save.isPending}
      size='lg'
    >
      {open && (
        <CrewForm
          key={member?.id ?? 'new'}
          member={member}
          onSubmit={async (input) => {
            const saved = await save.mutateAsync(input)
            alerts.success(member ? `${saved.name} updated` : `${saved.name} added`)
            onOpenChange(false)
            onSaved?.(saved.id)
          }}
        />
      )}
    </AppModal>
  )
}

function CrewForm({
  member,
  onSubmit,
}: {
  member?: CrewDetail
  onSubmit: (input: CreateCrewInput | UpdateCrewInput) => Promise<void>
}) {
  const [photo, setPhoto] = useState({
    id: member?.photo_file_id ?? null,
    url: member?.photo_url ?? null,
  })
  const [uploading, setUploading] = useState(false)
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      role: member?.role ?? 'driver',
      name: member?.name ?? '',
      mobile: member?.mobile ?? '',
      email: member?.email ?? '',
      language: member?.language ?? 'ta',
      gender: member?.gender ?? '',
      dob: member?.dob ?? '',
      employee_no: member?.employee_no ?? '',
      joining_date: member?.joining_date ?? today(),
      prior_experience_years: String(member?.prior_experience_years ?? 0),
      address: member?.address ?? '',
      emergency_contact_name: member?.emergency_contact_name ?? '',
      emergency_contact_mobile: member?.emergency_contact_mobile ?? '',
      licence_no: member?.licence_no ?? '',
      licence_type: member?.licence_type ?? '',
      licence_issued_on: member?.licence_issued_on ?? '',
      licence_expiry: member?.licence_expiry ?? '',
      badge_no: member?.badge_no ?? '',
      badge_expiry: member?.badge_expiry ?? '',
      medical_fitness_expiry: member?.medical_fitness_expiry ?? '',
      police_verified_on: member?.police_verified_on ?? '',
      police_verification_expiry: member?.police_verification_expiry ?? '',
      send_invite: true,
    },
  })
  const role = useWatch({ control, name: 'role' })
  const name = useWatch({ control, name: 'name' })
  const driver = role === 'driver'

  const uploadPhoto = async (file: File) => {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      alerts.error('Choose a PNG, JPG or WEBP image')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      alerts.error('Photo must be 5 MB or smaller')
      return
    }
    setUploading(true)
    try {
      const uploaded = await filesApi.upload(file, 'staff_photo')
      setPhoto({ id: uploaded.id, url: uploaded.url })
    } catch (error) {
      alerts.error(toApiError(error).message)
    } finally {
      setUploading(false)
    }
  }

  const submit = handleSubmit(async (values) => {
    const clear = member ? null : undefined
    const text = (value: string) => value.trim() || clear
    const upper = (value: string) => value.toUpperCase().replace(/\s+/g, '') || clear
    const input: UpdateCrewInput = {
      name: values.name.trim(),
      mobile: values.mobile,
      email: text(values.email),
      language: values.language,
      gender: (values.gender || clear) as UpdateCrewInput['gender'],
      dob: values.dob || clear,
      joining_date: values.joining_date || undefined,
      prior_experience_years: values.prior_experience_years
        ? Number(values.prior_experience_years)
        : undefined,
      address: text(values.address),
      emergency_contact_name: text(values.emergency_contact_name),
      emergency_contact_mobile: values.emergency_contact_mobile || clear,
      photo_file_id: photo.id ?? clear,
      employee_no: values.employee_no.trim() || undefined,
      medical_fitness_expiry: values.medical_fitness_expiry || clear,
      police_verified_on: values.police_verified_on || clear,
      police_verification_expiry: values.police_verification_expiry || clear,
      ...(driver
        ? {
            licence_no: upper(values.licence_no),
            licence_type: (values.licence_type || clear) as LicenceType | null | undefined,
            licence_issued_on: values.licence_issued_on || clear,
            licence_expiry: values.licence_expiry || clear,
            badge_no: upper(values.badge_no),
            badge_expiry: values.badge_expiry || clear,
          }
        : {}),
    }
    try {
      await onSubmit(
        member
          ? input
          : { ...(input as CreateCrewInput), role: values.role, send_invite: values.send_invite }
      )
    } catch (error) {
      const apiError = toApiError(error)
      let mapped = false
      apiError.fieldErrors.forEach((fieldError) => {
        const field = FIELDS.find((item) => item === fieldError.field)
        if (field) {
          setError(field, { message: fieldError.message }, { shouldFocus: !mapped })
          mapped = true
        }
      })
      if (apiError.code === 'MOBILE_TAKEN' || apiError.code === 'STAFF_EXISTS') {
        setError('mobile', { message: apiError.message }, { shouldFocus: true })
      } else if (apiError.code === 'EMPLOYEE_NO_TAKEN') {
        setError('employee_no', { message: apiError.message }, { shouldFocus: true })
      } else if (!mapped) {
        setError('root', { message: apiError.message })
      }
    }
  })

  const heading = 'text-xs font-bold tracking-wider text-muted-foreground uppercase'

  return (
    <form id={FORM_ID} onSubmit={submit} noValidate className='grid gap-5'>
      {errors.root?.message && (
        <p
          role='alert'
          className='rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive'
        >
          {errors.root.message}
        </p>
      )}

      {!member && (
        <FormField id='crew-role' label='Role' required>
          <Controller
            control={control}
            name='role'
            render={({ field }) => (
              <SegmentedControl
                label='Role'
                value={field.value}
                options={ROLE_OPTIONS}
                onChange={(value) => field.onChange(value)}
              />
            )}
          />
        </FormField>
      )}

      <section className='grid gap-3'>
        <h3 className={heading}>Person</h3>
        <div className='grid gap-3 sm:grid-cols-2'>
          <div className='flex items-center gap-4 sm:col-span-2'>
            <Avatar
              name={name || 'New crew'}
              src={photo.url}
              size='lg'
              previewable
              onChangePhoto={uploadPhoto}
              onRemovePhoto={() => setPhoto({ id: null, url: null })}
              isUploading={uploading}
              className='size-16 text-lg'
            />
            <div className='flex flex-wrap items-center gap-2'>
              <label className='inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-input bg-background px-3 py-1.5 text-xs font-semibold hover:bg-accent hover:text-accent-foreground'>
                <Camera className='size-3.5' />
                {uploading ? 'Uploading…' : photo.url ? 'Change photo' : 'Upload photo'}
                <input
                  type='file'
                  accept='image/jpeg,image/png,image/webp'
                  className='sr-only'
                  disabled={uploading}
                  onChange={(event) => {
                    const file = event.target.files?.[0]
                    if (file) void uploadPhoto(file)
                    event.target.value = ''
                  }}
                />
              </label>
              {photo.url && (
                <button
                  type='button'
                  onClick={() => setPhoto({ id: null, url: null })}
                  className='inline-flex items-center gap-1.5 rounded-md border border-input bg-background px-3 py-1.5 text-xs font-semibold text-destructive hover:bg-destructive/10'
                >
                  <Trash2 className='size-3.5' />
                  Remove
                </button>
              )}
            </div>
          </div>
          <FormField id='crew-name' label='Full name' required error={errors.name?.message}>
            <Input
              id='crew-name'
              autoFocus
              maxLength={120}
              placeholder='Ganesan Pillai'
              aria-invalid={Boolean(errors.name) || undefined}
              {...register('name')}
            />
          </FormField>
          <FormField id='crew-mobile' label='Mobile' required error={errors.mobile?.message}>
            <Controller
              control={control}
              name='mobile'
              render={({ field }) => (
                <MobileInput
                  id='crew-mobile'
                  value={field.value}
                  invalid={Boolean(errors.mobile)}
                  onChange={field.onChange}
                />
              )}
            />
          </FormField>
          <FormField id='crew-email' label='Email' error={errors.email?.message}>
            <Input
              id='crew-email'
              type='email'
              maxLength={120}
              aria-invalid={Boolean(errors.email) || undefined}
              {...register('email')}
            />
          </FormField>
          <FormField id='crew-language' label='App language'>
            <Controller
              control={control}
              name='language'
              render={({ field }) => (
                <Combobox
                  id='crew-language'
                  label='App language'
                  value={field.value}
                  options={LANGUAGE_OPTIONS}
                  placeholder='Choose language'
                  highlightSelected={false}
                  className='sm:w-full'
                  onChange={(value) => field.onChange(value ?? 'ta')}
                />
              )}
            />
          </FormField>
          <FormField id='crew-gender' label='Gender'>
            <Controller
              control={control}
              name='gender'
              render={({ field }) => (
                <Combobox
                  id='crew-gender'
                  label='Gender'
                  value={field.value || undefined}
                  options={toOptions(GENDER_LABELS)}
                  allLabel='Not set'
                  placeholder='Not set'
                  highlightSelected={false}
                  className='sm:w-full'
                  onChange={(value) => field.onChange(value ?? '')}
                />
              )}
            />
          </FormField>
          <DateField control={control} errors={errors} name='dob' label='Date of birth' max />
        </div>
      </section>

      <section className='grid gap-3'>
        <h3 className={heading}>Work</h3>
        <div className='grid gap-3 sm:grid-cols-2'>
          <FormField
            id='crew-employee-no'
            label='Employee number'
            hint={member ? undefined : 'Leave empty to generate'}
            error={errors.employee_no?.message}
          >
            <Input
              id='crew-employee-no'
              maxLength={30}
              className='font-mono'
              aria-invalid={Boolean(errors.employee_no) || undefined}
              {...register('employee_no')}
            />
          </FormField>
          <DateField control={control} errors={errors} name='joining_date' label='Joined on' max />
          <FormField
            id='crew-experience'
            label='Experience before joining (years)'
            error={errors.prior_experience_years?.message}
          >
            <Input
              id='crew-experience'
              type='number'
              inputMode='numeric'
              min={0}
              max={50}
              aria-invalid={Boolean(errors.prior_experience_years) || undefined}
              {...register('prior_experience_years')}
            />
          </FormField>
        </div>
      </section>

      {driver && (
        <section className='grid gap-3'>
          <h3 className={heading}>Driving licence and PSV badge</h3>
          <div className='grid gap-3 sm:grid-cols-2'>
            <FormField
              id='crew-licence-no'
              label='Licence number'
              error={errors.licence_no?.message}
            >
              <Input
                id='crew-licence-no'
                maxLength={24}
                placeholder='TN0920190012345'
                className='font-mono uppercase'
                aria-invalid={Boolean(errors.licence_no) || undefined}
                {...register('licence_no')}
              />
            </FormField>
            <FormField id='crew-licence-type' label='Licence type'>
              <Controller
                control={control}
                name='licence_type'
                render={({ field }) => (
                  <Combobox
                    id='crew-licence-type'
                    label='Licence type'
                    value={field.value || undefined}
                    options={toOptions(LICENCE_TYPE_LABELS)}
                    allLabel='Not set'
                    placeholder='Not set'
                    highlightSelected={false}
                    className='sm:w-full'
                    onChange={(value) => field.onChange(value ?? '')}
                  />
                )}
              />
            </FormField>
            <DateField
              control={control}
              errors={errors}
              name='licence_issued_on'
              label='Licence issued on'
              max
            />
            <DateField
              control={control}
              errors={errors}
              name='licence_expiry'
              label='Licence valid till'
            />
            <FormField id='crew-badge-no' label='PSV badge number' error={errors.badge_no?.message}>
              <Input
                id='crew-badge-no'
                maxLength={30}
                placeholder='PSV0912345'
                className='font-mono uppercase'
                aria-invalid={Boolean(errors.badge_no) || undefined}
                {...register('badge_no')}
              />
            </FormField>
            <DateField
              control={control}
              errors={errors}
              name='badge_expiry'
              label='Badge valid till'
            />
          </div>
        </section>
      )}

      <section className='grid gap-3'>
        <h3 className={heading}>Medical and police checks</h3>
        <div className='grid gap-3 sm:grid-cols-2'>
          <DateField
            control={control}
            errors={errors}
            name='medical_fitness_expiry'
            label='Medical fitness valid till'
          />
          <DateField
            control={control}
            errors={errors}
            name='police_verified_on'
            label='Police verification done on'
            max
          />
          <DateField
            control={control}
            errors={errors}
            name='police_verification_expiry'
            label='Police verification valid till'
          />
        </div>
      </section>

      <section className='grid gap-3'>
        <h3 className={heading}>Contact</h3>
        <div className='grid gap-3 sm:grid-cols-2'>
          <FormField
            id='crew-emergency-name'
            label='Emergency contact name'
            error={errors.emergency_contact_name?.message}
          >
            <Input
              id='crew-emergency-name'
              maxLength={120}
              aria-invalid={Boolean(errors.emergency_contact_name) || undefined}
              {...register('emergency_contact_name')}
            />
          </FormField>
          <FormField
            id='crew-emergency-mobile'
            label='Emergency contact mobile'
            error={errors.emergency_contact_mobile?.message}
          >
            <Controller
              control={control}
              name='emergency_contact_mobile'
              render={({ field }) => (
                <MobileInput
                  id='crew-emergency-mobile'
                  value={field.value}
                  invalid={Boolean(errors.emergency_contact_mobile)}
                  onChange={field.onChange}
                />
              )}
            />
          </FormField>
          <FormField
            id='crew-address'
            label='Address'
            error={errors.address?.message}
            className='sm:col-span-2'
          >
            <Textarea
              id='crew-address'
              rows={2}
              maxLength={255}
              aria-invalid={Boolean(errors.address) || undefined}
              {...register('address')}
            />
          </FormField>
        </div>
      </section>

      {!member && (
        <label className='flex items-center justify-between gap-4 rounded-lg border bg-muted/40 px-4 py-3'>
          <span className='grid gap-0.5'>
            <span className='text-sm font-semibold'>Send driver app invite</span>
            <span className='text-xs text-muted-foreground'>
              An SMS with the app link goes to the mobile number
            </span>
          </span>
          <Controller
            control={control}
            name='send_invite'
            render={({ field }) => (
              <Switch
                checked={field.value}
                onCheckedChange={field.onChange}
                aria-label='Send driver app invite'
              />
            )}
          />
        </label>
      )}
    </form>
  )
}

function DateField({
  control,
  errors,
  name,
  label,
  max,
}: {
  control: Control<FormValues>
  errors: FieldErrors<FormValues>
  name: FieldName
  label: string
  max?: boolean
}) {
  const id = `crew-${name.replace(/_/g, '-')}`
  return (
    <FormField id={id} label={label} error={errors[name]?.message}>
      <Controller
        control={control}
        name={name}
        render={({ field }) => (
          <Input
            id={id}
            type='date'
            max={max ? today() : undefined}
            value={String(field.value ?? '')}
            aria-invalid={Boolean(errors[name]) || undefined}
            onChange={(event) => field.onChange(event.target.value)}
          />
        )}
      />
    </FormField>
  )
}

function MobileInput({
  id,
  value,
  invalid,
  onChange,
}: {
  id: string
  value: string
  invalid: boolean
  onChange: (value: string) => void
}) {
  return (
    <div className='flex'>
      <span className='inline-flex h-9 items-center rounded-l-md border border-r-0 border-input bg-muted px-2.5 text-sm font-semibold text-muted-foreground'>
        +91
      </span>
      <Input
        id={id}
        type='tel'
        inputMode='numeric'
        maxLength={10}
        className='tabular rounded-l-none'
        value={value}
        aria-invalid={invalid || undefined}
        onChange={(event) => onChange(event.target.value.replace(/\D/g, '').slice(-10))}
      />
    </div>
  )
}
