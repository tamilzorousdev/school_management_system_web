import { Controller, useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { AppModal } from '@/components/common/app-modal'
import { Combobox } from '@/components/common/combobox'
import { FormField } from '@/components/common/form-field'
import { SegmentedControl } from '@/components/common/segmented-control'
import { Input, Textarea } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { alerts } from '@/lib/alerts'
import {
  inventoryApi,
  useInventoryMutation,
  type Category,
  type CategoryKind,
  type Department,
  type Location,
  type LocationKind,
  type Store,
  type Vendor,
} from '../api'
import { CATEGORY_KIND, idOrNull, LOCATION_KIND, options, stringId } from '../labels'
import { applyApiError, numberOrNull, optionalNumber, textOrNull } from './master-errors'
import { CategoryPicker, LocationPicker, SectionPicker, StaffPicker } from './pickers'

function RootError({ message }: { message?: string }) {
  if (!message) return null
  return (
    <p
      role='alert'
      className='rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive sm:col-span-2'
    >
      {message}
    </p>
  )
}

function ActiveSwitch({
  id,
  checked,
  onChange,
  hint,
}: {
  id: string
  checked: boolean
  onChange: (checked: boolean) => void
  hint: string
}) {
  return (
    <div className='flex items-center justify-between gap-4 rounded-lg border bg-muted/40 px-4 py-3 sm:col-span-2'>
      <div className='grid gap-0.5'>
        <label htmlFor={id} className='text-sm font-semibold'>
          Active
        </label>
        <p className='text-xs text-muted-foreground'>{hint}</p>
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onChange} />
    </div>
  )
}

interface ModalProps<T> {
  open: boolean
  onOpenChange: (open: boolean) => void
  item: T | null
}

const codeRule = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z0-9-]{1,20}$/, 'Use 1 to 20 letters, digits or dashes')

const categorySchema = z.object({
  name: z.string().trim().min(2, 'Enter at least 2 characters').max(60, 'Keep it under 60'),
  code: codeRule,
  kind: z.enum(['asset', 'stock']),
  parent_id: z.string().optional(),
  depreciation_rate: z.string().refine((value) => optionalNumber(value, 0, 100), 'Enter 0 to 100'),
  useful_life_years: z
    .string()
    .refine((value) => optionalNumber(value, 1, 100, true), 'Enter whole years from 1 to 100'),
  maintenance_interval_days: z
    .string()
    .refine((value) => optionalNumber(value, 1, 3650, true), 'Enter whole days from 1 to 3650'),
  description: z.string().max(255, 'Keep it under 255 characters'),
})
type CategoryValues = z.infer<typeof categorySchema>

const CATEGORY_FORM = 'inventory-category-form'

export function CategoryModal({
  open,
  onOpenChange,
  item,
  defaultKind,
}: ModalProps<Category> & { defaultKind: CategoryKind }) {
  const save = useInventoryMutation(
    ({ id, input }: { id?: number; input: Parameters<typeof inventoryApi.createCategory>[0] }) =>
      id ? inventoryApi.updateCategory(id, input) : inventoryApi.createCategory(input)
  )
  return (
    <AppModal
      open={open}
      onOpenChange={onOpenChange}
      title={item ? 'Edit category' : 'Add category'}
      description='Asset categories group the register; stock categories group store items.'
      formId={CATEGORY_FORM}
      submitText={item ? 'Save category' : 'Add category'}
      loading={save.isPending}
      size='lg'
    >
      {open && (
        <CategoryForm
          item={item}
          defaultKind={defaultKind}
          onSubmit={async (input) => {
            await save.mutateAsync({ id: item?.id, input })
            alerts.success(item ? 'Category saved' : 'Category added')
            onOpenChange(false)
          }}
        />
      )}
    </AppModal>
  )
}

function CategoryForm({
  item,
  defaultKind,
  onSubmit,
}: {
  item: Category | null
  defaultKind: CategoryKind
  onSubmit: (input: Parameters<typeof inventoryApi.createCategory>[0]) => Promise<void>
}) {
  const {
    register,
    control,
    handleSubmit,
    setError,
    setValue,
    formState: { errors },
  } = useForm<CategoryValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: item?.name ?? '',
      code: item?.code ?? '',
      kind: item?.kind ?? defaultKind,
      parent_id: stringId(item?.parent?.id),
      depreciation_rate: item?.depreciation_rate?.toString() ?? '',
      useful_life_years: item?.useful_life_years?.toString() ?? '',
      maintenance_interval_days: item?.maintenance_interval_days?.toString() ?? '',
      description: item?.description ?? '',
    },
  })
  const kind = useWatch({ control, name: 'kind' })

  const submit = handleSubmit(async (values) => {
    try {
      await onSubmit({
        name: values.name,
        code: values.code,
        kind: values.kind,
        parent_id: idOrNull(values.parent_id),
        depreciation_rate: values.kind === 'asset' ? numberOrNull(values.depreciation_rate) : null,
        useful_life_years: values.kind === 'asset' ? numberOrNull(values.useful_life_years) : null,
        maintenance_interval_days:
          values.kind === 'asset' ? numberOrNull(values.maintenance_interval_days) : null,
        description: textOrNull(values.description),
      })
    } catch (error) {
      applyApiError(
        error,
        setError,
        [
          'name',
          'code',
          'kind',
          'parent_id',
          'depreciation_rate',
          'useful_life_years',
          'maintenance_interval_days',
          'description',
        ],
        { CATEGORY_EXISTS: 'code' }
      )
    }
  })

  return (
    <form id={CATEGORY_FORM} onSubmit={submit} noValidate className='grid gap-4 sm:grid-cols-2'>
      <RootError message={errors.root?.message} />
      <FormField id='category-name' label='Name' required error={errors.name?.message}>
        <Input
          id='category-name'
          autoFocus
          placeholder='Laptops'
          aria-invalid={Boolean(errors.name)}
          {...register('name')}
        />
      </FormField>
      <FormField id='category-code' label='Code' required error={errors.code?.message}>
        <Input
          id='category-code'
          placeholder='LAP'
          className='font-mono uppercase'
          aria-invalid={Boolean(errors.code)}
          {...register('code')}
        />
      </FormField>
      <FormField id='category-kind' label='Kind' error={errors.kind?.message}>
        <SegmentedControl
          label='Category kind'
          value={kind}
          onChange={(value) => {
            setValue('kind', value)
            setValue('parent_id', undefined)
          }}
          options={(Object.keys(CATEGORY_KIND) as CategoryKind[]).map((value) => ({
            value,
            label: CATEGORY_KIND[value],
          }))}
          className='justify-self-start'
        />
      </FormField>
      <FormField id='category-parent' label='Parent category' error={errors.parent_id?.message}>
        <Controller
          control={control}
          name='parent_id'
          render={({ field }) => (
            <CategoryPicker
              id='category-parent'
              label='Parent category'
              allLabel='None (top level)'
              className='sm:w-full'
              kind={kind}
              exclude={item?.id}
              value={field.value}
              onChange={(value) => field.onChange(value)}
            />
          )}
        />
      </FormField>
      {kind === 'asset' && (
        <>
          <FormField
            id='category-rate'
            label='Depreciation rate (% per year)'
            error={errors.depreciation_rate?.message}
            hint='Or give the useful life instead'
          >
            <Input
              id='category-rate'
              inputMode='decimal'
              placeholder='25'
              aria-invalid={Boolean(errors.depreciation_rate)}
              {...register('depreciation_rate')}
            />
          </FormField>
          <FormField
            id='category-life'
            label='Useful life (years)'
            error={errors.useful_life_years?.message}
          >
            <Input
              id='category-life'
              inputMode='numeric'
              placeholder='4'
              aria-invalid={Boolean(errors.useful_life_years)}
              {...register('useful_life_years')}
            />
          </FormField>
          <FormField
            id='category-interval'
            label='Maintenance every (days)'
            error={errors.maintenance_interval_days?.message}
            hint='Used for preventive schedules on new assets'
          >
            <Input
              id='category-interval'
              inputMode='numeric'
              placeholder='180'
              aria-invalid={Boolean(errors.maintenance_interval_days)}
              {...register('maintenance_interval_days')}
            />
          </FormField>
        </>
      )}
      <FormField
        id='category-description'
        label='Description'
        error={errors.description?.message}
        className='sm:col-span-2'
      >
        <Textarea id='category-description' maxLength={255} {...register('description')} />
      </FormField>
    </form>
  )
}

const locationSchema = z.object({
  name: z.string().trim().min(2, 'Enter at least 2 characters').max(80, 'Keep it under 80'),
  code: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9 ·.-]{1,30}$/, 'Use 1 to 30 letters, digits, spaces, dots or dashes'),
  kind: z.enum([
    'classroom',
    'lab',
    'office',
    'staff_room',
    'store',
    'library',
    'hall',
    'ground',
    'other',
  ]),
  building: z.string().trim().max(40, 'Keep it under 40'),
  floor: z.string().trim().max(20, 'Keep it under 20'),
  section_id: z.string().optional(),
  is_active: z.boolean(),
})
type LocationValues = z.infer<typeof locationSchema>

const LOCATION_FORM = 'inventory-location-form'

export function LocationModal({ open, onOpenChange, item }: ModalProps<Location>) {
  const save = useInventoryMutation(
    ({ id, input }: { id?: number; input: Parameters<typeof inventoryApi.createLocation>[0] }) =>
      id ? inventoryApi.updateLocation(id, input) : inventoryApi.createLocation(input)
  )
  return (
    <AppModal
      open={open}
      onOpenChange={onOpenChange}
      title={item ? 'Edit location' : 'Add location'}
      description='Rooms, labs, offices and stores where assets are kept.'
      formId={LOCATION_FORM}
      submitText={item ? 'Save location' : 'Add location'}
      loading={save.isPending}
      size='lg'
    >
      {open && (
        <LocationForm
          item={item}
          onSubmit={async (input) => {
            await save.mutateAsync({ id: item?.id, input })
            alerts.success(item ? 'Location saved' : 'Location added')
            onOpenChange(false)
          }}
        />
      )}
    </AppModal>
  )
}

function LocationForm({
  item,
  onSubmit,
}: {
  item: Location | null
  onSubmit: (input: Parameters<typeof inventoryApi.createLocation>[0]) => Promise<void>
}) {
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<LocationValues>({
    resolver: zodResolver(locationSchema),
    defaultValues: {
      name: item?.name ?? '',
      code: item?.code ?? '',
      kind: item?.kind ?? 'classroom',
      building: item?.building ?? '',
      floor: item?.floor ?? '',
      section_id: stringId(item?.section?.id),
      is_active: item?.is_active ?? true,
    },
  })

  const submit = handleSubmit(async (values) => {
    try {
      await onSubmit({
        name: values.name,
        code: values.code,
        kind: values.kind,
        building: textOrNull(values.building),
        floor: textOrNull(values.floor),
        section_id: idOrNull(values.section_id),
        is_active: values.is_active,
      })
    } catch (error) {
      applyApiError(
        error,
        setError,
        ['name', 'code', 'kind', 'building', 'floor', 'section_id', 'is_active'],
        { LOCATION_EXISTS: 'code' }
      )
    }
  })

  return (
    <form id={LOCATION_FORM} onSubmit={submit} noValidate className='grid gap-4 sm:grid-cols-2'>
      <RootError message={errors.root?.message} />
      <FormField id='location-name' label='Name' required error={errors.name?.message}>
        <Input
          id='location-name'
          autoFocus
          placeholder='Computer Lab'
          aria-invalid={Boolean(errors.name)}
          {...register('name')}
        />
      </FormField>
      <FormField id='location-code' label='Code' required error={errors.code?.message}>
        <Input
          id='location-code'
          placeholder='B-LAB1'
          className='font-mono uppercase'
          aria-invalid={Boolean(errors.code)}
          {...register('code')}
        />
      </FormField>
      <FormField id='location-kind' label='Kind' error={errors.kind?.message}>
        <Controller
          control={control}
          name='kind'
          render={({ field }) => (
            <Combobox
              id='location-kind'
              label='Kind'
              value={field.value}
              options={options(LOCATION_KIND)}
              placeholder='Choose a kind'
              highlightSelected={false}
              className='sm:w-full'
              onChange={(value) => value && field.onChange(value as LocationKind)}
            />
          )}
        />
      </FormField>
      <FormField
        id='location-section'
        label='Class using this room'
        error={errors.section_id?.message}
      >
        <Controller
          control={control}
          name='section_id'
          render={({ field }) => (
            <SectionPicker
              id='location-section'
              label='Class'
              allLabel='None'
              className='sm:w-full'
              value={field.value}
              onChange={(value) => field.onChange(value)}
            />
          )}
        />
      </FormField>
      <FormField id='location-building' label='Building' error={errors.building?.message}>
        <Input id='location-building' placeholder='Block B' {...register('building')} />
      </FormField>
      <FormField id='location-floor' label='Floor' error={errors.floor?.message}>
        <Input id='location-floor' placeholder='1st' {...register('floor')} />
      </FormField>
      <Controller
        control={control}
        name='is_active'
        render={({ field }) => (
          <ActiveSwitch
            id='location-active'
            checked={field.value}
            onChange={field.onChange}
            hint='Inactive locations are hidden when allocating.'
          />
        )}
      />
    </form>
  )
}

const departmentSchema = z.object({
  name: z.string().trim().min(2, 'Enter at least 2 characters').max(60, 'Keep it under 60'),
  code: z
    .string()
    .trim()
    .toUpperCase()
    .refine(
      (value) => !value || /^[A-Z0-9-]{1,20}$/.test(value),
      'Use 1 to 20 letters, digits or dashes'
    ),
  head_user_id: z.string().optional(),
  description: z.string().max(255, 'Keep it under 255 characters'),
  is_active: z.boolean(),
})
type DepartmentValues = z.infer<typeof departmentSchema>

const DEPARTMENT_FORM = 'inventory-department-form'

export function DepartmentModal({ open, onOpenChange, item }: ModalProps<Department>) {
  const save = useInventoryMutation(
    ({ id, input }: { id?: number; input: Parameters<typeof inventoryApi.createDepartment>[0] }) =>
      id ? inventoryApi.updateDepartment(id, input) : inventoryApi.createDepartment(input)
  )
  return (
    <AppModal
      open={open}
      onOpenChange={onOpenChange}
      title={item ? 'Edit department' : 'Add department'}
      description='Assets and stock can be given to a department and its head.'
      formId={DEPARTMENT_FORM}
      submitText={item ? 'Save department' : 'Add department'}
      loading={save.isPending}
      size='lg'
    >
      {open && (
        <DepartmentForm
          item={item}
          onSubmit={async (input) => {
            await save.mutateAsync({ id: item?.id, input })
            alerts.success(item ? 'Department saved' : 'Department added')
            onOpenChange(false)
          }}
        />
      )}
    </AppModal>
  )
}

function DepartmentForm({
  item,
  onSubmit,
}: {
  item: Department | null
  onSubmit: (input: Parameters<typeof inventoryApi.createDepartment>[0]) => Promise<void>
}) {
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<DepartmentValues>({
    resolver: zodResolver(departmentSchema),
    defaultValues: {
      name: item?.name ?? '',
      code: item?.code ?? '',
      head_user_id: stringId(item?.head?.id),
      description: item?.description ?? '',
      is_active: item?.is_active ?? true,
    },
  })

  const submit = handleSubmit(async (values) => {
    try {
      await onSubmit({
        name: values.name,
        code: values.code || undefined,
        head_user_id: idOrNull(values.head_user_id),
        description: textOrNull(values.description),
        is_active: values.is_active,
      })
    } catch (error) {
      applyApiError(error, setError, ['name', 'code', 'head_user_id', 'description', 'is_active'], {
        DEPARTMENT_EXISTS: 'name',
      })
    }
  })

  return (
    <form id={DEPARTMENT_FORM} onSubmit={submit} noValidate className='grid gap-4 sm:grid-cols-2'>
      <RootError message={errors.root?.message} />
      <FormField id='department-name' label='Name' required error={errors.name?.message}>
        <Input
          id='department-name'
          autoFocus
          placeholder='Science'
          aria-invalid={Boolean(errors.name)}
          {...register('name')}
        />
      </FormField>
      <FormField
        id='department-code'
        label='Code'
        error={errors.code?.message}
        hint='Made from the name when left empty'
      >
        <Input
          id='department-code'
          placeholder='SCI'
          className='font-mono uppercase'
          aria-invalid={Boolean(errors.code)}
          {...register('code')}
        />
      </FormField>
      <FormField
        id='department-head'
        label='Head of department'
        error={errors.head_user_id?.message}
        className='sm:col-span-2'
      >
        <Controller
          control={control}
          name='head_user_id'
          render={({ field }) => (
            <StaffPicker
              id='department-head'
              label='Head of department'
              allLabel='Nobody yet'
              className='sm:w-full'
              value={field.value}
              initial={item?.head ? { value: String(item.head.id), label: item.head.name } : null}
              onChange={(value) => field.onChange(value)}
            />
          )}
        />
      </FormField>
      <FormField
        id='department-description'
        label='Description'
        error={errors.description?.message}
        className='sm:col-span-2'
      >
        <Textarea id='department-description' maxLength={255} {...register('description')} />
      </FormField>
      <Controller
        control={control}
        name='is_active'
        render={({ field }) => (
          <ActiveSwitch
            id='department-active'
            checked={field.value}
            onChange={field.onChange}
            hint='Inactive departments cannot receive new assets.'
          />
        )}
      />
    </form>
  )
}

const vendorSchema = z.object({
  name: z.string().trim().min(2, 'Enter at least 2 characters').max(120, 'Keep it under 120'),
  contact_person: z.string().trim().max(80, 'Keep it under 80'),
  phone: z
    .string()
    .trim()
    .refine((value) => !value || /^[0-9+ -]{6,15}$/.test(value), 'Enter 6 to 15 digits'),
  email: z
    .string()
    .trim()
    .max(120, 'Keep it under 120')
    .refine((value) => !value || z.email().safeParse(value).success, 'Enter a valid email'),
  gstin: z
    .string()
    .trim()
    .toUpperCase()
    .refine((value) => !value || /^[0-9A-Z]{15}$/.test(value), 'GSTIN is 15 letters and digits'),
  address: z.string().trim().max(255, 'Keep it under 255'),
  supplies: z.string().trim().max(255, 'Keep it under 255'),
  is_active: z.boolean(),
})
type VendorValues = z.infer<typeof vendorSchema>

const VENDOR_FORM = 'inventory-vendor-form'

export function VendorModal({ open, onOpenChange, item }: ModalProps<Vendor>) {
  const save = useInventoryMutation(
    ({ id, input }: { id?: number; input: Parameters<typeof inventoryApi.createVendor>[0] }) =>
      id ? inventoryApi.updateVendor(id, input) : inventoryApi.createVendor(input)
  )
  return (
    <AppModal
      open={open}
      onOpenChange={onOpenChange}
      title={item ? 'Edit vendor' : 'Add vendor'}
      description='Suppliers of assets and stock, and AMC or repair vendors.'
      formId={VENDOR_FORM}
      submitText={item ? 'Save vendor' : 'Add vendor'}
      loading={save.isPending}
      size='lg'
    >
      {open && (
        <VendorForm
          item={item}
          onSubmit={async (input) => {
            await save.mutateAsync({ id: item?.id, input })
            alerts.success(item ? 'Vendor saved' : 'Vendor added')
            onOpenChange(false)
          }}
        />
      )}
    </AppModal>
  )
}

function VendorForm({
  item,
  onSubmit,
}: {
  item: Vendor | null
  onSubmit: (input: Parameters<typeof inventoryApi.createVendor>[0]) => Promise<void>
}) {
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<VendorValues>({
    resolver: zodResolver(vendorSchema),
    defaultValues: {
      name: item?.name ?? '',
      contact_person: item?.contact_person ?? '',
      phone: item?.phone ?? '',
      email: item?.email ?? '',
      gstin: item?.gstin ?? '',
      address: item?.address ?? '',
      supplies: item?.supplies ?? '',
      is_active: item?.is_active ?? true,
    },
  })

  const submit = handleSubmit(async (values) => {
    try {
      await onSubmit({
        name: values.name,
        contact_person: textOrNull(values.contact_person),
        phone: textOrNull(values.phone),
        email: textOrNull(values.email),
        gstin: textOrNull(values.gstin),
        address: textOrNull(values.address),
        supplies: textOrNull(values.supplies),
        is_active: values.is_active,
      })
    } catch (error) {
      applyApiError(error, setError, [
        'name',
        'contact_person',
        'phone',
        'email',
        'gstin',
        'address',
        'supplies',
        'is_active',
      ])
    }
  })

  return (
    <form id={VENDOR_FORM} onSubmit={submit} noValidate className='grid gap-4 sm:grid-cols-2'>
      <RootError message={errors.root?.message} />
      <FormField id='vendor-name' label='Name' required error={errors.name?.message}>
        <Input
          id='vendor-name'
          autoFocus
          placeholder='Sri Ganesh Computers'
          aria-invalid={Boolean(errors.name)}
          {...register('name')}
        />
      </FormField>
      <FormField id='vendor-contact' label='Contact person' error={errors.contact_person?.message}>
        <Input id='vendor-contact' {...register('contact_person')} />
      </FormField>
      <FormField id='vendor-phone' label='Phone' error={errors.phone?.message}>
        <Input
          id='vendor-phone'
          type='tel'
          placeholder='9840012345'
          aria-invalid={Boolean(errors.phone)}
          {...register('phone')}
        />
      </FormField>
      <FormField id='vendor-email' label='Email' error={errors.email?.message}>
        <Input
          id='vendor-email'
          type='email'
          aria-invalid={Boolean(errors.email)}
          {...register('email')}
        />
      </FormField>
      <FormField id='vendor-gstin' label='GSTIN' error={errors.gstin?.message}>
        <Input
          id='vendor-gstin'
          placeholder='33ABCDE1234F1Z5'
          maxLength={15}
          className='font-mono uppercase'
          aria-invalid={Boolean(errors.gstin)}
          {...register('gstin')}
        />
      </FormField>
      <FormField id='vendor-supplies' label='Supplies' error={errors.supplies?.message}>
        <Input
          id='vendor-supplies'
          placeholder='Laptops, printers, AMC'
          {...register('supplies')}
        />
      </FormField>
      <FormField
        id='vendor-address'
        label='Address'
        error={errors.address?.message}
        className='sm:col-span-2'
      >
        <Textarea id='vendor-address' maxLength={255} {...register('address')} />
      </FormField>
      <Controller
        control={control}
        name='is_active'
        render={({ field }) => (
          <ActiveSwitch
            id='vendor-active'
            checked={field.value}
            onChange={field.onChange}
            hint='Inactive vendors stay on old records.'
          />
        )}
      />
    </form>
  )
}

const storeSchema = z.object({
  name: z.string().trim().min(2, 'Enter at least 2 characters').max(60, 'Keep it under 60'),
  code: codeRule,
  location_id: z.string().optional(),
  keeper_user_id: z.string().optional(),
  is_active: z.boolean(),
})
type StoreValues = z.infer<typeof storeSchema>

const STORE_FORM = 'inventory-store-form'

export function StoreModal({ open, onOpenChange, item }: ModalProps<Store>) {
  const save = useInventoryMutation(
    ({ id, input }: { id?: number; input: Parameters<typeof inventoryApi.createStore>[0] }) =>
      id ? inventoryApi.updateStore(id, input) : inventoryApi.createStore(input)
  )
  return (
    <AppModal
      open={open}
      onOpenChange={onOpenChange}
      title={item ? 'Edit store' : 'Add store'}
      description='A store holds stock items and assets not given out.'
      formId={STORE_FORM}
      submitText={item ? 'Save store' : 'Add store'}
      loading={save.isPending}
      size='lg'
    >
      {open && (
        <StoreForm
          item={item}
          onSubmit={async (input) => {
            await save.mutateAsync({ id: item?.id, input })
            alerts.success(item ? 'Store saved' : 'Store added')
            onOpenChange(false)
          }}
        />
      )}
    </AppModal>
  )
}

function StoreForm({
  item,
  onSubmit,
}: {
  item: Store | null
  onSubmit: (input: Parameters<typeof inventoryApi.createStore>[0]) => Promise<void>
}) {
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<StoreValues>({
    resolver: zodResolver(storeSchema),
    defaultValues: {
      name: item?.name ?? '',
      code: item?.code ?? '',
      location_id: stringId(item?.location?.id),
      keeper_user_id: stringId(item?.keeper?.id),
      is_active: item?.is_active ?? true,
    },
  })

  const submit = handleSubmit(async (values) => {
    try {
      await onSubmit({
        name: values.name,
        code: values.code,
        location_id: idOrNull(values.location_id),
        keeper_user_id: idOrNull(values.keeper_user_id),
        is_active: values.is_active,
      })
    } catch (error) {
      applyApiError(
        error,
        setError,
        ['name', 'code', 'location_id', 'keeper_user_id', 'is_active'],
        { STORE_EXISTS: 'code' }
      )
    }
  })

  return (
    <form id={STORE_FORM} onSubmit={submit} noValidate className='grid gap-4 sm:grid-cols-2'>
      <RootError message={errors.root?.message} />
      <FormField id='store-name' label='Name' required error={errors.name?.message}>
        <Input
          id='store-name'
          autoFocus
          placeholder='Main store'
          aria-invalid={Boolean(errors.name)}
          {...register('name')}
        />
      </FormField>
      <FormField id='store-code' label='Code' required error={errors.code?.message}>
        <Input
          id='store-code'
          placeholder='MAIN'
          className='font-mono uppercase'
          aria-invalid={Boolean(errors.code)}
          {...register('code')}
        />
      </FormField>
      <FormField id='store-location' label='Location' error={errors.location_id?.message}>
        <Controller
          control={control}
          name='location_id'
          render={({ field }) => (
            <LocationPicker
              id='store-location'
              label='Location'
              allLabel='Not set'
              className='sm:w-full'
              value={field.value}
              initial={
                item?.location
                  ? { value: String(item.location.id), label: item.location.name }
                  : null
              }
              onChange={(value) => field.onChange(value)}
            />
          )}
        />
      </FormField>
      <FormField id='store-keeper' label='Store keeper' error={errors.keeper_user_id?.message}>
        <Controller
          control={control}
          name='keeper_user_id'
          render={({ field }) => (
            <StaffPicker
              id='store-keeper'
              label='Store keeper'
              allLabel='Nobody yet'
              className='sm:w-full'
              value={field.value}
              initial={
                item?.keeper ? { value: String(item.keeper.id), label: item.keeper.name } : null
              }
              onChange={(value) => field.onChange(value)}
            />
          )}
        />
      </FormField>
      <Controller
        control={control}
        name='is_active'
        render={({ field }) => (
          <ActiveSwitch
            id='store-active'
            checked={field.value}
            onChange={field.onChange}
            hint='Inactive stores cannot receive or issue stock.'
          />
        )}
      />
    </form>
  )
}
