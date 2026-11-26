import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Check, CheckCircle2, Trash, UserCheck, XCircle } from 'lucide-react'
import { z } from 'zod'
import { AppModal } from '@/components/common/app-modal'
import { Combobox } from '@/components/common/combobox'
import { FormField } from '@/components/common/form-field'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import type { AppSection } from '@/features/auth/api'
import { alerts } from '@/lib/alerts'
import { toApiError } from '@/lib/api/errors'
import { cn } from '@/lib/utils'
import { useRoles, useSaveUser, type Role, type UserListItem } from '../api'
import { APP_LABELS, getRoleMeta } from '../labels'

const FORM_ID = 'user-form'
const LANGUAGE_OPTIONS = [
  { value: 'en', label: 'English' },
  { value: 'ta', label: 'தமிழ் (Tamil)' },
]
const APP_ORDER: AppSection[] = ['admin', 'staff', 'parent', 'driver']

const schema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Enter the full name')
    .max(120, 'Name must be 120 characters or less'),
  mobile: z
    .string()
    .trim()
    .regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit mobile number'),
  email: z
    .string()
    .trim()
    .max(150, 'Email must be 150 characters or less')
    .refine((value) => !value || z.email().safeParse(value).success, 'Enter a valid email address'),
  role_codes: z.array(z.string()).min(1, 'Choose at least one role'),
  language: z.enum(['en', 'ta']),
  active: z.boolean(),
})

type FormValues = z.infer<typeof schema>

interface UserFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user?: UserListItem | null
  canAssignSuperAdmin: boolean
  onDelete?: (user: UserListItem) => void
  currentUserId?: number
}

export function UserFormModal({
  open,
  onOpenChange,
  user,
  canAssignSuperAdmin,
  onDelete,
  currentUserId,
}: UserFormModalProps) {
  const save = useSaveUser()
  const editing = Boolean(user)

  return (
    <AppModal
      open={open}
      onOpenChange={onOpenChange}
      title={editing ? 'Edit user' : 'Create user'}
      description={
        editing
          ? 'Role and status changes apply the next time the app checks in.'
          : 'The user signs in with this mobile number and a one-time code.'
      }
      formId={FORM_ID}
      size='lg'
      footer={
        <div className='flex w-full items-center justify-between'>
          {editing && user && user.id !== currentUserId && onDelete ? (
            <Button
              type='button'
              variant='outline'
              className='border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-950/50'
              onClick={() => {
                onOpenChange(false)
                onDelete(user)
              }}
              disabled={save.isPending}
            >
              <Trash className='size-4 stroke-[1.75]' />
              Delete user
            </Button>
          ) : (
            <div />
          )}
          <div className='flex items-center gap-2'>
            <Button variant='secondary' onClick={() => onOpenChange(false)} disabled={save.isPending}>
              Cancel
            </Button>
            <Button type='submit' form={FORM_ID} variant='primary' loading={save.isPending}>
              {editing ? 'Save changes' : 'Create user'}
            </Button>
          </div>
        </div>
      }
    >
      <UserForm
        key={user?.id ?? 'new'}
        user={user ?? null}
        canAssignSuperAdmin={canAssignSuperAdmin}
        onSubmit={async (values) => {
          await save.mutateAsync({
            id: user?.id,
            input: {
              name: values.name,
              mobile: values.mobile,
              email: values.email || null,
              role_codes: values.role_codes,
              language: values.language,
              status: values.active ? 'active' : 'inactive',
            },
          })
          alerts.success(editing ? 'User updated' : 'User created', {
            description: editing
              ? undefined
              : `${values.name} can now sign in with +91 ${values.mobile}`,
          })
          onOpenChange(false)
        }}
      />
    </AppModal>
  )
}

interface UserFormProps {
  user: UserListItem | null
  canAssignSuperAdmin: boolean
  onSubmit: (values: FormValues) => Promise<void>
}

function UserForm({ user, canAssignSuperAdmin, onSubmit }: UserFormProps) {
  const roles = useRoles()
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: user?.name ?? '',
      mobile: user?.mobile ?? '',
      email: user?.email ?? '',
      role_codes: user?.roles.map((role) => role.code) ?? [],
      language: user?.language ?? 'en',
      active: (user?.status ?? 'active') === 'active',
    },
  })

  const submit = handleSubmit(async (values) => {
    try {
      await onSubmit(values)
    } catch (error) {
      const apiError = toApiError(error)
      const fields: (keyof FormValues)[] = ['name', 'mobile', 'email', 'role_codes', 'language']
      let mapped = false
      apiError.fieldErrors.forEach((fieldError) => {
        const field = fields.find((name) => name === fieldError.field)
        if (field) {
          setError(field, { message: fieldError.message }, { shouldFocus: !mapped })
          mapped = true
        }
      })
      if (apiError.code === 'MOBILE_TAKEN') {
        setError('mobile', { message: apiError.message }, { shouldFocus: true })
      } else if (!mapped) {
        setError('root', { message: apiError.message })
      }
    }
  })

  const grouped = APP_ORDER.map((app) => ({
    app,
    roles: (roles.data ?? []).filter(
      (role) => role.app === app && (role.code !== 'SUPER_ADMIN' || canAssignSuperAdmin)
    ),
  })).filter((group) => group.roles.length)

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
      <div className='grid gap-4 sm:grid-cols-2'>
        <FormField id='name' label='Full name' required error={errors.name?.message}>
          <Input
            id='name'
            autoFocus
            autoComplete='off'
            placeholder='Priya Sundaram'
            aria-invalid={Boolean(errors.name)}
            {...register('name')}
          />
        </FormField>
        <FormField
          id='mobile'
          label='Mobile number'
          required
          error={errors.mobile?.message}
          hint='Used to sign in'
        >
          <div className='flex'>
            <span className='inline-flex h-9 items-center rounded-l-md border border-r-0 border-input bg-muted px-2.5 text-sm font-semibold text-muted-foreground'>
              +91
            </span>
            <Input
              id='mobile'
              type='tel'
              inputMode='numeric'
              maxLength={10}
              placeholder='9876543210'
              className='tabular rounded-l-none'
              aria-invalid={Boolean(errors.mobile)}
              {...register('mobile', {
                setValueAs: (value: string) => value.replace(/\D/g, '').slice(-10),
              })}
            />
          </div>
        </FormField>
        <FormField id='email' label='Email' error={errors.email?.message}>
          <Input
            id='email'
            type='email'
            autoComplete='off'
            placeholder='priya@school.in'
            aria-invalid={Boolean(errors.email)}
            {...register('email')}
          />
        </FormField>
        <FormField
          id='language'
          label='Language'
          hint='App text and notifications'
          error={errors.language?.message}
        >
          <Controller
            control={control}
            name='language'
            render={({ field }) => (
              <Combobox
                id='language'
                label='Language'
                value={field.value}
                placeholder='Choose a language'
                searchPlaceholder='Search language'
                options={LANGUAGE_OPTIONS}
                onChange={(value) => field.onChange(value ?? 'en')}
                highlightSelected={false}
                className='sm:w-full'
              />
            )}
          />
        </FormField>
      </div>

      <Controller
        control={control}
        name='role_codes'
        render={({ field }) => (
          <fieldset className='grid gap-3'>
            <legend className='mb-1 text-xs font-semibold'>
              Roles<span className='ml-0.5 text-destructive'>*</span>
            </legend>
            {roles.isPending ? (
              <div className='grid gap-2 sm:grid-cols-2'>
                {Array.from({ length: 4 }, (_, index) => (
                  <Skeleton key={index} className='h-14' />
                ))}
              </div>
            ) : (
              grouped.map((group) => (
                <div key={group.app} className='grid gap-2'>
                  <span className='text-[11px] font-bold tracking-wider text-muted-foreground uppercase'>
                    {APP_LABELS[group.app]}
                  </span>
                  <div className='grid gap-2 sm:grid-cols-2'>
                    {group.roles.map((role) => (
                      <RoleOption
                        key={role.code}
                        role={role}
                        checked={field.value.includes(role.code)}
                        onToggle={(checked) =>
                          field.onChange(
                            checked
                              ? [...field.value, role.code]
                              : field.value.filter((code) => code !== role.code)
                          )
                        }
                      />
                    ))}
                  </div>
                </div>
              ))
            )}
            {errors.role_codes?.message && (
              <p role='alert' className='text-xs font-medium text-destructive'>
                {errors.role_codes.message}
              </p>
            )}
          </fieldset>
        )}
      />

      <Controller
        control={control}
        name='active'
        render={({ field }) => (
          <div className='flex items-center justify-between gap-4 rounded-lg border bg-muted/40 px-4 py-3'>
            <div className='grid gap-0.5'>
              <label htmlFor='active' className='text-sm font-semibold'>
                Account active
              </label>
              <p className='text-xs text-muted-foreground'>
                Switching this off signs the user out on every device.
              </p>
            </div>
            <Switch id='active' checked={field.value} onCheckedChange={field.onChange} />
          </div>
        )}
      />
    </form>
  )
}

function RoleOption({
  role,
  checked,
  onToggle,
}: {
  role: Role
  checked: boolean
  onToggle: (checked: boolean) => void
}) {
  const meta = getRoleMeta(role.code)
  const canDoItems = checked ? (meta?.canDo ?? []) : (meta?.canDo.slice(0, 2) ?? [])
  const cannotDoItems = checked ? (meta?.cannotDo ?? []) : (meta?.cannotDo?.slice(0, 1) ?? [])
  const remainingCount = (meta?.canDo.length ?? 0) - canDoItems.length

  return (
    <label
      className={cn(
        'group relative flex cursor-pointer flex-col justify-between rounded-xl border p-3.5 transition-all select-none has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-ring/30',
        checked
          ? 'border-primary/80 bg-primary/5 ring-1 ring-primary/30 shadow-xs'
          : 'border-[#EDF0EE] bg-white hover:border-primary/40 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900'
      )}
    >
      <input
        type='checkbox'
        className='sr-only'
        checked={checked}
        onChange={(event) => onToggle(event.target.checked)}
      />
      <div>
        <div className='flex items-start gap-2.5'>
          <span
            className={cn(
              'mt-0.5 grid size-4 shrink-0 place-items-center rounded border transition-colors',
              checked
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-input bg-card group-hover:border-primary/50'
            )}
          >
            {checked && <Check className='size-3' strokeWidth={3} />}
          </span>
          <div className='grid min-w-0 gap-0.5 flex-1'>
            <span className='text-sm font-bold text-foreground'>{role.name}</span>
            {role.description && (
              <span className='text-xs leading-snug text-muted-foreground'>{role.description}</span>
            )}
          </div>
        </div>

        {meta && (
          <div
            className={cn(
              'mt-3 rounded-lg border p-2.5 text-xs transition-colors',
              checked
                ? 'border-primary/30 bg-background/80'
                : 'border-border/70 bg-muted/40'
            )}
          >
            <div className='flex items-center gap-1.5 font-semibold text-primary text-[11px]'>
              <UserCheck className='size-3.5 shrink-0' />
              <span className='truncate'>{meta.suitablePerson}</span>
            </div>

            <div className='mt-1.5 border-t border-border/60 pt-1.5 space-y-1 text-[11px]'>
              {canDoItems.map((item, idx) => (
                <div key={idx} className='flex items-start gap-1.5 leading-snug text-foreground/90'>
                  <CheckCircle2 className='mt-0.5 size-3 shrink-0 text-emerald-600 dark:text-emerald-400' />
                  <span>{item}</span>
                </div>
              ))}
              {cannotDoItems.map((item, idx) => (
                <div key={idx} className='flex items-start gap-1.5 leading-snug text-amber-700 dark:text-amber-400'>
                  <XCircle className='mt-0.5 size-3 shrink-0 text-amber-600 dark:text-amber-400' />
                  <span>{item}</span>
                </div>
              ))}
              {!checked && remainingCount > 0 && (
                <span className='inline-block pt-0.5 text-[10px] font-medium text-muted-foreground'>
                  + {remainingCount} more (select to expand)
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </label>
  )
}
