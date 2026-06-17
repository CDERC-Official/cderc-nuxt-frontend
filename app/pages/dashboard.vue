<template>
  <section class="page-shell space-y-6">
    <PageHeader :eyebrow="t('dashboard.eyebrow')" :title="t('dashboard.title')">
      <template #actions>
        <UButton to="/children" icon="i-lucide-plus">{{ t('dashboard.addChild') }}</UButton>
      </template>
    </PageHeader>

    <div class="grid gap-4 md:grid-cols-3">
      <UCard v-for="metric in metrics" :key="metric.label">
        <div class="flex items-start justify-between gap-4">
          <div>
            <p class="text-sm text-gray-500">{{ metric.label }}</p>
            <p class="mt-2 text-3xl font-semibold text-gray-950">{{ metric.value }}</p>
          </div>
          <UIcon :name="metric.icon" class="size-6 text-primary-600" />
        </div>
      </UCard>
    </div>

    <section class="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
      <UCard>
        <template #header>
          <div class="flex items-center justify-between gap-3">
            <h2 class="text-base font-semibold text-gray-950">{{ t('dashboard.recentChildren') }}</h2>
            <UButton to="/children" icon="i-lucide-arrow-right" size="sm" variant="ghost" color="neutral" />
          </div>
        </template>

        <LoadingRows v-if="pending" :count="4" row-class="h-11 w-full" />
        <UTable v-else :data="childrenPreview" :columns="columns" />
      </UCard>

      <UCard>
        <template #header>
          <h2 class="text-base font-semibold text-gray-950">{{ t('dashboard.backend') }}</h2>
        </template>
        <div class="space-y-4">
          <div>
            <p class="text-sm text-gray-500">{{ t('common.apiBase') }}</p>
            <p class="mt-1 break-all text-sm font-medium text-gray-900">{{ apiBase }}</p>
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
const { t } = useI18n()
const pending = ref(true)
const children = ref<ChildResponse[]>([])
const organizations = ref<Organization[]>([])
const users = ref<User[]>([])

const columns = computed<TableColumn<ChildResponse>[]>(() => [
  { accessorKey: 'name', header: t('common.name') },
  { accessorKey: 'gender', header: t('children.gender') },
  { accessorKey: 'healthStatus', header: t('children.health') },
  { accessorKey: 'schoolStatus', header: t('children.school') },
])

const childrenPreview = computed(() => children.value.slice(0, 5))

const metrics = computed(() => [
  { label: t('dashboard.metrics.children'), value: children.value.length, icon: 'i-lucide-heart-handshake' },
  { label: t('dashboard.metrics.organizations'), value: organizations.value.length, icon: 'i-lucide-building-2' },
  { label: t('dashboard.metrics.users'), value: users.value.length, icon: 'i-lucide-users' },
])

onMounted(async () => {
  try {
    const [childrenResult, organizationsResult, usersResult] = await Promise.allSettled([
      api<ChildResponse[]>('children'),
      api<Organization[]>('super-admin/organizations'),
      api<User[]>('users'),
    ])

    if (childrenResult.status === 'fulfilled') {
      children.value = childrenResult.value
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
