import { useEffect } from 'react'

type AudioWindow = Window & { webkitAudioContext?: typeof AudioContext }

export function useSosAlarm(active: boolean) {
  useEffect(() => {
    if (!active) return
    const Context = window.AudioContext ?? (window as AudioWindow).webkitAudioContext
    if (!Context) return
    let context: AudioContext
    try {
      context = new Context()
    } catch {
      return
    }
    const beep = () => {
      if (context.state === 'suspended') void context.resume().catch(() => null)
      const tone = context.createOscillator()
      const volume = context.createGain()
      tone.type = 'square'
      tone.frequency.value = 880
      volume.gain.value = 0.05
      tone.connect(volume)
      volume.connect(context.destination)
      tone.start()
      tone.stop(context.currentTime + 0.25)
    }
    beep()
    const timer = window.setInterval(beep, 1500)
    return () => {
      window.clearInterval(timer)
      void context.close().catch(() => null)
    }
  }, [active])
}

export function showSosNotification(title: string, body: string, tag: string, onClick: () => void) {
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return
  if (!document.hidden) return
  try {
    const notice = new Notification(title, { body, tag, requireInteraction: true })
    notice.onclick = () => {
      window.focus()
      onClick()
      notice.close()
    }
  } catch {
    return
  }
}

export function askNotificationPermission() {
  if (typeof Notification === 'undefined' || Notification.permission !== 'default') return
  void Notification.requestPermission().catch(() => null)
}
