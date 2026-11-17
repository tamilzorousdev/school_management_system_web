import { useState } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { AppModal } from '@/components/common/app-modal'
import { Combobox, type ComboboxOption } from '@/components/common/combobox'
import { FormField } from '@/components/common/form-field'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { useStudents } from '@/features/students/api'
import { useDebouncedValue } from '@/hooks/use-debounce'
import { alerts } from '@/lib/alerts'
import { toApiError } from '@/lib/api/errors'
import { cn } from '@/lib/utils'
import {
  transportApi,
  useBusRoutes,
  useRouteDetail,
  useRouteRoster,
  useTransportMutation,
  type Rider,
  type RiderInput,
  type TransportMode,
} from '../api'
import { MODE_OPTIONS } from '../labels'

const FORM_ID = 'assign-transport-form'

const schema = z
  .object({
    student_id: z.string().min(1, 'Choose a student'),
    route_id: z.string().min(1, 'Choose a route'),
    mode: z.enum(['both', 'pickup', 'drop']),
    stop_id: z.string().min(1, 'Choose a stop'),
    separate_drop: z.boolean(),
    drop_stop_id: z.string(),
    start_date: z.string(),
  })
  .superRefine((values, context) => {
    if (values.mode === 'both' && values.separate_drop && !values.drop_stop_id) {
      context.addIssue({
        code: 'custom',
        path: ['drop_stop_id'],
        message: 'Choose the evening drop stop',
      })
    }
    if (
      values.mode === 'both' &&
      values.separate_drop &&
      values.drop_stop_id &&
      values.drop_stop_id === values.stop_id
    ) {
      context.addIssue({
        code: 'custom',
        path: ['drop_stop_id'],
        message: 'Choose a different stop, or turn off the separate drop stop',
      })
    }
  })

type FormValues = z.infer<typeof schema>
const FIELDS = Object.keys(schema.shape) as (keyof FormValues)[]

const rides = (mode: TransportMode, kind: 'pickup' | 'drop') => mode === 'both' || mode === kind

interface AssignTransportModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  rider?: Rider | null
  student?: { id: number; full_name: string } | null
  defaultRouteId?: number
}

export function AssignTransportModal({
  open,
  onOpenChange,
  rider,
  student,
  defaultRouteId,
}: AssignTransportModalProps) {
  const fixedStudent = rider?.student ?? student ?? null
  const save = useTransportMutation((input: { studentId: number; body: RiderInput }) =>
    transportApi.setRider(input.studentId, input.body)
  )
  return (
    <AppModal
      open={open}
      onOpenChange={onOpenChange}
      title={
        rider
          ? `Change bus stop for ${rider.student.full_name}`
          : fixedStudent
            ? `Give ${fixedStudent.full_name} a bus stop`
            : 'Assign a student to a bus'
      }
      description='Pick the route, the morning pickup stop and, if it differs, the evening drop stop. Parents and the bus crew get a notification.'
      formId={FORM_ID}
      submitText={rider ? 'Save changes' : 'Assign'}
      loading={save.isPending}
      size='lg'
    >
      {open && (
        <AssignForm
          rider={rider ?? null}
          fixedStudent={fixedStudent}
          defaultRouteId={defaultRouteId}
          onSubmit={async (studentId, body, name) => {
            await save.mutateAsync({ studentId, body })
            alerts.success(rider ? `${name}’s bus stop updated` : `${name} added to the bus`)
            onOpenChange(false)
          }}
        />
      )}
    </AppModal>
  )
}

function AssignForm({
  rider,
  fixedStudent,
  defaultRouteId,
  onSubmit,
}: {
  rider: Rider | null
  fixedStudent: { id: number; full_name: string } | null
  defaultRouteId?: number
  onSubmit: (studentId: number, body: RiderInput, name: string) => Promise<void>
}) {
  const [studentSearch, setStudentSearch] = useState('')
  const [studentName, setStudentName] = useState(fixedStudent?.full_name ?? '')
  const debounced = useDebouncedValue(studentSearch)
  const students = useStudents(
    { page: 1, limit: 20, search: debounced || undefined, status: 'active' },
    !fixedStudent
  )
  const routes = useBusRoutes()
  const {
    control,
    handleSubmit,
    setError,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      student_id: fixedStudent ? String(fixedStudent.id) : '',
      route_id: rider ? String(rider.route.id) : defaultRouteId ? String(defaultRouteId) : '',
      mode: rider?.mode ?? 'both',
      stop_id: rider ? String(rider.stop.id) : '',
      separate_drop: Boolean(rider?.drop_stop),
      drop_stop_id: rider?.drop_stop ? String(rider.drop_stop.id) : '',
      start_date: rider?.start_date ?? '',
    },
  })
  const routeId = Number(useWatch({ control, name: 'route_id' })) || undefined
  const mode = useWatch({ control, name: 'mode' })
  const separateDrop = useWatch({ control, name: 'separate_drop' })
  const detail = useRouteDetail(routeId)
  const roster = useRouteRoster(routeId)
  const route = (routes.data ?? []).find((item) => item.id === routeId)

  const studentOptions: ComboboxOption[] = (students.data?.items ?? []).map((item) => ({
    value: String(item.id),
    label: item.full_name,
    hint: [item.admission_no, item.class?.name, item.section?.name].filter(Boolean).join(' · '),
  }))
  const routeOptions: ComboboxOption[] = (routes.data ?? []).map((item) => ({
    value: String(item.id),
    label: `${item.code} · ${item.name}`,
    hint: item.vehicle
      ? `${item.vehicle.registration_no} · ${item.students}/${item.vehicle.capacity}`
      : 'No bus yet',
  }))
  const stopOptions: ComboboxOption[] = (detail.data?.stop_list ?? []).map((item) => ({
    value: String(item.id),
    label: `${item.sequence}. ${item.name}`,
    hint: [item.pickup_time, item.drop_time].filter(Boolean).join(' / ') || undefined,
  }))

  const capacity = route?.vehicle?.capacity ?? null
  const sameBus = Boolean(rider && route?.vehicle && rider.route.id === route.id)
  const already = (kind: 'pickup' | 'drop') => (sameBus && rider && rides(rider.mode, kind) ? 1 : 0)
  const morning = roster.data
    ? roster.data.bus_morning_riders - already('pickup') + (rides(mode, 'pickup') ? 1 : 0)
    : null
  const evening = roster.data
    ? roster.data.bus_evening_riders - already('drop') + (rides(mode, 'drop') ? 1 : 0)
    : null
  const full =
    capacity !== null &&
    morning !== null &&
    evening !== null &&
    (morning > capacity || evening > capacity)

  const submit = handleSubmit(async (values) => {
    if (full) {
      setError('route_id', { message: 'This bus has no seat left on that trip' })
      return
    }
    const body: RiderInput = {
      route_id: Number(values.route_id),
      stop_id: Number(values.stop_id),
      mode: values.mode,
      drop_stop_id:
        values.mode === 'both' && values.separate_drop && values.drop_stop_id
          ? Number(values.drop_stop_id)
          : null,
      ...(values.start_date ? { start_date: values.start_date } : {}),
    }
    try {
      await onSubmit(Number(values.student_id), body, studentName || 'Student')
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
      if (apiError.code === 'BUS_FULL' || apiError.code === 'ROUTE_NOT_FOUND') {
        setError('route_id', { message: apiError.message }, { shouldFocus: true })
      } else if (apiError.code === 'STUDENT_NOT_FOUND') {
        setError('student_id', { message: apiError.message })
      } else if (!mapped) {
        setError('root', { message: apiError.message })
      }
    }
  })

  return (
    <form id={FORM_ID} onSubmit={submit} noValidate className='grid gap-4 sm:grid-cols-2'>
      {errors.root?.message && (
        <p
          role='alert'
          className='rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive sm:col-span-2'
        >
          {errors.root.message}
        </p>
      )}

      {!fixedStudent && (
        <FormField
          id='assign-student'
          label='Student'
          required
          error={errors.student_id?.message}
          className='sm:col-span-2'
        >
          <Controller
            control={control}
            name='student_id'
            render={({ field }) => (
              <Combobox
                id='assign-student'
                label='Student'
                value={field.value || undefined}
                options={studentOptions}
                onSearch={setStudentSearch}
                placeholder='Search name or admission number'
                searchPlaceholder='Search students'
                emptyText={students.isPending ? 'Loading students…' : 'No active students found'}
                highlightSelected={false}
                className='sm:w-full'
                invalid={Boolean(errors.student_id)}
                onChange={(value) => {
                  field.onChange(value ?? '')
                  setStudentName(
                    studentOptions.find((option) => option.value === value)?.label ?? ''
                  )
                }}
              />
            )}
          />
        </FormField>
      )}

      <FormField
        id='assign-route'
        label='Route'
        required
        error={errors.route_id?.message}
        className='sm:col-span-2'
      >
        <Controller
          control={control}
          name='route_id'
          render={({ field }) => (
            <Combobox
              id='assign-route'
              label='Route'
              value={field.value || undefined}
              options={routeOptions}
              placeholder='Choose a route'
              searchPlaceholder='Search routes'
              emptyText='No routes yet'
              highlightSelected={false}
              className='sm:w-full'
              invalid={Boolean(errors.route_id)}
              onChange={(value) => {
                field.onChange(value ?? '')
                setValue('stop_id', '')
                setValue('drop_stop_id', '')
              }}
            />
          )}
        />
      </FormField>

      {route && (
        <div
          className={cn(
            'rounded-lg border px-3 py-2 text-sm sm:col-span-2',
            full ? 'border-destructive/40 bg-destructive/10 text-destructive' : 'bg-muted/40'
          )}
          role={full ? 'alert' : undefined}
        >
          {!route.vehicle ? (
            'This route has no bus yet. Students can be assigned, but seats are not checked.'
          ) : morning === null || evening === null ? (
            'Checking seats…'
          ) : (
            <>
              <span className='font-semibold'>{route.vehicle.registration_no}</span> ·{' '}
              {route.vehicle.capacity} seats · morning {morning}/{capacity} · evening {evening}/
              {capacity}
              {full && '. The bus is full on that trip; choose another route or mode.'}
            </>
          )}
        </div>
      )}

      <FormField id='assign-mode' label='Uses the bus for' error={errors.mode?.message}>
        <Controller
          control={control}
          name='mode'
          render={({ field }) => (
            <Combobox
              id='assign-mode'
              label='Uses the bus for'
              value={field.value}
              options={MODE_OPTIONS}
              placeholder='Choose'
              highlightSelected={false}
              className='sm:w-full'
              onChange={(value) => {
                field.onChange((value ?? 'both') as TransportMode)
                if (value !== 'both') setValue('separate_drop', false)
              }}
            />
          )}
        />
      </FormField>

      <FormField
        id='assign-stop'
        label={mode === 'drop' ? 'Drop stop' : 'Pickup stop'}
        required
        error={errors.stop_id?.message}
      >
        <Controller
          control={control}
          name='stop_id'
          render={({ field }) => (
            <Combobox
              id='assign-stop'
              label={mode === 'drop' ? 'Drop stop' : 'Pickup stop'}
              value={field.value || undefined}
              options={stopOptions}
              placeholder='Choose a stop'
              searchPlaceholder='Search stops'
              emptyText={routeId ? 'This route has no stops yet' : 'Choose a route first'}
              highlightSelected={false}
              className='sm:w-full'
              invalid={Boolean(errors.stop_id)}
              onChange={(value) => field.onChange(value ?? '')}
            />
          )}
        />
      </FormField>

      {mode === 'both' && (
        <label className='flex items-center justify-between gap-4 rounded-lg border bg-muted/40 px-4 py-3 sm:col-span-2'>
          <span className='grid gap-0.5'>
            <span className='text-sm font-semibold'>Different stop in the evening</span>
            <span className='text-xs text-muted-foreground'>
              Dropped at another stop on the same route, for example at a grandparent’s house
            </span>
          </span>
          <Controller
            control={control}
            name='separate_drop'
            render={({ field }) => (
              <Switch
                checked={field.value}
                onCheckedChange={(checked) => {
                  field.onChange(checked)
                  if (!checked) setValue('drop_stop_id', '')
                }}
                aria-label='Different stop in the evening'
              />
            )}
          />
        </label>
      )}

      {mode === 'both' && separateDrop && (
        <FormField
          id='assign-drop-stop'
          label='Evening drop stop'
          required
          error={errors.drop_stop_id?.message}
        >
          <Controller
            control={control}
            name='drop_stop_id'
            render={({ field }) => (
              <Combobox
                id='assign-drop-stop'
                label='Evening drop stop'
                value={field.value || undefined}
                options={stopOptions}
                placeholder='Choose a stop'
                searchPlaceholder='Search stops'
                emptyText={routeId ? 'This route has no stops yet' : 'Choose a route first'}
                highlightSelected={false}
                className='sm:w-full'
                invalid={Boolean(errors.drop_stop_id)}
                onChange={(value) => field.onChange(value ?? '')}
              />
            )}
          />
        </FormField>
      )}

      <FormField
        id='assign-start'
        label='Uses the bus from'
        hint={rider ? 'Leave as it is when only the stop changes' : 'Defaults to today'}
        error={errors.start_date?.message}
      >
        <Controller
          control={control}
          name='start_date'
          render={({ field }) => (
            <Input
              id='assign-start'
              type='date'
              value={field.value}
              onChange={(event) => field.onChange(event.target.value)}
            />
          )}
        />
      </FormField>
    </form>
  )
}
