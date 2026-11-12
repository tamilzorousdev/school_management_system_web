import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import { Crosshair, LocateFixed, MapPin, Search } from 'lucide-react'
import { createBaseMap, MAP_COLORS, schoolIcon } from '@/components/common/base-map'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { alerts } from '@/lib/alerts'

export const MIN_RADIUS = 50
export const MAX_RADIUS = 2000

export interface Geofence {
  latitude: string
  longitude: string
  radius: string
}

interface Place {
  place_id: number
  display_name: string
  lat: string
  lon: string
}

const clampRadius = (value: number) => Math.round(Math.min(MAX_RADIUS, Math.max(MIN_RADIUS, value)))
const fixed = (value: number) => value.toFixed(6)

const handleIcon = L.divIcon({
  className: 'geofence-handle',
  html: '<span class="block size-4 rounded-full border-2 border-white bg-primary shadow-md"></span>',
  iconSize: [16, 16],
  iconAnchor: [8, 8],
})

function edgePoint(center: L.LatLng, radius: number): L.LatLng {
  const metresPerDegree = 111320 * Math.cos((center.lat * Math.PI) / 180)
  return L.latLng(center.lat, center.lng + radius / metresPerDegree)
}

export function GeofencePicker({
  value,
  searchHint,
  disabled,
  onChange,
}: {
  value: Geofence
  searchHint: string
  disabled: boolean
  onChange: (next: Geofence) => void
}) {
  const element = useRef<HTMLDivElement>(null)
  const parts = useRef<{ map: L.Map; pin: L.Marker; circle: L.Circle; handle: L.Marker } | null>(
    null
  )
  const latest = useRef({ value, onChange })
  useEffect(() => {
    latest.current = { value, onChange }
  })
  const [query, setQuery] = useState(searchHint)
  const [places, setPlaces] = useState<Place[]>([])
  const [searching, setSearching] = useState(false)

  const lat = Number(value.latitude)
  const lng = Number(value.longitude)
  const hasCenter =
    value.latitude !== '' && value.longitude !== '' && Number.isFinite(lat) && Number.isFinite(lng)
  const radius = clampRadius(Number(value.radius) || 200)

  useEffect(() => {
    if (!element.current) return
    const { map, dispose } = createBaseMap(element.current)
    const initial = latest.current.value
    const known = initial.latitude !== '' && initial.longitude !== ''
    const start = known
      ? L.latLng(Number(initial.latitude), Number(initial.longitude))
      : map.getCenter()
    const startRadius = clampRadius(Number(initial.radius) || 200)
    const circle = L.circle(start, {
      radius: startRadius,
      color: MAP_COLORS.primary,
      weight: 2,
      fillColor: MAP_COLORS.primary,
      fillOpacity: 0.15,
    }).addTo(map)
    const pin = L.marker(start, {
      icon: schoolIcon,
      draggable: !disabled,
      title: 'School gate',
    }).addTo(map)
    const handle = L.marker(edgePoint(start, startRadius), {
      icon: handleIcon,
      draggable: !disabled,
      title: 'Drag to change the radius',
    }).addTo(map)
    parts.current = { map, pin, circle, handle }
    if (known) map.setView(start, 17)

    const emit = (center: L.LatLng, metres: number) =>
      latest.current.onChange({
        latitude: fixed(center.lat),
        longitude: fixed(center.lng),
        radius: String(metres),
      })

    pin.on('drag', () => {
      const center = pin.getLatLng()
      circle.setLatLng(center)
      handle.setLatLng(edgePoint(center, circle.getRadius()))
    })
    pin.on('dragend', () => emit(pin.getLatLng(), Math.round(circle.getRadius())))
    handle.on('drag', () =>
      circle.setRadius(clampRadius(pin.getLatLng().distanceTo(handle.getLatLng())))
    )
    handle.on('dragend', () => {
      const metres = clampRadius(pin.getLatLng().distanceTo(handle.getLatLng()))
      handle.setLatLng(edgePoint(pin.getLatLng(), metres))
      emit(pin.getLatLng(), metres)
    })
    if (!disabled)
      map.on('click', (event: L.LeafletMouseEvent) =>
        emit(event.latlng, Math.round(circle.getRadius()))
      )

    return () => {
      parts.current = null
      dispose()
    }
  }, [disabled])

  useEffect(() => {
    const current = parts.current
    if (!current || !hasCenter) return
    const center = L.latLng(lat, lng)
    current.pin.setLatLng(center)
    current.circle.setLatLng(center)
    current.circle.setRadius(radius)
    current.handle.setLatLng(edgePoint(center, radius))
  }, [hasCenter, lat, lng, radius])

  const moveTo = (latitude: number, longitude: number) => {
    parts.current?.map.setView([latitude, longitude], 17)
    onChange({ latitude: fixed(latitude), longitude: fixed(longitude), radius: String(radius) })
  }

  const search = async () => {
    const text = query.trim()
    if (text.length < 3) return
    setSearching(true)
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=6&countrycodes=in&q=${encodeURIComponent(text)}`
      const response = await fetch(url, { headers: { Accept: 'application/json' } })
      if (!response.ok) throw new Error('Place search is not available right now')
      const found = (await response.json()) as Place[]
      setPlaces(found)
      if (!found.length) alerts.error('No place found. Try the area or the street name.')
    } catch (error) {
      alerts.error((error as Error).message || 'Place search is not available right now')
    } finally {
      setSearching(false)
    }
  }

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      alerts.error('This browser cannot share its location')
      return
    }
    navigator.geolocation.getCurrentPosition(
      (position) => moveTo(position.coords.latitude, position.coords.longitude),
      () => alerts.error('Allow location access in the browser to use this'),
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  return (
    <div className='grid gap-3 sm:col-span-2'>
      <div className='flex flex-wrap items-end justify-between gap-2'>
        <div className='grid gap-0.5'>
          <span className='text-xs font-semibold'>School campus on the map</span>
          <span className='text-xs text-muted-foreground'>
            Search the school or area, then click the gate and drag the dot on the circle to cover
            the campus. Used for bus arrival and staff check-in.
          </span>
        </div>
        {!disabled && (
          <Button type='button' variant='outline' size='sm' onClick={useMyLocation}>
            <LocateFixed />
            Use my location
          </Button>
        )}
      </div>
      {!disabled && (
        <div className='grid gap-2'>
          <div className='flex gap-2' role='search'>
            <Input
              aria-label='Search school or area'
              placeholder='Search school, area or street'
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key !== 'Enter') return
                event.preventDefault()
                void search()
              }}
            />
            <Button
              type='button'
              variant='outline'
              loading={searching}
              onClick={() => void search()}
            >
              <Search />
              Search
            </Button>
          </div>
          {places.length > 0 && (
            <ul className='grid max-h-48 overflow-y-auto rounded-md border bg-card text-sm'>
              {places.map((place) => (
                <li key={place.place_id}>
                  <button
                    type='button'
                    className='flex w-full items-start gap-2 px-3 py-2 text-left hover:bg-muted'
                    onClick={() => {
                      moveTo(Number(place.lat), Number(place.lon))
                      setPlaces([])
                    }}
                  >
                    <MapPin className='mt-0.5 size-4 shrink-0 text-muted-foreground' />
                    <span className='line-clamp-2'>{place.display_name}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      <div
        ref={element}
        role='application'
        aria-label='School campus map'
        className='h-80 w-full overflow-hidden rounded-lg border'
      />
      <div className='grid gap-2 sm:grid-cols-[1fr_auto] sm:items-center'>
        <label className='grid gap-1 text-xs font-semibold' htmlFor='geofence-radius'>
          Campus radius: {radius} m
          <input
            id='geofence-radius'
            type='range'
            min={MIN_RADIUS}
            max={MAX_RADIUS}
            step={10}
            value={radius}
            disabled={disabled}
            onChange={(event) =>
              onChange({ ...value, radius: String(clampRadius(Number(event.target.value))) })
            }
            className='w-full accent-primary'
          />
        </label>
        <span className='flex items-center gap-1.5 text-xs text-muted-foreground tabular-nums'>
          <Crosshair className='size-3.5' />
          {hasCenter ? `${value.latitude}, ${value.longitude}` : 'Click the map to set the gate'}
        </span>
      </div>
    </div>
  )
}
