<template>
  <section class="page-shell space-y-6">
    <PageHeader :eyebrow="t('organizations.eyebrow')" :title="t('organizations.title')">
      <template #actions>
        <UButton icon="i-lucide-refresh-cw" variant="soft" :loading="pending" @click="loadOrganizations">{{ t('common.refresh') }}</UButton>
      </template>
    </PageHeader>

    <div class="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
      <UCard>
        <template #header>
          <h2 class="text-base font-semibold text-gray-950">
            {{ editingId ? t('organizations.editTitle') : t('organizations.createTitle') }}
          </h2>
        </template>

        <form class="space-y-4" @submit.prevent="saveOrganization">
          <UFormField :label="t('common.name')" required>
            <UInput v-model="form.name" icon="i-lucide-building-2" :placeholder="t('common.name')" class="w-full" />
          </UFormField>

          <UFormField :label="t('common.email')">
            <UInput v-model="form.email" icon="i-lucide-mail" type="email" placeholder="kontakt@example.org" class="w-full" />
          </UFormField>

          <UFormField :label="t('organizations.logoUrl')">
            <UInput v-model="form.logo" icon="i-lucide-image" placeholder="https://..." class="w-full" />
          </UFormField>

          <UFormField :label="t('organizations.themeColor')">
            <div class="flex gap-2">
              <input v-model="form.themeColor" type="color" class="h-9 w-12 rounded border border-gray-300 bg-white p-1" :aria-label="t('organizations.themeColor')" />
              <UInput v-model="form.themeColor" placeholder="#16a34a" class="w-full" />
            </div>
          </UFormField>

          <FeedbackAlert :message="message" :type="messageType" />

          <FormActions :loading="saving" :disabled="!form.name" :show-cancel="Boolean(editingId)" @cancel="resetForm" />
        </form>
      </UCard>

      <EntityListCard
        v-model="query"
        :loading="pending"
        :empty="filteredOrganizations.length === 0"
        :empty-text="t('organizations.noOrganizations')"
      >
        <table class="w-full min-w-[720px] border-collapse text-left text-sm">
          <thead>
            <tr class="border-b border-gray-200 text-gray-500">
              <th class="py-3 pr-4 font-medium">{{ t('common.name') }}</th>
              <th class="py-3 pr-4 font-medium">{{ t('common.email') }}</th>
              <th class="py-3 pr-4 font-medium">{{ t('common.color') }}</th>
              <th class="py-3 pr-0 text-right font-medium">{{ t('common.actions') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="organization in filteredOrganizations" :key="organization.id" class="border-b border-gray-100">
              <td class="py-3 pr-4 font-medium text-gray-950">{{ organization.name || '-' }}</td>
              <td class="py-3 pr-4 text-gray-600">{{ organization.email || '-' }}</td>
              <td class="py-3 pr-4">
                <span class="inline-flex items-center gap-2 text-gray-600">
                  <span class="size-4 rounded border border-gray-200" :style="{ backgroundColor: organization.themeColor || '#e5e7eb' }" />
                  {{ organization.themeColor || '-' }}
                </span>
              </td>
              <td class="py-3 pr-0">
                <RowActions @edit="editOrganization(organization)" @delete="deleteOrganization(organization)" />
              </td>
            </tr>
          </tbody>
        </table>
      </EntityListCard>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { Organization } from '~/types/api'

definePageMeta({ middleware: 'auth' })

const api = useApi()
const { t } = useI18n()
const pending = ref(false)
const saving = ref(false)
const organizations = ref<Organization[]>([])
const query = ref('')
const editingId = ref<number | null>(null)
const message = ref('')
const messageType = ref<'success' | 'error'>('success')
const form = reactive<Organization>({
  name: '',
  email: '',
  logo: '',
  themeColor: '#16a34a',
})

const filteredOrganizations = computed(() => {
  const needle = query.value.trim().toLowerCase()
  if (!needle) return organizations.value

  return organizations.value.filter((organization) =>
    [organization.name, organization.email, organization.themeColor].some((value) =>
      String(value || '').toLowerCase().includes(needle),
    ),
  )
})

const showMessage = (text: string, type: 'success' | 'error') => {
  message.value = text
  messageType.value = type
}

const loadOrganizations = async () => {
  pending.value = true
  try {
    organizations.value = await api<Organization[]>('super-admin/organizations')
  } catch {
    showMessage(t('organizations.loadError'), 'error')
  } finally {
    pending.value = false
  }
}

const resetForm = () => {
  editingId.value = null
  form.name = ''
  form.email = ''
  form.logo = ''
  form.themeColor = '#16a34a'
}

const editOrganization = (organization: Organization) => {
  editingId.value = organization.id ?? null
  form.name = organization.name || ''
  form.email = organization.email || ''
  form.logo = organization.logo || ''
  form.themeColor = organization.themeColor || '#16a34a'
}

const saveOrganization = async () => {
  saving.value = true
  try {
    if (editingId.value) {
      await api<Organization>(`super-admin/organizations/${editingId.value}`, {
        method: 'PUT',
        body: { ...form },
      })
      showMessage(t('organizations.updated'), 'success')
    } else {
      await api<Organization>('super-admin/organizations', {
        method: 'POST',
        body: { ...form },
      })
      showMessage(t('organizations.created'), 'success')
    }

    resetForm()
    await loadOrganizations()
  } catch {
    showMessage(t('organizations.saveError'), 'error')
  } finally {
    saving.value = false
  }
}

const deleteOrganization = async (organization: Organization) => {
  if (!organization.id || !confirm(t('organizations.confirmDelete', { name: organization.name || organization.id }))) {
    return
  }

  try {
    await api<void>(`super-admin/organizations/${organization.id}`, { method: 'DELETE' })
    showMessage(t('organizations.deleted'), 'success')
    await loadOrganizations()
  } catch {
    showMessage(t('organizations.deleteError'), 'error')
  }
}

onMounted(loadOrganizations)
</script>
