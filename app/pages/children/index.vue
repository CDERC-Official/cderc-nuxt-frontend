<template>
  <section class="page-shell space-y-6">
    <PageHeader :eyebrow="t('children.eyebrow')" :title="t('children.title')">
      <template #actions>
        <UButton icon="i-lucide-refresh-cw" variant="soft" :loading="pending" @click="loadChildren">{{ t('common.refresh') }}</UButton>
      </template>
    </PageHeader>

    <div class="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
      <UCard>
        <template #header>
          <h2 class="text-base font-semibold text-gray-950">{{ editingId ? t('children.editTitle') : t('children.createTitle') }}</h2>
        </template>

        <form class="space-y-4" @submit.prevent="saveChild">
          <UFormField :label="t('common.name')" required>
            <UInput v-model="form.name" icon="i-lucide-user" :placeholder="t('common.name')" class="w-full" />
          </UFormField>

          <UFormField :label="t('children.gender')">
            <UInput v-model="form.gender" icon="i-lucide-venus-and-mars" :placeholder="t('children.genderPlaceholder')" class="w-full" />
          </UFormField>

          <UFormField :label="t('children.healthStatus')">
            <UInput v-model="form.healthStatus" icon="i-lucide-heart-pulse" :placeholder="t('common.status')" class="w-full" />
          </UFormField>

          <UFormField :label="t('children.schoolStatus')">
            <UInput v-model="form.schoolStatus" icon="i-lucide-graduation-cap" :placeholder="t('common.status')" class="w-full" />
          </UFormField>

          <FeedbackAlert :message="message" :type="messageType" />

          <FormActions :loading="saving" :disabled="!form.name" :show-cancel="Boolean(editingId)" @cancel="resetForm" />
        </form>
      </UCard>

      <EntityListCard v-model="query" :loading="pending" :empty="filteredChildren.length === 0">
        <table class="w-full min-w-[680px] border-collapse text-left text-sm">
          <thead>
            <tr class="border-b border-gray-200 text-gray-500">
              <th class="py-3 pr-4 font-medium">{{ t('common.name') }}</th>
              <th class="py-3 pr-4 font-medium">{{ t('children.gender') }}</th>
              <th class="py-3 pr-4 font-medium">{{ t('children.health') }}</th>
              <th class="py-3 pr-4 font-medium">{{ t('children.school') }}</th>
              <th class="py-3 pr-0 text-right font-medium">{{ t('common.actions') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="child in filteredChildren" :key="child.id" class="border-b border-gray-100">
              <td class="py-3 pr-4 font-medium text-gray-950">{{ child.name || '-' }}</td>
              <td class="py-3 pr-4 text-gray-600">{{ child.gender || '-' }}</td>
              <td class="py-3 pr-4 text-gray-600">{{ child.healthStatus || '-' }}</td>
              <td class="py-3 pr-4 text-gray-600">{{ child.schoolStatus || '-' }}</td>
              <td class="py-3 pr-0">
                <RowActions @edit="editChild(child)" @delete="deleteChild(child)" />
              </td>
            </tr>
          </tbody>
        </table>
      </EntityListCard>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { ChildRequest, ChildResponse } from '~/types/api'

definePageMeta({ middleware: 'auth' })

const api = useApi()
const { t } = useI18n()
const pending = ref(false)
const saving = ref(false)
const children = ref<ChildResponse[]>([])
const query = ref('')
const editingId = ref<number | null>(null)
const message = ref('')
const messageType = ref<'success' | 'error'>('success')
const form = reactive<ChildRequest>({
  name: '',
  gender: '',
  healthStatus: '',
  schoolStatus: '',
})

const filteredChildren = computed(() => {
  const needle = query.value.trim().toLowerCase()
  if (!needle) return children.value

  return children.value.filter((child) =>
    [child.name, child.gender, child.healthStatus, child.schoolStatus].some((value) =>
      String(value || '').toLowerCase().includes(needle),
    ),
  )
})

const showMessage = (text: string, type: 'success' | 'error') => {
  message.value = text
  messageType.value = type
}

const loadChildren = async () => {
  pending.value = true
  try {
    children.value = await api<ChildResponse[]>('children')
  } catch {
    showMessage(t('children.loadError'), 'error')
  } finally {
    pending.value = false
  }
}

const resetForm = () => {
  editingId.value = null
  form.name = ''
  form.gender = ''
  form.healthStatus = ''
  form.schoolStatus = ''
}

const editChild = (child: ChildResponse) => {
  editingId.value = child.id ?? null
  form.name = child.name || ''
  form.gender = child.gender || ''
  form.healthStatus = child.healthStatus || ''
  form.schoolStatus = child.schoolStatus || ''
}

const saveChild = async () => {
  saving.value = true
  try {
    if (editingId.value) {
      await api<ChildResponse>(`children/${editingId.value}`, {
        method: 'PUT',
        body: { ...form },
      })
      showMessage(t('children.updated'), 'success')
    } else {
      await api<ChildResponse>('children', {
        method: 'POST',
        body: { ...form },
      })
      showMessage(t('children.created'), 'success')
    }

    resetForm()
    await loadChildren()
  } catch {
    showMessage(t('children.saveError'), 'error')
  } finally {
    saving.value = false
  }
}

const deleteChild = async (child: ChildResponse) => {
  if (!child.id || !confirm(t('children.confirmDelete', { name: child.name || child.id }))) {
    return
  }

  try {
    await api<void>(`children/${child.id}`, { method: 'DELETE' })
    showMessage(t('children.deleted'), 'success')
    await loadChildren()
  } catch {
    showMessage(t('children.deleteError'), 'error')
  }
}

onMounted(loadChildren)
</script>
