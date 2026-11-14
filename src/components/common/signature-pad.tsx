import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { Eraser, Undo2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type Point = { x: number; y: number }

export interface SignaturePadHandle {
  isEmpty: () => boolean
  toBlob: () => Promise<Blob | null>
}

const HEIGHT = 200
const INK = '#111827'

export const SignaturePad = forwardRef<SignaturePadHandle, { onChange?: (empty: boolean) => void }>(
  function SignaturePad({ onChange }, ref) {
    const canvas = useRef<HTMLCanvasElement>(null)
    const box = useRef<HTMLDivElement>(null)
    const strokes = useRef<Point[][]>([])
    const drawing = useRef(false)
    const [count, setCount] = useState(0)

    const paint = () => {
      const element = canvas.current
      const context = element?.getContext('2d')
      if (!element || !context) return
      const ratio = window.devicePixelRatio || 1
      context.setTransform(ratio, 0, 0, ratio, 0, 0)
      context.clearRect(0, 0, element.width, element.height)
      context.strokeStyle = INK
      context.fillStyle = INK
      context.lineWidth = 2.5
      context.lineCap = 'round'
      context.lineJoin = 'round'
      for (const stroke of strokes.current) {
        if (stroke.length === 1) {
          context.beginPath()
          context.arc(stroke[0]!.x, stroke[0]!.y, 1.4, 0, Math.PI * 2)
          context.fill()
          continue
        }
        context.beginPath()
        context.moveTo(stroke[0]!.x, stroke[0]!.y)
        for (let index = 1; index < stroke.length - 1; index += 1) {
          const middle = {
            x: (stroke[index]!.x + stroke[index + 1]!.x) / 2,
            y: (stroke[index]!.y + stroke[index + 1]!.y) / 2,
          }
          context.quadraticCurveTo(stroke[index]!.x, stroke[index]!.y, middle.x, middle.y)
        }
        const last = stroke[stroke.length - 1]!
        context.lineTo(last.x, last.y)
        context.stroke()
      }
    }

    useEffect(() => {
      const element = canvas.current
      const container = box.current
      if (!element || !container) return
      const resize = () => {
        const ratio = window.devicePixelRatio || 1
        element.width = Math.round(container.clientWidth * ratio)
        element.height = Math.round(HEIGHT * ratio)
        element.style.width = `${container.clientWidth}px`
        element.style.height = `${HEIGHT}px`
        paint()
      }
      resize()
      const observer = new ResizeObserver(resize)
      observer.observe(container)
      return () => observer.disconnect()
    }, [])

    const changed = () => {
      setCount(strokes.current.length)
      onChange?.(strokes.current.length === 0)
    }

    const point = (event: React.PointerEvent<HTMLCanvasElement>): Point => {
      const rect = event.currentTarget.getBoundingClientRect()
      return { x: event.clientX - rect.left, y: event.clientY - rect.top }
    }

    useImperativeHandle(ref, () => ({
      isEmpty: () => strokes.current.length === 0,
      toBlob: () =>
        new Promise((resolve) => {
          if (!canvas.current || !strokes.current.length) return resolve(null)
          canvas.current.toBlob(resolve, 'image/png')
        }),
    }))

    return (
      <div className='grid gap-2'>
        <div
          ref={box}
          className='relative overflow-hidden rounded-xl border-2 border-dashed bg-white'
        >
          <canvas
            ref={canvas}
            role='img'
            aria-label='Signature pad: sign here with your finger, pen or mouse'
            className='block cursor-crosshair touch-none'
            onPointerDown={(event) => {
              event.currentTarget.setPointerCapture(event.pointerId)
              drawing.current = true
              strokes.current.push([point(event)])
              paint()
            }}
            onPointerMove={(event) => {
              if (!drawing.current) return
              strokes.current[strokes.current.length - 1]!.push(point(event))
              paint()
            }}
            onPointerUp={() => {
              if (!drawing.current) return
              drawing.current = false
              changed()
            }}
            onPointerCancel={() => {
              drawing.current = false
              changed()
            }}
          />
          <span
            aria-hidden
            className='pointer-events-none absolute inset-x-6 bottom-10 border-b border-slate-300'
          />
          {count === 0 && (
            <span className='pointer-events-none absolute inset-0 grid place-items-center text-sm text-slate-400'>
              Sign here
            </span>
          )}
        </div>
        <div className='flex justify-end gap-2'>
          <Button
            type='button'
            variant='ghost'
            size='sm'
            disabled={count === 0}
            onClick={() => {
              strokes.current.pop()
              paint()
              changed()
            }}
          >
            <Undo2 />
            Undo
          </Button>
          <Button
            type='button'
            variant='ghost'
            size='sm'
            disabled={count === 0}
            className={cn(count > 0 && 'text-destructive hover:bg-destructive/10')}
            onClick={() => {
              strokes.current = []
              paint()
              changed()
            }}
          >
            <Eraser />
            Clear
          </Button>
        </div>
      </div>
    )
  }
)
