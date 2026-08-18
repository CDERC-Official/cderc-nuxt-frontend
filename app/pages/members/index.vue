<template>
  <section class="page-shell space-y-6">
    <PageHeader :eyebrow="t('members.eyebrow')" :title="t('members.title')">
      <template #actions>
        <UButton icon="i-lucide-refresh-cw" variant="soft" :loading="pending" @click="loadMembers">{{ t('common.refresh') }}</UButton>
      </template>
    </PageHeader>

    <div class="grid gap-4 sm:grid-cols-4">
      <DashboardMetricCard :label="t('members.summary.total')" :value="members.length" icon="i-lucide-users" />
      <DashboardMetricCard :label="t('members.summary.active')" :value="activeMembers" icon="i-lucide-user-check" />
      <DashboardMetricCard :label="t('members.summary.board')" :value="boardMembers" icon="i-lucide-shield-check" />
      <DashboardMetricCard :label="t('members.summary.volunteers')" :value="volunteers" icon="i-lucide-hand-heart" />
    </div>

    <div class="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
      <UCard>
        <template #header>
          <div class="space-y-1">
            <h2 class="text-base font-semibold text-gray-950 dark:text-white">{{ editingId ? t('members.editTitle') : t('members.createTitle') }}</h2>
            <p class="text-sm text-gray-500 dark:text-gray-400">{{ t('members.formHint') }}</p>
          </div>
        </template>

        <form class="space-y-4" @submit.prevent="saveMember">
          <div class="grid gap-4 sm:grid-cols-2">
            <UFormField :label="t('members.firstName')" required :error="submitted ? firstNameError : ''">
              <UInput v-model="form.firstName" icon="i-lucide-user" :placeholder="t('members.firstName')" autocomplete="given-name" class="w-full" />
            </UFormField>
            <UFormField :label="t('members.lastName')" required :error="submitted ? lastNameError : ''">
              <UInput v-model="form.lastName" icon="i-lucide-user" :placeholder="t('members.lastName')" autocomplete="family-name" class="w-full" />
            </UFormField>
          </div>

          <UFormField :label="t('common.email')" :error="submitted ? emailError : ''">
            <UInput v-model="form.email" icon="i-lucide-mail" type="email" placeholder="name@example.org" autocomplete="email" class="w-full" />
          </UFormField>

          <UFormField :label="t('members.phone')">
            <UInput v-model="form.phone" icon="i-lucide-phone" :placeholder="t('members.phone')" autocomplete="tel" class="w-full" />
          </UFormField>

          <div class="grid gap-4 sm:grid-cols-2">
            <UFormField :label="t('members.status')">
              <select v-model="form.status" class="h-9 w-full rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-950 dark:border-gray-700 dark:bg-gray-950 dark:text-white">
                <option v-for="status in memberStatuses" :key="status" :value="status">{{ statusLabel(status) }}</option>
              </select>
            </UFormField>
            <UFormField :label="t('members.type')">
              <select v-model="form.type" class="h-9 w-full rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-950 dark:border-gray-700 dark:bg-gray-950 dark:text-white">
                <option v-for="type in memberTypes" :key="type" :value="type">{{ typeLabel(type) }}</option>
              </select>
            </UFormField>
          </div>

          <div class="grid gap-4 sm:grid-cols-2">
            <UFormField :label="t('members.birthDate')">
              <UInput v-model="form.birthDate" icon="i-lucide-cake" type="date" class="w-full" />
            </UFormField>
            <UFormField :label="t('members.joinedAt')">
              <UInput v-model="form.joinedAt" icon="i-lucide-calendar-plus" type="date" class="w-full" />
            </UFormField>
          </div>

          <UFormField :label="t('members.address')">
            <UInput v-model="form.address" icon="i-lucide-map-pin" :placeholder="t('members.address')" autocomplete="street-address" class="w-full" />
          </UFormField>

          <div class="grid gap-4 sm:grid-cols-2">
            <UFormField :label="t('members.city')">
              <UInput v-model="form.city" icon="i-lucide-building-2" :placeholder="t('members.city')" autocomplete="address-level2" class="w-full" />
            </UFormField>
            <UFormField :label="t('members.country')">
              <UInput v-model="form.country" icon="i-lucide-globe-2" :placeholder="t('members.country')" autocomplete="country-name" class="w-full" />
            </UFormField>
          </div>

          <FeedbackAlert :message="message" :type="messageType" />

          <FormActions
            :submit-label="editingId ? t('common.save') : t('common.add')"
            :submit-icon="editingId ? 'i-lucide-save' : 'i-lucide-user-plus'"
            :loading="saving"
            :disabled="saving"
            :show-cancel="Boolean(editingId)"
            @cancel="resetForm"
          />
        </form>
      </UCard>

      <EntityListCard
        v-model="query"
        :loading="pending"
        :empty="filteredMembers.length === 0"
        :empty-text="emptyText"
      >
        <div class="space-y-3 md:hidden">
          <article v-for="member in filteredMembers" :key="member.id || member.email" class="rounded border border-gray-200 p-4 dark:border-gray-800">
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0">
                <h3 class="truncate font-medium text-gray-950 dark:text-white">{{ fullName(member) }}</h3>
                <p class="mt-1 truncate text-sm text-gray-500 dark:text-gray-400">{{ member.email || member.phone || '-' }}</p>
              </div>
              <RowActions @edit="editMember(member)" @delete="deleteMember(member)" />
            </div>
            <div class="mt-4 flex flex-wrap gap-2">
              <UBadge color="neutral" variant="soft">{{ statusLabel(member.status) }}</UBadge>
              <UBadge color="primary" variant="soft">{{ typeLabel(member.type) }}</UBadge>
            </div>
          </article>
        </div>

        <table class="hidden w-full min-w-[920px] border-collapse text-left text-sm md:table">
          <thead>
            <tr class="border-b border-gray-200 text-gray-500 dark:border-gray-800 dark:text-gray-400">
              <th class="py-3 pr-4 font-medium">{{ t('common.name') }}</th>
              <th class="py-3 pr-4 font-medium">{{ t('common.email') }}</th>
              <th class="py-3 pr-4 font-medium">{{ t('members.phone') }}</th>
              <th class="py-3 pr-4 font-medium">{{ t('members.status') }}</th>
              <th class="py-3 pr-4 font-medium">{{ t('members.type') }}</th>
              <th class="py-3 pr-0 text-right font-medium">{{ t('common.actions') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="member in filteredMembers" :key="member.id" class="border-b border-gray-100 dark:border-gray-800">
              <td class="py-3 pr-4 font-medium text-gray-950 dark:text-white">{{ fullName(member) }}</td>
              <td class="py-3 pr-4 text-gray-600 dark:text-gray-300">{{ member.email || '-' }}</td>
              <td class="py-3 pr-4 text-gray-600 dark:text-gray-300">{{ member.phone || '-' }}</td>
              <td class="py-3 pr-4"><UBadge color="neutral" variant="soft">{{ statusLabel(member.status) }}</UBadge></td>
              <td class="py-3 pr-4"><UBadge color="primary" variant="soft">{{ typeLabel(member.type) }}</UBadge></td>
              <td class="py-3 pr-0"><RowActions @edit="editMember(member)" @delete="deleteMember(member)" /></td>
            </tr>
          </tbody>
        </table>
      </EntityListCard>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { ApiError, MemberRequest, MemberResponse, MemberStatus, MemberType } from '~/types/api'

definePageMeta({ middleware: 'auth' })

const api = useApi()
const { t } = useI18n()
const pending = ref(false)
const saving = ref(false)
const submitted = ref(false)
const members = ref<MemberResponse[]>([])
const query = ref('')
const editingId = ref<number | null>(null)
const message = ref('')
const messageType = ref<'success' | 'error'>('success')
const memberStatuses: MemberStatus[] = ['ACTIVE', 'INACTIVE', 'PENDING', 'CANCELLED']
const memberTypes: MemberType[] = ['REGULAR_MEMBER', 'SUPPORTING_MEMBER', 'VOLUNTEER', 'BOARD_MEMBER', 'DONOR']
const form = reactive<MemberRequest>({
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  address: '',
  city: '',
  country: '',
  birthDate: '',
  joinedAt: '',
  status: 'ACTIVE',
  type: 'REGULAR_MEMBER',
})

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const firstNameError = computed(() => form.firstName?.trim() ? '' : t('common.required'))
const lastNameError = computed(() => form.lastName?.trim() ? '' : t('common.required'))
const emailError = computed(() => {
  if (!form.email?.trim()) return ''
  return emailPattern.test(form.email.trim()) ? '' : t('common.invalidEmail')
})
const canSave = computed(() => !firstNameError.value && !lastNameError.value && !emailError.value)
const activeMembers = computed(() => members.value.filter((member) => member.status === 'ACTIVE').length)
const boardMembers = computed(() => members.value.filter((member) => member.type === 'BOARD_MEMBER').length)
const volunteers = computed(() => members.value.filter((member) => member.type === 'VOLUNTEER').length)
const emptyText = computed(() => query.value ? t('common.noEntries') : t('members.noMembers'))

const fullName = (member: MemberResponse) => [member.firstName, member.lastName].filter(Boolean).join(' ') || '-'
const statusLabel = (status?: MemberStatus) => status ? t(`members.statuses.${status}`) : '-'
const typeLabel = (type?: MemberType) => type ? t(`members.types.${type}`) : '-'

const filteredMembers = computed(() => {
  const needle = query.value.trim().toLowerCase()
  if (!needle) return members.value

  return members.value.filter((member) =>
    [fullName(member), member.email, member.phone, member.city, statusLabel(member.status), typeLabel(member.type)].some((value) =>
      String(value || '').toLowerCase().includes(needle),
    ),
  )
})

const showMessage = (text: string, type: 'success' | 'error') => {
  message.value = text
  messageType.value = type
}

const cleanOptional = (value?: string) => {
  const trimmed = value?.trim()
  return trimmed || undefined
}

const buildRequest = (): MemberRequest => ({
  firstName: cleanOptional(form.firstName),
  lastName: cleanOptional(form.lastName),
  email: cleanOptional(form.email)?.toLowerCase(),
  phone: cleanOptional(form.phone),
  address: cleanOptional(form.address),
  city: cleanOptional(form.city),
  country: cleanOptional(form.country),
  birthDate: form.birthDate || undefined,
  joinedAt: form.joinedAt || undefined,
  status: form.status,
  type: form.type,
})

const loadMembers = async () => {
  pending.value = true
  try {
    members.value = await api<MemberResponse[]>('admin/members')
  } catch (error) {
    members.value = []
    const apiError = error as ApiError
    showMessage(apiError.message || t('members.loadError'), 'error')
  } finally {
    pending.value = false
  }
}

const resetForm = () => {
  submitted.value = false
  editingId.value = null
  form.firstName = ''
  form.lastName = ''
  form.email = ''
  form.phone = ''
  form.address = ''
  form.city = ''
  form.country = ''
  form.birthDate = ''
  form.joinedAt = new Date().toISOString().slice(0, 10)
  form.status = 'ACTIVE'
  form.type = 'REGULAR_MEMBER'
}

const editMember = (member: MemberResponse) => {
  submitted.value = false
  editingId.value = member.id ?? null
  form.firstName = member.firstName || ''
  form.lastName = member.lastName || ''
  form.email = member.email || ''
  form.phone = member.phone || ''
  form.address = member.address || ''
  form.city = member.city || ''
  form.country = member.country || ''
  form.birthDate = member.birthDate || ''
  form.joinedAt = member.joinedAt || ''
  form.status = member.status || 'ACTIVE'
  form.type = member.type || 'REGULAR_MEMBER'
}

const saveMember = async () => {
  submitted.value = true
  if (!canSave.value) return

  saving.value = true
  try {
    const body = buildRequest()
    if (editingId.value) {
      await api<MemberResponse>(`admin/members/${editingId.value}`, { method: 'PUT', body })
      showMessage(t('members.updated'), 'success')
    } else {
      await api<MemberResponse>('admin/members', { method: 'POST', body })
      showMessage(t('members.created'), 'success')
    }
    resetForm()
    await loadMembers()
  } catch (error) {
    const apiError = error as ApiError
    showMessage(apiError.message || t('members.saveError'), 'error')
  } finally {
    saving.value = false
  }
}

const deleteMember = async (member: MemberResponse) => {
  if (!member.id || !confirm(t('members.confirmDelete', { name: fullName(member) }))) return

  try {
    await api<void>(`admin/members/${member.id}`, { method: 'DELETE' })
    showMessage(t('members.deleted'), 'success')
    if (editingId.value === member.id) resetForm()
    await loadMembers()
  } catch (error) {
    const apiError = error as ApiError
    showMessage(apiError.message || t('members.deleteError'), 'error')
  }
}

onMounted(async () => {
  resetForm()
  await loadMembers()
})
</script>
