<template>
  <section class="page-shell space-y-6">
    <div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p class="text-sm font-medium uppercase tracking-wide text-primary-700">Nutzer</p>
        <h1 class="mt-1 text-3xl font-semibold text-gray-950">Nutzer verwalten</h1>
      </div>
      <UButton icon="i-lucide-refresh-cw" variant="soft" :loading="pending" @click="loadUsers">Aktualisieren</UButton>
    </div>

    <div class="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
      <UCard>
        <template #header>
          <h2 class="text-base font-semibold text-gray-950">Nutzer anlegen</h2>
        </template>

        <form class="space-y-4" @submit.prevent="saveUser">
          <UFormField label="Name" required>
            <UInput v-model="form.name" icon="i-lucide-user" placeholder="Name" class="w-full" />
          </UFormField>

          <UFormField label="E-Mail" required>
            <UInput v-model="form.email" icon="i-lucide-mail" type="email" placeholder="name@example.org" class="w-full" />
          </UFormField>

          <UFormField label="Passwort" required>
            <UInput v-model="form.password" icon="i-lucide-lock-keyhole" type="password" placeholder="Passwort" class="w-full" />
          </UFormField>

          <UFormField label="Rolle">
            <select v-model="form.role" class="h-9 w-full rounded-md border border-gray-300 bg-white px-3 text-sm">
              <option v-for="role in roles" :key="role" :value="role">{{ role }}</option>
            </select>
          </UFormField>

          <UFormField v-if="form.role === 'ADMIN'" label="Organisation">
            <select v-model.number="organizationId" class="h-9 w-full rounded-md border border-gray-300 bg-white px-3 text-sm">
              <option :value="undefined">Keine Organisation</option>
              <option v-for="organization in organizations" :key="organization.id" :value="organization.id">
                {{ organization.name || organization.id }}
              </option>
            </select>
          </UFormField>

          <UAlert
            v-if="message"
            :color="messageType"
            variant="soft"
            :icon="messageType === 'success' ? 'i-lucide-circle-check' : 'i-lucide-circle-alert'"
            :description="message"
          />

          <UButton type="submit" icon="i-lucide-user-plus" :loading="saving" :disabled="!canSave">
            Anlegen
          </UButton>
        </form>
      </UCard>

      <UCard>
        <template #header>
          <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 class="text-base font-semibold text-gray-950">Liste</h2>
            <UInput v-model="query" icon="i-lucide-search" placeholder="Suchen" class="w-full sm:w-64" />
          </div>
        </template>

        <div v-if="pending" class="space-y-3">
          <USkeleton v-for="item in 6" :key="item" class="h-12 w-full" />
        </div>
        <div v-else-if="filteredUsers.length === 0" class="py-10 text-center text-sm text-gray-500">
          Keine Nutzer gefunden.
        </div>
        <div v-else class="overflow-x-auto">
          <table class="w-full min-w-[760px] border-collapse text-left text-sm">
            <thead>
              <tr class="border-b border-gray-200 text-gray-500">
                <th class="py-3 pr-4 font-medium">Name</th>
                <th class="py-3 pr-4 font-medium">E-Mail</th>
                <th class="py-3 pr-4 font-medium">Rolle</th>
                <th class="py-3 pr-0 font-medium">Organisation</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="user in filteredUsers" :key="user.id" class="border-b border-gray-100">
                <td class="py-3 pr-4 font-medium text-gray-950">{{ user.name || '-' }}</td>
                <td class="py-3 pr-4 text-gray-600">{{ user.email || '-' }}</td>
                <td class="py-3 pr-4">
                  <UBadge color="neutral" variant="soft">{{ user.role || '-' }}</UBadge>
                </td>
                <td class="py-3 pr-0 text-gray-600">{{ user.organization?.name || '-' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </UCard>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { CreateAdminRequest, CreateUserRequest, Organization, User, UserRole } from '~/types/api'

definePageMeta({ middleware: 'auth' })

const api = useApi()
const roles: UserRole[] = ['ADMIN', 'SOCIAL_WORKER', 'VOLUNTEER', 'USER']
const pending = ref(false)
const saving = ref(false)
const users = ref<User[]>([])
const organizations = ref<Organization[]>([])
const query = ref('')
const organizationId = ref<number | undefined>(undefined)
const message = ref('')
const messageType = ref<'success' | 'error'>('success')
const form = reactive<CreateUserRequest>({
  name: '',
  email: '',
  password: '',
  role: 'USER',
})

const canSave = computed(() => Boolean(form.name && form.email && form.password && form.role))

const filteredUsers = computed(() => {
  const needle = query.value.trim().toLowerCase()
  if (!needle) return users.value

  return users.value.filter((user) =>
    [user.name, user.email, user.role, user.organization?.name].some((value) =>
      String(value || '').toLowerCase().includes(needle),
    ),
  )
})

watch(
  () => form.role,
  (role) => {
    if (role !== 'ADMIN') {
      organizationId.value = undefined
    }
  },
)

const showMessage = (text: string, type: 'success' | 'error') => {
  message.value = text
  messageType.value = type
}

const loadUsers = async () => {
  pending.value = true
  try {
    users.value = await api<User[]>('users')
  } catch {
    showMessage('Nutzer konnten nicht geladen werden.', 'error')
  } finally {
    pending.value = false
  }
}

const loadOrganizations = async () => {
  try {
    organizations.value = await api<Organization[]>('super-admin/organizations')
  } catch {
    organizations.value = []
  }
}

const resetForm = () => {
  form.name = ''
  form.email = ''
  form.password = ''
  form.role = 'USER'
  organizationId.value = undefined
}

const saveUser = async () => {
  saving.value = true
  try {
    if (form.role === 'ADMIN') {
      const request: CreateAdminRequest = {
        name: form.name,
        email: form.email,
        password: form.password,
        organizationId: organizationId.value,
      }
      await api<User>('super-admin/users/admins', { method: 'POST', body: request })
    } else {
      await api<User>('admin/users', { method: 'POST', body: { ...form } })
    }

    showMessage('Nutzer wurde angelegt.', 'success')
    resetForm()
    await loadUsers()
  } catch {
    showMessage('Anlegen fehlgeschlagen.', 'error')
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  await Promise.all([loadUsers(), loadOrganizations()])
})
</script>
