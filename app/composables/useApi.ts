import { AUTH_TOKEN_KEY } from './useAuth'

type ApiOptions = Parameters<typeof $fetch>[1]

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

    return await $fetch<T>(`${baseURL}/${cleanPath}`, {
      ...options,
      headers,
    })
  }
}
