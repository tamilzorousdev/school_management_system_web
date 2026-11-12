import { useSyncExternalStore } from 'react'

type Listener = () => void

const STORAGE_KEY = 'tz-academic-year-id'
const listeners = new Set<Listener>()

const read = (): number | null => {
  try {
    const id = Number(sessionStorage.getItem(STORAGE_KEY))
    return Number.isInteger(id) && id > 0 ? id : null
  } catch {
    return null
  }
}

let current = read()

export const yearContext = {
  get: () => current,
  set: (id: number | null) => {
    if (id === current) return
    current = id
    try {
      if (id) sessionStorage.setItem(STORAGE_KEY, String(id))
      else sessionStorage.removeItem(STORAGE_KEY)
    } catch {
      return
    } finally {
      listeners.forEach((listener) => listener())
    }
  },
  subscribe: (listener: Listener) => {
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  },
}

export function useViewingYear() {
  return useSyncExternalStore(yearContext.subscribe, yearContext.get)
}
