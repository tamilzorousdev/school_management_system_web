import { useState, type ReactNode } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { GraduationCap, Pencil, Phone, Smartphone } from 'lucide-react'
import { AppModal } from '@/components/common/app-modal'
import { Avatar } from '@/components/common/avatar'
import { Combobox } from '@/components/common/combobox'
import { ErrorState } from '@/components/common/display'
import { FormField } from '@/components/common/form-field'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { alerts } from '@/lib/alerts'
import { toApiError } from '@/lib/api/errors'
import { formatDate, timeAgo } from '@/lib/format'
import { ParentMeetings } from '@/features/meetings/components/parent-meetings'
import { SignaturePanel } from '@/features/signatures/signature-panel'
import { studentsApi, useGuardian, useStudentMutation, type GuardianDetail } from '../api'
import { RELATION_LABELS, yearsLabel } from '../labels'

export function GuardianSheet({
  guardianId,
  canManage,
  canSeeMeetings = false,
  onClose,
}: {
  guardianId: number | null
  canManage: boolean
  canSeeMeetings?: boolean
  onClose: () => void
}) {
  const navigate = useNavigate()
  const guardian = useGuardian(guardianId)
  const [editing, setEditing] = useState(false)
  const data = guardian.data

  return (
    <Sheet open={Boolean(guardianId)} onOpenChange={(open) => !open && onClose()}>
      <SheetContent aria-describedby={undefined}>
        {guardian.isError && !data ? (
          <ErrorState message={guardian.error.message} onRetry={() => guardian.refetch()} />
        ) : !data ? (
          <div className='grid gap-4 p-6'>
            <Skeleton className='h-16' />
            <Skeleton className='h-48' />
          </div>
        ) : (
          <>
            <SheetHeader>
              <div className='flex items-center gap-3'>
                <Avatar name={data.name} size='lg' />
                <div className='grid min-w-0 gap-0.5'>
                  <SheetTitle className='truncate'>{data.name}</SheetTitle>
                  <SheetDescription className='tabular'>+91 {data.mobile}</SheetDescription>
                  <div className='mt-1 flex flex-wrap gap-1.5'>
                    <Badge tone={data.on_app ? 'success' : 'warning'} dot>
                      {data.on_app
                        ? `On the app · ${timeAgo(data.last_login_at)}`
                        : 'Not on the app yet'}
                    </Badge>
                    <Badge tone='neutral'>
                      {data.children_count} {data.children_count === 1 ? 'child' : 'children'}
                    </Badge>
                    {data.language === 'ta' && <Badge tone='warning'>தமிழ்</Badge>}
                  </div>
                </div>
              </div>
            </SheetHeader>
            <SheetBody className='grid content-start gap-6'>
              <Block
                title='Details'
                action={
                  canManage && (
                    <Button
                      variant='secondary'
                      size='md'
                      className='w-[85px] h-9 px-4 gap-2 border border-[#C6CEC9] bg-white text-[#171B19] hover:bg-[#F9FAFB] font-medium'
                      onClick={() => setEditing(true)}
                    >
                      <Pencil className='size-4 stroke-[1.75] text-[#3C4440] dark:text-slate-300' />
                      Edit
                    </Button>
                  )
                }
              >
                <dl className='grid gap-x-6 gap-y-3 rounded-lg border p-3 sm:grid-cols-2'>
                  {[
                    ['Mobile', `+91 ${data.mobile}`],
                    ['Other mobile', data.alt_mobile ? `+91 ${data.alt_mobile}` : '—'],
                    ['Email', data.email ?? '—'],
                    ['Occupation', data.occupation ?? '—'],
                    ['Qualification', data.qualification ?? '—'],
                    [
                      'Address',
                      [data.address_line, data.city, data.pincode].filter(Boolean).join(', ') ||
                        '—',
                    ],
                  ].map(([label, value]) => (
                    <div key={label} className='grid gap-0.5'>
                      <dt className='text-[11px] font-bold tracking-wider text-muted-foreground uppercase'>
                        {label}
                      </dt>
                      <dd className='text-sm font-semibold break-words'>{value}</dd>
                    </div>
                  ))}
                </dl>
              </Block>

              <Block title='Children in this school'>
                <ul className='grid gap-2'>
                  {data.children.map((child) => (
                    <li key={child.id}>
                      <button
                        type='button'
                        onClick={() =>
                          void navigate({
                            to: '/students/$studentId',
                            params: { studentId: String(child.id) },
                            search: { tab: 'profile' },
                          })
                        }
                        className='flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/40 focus-visible:outline-none'
                      >
                        <span className='grid size-9 shrink-0 place-items-center rounded-full bg-primary/10 text-primary'>
                          <GraduationCap className='size-4' />
                        </span>
                        <span className='grid min-w-0 flex-1'>
                          <span className='truncate font-semibold'>{child.full_name}</span>
                          <span className='text-xs text-muted-foreground'>
                            Class {child.class_section ?? 'not placed'} ·{' '}
                            {RELATION_LABELS[child.relation]} · admitted{' '}
                            {formatDate(child.admission_date)}
                          </span>
                        </span>
                        <Badge tone='info'>{yearsLabel(child.years_in_school)}</Badge>
                      </button>
                    </li>
                  ))}
                </ul>
              </Block>

              {data.co_guardians.length > 0 && (
                <Block title='Other parent or guardian'>
                  <ul className='grid gap-2'>
                    {data.co_guardians.map((other) => (
                      <li key={other.id} className='flex items-center gap-3 rounded-lg border p-3'>
                        <Avatar name={other.name} size='sm' />
                        <span className='grid flex-1'>
                          <span className='font-semibold'>{other.name}</span>
                          <span className='text-xs text-muted-foreground'>
                            {RELATION_LABELS[other.relation]}
                          </span>
                        </span>
                        <span className='tabular inline-flex items-center gap-1 text-xs text-muted-foreground'>
                          <Phone className='size-3' />
                          +91 {other.mobile}
                        </span>
                      </li>
                    ))}
                  </ul>
                </Block>
              )}

              <Block title='Parent signature'>
                <SignaturePanel owner='guardians' ownerId={data.id} canManage={canManage} />
              </Block>

              {canSeeMeetings && (
                <Block title='Video meetings'>
                  <ParentMeetings guardianId={data.id} />
                </Block>
              )}

              <p className='flex items-center gap-2 text-xs text-muted-foreground'>
                <Smartphone className='size-4' />
                The login uses this mobile number. Changing it here also changes the login.
              </p>
            </SheetBody>
            {editing && <EditGuardianModal guardian={data} onOpenChange={setEditing} />}
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}

function Block({
  title,
  action,
  children,
}: {
  title: string
  action?: ReactNode
  children: ReactNode
}) {
  return (
    <section className='grid gap-3'>
      <div className='flex items-center justify-between gap-2'>
        <h3 className='text-xs font-bold tracking-wider text-muted-foreground uppercase'>
          {title}
        </h3>
        {action}
      </div>
      {children}
    </section>
  )
}

function EditGuardianModal({
  guardian,
  onOpenChange,
}: {
  guardian: GuardianDetail
  onOpenChange: (open: boolean) => void
}) {
  const [draft, setDraft] = useState({
    name: guardian.name,
    mobile: guardian.mobile,
    alt_mobile: guardian.alt_mobile ?? '',
    email: guardian.email ?? '',
    occupation: guardian.occupation ?? '',
    qualification: guardian.qualification ?? '',
    address_line: guardian.address_line ?? '',
    city: guardian.city ?? '',
    pincode: guardian.pincode ?? '',
    language: guardian.language ?? 'en',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const save = useStudentMutation(() =>
    studentsApi.updateGuardian(guardian.id, {
      name: draft.name.trim(),
      mobile: draft.mobile,
      alt_mobile: draft.alt_mobile || null,
      email: draft.email.trim() || null,
      occupation: draft.occupation.trim() || null,
      qualification: draft.qualification.trim() || null,
      address_line: draft.address_line.trim() || null,
      city: draft.city.trim() || null,
      pincode: draft.pincode || null,
      language: draft.language as 'en' | 'ta',
    })
  )
  const set = (field: keyof typeof draft, value: string) => {
    setDraft((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: '' }))
  }
  const digits = (value: string) => value.replace(/\D/g, '').slice(-10)

  return (
    <AppModal
      open
      onOpenChange={onOpenChange}
      title={`Edit ${guardian.name}`}
      formId='guardian-form'
      submitText='Save changes'
      loading={save.isPending}
      size='lg'
    >
      <form
        id='guardian-form'
        noValidate
        className='grid gap-3 sm:grid-cols-2'
        onSubmit={async (event) => {
          event.preventDefault()
          const next: Record<string, string> = {}
          if (draft.name.trim().length < 2) next.name = 'Enter the full name'
          if (!/^[6-9]\d{9}$/.test(draft.mobile))
            next.mobile = 'Enter a valid 10-digit mobile number'
          if (draft.alt_mobile && !/^[6-9]\d{9}$/.test(draft.alt_mobile))
            next.alt_mobile = 'Enter a valid 10-digit mobile number'
          if (draft.pincode && !/^\d{6}$/.test(draft.pincode))
            next.pincode = 'Pincode must be 6 digits'
          setErrors(next)
          if (Object.keys(next).length) return
          try {
            await save.mutateAsync(undefined)
            alerts.success('Parent details saved')
            onOpenChange(false)
          } catch (error) {
            const apiError = toApiError(error)
            const fieldErrors = Object.fromEntries(
              apiError.fieldErrors.map((item) => [item.field, item.message])
            )
            if (apiError.code === 'MOBILE_TAKEN') fieldErrors.mobile = apiError.message
            setErrors(Object.keys(fieldErrors).length ? fieldErrors : { root: apiError.message })
          }
        }}
      >
        {errors.root && (
          <p role='alert' className='text-sm font-medium text-destructive sm:col-span-2'>
            {errors.root}
          </p>
        )}
        <FormField id='g-name' label='Full name' required error={errors.name}>
          <Input
            id='g-name'
            value={draft.name}
            onChange={(event) => set('name', event.target.value)}
          />
        </FormField>
        <FormField id='g-mobile' label='Mobile' required error={errors.mobile}>
          <Input
            id='g-mobile'
            type='tel'
            inputMode='numeric'
            maxLength={10}
            className='tabular'
            value={draft.mobile}
            onChange={(event) => set('mobile', digits(event.target.value))}
          />
        </FormField>
        <FormField id='g-alt' label='Other mobile' error={errors.alt_mobile}>
          <Input
            id='g-alt'
            type='tel'
            inputMode='numeric'
            maxLength={10}
            className='tabular'
            value={draft.alt_mobile}
            onChange={(event) => set('alt_mobile', digits(event.target.value))}
          />
        </FormField>
        <FormField id='g-email' label='Email' error={errors.email}>
          <Input
            id='g-email'
            type='email'
            value={draft.email}
            onChange={(event) => set('email', event.target.value)}
          />
        </FormField>
        <FormField id='g-occupation' label='Occupation'>
          <Input
            id='g-occupation'
            value={draft.occupation}
            onChange={(event) => set('occupation', event.target.value)}
          />
        </FormField>
        <FormField id='g-qualification' label='Qualification'>
          <Input
            id='g-qualification'
            value={draft.qualification}
            onChange={(event) => set('qualification', event.target.value)}
          />
        </FormField>
        <FormField id='g-address' label='Address' className='sm:col-span-2'>
          <Input
            id='g-address'
            value={draft.address_line}
            onChange={(event) => set('address_line', event.target.value)}
          />
        </FormField>
        <FormField id='g-city' label='City'>
          <Input
            id='g-city'
            value={draft.city}
            onChange={(event) => set('city', event.target.value)}
          />
        </FormField>
        <FormField id='g-pincode' label='Pincode' error={errors.pincode}>
          <Input
            id='g-pincode'
            inputMode='numeric'
            maxLength={6}
            value={draft.pincode}
            onChange={(event) => set('pincode', event.target.value.replace(/\D/g, ''))}
          />
        </FormField>
        <FormField id='g-language' label='Language' hint='App and messages'>
          <Combobox
            id='g-language'
            label='Language'
            value={draft.language}
            placeholder='Choose language'
            options={[
              { value: 'en', label: 'English' },
              { value: 'ta', label: 'தமிழ் (Tamil)' },
            ]}
            onChange={(value) => set('language', value ?? 'en')}
            highlightSelected={false}
            className='sm:w-full'
          />
        </FormField>
      </form>
    </AppModal>
  )
}
