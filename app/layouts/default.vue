<template>
  <div class="min-h-screen bg-gray-50 text-gray-950 dark:bg-gray-950 dark:text-gray-50">
    <header class="sticky top-0 z-40 border-b border-gray-200 bg-white/95 backdrop-blur dark:border-gray-800 dark:bg-gray-950/90">
      <div class="page-shell flex h-16 items-center justify-between gap-3">
        <div class="flex min-w-0 items-center gap-2">
          <UButton
            v-if="auth.isLoggedIn.value"
            class="md:hidden"
            icon="i-lucide-menu"
            color="neutral"
            variant="ghost"
            :aria-label="t('nav.openMenu')"
            @click="openMenu"
          />
          <NuxtLink to="/dashboard" class="flex min-w-0 items-center gap-3 font-semibold text-gray-950 dark:text-white">
            <span class="grid size-9 shrink-0 place-items-center rounded bg-primary-600 text-sm font-bold text-white">C</span>
            <span class="truncate">CDERC</span>
          </NuxtLink>
        </div>

        <nav v-if="auth.isLoggedIn.value" class="hidden items-center gap-1 md:flex">
          <UButton
            v-for="item in navItems"
            :key="item.to"
            :to="item.to"
            :icon="item.icon"
            :variant="isActive(item.to) ? 'soft' : 'ghost'"
            color="neutral"
            size="sm"
          >
            {{ item.label }}
          </UButton>
        </nav>

        <div class="flex items-center gap-1">
          <UButton
            icon="i-lucide-sun-moon"
            color="neutral"
            variant="ghost"
            :aria-label="t('nav.theme')"
            @click="toggleTheme"
          />
          <UButton
            v-for="option in localeOptions"
            :key="option.code"
            size="sm"
            color="neutral"
            :variant="locale === option.code ? 'soft' : 'ghost'"
            :aria-label="t('nav.language')"
            @click="setLocale(option.code)"
          >
            {{ option.label }}
          </UButton>
          <UButton
            v-if="auth.isLoggedIn.value"
            icon="i-lucide-log-out"
            color="neutral"
            variant="ghost"
            :aria-label="t('nav.logout')"
            @click="logout"
          />
        </div>
      </div>
    </header>

    <div
      v-if="menuOpen"
      class="fixed inset-0 z-50 bg-gray-950/40 md:hidden"
      @click.self="closeMenu"
    >
      <aside class="flex h-full w-80 max-w-[85vw] flex-col border-r border-gray-200 bg-white p-4 shadow-xl dark:border-gray-800 dark:bg-gray-950">
        <div class="mb-6 flex items-center justify-between gap-3">
          <div class="flex items-center gap-3 font-semibold">
            <span class="grid size-9 place-items-center rounded bg-primary-600 text-sm font-bold text-white">C</span>
            <span>CDERC</span>
          </div>
          <UButton icon="i-lucide-x" color="neutral" variant="ghost" :aria-label="t('nav.closeMenu')" @click="closeMenu" />
        </div>

        <nav class="flex flex-col gap-1">
          <UButton
            v-for="item in navItems"
            :key="item.to"
            :to="item.to"
            :icon="item.icon"
            :variant="isActive(item.to) ? 'soft' : 'ghost'"
            color="neutral"
            block
            @click="closeMenu"
          >
            {{ item.label }}
          </UButton>
        </nav>

        <div v-if="auth.user.value" class="mt-auto rounded border border-gray-200 p-3 text-sm dark:border-gray-800">
          <p class="font-medium text-gray-950 dark:text-white">{{ auth.user.value.name || auth.user.value.email }}</p>
          <p class="mt-1 text-gray-500 dark:text-gray-400">{{ auth.user.value.role || t('common.user') }}</p>
        </div>
      </aside>
    </div>

    <main class="py-6 sm:py-8">
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const auth = useAuth()
const colorMode = useColorMode()
const { t, locale, setLocale } = useI18n()
const menuOpen = ref(false)

const navItems = computed(() => {
  if (auth.isSuperAdmin.value) {
    return [
      { label: t('nav.dashboard'), to: '/dashboard', icon: 'i-lucide-layout-dashboard' },
      { label: t('nav.organizations'), to: '/organizations', icon: 'i-lucide-building-2' },
      { label: t('nav.users'), to: '/users', icon: 'i-lucide-users' },
      { label: t('nav.apiExplorer'), to: '/api-explorer', icon: 'i-lucide-braces' },
    ]
  }

  return [
    { label: t('nav.dashboard'), to: '/dashboard', icon: 'i-lucide-layout-dashboard' },
    { label: t('nav.children'), to: '/children', icon: 'i-lucide-heart-handshake' },
    { label: t('nav.events'), to: '/events', icon: 'i-lucide-calendar-days' },
    { label: t('nav.expenses'), to: '/expenses', icon: 'i-lucide-receipt' },
    { label: t('nav.reports'), to: '/reports', icon: 'i-lucide-chart-column' },
    { label: t('nav.users'), to: '/users', icon: 'i-lucide-users' },
    { label: t('nav.apiExplorer'), to: '/api-explorer', icon: 'i-lucide-braces' },
  ]
})

const localeOptions = [
  { code: 'de' as const, label: 'DE' },
  { code: 'en' as const, label: 'EN' },
]

const isActive = (path: string) => route.path === path || route.path.startsWith(`${path}/`)

const openMenu = () => {
  menuOpen.value = true
}

const closeMenu = () => {
  menuOpen.value = false
}
const toggleTheme = () => {
  colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'
}

watch(
  () => route.fullPath,
  () => {
    menuOpen.value = false
  },
)

onMounted(() => auth.loadToken())

const logout = async () => {
  auth.logout()
  await navigateTo('/login')
}
</script>






