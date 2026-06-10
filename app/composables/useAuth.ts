import type { AuthResponse, LoginRequest } from '~/types/api'

export const AUTH_TOKEN_KEY = 'cderc.auth.token'

export function useAuth() {
  const token = useState<string | null>('auth-token', () => null)

  const loadToken = () => {
    if (import.meta.client) {
      token.value = localStorage.getItem(AUTH_TOKEN_KEY)
    }
  }

  const setToken = (value: string) => {
    token.value = value
    if (import.meta.client) {
      localStorage.setItem(AUTH_TOKEN_KEY, value)
    }
  }

  const clearToken = () => {
    token.value = null
    if (import.meta.client) {
      localStorage.removeItem(AUTH_TOKEN_KEY)
    }
  }

  const login = async (request: LoginRequest) => {
    const api = useApi()
    const response = await api<AuthResponse>('auth/login', {
      method: 'POST',
      body: request,
    })

    if (response.token) {
      setToken(response.token)
    }

    return response
  }

  const isLoggedIn = computed(() => Boolean(token.value))

  return {
    token,
    isLoggedIn,
    loadToken,
    login,
    logout: clearToken,
  }
}
