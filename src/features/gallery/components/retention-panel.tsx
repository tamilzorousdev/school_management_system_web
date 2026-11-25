import { useState } from 'react'
import {
  CalendarClock,
  Infinity as InfinityIcon,
  Pencil,
  Plus,
  ShieldCheck,
  Trash2,
} from 'lucide-react'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import { DataTable, type Column } from '@/components/common/data-table'
import { InsightCards } from '@/components/common/insight-cards'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { alerts } from '@/lib/alerts'
import { toApiError } from '@/lib/api/errors'
import { galleryApi, useGalleryMutation, useRetention, type RetentionPolicy } from '../api'
import { POLICY_TARGET_LABELS } from '../labels'
import { useConfirmRetry } from '../use-confirm-retry'
import { PolicyFormModal } from './policy-form-modal'

const keepLabel = (policy: {
  keep_forever: boolean
  retention_value: number | null
  retention_unit: string | null
}) =>
  policy.keep_forever
    ? 'Forever'
    : `${policy.retention_value ?? '—'} ${policy.retention_unit ?? ''}`

export function RetentionPanel({ canConfigure }: { canConfigure: boolean }) {
  const retention = useRetention()
  const remove = useGalleryMutation(galleryApi.removePolicy)
  const retry = useConfirmRetry()
  const [editing, setEditing] = useState<RetentionPolicy | 'new' | null>(null)
  const [deleting, setDeleting] = useState<RetentionPolicy | null>(null)
  const data = retention.data
  const rows = data?.policies ?? []

  const columns: Column<RetentionPolicy>[] = [
    {
      key: 'name',
      header: 'Policy',
      cell: (policy) => (
        <div className='grid'>
          <span className='font-bold'>{policy.name}</span>
          <span className='text-xs text-muted-foreground'>{policy.applies_to}</span>
        </div>
      ),
    },
    {
      key: 'target',
      header: 'Covers',
      hideBelow: 'lg',
      cell: (policy) => POLICY_TARGET_LABELS[policy.target],
    },
    {
      key: 'keep',
      header: 'Keep for',
      cell: (policy) => <span className='font-semibold'>{keepLabel(policy)}</span>,
    },
    {
      key: 'media',
      header: 'Media',
      cell: (policy) => <span className='tabular'>{policy.media_count}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      cell: (policy) =>
        policy.is_active ? (
          <Badge tone='success' dot>
            Active
          </Badge>
        ) : (
          <Badge dot>Inactive</Badge>
        ),
    },
    {
      key: 'actions',
      header: <span className='sr-only'>Actions</span>,
      align: 'right',
      cell: (policy) =>
        canConfigure && (
          <div className='inline-flex gap-1'>
            <Button
              variant='ghost'
              size='icon-sm'
              aria-label={`Edit ${policy.name}`}
              onClick={(event) => {
                event.stopPropagation()
                setEditing(policy)
              }}
            >
              <Pencil />
            </Button>
            <Button
              variant='ghost'
              size='icon-sm'
              aria-label={`Delete ${policy.name}`}
              className='text-destructive hover:bg-destructive/10'
              onClick={(event) => {
                event.stopPropagation()
                setDeleting(policy)
              }}
            >
              <Trash2 />
            </Button>
          </div>
        ),
    },
  ]

  return (
    <div className='grid gap-4'>
      <InsightCards
        loading={retention.isPending}
        items={[
          {
            key: 'default',
            label: 'Default retention',
            value: data ? `${data.default_value} ${data.default_unit}` : '—',
            hint: 'Change it in Settings',
            icon: CalendarClock,
            tone: 'primary',
          },
          {
            key: 'default-media',
            label: 'On the default',
            value: data?.default_media_count ?? 0,
            hint: 'Photos and videos',
            icon: ShieldCheck,
            tone: 'neutral',
          },
          {
            key: 'forever',
            label: 'Kept forever',
            value: data?.kept_forever ?? 0,
            hint: 'By a keep-forever policy',
            icon: InfinityIcon,
            tone: 'success',
          },
          {
            key: 'policies',
            label: 'Policies',
            value: rows.length,
            hint: `${rows.filter((policy) => policy.is_active).length} active`,
            icon: Pencil,
            tone: 'info',
          },
        ]}
      />
      <Card className='overflow-hidden'>
        <CardHeader className='pb-4'>
          <div className='grid gap-0.5'>
            <CardTitle>Retention policies</CardTitle>
            <CardDescription>
              Keep some media longer or shorter than the default. The most specific policy wins.
            </CardDescription>
          </div>
          {canConfigure && (
            <Button size='sm' onClick={() => setEditing('new')}>
              <Plus />
              Add policy
            </Button>
          )}
        </CardHeader>
        <DataTable
          rows={rows}
          columns={columns}
          rowKey={(policy) => policy.id}
          loading={retention.isFetching}
          error={retention.isError ? retention.error.message : null}
          onRetry={() => retention.refetch()}
          onRowClick={canConfigure ? (policy) => setEditing(policy) : undefined}
          empty={{
            icon: CalendarClock,
            title: 'No policies yet',
            description: 'Every photo and video follows the default retention.',
          }}
          card={(policy) => (
            <div className='grid gap-1'>
              <div className='flex items-start justify-between gap-2'>
                <span className='font-bold'>{policy.name}</span>
                {policy.is_active ? <Badge tone='success'>Active</Badge> : <Badge>Inactive</Badge>}
              </div>
              <span className='text-xs text-muted-foreground'>{policy.applies_to}</span>
              <span className='text-xs'>
                Keep for {keepLabel(policy)} · {policy.media_count} media
              </span>
            </div>
          )}
        />
      </Card>
      <PolicyFormModal policy={editing} onClose={() => setEditing(null)} />
      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={`Delete ${deleting?.name ?? 'policy'}?`}
        description='Its media go back to the next matching policy or the default retention.'
        confirmText='Delete policy'
        destructive
        loading={remove.isPending}
        onConfirm={async () => {
          if (!deleting) return
          const id = deleting.id
          const done = () => {
            alerts.success('Retention policy removed')
            setDeleting(null)
          }
          try {
            const finished = await retry.attempt(
              () => remove.mutateAsync({ id }),
              () => remove.mutateAsync({ id, confirm: true }),
              done
            )
            if (!finished) setDeleting(null)
          } catch (error) {
            alerts.error(toApiError(error).message)
          }
        }}
      />
      <ConfirmDialog
        {...retry.dialog}
        title='Delete the policy anyway?'
        confirmText='Delete policy'
        destructive
      />
    </div>
  )
}
