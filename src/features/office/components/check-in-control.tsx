import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Fingerprint, Loader2, LogOut } from 'lucide-react'
import { alerts } from '@/lib/alerts'
import { toApiError } from '@/lib/api/errors'
import { cn } from '@/lib/utils'
import { officeApi, officeKeys, useMyCheckIn, type CheckInLocation, type MyCheckIn } from '../api'
import { clockTime } from '../labels'

const LOCATION_ERROR: Record<number, string> = {
  1: 'Allow location access in the browser to check in.',
  2: 'Your location is not available right now. Try again.',
  3: 'Getting your location took too long. Try again.',
}

function currentLocation() {
  return new Promise<CheckInLocation>((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new Error('This browser cannot share your location.'))
      return
    }
    navigator.geolocation.getCurrentPosition(
      (position) =>
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy_m: Math.round(position.coords.accuracy),
        }),
      (error) => reject(new Error(LOCATION_ERROR[error.code] ?? 'Could not read your location.')),
      { enableHighAccuracy: true, timeout: 15_000, maximumAge: 0 }
    )
  })
}

function statusLine(status: MyCheckIn) {
  if (status.check_out_at) return `Checked out ${clockTime(status.check_out_at)}`
  if (status.check_in_at)
    return `Checked in ${clockTime(status.check_in_at)}${status.status === 'late' ? ' · late' : ''}`
  if (status.status === 'on_leave') return 'On leave today'
  return `Not checked in · reporting ${status.reporting_time}`
}

export function CheckInControl({ className }: { className?: string }) {
  const queryClient = useQueryClient()
  const status = useMyCheckIn()
  const [busy, setBusy] = useState(false)

  if (status.isPending)
    return <div className={cn('h-8 w-36 rounded-lg bg-hero-foreground/10', className)} />
  if (status.isError) return null

  const data = status.data
  const action = data.can_check_out ? 'out' : data.can_check_in ? 'in' : null

  const run = async () => {
    if (!action) return
    setBusy(true)
    try {
      const location = await currentLocation()
      const next = await (action === 'in'
        ? officeApi.checkIn(location)
        : officeApi.checkOut(location))
      queryClient.setQueryData(officeKeys.checkIn(), next)
      alerts.success(action === 'in' ? 'Checked in' : 'Checked out', {
        description: statusLine(next),
      })
    } catch (error) {
      alerts.error(toApiError(error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div
      data-testid='office-check-in'
      className={cn('flex min-w-0 flex-wrap items-center gap-x-2.5 gap-y-1.5', className)}
    >
      {action && (
        <button
          type='button'
          onClick={run}
          disabled={busy}
          className='inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg bg-hero-foreground px-3 text-xs font-bold text-hero-ink shadow-sm transition-opacity outline-none hover:opacity-90 focus-visible:ring-[3px] focus-visible:ring-hero-foreground/50 disabled:opacity-70'
        >
          {busy ? (
            <Loader2 className='size-3.5 animate-spin' />
          ) : action === 'in' ? (
            <Fingerprint className='size-3.5' />
          ) : (
            <LogOut className='size-3.5' />
          )}
          {action === 'in' ? 'Check in' : 'Check out'}
        </button>
      )}
      <span className='flex min-w-0 items-center gap-1.5 text-xs font-medium text-hero-foreground/85'>
        <span
          className={cn(
            'size-1.5 shrink-0 rounded-full',
            data.check_in_at && !data.check_out_at ? 'bg-hero-foreground' : 'bg-hero-foreground/40'
          )}
        />
        <span className='truncate'>{statusLine(data)}</span>
      </span>
    </div>
  )
}
