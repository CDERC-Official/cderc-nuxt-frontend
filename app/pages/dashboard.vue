<template>
  <section class="page-shell space-y-6">
    <PageHeader :eyebrow="t('dashboard.eyebrow')" :title="t('dashboard.title')">
      <template #actions>
        <UButton icon="i-lucide-refresh-cw" variant="soft" :loading="pending" @click="loadDashboard">
          {{ t('common.refresh') }}
        </UButton>
        <UButton to="/children" icon="i-lucide-plus">{{ t('dashboard.addChild') }}</UButton>
      </template>
    </PageHeader>

    <FeedbackAlert :message="message" type="error" />

    <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <DashboardMetricCard
        v-for="metric in metrics"
        :key="metric.label"
        :label="metric.label"
        :value="metric.value"
        :icon="metric.icon"
        :description="metric.description"
      />
    </div>

    <section class="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
      <UCard>
        <template #header>
          <div class="flex items-center justify-between gap-3">
            <h2 class="text-base font-semibold text-gray-950 dark:text-white">{{ t('dashboard.recentChildren') }}</h2>
            <UButton to="/children" icon="i-lucide-arrow-right" size="sm" variant="ghost" color="neutral">
              {{ t('dashboard.viewChildren') }}
            </UButton>
          </div>
        </template>

        <LoadingRows v-if="pending" :count="5" row-class="h-12 w-full" />
        <div v-else-if="childrenPreview.length" class="divide-y divide-gray-100 dark:divide-gray-800">
          <div v-for="child in childrenPreview" :key="child.id || child.name" class="grid gap-3 py-3 sm:grid-cols-[1fr_0.8fr_0.8fr] sm:items-center">
            <div class="min-w-0">
              <p class="truncate font-medium text-gray-950 dark:text-white">{{ child.name || '-' }}</p>
              <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">{{ organizationName(child.organizationId) }}</p>
            </div>
            <UBadge color="neutral" variant="soft" class="w-fit">{{ child.healthStatus || t('dashboard.unknown') }}</UBadge>
            <p class="text-sm text-gray-600 dark:text-gray-300">{{ child.schoolStatus || t('dashboard.unknown') }}</p>
          </div>
        </div>
        <div v-else class="py-10 text-center text-sm text-gray-500 dark:text-gray-400">
          {{ t('dashboard.noRecentChildren') }}
        </div>
      </UCard>

      <UCard>
        <template #header>
          <h2 class="text-base font-semibold text-gray-950 dark:text-white">{{ t('dashboard.backend') }}</h2>
        </template>
        <div class="space-y-4">
          <div>
            <p class="text-sm text-gray-500 dark:text-gray-400">{{ t('common.apiBase') }}</p>
            <p class="mt-1 break-all text-sm font-medium text-gray-900 dark:text-gray-100">{{ apiBase }}</p>
          </div>
          <div v-if="lastLoaded" class="rounded border border-gray-200 p-3 dark:border-gray-800">
            <p class="text-xs uppercase text-gray-500 dark:text-gray-400">{{ t('dashboard.lastLoaded') }}</p>
            <p class="mt-1 text-sm font-medium text-gray-900 dark:text-gray-100">{{ lastLoadedLabel }}</p>
          </div>
          <UButton to="/api-explorer" icon="i-lucide-braces" variant="soft" block>{{ t('dashboard.testApi') }}</UButton>
        </div>
      </UCard>
    </section>

    <section class="grid gap-6 lg:grid-cols-2">
      <DashboardBarList :title="t('dashboard.healthOverview')" :items="healthStats" :empty-text="t('dashboard.noData')" />
      <DashboardBarList :title="t('dashboard.schoolOverview')" :items="schoolStats" :empty-text="t('dashboard.noData')" />
      <DashboardBarList :title="t('dashboard.userRoles')" :items="roleStats" :empty-text="t('dashboard.noData')" />
      <DashboardBarList :title="t('dashboard.organizationDistribution')" :items="organizationStats" :empty-text="t('dashboard.noData')" />
    </section>
  </section>
</template>

<script setup lang="ts">
import type { ChildResponse, Organization, User } from '~/types/api'

definePageMeta({ middleware: 'auth' })

interface BarItem {
  label: string
  value: number
  color?: string
}

const config = useRuntimeConfig()
const apiBase = config.public.apiBase
const api = useApi()
const { t, locale } = useI18n()
const pending = ref(true)
const message = ref('')
const lastLoaded = ref<Date | null>(null)
const children = ref<ChildResponse[]>([])
const organizations = ref<Organization[]>([])
const users = ref<User[]>([])
const canReadOrganizations = ref(true)
const canReadUsers = ref(true)

const childrenPreview = computed(() => children.value.slice(0, 5))
const inferredOrganizationCount = computed(() => new Set(children.value.map((child) => child.organizationId).filter(Boolean)).size)
const organizationCount = computed(() => organizations.value.length || inferredOrganizationCount.value)

const adminCount = computed(() => users.value.filter((user) => user.role === 'ADMIN' || user.role === 'SUPER_ADMIN').length)
const socialWorkerCount = computed(() => users.value.filter((user) => user.role === 'SOCIAL_WORKER').length)

const metrics = computed(() => [
  {
    label: t('dashboard.metrics.children'),
    value: children.value.length,
    icon: 'i-lucide-heart-handshake',
    description: t('dashboard.metrics.childrenDescription'),
  },
  {
    label: t('dashboard.metrics.organizations'),
    value: organizationCount.value,
    icon: 'i-lucide-building-2',
    description: t('dashboard.metrics.organizationsDescription'),
  },
  {
    label: t('dashboard.metrics.users'),
    value: canReadUsers.value ? users.value.length : '-',
    icon: 'i-lucide-users',
    description: t('dashboard.metrics.usersDescription'),
  },
  {
    label: t('dashboard.metrics.admins'),
    value: canReadUsers.value ? `${adminCount.value}/${socialWorkerCount.value}` : '-',
    icon: 'i-lucide-shield-check',
    description: t('dashboard.metrics.adminsDescription'),
  },
])

const lastLoadedLabel = computed(() => {
  if (!lastLoaded.value) return ''

  return new Intl.DateTimeFormat(locale.value, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(lastLoaded.value)
})

const groupByValue = (values: Array<string | undefined>) => {
  const counts = new Map<string, number>()

  values.forEach((value) => {
    const label = value?.trim() || t('dashboard.unknown')
    counts.set(label, (counts.get(label) || 0) + 1)
  })

  return Array.from(counts.entries())
    .map(([label, value]) => ({ label, value }))
    .sort((left, right) => right.value - left.value || left.label.localeCompare(right.label))
}

const healthStats = computed<BarItem[]>(() => groupByValue(children.value.map((child) => child.healthStatus)))
const schoolStats = computed<BarItem[]>(() => groupByValue(children.value.map((child) => child.schoolStatus)))
const roleStats = computed<BarItem[]>(() => groupByValue(users.value.map((user) => user.role)))

const organizationName = (organizationId?: number) => {
  if (!organizationId) return t('users.noOrganization')

  return organizations.value.find((organization) => Number(organization.id) === Number(organizationId))?.name || `#${organizationId}`
}

const organizationStats = computed<BarItem[]>(() => {
  const colorById = new Map(organizations.value.map((organization) => [Number(organization.id), organization.themeColor]))

  return groupByValue(children.value.map((child) => organizationName(child.organizationId))).map((item) => {
    const organization = organizations.value.find((entry) => entry.name === item.label)
    return {
      ...item,
      color: organization?.themeColor || colorById.get(Number(item.label.replace('#', ''))),
    }
  })
})

const loadDashboard = async () => {
  pending.value = true
  message.value = ''
  canReadOrganizations.value = true
  canReadUsers.value = true

  try {
    const [childrenResult, organizationsResult, usersResult] = await Promise.allSettled([
      api<ChildResponse[]>('children'),
      api<Organization[]>('super-admin/organizations'),
      api<User[]>('users'),
    ])

    children.value = childrenResult.status === 'fulfilled' ? childrenResult.value : []
    organizations.value = organizationsResult.status === 'fulfilled' ? organizationsResult.value : []
    users.value = usersResult.status === 'fulfilled' ? usersResult.value : []
    canReadOrganizations.value = organizationsResult.status === 'fulfilled'
    canReadUsers.value = usersResult.status === 'fulfilled'

    if (childrenResult.status === 'rejected') {
      message.value = t('dashboard.loadError')
    } else if (!canReadOrganizations.value || !canReadUsers.value) {
      message.value = t('dashboard.partialLoad')
    }

    lastLoaded.value = new Date()
  } finally {
    pending.value = false
  }
}

onMounted(loadDashboard)
</script>


