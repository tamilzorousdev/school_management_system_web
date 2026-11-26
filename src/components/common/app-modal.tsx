import * as React from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useShortcut } from '@/components/shortcuts/shortcut-context'
import { Kbd } from '@/components/shortcuts/kbd'
import { cn } from '@/lib/utils'

const sizes = {
  sm: 'sm:max-w-md',
  md: 'sm:max-w-lg',
  lg: 'sm:max-w-2xl',
  xl: 'sm:max-w-4xl',
}

interface AppModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  children: React.ReactNode
  formId?: string
  submitText?: string
  cancelText?: string
  loading?: boolean
  size?: keyof typeof sizes
  footer?: React.ReactNode
  showSubmitShortcut?: boolean
}

export function AppModal({
  open,
  onOpenChange,
  title,
  description,
  children,
  formId,
  submitText = 'Save',
  cancelText = 'Cancel',
  loading = false,
  size = 'md',
  footer,
  showSubmitShortcut = false,
}: AppModalProps) {
  const [lastOpenChildren, setLastOpenChildren] = React.useState(children)
  if (open && lastOpenChildren !== children) setLastOpenChildren(children)

  useShortcut(
    'modal.submit',
    () => {
      if (!formId || loading) return
      const form = document.getElementById(formId)
      if (form instanceof HTMLFormElement) form.requestSubmit()
    },
    { enabled: open && Boolean(formId) && showSubmitShortcut, scope: 'modal' }
  )

  return (
    <Dialog open={open} onOpenChange={(next) => !loading && onOpenChange(next)}>
      <DialogContent className={cn(sizes[size])}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        {open ? children : lastOpenChildren}
        {footer ??
          (formId && (
            <DialogFooter>
              <Button variant='secondary' onClick={() => onOpenChange(false)} disabled={loading}>
                {cancelText}
              </Button>
              <Button type='submit' form={formId} variant='primary' loading={loading}>
                {submitText}
                {showSubmitShortcut && <Kbd id='modal.submit' inverted />}
              </Button>
            </DialogFooter>
          ))}
      </DialogContent>
    </Dialog>
  )
}
