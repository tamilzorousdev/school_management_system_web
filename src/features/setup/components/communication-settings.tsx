import { useState, type FormEvent } from 'react'
import { Save } from 'lucide-react'
import { Combobox } from '@/components/common/combobox'
import { ErrorState } from '@/components/common/display'
import { FormField } from '@/components/common/form-field'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { alerts } from '@/lib/alerts'
import {
  setupApi,
  useSchoolProfile,
  useSetupMutation,
  type ChatDeleteWindow,
  type SchoolProfile,
} from '../api'
import { fieldErrorsOf } from '../form-actions'
import { RootError, Section } from './setup-shared'

const CHAT_DELETE_WINDOW_OPTIONS = [
  { value: '1_hour', label: '1 hour' },
  { value: '24_hours', label: '24 hours (default)' },
  { value: 'anytime', label: 'Anytime' },
]

export function CommunicationTab({ canManage }: { canManage: boolean }) {
  const profile = useSchoolProfile()
  if (profile.isError)
    return <ErrorState message={profile.error.message} onRetry={() => profile.refetch()} />
  if (!profile.data) return <Skeleton className='h-96' />
  return <CommunicationSettings key={profile.data.id} school={profile.data} canManage={canManage} />
}

function CommunicationSettings({
  school,
  canManage,
}: {
  school: SchoolProfile
  canManage: boolean
}) {
  const [draft, setDraft] = useState({
    chat_office_start: school.chat_office_start ?? '08:00',
    chat_office_end: school.chat_office_end ?? '17:00',
    chat_delete_window: (school.chat_delete_window ?? '24_hours') as ChatDeleteWindow,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const save = useSetupMutation((input: Partial<SchoolProfile>) => setupApi.updateSchool(input))
  const set = (field: keyof typeof draft, value: string) => {
    setDraft((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: '', root: '' }))
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (draft.chat_office_end <= draft.chat_office_start) {
      setErrors({ chat_office_end: 'Office hours must end after they start' })
      return
    }
    try {
      await save.mutateAsync(draft)
      alerts.success('Chat settings saved')
      setErrors({})
    } catch (error) {
      setErrors(fieldErrorsOf(error))
    }
  }

  return (
    <form noValidate onSubmit={submit} className='grid gap-4'>
      <RootError message={errors.root} />
      <Section
        title='Chat office hours'
        description='When parent messages reach teachers. Messages sent outside these hours are saved and delivered when the hours start.'
      >
        <div className='grid gap-4 sm:grid-cols-2'>
          <FormField
            id='chat-office-start'
            label='Starts at'
            error={errors.chat_office_start}
            hint='Monday to Saturday, not on holidays'
          >
            <Input
              id='chat-office-start'
              type='time'
              value={draft.chat_office_start}
              disabled={!canManage}
              onChange={(event) => set('chat_office_start', event.target.value)}
            />
          </FormField>
          <FormField
            id='chat-office-end'
            label='Ends at'
            error={errors.chat_office_end}
            hint='Teachers can reply at any time'
          >
            <Input
              id='chat-office-end'
              type='time'
              value={draft.chat_office_end}
              disabled={!canManage}
              onChange={(event) => set('chat_office_end', event.target.value)}
            />
          </FormField>
        </div>
      </Section>

      <Section
        title='Message deletion for everyone'
        description='Configure how long senders (parents and staff) have to delete a message for everyone in chat threads.'
      >
        <div className='max-w-md'>
          <FormField
            id='chat-delete-window'
            label='Allowed deletion window'
            error={errors.chat_delete_window}
            hint='After this window, messages can only be deleted for oneself.'
          >
            <Combobox
              id='chat-delete-window'
              label='Deletion window'
              value={draft.chat_delete_window}
              placeholder='Select deletion window'
              options={CHAT_DELETE_WINDOW_OPTIONS}
              onChange={(value) =>
                canManage && value && set('chat_delete_window', value as ChatDeleteWindow)
              }
              highlightSelected={false}
              className='sm:w-full'
            />
          </FormField>
        </div>
      </Section>

      {canManage && (
        <div className='flex justify-end'>
          <Button type='submit' loading={save.isPending}>
            <Save />
            Save settings
          </Button>
        </div>
      )}
    </form>
  )
}
