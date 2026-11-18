import { useState } from 'react'
import { MessageSquareText, Smartphone, UsersRound, X } from 'lucide-react'
import { AppModal } from '@/components/common/app-modal'
import { Combobox } from '@/components/common/combobox'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import { FormField } from '@/components/common/form-field'
import { SegmentedControl } from '@/components/common/segmented-control'
import { Badge } from '@/components/ui/badge'
import { Input, Textarea } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { useClasses, useSections } from '@/features/setup/api'
import { alerts } from '@/lib/alerts'
import { toApiError } from '@/lib/api/errors'
import { uniqueId } from '@/lib/utils'
import {
  emergencyApi,
  useEmergencyMutation,
  useEmergencyPreview,
  useEmergencyTemplates,
  type AudienceInput,
  type EmergencyAudience,
  type EmergencyBroadcast,
  type EmergencyCategory,
  type EmergencyChannel,
  type EmergencySeverity,
  type ExpiryUnit,
} from '../api'
import { AUDIENCE_OPTIONS, CATEGORY_LABEL, EXPIRY_UNITS, SEVERITY } from '../labels'

export interface ComposePrefill {
  follow_up_of?: EmergencyBroadcast
}

interface Draft {
  title: string
  message: string
  title_ta: string
  message_ta: string
  category: EmergencyCategory
  severity: EmergencySeverity
  audience: EmergencyAudience
  class_ids: number[]
  section_ids: number[]
  include_teachers: boolean
  push: boolean
  sms: boolean
  expires: boolean
  expiry_value: string
  expiry_unit: ExpiryUnit
  later: boolean
  send_at: string
}

const UNIT_SECONDS: Partial<Record<ExpiryUnit, number>> = {
  seconds: 1,
  minutes: 60,
  hours: 3600,
  days: 86400,
}

const emptyDraft: Draft = {
  title: '',
  message: '',
  title_ta: '',
  message_ta: '',
  category: 'other',
  severity: 'critical',
  audience: 'parents',
  class_ids: [],
  section_ids: [],
  include_teachers: false,
  push: true,
  sms: true,
  expires: false,
  expiry_value: '1',
  expiry_unit: 'hours',
  later: false,
  send_at: '',
}

const fromPrevious = (previous: EmergencyBroadcast): Draft => ({
  ...emptyDraft,
  category: 'all_clear',
  severity: 'info',
  title: 'All clear: normal schedule resumes',
  message:
    'The situation is now normal. The school will follow its regular schedule. Thank you for your patience.',
  title_ta: 'நிலைமை சீரானது: வழக்கமான அட்டவணை தொடரும்',
  message_ta:
    'நிலைமை இப்போது சீராக உள்ளது. பள்ளி வழக்கமான அட்டவணையைப் பின்பற்றும். உங்கள் பொறுமைக்கு நன்றி.',
  audience: previous.audience === 'students' ? 'parents' : previous.audience,
  class_ids: previous.class_ids,
  section_ids: previous.section_ids,
  include_teachers: previous.include_teachers,
  push: previous.channels.includes('push'),
  sms: previous.channels.includes('sms'),
})

export function ComposeModal({
  prefill,
  onClose,
  onSent,
}: {
  prefill?: ComposePrefill
  onClose: () => void
  onSent: (broadcast: EmergencyBroadcast) => void
}) {
  const [draft, setDraft] = useState<Draft>(() =>
    prefill?.follow_up_of ? fromPrevious(prefill.follow_up_of) : emptyDraft
  )
  const [clientId] = useState(() => uniqueId())
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [confirming, setConfirming] = useState(false)
  const templates = useEmergencyTemplates()
  const classes = useClasses()
  const sections = useSections()
  const send = useEmergencyMutation(emergencyApi.send)
  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => {
    setDraft((current) => ({ ...current, [key]: value }))
    setErrors((current) => ({ ...current, [key]: '' }))
  }

  const audienceInput: AudienceInput | null =
    (draft.audience === 'classes' && !draft.class_ids.length) ||
    (draft.audience === 'sections' && !draft.section_ids.length)
      ? null
      : {
          audience: draft.audience,
          ...(draft.audience === 'classes' ? { class_ids: draft.class_ids } : {}),
          ...(draft.audience === 'sections' ? { section_ids: draft.section_ids } : {}),
          ...(['classes', 'sections'].includes(draft.audience)
            ? { include_teachers: draft.include_teachers }
            : {}),
        }
  const preview = useEmergencyPreview(audienceInput)
  const channels: EmergencyChannel[] = [
    ...(draft.push ? (['push'] as const) : []),
    ...(draft.sms ? (['sms'] as const) : []),
  ]

  const validate = () => {
    const next: Record<string, string> = {}
    if (draft.title.trim().length < 3) next.title = 'Write a title of at least 3 letters'
    if (draft.message.trim().length < 5) next.message = 'Write the message'
    if (draft.audience === 'classes' && !draft.class_ids.length)
      next.class_ids = 'Choose at least one class'
    if (draft.audience === 'sections' && !draft.section_ids.length)
      next.section_ids = 'Choose at least one section'
    if (!channels.length) next.channels = 'Choose push, SMS or both'
    if (draft.expires) {
      const value = Number(draft.expiry_value)
      if (!Number.isInteger(value) || value < 1) next.expiry = 'Write a whole number, 1 or more'
      else if (value * (UNIT_SECONDS[draft.expiry_unit] ?? Infinity) < 5)
        next.expiry = 'Keep it for at least 5 seconds'
    }
    if (draft.later) {
      const at = new Date(draft.send_at).getTime()
      if (!draft.send_at || Number.isNaN(at)) next.send_at = 'Pick the date and time to send'
      else if (at < Date.now() + 60_000) next.send_at = 'Pick a time at least 1 minute from now'
    }
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const submit = async () => {
    try {
      const sent = await send.mutateAsync({
        ...audienceInput!,
        title: draft.title.trim(),
        message: draft.message.trim(),
        ...(draft.title_ta.trim() ? { title_ta: draft.title_ta.trim() } : {}),
        ...(draft.message_ta.trim() ? { message_ta: draft.message_ta.trim() } : {}),
        category: draft.category,
        severity: draft.severity,
        channels,
        client_id: clientId,
        ...(prefill?.follow_up_of ? { follow_up_of: prefill.follow_up_of.id } : {}),
        ...(draft.expires
          ? { expires_in: { value: Number(draft.expiry_value), unit: draft.expiry_unit } }
          : {}),
        ...(draft.later ? { send_at: new Date(draft.send_at).toISOString() } : {}),
      })
      alerts.success(
        sent.state === 'pending_approval'
          ? 'Sent to the principal for approval. It goes out once approved.'
          : sent.state === 'scheduled'
            ? `Scheduled for ${new Date(sent.send_at!).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}`
            : `Emergency broadcast is going out to ${sent.counts.total} people`
      )
      onSent(sent)
    } catch (error) {
      setConfirming(false)
      alerts.error(toApiError(error).message)
    }
  }

  const chips = (ids: number[], key: 'class_ids' | 'section_ids', label: (id: number) => string) =>
    ids.length > 0 && (
      <span className='flex flex-wrap gap-1.5'>
        {ids.map((id) => (
          <Badge key={id} tone='info'>
            {label(id)}
            <button
              type='button'
              aria-label={`Remove ${label(id)}`}
              className='rounded-full hover:bg-info/20'
              onClick={() =>
                set(
                  key,
                  ids.filter((item) => item !== id)
                )
              }
            >
              <X className='size-3' />
            </button>
          </Badge>
        ))}
      </span>
    )

  const sectionName = (id: number) => {
    const section = sections.data?.find((item) => item.id === id)
    return section ? `${section.class_name} - ${section.name}` : String(id)
  }
  const className = (id: number) =>
    `Class ${classes.data?.find((item) => item.id === id)?.name ?? id}`
  const count = preview.data

  return (
    <>
      <AppModal
        open
        onOpenChange={(open) => !open && onClose()}
        title={prefill?.follow_up_of ? 'Send all clear' : 'New emergency broadcast'}
        description={
          prefill?.follow_up_of
            ? `Follows up "${prefill.follow_up_of.title}"`
            : 'Goes out in the app, by push and by SMS, now or at the time you pick. It cannot be edited after sending.'
        }
        size='lg'
        formId='emergency-form'
        submitText='Review and send'
        loading={send.isPending}
      >
        <form
          id='emergency-form'
          className='grid gap-4 sm:grid-cols-2'
          onSubmit={(event) => {
            event.preventDefault()
            if (validate()) setConfirming(true)
          }}
        >
          {!prefill?.follow_up_of && (
            <FormField
              id='em-template'
              label='Start from a ready message'
              className='sm:col-span-2'
            >
              <Combobox
                id='em-template'
                label='Ready messages'
                placeholder='Choose a ready message (optional)'
                options={(templates.data ?? []).map((item) => ({
                  value: item.key,
                  label: item.title,
                  hint: CATEGORY_LABEL[item.category],
                }))}
                onChange={(value) => {
                  const item = templates.data?.find((template) => template.key === value)
                  if (!item) return
                  setDraft((current) => ({
                    ...current,
                    title: item.title,
                    message: item.message,
                    title_ta: item.title_ta ?? '',
                    message_ta: item.message_ta ?? '',
                    category: item.category,
                    severity: item.severity,
                  }))
                  setErrors({})
                }}
                highlightSelected={false}
                className='sm:w-full'
              />
            </FormField>
          )}
          <FormField
            id='em-title'
            label='Title'
            required
            error={errors.title}
            className='sm:col-span-2'
          >
            <Input
              id='em-title'
              value={draft.title}
              maxLength={120}
              placeholder='e.g. School closed today due to heavy rain'
              onChange={(event) => set('title', event.target.value)}
            />
          </FormField>
          <FormField
            id='em-message'
            label='Message'
            required
            error={errors.message}
            className='sm:col-span-2'
          >
            <Textarea
              id='em-message'
              rows={3}
              maxLength={1000}
              value={draft.message}
              onChange={(event) => set('message', event.target.value)}
            />
          </FormField>
          <FormField
            id='em-title-ta'
            label='Title in Tamil'
            hint='Optional. Tamil readers get this.'
          >
            <Input
              id='em-title-ta'
              value={draft.title_ta}
              maxLength={120}
              onChange={(event) => set('title_ta', event.target.value)}
            />
          </FormField>
          <FormField id='em-category' label='Type'>
            <Combobox
              id='em-category'
              label='Type'
              value={draft.category}
              placeholder='Choose type'
              options={Object.entries(CATEGORY_LABEL).map(([value, label]) => ({ value, label }))}
              onChange={(value) => value && set('category', value as EmergencyCategory)}
              highlightSelected={false}
              className='sm:w-full'
            />
          </FormField>
          <FormField id='em-message-ta' label='Message in Tamil' className='sm:col-span-2'>
            <Textarea
              id='em-message-ta'
              rows={2}
              maxLength={1000}
              value={draft.message_ta}
              onChange={(event) => set('message_ta', event.target.value)}
            />
          </FormField>
          <FormField id='em-severity' label='How serious'>
            <SegmentedControl
              label='How serious'
              value={draft.severity}
              onChange={(value: EmergencySeverity) => set('severity', value)}
              options={(Object.keys(SEVERITY) as EmergencySeverity[]).map((value) => ({
                value,
                label: SEVERITY[value].label,
              }))}
            />
          </FormField>
          <FormField
            id='em-channels'
            label='Send by'
            error={errors.channels}
            hint='In-app is always on.'
          >
            <div className='flex flex-wrap gap-4 pt-1'>
              <label className='flex items-center gap-2 text-sm'>
                <Switch
                  checked={draft.push}
                  onCheckedChange={(value) => set('push', value)}
                  aria-label='Push'
                />
                Push
              </label>
              <label className='flex items-center gap-2 text-sm'>
                <Switch
                  checked={draft.sms}
                  onCheckedChange={(value) => set('sms', value)}
                  aria-label='SMS'
                />
                SMS
              </label>
            </div>
          </FormField>
          <FormField
            id='em-expiry-value'
            label='Take it off the screen after'
            error={errors.expiry}
            hint={
              draft.expires
                ? 'Counted from when it goes out. Phones that were offline do not get it after this.'
                : 'Stays until you end it.'
            }
          >
            <div className='grid gap-2'>
              <label className='flex items-center gap-2 text-sm'>
                <Switch
                  checked={draft.expires}
                  onCheckedChange={(value) => set('expires', value)}
                  aria-label='Take it off the screen after a time'
                />
                {draft.expires ? 'After' : 'Keep it until ended'}
              </label>
              {draft.expires && (
                <div className='flex gap-2'>
                  <Input
                    id='em-expiry-value'
                    type='number'
                    min={1}
                    inputMode='numeric'
                    className='w-24'
                    value={draft.expiry_value}
                    onChange={(event) => set('expiry_value', event.target.value)}
                  />
                  <Combobox
                    id='em-expiry-unit'
                    label='Unit'
                    placeholder='Unit'
                    value={draft.expiry_unit}
                    options={EXPIRY_UNITS}
                    onChange={(value) => value && set('expiry_unit', value as ExpiryUnit)}
                    highlightSelected={false}
                    className='min-w-0 flex-1'
                  />
                </div>
              )}
            </div>
          </FormField>
          <FormField id='em-send-at' label='When' error={errors.send_at}>
            <div className='grid gap-2'>
              <SegmentedControl
                label='When'
                value={draft.later ? 'later' : 'now'}
                onChange={(value: 'now' | 'later') => set('later', value === 'later')}
                options={[
                  { value: 'now', label: 'Send now' },
                  { value: 'later', label: 'Send later' },
                ]}
              />
              {draft.later && (
                <Input
                  id='em-send-at'
                  type='datetime-local'
                  value={draft.send_at}
                  onChange={(event) => set('send_at', event.target.value)}
                />
              )}
            </div>
          </FormField>
          <FormField id='em-audience' label='Send to' className='sm:col-span-2'>
            <SegmentedControl
              label='Send to'
              value={draft.audience}
              onChange={(value: EmergencyAudience) => set('audience', value)}
              options={AUDIENCE_OPTIONS}
              className='flex-wrap'
            />
          </FormField>
          {draft.audience === 'classes' && (
            <FormField
              id='em-classes'
              label='Classes'
              required
              error={errors.class_ids}
              className='sm:col-span-2'
            >
              <div className='grid gap-2'>
                <Combobox
                  id='em-classes'
                  label='Add a class'
                  placeholder='Add a class'
                  options={(classes.data ?? [])
                    .filter((item) => !draft.class_ids.includes(item.id))
                    .map((item) => ({ value: String(item.id), label: `Class ${item.name}` }))}
                  onChange={(value) =>
                    value && set('class_ids', [...draft.class_ids, Number(value)])
                  }
                  highlightSelected={false}
                  className='sm:w-full'
                />
                {chips(draft.class_ids, 'class_ids', className)}
              </div>
            </FormField>
          )}
          {draft.audience === 'sections' && (
            <FormField
              id='em-sections'
              label='Sections'
              required
              error={errors.section_ids}
              className='sm:col-span-2'
            >
              <div className='grid gap-2'>
                <Combobox
                  id='em-sections'
                  label='Add a section'
                  placeholder='Add a section'
                  options={(sections.data ?? [])
                    .filter((item) => !draft.section_ids.includes(item.id))
                    .map((item) => ({
                      value: String(item.id),
                      label: `${item.class_name} - ${item.name}`,
                    }))}
                  onChange={(value) =>
                    value && set('section_ids', [...draft.section_ids, Number(value)])
                  }
                  highlightSelected={false}
                  className='sm:w-full'
                />
                {chips(draft.section_ids, 'section_ids', sectionName)}
              </div>
            </FormField>
          )}
          {['classes', 'sections'].includes(draft.audience) && (
            <label className='flex items-center gap-2 text-sm sm:col-span-2'>
              <Switch
                checked={draft.include_teachers}
                onCheckedChange={(value) => set('include_teachers', value)}
                aria-label='Also their teachers'
              />
              Also send to their teachers
            </label>
          )}
          <div
            role='status'
            className='grid gap-1 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm sm:col-span-2'
          >
            {!audienceInput ? (
              <span className='text-muted-foreground'>Choose who gets it to see the count.</span>
            ) : !count ? (
              <span className='text-muted-foreground'>Counting…</span>
            ) : (
              <>
                <span className='flex items-center gap-1.5 font-semibold'>
                  <UsersRound className='size-4' />
                  Goes to {count.recipients} people: {count.parents} parents, {count.staff} staff
                </span>
                <span className='flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground'>
                  <span className='flex items-center gap-1'>
                    <Smartphone className='size-3.5' />
                    {count.with_app} in the app
                  </span>
                  <span className='flex items-center gap-1'>
                    <MessageSquareText className='size-3.5' />
                    {count.with_mobile} by SMS ({count.sms_only} SMS only)
                  </span>
                  {count.unreachable > 0 && (
                    <span className='text-destructive'>{count.unreachable} cannot be reached</span>
                  )}
                </span>
              </>
            )}
          </div>
        </form>
      </AppModal>
      <ConfirmDialog
        open={confirming}
        onOpenChange={(open) => !open && setConfirming(false)}
        title={
          draft.later
            ? `Schedule for ${count?.recipients ?? ''} people?`
            : `Send to ${count?.recipients ?? ''} people now?`
        }
        description={`"${draft.title.trim()}" goes out ${draft.later ? 'at the chosen time' : 'at once'}${channels.length ? ` by ${channels.map((channel) => (channel === 'sms' ? 'SMS' : 'push')).join(' and ')}` : ''} and in the app${draft.expires ? `, and leaves the screen after ${draft.expiry_value} ${draft.expiry_unit}` : ''}. A whole-school or SMS message from someone who cannot approve waits for the principal. It cannot be edited after sending.`}
        confirmText={draft.later ? 'Schedule' : 'Send now'}
        destructive
        loading={send.isPending}
        onConfirm={() => void submit()}
      />
    </>
  )
}
