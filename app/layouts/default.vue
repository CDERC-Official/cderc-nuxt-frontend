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

        <div class="flex items-center gap-1">
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

    <main class="py-8">
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const auth = useAuth()
const { t, locale, setLocale } = useI18n()

const navItems = computed(() => [
  { label: t('nav.dashboard'), to: '/dashboard', icon: 'i-lucide-layout-dashboard' },
  { label: t('nav.children'), to: '/children', icon: 'i-lucide-heart-handshake' },
  { label: t('nav.organizations'), to: '/organizations', icon: 'i-lucide-building-2' },
  { label: t('nav.users'), to: '/users', icon: 'i-lucide-users' },
  { label: t('nav.apiExplorer'), to: '/api-explorer', icon: 'i-lucide-braces' },
])

const localeOptions = [
  { code: 'de' as const, label: 'DE' },
  { code: 'en' as const, label: 'EN' },
]

onMounted(() => auth.loadToken())

const logout = async () => {
  auth.logout()
  await navigateTo('/login')
}
</script>

