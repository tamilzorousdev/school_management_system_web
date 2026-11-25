import { useState } from 'react'
import { Plus, Sofa, Trash2 } from 'lucide-react'
import { Combobox } from '@/components/common/combobox'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import { ErrorState } from '@/components/common/display'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { can, useMe } from '@/features/auth/api'
import { alerts } from '@/lib/alerts'
import { useHostelMutation } from '../api'
import { roomsApi, useRoomAssets, type AssetCondition, type RoomAsset } from '../api-rooms'
import { toneOptions } from '../labels'
import { ASSET_CONDITION } from './asset-labels'
import { AddAssetModal, type AssetRoom } from './asset-modals'

export function RoomAssetsSection({ room }: { room: AssetRoom }) {
  const me = useMe().data
  const canEdit = can(me, 'hostel.inventory')
  const assets = useRoomAssets(room.id)
  const [adding, setAdding] = useState(false)
  const [removing, setRemoving] = useState<RoomAsset | null>(null)
  const remove = useHostelMutation((id: number) => roomsApi.removeAsset(id), false)
  const rows = assets.data ?? []

  return (
    <div className='grid gap-2'>
      <div className='flex items-center justify-between gap-2'>
        <h3 className='text-sm font-bold'>Furniture &amp; fittings</h3>
        {canEdit && (
          <Button size='sm' variant='outline' onClick={() => setAdding(true)}>
            <Plus />
            Add item
          </Button>
        )}
      </div>
      {assets.isError && !assets.data ? (
        <ErrorState message={assets.error.message} onRetry={() => assets.refetch()} />
      ) : assets.isPending ? (
        <Skeleton className='h-24' />
      ) : rows.length ? (
        <ul className='divide-y rounded-lg border'>
          {rows.map((asset) => (
            <AssetRow
              key={asset.id}
              asset={asset}
              canEdit={canEdit}
              onRemove={() => setRemoving(asset)}
            />
          ))}
        </ul>
      ) : (
        <p className='flex items-center gap-2 rounded-lg border border-dashed p-3 text-sm text-muted-foreground'>
          <Sofa className='size-4 shrink-0' />
          No furniture recorded for this room.
        </p>
      )}

      {adding && <AddAssetModal room={room} onClose={() => setAdding(false)} />}
      <ConfirmDialog
        open={Boolean(removing)}
        onOpenChange={(open) => !open && setRemoving(null)}
        title={removing ? `Remove ${removing.item_name}?` : 'Remove item?'}
        description='The item is taken off this room’s list.'
        confirmText='Remove'
        destructive
        loading={remove.isPending}
        onConfirm={() =>
          removing &&
          remove.mutate(removing.id, {
            onSuccess: () => {
              alerts.success(`${removing.item_name} removed`)
              setRemoving(null)
            },
            onError: () => setRemoving(null),
          })
        }
      />
    </div>
  )
}

function AssetRow({
  asset,
  canEdit,
  onRemove,
}: {
  asset: RoomAsset
  canEdit: boolean
  onRemove: () => void
}) {
  const update = useHostelMutation(
    (condition: AssetCondition) => roomsApi.updateAsset(asset.id, { condition }),
    false
  )
  const condition = ASSET_CONDITION[asset.condition]

  return (
    <li className='flex flex-wrap items-center justify-between gap-2 px-3 py-2.5'>
      <div className='grid min-w-0'>
        <span className='truncate text-sm font-medium'>
          {asset.item_name}
          <span className='text-muted-foreground'> × {asset.quantity}</span>
        </span>
        {(asset.asset_tag || asset.notes) && (
          <span className='truncate text-xs text-muted-foreground'>
            {[asset.asset_tag, asset.notes].filter(Boolean).join(' · ')}
          </span>
        )}
      </div>
      {canEdit ? (
        <div className='flex items-center gap-1'>
          <Combobox
            id={`room-asset-${asset.id}`}
            label={`Condition of ${asset.item_name}`}
            value={asset.condition}
            placeholder='Condition'
            options={toneOptions(ASSET_CONDITION)}
            highlightSelected={false}
            className='w-32 sm:w-32'
            onChange={(value) =>
              value &&
              value !== asset.condition &&
              update.mutate(value as AssetCondition, {
                onSuccess: () =>
                  alerts.success(
                    `${asset.item_name}: ${ASSET_CONDITION[value as AssetCondition].label}`
                  ),
              })
            }
          />
          <Button
            variant='ghost'
            size='icon-sm'
            aria-label={`Remove ${asset.item_name}`}
            onClick={onRemove}
          >
            <Trash2 />
          </Button>
        </div>
      ) : (
        <Badge tone={condition.tone} dot>
          {condition.label}
        </Badge>
      )}
    </li>
  )
}
