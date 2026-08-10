<template>
  <section class="page-shell space-y-6">
    <PageHeader eyebrow="Uebersicht" title="Dashboard">
      <template #actions>
        <UButton v-if="auth.isSuperAdmin.value" to="/organizations" icon="i-lucide-building-2">Organisation erfassen</UButton>
        <UButton v-else to="/children" icon="i-lucide-plus">Kind erfassen</UButton>
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
      <UCard v-if="!auth.isSuperAdmin.value">
        <template #header>
          <div class="flex items-center justify-between gap-3">
            <h2 class="text-base font-semibold text-gray-950">Aktuelle Kinder</h2>
            <UButton to="/children" icon="i-lucide-arrow-right" size="sm" variant="ghost" color="neutral" />
          </div>
        </template>

        <LoadingRows v-if="pending" :count="4" row-class="h-11 w-full" />
        <UTable v-else :data="childrenPreview" :columns="columns" />
      </UCard>

      <UCard>
        <template #header>
          <h2 class="text-base font-semibold text-gray-950">{{ auth.isSuperAdmin.value ? 'Organisationen' : 'Backend' }}</h2>
        </template>
        <div v-if="auth.isSuperAdmin.value" class="space-y-3">
          <div v-for="organization in organizations.slice(0, 6)" :key="organization.id" class="flex items-center justify-between gap-3 border-b border-gray-100 pb-3 last:border-0 last:pb-0">
            <div class="min-w-0">
              <p class="truncate text-sm font-medium text-gray-950">{{ organization.name || '-' }}</p>
              <p class="truncate text-xs text-gray-500">{{ organization.email || '-' }}</p>
            </div>
            <UButton to="/organizations" icon="i-lucide-arrow-right" size="sm" variant="ghost" color="neutral" />
          </div>
          <p v-if="organizations.length === 0" class="text-sm text-gray-500">Keine Organisationen gefunden.</p>
        </div>
        <div v-else class="space-y-4">
          <div>
            <p class="text-sm text-gray-500">API Basis</p>
            <p class="mt-1 break-all text-sm font-medium text-gray-900">{{ apiBase }}</p>
          </div>
          <UButton to="/api-explorer" icon="i-lucide-braces" variant="soft" block>API testen</UButton>
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
const pending = ref(true)
const children = ref<ChildResponse[]>([])
const organizations = ref<Organization[]>([])
const users = ref<User[]>([])

const columns: TableColumn<ChildResponse>[] = [
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'gender', header: 'Geschlecht' },
  { accessorKey: 'healthStatus', header: 'Gesundheit' },
  { accessorKey: 'schoolStatus', header: 'Schule' },
]

const childrenPreview = computed(() => children.value.slice(0, 5))

const metrics = computed(() => [
  ...(auth.isSuperAdmin.value ? [] : [{ label: 'Kinder', value: children.value.length, icon: 'i-lucide-heart-handshake' }]),
  ...(auth.isSuperAdmin.value ? [{ label: 'Organisationen', value: organizations.value.length, icon: 'i-lucide-building-2' }] : []),
  { label: 'Nutzer', value: users.value.length, icon: 'i-lucide-users' },
])

onMounted(async () => {
  auth.loadToken()

  try {
    const [childrenResult, organizationsResult, usersResult] = await Promise.allSettled([
      auth.isSuperAdmin.value ? Promise.resolve([]) : api<ChildResponse[]>('children'),
      auth.isSuperAdmin.value ? api<Organization[]>('super-admin/organizations') : Promise.resolve([]),
      auth.isSuperAdmin.value ? Promise.resolve([]) : api<User[]>('users'),
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
