import { AUTH_TOKEN_KEY } from './useAuth'
import type { ApiError } from '~/types/api'

type ApiOptions = Parameters<typeof $fetch>[1]

type FetchLikeError = Error & {
  status?: number
  statusCode?: number
  data?: { message?: string; error?: string } | unknown
  response?: { status?: number }
}

const createApiError = (error: unknown): ApiError => {
  const fetchError = error as FetchLikeError
  const data = fetchError?.data
  const messageFromData = data && typeof data === 'object' && 'message' in data ? String(data.message) : undefined
  const fallbackMessage = fetchError?.message || 'API request failed'
  const apiError = new Error(messageFromData || fallbackMessage) as ApiError

  apiError.statusCode = fetchError?.statusCode || fetchError?.status || fetchError?.response?.status
  apiError.data = data

  return apiError
}

export function useApi() {
  const config = useRuntimeConfig()
  const auth = useAuth()

  return async function api<T>(path: string, options: ApiOptions = {}) {
    const cleanPath = path.replace(/^\//, '')
    const baseURL = String(config.public.apiBase).replace(/\/$/, '')
    const headers = new Headers(options.headers as HeadersInit | undefined)
    const token = auth.token.value || (import.meta.client ? localStorage.getItem(AUTH_TOKEN_KEY) : null)

    if (!headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json')
    }

    if (token) {
      headers.set('Authorization', `Bearer ${token}`)
    }

    try {
      return await $fetch<T>(`${baseURL}/${cleanPath}`, {
        ...options,
        headers,
      })
    } catch (error) {
      const apiError = createApiError(error)
      if (apiError.statusCode === 401) {
        auth.logout()
        if (import.meta.client && useRoute().path !== '/login') {
          await navigateTo('/login')
        }
      }
      throw apiError
    }
  }
}

