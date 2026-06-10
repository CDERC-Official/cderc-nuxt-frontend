<template>
  <section class="page-shell space-y-6">
    <div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p class="text-sm font-medium uppercase tracking-wide text-primary-700">Organisationen</p>
        <h1 class="mt-1 text-3xl font-semibold text-gray-950">Organisationen verwalten</h1>
      </div>
      <UButton icon="i-lucide-refresh-cw" variant="soft" :loading="pending" @click="loadOrganizations">Aktualisieren</UButton>
    </div>

    <div class="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
      <UCard>
        <template #header>
          <h2 class="text-base font-semibold text-gray-950">
            {{ editingId ? 'Organisation bearbeiten' : 'Organisation erfassen' }}
          </h2>
        </template>

        <form class="space-y-4" @submit.prevent="saveOrganization">
          <UFormField label="Name" required>
            <UInput v-model="form.name" icon="i-lucide-building-2" placeholder="Name" class="w-full" />
          </UFormField>

          <UFormField label="E-Mail">
            <UInput v-model="form.email" icon="i-lucide-mail" type="email" placeholder="kontakt@example.org" class="w-full" />
          </UFormField>

          <UFormField label="Logo URL">
            <UInput v-model="form.logo" icon="i-lucide-image" placeholder="https://..." class="w-full" />
          </UFormField>

          <UFormField label="Theme-Farbe">
            <div class="flex gap-2">
              <input v-model="form.themeColor" type="color" class="h-9 w-12 rounded border border-gray-300 bg-white p-1" aria-label="Theme-Farbe" />
              <UInput v-model="form.themeColor" placeholder="#16a34a" class="w-full" />
            </div>
          </UFormField>

          <UAlert
            v-if="message"
            :color="messageType"
            variant="soft"
            :icon="messageType === 'success' ? 'i-lucide-circle-check' : 'i-lucide-circle-alert'"
            :description="message"
          />

          <div class="flex flex-wrap gap-2">
            <UButton type="submit" icon="i-lucide-save" :loading="saving" :disabled="!form.name">Speichern</UButton>
            <UButton v-if="editingId" type="button" icon="i-lucide-x" variant="ghost" color="neutral" @click="resetForm">
              Abbrechen
            </UButton>
          </div>
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
        <div v-else-if="filteredOrganizations.length === 0" class="py-10 text-center text-sm text-gray-500">
          Keine Organisationen gefunden.
        </div>
        <div v-else class="overflow-x-auto">
          <table class="w-full min-w-[720px] border-collapse text-left text-sm">
            <thead>
              <tr class="border-b border-gray-200 text-gray-500">
                <th class="py-3 pr-4 font-medium">Name</th>
                <th class="py-3 pr-4 font-medium">E-Mail</th>
                <th class="py-3 pr-4 font-medium">Farbe</th>
                <th class="py-3 pr-0 text-right font-medium">Aktionen</th>
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
                  <div class="flex justify-end gap-1">
                    <UButton icon="i-lucide-pencil" size="sm" variant="ghost" color="neutral" aria-label="Bearbeiten" @click="editOrganization(organization)" />
                    <UButton icon="i-lucide-trash-2" size="sm" variant="ghost" color="error" aria-label="Loeschen" @click="deleteOrganization(organization)" />
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </UCard>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { Organization } from '~/types/api'

definePageMeta({ middleware: 'auth' })

const api = useApi()
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
    showMessage('Organisationen konnten nicht geladen werden.', 'error')
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
      showMessage('Organisation wurde aktualisiert.', 'success')
    } else {
      await api<Organization>('super-admin/organizations', {
        method: 'POST',
        body: { ...form },
      })
      showMessage('Organisation wurde erfasst.', 'success')
    }

    resetForm()
    await loadOrganizations()
  } catch {
    showMessage('Speichern fehlgeschlagen.', 'error')
  } finally {
    saving.value = false
  }
}

const deleteOrganization = async (organization: Organization) => {
  if (!organization.id || !confirm(`Organisation "${organization.name || organization.id}" loeschen?`)) {
    return
  }

  try {
    await api<void>(`super-admin/organizations/${organization.id}`, { method: 'DELETE' })
    showMessage('Organisation wurde geloescht.', 'success')
    await loadOrganizations()
  } catch {
    showMessage('Loeschen fehlgeschlagen.', 'error')
  }
}

onMounted(loadOrganizations)
</script>
