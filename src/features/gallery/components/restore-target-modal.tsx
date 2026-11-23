import { useState } from 'react'
import { AppModal } from '@/components/common/app-modal'
import { FormField } from '@/components/common/form-field'
import { Button } from '@/components/ui/button'
import { DialogFooter } from '@/components/ui/dialog'
import { AlbumPicker } from './pickers'

export function RestoreTargetModal({
  count,
  loading,
  onCancel,
  onConfirm,
}: {
  count: number
  loading: boolean
  onCancel: () => void
  onConfirm: (albumId: number) => void
}) {
  const [albumId, setAlbumId] = useState<number | undefined>()
  const [error, setError] = useState('')
  return (
    <AppModal
      open={count > 0}
      onOpenChange={(open) => !open && onCancel()}
      title='Choose an album'
      description={`The album of ${count} ${count === 1 ? 'item is' : 'items are'} gone or still in Trash. Pick an album to restore ${count === 1 ? 'it' : 'them'} into.`}
      loading={loading}
      footer={
        <DialogFooter>
          <Button variant='outline' onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
          <Button
            loading={loading}
            onClick={() => {
              if (!albumId) {
                setError('Choose an album')
                return
              }
              onConfirm(albumId)
            }}
          >
            Restore here
          </Button>
        </DialogFooter>
      }
    >
      <FormField id='restore-album' label='Album' required error={error}>
        <AlbumPicker
          id='restore-album'
          label='Album'
          value={albumId}
          invalid={Boolean(error)}
          onChange={(next) => {
            setAlbumId(next)
            setError('')
          }}
        />
      </FormField>
    </AppModal>
  )
}
