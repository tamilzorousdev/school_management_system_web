import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api/client'
import { session } from '@/lib/auth/session'

export type AppSection = 'admin' | 'staff' | 'parent' | 'driver'
export type Language = 'en' | 'ta'

export interface RoleSummary {
  code: string
  name: string
  app: AppSection
}

export interface Me {
  id: number
  name: string
  mobile: string
  email: string | null
  status: 'active' | 'inactive'
  language: Language
  last_login_at: string | null
  created_at: string
  roles: RoleSummary[]
  school: {
    id: number
    name: string
    code: string
    logo_url: string | null
    signature_url: string | null
    seal_url: string | null
  } | null
  apps: AppSection[]
  permissions: string[]
  photo_file_id: number | null
}

export interface OtpSent {
  mobile_masked: string
  expires_in: number
  resend_in: number
  otp_length: number
}

export interface LoginResponse {
  access_token: string
  refresh_token: string
  token_type: 'Bearer'
  expires_in: number
  refresh_expires_at: string
  user: Me
}

export const meKey = ['me'] as const

export const authApi = {
  requestOtp: (mobile: string) => api.post<OtpSent>('/auth/otp/request', { mobile, app: 'admin' }),
  resendOtp: (mobile: string) => api.post<OtpSent>('/auth/otp/resend', { mobile, app: 'admin' }),
  verifyOtp: (mobile: string, otp: string) =>
    api.post<LoginResponse>('/auth/otp/verify', {
      mobile,
      otp,
      client: { app: 'admin', platform: 'web' },
    }),
  logout: () => api.post<null>('/auth/logout'),
  me: () => api.get<Me>('/me'),
}

export function useMe() {
  return useQuery({
    queryKey: meKey,
    queryFn: authApi.me,
    enabled: Boolean(session.get()),
    staleTime: 60_000,
    meta: { silent: true },
  })
}

export function can(me: Me | undefined, permission?: string) {
  if (!permission) return true
  return Boolean(me?.permissions.includes(permission))
}
