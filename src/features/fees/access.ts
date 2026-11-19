import { can, type Me } from '@/features/auth/api'

export interface FeeAccess {
  view: boolean
  configure: boolean
  assign: boolean
  collect: boolean
  adjust: boolean
  audit: boolean
  approve: boolean
  fine: boolean
}

export function feeAccess(me: Me | undefined): FeeAccess {
  return {
    view: can(me, 'fees.view'),
    configure: can(me, 'fees.configure'),
    assign: can(me, 'fees.assign'),
    collect: can(me, 'fees.collect'),
    adjust: can(me, 'fees.adjust'),
    audit: can(me, 'fees.audit'),
    approve: can(me, 'fees.approve'),
    fine: can(me, 'fees.fine'),
  }
}
