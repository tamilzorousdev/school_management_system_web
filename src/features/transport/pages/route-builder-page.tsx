import { useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { getRouteApi, useBlocker, useNavigate } from '@tanstack/react-router'
import {
  ArrowLeft,
  ListOrdered,
  Pencil,
  RotateCcw,
  Save,
  Route as RouteIcon,
  UsersRound,
} from 'lucide-react'
import { Combobox } from '@/components/common/combobox'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import { ErrorState } from '@/components/common/display'
import { Page, PageHeader } from '@/components/common/page'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { can, useMe } from '@/features/auth/api'
import { alerts } from '@/lib/alerts'
import { toApiError } from '@/lib/api/errors'
import { cn } from '@/lib/utils'
import {
  transportApi,
  transportKeys,
  useBusOptions,
  useRouteDetail,
  type RouteDetail,
  type StopInput,
} from '../api'
import { AssignStudentsModal } from '../components/assign-students-modal'
import { RouteFormModal } from '../components/route-form-modal'
import { RouteMap, type MapStop } from '../components/route-map'
import { StopFormModal, type DraftStop } from '../components/stop-form-modal'
import { StopList } from '../components/stop-list'

const route = getRouteApi('/_app/transport/routes/$routeId')

const toDraft = (detail: RouteDetail): DraftStop[] =>
  detail.stop_list.map((stop) => ({
    key: `s${stop.id}`,
    id: stop.id,
    name: stop.name,
    landmark: stop.landmark,
    lat: stop.lat,
    lng: stop.lng,
    pickup_time: stop.pickup_time,
    drop_time: stop.drop_time,
    geofence_radius_m: stop.geofence_radius_m,
    fee_override: stop.fee_override,
  }))

const toInput = (stops: DraftStop[]): StopInput[] =>
  stops.map((stop) => ({
    ...(stop.id ? { id: stop.id } : {}),
    name: stop.name,
    landmark: stop.landmark,
    lat: Math.round(stop.lat * 1e6) / 1e6,
    lng: Math.round(stop.lng * 1e6) / 1e6,
    pickup_time: stop.pickup_time,
    drop_time: stop.drop_time,
    geofence_radius_m: stop.geofence_radius_m,
    monthly_fee: stop.fee_override,
  }))

const signature = (stops: DraftStop[]) => JSON.stringify(toInput(stops))

const metres = (a: { lat: number; lng: number }, b: { lat: number; lng: number }) => {
  const rad = Math.PI / 180
  const dLat = (b.lat - a.lat) * rad
  const dLng = (b.lng - a.lng) * rad
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2
  return 2 * 6371000 * Math.asin(Math.sqrt(h))
}

const pathKm = (points: { lat: number; lng: number }[]) => {
  let total = 0
  for (let index = 1; index < points.length; index += 1)
    total += metres(points[index - 1]!, points[index]!)
  return Math.round(total / 100) / 10
}

const stopError = (error: unknown, stops: DraftStop[]) => {
  const apiError = toApiError(error)
  const first = apiError.fieldErrors[0]
  if (!first) return apiError.message
  const index = Number(/items\.(\d+)/.exec(first.field)?.[1])
  const stop = Number.isInteger(index) ? stops[index] : undefined
  return stop ? `Stop ${index + 1} (${stop.name}): ${first.message}` : first.message
}

let nextKey = 0

export function RouteBuilderPage() {
  const { routeId } = route.useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const canManage = can(useMe().data, 'fleet.manage')
  const detail = useRouteDetail(routeId)
  const busOptions = useBusOptions()

  const [draft, setDraft] = useState<DraftStop[]>([])
  const [syncedAt, setSyncedAt] = useState(0)
  const [selectedKey, setSelectedKey] = useState<string>()
  const [editing, setEditing] = useState<{ stop: DraftStop; isNew: boolean } | null>(null)
  const [removing, setRemoving] = useState<DraftStop | null>(null)
  const [assigning, setAssigning] = useState<DraftStop | null>(null)
  const [confirmOrder, setConfirmOrder] = useState(false)
  const [editingRoute, setEditingRoute] = useState(false)
  const [busy, setBusy] = useState<'save' | 'order' | 'bus' | null>(null)

  const data = detail.data
  const baseline = useMemo(() => (data ? toDraft(data) : []), [data])
  const synced = syncedAt !== 0
  const dirty = synced && signature(draft) !== signature(baseline)

  if (data && detail.dataUpdatedAt !== syncedAt && !dirty) {
    setSyncedAt(detail.dataUpdatedAt)
    setDraft(baseline)
  }

  const blocker = useBlocker({
    shouldBlockFn: () => dirty,
    enableBeforeUnload: () => dirty,
    withResolver: true,
  })

  const counts = useMemo(
    () => Object.fromEntries((data?.stop_list ?? []).map((stop) => [`s${stop.id}`, stop.students])),
    [data]
  )
  const mapStops: MapStop[] = useMemo(
    () =>
      draft.map((stop) => ({
        key: stop.key,
        name: stop.name,
        lat: stop.lat,
        lng: stop.lng,
        radius: stop.geofence_radius_m,
      })),
    [draft]
  )
  const school = data?.school_location ?? null
  const distance = useMemo(() => pathKm([...draft, ...(school ? [school] : [])]), [draft, school])

  const applyDetail = (result: RouteDetail) => {
    queryClient.setQueryData(transportKeys.route(routeId), result)
    void queryClient.invalidateQueries({
      queryKey: transportKeys.all,
      predicate: (query) => query.queryKey[1] !== 'route',
    })
    setDraft(toDraft(result))
  }

  const saveStops = async () => {
    setBusy('save')
    try {
      const result = await transportApi.saveStops(routeId, toInput(draft))
      applyDetail(result)
      alerts.success('Stops saved')
      return result
    } catch (error) {
      alerts.error(stopError(error, draft))
      return undefined
    } finally {
      setBusy(null)
    }
  }

  const autoOrder = async () => {
    setConfirmOrder(false)
    if (dirty && !(await saveStops())) return
    setBusy('order')
    try {
      const result = await transportApi.autoSequence(routeId)
      applyDetail(result)
      alerts.success('Stops put in order')
    } catch (error) {
      alerts.error(toApiError(error).message)
    } finally {
      setBusy(null)
    }
  }

  const changeBus = async (value: string | undefined) => {
    if (!data) return
    setBusy('bus')
    try {
      const result = await transportApi.updateRoute(routeId, {
        vehicle_id: value ? Number(value) : null,
      })
      queryClient.setQueryData(transportKeys.route(routeId), result)
      void queryClient.invalidateQueries({ queryKey: transportKeys.all })
      alerts.success(
        result.vehicle ? `Bus set to ${result.vehicle.registration_no}` : 'Bus removed'
      )
    } catch (error) {
      alerts.error(toApiError(error).message)
    } finally {
      setBusy(null)
    }
  }

  const reorder = (from: number, to: number) => {
    if (to < 0 || to >= draft.length) return
    setDraft((prev) => {
      const next = [...prev]
      const [moved] = next.splice(from, 1)
      next.splice(to, 0, moved!)
      return next
    })
  }

  const addAt = (lat: number, lng: number) =>
    setEditing({
      isNew: true,
      stop: {
        key: `n${(nextKey += 1)}`,
        name: '',
        landmark: null,
        lat,
        lng,
        pickup_time: null,
        drop_time: null,
        geofence_radius_m: 100,
        fee_override: null,
      },
    })

  const askRemove = (stop: DraftStop) => {
    const students = counts[stop.key] ?? 0
    if (students) {
      alerts.error(
        `${stop.name} has ${students} ${students === 1 ? 'student' : 'students'}. Move them to another stop first.`
      )
      return
    }
    setRemoving(stop)
  }

  if (detail.isError) {
    return (
      <Page>
        <ErrorState
          message={detail.error.isNotFound ? 'This route does not exist.' : detail.error.message}
          onRetry={() => detail.refetch()}
        />
        <div className='flex justify-center'>
          <Button
            variant='outline'
            onClick={() => navigate({ to: '/transport', search: { tab: 'routes' } })}
          >
            <ArrowLeft />
            All routes
          </Button>
        </div>
      </Page>
    )
  }

  const capacity = data?.vehicle?.capacity ?? null
  const seatsLeft = capacity === null || !data ? null : Math.max(0, capacity - data.students)

  return (
    <Page className='gap-4'>
      <PageHeader
        eyebrow='Route builder'
        title={
          data ? (
            <span className='flex flex-wrap items-center gap-2'>
              <Badge tone='info' className='font-mono text-sm'>
                {data.code}
              </Badge>
              <span className='min-w-0 break-words'>{data.name}</span>
            </span>
          ) : (
            <span className='inline-block h-8 w-64 max-w-full animate-pulse rounded-md bg-muted' />
          )
        }
        description={
          data
            ? `${draft.length} ${draft.length === 1 ? 'stop' : 'stops'} · ${distance} km to school · ${data.students} ${data.students === 1 ? 'student' : 'students'}${capacity !== null ? ` of ${capacity} ${capacity === 1 ? 'seat' : 'seats'}` : ''}`
            : undefined
        }
        actions={
          <>
            <Button
              variant='outline'
              onClick={() => navigate({ to: '/transport', search: { tab: 'routes' } })}
            >
              <ArrowLeft />
              All routes
            </Button>
            {data && (
              <Button
                variant='outline'
                onClick={() =>
                  navigate({
                    to: '/transport/routes/$routeId/students',
                    params: { routeId: data.id },
                  })
                }
              >
                <UsersRound />
                Student list
              </Button>
            )}
            {canManage && data && (
              <Button variant='outline' onClick={() => setEditingRoute(true)}>
                <Pencil />
                Edit route
              </Button>
            )}
          </>
        }
      />

      <div className='grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1fr)_24rem] xl:grid-cols-[minmax(0,1fr)_28rem]'>
        <div className='grid min-w-0 content-start gap-3'>
          {data ? (
            <RouteMap
              stops={mapStops}
              school={school}
              selectedKey={selectedKey}
              editable={canManage}
              fitKey={`${routeId}`}
              onAdd={addAt}
              onMove={(key, lat, lng) =>
                setDraft((prev) =>
                  prev.map((stop) => (stop.key === key ? { ...stop, lat, lng } : stop))
                )
              }
              onSelect={setSelectedKey}
              className='h-[55vh] min-h-80 lg:h-[calc(100vh-14rem)] lg:min-h-[32rem]'
            />
          ) : (
            <Skeleton className='h-[55vh] min-h-80 rounded-xl lg:h-[calc(100vh-14rem)]' />
          )}
          {!school && data && (
            <p className='text-xs text-muted-foreground'>
              The school location is not set, so the route line ends at the last stop. Set it in
              School setup.
            </p>
          )}
        </div>

        <Card className='min-w-0 overflow-hidden lg:max-h-[calc(100vh-14rem)] lg:min-h-[32rem]'>
          <div className='grid gap-3 border-b px-4 py-3'>
            <div className='flex flex-wrap items-center justify-between gap-2'>
              <h2 className='flex items-center gap-2 font-bold'>
                <RouteIcon className='size-4 text-primary' />
                Stops
              </h2>
              {dirty ? (
                <Badge tone='warning' dot role='status'>
                  Unsaved changes
                </Badge>
              ) : (
                data && (
                  <Badge tone='success' role='status'>
                    All changes saved
                  </Badge>
                )
              )}
            </div>
            <div className='grid gap-1.5'>
              <label htmlFor='route-builder-bus' className='text-xs font-semibold'>
                Bus for this route
              </label>
              <Combobox
                id='route-builder-bus'
                label='Bus for this route'
                value={data?.vehicle ? String(data.vehicle.id) : undefined}
                options={busOptions}
                allLabel='No bus'
                placeholder='No bus'
                searchPlaceholder='Search buses'
                emptyText='No buses yet'
                highlightSelected={false}
                className={cn(
                  'sm:w-full',
                  (!canManage || busy === 'bus') && 'pointer-events-none opacity-60'
                )}
                onChange={(value) => void changeBus(value)}
              />
            </div>
            <p className='tabular text-xs text-muted-foreground'>
              Distance through every stop to school{' '}
              <span className='font-bold text-foreground'>{distance} km</span>
            </p>
            {canManage && (
              <div className='flex flex-wrap gap-2'>
                <Button
                  onClick={() => void saveStops()}
                  disabled={!dirty || busy !== null}
                  loading={busy === 'save'}
                >
                  <Save />
                  Save stops
                </Button>
                <Button
                  variant='outline'
                  onClick={() => (dirty ? setConfirmOrder(true) : void autoOrder())}
                  disabled={draft.length < 2 || busy !== null}
                  loading={busy === 'order'}
                >
                  <ListOrdered />
                  Auto order
                </Button>
                {dirty && (
                  <Button
                    variant='ghost'
                    onClick={() => setDraft(baseline)}
                    disabled={busy !== null}
                  >
                    <RotateCcw />
                    Undo changes
                  </Button>
                )}
              </div>
            )}
          </div>
          <div className='min-h-0 flex-1 overflow-y-auto p-3'>
            {data ? (
              <StopList
                routeId={routeId}
                routeFee={data?.monthly_fee ?? 0}
                stops={draft}
                counts={counts}
                selectedKey={selectedKey}
                canManage={canManage}
                onSelect={setSelectedKey}
                onReorder={reorder}
                onEdit={(stop) => setEditing({ stop, isNew: false })}
                onDelete={askRemove}
                onAddStudents={setAssigning}
              />
            ) : (
              <div className='grid gap-2'>
                {Array.from({ length: 4 }, (_, index) => (
                  <Skeleton key={index} className='h-20' />
                ))}
              </div>
            )}
          </div>
        </Card>
      </div>

      {editing && (
        <StopFormModal
          stop={editing.stop}
          isNew={editing.isNew}
          routeFee={data?.monthly_fee ?? 0}
          onClose={() => setEditing(null)}
          onSave={(stop) => {
            setDraft((prev) =>
              editing.isNew
                ? [...prev, stop]
                : prev.map((item) => (item.key === stop.key ? stop : item))
            )
            setSelectedKey(stop.key)
            setEditing(null)
          }}
        />
      )}
      {assigning?.id && (
        <AssignStudentsModal
          routeId={routeId}
          stop={{ id: assigning.id, name: assigning.name }}
          seatsLeft={seatsLeft}
          onClose={() => setAssigning(null)}
        />
      )}
      {editingRoute && data && (
        <RouteFormModal route={data} onClose={() => setEditingRoute(false)} />
      )}
      <ConfirmDialog
        open={Boolean(removing)}
        onOpenChange={(open) => !open && setRemoving(null)}
        title={`Delete ${removing?.name ?? ''}?`}
        description='The stop is taken off the route. Press Save stops to keep the change.'
        confirmText='Delete stop'
        destructive
        onConfirm={() => {
          if (removing) setDraft((prev) => prev.filter((stop) => stop.key !== removing.key))
          setRemoving(null)
        }}
      />
      <ConfirmDialog
        open={confirmOrder}
        onOpenChange={setConfirmOrder}
        title='Save changes first?'
        description='Auto order works on saved stops. Your changes are saved, then the stops are put in order from the farthest stop to school.'
        confirmText='Save and order'
        onConfirm={() => void autoOrder()}
      />
      <ConfirmDialog
        open={blocker.status === 'blocked'}
        onOpenChange={(open) => !open && blocker.reset?.()}
        title='Leave without saving?'
        description='Your changes to the stops are not saved yet.'
        confirmText='Leave without saving'
        destructive
        onConfirm={() => blocker.proceed?.()}
      />
    </Page>
  )
}
