import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { AppModal } from '@/components/common/app-modal'
import { Combobox } from '@/components/common/combobox'
import { FormField } from '@/components/common/form-field'
import { Input } from '@/components/ui/input'
import { applyFieldErrors } from '@/features/maintenance/helpers'
import { FormAlert } from '@/features/maintenance/components/shared'
import { alerts } from '@/lib/alerts'
import { toApiError } from '@/lib/api/errors'
import {
  officeApi,
  useOfficeMutation,
  type SchoolBoard,
  type SetupClass,
  type WingInput,
  type WingSetup,
} from '../api'
import { BOARD_OPTIONS, GRADE_OPTIONS, className } from '../labels'
import { MultiPick } from './shared'

const FORM_ID = 'office-wing-form'

const schema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, 'Enter the name, 2 to 60 letters')
      .max(60, 'Enter the name, 2 to 60 letters'),
    from_grade: z.string().min(1, 'Pick the first class'),
    to_grade: z.string().min(1, 'Pick the last class'),
    class_ids: z.array(z.string()),
    board: z.string(),
    sort_order: z
      .string()
      .trim()
      .refine(
        (value) => value === '' || (/^\d+$/.test(value) && Number(value) <= 99),
        'Enter 0 to 99'
      ),
  })
  .refine((values) => Number(values.to_grade) >= Number(values.from_grade), {
    path: ['to_grade'],
    message: 'The last class must come after the first',
  })

type FormValues = z.infer<typeof schema>
const FIELDS: (keyof FormValues)[] = [
  'name',
  'from_grade',
  'to_grade',
  'class_ids',
  'board',
  'sort_order',
]

interface WingFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  wing: WingSetup | null
  classes: SetupClass[]
  nextOrder: number
}

export function WingFormModal({
  open,
  onOpenChange,
  wing,
  classes,
  nextOrder,
}: WingFormModalProps) {
  const save = useOfficeMutation((input: WingInput) =>
    wing ? officeApi.updateWing(wing.id, input) : officeApi.addWing(input)
  )
  return (
    <AppModal
      open={open}
      onOpenChange={onOpenChange}
      title={wing ? `Edit ${wing.name}` : 'Add a wing'}
      description='A wing groups classes by grade (or by exact classes for a school with two boards). Each wing can have its own AO.'
      formId={FORM_ID}
      submitText={wing ? 'Save wing' : 'Add wing'}
      loading={save.isPending}
      size='lg'
    >
      {open && (
        <WingForm
          key={wing?.id ?? 'new'}
          wing={wing}
          classes={classes}
          nextOrder={nextOrder}
          onSubmit={async (input) => {
            await save.mutateAsync(input)
            alerts.success(wing ? 'Wing saved' : 'Wing added')
            onOpenChange(false)
          }}
        />
      )}
    </AppModal>
  )
}

function WingForm({
  wing,
  classes,
  nextOrder,
  onSubmit,
}: {
  wing: WingSetup | null
  classes: SetupClass[]
  nextOrder: number
  onSubmit: (input: WingInput) => Promise<void>
}) {
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: wing?.name ?? '',
      from_grade: wing ? String(wing.from_grade) : '',
      to_grade: wing ? String(wing.to_grade) : '',
      class_ids: (wing?.class_ids ?? []).map(String),
      board: wing?.board ?? '',
      sort_order: String(wing?.sort_order ?? nextOrder),
    },
  })

  const classOptions = [...classes]
    .sort((a, b) => a.grade_level - b.grade_level)
    .map((item) => ({ value: String(item.id), label: className(item.name) }))

  const submit = handleSubmit(async (values) => {
    try {
      await onSubmit({
        name: values.name,
        from_grade: Number(values.from_grade),
        to_grade: Number(values.to_grade),
        class_ids: values.class_ids.length ? values.class_ids.map(Number) : null,
        board: (values.board || null) as SchoolBoard | null,
        sort_order: values.sort_order === '' ? undefined : Number(values.sort_order),
      })
    } catch (error) {
      const apiError = toApiError(error)
      if (apiError.code === 'WING_OVERLAP' || !applyFieldErrors(apiError, FIELDS, setError))
        setError('root', { message: apiError.message })
    }
  })

  return (
    <form id={FORM_ID} onSubmit={submit} noValidate className='grid gap-4 sm:grid-cols-2'>
      <FormAlert message={errors.root?.message} />
      <FormField
        id='wing-name'
        label='Name'
        required
        error={errors.name?.message}
        className='sm:col-span-2'
      >
        <Input
          id='wing-name'
          maxLength={60}
          placeholder='Primary'
          aria-invalid={Boolean(errors.name) || undefined}
          {...register('name')}
        />
      </FormField>
      <FormField id='wing-from' label='From class' required error={errors.from_grade?.message}>
        <Controller
          control={control}
          name='from_grade'
          render={({ field }) => (
            <Combobox
              id='wing-from'
              label='From class'
              placeholder='Pick the first class'
              options={GRADE_OPTIONS}
              value={field.value || undefined}
              onChange={(value) => field.onChange(value ?? '')}
              invalid={Boolean(errors.from_grade)}
              className='sm:w-full'
            />
          )}
        />
      </FormField>
      <FormField id='wing-to' label='To class' required error={errors.to_grade?.message}>
        <Controller
          control={control}
          name='to_grade'
          render={({ field }) => (
            <Combobox
              id='wing-to'
              label='To class'
              placeholder='Pick the last class'
              options={GRADE_OPTIONS}
              value={field.value || undefined}
              onChange={(value) => field.onChange(value ?? '')}
              invalid={Boolean(errors.to_grade)}
              className='sm:w-full'
            />
          )}
        />
      </FormField>
      <FormField
        id='wing-classes'
        label='Exact classes (optional)'
        error={errors.class_ids?.message}
        hint='Pick classes only for a school with two boards; otherwise the grade range decides.'
        className='sm:col-span-2'
      >
        <Controller
          control={control}
          name='class_ids'
          render={({ field }) => (
            <MultiPick
              id='wing-classes'
              label='Exact classes'
              placeholder='Add a class'
              options={classOptions}
              value={field.value}
              onChange={field.onChange}
              invalid={Boolean(errors.class_ids)}
            />
          )}
        />
      </FormField>
      <FormField id='wing-board' label='Board' error={errors.board?.message}>
        <Controller
          control={control}
          name='board'
          render={({ field }) => (
            <Combobox
              id='wing-board'
              label='Board'
              placeholder='Any board'
              allLabel='Any board'
              options={BOARD_OPTIONS}
              value={field.value || undefined}
              onChange={(value) => field.onChange(value ?? '')}
              invalid={Boolean(errors.board)}
              className='sm:w-full'
            />
          )}
        />
      </FormField>
      <FormField
        id='wing-order'
        label='Order'
        error={errors.sort_order?.message}
        hint='Lower numbers show first'
      >
        <Input
          id='wing-order'
          type='number'
          inputMode='numeric'
          min={0}
          max={99}
          aria-invalid={Boolean(errors.sort_order) || undefined}
          {...register('sort_order')}
        />
      </FormField>
    </form>
  )
}
