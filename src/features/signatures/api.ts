import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api/client'

export type SignatureOwner = 'staff' | 'guardians'
export type SignatureAction = 'added' | 'changed' | 'removed'

export interface SignatureChange {
  id: number
  side: 'teacher' | 'parent'
  action: SignatureAction
  old_url: string | null
  new_url: string | null
  changed_by: { id: number; name: string } | null
  by_admin: boolean
  note: string | null
  at: string
  can_use_again: boolean
}

export interface SignatureDetail {
  side: 'teacher' | 'parent'
  owner: { id: number; name: string }
  signature_file_id: number | null
  signature_url: string | null
  updated_at: string | null
  history: SignatureChange[]
}

export interface SignatureSaved {
  signature_file_id: number | null
  signature_url: string | null
  parent_signature_copied: boolean
  message: string | null
}

const key = (owner: SignatureOwner, id: number) => ['signature', owner, id] as const

export const signaturesApi = {
  get: (owner: SignatureOwner, id: number) =>
    api.get<SignatureDetail>(`/admin/${owner}/${id}/signature`),
  set: (owner: SignatureOwner, id: number, signature_file_id: number | null) =>
    api.put<SignatureSaved>(`/admin/${owner}/${id}/signature`, { signature_file_id }),
  useAgain: (owner: SignatureOwner, id: number, changeId: number) =>
    api.post<SignatureSaved>(`/admin/${owner}/${id}/signature/history/${changeId}/use`),
}

export function useSignature(owner: SignatureOwner, id: number) {
  return useQuery({ queryKey: key(owner, id), queryFn: () => signaturesApi.get(owner, id) })
}

export function useSetSignature(owner: SignatureOwner, id: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (fileId: number | null) => signaturesApi.set(owner, id, fileId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: key(owner, id) }),
  })
}

export function useSignatureAgain(owner: SignatureOwner, id: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (changeId: number) => signaturesApi.useAgain(owner, id, changeId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: key(owner, id) }),
  })
}
