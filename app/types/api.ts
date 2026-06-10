export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'SOCIAL_WORKER' | 'VOLUNTEER' | 'USER'

export interface Organization {
  id?: number
  name?: string
  logo?: string
  themeColor?: string
  email?: string
}

export interface Child {
  id?: number
  name?: string
  gender?: string
  healthStatus?: string
  schoolStatus?: string
  organizationId?: number
}

export interface ChildRequest {
  name?: string
  gender?: string
  healthStatus?: string
  schoolStatus?: string
}

export interface ChildResponse extends Child {}

export interface User {
  id?: number
  name?: string
  email?: string
  password?: string
  role?: UserRole
  organization?: Organization
}

export interface CreateAdminRequest {
  name?: string
  email?: string
  password?: string
  organizationId?: number
}

export interface CreateUserRequest {
  name?: string
  email?: string
  password?: string
  role?: UserRole
}

export interface LoginRequest {
  email?: string
  password?: string
}

export interface AuthResponse {
  token?: string
}
