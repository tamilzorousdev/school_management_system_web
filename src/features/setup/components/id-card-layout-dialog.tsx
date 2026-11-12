import { useState, type FormEvent } from 'react'
import { AlignCenter, AlignLeft, AlignRight, Bold, Plus, Trash2, X } from 'lucide-react'
import { AppModal } from '@/components/common/app-modal'
import { Button } from '@/components/ui/button'
import { alerts } from '@/lib/alerts'
import { toApiError } from '@/lib/api/errors'
import { cn } from '@/lib/utils'
import {
  ID_CARD_LAYOUT_KEYS,
  ID_CARD_LAYOUT_LABELS,
  layoutItem,
  type IdCardLayout,
  type IdCardLayoutItem,
  type IdCardLayoutKey,
  type IdCardSide,
} from '@/lib/id-card-layout'
import { setupApi, useSetupMutation, type SchoolProfile } from '../api'
import { IdCardLayoutView } from './id-card-layout-view'

const FORM_ID = 'id-card-layout-form'

interface IdCardLayoutDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  school: SchoolProfile
  layout: IdCardLayout
}

export function IdCardLayoutDialog({
  open,
  onOpenChange,
  school,
  layout,
}: IdCardLayoutDialogProps) {
  const mutation = useSetupMutation((input: Partial<SchoolProfile>) => setupApi.updateSchool(input))
  return (
    <AppModal
      open={open}
      onOpenChange={onOpenChange}
      title='Where should student details go?'
      description='Drag each box onto the empty space in your design. Drag the corner to resize. Every student’s own photo and details print in these places.'
      size='xl'
      formId={FORM_ID}
      submitText='Save positions'
      loading={mutation.isPending}
    >
      {open && (
        <LayoutForm
          school={school}
          initial={layout}
          onSave={async (next) => {
            try {
              await mutation.mutateAsync({ id_card_layout: next })
              alerts.success('Detail positions saved.')
              onOpenChange(false)
            } catch (error) {
              const apiError = toApiError(error)
              alerts.error(apiError.fieldErrors[0]?.message ?? apiError.message)
            }
          }}
        />
      )}
    </AppModal>
  )
}

function LayoutForm({
  school,
  initial,
  onSave,
}: {
  school: SchoolProfile
  initial: IdCardLayout
  onSave: (layout: IdCardLayout) => Promise<void>
}) {
  const [layout, setLayout] = useState(initial)
  const [side, setSide] = useState<IdCardSide>('front')
  const [selected, setSelected] = useState<IdCardLayoutKey | null>(null)
  const imageUrl = side === 'front' ? school.id_card_front_url : school.id_card_back_url
  const items = layout[side]
  const current = items.find((item) => item.key === selected) ?? null

  const update = (key: IdCardLayoutKey, patch: Partial<IdCardLayoutItem>) =>
    setLayout((value) => ({
      ...value,
      [side]: value[side].map((item) => (item.key === key ? { ...item, ...patch } : item)),
    }))

  const toggle = (key: IdCardLayoutKey) => {
    if (items.some((item) => item.key === key)) {
      setLayout((value) => ({ ...value, [side]: value[side].filter((item) => item.key !== key) }))
      if (selected === key) setSelected(null)
      return
    }
    setLayout((value) => ({ ...value, [side]: [...value[side], layoutItem(key)] }))
    setSelected(key)
  }

  const submit = (event: FormEvent) => {
    event.preventDefault()
    void onSave(layout)
  }

  return (
    <form id={FORM_ID} onSubmit={submit} className='grid min-w-0 gap-4'>
      {school.id_card_back_url && (
        <div
          role='tablist'
          aria-label='Card side'
          className='flex w-fit rounded-md border bg-muted/40 p-0.5'
        >
          {(['front', 'back'] as const).map((value) => (
            <button
              key={value}
              type='button'
              role='tab'
              aria-selected={side === value}
              onClick={() => {
                setSide(value)
                setSelected(null)
              }}
              className={cn(
                'h-8 rounded px-4 text-sm font-medium text-muted-foreground capitalize',
                side === value && 'bg-card text-foreground shadow-xs'
              )}
            >
              {value}
            </button>
          ))}
        </div>
      )}

      <div className='grid gap-2'>
        <span className='text-sm font-medium'>Details on the {side} side</span>
        <div className='flex flex-wrap gap-1.5'>
          {ID_CARD_LAYOUT_KEYS.map((key) => {
            const on = items.some((item) => item.key === key)
            return (
              <button
                key={key}
                type='button'
                aria-pressed={on}
                onClick={() => toggle(key)}
                className={cn(
                  'inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium transition-colors hover:bg-muted',
                  on && 'border-primary bg-primary/10 text-primary hover:bg-primary/15'
                )}
              >
                {on ? <X className='size-3' /> : <Plus className='size-3' />}
                {ID_CARD_LAYOUT_LABELS[key]}
              </button>
            )
          })}
        </div>
      </div>

      {imageUrl && (
        <div className='mx-auto w-full max-w-2xl'>
          <IdCardLayoutView
            imageUrl={imageUrl}
            items={items}
            editable
            selected={selected}
            onSelect={setSelected}
            onChange={update}
          />
        </div>
      )}

      {current ? (
        <div className='flex flex-wrap items-end gap-3 rounded-lg border bg-muted/30 p-3'>
          <span className='self-center text-sm font-semibold'>
            {ID_CARD_LAYOUT_LABELS[current.key]}
          </span>
          {current.key !== 'photo' && current.key !== 'qr' && (
            <>
              <label className='grid gap-1'>
                <span className='text-[11px] text-muted-foreground'>Text size</span>
                <input
                  type='number'
                  min={3}
                  max={30}
                  step={0.5}
                  value={current.font_size}
                  onChange={(event) => {
                    const value = Number(event.target.value)
                    if (Number.isFinite(value) && value >= 3 && value <= 30) {
                      update(current.key, { font_size: value })
                    }
                  }}
                  className='h-8 w-20 rounded-md border border-input bg-card px-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/30'
                />
              </label>
              <label className='grid gap-1'>
                <span className='text-[11px] text-muted-foreground'>Colour</span>
                <input
                  type='color'
                  value={current.color}
                  onChange={(event) =>
                    update(current.key, { color: event.target.value.toUpperCase() })
                  }
                  className='h-8 w-12 cursor-pointer rounded-md border border-input bg-card p-0.5'
                />
              </label>
              <div className='flex gap-1'>
                <IconToggle
                  label='Bold'
                  pressed={current.bold}
                  onClick={() => update(current.key, { bold: !current.bold })}
                >
                  <Bold />
                </IconToggle>
                <IconToggle
                  label='Align left'
                  pressed={current.align === 'left'}
                  onClick={() => update(current.key, { align: 'left' })}
                >
                  <AlignLeft />
                </IconToggle>
                <IconToggle
                  label='Align centre'
                  pressed={current.align === 'center'}
                  onClick={() => update(current.key, { align: 'center' })}
                >
                  <AlignCenter />
                </IconToggle>
                <IconToggle
                  label='Align right'
                  pressed={current.align === 'right'}
                  onClick={() => update(current.key, { align: 'right' })}
                >
                  <AlignRight />
                </IconToggle>
              </div>
            </>
          )}
          <Button
            type='button'
            variant='ghost'
            size='sm'
            onClick={() => toggle(current.key)}
            className='ml-auto text-destructive hover:text-destructive'
          >
            <Trash2 /> Remove
          </Button>
        </div>
      ) : (
        <p className='text-center text-xs text-muted-foreground'>
          Click a box to change its text size, colour or alignment.
        </p>
      )}
    </form>
  )
}

function IconToggle({
  label,
  pressed,
  onClick,
  children,
}: {
  label: string
  pressed: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type='button'
      aria-label={label}
      aria-pressed={pressed}
      title={label}
      onClick={onClick}
      className={cn(
        'flex size-8 items-center justify-center rounded-md border bg-card text-muted-foreground hover:bg-muted [&_svg]:size-4',
        pressed && 'border-primary bg-primary/10 text-primary'
      )}
    >
      {children}
    </button>
  )
}
