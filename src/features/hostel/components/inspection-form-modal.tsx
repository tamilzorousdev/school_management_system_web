import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm, useWatch, type Path } from 'react-hook-form'
import { z } from 'zod'
import { AppModal } from '@/components/common/app-modal'
import { Combobox } from '@/components/common/combobox'
import { ErrorState } from '@/components/common/display'
import { FormField } from '@/components/common/form-field'
import { SegmentedControl } from '@/components/common/segmented-control'
import { Badge } from '@/components/ui/badge'
import { Input, Textarea } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { can, useMe } from '@/features/auth/api'
import { alerts } from '@/lib/alerts'
import { toApiError } from '@/lib/api/errors'
import {
  useHostelMutation,
  useRoom,
  type DisciplineCategory,
  type MaintenanceCategory,
  type Priority,
  type Severity,
} from '../api'
import {
  roomsApi,
  useChecklist,
  useRoomAssets,
  type AssetCondition,
  type CheckResult,
  type InspectionDetail,
  type InspectionInput,
} from '../api-rooms'
import {
  DISCIPLINE_CATEGORY,
  labelOptions,
  MAINTENANCE_CATEGORY,
  PRIORITY,
  SEVERITY,
  toneOptions,
} from '../labels'
import { ASSET_CONDITION, CHECK_RESULT, inspectionScore, scoreTone } from './asset-labels'
import { RoomSelect } from './asset-room-select'
import { FormAlert, InfoNote, SwitchField } from './leave-form-parts'
import { textOrNull } from './leave-helpers'
import { HostelSelect, ResidentPicker } from './pickers'

const FORM_ID = 'hostel-inspection-form'

const CHECK_OPTIONS = (Object.keys(CHECK_RESULT) as CheckResult[]).map((value) => ({
  value,
  label: CHECK_RESULT[value].label,
}))

const CLEANLINESS = [
  { value: '1', label: '1 · Dirty' },
  { value: '2', label: '2 · Untidy' },
  { value: '3', label: '3 · Fair' },
  { value: '4', label: '4 · Clean' },
  { value: '5', label: '5 · Spotless' },
]

const schema = z
  .object({
    hostel_id: z.string().min(1, 'Choose a hostel'),
    room_id: z.string().min(1, 'Choose a room'),
    cleanliness: z.string(),
    items: z.array(
      z.object({
        item: z.string(),
        result: z.enum(['ok', 'issue', 'na']),
        note: z.string().trim().max(255, 'Up to 255 characters'),
      })
    ),
    notes: z.string().trim().max(500, 'Up to 500 characters'),
    update_assets: z.boolean(),
    raise_ticket: z.boolean(),
    ticket: z.object({
      category: z.string(),
      priority: z.enum(['low', 'normal', 'high', 'urgent']),
      title: z.string().trim(),
      description: z.string().trim().max(1000, 'Up to 1000 characters'),
      blocks_room: z.boolean(),
    }),
    raise_case: z.boolean(),
    conduct: z.object({
      admission_id: z.string(),
      category: z.string(),
      severity: z.string(),
      description: z.string().trim(),
    }),
  })
  .superRefine((values, ctx) => {
    const issue = (path: (string | number)[], message: string) =>
      ctx.addIssue({ code: 'custom', path, message })
    if (values.raise_ticket) {
      if (!values.ticket.category) issue(['ticket', 'category'], 'Choose a category')
      if (values.ticket.title.length < 3 || values.ticket.title.length > 120)
        issue(['ticket', 'title'], 'A short title, 3 to 120 characters')
    }
    if (values.raise_case) {
      if (!values.conduct.admission_id) issue(['conduct', 'admission_id'], 'Choose the resident')
      if (!values.conduct.category) issue(['conduct', 'category'], 'Choose a category')
      if (!values.conduct.severity) issue(['conduct', 'severity'], 'Choose the severity')
      if (values.conduct.description.length < 5 || values.conduct.description.length > 1000)
        issue(['conduct', 'description'], 'Describe what was found, 5 to 1000 characters')
    }
  })

type FormValues = z.infer<typeof schema>

const FIELD_NAMES: Path<FormValues>[] = [
  'room_id',
  'cleanliness',
  'notes',
  'ticket.category',
  'ticket.priority',
  'ticket.title',
  'ticket.description',
  'ticket.blocks_room',
  'conduct.admission_id',
  'conduct.category',
  'conduct.severity',
  'conduct.description',
]

const CODE_FIELDS: Record<string, Path<FormValues>> = {
  HOSTEL_ROOM_NOT_FOUND: 'room_id',
  HOSTEL_ADMISSION_NOT_FOUND: 'conduct.admission_id',
  HOSTEL_ADMISSION_CLOSED: 'conduct.admission_id',
  HOSTEL_TICKET_EXISTS: 'ticket.title',
}

const formField = (field: string) =>
  field
    .replace(/^raise_ticket\./, 'ticket.')
    .replace(/^raise_case\./, 'conduct.')
    .replace(/^admission_id$/, 'conduct.admission_id')

export interface InspectionDefaults {
  hostelId?: number
  roomId?: number
  roomNo?: string
}

export function InspectionFormModal({
  defaults,
  onClose,
  onCreated,
}: {
  defaults?: InspectionDefaults
  onClose: () => void
  onCreated?: (inspection: InspectionDetail) => void
}) {
  const checklist = useChecklist()
  const save = useHostelMutation((input: InspectionInput) => roomsApi.createInspection(input))

  return (
    <AppModal
      open
      onOpenChange={(open) => !open && onClose()}
      title='New room inspection'
      description='Go through the checklist; issues can raise a repair ticket or a conduct case.'
      formId={checklist.data ? FORM_ID : undefined}
      submitText='Save inspection'
      loading={save.isPending}
      size='lg'
    >
      {checklist.data ? (
        <InspectionForm
          checklist={checklist.data.items}
          defaults={defaults}
          onSubmit={async (input) => {
            const inspection = await save.mutateAsync(input)
            alerts.success('Inspection recorded', {
              description: [
                `Room ${inspection.room_no} scored ${inspection.score}%`,
                inspection.ticket_no && `ticket ${inspection.ticket_no}`,
                inspection.case_no && `case ${inspection.case_no}`,
              ]
                .filter(Boolean)
                .join(' · '),
            })
            onClose()
            onCreated?.(inspection)
          }}
        />
      ) : checklist.isError ? (
        <ErrorState message={checklist.error.message} onRetry={() => checklist.refetch()} />
      ) : (
        <div className='grid gap-3'>
          <Skeleton className='h-10' />
          <Skeleton className='h-64' />
        </div>
      )}
    </AppModal>
  )
}

function InspectionForm({
  checklist,
  defaults,
  onSubmit,
}: {
  checklist: string[]
  defaults?: InspectionDefaults
  onSubmit: (input: InspectionInput) => Promise<void>
}) {
  const me = useMe().data
  const canDiscipline = can(me, 'hostel.discipline')
  const [roomNo, setRoomNo] = useState(defaults?.roomNo ?? '')
  const [conditions, setConditions] = useState<Record<number, AssetCondition>>({})
  const {
    register,
    control,
    handleSubmit,
    setError,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      hostel_id: defaults?.hostelId ? String(defaults.hostelId) : '',
      room_id: defaults?.roomId ? String(defaults.roomId) : '',
      cleanliness: '',
      items: checklist.map((item) => ({ item, result: 'ok', note: '' })),
      notes: '',
      update_assets: false,
      raise_ticket: false,
      ticket: { category: '', priority: 'normal', title: '', description: '', blocks_room: false },
      raise_case: false,
      conduct: { admission_id: '', category: '', severity: 'minor', description: '' },
    },
  })
  const [hostelValue, roomValue, items, updateAssets, raiseTicket, raiseCase] = useWatch({
    control,
    name: ['hostel_id', 'room_id', 'items', 'update_assets', 'raise_ticket', 'raise_case'],
  })
  const hostelId = Number(hostelValue) || undefined
  const roomId = Number(roomValue) || 0
  const assets = useRoomAssets(roomId, updateAssets)
  const room = useRoom(raiseCase ? roomId : 0)
  const occupants = (room.data?.beds ?? []).flatMap((bed) =>
    bed.occupant
      ? [
          {
            value: String(bed.occupant.admission_id),
            label: bed.occupant.student_name,
            hint: [`Bed ${bed.bed_no}`, bed.occupant.class_section].filter(Boolean).join(' · '),
          },
        ]
      : []
  )
  const score = inspectionScore(items.map((item) => item.result))
  const issueCount = items.filter((item) => item.result === 'issue').length

  const submit = handleSubmit(async (values) => {
    const roomAssets = assets.data ?? []
    const changed = values.update_assets
      ? roomAssets
          .filter((asset) => conditions[asset.id] && conditions[asset.id] !== asset.condition)
          .map((asset) => ({ asset_id: asset.id, condition: conditions[asset.id] }))
      : []
    try {
      await onSubmit({
        room_id: Number(values.room_id),
        cleanliness: values.cleanliness ? Number(values.cleanliness) : undefined,
        items: values.items.map((item) => ({
          item: item.item,
          result: item.result,
          note: textOrNull(item.note),
        })),
        notes: textOrNull(values.notes),
        update_assets: changed.length ? changed : undefined,
        raise_ticket: values.raise_ticket
          ? {
              category: values.ticket.category as MaintenanceCategory,
              priority: values.ticket.priority,
              title: values.ticket.title,
              description: textOrNull(values.ticket.description),
              blocks_room: values.ticket.blocks_room,
            }
          : undefined,
        raise_case:
          values.raise_case && canDiscipline
            ? {
                admission_id: Number(values.conduct.admission_id),
                category: values.conduct.category as DisciplineCategory,
                severity: values.conduct.severity as Severity,
                description: values.conduct.description,
              }
            : undefined,
      })
    } catch (error) {
      const apiError = toApiError(error)
      const target = CODE_FIELDS[apiError.code]
      if (target) {
        setError(target, { message: apiError.message }, { shouldFocus: true })
        return
      }
      let mapped = false
      apiError.fieldErrors.forEach((fieldError) => {
        const name = formField(fieldError.field)
        const field =
          FIELD_NAMES.find((candidate) => candidate === name) ??
          (/^items\.\d+\.note$/.test(name) ? (name as Path<FormValues>) : undefined)
        if (field) {
          setError(field, { message: fieldError.message }, { shouldFocus: !mapped })
          mapped = true
        }
      })
      if (!mapped)
        setError('root', { message: apiError.fieldErrors[0]?.message ?? apiError.message })
    }
  })

  return (
    <form id={FORM_ID} noValidate onSubmit={submit} className='grid gap-5'>
      <FormAlert message={errors.root?.message} />
      <div className='grid gap-4 sm:grid-cols-3'>
        <FormField id='inspection-hostel' label='Hostel' required error={errors.hostel_id?.message}>
          <Controller
            control={control}
            name='hostel_id'
            render={({ field }) => (
              <HostelSelect
                id='inspection-hostel'
                value={field.value || undefined}
                invalid={Boolean(errors.hostel_id)}
                onChange={(value) => {
                  field.onChange(value ?? '')
                  setValue('room_id', '')
                  setValue('conduct.admission_id', '')
                  setRoomNo('')
                }}
              />
            )}
          />
        </FormField>
        <FormField id='inspection-room' label='Room' required error={errors.room_id?.message}>
          <Controller
            control={control}
            name='room_id'
            render={({ field }) => (
              <RoomSelect
                id='inspection-room'
                hostelId={hostelId}
                value={field.value || undefined}
                invalid={Boolean(errors.room_id)}
                initial={
                  defaults?.roomId && defaults.roomNo
                    ? { value: String(defaults.roomId), label: defaults.roomNo }
                    : null
                }
                onChange={(value, option) => {
                  field.onChange(value ?? '')
                  setValue('conduct.admission_id', '')
                  setRoomNo(option?.label ?? '')
                }}
              />
            )}
          />
        </FormField>
        <FormField id='inspection-clean' label='Cleanliness' error={errors.cleanliness?.message}>
          <Controller
            control={control}
            name='cleanliness'
            render={({ field }) => (
              <Combobox
                id='inspection-clean'
                label='Cleanliness'
                value={field.value || undefined}
                allLabel='Not rated'
                placeholder='Not rated'
                options={CLEANLINESS}
                highlightSelected={false}
                className='sm:w-full'
                onChange={(value) => field.onChange(value ?? '')}
              />
            )}
          />
        </FormField>
      </div>

      <div className='grid gap-2'>
        <div className='flex flex-wrap items-center justify-between gap-2'>
          <h3 className='text-sm font-bold'>Checklist</h3>
          <span className='flex items-center gap-2 text-xs text-muted-foreground'>
            {issueCount} {issueCount === 1 ? 'issue' : 'issues'}
            <Badge tone={scoreTone(score)}>Score {score}%</Badge>
          </span>
        </div>
        <ul className='divide-y rounded-lg border'>
          {checklist.map((item, index) => (
            <li key={item} className='grid gap-2 px-3 py-2.5'>
              <div className='flex flex-wrap items-center justify-between gap-2'>
                <span className='text-sm font-medium'>{item}</span>
                <Controller
                  control={control}
                  name={`items.${index}.result`}
                  render={({ field }) => (
                    <SegmentedControl
                      label={`Result for ${item}`}
                      value={field.value}
                      options={CHECK_OPTIONS}
                      onChange={field.onChange}
                    />
                  )}
                />
              </div>
              {(items[index]?.result === 'issue' || items[index]?.note) && (
                <div className='grid gap-1'>
                  <Input
                    id={`inspection-note-${index}`}
                    aria-label={`Note for ${item}`}
                    placeholder='What is wrong?'
                    maxLength={255}
                    className='h-8 text-sm'
                    aria-invalid={Boolean(errors.items?.[index]?.note)}
                    {...register(`items.${index}.note`)}
                  />
                  {errors.items?.[index]?.note && (
                    <p role='alert' className='text-xs font-medium text-destructive'>
                      {errors.items[index]?.note?.message}
                    </p>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>

      <FormField id='inspection-notes' label='Notes' error={errors.notes?.message} hint='Optional'>
        <Textarea
          id='inspection-notes'
          rows={2}
          maxLength={500}
          aria-invalid={Boolean(errors.notes)}
          {...register('notes')}
        />
      </FormField>

      <div className='grid gap-3'>
        <Controller
          control={control}
          name='update_assets'
          render={({ field }) => (
            <SwitchField
              id='inspection-update-assets'
              label='Update furniture condition'
              description='Record the condition of the beds, cupboards and fittings seen.'
              checked={field.value}
              onCheckedChange={field.onChange}
            />
          )}
        />
        {updateAssets && (
          <AssetConditions
            roomId={roomId}
            loading={assets.isPending}
            assets={assets.data ?? []}
            conditions={conditions}
            onChange={(id, condition) =>
              setConditions((current) => ({ ...current, [id]: condition }))
            }
          />
        )}

        <Controller
          control={control}
          name='raise_ticket'
          render={({ field }) => (
            <SwitchField
              id='inspection-raise-ticket'
              label='Raise a repair ticket'
              description='Opens a maintenance ticket for this room.'
              checked={field.value}
              onCheckedChange={(checked) => {
                field.onChange(checked)
                if (checked && !getValues('ticket.title') && roomNo)
                  setValue('ticket.title', `Repairs in room ${roomNo}`)
              }}
            />
          )}
        />
        {raiseTicket && (
          <div className='grid gap-4 rounded-lg border p-3 sm:grid-cols-2'>
            <FormField
              id='inspection-ticket-category'
              label='Category'
              required
              error={errors.ticket?.category?.message}
            >
              <Controller
                control={control}
                name='ticket.category'
                render={({ field }) => (
                  <Combobox
                    id='inspection-ticket-category'
                    label='Category'
                    value={field.value || undefined}
                    placeholder='Choose category'
                    options={labelOptions(MAINTENANCE_CATEGORY)}
                    invalid={Boolean(errors.ticket?.category)}
                    highlightSelected={false}
                    className='sm:w-full'
                    onChange={(value) => field.onChange(value ?? '')}
                  />
                )}
              />
            </FormField>
            <FormField id='inspection-ticket-priority' label='Priority' required>
              <Controller
                control={control}
                name='ticket.priority'
                render={({ field }) => (
                  <Combobox
                    id='inspection-ticket-priority'
                    label='Priority'
                    value={field.value}
                    placeholder='Choose priority'
                    options={toneOptions(PRIORITY)}
                    highlightSelected={false}
                    className='sm:w-full'
                    onChange={(value) => field.onChange((value ?? 'normal') as Priority)}
                  />
                )}
              />
            </FormField>
            <FormField
              id='inspection-ticket-title'
              label='Title'
              required
              className='sm:col-span-2'
              error={errors.ticket?.title?.message}
            >
              <Input
                id='inspection-ticket-title'
                autoComplete='off'
                maxLength={120}
                placeholder='Replace tube light'
                aria-invalid={Boolean(errors.ticket?.title)}
                {...register('ticket.title')}
              />
            </FormField>
            <FormField
              id='inspection-ticket-description'
              label='Details'
              className='sm:col-span-2'
              error={errors.ticket?.description?.message}
              hint='Leave empty to use the items marked as issues'
            >
              <Textarea
                id='inspection-ticket-description'
                rows={2}
                maxLength={1000}
                aria-invalid={Boolean(errors.ticket?.description)}
                {...register('ticket.description')}
              />
            </FormField>
            <div className='sm:col-span-2'>
              <Controller
                control={control}
                name='ticket.blocks_room'
                render={({ field }) => (
                  <SwitchField
                    id='inspection-ticket-blocks'
                    label='Close the room until it is fixed'
                    description='No new students are given a bed here until the ticket is done.'
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
            </div>
          </div>
        )}

        {canDiscipline && (
          <Controller
            control={control}
            name='raise_case'
            render={({ field }) => (
              <SwitchField
                id='inspection-raise-case'
                label='Raise a conduct case'
                description='For banned items or damage caused by a resident of this room.'
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            )}
          />
        )}
        {canDiscipline && raiseCase && (
          <div className='grid gap-4 rounded-lg border p-3 sm:grid-cols-2'>
            <FormField
              id='inspection-case-resident'
              label='Resident'
              required
              className='sm:col-span-2'
              error={errors.conduct?.admission_id?.message}
              hint={
                roomId && !room.isPending && !occupants.length
                  ? 'Nobody has a bed in this room; search the hostel instead.'
                  : undefined
              }
            >
              <Controller
                control={control}
                name='conduct.admission_id'
                render={({ field }) =>
                  occupants.length ? (
                    <Combobox
                      id='inspection-case-resident'
                      label='Resident'
                      value={field.value || undefined}
                      placeholder='Choose the resident'
                      options={occupants}
                      invalid={Boolean(errors.conduct?.admission_id)}
                      highlightSelected={false}
                      className='sm:w-full'
                      onChange={(value) => field.onChange(value ?? '')}
                    />
                  ) : (
                    <ResidentPicker
                      id='inspection-case-resident'
                      label='Resident'
                      hostelId={hostelId}
                      value={field.value || undefined}
                      invalid={Boolean(errors.conduct?.admission_id)}
                      onChange={(value) => field.onChange(value ?? '')}
                    />
                  )
                }
              />
            </FormField>
            <FormField
              id='inspection-case-category'
              label='Category'
              required
              error={errors.conduct?.category?.message}
            >
              <Controller
                control={control}
                name='conduct.category'
                render={({ field }) => (
                  <Combobox
                    id='inspection-case-category'
                    label='Category'
                    value={field.value || undefined}
                    placeholder='Choose category'
                    options={labelOptions(DISCIPLINE_CATEGORY)}
                    invalid={Boolean(errors.conduct?.category)}
                    highlightSelected={false}
                    className='sm:w-full'
                    onChange={(value) => field.onChange(value ?? '')}
                  />
                )}
              />
            </FormField>
            <FormField
              id='inspection-case-severity'
              label='Severity'
              required
              error={errors.conduct?.severity?.message}
            >
              <Controller
                control={control}
                name='conduct.severity'
                render={({ field }) => (
                  <Combobox
                    id='inspection-case-severity'
                    label='Severity'
                    value={field.value || undefined}
                    placeholder='Choose severity'
                    options={toneOptions(SEVERITY)}
                    invalid={Boolean(errors.conduct?.severity)}
                    highlightSelected={false}
                    className='sm:w-full'
                    onChange={(value) => field.onChange(value ?? '')}
                  />
                )}
              />
            </FormField>
            <FormField
              id='inspection-case-description'
              label='What was found'
              required
              className='sm:col-span-2'
              error={errors.conduct?.description?.message}
            >
              <Textarea
                id='inspection-case-description'
                rows={2}
                maxLength={1000}
                placeholder='Mobile phone found in the cupboard during room inspection'
                aria-invalid={Boolean(errors.conduct?.description)}
                {...register('conduct.description')}
              />
            </FormField>
          </div>
        )}
      </div>
    </form>
  )
}

function AssetConditions({
  roomId,
  loading,
  assets,
  conditions,
  onChange,
}: {
  roomId: number
  loading: boolean
  assets: { id: number; item_name: string; quantity: number; condition: AssetCondition }[]
  conditions: Record<number, AssetCondition>
  onChange: (id: number, condition: AssetCondition) => void
}) {
  if (!roomId) return <InfoNote>Choose a room to list its furniture.</InfoNote>
  if (loading) return <Skeleton className='h-24' />
  if (!assets.length)
    return (
      <InfoNote>
        No furniture is recorded for this room yet. Add it from the Assets tab or the room sheet.
      </InfoNote>
    )
  return (
    <ul className='divide-y rounded-lg border'>
      {assets.map((asset) => (
        <li key={asset.id} className='flex flex-wrap items-center justify-between gap-2 px-3 py-2'>
          <span className='text-sm'>
            <span className='font-medium'>{asset.item_name}</span>
            <span className='text-muted-foreground'> × {asset.quantity}</span>
          </span>
          <Combobox
            id={`inspection-asset-${asset.id}`}
            label={`Condition of ${asset.item_name}`}
            value={conditions[asset.id] ?? asset.condition}
            placeholder='Condition'
            options={toneOptions(ASSET_CONDITION)}
            highlightSelected={false}
            className='w-full sm:w-36'
            onChange={(value) => value && onChange(asset.id, value as AssetCondition)}
          />
        </li>
      ))}
    </ul>
  )
}
