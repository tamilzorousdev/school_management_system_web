import { useEffect, useRef } from 'react'
import { useRouter } from '@tanstack/react-router'

const revealCurrent = (container: HTMLElement) => {
  const current = container.querySelector<HTMLElement>('[data-current="true"]')
  if (!current) return
  const top = current.offsetTop
  const bottom = top + current.offsetHeight
  if (top < container.scrollTop) container.scrollTop = top - 8
  else if (bottom > container.scrollTop + container.clientHeight)
    container.scrollTop = bottom - container.clientHeight + 8
}

export function useSteadyScroll<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const router = useRouter()

  useEffect(() => {
    const container = ref.current
    if (!container) return
    let kept = container.scrollTop
    const remember = () => {
      kept = container.scrollTop
    }
    const keep = () => {
      const target = kept
      queueMicrotask(() => {
        container.scrollTop = target
        revealCurrent(container)
        kept = container.scrollTop
      })
    }
    const settle = new ResizeObserver(() => {
      revealCurrent(container)
      kept = container.scrollTop
    })
    const userScrolled = () => settle.disconnect()
    container.addEventListener('scroll', remember, { passive: true })
    container.addEventListener('wheel', userScrolled, { passive: true, once: true })
    container.addEventListener('touchmove', userScrolled, { passive: true, once: true })
    settle.observe(container)
    const stop = router.subscribe('onRendered', keep)
    revealCurrent(container)
    kept = container.scrollTop
    return () => {
      container.removeEventListener('scroll', remember)
      container.removeEventListener('wheel', userScrolled)
      container.removeEventListener('touchmove', userScrolled)
      settle.disconnect()
      stop()
    }
  }, [router])

  return ref
}
