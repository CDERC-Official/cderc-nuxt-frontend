export const userRoles = ['SUPER_ADMIN', 'ADMIN', 'SOCIAL_WORKER', 'VOLUNTEER', 'USER'] as const
export const creatableUserRoles = ['ADMIN', 'SOCIAL_WORKER', 'VOLUNTEER', 'USER'] as const

export type UserRole = typeof userRoles[number]
export type CreatableUserRole = typeof creatableUserRoles[number]

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
  organizationId?: number
  organization?: Organization
}

export interface CreateAdminRequest {
  name?: string
  email?: string
  password?: string
}

export interface CreateUserRequest {
  name?: string
  email?: string
  password?: string
  role?: CreatableUserRole
}

export interface LoginRequest {
  email?: string
  password?: string
}

export interface AuthResponse {
  token?: string
  user?: User
}

export interface ApiError extends Error {
  statusCode?: number
  data?: unknown
}
export type ExpenseCategory = 'SCHOOL_FEE' | 'SCHOOL_MATERIAL' | 'FOOD' | 'HEALTH' | 'CLOTHES' | 'TRANSPORT' | 'OTHER'
export type EventExpenseCategory = 'FOOD' | 'TRANSPORT' | 'MATERIAL' | 'RENT' | 'DRINKS' | 'MEDIA' | 'DECORATION' | 'OTHER'

export interface EventRequest {
  title?: string
  eventDate?: string
  location?: string
  description?: string
}

export interface EventResponse extends EventRequest {
  id?: number
  organizationId?: number
}

export interface ExpenseRequest {
  title?: string
  amount?: number
  expenseDate?: string
  category?: ExpenseCategory
  description?: string
}

export interface ExpenseResponse extends ExpenseRequest {
  id?: number
  childId?: number
  childName?: string
}

export interface EventExpenseRequest {
  title?: string
  amount?: number
  expenseDate?: string
  category?: EventExpenseCategory
  description?: string
}

export interface EventExpenseResponse extends EventExpenseRequest {
  id?: number
  eventId?: number
  eventTitle?: string
}

export interface ChildExpenseSummaryResponse {
  id?: number
  name?: string
  totalExpenses?: number
}

export interface EventTotalReportResponse {
  eventId?: number
  eventTitle?: string
  totalExpenses?: number
}
export interface CategoryReportResponse {
  category?: string
  total?: number
}

export interface YearReportResponse {
  year?: number
  total?: number
}

export interface OrganizationTotalReportResponse {
  totalExpenses?: number
}

