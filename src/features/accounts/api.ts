import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, type Paginated } from '@/lib/api/client'
import type { FeeReport } from '@/features/fees/api'

export type AccountKind = 'expense' | 'income'
export type AccountPaymentMode = 'cash' | 'upi' | 'card' | 'bank_transfer' | 'cheque'
export type EntryStatus = 'pending' | 'approved' | 'rejected' | 'void'
export type AccountReportType = 'monthly' | 'categories' | 'register'

export interface AccountCategory {
  id: number
  kind: AccountKind
  name: string
  is_active: boolean
  entries: number
}

export interface PersonRef {
  id: number
  name: string
}

export interface StoredFile {
  id: number
  name: string
}

export interface AccountEntry {
  id: number
  kind: AccountKind
  entry_no: string
  category: { id: number; name: string }
  entry_date: string
  amount: number
  payment_mode: AccountPaymentMode
  party: string | null
  reference: string | null
  file: StoredFile | null
  note: string | null
  status: EntryStatus
  created_by: PersonRef | null
  created_at: string
  decided_by: PersonRef | null
  decided_at: string | null
  decision_note: string | null
  can_edit: boolean
}

export interface EntryListParams {
  page: number
  limit: number
  kind?: AccountKind
  status?: EntryStatus
  category_id?: number
  payment_mode?: AccountPaymentMode
  from?: string
  to?: string
  search?: string
  sort?: string
  order?: 'asc' | 'desc'
}

export interface EntryInput {
  kind?: AccountKind
  category_id?: number
  entry_date?: string
  amount?: number
  payment_mode?: AccountPaymentMode
  party?: string | null
  reference?: string | null
  file_id?: number | null
  note?: string | null
}

export interface CategoryAmount {
  category: string
  amount: number
}

export interface AccountInsights {
  month_start: string
  income_this_month: number
  expense_this_month: number
  pending: number
  pending_amount: number
  pending_expense: number
  pending_income: number
  expense_by_category: CategoryAmount[]
  income_by_category: CategoryAmount[]
}

export interface AccountReportParams {
  from?: string
  to?: string
  kind?: AccountKind
}

const base = '/admin/accounts'

export const accountKeys = {
  all: ['accounts'] as const,
  categories: (kind?: AccountKind, includeInactive?: boolean) =>
    [...accountKeys.all, 'categories', kind ?? 'all', Boolean(includeInactive)] as const,
  entries: (params: EntryListParams) => [...accountKeys.all, 'entries', params] as const,
  insights: () => [...accountKeys.all, 'insights'] as const,
  report: (type: AccountReportType, params: AccountReportParams) =>
    [...accountKeys.all, 'report', type, params] as const,
}

export const voucherUrl = (id: number) => `${base}/entries/${id}/voucher`
export const reportFileUrl = (type: AccountReportType) => `${base}/reports/${type}/xlsx`

export const accountsApi = {
  categories: (kind?: AccountKind, includeInactive?: boolean) =>
    api.get<AccountCategory[]>(`${base}/categories`, {
      kind,
      include_inactive: includeInactive || undefined,
    }),
  createCategory: (input: { kind: AccountKind; name: string }) =>
    api.post<AccountCategory>(`${base}/categories`, input),
  updateCategory: (id: number, input: { name?: string; is_active?: boolean }) =>
    api.patch<AccountCategory>(`${base}/categories/${id}`, input),
  removeCategory: (id: number) => api.delete<null>(`${base}/categories/${id}`),
  entries: (params: EntryListParams) =>
    api.get<Paginated<AccountEntry>>(`${base}/entries`, { ...params }),
  insights: () => api.get<AccountInsights>(`${base}/entries/insights`),
  create: (input: EntryInput) => api.post<AccountEntry>(`${base}/entries`, input),
  update: (id: number, input: EntryInput) =>
    api.patch<AccountEntry>(`${base}/entries/${id}`, input),
  remove: (id: number) => api.delete<null>(`${base}/entries/${id}`),
  approve: (id: number, note?: string) =>
    api.post<AccountEntry>(`${base}/entries/${id}/approve`, { note: note || undefined }),
  reject: (id: number, note?: string) =>
    api.post<AccountEntry>(`${base}/entries/${id}/reject`, { note: note || undefined }),
  void: (id: number, reason: string) =>
    api.post<AccountEntry>(`${base}/entries/${id}/void`, { reason }),
  report: (type: AccountReportType, params: AccountReportParams) =>
    api.get<FeeReport>(`${base}/reports/${type}`, { ...params }),
}

export function useAccountCategories(kind?: AccountKind, includeInactive?: boolean) {
  return useQuery({
    queryKey: accountKeys.categories(kind, includeInactive),
    queryFn: () => accountsApi.categories(kind, includeInactive),
  })
}

export function useAccountEntries(params: EntryListParams) {
  return useQuery({
    queryKey: accountKeys.entries(params),
    queryFn: () => accountsApi.entries(params),
    placeholderData: keepPreviousData,
  })
}

export function useAccountInsights(enabled = true) {
  return useQuery({ queryKey: accountKeys.insights(), queryFn: accountsApi.insights, enabled })
}

export function useAccountReport(type: AccountReportType, params: AccountReportParams) {
  return useQuery({
    queryKey: accountKeys.report(type, params),
    queryFn: () => accountsApi.report(type, params),
    placeholderData: keepPreviousData,
  })
}

export function useAccountsMutation<TInput, TResult>(fn: (input: TInput) => Promise<TResult>) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: fn,
    meta: { silent: true },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: accountKeys.all })
    },
  })
}
