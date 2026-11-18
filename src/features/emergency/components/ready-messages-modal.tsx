import { useState } from 'react'
import { ArrowLeft, ListChecks, Pencil, Plus, Trash2 } from 'lucide-react'
import { AppModal } from '@/components/common/app-modal'
import { Combobox } from '@/components/common/combobox'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import { EmptyState, ErrorState } from '@/components/common/display'
import { FormField } from '@/components/common/form-field'
import { SegmentedControl } from '@/components/common/segmented-control'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input, Textarea } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { alerts } from '@/lib/alerts'
import { toApiError } from '@/lib/api/errors'
import {
  emergencyApi,
  useEmergencyMutation,
  useEmergencyTemplates,
  type EmergencyCategory,
  type EmergencySeverity,
  type EmergencyTemplate,
  type TemplateInput,
} from '../api'
import { CATEGORY_LABEL, SEVERITY } from '../labels'

const blank: TemplateInput = {
  category: 'other',
  severity: 'warning',
  title: '',
  message: '',
  title_ta: '',
  message_ta: '',
}

export function ReadyMessagesModal({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const templates = useEmergencyTemplates(true)
  const [editing, setEditing] = useState<EmergencyTemplate | 'new' | null>(null)
  const [removing, setRemoving] = useState<EmergencyTemplate | null>(null)
  const toggle = useEmergencyMutation((item: EmergencyTemplate) =>
    emergencyApi.updateTemplate(item.id, { is_active: !item.is_active })
  )
  const remove = useEmergencyMutation((id: number) => emergencyApi.removeTemplate(id))
  const rows = templates.data ?? []

  const close = (next: boolean) => {
    if (!next) setEditing(null)
    onOpenChange(next)
  }

  return (
    <>
      <AppModal
        open={open}
        onOpenChange={close}
        size='lg'
        title={
          editing
            ? editing === 'new'
              ? 'New ready message'
              : 'Edit ready message'
            : 'Ready messages'
        }
        description={
          editing
            ? 'Write it in English, and in Tamil for Tamil readers.'
            : 'The messages the office can start from. Switch off the ones your school does not use.'
        }
      >
        {editing ? (
          <TemplateForm
            template={editing === 'new' ? null : editing}
            onDone={() => setEditing(null)}
          />
        ) : (
          <div className='grid gap-3'>
            <Button className='justify-self-start' onClick={() => setEditing('new')}>
              <Plus />
              Add a ready message
            </Button>
            {templates.isPending ? (
              <Skeleton className='h-48' />
            ) : templates.isError ? (
              <ErrorState message={templates.error.message} onRetry={() => templates.refetch()} />
            ) : !rows.length ? (
              <EmptyState icon={ListChecks} title='No ready messages yet' className='py-6' />
            ) : (
              <ul className='grid max-h-[60vh] divide-y overflow-y-auto rounded-xl border'>
                {rows.map((item) => (
                  <li key={item.id} className='flex flex-wrap items-start gap-3 p-3'>
                    <span className='grid min-w-0 flex-1 gap-0.5'>
                      <span className='flex flex-wrap items-center gap-1.5'>
                        <span className='font-semibold'>{item.title}</span>
                        <Badge tone='neutral'>{CATEGORY_LABEL[item.category]}</Badge>
                        <Badge tone={SEVERITY[item.severity].tone}>
                          {SEVERITY[item.severity].label}
                        </Badge>
                        {!item.title_ta && <Badge tone='warning'>No Tamil</Badge>}
                      </span>
                      <span className='line-clamp-2 text-xs text-muted-foreground'>
                        {item.message}
                      </span>
                    </span>
                    <span className='flex items-center gap-1'>
                      <Switch
                        checked={item.is_active}
                        aria-label={
                          item.is_active ? `Switch off ${item.title}` : `Switch on ${item.title}`
                        }
                        onCheckedChange={() =>
                          toggle.mutate(item, {
                            onError: (error) => alerts.error(toApiError(error).message),
                          })
                        }
                      />
                      <Button
                        size='icon'
                        variant='ghost'
                        aria-label={`Edit ${item.title}`}
                        onClick={() => setEditing(item)}
                      >
                        <Pencil />
                      </Button>
                      <Button
                        size='icon'
                        variant='ghost'
                        aria-label={`Remove ${item.title}`}
                        className='text-destructive hover:bg-destructive/10'
                        onClick={() => setRemoving(item)}
                      >
                        <Trash2 />
                      </Button>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </AppModal>
      <ConfirmDialog
        open={Boolean(removing)}
        onOpenChange={(next) => !next && setRemoving(null)}
        title={`Remove "${removing?.title ?? ''}"?`}
        description='It is no longer offered when writing an emergency broadcast. Broadcasts already sent are not changed.'
        confirmText='Remove'
        destructive
        loading={remove.isPending}
        onConfirm={async () => {
          try {
            await remove.mutateAsync(removing!.id)
            alerts.success('Ready message removed')
            setRemoving(null)
          } catch (error) {
            alerts.error(toApiError(error).message)
          }
        }}
      />
    </>
  )
}

function TemplateForm({
  template,
  onDone,
}: {
  template: EmergencyTemplate | null
  onDone: () => void
}) {
  const [form, setForm] = useState<TemplateInput>(() =>
    template
      ? {
          category: template.category,
          severity: template.severity,
          title: template.title,
          message: template.message,
          title_ta: template.title_ta ?? '',
          message_ta: template.message_ta ?? '',
        }
      : blank
  )
  const [errors, setErrors] = useState<Record<string, string>>({})
  const save = useEmergencyMutation((input: TemplateInput) =>
    template ? emergencyApi.updateTemplate(template.id, input) : emergencyApi.addTemplate(input)
  )
  const set = <K extends keyof TemplateInput>(key: K, value: TemplateInput[K]) => {
    setForm((current) => ({ ...current, [key]: value }))
    setErrors((current) => ({ ...current, [key]: '' }))
  }

  const submit = async () => {
    const next: Record<string, string> = {}
    if (form.title.trim().length < 3) next.title = 'Write a title of at least 3 letters'
    if (form.message.trim().length < 5) next.message = 'Write the message'
    setErrors(next)
    if (Object.keys(next).length) return
    try {
      await save.mutateAsync({
        ...form,
        title: form.title.trim(),
        message: form.message.trim(),
        title_ta: form.title_ta.trim(),
        message_ta: form.message_ta.trim(),
      })
      alerts.success(template ? 'Ready message saved' : 'Ready message added')
      onDone()
    } catch (error) {
      alerts.error(toApiError(error).message)
    }
  }

  return (
    <form
      className='grid gap-4 sm:grid-cols-2'
      onSubmit={(event) => {
        event.preventDefault()
        void submit()
      }}
    >
      <FormField
        id='rm-title'
        label='Title'
        required
        error={errors.title}
        className='sm:col-span-2'
      >
        <Input
          id='rm-title'
          maxLength={120}
          value={form.title}
          onChange={(event) => set('title', event.target.value)}
        />
      </FormField>
      <FormField
        id='rm-message'
        label='Message'
        required
        error={errors.message}
        className='sm:col-span-2'
      >
        <Textarea
          id='rm-message'
          rows={3}
          maxLength={1000}
          value={form.message}
          onChange={(event) => set('message', event.target.value)}
        />
      </FormField>
      <FormField id='rm-title-ta' label='Title in Tamil' hint='Optional. Tamil readers get this.'>
        <Input
          id='rm-title-ta'
          maxLength={120}
          value={form.title_ta}
          onChange={(event) => set('title_ta', event.target.value)}
        />
      </FormField>
      <FormField id='rm-category' label='Type'>
        <Combobox
          id='rm-category'
          label='Type'
          placeholder='Choose type'
          value={form.category}
          options={Object.entries(CATEGORY_LABEL).map(([value, label]) => ({ value, label }))}
          onChange={(value) => value && set('category', value as EmergencyCategory)}
          highlightSelected={false}
          className='sm:w-full'
        />
      </FormField>
      <FormField id='rm-message-ta' label='Message in Tamil' className='sm:col-span-2'>
        <Textarea
          id='rm-message-ta'
          rows={2}
          maxLength={1000}
          value={form.message_ta}
          onChange={(event) => set('message_ta', event.target.value)}
        />
      </FormField>
      <FormField id='rm-severity' label='How serious' className='sm:col-span-2'>
        <SegmentedControl
          label='How serious'
          value={form.severity}
          onChange={(value: EmergencySeverity) => set('severity', value)}
          options={(Object.keys(SEVERITY) as EmergencySeverity[]).map((value) => ({
            value,
            label: SEVERITY[value].label,
          }))}
        />
      </FormField>
      <div className='flex flex-wrap justify-between gap-2 sm:col-span-2'>
        <Button type='button' variant='ghost' onClick={onDone}>
          <ArrowLeft />
          Back to the list
        </Button>
        <Button type='submit' loading={save.isPending}>
          {template ? 'Save' : 'Add'}
        </Button>
      </div>
    </form>
  )
}
