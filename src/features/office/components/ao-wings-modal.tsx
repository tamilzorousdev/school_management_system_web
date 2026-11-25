import { Controller, useFieldArray, useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, Trash2 } from 'lucide-react'
import { z } from 'zod'
import { AppModal } from '@/components/common/app-modal'
import { Combobox } from '@/components/common/combobox'
import { DatePicker } from '@/components/common/date-picker'
import { FormField } from '@/components/common/form-field'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FormAlert } from '@/features/maintenance/components/shared'
import { alerts } from '@/lib/alerts'
import { toApiError } from '@/lib/api/errors'
import {
  officeApi,
  useOfficeMutation,
  type AoWingInput,
  type SetupAo,
  type WingSetup,
} from '../api'

const FORM_ID = 'office-ao-wings-form'

const schema = z.object({
  wings: z
    .array(
      z
        .object({
          wing_id: z.string().min(1, 'Pick a wing'),
          valid_from: z.string(),
          valid_to: z.string(),
          note: z.string().trim().max(200, 'Up to 200 characters'),
        })
        .refine((row) => !row.valid_from || !row.valid_to || row.valid_to >= row.valid_from, {
          path: ['valid_to'],
          message: 'Must be on or after the start date',
        })
    )
    .refine(
      (rows) => new Set(rows.map((row) => row.wing_id)).size === rows.length,
      'Each wing can be picked once'
    ),
})

type FormValues = z.infer<typeof schema>

interface AoWingsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  ao: SetupAo | null
  wings: WingSetup[]
}

export function AoWingsModal({ open, onOpenChange, ao, wings }: AoWingsModalProps) {
  const save = useOfficeMutation((input: AoWingInput[]) => officeApi.setAoWings(ao?.id ?? 0, input))
  return (
    <AppModal
      open={open}
      onOpenChange={onOpenChange}
      title={ao ? `Wings for ${ao.name}` : 'AO wings'}
      description='An AO with no wing is the head AO: whole school and the AO monitor. Add dates to cover another AO’s wing during leave.'
      formId={FORM_ID}
      submitText='Save wings'
      loading={save.isPending}
      size='lg'
    >
      {open && ao && (
        <AoWingsForm
          key={ao.id}
          ao={ao}
          wings={wings}
          onSubmit={async (input) => {
            await save.mutateAsync(input)
            alerts.success('AO wings saved')
            onOpenChange(false)
          }}
        />
      )}
    </AppModal>
  )
}

function AoWingsForm({
  ao,
  wings,
  onSubmit,
}: {
  ao: SetupAo
  wings: WingSetup[]
  onSubmit: (input: AoWingInput[]) => Promise<void>
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
      wings: ao.wings.map((link) => ({
        wing_id: String(link.wing_id),
        valid_from: link.valid_from ?? '',
        valid_to: link.valid_to ?? '',
        note: link.note ?? '',
      })),
    },
  })
  const rows = useFieldArray({ control, name: 'wings' })
  const picked = useWatch({ control, name: 'wings' }).map((row) => row.wing_id)
  const options = wings.map((wing) => ({
    value: String(wing.id),
    label: wing.name,
    hint: wing.range_label,
  }))

  const submit = handleSubmit(async (values) => {
    try {
      await onSubmit(
        values.wings.map((row) => ({
          wing_id: Number(row.wing_id),
          valid_from: row.valid_from || null,
          valid_to: row.valid_to || null,
          note: row.note || null,
        }))
      )
    } catch (error) {
      const apiError = toApiError(error)
      let mapped = false
      apiError.fieldErrors.forEach((fieldError) => {
        const match = /^wings\.(\d+)\.(wing_id|valid_from|valid_to|note)$/.exec(fieldError.field)
        if (match) {
          setError(`wings.${Number(match[1])}.${match[2] as 'wing_id'}`, {
            message: fieldError.message,
          })
          mapped = true
        }
      })
      if (!mapped) setError('root', { message: apiError.message })
    }
  })

  return (
    <form id={FORM_ID} onSubmit={submit} noValidate className='grid gap-4'>
      <FormAlert
        message={errors.root?.message ?? errors.wings?.root?.message ?? errors.wings?.message}
      />
      {rows.fields.length === 0 && (
        <p className='rounded-lg border border-info/30 bg-info/10 px-3 py-2 text-sm text-info'>
          No wing: {ao.name} is the head AO and sees the whole school.
        </p>
      )}
      {rows.fields.map((row, index) => {
        const rowErrors = errors.wings?.[index]
        return (
          <fieldset key={row.id} className='grid gap-3 rounded-lg border p-3 sm:grid-cols-2'>
            <legend className='sr-only'>Wing {index + 1}</legend>
            <FormField
              id={`ao-wing-${index}`}
              label='Wing'
              required
              error={rowErrors?.wing_id?.message}
            >
              <Controller
                control={control}
                name={`wings.${index}.wing_id`}
                render={({ field }) => (
                  <Combobox
                    id={`ao-wing-${index}`}
                    label='Wing'
                    placeholder='Pick a wing'
                    options={options.filter(
                      (option) => option.value === field.value || !picked.includes(option.value)
                    )}
                    value={field.value || undefined}
                    onChange={(value) => field.onChange(value ?? '')}
                    invalid={Boolean(rowErrors?.wing_id)}
                    className='sm:w-full'
                  />
                )}
              />
            </FormField>
            <FormField id={`ao-note-${index}`} label='Note' error={rowErrors?.note?.message}>
              <Input
                id={`ao-note-${index}`}
                maxLength={200}
                placeholder='Leave cover for another AO'
                {...register(`wings.${index}.note`)}
              />
            </FormField>
            <FormField
              id={`ao-from-${index}`}
              label='Cover from'
              hint='Empty = from now'
              error={rowErrors?.valid_from?.message}
            >
              <Controller
                control={control}
                name={`wings.${index}.valid_from`}
                render={({ field }) => (
                  <DatePicker
                    id={`ao-from-${index}`}
                    value={field.value}
                    clearable
                    invalid={Boolean(rowErrors?.valid_from)}
                    onChange={(value: string) => field.onChange(value)}
                  />
                )}
              />
            </FormField>
            <FormField
              id={`ao-to-${index}`}
              label='Cover until'
              hint='Empty = no end'
              error={rowErrors?.valid_to?.message}
            >
              <Controller
                control={control}
                name={`wings.${index}.valid_to`}
                render={({ field }) => (
                  <DatePicker
                    id={`ao-to-${index}`}
                    value={field.value}
                    clearable
                    invalid={Boolean(rowErrors?.valid_to)}
                    onChange={(value: string) => field.onChange(value)}
                  />
                )}
              />
            </FormField>
            <div className='flex justify-end sm:col-span-2'>
              <Button
                variant='ghost'
                size='sm'
                className='text-destructive hover:bg-destructive/10'
                onClick={() => rows.remove(index)}
              >
                <Trash2 />
                Remove wing
              </Button>
            </div>
          </fieldset>
        )
      })}
      <Button
        variant='outline'
        size='sm'
        className='justify-self-start'
        disabled={rows.fields.length >= wings.length}
        onClick={() => rows.append({ wing_id: '', valid_from: '', valid_to: '', note: '' })}
      >
        <Plus />
        Add a wing
      </Button>
    </form>
  )
}
