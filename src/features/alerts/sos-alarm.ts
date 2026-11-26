import { useEffect, useState } from 'react'

type AudioWindow = Window & { webkitAudioContext?: typeof AudioContext }

let shared: AudioContext | null = null

function audio(): AudioContext | null {
  if (shared) return shared
  const Context = window.AudioContext ?? (window as AudioWindow).webkitAudioContext
  if (!Context) return null
  try {
    shared = new Context()
  } catch {
    return null
  }
  return shared
}

export function unlockSosSound() {
  const context = audio()
  if (context?.state === 'suspended') void context.resume().catch(() => null)
}

export function useSosSoundUnlock() {
  useEffect(() => {
    const unlock = () => unlockSosSound()
    window.addEventListener('pointerdown', unlock, true)
    window.addEventListener('keydown', unlock, true)
    return () => {
      window.removeEventListener('pointerdown', unlock, true)
      window.removeEventListener('keydown', unlock, true)
    }
  }, [])
}

function tone(context: AudioContext, frequency: number, start: number, length: number) {
  const oscillator = context.createOscillator()
  const volume = context.createGain()
  oscillator.type = 'square'
  oscillator.frequency.value = frequency
  volume.gain.setValueAtTime(0.0001, start)
  volume.gain.exponentialRampToValueAtTime(0.25, start + 0.02)
  volume.gain.setValueAtTime(0.25, start + length - 0.03)
  volume.gain.exponentialRampToValueAtTime(0.0001, start + length)
  oscillator.connect(volume)
  volume.connect(context.destination)
  oscillator.start(start)
  oscillator.stop(start + length)
}

function siren(context: AudioContext) {
  const now = context.currentTime
  tone(context, 960, now, 0.3)
  tone(context, 720, now + 0.32, 0.3)
  tone(context, 960, now + 0.64, 0.3)
}

export function useSosAlarm(active: boolean): { blocked: boolean } {
  const [blocked, setBlocked] = useState(false)
  useEffect(() => {
    if (!active) return
    const ring = () => {
      const context = audio()
      if (!context) return
      if (context.state !== 'running') {
        void context.resume().catch(() => null)
        setBlocked(true)
        return
      }
      setBlocked(false)
      siren(context)
    }
    const first = window.setTimeout(ring, 0)
    const timer = window.setInterval(ring, 2000)
    return () => {
      window.clearTimeout(first)
      window.clearInterval(timer)
    }
  }, [active])
  return { blocked: active && blocked }
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
