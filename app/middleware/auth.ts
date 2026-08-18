export default defineNuxtRouteMiddleware((to) => {
  if (import.meta.server) {
    return
  }

  const auth = useAuth()
  auth.loadToken()

  if (!auth.isLoggedIn.value && to.path !== '/login') {
    return navigateTo('/login')
  }

  if (auth.isLoggedIn.value && to.path === '/login') {
    return navigateTo('/dashboard')
  }

  const superAdminPaths = ['/organizations']
  const adminPaths = ['/children', '/events', '/cleaning-schedules', '/expenses', '/reports']

  if (auth.isLoggedIn.value && auth.isSuperAdmin.value && adminPaths.some((path) => to.path === path || to.path.startsWith(`${path}/`))) {
    return navigateTo('/organizations')
  }

  if (auth.isLoggedIn.value && !auth.isSuperAdmin.value && superAdminPaths.some((path) => to.path === path || to.path.startsWith(`${path}/`))) {
    return navigateTo('/dashboard')
  }
})
