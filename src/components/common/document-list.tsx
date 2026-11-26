import { useRef, useState } from 'react'
import {
  CheckCircle2,
  EyeOff,
  FileText,
  ImageIcon,
  Paperclip,
  Plus,
  Trash,
  Upload,
  XCircle,
} from 'lucide-react'
import { AppModal } from '@/components/common/app-modal'
import { Combobox } from '@/components/common/combobox'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import { EmptyState } from '@/components/common/display'
import { FormField } from '@/components/common/form-field'
import { Badge, type BadgeTone } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { alerts } from '@/lib/alerts'
import { toApiError } from '@/lib/api/errors'
import { formatDate } from '@/lib/format'
import { filesApi, formatBytes, type UploadedFile } from '@/lib/files'
import { cn } from '@/lib/utils'

export type VerificationStatus = 'pending' | 'verified' | 'rejected'

export interface VerifiableDoc {
  id: number
  type: string
  title: string
  number?: string | null
  expiry_date?: string | null
  current?: boolean
  status: VerificationStatus
  remarks: string | null
  visible_to_parent?: boolean
  verified_by: { id: number; name: string } | null
  verified_at: string | null
  file: UploadedFile | null
  created_at: string
}

export interface NewDocument {
  type: string
  title: string
  file_id: number
  visible_to_parent?: boolean
  number?: string | null
  expiry_date?: string | null
}

export interface ExpiryFields {
  numberLabel: string
  noExpiryTypes: string[]
}

const STATUS: Record<VerificationStatus, { label: string; tone: BadgeTone }> = {
  pending: { label: 'To check', tone: 'warning' },
  verified: { label: 'Verified', tone: 'success' },
  rejected: { label: 'Rejected', tone: 'danger' },
}

interface DocumentListProps {
  documents: VerifiableDoc[]
  types: Record<string, string>
  canManage: boolean
  purpose: string
  parentVisibility?: boolean
  expiry?: ExpiryFields
  onAdd: (input: NewDocument) => Promise<unknown>
  onVerify: (
    id: number,
    status: 'verified' | 'rejected',
    remarks: string | null
  ) => Promise<unknown>
  onDelete: (id: number) => Promise<unknown>
}

export function DocumentList({
  documents,
  types,
  canManage,
  purpose,
  parentVisibility,
  expiry,
  onAdd,
  onVerify,
  onDelete,
}: DocumentListProps) {
  const [adding, setAdding] = useState(false)
  const [rejecting, setRejecting] = useState<VerifiableDoc | null>(null)
  const [removing, setRemoving] = useState<VerifiableDoc | null>(null)
  const [busy, setBusy] = useState<number | null>(null)
  const pending = documents.filter((document) => document.status === 'pending').length

  const verify = async (document: VerifiableDoc) => {
    setBusy(document.id)
    try {
      await onVerify(document.id, 'verified', null)
      alerts.success(`${document.title} verified`)
    } catch (error) {
      alerts.error(toApiError(error).message)
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className='grid gap-3'>
      <div className='flex flex-wrap items-center justify-between gap-2'>
        <p className='text-sm text-muted-foreground'>
          {documents.length
            ? `${documents.length} ${documents.length === 1 ? 'document' : 'documents'}${pending ? ` · ${pending} to check` : ''}`
            : 'No documents yet'}
        </p>
        {canManage && (
          <Button size='sm' onClick={() => setAdding(true)}>
            <Plus className='size-4 stroke-[1.75]' />
            Add document
          </Button>
        )}
      </div>

      {documents.length === 0 ? (
        <EmptyState
          icon={Paperclip}
          title='No documents yet'
          description='Upload certificates and ID proofs, then mark each one verified.'
          className='border-dashed'
        />
      ) : (
        <ul className='grid gap-2'>
          {documents.map((document) => {
            const isImage = document.file?.mime_type.startsWith('image/')
            return (
              <li
                key={document.id}
                className={cn(
                  'grid gap-3 rounded-xl border p-3 sm:flex sm:items-center',
                  document.status === 'rejected' && 'border-destructive/30 bg-destructive/5'
                )}
              >
                <a
                  href={document.file?.url}
                  target='_blank'
                  rel='noreferrer'
                  className='flex min-w-0 flex-1 items-center gap-3 rounded-lg outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40'
                >
                  {isImage && document.file?.thumbnail_url ? (
                    <img
                      src={document.file.thumbnail_url}
                      alt=''
                      className='size-11 shrink-0 rounded-lg border object-cover'
                    />
                  ) : (
                    <span className='grid size-11 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary'>
                      {isImage ? <ImageIcon className='size-5' /> : <FileText className='size-5' />}
                    </span>
                  )}
                  <span className='grid min-w-0 gap-0.5'>
                    <span className='flex flex-wrap items-center gap-1.5'>
                      <span className='truncate font-semibold'>{document.title}</span>
                      <Badge tone={STATUS[document.status].tone} dot>
                        {STATUS[document.status].label}
                      </Badge>
                      {document.current === false && <Badge tone='neutral'>Older copy</Badge>}
                      {parentVisibility && document.visible_to_parent === false && (
                        <Badge tone='neutral'>
                          <EyeOff className='size-3' />
                          Staff only
                        </Badge>
                      )}
                    </span>
                    <span className='truncate text-xs text-muted-foreground'>
                      {types[document.type] ?? document.type}
                      {document.number ? ` · ${document.number}` : ''}
                      {document.expiry_date
                        ? ` · Valid till ${formatDate(document.expiry_date)}`
                        : ''}
                      {document.file ? ` · ${formatBytes(document.file.size_bytes)}` : ''} · Added{' '}
                      {formatDate(document.created_at.slice(0, 10))}
                      {document.verified_by && document.status !== 'pending'
                        ? ` · ${STATUS[document.status].label} by ${document.verified_by.name}`
                        : ''}
                    </span>
                    {document.status === 'rejected' && document.remarks && (
                      <span className='text-xs font-medium text-destructive'>
                        {document.remarks}
                      </span>
                    )}
                  </span>
                </a>
                {canManage && (
                  <div className='flex shrink-0 flex-wrap items-center gap-1.5 sm:justify-end'>
                    {document.status !== 'verified' && (
                      <Button
                        size='sm'
                        variant='secondary'
                        className='h-8 px-3 gap-1.5 border-[#C6CEC9] bg-white text-[#171B19] hover:bg-[#F9FAFB] font-medium'
                        loading={busy === document.id}
                        onClick={() => void verify(document)}
                      >
                        <CheckCircle2 className='size-3.5 stroke-[1.75] text-success' />
                        Verify
                      </Button>
                    )}
                    {document.status !== 'rejected' && (
                      <Button
                        size='sm'
                        variant='outline'
                        aria-label={`Reject ${document.title}`}
                        title='Reject'
                        className='h-8 px-3 gap-1.5 border-[#FDA29B] text-[#D92D20] bg-white hover:bg-rose-50 dark:border-rose-900 dark:bg-card dark:text-rose-400 dark:hover:bg-rose-950/50 font-medium'
                        onClick={() => setRejecting(document)}
                      >
                        <XCircle className='size-4 stroke-[1.75]' />
                        Reject
                      </Button>
                    )}
                    <Button
                      size='icon-sm'
                      variant='outline'
                      aria-label={`Delete ${document.title}`}
                      title='Delete'
                      className='size-8 border-[#FDA29B] text-[#D92D20] bg-white hover:bg-rose-50 dark:border-rose-900 dark:bg-card dark:text-rose-400 dark:hover:bg-rose-950/50'
                      onClick={() => setRemoving(document)}
                    >
                      <Trash className='size-4 stroke-[1.75]' />
                    </Button>
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}

      {adding && (
        <AddDocumentModal
          types={types}
          purpose={purpose}
          parentVisibility={parentVisibility}
          expiry={expiry}
          onClose={() => setAdding(false)}
          onAdd={onAdd}
        />
      )}
      {rejecting && (
        <RejectModal
          document={rejecting}
          onClose={() => setRejecting(null)}
          onReject={(remarks) => onVerify(rejecting.id, 'rejected', remarks)}
        />
      )}
      <ConfirmDialog
        open={Boolean(removing)}
        onOpenChange={(open) => !open && setRemoving(null)}
        title={`Delete ${removing?.title ?? ''}?`}
        description='The document is removed from this profile.'
        confirmText='Delete'
        destructive
        onConfirm={async () => {
          if (!removing) return
          try {
            await onDelete(removing.id)
            alerts.success(`${removing.title} deleted`)
          } catch (error) {
            alerts.error(toApiError(error).message)
          }
          setRemoving(null)
        }}
      />
    </div>
  )
}

export function AddDocumentModal({
  types,
  purpose,
  parentVisibility,
  expiry,
  initialType,
  onClose,
  onAdd,
}: {
  types: Record<string, string>
  purpose: string
  parentVisibility?: boolean
  expiry?: ExpiryFields
  initialType?: string
  onClose: () => void
  onAdd: (input: NewDocument) => Promise<unknown>
}) {
  const input = useRef<HTMLInputElement>(null)
  const [type, setType] = useState(initialType ?? Object.keys(types)[0])
  const [title, setTitle] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [visible, setVisible] = useState(true)
  const [number, setNumber] = useState('')
  const [validTill, setValidTill] = useState('')
  const [dateError, setDateError] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const needsDate = Boolean(expiry && !expiry.noExpiryTypes.includes(type))

  return (
    <AppModal
      open
      onOpenChange={(open) => !open && onClose()}
      title='Add document'
      description='PDF or a photo, up to 10 MB. It starts as “to check” until someone verifies it.'
      formId='document-form'
      submitText='Upload'
      loading={saving}
    >
      <form
        id='document-form'
        noValidate
        className='grid gap-4'
        onSubmit={async (event) => {
          event.preventDefault()
          const missingDate = needsDate && !validTill
          setDateError(missingDate ? 'Give the date this document is valid till' : null)
          if (!file) setError('Choose a file to upload')
          if (!file || missingDate) return
          setSaving(true)
          setError(null)
          try {
            const uploaded = await filesApi.upload(file, purpose)
            await onAdd({
              type,
              title: title.trim() || types[type],
              file_id: uploaded.id,
              ...(parentVisibility ? { visible_to_parent: visible } : {}),
              ...(expiry
                ? { number: number.trim() || null, expiry_date: needsDate ? validTill : null }
                : {}),
            })
            alerts.success('Document added')
            onClose()
          } catch (caught) {
            setError(toApiError(caught).message)
          } finally {
            setSaving(false)
          }
        }}
      >
        <FormField id='document-type' label='Type' required>
          <Combobox
            id='document-type'
            label='Document type'
            value={type}
            placeholder='Choose type'
            options={Object.entries(types).map(([value, label]) => ({ value, label }))}
            onChange={(value) => setType(value ?? Object.keys(types)[0])}
            highlightSelected={false}
            className='sm:w-full'
          />
        </FormField>
        <FormField id='document-title' label='Title' hint={`Defaults to “${types[type]}”`}>
          <Input
            id='document-title'
            value={title}
            maxLength={120}
            onChange={(event) => setTitle(event.target.value)}
          />
        </FormField>
        {expiry && (
          <div className='grid gap-4 sm:grid-cols-2'>
            <FormField id='document-number' label={expiry.numberLabel}>
              <Input
                id='document-number'
                value={number}
                maxLength={40}
                onChange={(event) => setNumber(event.target.value)}
              />
            </FormField>
            {needsDate && (
              <FormField
                id='document-valid-till'
                label='Valid till'
                required
                error={dateError ?? undefined}
              >
                <Input
                  id='document-valid-till'
                  type='date'
                  value={validTill}
                  aria-invalid={Boolean(dateError) || undefined}
                  onChange={(event) => {
                    setValidTill(event.target.value)
                    setDateError(null)
                  }}
                />
              </FormField>
            )}
          </div>
        )}
        <FormField id='document-file' label='File' required error={error ?? undefined}>
          <button
            type='button'
            onClick={() => input.current?.click()}
            className={cn(
              'flex items-center gap-3 rounded-xl border border-dashed p-4 text-left transition-colors hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/40 focus-visible:outline-none',
              error && 'border-destructive'
            )}
          >
            <span className='grid size-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary'>
              <Upload className='size-5' />
            </span>
            <span className='grid min-w-0'>
              <span className='truncate font-semibold'>{file ? file.name : 'Choose a file'}</span>
              <span className='text-xs text-muted-foreground'>
                {file ? formatBytes(file.size) : 'PDF, JPG, PNG or Word'}
              </span>
            </span>
          </button>
          <input
            ref={input}
            id='document-file'
            type='file'
            accept='application/pdf,image/jpeg,image/png,image/webp,.doc,.docx'
            className='sr-only'
            onChange={(event) => {
              setFile(event.target.files?.[0] ?? null)
              setError(null)
            }}
          />
        </FormField>
        {parentVisibility && (
          <label className='flex items-center justify-between gap-3 rounded-lg border p-3'>
            <span className='grid'>
              <span className='text-sm font-semibold'>Parents can see it</span>
              <span className='text-xs text-muted-foreground'>Shown in the Parent app</span>
            </span>
            <Switch
              checked={visible}
              onCheckedChange={setVisible}
              aria-label='Parents can see it'
            />
          </label>
        )}
      </form>
    </AppModal>
  )
}

function RejectModal({
  document,
  onClose,
  onReject,
}: {
  document: VerifiableDoc
  onClose: () => void
  onReject: (remarks: string) => Promise<unknown>
}) {
  const [remarks, setRemarks] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  return (
    <AppModal
      open
      onOpenChange={(open) => !open && onClose()}
      title={`Reject ${document.title}?`}
      description='Say what is wrong so the right copy can be uploaded.'
      formId='reject-document-form'
      submitText='Reject'
      loading={saving}
    >
      <form
        id='reject-document-form'
        noValidate
        onSubmit={async (event) => {
          event.preventDefault()
          if (!remarks.trim()) {
            setError('Give a reason')
            return
          }
          setSaving(true)
          try {
            await onReject(remarks.trim())
            alerts.success(`${document.title} rejected`)
            onClose()
          } catch (caught) {
            setError(toApiError(caught).message)
          } finally {
            setSaving(false)
          }
        }}
      >
        <FormField id='reject-reason' label='Reason' required error={error ?? undefined}>
          <Input
            id='reject-reason'
            autoFocus
            maxLength={255}
            placeholder='The copy is not readable'
            value={remarks}
            onChange={(event) => {
              setRemarks(event.target.value)
              setError(null)
            }}
          />
        </FormField>
      </form>
    </AppModal>
  )
}
