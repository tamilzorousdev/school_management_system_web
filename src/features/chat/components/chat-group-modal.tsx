import { useState } from 'react'
import { Check, Search, X } from 'lucide-react'
import { AppModal } from '@/components/common/app-modal'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { alerts } from '@/lib/alerts'
import { toApiError } from '@/lib/api/errors'
import { useAddGroupMembers, useChatDirectory, useCreateGroup, type ChatDirectoryUser } from '../api'

interface ChatGroupModalProps {
  open: boolean
  onClose: () => void
  onCreated: (threadId: number) => void
}

export function ChatGroupModal({ open, onClose, onCreated }: ChatGroupModalProps) {
  const [name, setName] = useState('')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<ChatDirectoryUser[]>([])
  const directory = useChatDirectory(search)
  const createGroup = useCreateGroup()

  const reset = () => {
    setName('')
    setSearch('')
    setSelected([])
  }

  const toggleUser = (user: ChatDirectoryUser) => {
    if (selected.some((u) => u.id === user.id)) {
      setSelected((prev) => prev.filter((u) => u.id !== user.id))
    } else {
      setSelected((prev) => [...prev, user])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      alerts.error('Please enter a group name')
      return
    }
    try {
      const thread = await createGroup.mutateAsync({
        name: name.trim(),
        member_user_ids: selected.map((u) => u.id),
      })
      alerts.success('Group chat created')
      reset()
      onClose()
      onCreated(thread.id)
    } catch (error) {
      alerts.error(toApiError(error).message)
    }
  }

  const users = directory.data ?? []

  return (
    <AppModal
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          reset()
          onClose()
        }
      }}
      title='Create group chat'
      description='Start a group conversation with teachers and parents.'
      formId='create-group-form'
      submitText='Create group'
      loading={createGroup.isPending}
    >
      <form id='create-group-form' onSubmit={handleSubmit} className='grid gap-4 py-2'>
        <div className='grid gap-1.5'>
          <label className='text-sm font-medium'>Group name</label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder='e.g. Grade 6 Parents & Teachers'
            maxLength={120}
            autoFocus
          />
        </div>

        <div className='grid gap-1.5'>
          <label className='text-sm font-medium'>
            Add members {selected.length > 0 && `(${selected.length} selected)`}
          </label>
          {selected.length > 0 && (
            <div className='flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1.5 rounded-md border bg-muted/30'>
              {selected.map((user) => (
                <Badge key={user.id} tone='info' className='flex items-center gap-1 text-xs'>
                  <span>{user.name}</span>
                  <button
                    type='button'
                    onClick={() => toggleUser(user)}
                    className='rounded hover:bg-primary/20 p-0.5'
                  >
                    <X className='size-3' />
                  </button>
                </Badge>
              ))}
            </div>
          )}

          <div className='relative'>
            <Search className='absolute left-2.5 top-2.5 size-4 text-muted-foreground' />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder='Search teachers or parents...'
              className='pl-8'
            />
          </div>

          <div className='max-h-48 overflow-y-auto rounded-md border divide-y'>
            {directory.isLoading ? (
              <div className='p-3 text-center text-xs text-muted-foreground'>Loading directory...</div>
            ) : users.length === 0 ? (
              <div className='p-3 text-center text-xs text-muted-foreground'>No users found</div>
            ) : (
              users.map((user) => {
                const isSelected = selected.some((u) => u.id === user.id)
                return (
                  <button
                    key={user.id}
                    type='button'
                    onClick={() => toggleUser(user)}
                    className='w-full flex items-center justify-between p-2.5 text-left text-sm hover:bg-muted/50 transition-colors'
                  >
                    <div className='grid min-w-0'>
                      <span className='font-medium'>{user.name}</span>
                      <span className='text-xs text-muted-foreground capitalize'>
                        {user.label || user.role}
                      </span>
                    </div>
                    <div
                      className={`grid size-5 place-items-center rounded border ${
                        isSelected ? 'bg-primary border-primary text-primary-foreground' : 'border-input'
                      }`}
                    >
                      {isSelected && <Check className='size-3.5' />}
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </div>
      </form>
    </AppModal>
  )
}

interface AddGroupMembersModalProps {
  open: boolean
  threadId: number | null
  existingMemberUserIds: number[]
  onClose: () => void
}

export function AddGroupMembersModal({
  open,
  threadId,
  existingMemberUserIds,
  onClose,
}: AddGroupMembersModalProps) {
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<ChatDirectoryUser[]>([])
  const directory = useChatDirectory(search)
  const addMembers = useAddGroupMembers()

  const reset = () => {
    setSearch('')
    setSelected([])
  }

  const toggleUser = (user: ChatDirectoryUser) => {
    if (selected.some((u) => u.id === user.id)) {
      setSelected((prev) => prev.filter((u) => u.id !== user.id))
    } else {
      setSelected((prev) => [...prev, user])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!threadId || selected.length === 0) return
    try {
      await addMembers.mutateAsync({
        threadId,
        userIds: selected.map((u) => u.id),
      })
      alerts.success('Members added to group')
      reset()
      onClose()
    } catch (error) {
      alerts.error(toApiError(error).message)
    }
  }

  const availableUsers = (directory.data ?? []).filter(
    (u) => !existingMemberUserIds.includes(u.id)
  )

  return (
    <AppModal
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          reset()
          onClose()
        }
      }}
      title='Add members'
      description='Select teachers or parents to add to this group.'
      formId='add-members-form'
      submitText='Add selected'
      loading={addMembers.isPending}
    >
      <form id='add-members-form' onSubmit={handleSubmit} className='grid gap-4 py-2'>
        {selected.length > 0 && (
          <div className='flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1.5 rounded-md border bg-muted/30'>
            {selected.map((user) => (
              <Badge key={user.id} tone='info' className='flex items-center gap-1 text-xs'>
                <span>{user.name}</span>
                <button
                  type='button'
                  onClick={() => toggleUser(user)}
                  className='rounded hover:bg-primary/20 p-0.5'
                >
                  <X className='size-3' />
                </button>
              </Badge>
            ))}
          </div>
        )}

        <div className='relative'>
          <Search className='absolute left-2.5 top-2.5 size-4 text-muted-foreground' />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder='Search teachers or parents...'
            className='pl-8'
          />
        </div>

        <div className='max-h-48 overflow-y-auto rounded-md border divide-y'>
          {directory.isLoading ? (
            <div className='p-3 text-center text-xs text-muted-foreground'>Loading directory...</div>
          ) : availableUsers.length === 0 ? (
            <div className='p-3 text-center text-xs text-muted-foreground'>No users to add</div>
          ) : (
            availableUsers.map((user) => {
              const isSelected = selected.some((u) => u.id === user.id)
              return (
                <button
                  key={user.id}
                  type='button'
                  onClick={() => toggleUser(user)}
                  className='w-full flex items-center justify-between p-2.5 text-left text-sm hover:bg-muted/50 transition-colors'
                >
                  <div className='grid min-w-0'>
                    <span className='font-medium'>{user.name}</span>
                    <span className='text-xs text-muted-foreground capitalize'>
                      {user.label || user.role}
                    </span>
                  </div>
                  <div
                    className={`grid size-5 place-items-center rounded border ${
                      isSelected ? 'bg-primary border-primary text-primary-foreground' : 'border-input'
                    }`}
                  >
                    {isSelected && <Check className='size-3.5' />}
                  </div>
                </button>
              )
            })
          )}
        </div>
      </form>
    </AppModal>
  )
}
