import { useState } from 'react'
import { AppModal } from '@/components/common/app-modal'
import { FormField } from '@/components/common/form-field'
import { SegmentedControl } from '@/components/common/segmented-control'
import { Skeleton } from '@/components/ui/skeleton'
import { ClassPicker } from '@/features/setup/components/class-picker'
import { alerts } from '@/lib/alerts'
import { toApiError } from '@/lib/api/errors'
import {
  performanceApi,
  usePerformanceMutation,
  useSpecialSettings,
  type SpecialSettings,
} from '../api'

export function SpecialSettingsModal({ onClose }: { onClose: () => void }) {
  const settings = useSpecialSettings()
  return settings.data ? (
    <SettingsForm settings={settings.data} onClose={onClose} />
  ) : (
    <AppModal open onOpenChange={(open) => !open && onClose()} title='Classes allowed'>
      <Skeleton className='h-32' />
    </AppModal>
  )
}

function SettingsForm({ settings, onClose }: { settings: SpecialSettings; onClose: () => void }) {
  const [all, setAll] = useState(settings.all)
  const [classIds, setClassIds] = useState(settings.classes.map((item) => item.id))
  const save = usePerformanceMutation((ids: number[] | null) => performanceApi.saveSettings(ids))

  return (
    <AppModal
      open
      onOpenChange={(open) => !open && onClose()}
      title='Classes allowed'
      description='Classes that can have a whole-class special class. Extra classes for chosen students work for every class.'
      formId='special-settings-form'
      submitText='Save'
      loading={save.isPending}
    >
      <form
        id='special-settings-form'
        noValidate
        className='grid gap-4'
        onSubmit={async (event) => {
          event.preventDefault()
          if (!all && !classIds.length) {
            alerts.error('Choose at least one class, or allow every class')
            return
          }
          try {
            await save.mutateAsync(all ? null : classIds)
            alerts.success('Special class settings saved')
            onClose()
          } catch (error) {
            alerts.error(toApiError(error).message)
          }
        }}
      >
        <FormField id='special-allowed' label='Whole-class special classes for'>
          <div className='grid gap-2.5'>
            <SegmentedControl
              label='Whole-class special classes for'
              value={all ? 'all' : 'some'}
              onChange={(value: string) => setAll(value === 'all')}
              options={[
                { value: 'all', label: 'Every class' },
                { value: 'some', label: 'Only these classes' },
              ]}
            />
            {!all && <ClassPicker id='special-allowed' value={classIds} onChange={setClassIds} />}
          </div>
        </FormField>
      </form>
    </AppModal>
  )
}
