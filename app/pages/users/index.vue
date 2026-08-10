<template>
  <section class="page-shell space-y-6">
    <PageHeader :eyebrow="t('users.eyebrow')" :title="t('users.title')">
      <template #actions>
        <UButton icon="i-lucide-refresh-cw" variant="soft" :loading="pending" @click="loadUsers">{{ t('common.refresh') }}</UButton>
      </template>
    </PageHeader>

    <div class="grid gap-4 sm:grid-cols-3">
      <DashboardMetricCard :label="t('users.summary.total')" :value="users.length" icon="i-lucide-users" />
      <DashboardMetricCard :label="t('users.summary.admins')" :value="adminUsers" icon="i-lucide-shield-check" />
      <DashboardMetricCard :label="t('users.summary.socialWork')" :value="socialWorkers" icon="i-lucide-hand-heart" />
    </div>

    <div class="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
      <UCard>
        <template #header>
          <div class="space-y-1">
            <h2 class="text-base font-semibold text-gray-950 dark:text-white">{{ t('users.createTitle') }}</h2>
            <p class="text-sm text-gray-500 dark:text-gray-400">{{ t('users.formHint') }}</p>
          </div>
        </template>

        <form class="space-y-4" @submit.prevent="saveUser">
          <UFormField :label="t('common.name')" required :error="submitted ? nameError : ''">
            <UInput v-model="form.name" icon="i-lucide-user" :placeholder="t('common.name')" autocomplete="name" class="w-full" />
          </UFormField>

          <UFormField :label="t('common.email')" required :error="submitted ? emailError : ''">
            <UInput v-model="form.email" icon="i-lucide-mail" type="email" placeholder="name@example.org" autocomplete="email" class="w-full" />
          </UFormField>

          <UFormField :label="t('common.password')" required :error="submitted ? passwordError : ''" :hint="t('users.passwordHint')">
            <UInput v-model="form.password" icon="i-lucide-lock-keyhole" type="password" :placeholder="t('common.password')" autocomplete="new-password" class="w-full" />
          </UFormField>

          <UFormField :label="t('common.role')">
            <select v-model="form.role" class="h-9 w-full rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-950 dark:border-gray-700 dark:bg-gray-950 dark:text-white">
              <option v-for="role in roles" :key="role" :value="role">{{ roleLabel(role) }}</option>
            </select>
          </UFormField>

          <UFormField v-if="form.role === 'ADMIN'" :label="t('common.organization')" :error="submitted ? organizationError : ''">
            <select v-model.number="organizationId" class="h-9 w-full rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-950 dark:border-gray-700 dark:bg-gray-950 dark:text-white">
              <option :value="undefined">{{ t('users.noOrganization') }}</option>
              <option v-for="organization in organizations" :key="organization.id" :value="organization.id">
                {{ organization.name || organization.id }}
              </option>
            </select>
          </UFormField>

          <FeedbackAlert :message="message" :type="messageType" />

          <FormActions :submit-label="t('common.add')" submit-icon="i-lucide-user-plus" :loading="saving" :disabled="saving" />
        </form>
      </UCard>

      <EntityListCard
        v-model="query"
        :loading="pending"
        :empty="filteredUsers.length === 0"
        :empty-text="emptyText"
      >
        <div class="space-y-3 md:hidden">
          <article v-for="user in filteredUsers" :key="user.id || user.email" class="rounded border border-gray-200 p-4 dark:border-gray-800">
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0">
                <h3 class="truncate font-medium text-gray-950 dark:text-white">{{ user.name || '-' }}</h3>
                <p class="mt-1 truncate text-sm text-gray-500 dark:text-gray-400">{{ user.email || '-' }}</p>
              </div>
              <UBadge color="neutral" variant="soft">{{ roleLabel(user.role) }}</UBadge>
            </div>
            <p class="mt-4 text-sm text-gray-600 dark:text-gray-300">{{ organizationName(user) }}</p>
          </article>
        </div>

        <table class="hidden w-full min-w-[760px] border-collapse text-left text-sm md:table">
          <thead>
            <tr class="border-b border-gray-200 text-gray-500 dark:border-gray-800 dark:text-gray-400">
              <th class="py-3 pr-4 font-medium">{{ t('common.name') }}</th>
              <th class="py-3 pr-4 font-medium">{{ t('common.email') }}</th>
              <th class="py-3 pr-4 font-medium">{{ t('common.role') }}</th>
              <th class="py-3 pr-0 font-medium">{{ t('common.organization') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in filteredUsers" :key="user.id" class="border-b border-gray-100 dark:border-gray-800">
              <td class="py-3 pr-4 font-medium text-gray-950 dark:text-white">{{ user.name || '-' }}</td>
              <td class="py-3 pr-4 text-gray-600 dark:text-gray-300">{{ user.email || '-' }}</td>
              <td class="py-3 pr-4">
                <UBadge color="neutral" variant="soft">{{ roleLabel(user.role) }}</UBadge>
              </td>
              <td class="py-3 pr-0 text-gray-600 dark:text-gray-300">{{ organizationName(user) }}</td>
            </tr>
          </tbody>
        </table>
      </EntityListCard>
    </div>
  </section>
</template>

<script setup lang="ts">
import { creatableUserRoles } from '~/types/api'
import type { CreateAdminRequest, CreateUserRequest, Organization, User, UserRole } from '~/types/api'

definePageMeta({ middleware: 'auth' })

const api = useApi()
const auth = useAuth()
const { t } = useI18n()
const roles = computed(() => auth.isSuperAdmin.value ? creatableUserRoles : creatableUserRoles.filter((role) => role !== 'ADMIN'))
const pending = ref(false)
const saving = ref(false)
const submitted = ref(false)
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

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const nameError = computed(() => (form.name?.trim() ? '' : t('common.required')))
const emailError = computed(() => {
  if (!form.email?.trim()) return t('common.required')
  return emailPattern.test(form.email.trim()) ? '' : t('common.invalidEmail')
})
const passwordError = computed(() => {
  if (!form.password) return t('common.required')
  return form.password.length >= 6 ? '' : t('users.passwordTooShort')
})
const organizationError = computed(() => (form.role === 'ADMIN' && !organizationId.value ? t('users.organizationRequired') : ''))
const canSave = computed(() => !nameError.value && !emailError.value && !passwordError.value && !organizationError.value)
const adminUsers = computed(() => users.value.filter((user) => user.role === 'ADMIN' || user.role === 'SUPER_ADMIN').length)
const socialWorkers = computed(() => users.value.filter((user) => user.role === 'SOCIAL_WORKER').length)
const emptyText = computed(() => (query.value ? t('common.noEntries') : t('users.noUsers')))

const roleLabel = (role?: UserRole) => (role ? t(`users.roles.${role}`) : '-')

const organizationName = (user: User) => {
  const organizationId = user.organizationId || user.organization?.id
  const organization = organizations.value.find((item) => Number(item.id) === Number(organizationId))

  return user.organization?.name || organization?.name || (organizationId ? `#${organizationId}` : t('users.noOrganization'))
}

const filteredUsers = computed(() => {
  const needle = query.value.trim().toLowerCase()
  if (!needle) return users.value

  return users.value.filter((user) =>
    [user.name, user.email, roleLabel(user.role), organizationName(user)].some((value) =>
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
    showMessage(t('users.loadError'), 'error')
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
  submitted.value = false
  form.name = ''
  form.email = ''
  form.password = ''
  form.role = auth.isSuperAdmin.value ? 'ADMIN' : 'USER'
  organizationId.value = undefined
}

const saveUser = async () => {
  submitted.value = true
  if (!canSave.value) return

  saving.value = true
  try {
    if (form.role === 'ADMIN') {
      const request: CreateAdminRequest = {
        name: form.name?.trim(),
        email: form.email?.trim(),
        password: form.password,
      }
      await api<User>(`super-admin/organizations/${organizationId.value}/admins`, { method: 'POST', body: request })
    } else {
      const request: CreateUserRequest = {
        name: form.name?.trim(),
        email: form.email?.trim(),
        password: form.password,
        role: form.role,
      }
      await api<User>('admin/users', { method: 'POST', body: request })
    }

    showMessage(t('users.created'), 'success')
    resetForm()
    await loadUsers()
  } catch {
    showMessage(t('users.createError'), 'error')
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  auth.loadToken()
  resetForm()
  await Promise.all([loadUsers(), auth.isSuperAdmin.value ? loadOrganizations() : Promise.resolve()])
})
</script>
