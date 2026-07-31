<template>
  <section class="page-shell space-y-6">
    <PageHeader :eyebrow="t('expenses.eyebrow')" :title="t('expenses.title')">
      <template #actions>
        <UButton icon="i-lucide-refresh-cw" variant="soft" :loading="pending || expensePending" @click="reload">{{ t('common.refresh') }}</UButton>
      </template>
    </PageHeader>

    <div class="grid gap-4 sm:grid-cols-3">
      <DashboardMetricCard :label="t('expenses.total')" :value="formatMoney(totalExpenses)" icon="i-lucide-euro" />
      <DashboardMetricCard :label="t('expenses.count')" :value="expenses.length" icon="i-lucide-receipt" />
      <DashboardMetricCard :label="t('expenses.child')" :value="selectedChild?.name || '-'" icon="i-lucide-user" />
    </div>

    <UCard>
      <div class="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
        <UFormField :label="t('expenses.child')">
          <select v-model.number="selectedChildId" class="h-9 w-full rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-950 dark:border-gray-700 dark:bg-gray-950 dark:text-white">
            <option :value="undefined">{{ t('expenses.selectChild') }}</option>
            <option v-for="child in children" :key="child.id" :value="child.id">{{ child.name || child.id }}</option>
          </select>
        </UFormField>
        <UButton icon="i-lucide-arrow-right" variant="soft" :disabled="!selectedChildId" @click="loadExpenses">{{ t('common.refresh') }}</UButton>
      </div>
    </UCard>

    <div class="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
      <UCard>
        <template #header>
          <div class="space-y-1">
            <h2 class="text-base font-semibold text-gray-950 dark:text-white">{{ editingId ? t('expenses.editTitle') : t('expenses.createTitle') }}</h2>
            <p class="text-sm text-gray-500 dark:text-gray-400">{{ t('expenses.formHint') }}</p>
          </div>
        </template>

        <form class="space-y-4" @submit.prevent="saveExpense">
          <UAlert v-if="!selectedChildId" color="warning" variant="soft" icon="i-lucide-circle-alert" :description="t('expenses.noChildSelected')" />

          <UFormField :label="t('common.title')" required :error="submitted ? titleError : ''">
            <UInput v-model="form.title" icon="i-lucide-receipt" :placeholder="t('common.title')" class="w-full" :disabled="!selectedChildId" />
          </UFormField>

          <div class="grid gap-4 sm:grid-cols-2">
            <UFormField :label="t('common.amount')" required :error="submitted ? amountError : ''">
              <UInput v-model.number="form.amount" icon="i-lucide-euro" type="number" min="0" step="0.01" class="w-full" :disabled="!selectedChildId" />
            </UFormField>
            <UFormField :label="t('common.date')" required :error="submitted ? dateError : ''">
              <UInput v-model="form.expenseDate" icon="i-lucide-calendar" type="date" class="w-full" :disabled="!selectedChildId" />
            </UFormField>
          </div>

          <UFormField :label="t('common.category')">
            <select v-model="form.category" class="h-9 w-full rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-950 dark:border-gray-700 dark:bg-gray-950 dark:text-white" :disabled="!selectedChildId">
              <option v-for="category in categories" :key="category" :value="category">{{ categoryLabel(category) }}</option>
            </select>
          </UFormField>

          <UFormField :label="t('common.description')">
            <textarea v-model="form.description" class="min-h-24 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-950 dark:border-gray-700 dark:bg-gray-950 dark:text-white" :placeholder="t('common.description')" :disabled="!selectedChildId" />
          </UFormField>

          <FeedbackAlert :message="message" :type="messageType" />
          <FormActions :submit-label="editingId ? t('common.save') : t('common.add')" submit-icon="i-lucide-receipt" :loading="saving" :disabled="saving || !selectedChildId" :show-cancel="Boolean(editingId)" @cancel="resetForm" />
        </form>
      </UCard>

      <EntityListCard v-model="query" :loading="expensePending" :empty="filteredExpenses.length === 0" :empty-text="emptyText">
        <div class="space-y-3 md:hidden">
          <article v-for="expense in filteredExpenses" :key="expense.id || expense.title" class="rounded border border-gray-200 p-4 dark:border-gray-800">
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0">
                <h3 class="truncate font-medium text-gray-950 dark:text-white">{{ expense.title || '-' }}</h3>
                <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">{{ formatDate(expense.expenseDate) }}</p>
              </div>
              <RowActions @edit="editExpense(expense)" @delete="deleteExpense(expense)" />
            </div>
            <div class="mt-4 flex flex-wrap items-center gap-2">
              <UBadge color="neutral" variant="soft">{{ categoryLabel(expense.category) }}</UBadge>
              <span class="text-sm font-medium text-gray-900 dark:text-gray-100">{{ formatMoney(expense.amount) }}</span>
            </div>
          </article>
        </div>

        <table class="hidden w-full min-w-[760px] border-collapse text-left text-sm md:table">
          <thead>
            <tr class="border-b border-gray-200 text-gray-500 dark:border-gray-800 dark:text-gray-400">
              <th class="py-3 pr-4 font-medium">{{ t('common.title') }}</th>
              <th class="py-3 pr-4 font-medium">{{ t('common.amount') }}</th>
              <th class="py-3 pr-4 font-medium">{{ t('common.category') }}</th>
              <th class="py-3 pr-4 font-medium">{{ t('common.date') }}</th>
              <th class="py-3 pr-0 text-right font-medium">{{ t('common.actions') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="expense in filteredExpenses" :key="expense.id" class="border-b border-gray-100 dark:border-gray-800">
              <td class="py-3 pr-4 font-medium text-gray-950 dark:text-white">{{ expense.title || '-' }}</td>
              <td class="py-3 pr-4 text-gray-600 dark:text-gray-300">{{ formatMoney(expense.amount) }}</td>
              <td class="py-3 pr-4"><UBadge color="neutral" variant="soft">{{ categoryLabel(expense.category) }}</UBadge></td>
              <td class="py-3 pr-4 text-gray-600 dark:text-gray-300">{{ formatDate(expense.expenseDate) }}</td>
              <td class="py-3 pr-0"><RowActions @edit="editExpense(expense)" @delete="deleteExpense(expense)" /></td>
            </tr>
          </tbody>
        </table>
      </EntityListCard>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { ChildResponse, ExpenseCategory, ExpenseRequest, ExpenseResponse } from '~/types/api'

definePageMeta({ middleware: 'auth' })

const api = useApi()
const { t, locale } = useI18n()
const pending = ref(false)
const expensePending = ref(false)
const saving = ref(false)
const submitted = ref(false)
const children = ref<ChildResponse[]>([])
const expenses = ref<ExpenseResponse[]>([])
const selectedChildId = ref<number | undefined>(undefined)
const editingId = ref<number | null>(null)
const query = ref('')
const message = ref('')
const messageType = ref<'success' | 'error'>('success')
const categories: ExpenseCategory[] = ['SCHOOL_FEE', 'SCHOOL_MATERIAL', 'FOOD', 'HEALTH', 'CLOTHES', 'TRANSPORT', 'OTHER']
const form = reactive<ExpenseRequest>({ title: '', amount: undefined, expenseDate: '', category: 'FOOD', description: '' })

const selectedChild = computed(() => children.value.find((child) => Number(child.id) === Number(selectedChildId.value)))
const totalExpenses = computed(() => expenses.value.reduce((sum, expense) => sum + Number(expense.amount || 0), 0))
const titleError = computed(() => (form.title?.trim() ? '' : t('common.required')))
const amountError = computed(() => (Number(form.amount) > 0 ? '' : t('common.required')))
const dateError = computed(() => (form.expenseDate ? '' : t('common.required')))
const canSave = computed(() => Boolean(selectedChildId.value) && !titleError.value && !amountError.value && !dateError.value)
const emptyText = computed(() => (!selectedChildId.value ? t('expenses.noChildSelected') : query.value ? t('common.noEntries') : t('expenses.noExpenses')))

const filteredExpenses = computed(() => {
  const needle = query.value.trim().toLowerCase()
  if (!needle) return expenses.value
  return expenses.value.filter((expense) => [expense.title, expense.category, expense.description].some((value) => String(value || '').toLowerCase().includes(needle)))
})

const today = () => new Date().toISOString().slice(0, 10)
const formatDate = (value?: string) => (value ? new Intl.DateTimeFormat(locale.value).format(new Date(value)) : '-')
const formatMoney = (value?: number) => new Intl.NumberFormat(locale.value, { style: 'currency', currency: 'EUR' }).format(Number(value || 0))
const categoryLabel = (category?: string) => category ? category.replaceAll('_', ' ') : '-'

const showMessage = (text: string, type: 'success' | 'error') => {
  message.value = text
  messageType.value = type
}

const loadChildren = async () => {
  pending.value = true
  try {
    children.value = await api<ChildResponse[]>('children')
    if (!selectedChildId.value && children.value[0]?.id) selectedChildId.value = children.value[0].id
  } finally {
    pending.value = false
  }
}

const loadExpenses = async () => {
  if (!selectedChildId.value) {
    expenses.value = []
    return
  }
  expensePending.value = true
  try {
    expenses.value = await api<ExpenseResponse[]>(`children/${selectedChildId.value}/expenses`)
  } catch {
    showMessage(t('expenses.loadError'), 'error')
  } finally {
    expensePending.value = false
  }
}

const reload = async () => {
  await loadChildren()
  await loadExpenses()
}

watch(selectedChildId, async () => {
  resetForm()
  await loadExpenses()
})

const resetForm = () => {
  submitted.value = false
  editingId.value = null
  form.title = ''
  form.amount = undefined
  form.expenseDate = today()
  form.category = 'FOOD'
  form.description = ''
}

const editExpense = (expense: ExpenseResponse) => {
  submitted.value = false
  editingId.value = expense.id ?? null
  form.title = expense.title || ''
  form.amount = expense.amount
  form.expenseDate = expense.expenseDate || today()
  form.category = expense.category || 'FOOD'
  form.description = expense.description || ''
}

const saveExpense = async () => {
  submitted.value = true
  if (!canSave.value || !selectedChildId.value) return
  saving.value = true
  try {
    const body: ExpenseRequest = { title: form.title?.trim(), amount: Number(form.amount), expenseDate: form.expenseDate, category: form.category, description: form.description?.trim() }
    if (editingId.value) {
      await api<ExpenseResponse>(`children/${selectedChildId.value}/expenses/${editingId.value}`, { method: 'PUT', body })
      showMessage(t('expenses.updated'), 'success')
    } else {
      await api<ExpenseResponse>(`children/${selectedChildId.value}/expenses`, { method: 'POST', body })
      showMessage(t('expenses.created'), 'success')
    }
    resetForm()
    await loadExpenses()
  } catch {
    showMessage(t('expenses.saveError'), 'error')
  } finally {
    saving.value = false
  }
}

const deleteExpense = async (expense: ExpenseResponse) => {
  if (!selectedChildId.value || !expense.id || !confirm(t('expenses.confirmDelete', { name: expense.title || expense.id }))) return
  try {
    await api<void>(`children/${selectedChildId.value}/expenses/${expense.id}`, { method: 'DELETE' })
    showMessage(t('expenses.deleted'), 'success')
    await loadExpenses()
  } catch {
    showMessage(t('expenses.deleteError'), 'error')
  }
}

onMounted(async () => {
  resetForm()
  await reload()
})
</script>
