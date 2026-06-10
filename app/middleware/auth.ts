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
})
