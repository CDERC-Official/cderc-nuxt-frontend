<template>
  <section class="page-shell space-y-6">
    <PageHeader :eyebrow="t('dashboard.eyebrow')" :title="t('dashboard.title')">
      <template #actions>
        <UButton v-if="auth.isSuperAdmin.value" to="/organizations" icon="i-lucide-building-2">{{ t('organizations.createTitle') }}</UButton>
        <UButton v-else to="/children" icon="i-lucide-plus">{{ t('dashboard.addChild') }}</UButton>
      </template>
    </PageHeader>

    <div v-if="!auth.isSuperAdmin.value" class="flex flex-wrap items-center gap-3 rounded border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
      <img
        v-if="organization?.logo"
        :src="organization.logo"
        :alt="organization.name || t('common.organization')"
        class="size-12 rounded object-contain"
      >
      <div v-else class="grid size-12 place-items-center rounded bg-primary-600 text-sm font-bold text-white">
        {{ organizationInitial }}
      </div>
      <div class="min-w-0">
        <p class="text-sm text-gray-500 dark:text-gray-400">{{ t('dashboard.organizationContext') }}</p>
        <p class="truncate text-lg font-semibold text-gray-950 dark:text-white">{{ organizationName }}</p>
        <p v-if="organization?.email" class="truncate text-sm text-gray-500 dark:text-gray-400">{{ organization.email }}</p>
      </div>
    </div>

    <div class="grid gap-4 md:grid-cols-3">
      <UCard v-for="metric in metrics" :key="metric.label">
        <div class="flex items-start justify-between gap-4">
          <div>
            <p class="text-sm text-gray-500 dark:text-gray-400">{{ metric.label }}</p>
            <p class="mt-2 text-3xl font-semibold text-gray-950 dark:text-white">{{ metric.value }}</p>
          </div>
          <UIcon :name="metric.icon" class="size-6 text-primary-600" />
        </div>
      </UCard>
    </div>

    <section class="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
      <UCard v-if="!auth.isSuperAdmin.value">
        <template #header>
          <div class="flex items-center justify-between gap-3">
            <h2 class="text-base font-semibold text-gray-950 dark:text-white">{{ t('dashboard.recentChildren') }}</h2>
            <UButton to="/children" icon="i-lucide-arrow-right" size="sm" variant="ghost" color="neutral" />
          </div>
        </template>

        <LoadingRows v-if="pending" :count="4" row-class="h-11 w-full" />
        <UTable v-else :data="childrenPreview" :columns="columns" />
      </UCard>

      <UCard>
        <template #header>
          <h2 class="text-base font-semibold text-gray-950 dark:text-white">{{ auth.isSuperAdmin.value ? t('nav.organizations') : t('dashboard.backend') }}</h2>
        </template>
        <div v-if="auth.isSuperAdmin.value" class="space-y-3">
          <div v-for="organization in organizations.slice(0, 6)" :key="organization.id" class="flex items-center justify-between gap-3 border-b border-gray-100 pb-3 last:border-0 last:pb-0">
            <div class="min-w-0">
              <p class="truncate text-sm font-medium text-gray-950 dark:text-white">{{ organization.name || '-' }}</p>
              <p class="truncate text-xs text-gray-500 dark:text-gray-400">{{ organization.email || '-' }}</p>
            </div>
            <UButton to="/organizations" icon="i-lucide-arrow-right" size="sm" variant="ghost" color="neutral" />
          </div>
          <p v-if="organizations.length === 0" class="text-sm text-gray-500 dark:text-gray-400">{{ t('organizations.noOrganizations') }}</p>
        </div>
        <div v-else class="space-y-4">
          <div>
            <p class="text-sm text-gray-500 dark:text-gray-400">{{ t('common.apiBase') }}</p>
            <p class="mt-1 break-all text-sm font-medium text-gray-900 dark:text-gray-100">{{ apiBase }}</p>
          </div>
          <UButton to="/api-explorer" icon="i-lucide-braces" variant="soft" block>{{ t('dashboard.testApi') }}</UButton>
        </div>
      </UCard>
    </section>
  </section>
</template>

<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { ChildResponse, Organization, User } from '~/types/api'

definePageMeta({ middleware: 'auth' })

const config = useRuntimeConfig()
const apiBase = config.public.apiBase
const api = useApi()
const auth = useAuth()
const { t } = useI18n()
const pending = ref(true)
const children = ref<ChildResponse[]>([])
const organization = ref<Organization | null>(null)
const organizations = ref<Organization[]>([])
const users = ref<User[]>([])

const columns = computed<TableColumn<ChildResponse>[]>(() => [
  { accessorKey: 'name', header: t('common.name') },
  { accessorKey: 'gender', header: t('children.gender') },
  { accessorKey: 'healthStatus', header: t('children.health') },
  { accessorKey: 'schoolStatus', header: t('children.school') },
])

const childrenPreview = computed(() => children.value.slice(0, 5))
const organizationName = computed(() => organization.value?.name || t('common.organization'))
const organizationInitial = computed(() => organizationName.value.trim().charAt(0).toUpperCase() || 'C')

const metrics = computed(() => [
  ...(auth.isSuperAdmin.value ? [] : [{ label: t('dashboard.metrics.children'), value: children.value.length, icon: 'i-lucide-heart-handshake' }]),
  ...(auth.isSuperAdmin.value ? [{ label: t('dashboard.metrics.organizations'), value: organizations.value.length, icon: 'i-lucide-building-2' }] : []),
  { label: t('dashboard.metrics.users'), value: users.value.length, icon: 'i-lucide-users' },
])

onMounted(async () => {
  auth.loadToken()

  try {
    const [childrenResult, organizationResult, organizationsResult, usersResult] = await Promise.allSettled([
      auth.isSuperAdmin.value ? Promise.resolve([]) : api<ChildResponse[]>('children'),
      auth.isSuperAdmin.value ? Promise.resolve(null) : api<Organization>('admin/organization'),
      auth.isSuperAdmin.value ? api<Organization[]>('super-admin/organizations') : Promise.resolve([]),
      auth.isSuperAdmin.value ? Promise.resolve([]) : api<User[]>('users'),
    ])

    if (childrenResult.status === 'fulfilled') {
      children.value = childrenResult.value
    }
    if (organizationResult.status === 'fulfilled') {
      organization.value = organizationResult.value
    }
    if (organizationsResult.status === 'fulfilled') {
      organizations.value = organizationsResult.value
    }
    if (usersResult.status === 'fulfilled') {
      users.value = usersResult.value
    }
  } finally {
    pending.value = false
  }
})
</script>
