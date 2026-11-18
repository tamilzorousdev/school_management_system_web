import { useEffect, useState } from 'react'
import { can, useMe } from '@/features/auth/api'
import { useLiveEvent } from '@/lib/live/socket'
import { useActiveSos } from '../api'
import { askNotificationPermission, showSosNotification, useSosAlarm } from '../sos-alarm'
import { AlertSheet } from './alert-sheet'
import { SosBanner } from './sos-banner'

export function SosWatch() {
  const me = useMe().data
  if (!can(me, 'fleet.view')) return null
  return <SosWatcher />
}

function SosWatcher() {
  const [openId, setOpenId] = useState<number | null>(null)
  const [muted, setMuted] = useState(false)
  const sos = useActiveSos(true, false)
  const ringing = (sos.data?.items ?? []).some((alert) => alert.status === 'open')

  useSosAlarm(ringing && !muted)

  useEffect(() => {
    askNotificationPermission()
  }, [])

  useLiveEvent('alert.raised', (alert) => {
    if (alert.kind !== 'sos') return
    setMuted(false)
    const bus = alert.vehicle
      ? `${alert.vehicle.name} (${alert.vehicle.registration_no})`
      : 'No bus'
    showSosNotification(`SOS · ${bus}`, alert.message, `sos-${alert.id}`, () => setOpenId(alert.id))
  })

  return (
    <div className='mx-auto w-full max-w-[1600px] px-4 pt-6 empty:hidden sm:px-6 lg:px-8'>
      <SosBanner
        onOpen={setOpenId}
        sound={ringing ? { muted, toggle: () => setMuted(!muted) } : undefined}
      />
      <AlertSheet alertId={openId} onOpenChange={(open) => !open && setOpenId(null)} />
    </div>
  )
}
