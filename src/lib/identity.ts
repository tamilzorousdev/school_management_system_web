import { z } from 'zod'

export const COMMUNITIES = ['oc', 'bc', 'bcm', 'mbc', 'dnc', 'sc', 'sca', 'st'] as const
export type Community = (typeof COMMUNITIES)[number]

export const RELIGIONS = [
  'hindu',
  'muslim',
  'christian',
  'sikh',
  'jain',
  'buddhist',
  'other',
] as const
export type Religion = (typeof RELIGIONS)[number]

export const COMMUNITY_LABELS: Record<Community, string> = {
  oc: 'OC',
  bc: 'BC',
  bcm: 'BCM',
  mbc: 'MBC',
  dnc: 'DNC',
  sc: 'SC',
  sca: 'SCA',
  st: 'ST',
}

export const RELIGION_LABELS: Record<Religion, string> = {
  hindu: 'Hindu',
  muslim: 'Muslim',
  christian: 'Christian',
  sikh: 'Sikh',
  jain: 'Jain',
  buddhist: 'Buddhist',
  other: 'Other',
}

export const COMMUNITY_OPTIONS = COMMUNITIES.map((value) => ({
  value,
  label: COMMUNITY_LABELS[value],
}))

export const RELIGION_OPTIONS = RELIGIONS.map((value) => ({
  value,
  label: RELIGION_LABELS[value],
}))

export interface IdentityValues {
  community: Community | null
  caste: string | null
  religion: Religion | null
  nationality: string | null
  mother_tongue: string | null
  community_certificate_no: string | null
}

export interface IdentityDetail extends IdentityValues {
  aadhaar_masked: string | null
}

export interface IdentityInput {
  community?: Community | null
  caste?: string | null
  religion?: Religion | null
  nationality?: string | null
  mother_tongue?: string | null
  community_certificate_no?: string | null
  aadhaar_no?: string | null
}

export interface AadhaarReveal {
  aadhaar_no: string | null
}

export interface IdentityDraft {
  community: Community | ''
  caste: string
  religion: Religion | ''
  nationality: string
  mother_tongue: string
  community_certificate_no: string
  aadhaar_no: string
  remove_aadhaar: boolean
}

export const toIdentityDraft = (detail?: Partial<IdentityDetail>): IdentityDraft => ({
  community: detail?.community ?? '',
  caste: detail?.caste ?? '',
  religion: detail?.religion ?? '',
  nationality: detail?.nationality ?? '',
  mother_tongue: detail?.mother_tongue ?? '',
  community_certificate_no: detail?.community_certificate_no ?? '',
  aadhaar_no: '',
  remove_aadhaar: false,
})

const stripAadhaar = (value: string) => value.replace(/[\s-]/g, '')

const aadhaarSchema = z
  .string()
  .transform(stripAadhaar)
  .refine((value) => value === '' || /^[2-9]\d{11}$/.test(value), {
    message: 'Enter a valid 12-digit Aadhaar number',
  })

const identitySchema = z.object({
  caste: z.string().trim().max(80, 'Use 80 characters or fewer'),
  nationality: z.string().trim().max(40, 'Use 40 characters or fewer'),
  mother_tongue: z.string().trim().max(40, 'Use 40 characters or fewer'),
  community_certificate_no: z.string().trim().max(40, 'Use 40 characters or fewer'),
  aadhaar_no: aadhaarSchema,
})

export const validateIdentity = (draft: IdentityDraft): Record<string, string> => {
  const result = identitySchema.safeParse(draft)
  if (result.success) return {}
  return Object.fromEntries(
    result.error.issues.map((issue) => [String(issue.path[0]), issue.message])
  )
}

export const toIdentityInput = (draft: IdentityDraft): IdentityInput => {
  const blank = (value: string) => value.trim() || null
  const aadhaar = stripAadhaar(draft.aadhaar_no)
  return {
    community: draft.community || null,
    caste: blank(draft.caste),
    religion: draft.religion || null,
    nationality: blank(draft.nationality),
    mother_tongue: blank(draft.mother_tongue),
    community_certificate_no: blank(draft.community_certificate_no),
    ...(aadhaar ? { aadhaar_no: aadhaar } : draft.remove_aadhaar ? { aadhaar_no: null } : {}),
  }
}

export const communityLabel = (value: Community | null | undefined) =>
  value ? COMMUNITY_LABELS[value] : '—'

export const religionLabel = (value: Religion | null | undefined) =>
  value ? RELIGION_LABELS[value] : '—'
