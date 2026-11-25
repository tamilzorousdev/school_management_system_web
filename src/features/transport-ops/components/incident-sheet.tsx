import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { CheckCircle2, MapPin, Route as RouteIcon } from 'lucide-react'
import { ImagePreviewModal } from '@/components/common/avatar'
import { DetailList, ErrorState } from '@/components/common/display'
import { FormField } from '@/components/common/form-field'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/input'
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { can, useMe } from '@/features/auth/api'
import { alerts } from '@/lib/alerts'
import { toApiError } from '@/lib/api/errors'
import { formatDateTime } from '@/lib/format'
import { useIncident, useResolveIncident, type Incident } from '../api'
import { INCIDENT_STATUS, INCIDENT_TYPE, mapsLink } from '../labels'

export function IncidentSheet({
  incidentId,
  onOpenChange,
}: {
  incidentId: number | null
  onOpenChange: (open: boolean) => void
}) {
  return (
    <Sheet open={Boolean(incidentId)} onOpenChange={onOpenChange}>
      <SheetContent>
        <IncidentDetail incidentId={incidentId} />
      </SheetContent>
    </Sheet>
  )
}

function IncidentDetail({ incidentId }: { incidentId: number | null }) {
  const canManage = can(useMe().data, 'fleet.manage')
  const incident = useIncident(incidentId)
  const [photo, setPhoto] = useState<string | null>(null)

  if (!incidentId) return null
  if (incident.isPending) {
    return (
      <>
        <SheetHeader>
          <SheetTitle>Incident</SheetTitle>
          <SheetDescription>Loading…</SheetDescription>
        </SheetHeader>
        <SheetBody className='grid content-start gap-4'>
          <Skeleton className='h-32' />
          <Skeleton className='h-24' />
        </SheetBody>
      </>
    )
  }
  if (incident.isError) {
    return (
      <>
        <SheetHeader>
          <SheetTitle>Incident</SheetTitle>
          <SheetDescription>Could not load this incident</SheetDescription>
        </SheetHeader>
        <SheetBody>
          <ErrorState message={incident.error.message} onRetry={() => incident.refetch()} />
        </SheetBody>
      </>
    )
  }

  const data = incident.data
  const type = INCIDENT_TYPE[data.type]
  const status = INCIDENT_STATUS[data.status]
  const map = mapsLink(data.lat, data.lng)

  return (
    <>
      <SheetHeader>
        <SheetTitle className='flex flex-wrap items-center gap-2'>
          <type.icon className='size-5 text-primary' />
          {type.label}
          <Badge tone={status.tone} dot>
            {status.label}
          </Badge>
        </SheetTitle>
        <SheetDescription>
          Reported by {data.reported_by.name} · {formatDateTime(data.occurred_at)}
        </SheetDescription>
      </SheetHeader>
      <SheetBody className='grid content-start gap-5'>
        <p className='rounded-lg border bg-muted/40 px-3 py-2 text-sm break-words whitespace-pre-line'>
          {data.description}
        </p>

        <DetailList
          items={[
            { label: 'Bus', value: data.vehicle?.name ?? 'No bus' },
            { label: 'Reported by', value: data.reported_by.name },
            { label: 'Occurred', value: formatDateTime(data.occurred_at) },
            {
              label: 'Location',
              value: map ? (
                <a
                  href={map}
                  target='_blank'
                  rel='noreferrer'
                  className='inline-flex items-center gap-1 text-primary'
                >
                  <MapPin className='size-3.5' />
                  {data.lat!.toFixed(5)}, {data.lng!.toFixed(5)}
                </a>
              ) : (
                'Not sent'
              ),
            },
            {
              label: 'Students',
              value: data.students.length
                ? data.students.map((student) => student.name).join(', ')
                : 'None named',
            },
            {
              label: 'Trip',
              value: data.trip_id ? (
                <Link
                  to='/fleet/trips/$tripId'
                  params={{ tripId: data.trip_id }}
                  className='inline-flex items-center gap-1 text-primary'
                >
                  <RouteIcon className='size-3.5' />
                  Open trip
                </Link>
              ) : (
                'Not on a trip'
              ),
            },
          ]}
        />

        {data.photos.length > 0 && (
          <section className='grid gap-2'>
            <h3 className='text-xs font-bold tracking-wider text-muted-foreground uppercase'>
              Photos
            </h3>
            <div className='flex flex-wrap gap-2'>
              {data.photos.map((item) => (
                <button
                  key={item.id}
                  type='button'
                  onClick={() => setPhoto(item.url)}
                  className='overflow-hidden rounded-lg border outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40'
                  aria-label='View photo'
                >
                  <img src={item.url} alt='' className='size-24 object-cover' />
                </button>
              ))}
            </div>
          </section>
        )}

        {data.status === 'resolved' ? (
          <section className='grid gap-2'>
            <h3 className='text-xs font-bold tracking-wider text-muted-foreground uppercase'>
              Resolution
            </h3>
            <p className='rounded-lg border border-success/25 bg-success/10 px-3 py-2 text-sm break-words'>
              {data.resolution_note}
            </p>
            <span className='text-xs text-muted-foreground'>
              {[data.resolved_by?.name, data.resolved_at ? formatDateTime(data.resolved_at) : null]
                .filter(Boolean)
                .join(' · ')}
            </span>
          </section>
        ) : (
          canManage && <ResolveForm key={data.id} incident={data} />
        )}
      </SheetBody>
      <ImagePreviewModal
        open={Boolean(photo)}
        onOpenChange={(open) => !open && setPhoto(null)}
        src={photo}
        title={`${type.label} photo`}
      />
    </>
  )
}

const schema = z.object({
  note: z
    .string()
    .trim()
    .min(3, 'Write what was done (at least 3 characters)')
    .max(1000, 'Keep the note to 1000 characters or less'),
})

type FormValues = z.infer<typeof schema>

function ResolveForm({ incident }: { incident: Incident }) {
  const resolve = useResolveIncident()
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { note: '' } })

  const submit = handleSubmit(async (values) => {
    try {
      await resolve.mutateAsync({ id: incident.id, note: values.note })
      alerts.success('Incident resolved', { description: 'The driver who reported it is told.' })
    } catch (error) {
      const apiError = toApiError(error)
      const fieldError = apiError.fieldError('note')
      if (fieldError) {
        setError('note', { message: fieldError }, { shouldFocus: true })
        return
      }
      setError('root', {
        message:
          apiError.code === 'INCIDENT_RESOLVED'
            ? 'Someone has already resolved this incident. Refresh to see it.'
            : apiError.message,
      })
    }
  })

  return (
    <form onSubmit={submit} noValidate className='grid gap-3 rounded-lg border p-4'>
      <h3 className='font-bold'>Resolve</h3>
      {errors.root?.message && (
        <p
          role='alert'
          className='rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive'
        >
          {errors.root.message}
        </p>
      )}
      <FormField
        id='incident-note'
        label='What was done'
        required
        error={errors.note?.message}
        hint='The driver who reported it sees this note.'
      >
        <Textarea
          id='incident-note'
          rows={3}
          maxLength={1000}
          placeholder='Parent informed, first aid given at school'
          aria-invalid={Boolean(errors.note) || undefined}
          aria-describedby={errors.note ? 'incident-note-error' : undefined}
          {...register('note')}
        />
      </FormField>
      <Button type='submit' className='justify-self-start' loading={resolve.isPending}>
        <CheckCircle2 />
        Mark as resolved
      </Button>
    </form>
  )
}
