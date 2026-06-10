<template>
  <div class="min-h-screen">
    <header class="border-b border-gray-200 bg-white">
      <div class="page-shell flex h-16 items-center justify-between gap-4">
        <NuxtLink to="/dashboard" class="flex items-center gap-3 font-semibold text-gray-950">
          <span class="grid size-9 place-items-center rounded bg-primary-600 text-sm font-bold text-white">C</span>
          <span>CDERC</span>
        </NuxtLink>

        <nav v-if="auth.isLoggedIn.value" class="hidden items-center gap-1 md:flex">
          <UButton
            v-for="item in navItems"
            :key="item.to"
            :to="item.to"
            :icon="item.icon"
            :variant="route.path.startsWith(item.to) ? 'soft' : 'ghost'"
            color="neutral"
          >
            {{ item.label }}
          </UButton>
        </nav>

        <div class="flex items-center gap-2">
          <UButton
            v-if="auth.isLoggedIn.value"
            icon="i-lucide-log-out"
            color="neutral"
            variant="ghost"
            aria-label="Abmelden"
            @click="logout"
          />
        </div>
      </div>
    </header>

    <main class="py-8">
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const auth = useAuth()

const navItems = [
  { label: 'Dashboard', to: '/dashboard', icon: 'i-lucide-layout-dashboard' },
  { label: 'Kinder', to: '/children', icon: 'i-lucide-heart-handshake' },
  { label: 'Organisationen', to: '/organizations', icon: 'i-lucide-building-2' },
  { label: 'Nutzer', to: '/users', icon: 'i-lucide-users' },
  { label: 'API Explorer', to: '/api-explorer', icon: 'i-lucide-braces' },
]

onMounted(() => auth.loadToken())

const logout = async () => {
  auth.logout()
  await navigateTo('/login')
}
</script>
