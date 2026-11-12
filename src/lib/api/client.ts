import axios, { type AxiosResponse, type InternalAxiosRequestConfig } from 'axios'
import { config } from '@/config/env'
import { schoolContext } from '@/lib/auth/school-context'
import { session } from '@/lib/auth/session'
import { yearContext } from '@/lib/auth/year-context'
import { toApiError } from './errors'

export interface ApiEnvelope<T> {
  status: number
  message: string
  data: T
}

export interface Paginated<T> {
  items: T[]
  total: number
  page: number
  limit: number
  total_pages: number
  has_next: boolean
}

export type QueryParams = Record<string, string | number | boolean | undefined | null>

interface TokenPair {
  access_token: string
  refresh_token: string
}

type RetriableConfig = InternalAxiosRequestConfig & { _retried?: boolean }

export const http = axios.create({
  baseURL: config.apiUrl,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
})

const PUBLIC_PATHS = ['/auth/otp/request', '/auth/otp/resend', '/auth/otp/verify', '/auth/refresh']

http.interceptors.request.use((request) => {
  const current = session.get()
  if (current && !PUBLIC_PATHS.includes(request.url ?? '')) {
    request.headers.set('Authorization', `Bearer ${current.accessToken}`)
    const schoolId = schoolContext.get()
    if (schoolId) request.headers.set('X-School-Id', String(schoolId))
    const yearId = yearContext.get()
    if (yearId) request.headers.set('X-Academic-Year-Id', String(yearId))
  }
  return request
})

let refreshing: Promise<string | null> | null = null

export const refreshAccessToken = () => {
  if (refreshing) return refreshing
  const current = session.get()
  if (!current) return Promise.resolve(null)
  refreshing = axios
    .post<ApiEnvelope<TokenPair>>(`${config.apiUrl}/auth/refresh`, {
      refresh_token: current.refreshToken,
    })
    .then(({ data }) => {
      session.set({ accessToken: data.data.access_token, refreshToken: data.data.refresh_token })
      return data.data.access_token
    })
    .catch(() => {
      session.clear()
      return null
    })
    .finally(() => {
      refreshing = null
    })
  return refreshing
}

http.interceptors.response.use(
  (response) => response,
  async (error) => {
    const body = (error as { response?: { data?: unknown } }).response?.data
    if (body instanceof Blob && body.type.includes('json')) {
      const parsed = await body
        .text()
        .then((text) => JSON.parse(text) as unknown)
        .catch(() => null)
      if (parsed) (error as { response: { data: unknown } }).response.data = parsed
    }
    const apiError = toApiError(error)
    const request = (error as { config?: RetriableConfig }).config
    const isPublic = PUBLIC_PATHS.includes(request?.url ?? '')

    if (apiError.status === 401 && request && !isPublic) {
      if (apiError.code === 'TOKEN_EXPIRED' && !request._retried) {
        request._retried = true
        const token = await refreshAccessToken()
        if (token) {
          request.headers.set('Authorization', `Bearer ${token}`)
          return http(request)
        }
      } else {
        session.clear()
      }
    }
    return Promise.reject(apiError)
  }
)

const unwrap = <T>(response: AxiosResponse<ApiEnvelope<T>>) => response.data.data

const clean = (params?: QueryParams) =>
  params
    ? Object.fromEntries(
        Object.entries(params).filter(
          ([, value]) => value !== undefined && value !== null && value !== ''
        )
      )
    : undefined

export const api = {
  get: <T>(url: string, params?: QueryParams) =>
    http.get<ApiEnvelope<T>>(url, { params: clean(params) }).then(unwrap),
  post: <T>(url: string, body?: unknown) => http.post<ApiEnvelope<T>>(url, body).then(unwrap),
  patch: <T>(url: string, body?: unknown) => http.patch<ApiEnvelope<T>>(url, body).then(unwrap),
  put: <T>(url: string, body?: unknown) => http.put<ApiEnvelope<T>>(url, body).then(unwrap),
  delete: <T>(url: string, params?: QueryParams) =>
    http.delete<ApiEnvelope<T>>(url, { params: clean(params) }).then(unwrap),
  upload: <T>(url: string, form: FormData) =>
    http
      .post<ApiEnvelope<T>>(url, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 120000,
      })
      .then(unwrap),
  blob: (url: string, params?: QueryParams) =>
    http
      .get<Blob>(url, { params: clean(params), responseType: 'blob', timeout: 120000 })
      .then((response) => response.data),
}
