import type { AuthResponse, LoginRequest, User, UserRole } from '~/types/api'

export const AUTH_TOKEN_KEY = 'cderc.auth.token'
export const AUTH_USER_KEY = 'cderc.auth.user'

interface JwtPayload {
  sub?: string
  email?: string
  name?: string
  role?: UserRole | string
  roles?: string[]
  authorities?: string[]
  exp?: number
  userId?: number
  id?: number
  organizationId?: number
  organization?: { id?: number }
}

const normalizeRole = (value?: string | null) => value?.replace(/^ROLE_/, '') as UserRole | undefined

const decodeJwtPayload = (token: string): JwtPayload | null => {
  if (!import.meta.client) return null

  try {
    const [, payload] = token.split('.')
    if (!payload) return null

    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/')
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=')
    return JSON.parse(decodeURIComponent(escape(atob(padded)))) as JwtPayload
  } catch {
    return null
  }
}

const userFromToken = (token: string): User | null => {
  const payload = decodeJwtPayload(token)
  if (!payload) return null

  return {
    id: payload.userId || payload.id,
    email: payload.email || payload.sub,
    name: payload.name || payload.email || payload.sub,
    role: normalizeRole(payload.role || payload.roles?.[0] || payload.authorities?.[0]),
    organizationId: payload.organizationId || payload.organization?.id,
  }
}

export function useAuth() {
  const token = useState<string | null>('auth-token', () => null)
  const user = useState<User | null>('auth-user', () => null)

  const setUser = (value: User | null) => {
    user.value = value
    if (!import.meta.client) return

    if (value) {
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(value))
    } else {
      localStorage.removeItem(AUTH_USER_KEY)
    }
  }

  const setToken = (value: string, nextUser?: User | null) => {
    token.value = value
    if (import.meta.client) {
      localStorage.setItem(AUTH_TOKEN_KEY, value)
    }
    setUser(nextUser || userFromToken(value))
  }

  const loadToken = () => {
    if (!import.meta.client) return

    const savedToken = localStorage.getItem(AUTH_TOKEN_KEY)
    token.value = savedToken

    const savedUser = localStorage.getItem(AUTH_USER_KEY)
    if (savedUser) {
      try {
        user.value = JSON.parse(savedUser) as User
        return
      } catch {
        localStorage.removeItem(AUTH_USER_KEY)
      }
    }

    user.value = savedToken ? userFromToken(savedToken) : null
  }

  const clearToken = () => {
    token.value = null
    setUser(null)
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
      setToken(response.token, response.user || null)
    }

    return response
  }

  const isLoggedIn = computed(() => Boolean(token.value))
  const userRole = computed(() => normalizeRole(user.value?.role))
  const organizationId = computed(() => user.value?.organizationId || user.value?.organization?.id || null)
  const isSuperAdmin = computed(() => userRole.value === 'SUPER_ADMIN')
  const isAdmin = computed(() => userRole.value === 'ADMIN')

  return {
    token,
    user,
    userRole,
    organizationId,
    isLoggedIn,
    isSuperAdmin,
    isAdmin,
    loadToken,
    login,
    logout: clearToken,
  }
}
