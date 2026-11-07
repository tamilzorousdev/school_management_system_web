import type { GuardianInput } from './api'

export interface GuardianDraft extends GuardianInput {
  key: string
}

export const emptyGuardian = (relation: GuardianInput['relation'] = 'father'): GuardianDraft => ({
  key: Math.random().toString(36).slice(2),
  name: '',
  mobile: '',
  relation,
  occupation: '',
  qualification: '',
  email: '',
  language: 'en',
  receives_alerts: true,
  can_pickup: true,
})
