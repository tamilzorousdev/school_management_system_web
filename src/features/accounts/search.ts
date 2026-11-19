import { z } from 'zod'
import type { AccountKind } from './api'

const date = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .optional()
  .catch(undefined)

export const ACCOUNT_TABS = ['expenses', 'income', 'reports', 'categories'] as const
export type AccountTab = (typeof ACCOUNT_TABS)[number]

export const accountsSearchSchema = z.object({
  tab: z.enum(ACCOUNT_TABS).catch('expenses'),
  page: z.coerce.number().int().min(1).catch(1),
  search: z.string().trim().max(100).optional().catch(undefined),
  status: z.enum(['pending', 'approved', 'rejected', 'void']).optional().catch(undefined),
  category_id: z.coerce.number().int().min(1).optional().catch(undefined),
  payment_mode: z
    .enum(['cash', 'upi', 'card', 'bank_transfer', 'cheque'])
    .optional()
    .catch(undefined),
  report: z.enum(['monthly', 'categories', 'register']).optional().catch(undefined),
  kind: z.enum(['expense', 'income']).optional().catch(undefined),
  from: date,
  to: date,
  sort: z.enum(['entry_date', 'amount', 'entry_no']).optional().catch(undefined),
  order: z.enum(['asc', 'desc']).optional().catch(undefined),
})

export type AccountsSearch = z.infer<typeof accountsSearchSchema>

export const tabKind = (tab: AccountTab): AccountKind | null =>
  tab === 'expenses' ? 'expense' : tab === 'income' ? 'income' : null

export interface AccountsTabProps {
  search: AccountsSearch
  setSearch: (patch: Partial<AccountsSearch>) => void
  onPageChange: (page: number) => void
  onClear: () => void
  canManage: boolean
  canApprove: boolean
  adding: boolean
  onAddingChange: (open: boolean) => void
}
