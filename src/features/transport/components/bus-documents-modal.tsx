import { AppModal } from '@/components/common/app-modal'
import { ErrorState } from '@/components/common/display'
import { DocumentList } from '@/components/common/document-list'
import { Skeleton } from '@/components/ui/skeleton'
import { transportApi, useBusDocuments, useTransportMutation, type Bus } from '../api'
import { BUS_DOCUMENT_TYPES } from '../labels'
import { ExpiryBadges } from './expiry-badges'

export function BusDocumentsModal({
  bus,
  canManage,
  onClose,
}: {
  bus: Bus
  canManage: boolean
  onClose: () => void
}) {
  const documents = useBusDocuments(bus.id)
  const add = useTransportMutation((input: Parameters<typeof transportApi.addBusDocument>[1]) =>
    transportApi.addBusDocument(bus.id, input)
  )
  const verify = useTransportMutation(
    (input: { id: number; status: 'verified' | 'rejected'; remarks: string | null }) =>
      transportApi.verifyBusDocument(bus.id, input.id, input.status, input.remarks)
  )
  const remove = useTransportMutation((id: number) => transportApi.removeBusDocument(bus.id, id))

  return (
    <AppModal
      open
      onOpenChange={(open) => !open && onClose()}
      title={`${bus.registration_no} documents`}
      description='Upload the renewed copy with its valid-till date: the bus date, the alerts and road-worthiness update at once. Older copies stay as history.'
      size='lg'
    >
      <div className='grid gap-4'>
        <ExpiryBadges items={bus.expiries} />
        {documents.isError && !documents.data ? (
          <ErrorState message={documents.error.message} onRetry={() => documents.refetch()} />
        ) : !documents.data ? (
          <Skeleton className='h-40' />
        ) : (
          <DocumentList
            documents={documents.data}
            types={BUS_DOCUMENT_TYPES}
            canManage={canManage}
            purpose='vehicle_document'
            expiry={{
              numberLabel: 'Policy, permit or certificate number',
              noExpiryTypes: ['other'],
            }}
            onAdd={add.mutateAsync}
            onVerify={(id, status, remarks) => verify.mutateAsync({ id, status, remarks })}
            onDelete={remove.mutateAsync}
          />
        )}
      </div>
    </AppModal>
  )
}
