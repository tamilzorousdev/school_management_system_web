import { useState, type FormEvent } from 'react'
import { Camera, Check, Trash2 } from 'lucide-react'
import { AppModal } from '@/components/common/app-modal'
import { Avatar } from '@/components/common/avatar'
import { Combobox } from '@/components/common/combobox'
import { FormField } from '@/components/common/form-field'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { can, useMe, type Language, type Me } from '@/features/auth/api'
import { RootError } from '@/features/setup/components/setup-shared'
import { alerts } from '@/lib/alerts'
import { toApiError } from '@/lib/api/errors'
import { filesApi } from '@/lib/files'
import { cn } from '@/lib/utils'
import {
  staffApi,
  useStaffMutation,
  type CreateStaffInput,
  type StaffDetail,
  type StaffGender,
  type StaffProfileInput,
  type StaffRoleCode,
  type StaffType,
  type UpdateStaffInput,
} from '../api'
import {
  GENDER_LABELS,
  LANGUAGE_OPTIONS,
  STAFF_ROLE_CODES,
  STAFF_ROLE_LABELS,
  STAFF_TYPE_LABELS,
  toOptions,
} from '../labels'
import {
  toQualificationInputs,
  validateQualifications,
  type QualificationDraft,
} from '../qualification-draft'
import { QualificationsEditor } from './qualifications-editor'

const FORM_ID = 'staff-form'
const MOBILE = /^[6-9]\d{9}$/
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const EMPLOYEE_NO = /^[A-Za-z0-9/_-]{1,30}$/

interface Draft {
  name: string
  mobile: string
  email: string
  language: Language
  role_codes: StaffRoleCode[]
  staff_type: StaffType | ''
  designation: string
  department: string
  gender: StaffGender | ''
  dob: string
  joining_date: string
  prior_experience_years: string
  max_periods_per_week: string
  address: string
  emergency_contact_name: string
  emergency_contact_mobile: string
  employee_no: string
  photo_file_id: number | null
  photo_url: string | null
}

const toDraft = (staff?: StaffDetail): Draft => ({
  name: staff?.name ?? '',
  mobile: staff?.mobile ?? '',
  email: staff?.email ?? '',
  language: staff?.language ?? 'en',
  role_codes: (staff?.roles ?? [])
    .map((role) => role.code as StaffRoleCode)
    .filter((code) => STAFF_ROLE_CODES.includes(code)),
  staff_type: staff?.staff_type ?? '',
  designation: staff?.designation ?? '',
  department: staff?.department ?? '',
  gender: staff?.gender ?? '',
  dob: staff?.dob ?? '',
  joining_date: staff?.joining_date ?? '',
  prior_experience_years: staff ? String(staff.prior_experience_years) : '',
  max_periods_per_week: staff ? String(staff.max_periods_per_week) : '',
  address: staff?.address ?? '',
  emergency_contact_name: staff?.emergency_contact_name ?? '',
  emergency_contact_mobile: staff?.emergency_contact_mobile ?? '',
  employee_no: staff?.employee_no ?? '',
  photo_file_id: staff?.photo_file_id ?? null,
  photo_url: staff?.photo_url ?? null,
})

const canGrantAdmin = (me: Me | undefined) =>
  can(me, 'users.manage') &&
  Boolean(me?.roles.some((role) => role.code === 'ADMIN' || role.code === 'SUPER_ADMIN'))

export function StaffFormModal({
  open,
  onOpenChange,
  staff,
  onSaved,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  staff?: StaffDetail
  onSaved?: (id: number) => void
}) {
  const create = useStaffMutation((input: CreateStaffInput) => staffApi.create(input))
  const update = useStaffMutation((input: UpdateStaffInput) => staffApi.update(staff!.id, input))
  const editing = Boolean(staff)
  return (
    <AppModal
      open={open}
      onOpenChange={onOpenChange}
      title={editing ? `Edit ${staff?.name}` : 'Add staff'}
      description={
        editing
          ? 'Changes to the mobile number change how this person signs in.'
          : 'Teachers and support staff sign in to the Staff app with this mobile number.'
      }
      formId={FORM_ID}
      submitText={editing ? 'Save changes' : 'Add staff'}
      size='lg'
      loading={create.isPending || update.isPending}
    >
      {open && (
        <StaffForm
          staff={staff}
          save={(input) =>
            staff ? update.mutateAsync(input) : create.mutateAsync(input as CreateStaffInput)
          }
          onDone={(saved) => {
            onOpenChange(false)
            onSaved?.(saved.id)
          }}
        />
      )}
    </AppModal>
  )
}

function StaffForm({
  staff,
  save,
  onDone,
}: {
  staff?: StaffDetail
  save: (input: CreateStaffInput | UpdateStaffInput) => Promise<StaffDetail>
  onDone: (staff: StaffDetail) => void
}) {
  const me = useMe().data
  const [draft, setDraft] = useState<Draft>(() => toDraft(staff))
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [qualifications, setQualifications] = useState<QualificationDraft[]>([])
  const [sendInvite, setSendInvite] = useState(true)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [rootError, setRootError] = useState<string | null>(null)
  const adminAllowed = canGrantAdmin(me)
  const roleChoices = STAFF_ROLE_CODES.filter(
    (code) => code !== 'ADMIN' || adminAllowed || draft.role_codes.includes('ADMIN')
  )

  const set = <K extends keyof Draft>(field: K, value: Draft[K]) => {
    setDraft((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: '' }))
  }

  const toggleRole = (code: StaffRoleCode) => {
    if (code === 'ADMIN' && !adminAllowed) return
    const selected = draft.role_codes.includes(code)
    if (!selected && draft.role_codes.length >= 4) {
      setErrors((current) => ({ ...current, role_codes: 'Choose up to 4 roles' }))
      return
    }
    const next = selected
      ? draft.role_codes.filter((item) => item !== code)
      : [...draft.role_codes, code]
    set('role_codes', next)
    if (!selected && !draft.staff_type)
      set('staff_type', code === 'TEACHER' || code === 'HOD' ? 'teaching' : 'non_teaching')
  }

  const validate = () => {
    const next: Record<string, string> = {}
    if (draft.name.trim().length < 2) next.name = 'Enter the full name'
    if (!MOBILE.test(draft.mobile)) next.mobile = 'Enter a valid 10-digit mobile number'
    if (draft.email.trim() && !EMAIL.test(draft.email.trim()))
      next.email = 'Enter a valid email address'
    if (!draft.role_codes.length) next.role_codes = 'Choose at least one role'
    if (!draft.staff_type) next.staff_type = 'Choose teaching or non-teaching'
    if (draft.designation.trim().length < 2) next.designation = 'Enter the designation'
    if (draft.employee_no.trim() && !EMPLOYEE_NO.test(draft.employee_no.trim()))
      next.employee_no = 'Use letters, digits, / _ and - only'
    const prior = Number(draft.prior_experience_years)
    if (draft.prior_experience_years && (prior < 0 || prior > 50))
      next.prior_experience_years = 'Enter 0 to 50 years'
    const max = Number(draft.max_periods_per_week)
    if (draft.max_periods_per_week && (max < 1 || max > 60))
      next.max_periods_per_week = 'Enter 1 to 60 periods'
    if (draft.emergency_contact_mobile && !MOBILE.test(draft.emergency_contact_mobile))
      next.emergency_contact_mobile = 'Enter a valid 10-digit mobile number'
    Object.assign(next, staff ? {} : validateQualifications(qualifications))
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setRootError(null)
    if (!validate()) return
    const blank = (value: string) => value.trim() || null
    const profile: StaffProfileInput = {
      name: draft.name.trim(),
      mobile: draft.mobile,
      email: blank(draft.email),
      language: draft.language,
      role_codes: draft.role_codes,
      staff_type: draft.staff_type as StaffType,
      designation: draft.designation.trim(),
      department: blank(draft.department),
      gender: draft.gender || null,
      dob: draft.dob || null,
      joining_date: draft.joining_date || undefined,
      prior_experience_years: draft.prior_experience_years
        ? Number(draft.prior_experience_years)
        : undefined,
      max_periods_per_week: draft.max_periods_per_week
        ? Number(draft.max_periods_per_week)
        : undefined,
      address: blank(draft.address),
      emergency_contact_name: blank(draft.emergency_contact_name),
      emergency_contact_mobile: draft.emergency_contact_mobile || null,
      employee_no: draft.employee_no.trim() || undefined,
      photo_file_id: draft.photo_file_id,
    }
    try {
      const { role_codes: _roles, ...withoutRoles } = profile
      const sameRoles =
        staff !== undefined &&
        [...toDraft(staff).role_codes].sort().join() === [...draft.role_codes].sort().join()
      const saved = await save(
        staff
          ? sameRoles
            ? withoutRoles
            : profile
          : {
              ...profile,
              qualifications: toQualificationInputs(qualifications),
              send_invite: sendInvite,
            }
      )
      alerts.success(staff ? 'Changes saved' : `${saved.name} added`, {
        description: staff ? undefined : `Employee number ${saved.employee_no}`,
      })
      onDone(saved)
    } catch (error) {
      const apiError = toApiError(error)
      const fieldErrors = Object.fromEntries(
        apiError.fieldErrors.map((item) => [item.field, item.message])
      )
      if (apiError.code === 'MOBILE_TAKEN' || apiError.code === 'STAFF_EXISTS')
        fieldErrors.mobile = apiError.message
      if (apiError.code === 'EMPLOYEE_NO_TAKEN' || apiError.code === 'EMPLOYEE_NO_EXHAUSTED')
        fieldErrors.employee_no = apiError.message
      setErrors(fieldErrors)
      if (!Object.keys(fieldErrors).length) setRootError(apiError.message)
    }
  }

  const today = new Date().toISOString().slice(0, 10)
  const heading = 'text-xs font-bold tracking-wider text-muted-foreground uppercase'

  const handleUploadPhoto = async (file: File) => {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      alerts.error('Choose a PNG, JPG or WEBP image')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      alerts.error('Photo must be 5 MB or smaller')
      return
    }
    setUploadingPhoto(true)
    try {
      const uploaded = await filesApi.upload(file, 'staff_photo')
      setDraft((current) => ({
        ...current,
        photo_file_id: uploaded.id,
        photo_url: uploaded.url,
      }))
    } catch (error) {
      alerts.error(toApiError(error).message)
    } finally {
      setUploadingPhoto(false)
    }
  }

  return (
    <form id={FORM_ID} onSubmit={submit} noValidate className='grid gap-5'>
      <RootError message={rootError ?? undefined} />

      <section className='grid gap-3'>
        <h3 className={heading}>Person</h3>
        <div className='grid gap-3 sm:grid-cols-2'>
          <div className='flex items-center gap-4 sm:col-span-2'>
            <Avatar
              name={draft.name || 'New Staff'}
              src={draft.photo_url}
              size='lg'
              previewable
              subtitle={draft.designation || undefined}
              onChangePhoto={handleUploadPhoto}
              onRemovePhoto={() =>
                setDraft((current) => ({ ...current, photo_file_id: null, photo_url: null }))
              }
              isUploading={uploadingPhoto}
              className='size-16 text-lg'
            />
            <div className='flex flex-wrap items-center gap-2'>
              <label className='inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-input bg-background px-3 py-1.5 text-xs font-semibold hover:bg-accent hover:text-accent-foreground'>
                <Camera className='size-3.5' />
                {uploadingPhoto ? 'Uploading…' : draft.photo_url ? 'Change photo' : 'Upload photo'}
                <input
                  type='file'
                  accept='image/jpeg,image/png,image/webp'
                  className='sr-only'
                  disabled={uploadingPhoto}
                  onChange={(event) => {
                    const file = event.target.files?.[0]
                    if (file) void handleUploadPhoto(file)
                    event.target.value = ''
                  }}
                />
              </label>
              {draft.photo_url && (
                <button
                  type='button'
                  onClick={() =>
                    setDraft((current) => ({ ...current, photo_file_id: null, photo_url: null }))
                  }
                  className='inline-flex items-center gap-1.5 rounded-md border border-input bg-background px-3 py-1.5 text-xs font-semibold text-destructive hover:bg-destructive/10'
                >
                  <Trash2 className='size-3.5' />
                  Remove
                </button>
              )}
            </div>
          </div>
          <FormField id='name' label='Full name' required error={errors.name}>
            <Input
              id='name'
              autoFocus
              maxLength={120}
              value={draft.name}
              onChange={(event) => set('name', event.target.value)}
            />
          </FormField>
          <FormField
            id='mobile'
            label='Mobile'
            required
            error={errors.mobile}
            hint='Used to sign in to the Staff app'
          >
            <MobileInput
              id='mobile'
              value={draft.mobile}
              onChange={(value) => set('mobile', value)}
            />
          </FormField>
          <FormField id='email' label='Email' error={errors.email}>
            <Input
              id='email'
              type='email'
              maxLength={150}
              value={draft.email}
              onChange={(event) => set('email', event.target.value)}
            />
          </FormField>
          <FormField id='language' label='App language' error={errors.language}>
            <Combobox
              id='language'
              label='App language'
              value={draft.language}
              placeholder='Choose language'
              options={LANGUAGE_OPTIONS}
              onChange={(value) => set('language', (value ?? 'en') as Language)}
              highlightSelected={false}
              className='sm:w-full'
            />
          </FormField>
          <FormField id='gender' label='Gender' error={errors.gender}>
            <Combobox
              id='gender'
              label='Gender'
              value={draft.gender || undefined}
              placeholder='Not given'
              allLabel='Not given'
              options={toOptions(GENDER_LABELS)}
              onChange={(value) => set('gender', (value ?? '') as StaffGender | '')}
              highlightSelected={false}
              className='sm:w-full'
            />
          </FormField>
          <FormField id='dob' label='Date of birth' error={errors.dob}>
            <Input
              id='dob'
              type='date'
              max={today}
              value={draft.dob}
              onChange={(event) => set('dob', event.target.value)}
            />
          </FormField>
        </div>
      </section>

      <section className='grid gap-3'>
        <h3 className={heading}>Work</h3>
        <fieldset className='grid gap-2'>
          <legend className='mb-1 text-xs font-semibold'>
            Roles<span className='ml-0.5 text-destructive'>*</span>
          </legend>
          <div className='flex flex-wrap gap-2'>
            {roleChoices.map((code) => {
              const selected = draft.role_codes.includes(code)
              const locked = code === 'ADMIN' && !adminAllowed
              return (
                <button
                  key={code}
                  type='button'
                  aria-pressed={selected}
                  disabled={locked}
                  onClick={() => toggleRole(code)}
                  className={cn(
                    'inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-xs font-semibold transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40 disabled:opacity-60',
                    selected
                      ? 'border-primary/50 bg-primary/10 text-primary'
                      : 'bg-card text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  {selected && <Check className='size-3.5' />}
                  {STAFF_ROLE_LABELS[code]}
                </button>
              )
            })}
          </div>
          {errors.role_codes ? (
            <p role='alert' className='text-xs font-medium text-destructive'>
              {errors.role_codes}
            </p>
          ) : (
            <p className='text-xs text-muted-foreground'>
              Up to 4 roles. Roles decide what the person can see.
            </p>
          )}
        </fieldset>
        <div className='grid gap-3 sm:grid-cols-2'>
          <FormField id='staff_type' label='Staff type' required error={errors.staff_type}>
            <Combobox
              id='staff_type'
              label='Staff type'
              value={draft.staff_type || undefined}
              placeholder='Choose type'
              options={toOptions(STAFF_TYPE_LABELS)}
              onChange={(value) => set('staff_type', (value ?? '') as StaffType | '')}
              invalid={Boolean(errors.staff_type)}
              highlightSelected={false}
              className='sm:w-full'
            />
          </FormField>
          <FormField id='designation' label='Designation' required error={errors.designation}>
            <Input
              id='designation'
              placeholder='PG Assistant'
              maxLength={80}
              value={draft.designation}
              onChange={(event) => set('designation', event.target.value)}
            />
          </FormField>
          <FormField id='department' label='Department' error={errors.department}>
            <Input
              id='department'
              placeholder='Mathematics'
              maxLength={60}
              value={draft.department}
              onChange={(event) => set('department', event.target.value)}
            />
          </FormField>
          <FormField
            id='employee_no'
            label='Employee number'
            error={errors.employee_no}
            hint={staff ? undefined : 'Leave empty to generate'}
          >
            <Input
              id='employee_no'
              maxLength={30}
              className='font-mono'
              value={draft.employee_no}
              onChange={(event) => set('employee_no', event.target.value)}
            />
          </FormField>
          <FormField
            id='joining_date'
            label='Joining date'
            error={errors.joining_date}
            hint={staff ? undefined : 'Defaults to today'}
          >
            <Input
              id='joining_date'
              type='date'
              value={draft.joining_date}
              onChange={(event) => set('joining_date', event.target.value)}
            />
          </FormField>
          <FormField
            id='prior_experience_years'
            label='Experience before joining'
            error={errors.prior_experience_years}
            hint='In years'
          >
            <Input
              id='prior_experience_years'
              type='number'
              inputMode='numeric'
              min={0}
              max={50}
              className='tabular'
              value={draft.prior_experience_years}
              onChange={(event) => set('prior_experience_years', event.target.value)}
            />
          </FormField>
          {draft.staff_type !== 'non_teaching' && (
            <FormField
              id='max_periods_per_week'
              label='Most periods a week'
              error={errors.max_periods_per_week}
              hint='Used to spot overloaded teachers'
            >
              <Input
                id='max_periods_per_week'
                type='number'
                inputMode='numeric'
                min={1}
                max={60}
                placeholder='30'
                className='tabular'
                value={draft.max_periods_per_week}
                onChange={(event) => set('max_periods_per_week', event.target.value)}
              />
            </FormField>
          )}
        </div>
      </section>

      <section className='grid gap-3'>
        <h3 className={heading}>Contact</h3>
        <div className='grid gap-3 sm:grid-cols-2'>
          <FormField id='address' label='Address' error={errors.address} className='sm:col-span-2'>
            <Input
              id='address'
              maxLength={255}
              value={draft.address}
              onChange={(event) => set('address', event.target.value)}
            />
          </FormField>
          <FormField
            id='emergency_contact_name'
            label='Emergency contact name'
            error={errors.emergency_contact_name}
          >
            <Input
              id='emergency_contact_name'
              maxLength={120}
              value={draft.emergency_contact_name}
              onChange={(event) => set('emergency_contact_name', event.target.value)}
            />
          </FormField>
          <FormField
            id='emergency_contact_mobile'
            label='Emergency contact mobile'
            error={errors.emergency_contact_mobile}
          >
            <MobileInput
              id='emergency_contact_mobile'
              value={draft.emergency_contact_mobile}
              onChange={(value) => set('emergency_contact_mobile', value)}
            />
          </FormField>
        </div>
      </section>

      {!staff && (
        <>
          <section className='grid gap-3'>
            <div className='grid gap-0.5'>
              <h3 className={heading}>Qualifications</h3>
              <p className='text-xs text-muted-foreground'>Optional. You can add these later.</p>
            </div>
            <QualificationsEditor
              value={qualifications}
              onChange={(next) => {
                setQualifications(next)
                setErrors((current) =>
                  Object.fromEntries(
                    Object.entries(current).filter(([key]) => !key.startsWith('qualifications'))
                  )
                )
              }}
              errors={errors}
            />
          </section>
          <label className='flex items-center justify-between gap-4 rounded-lg border bg-muted/40 px-4 py-3'>
            <span className='grid gap-0.5'>
              <span className='text-sm font-semibold'>Send Staff app invite</span>
              <span className='text-xs text-muted-foreground'>
                An SMS with the app link goes to the mobile number
              </span>
            </span>
            <Switch
              checked={sendInvite}
              onCheckedChange={setSendInvite}
              aria-label='Send Staff app invite'
            />
          </label>
        </>
      )}
    </form>
  )
}

function MobileInput({
  id,
  value,
  onChange,
}: {
  id: string
  value: string
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
        onChange={(event) => onChange(event.target.value.replace(/\D/g, '').slice(-10))}
      />
    </div>
  )
}
