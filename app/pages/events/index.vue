<template>
  <section class="page-shell space-y-6">
    <PageHeader :eyebrow="t('events.eyebrow')" :title="t('events.title')">
      <template #actions>
        <UButton icon="i-lucide-refresh-cw" variant="soft" :loading="pending" @click="loadEvents">{{ t('common.refresh') }}</UButton>
      </template>
    </PageHeader>

    <div class="grid gap-4 sm:grid-cols-3">
      <DashboardMetricCard :label="t('nav.events')" :value="events.length" icon="i-lucide-calendar-days" />
      <DashboardMetricCard :label="t('events.upcoming')" :value="upcomingEvents" icon="i-lucide-calendar-plus" />
      <DashboardMetricCard :label="t('events.totalExpenses')" :value="formatMoney(eventExpenseTotal)" icon="i-lucide-receipt" />
    </div>

    <div class="grid gap-6 xl:grid-cols-[0.75fr_1.25fr]">
      <UCard>
        <template #header>
          <div class="space-y-1">
            <h2 class="text-base font-semibold text-gray-950 dark:text-white">{{ editingId ? t('events.editTitle') : t('events.createTitle') }}</h2>
            <p class="text-sm text-gray-500 dark:text-gray-400">{{ t('events.formHint') }}</p>
          </div>
        </template>

        <form class="space-y-4" @submit.prevent="saveEvent">
          <UFormField :label="t('common.title')" required :error="submitted ? titleError : ''">
            <UInput v-model="eventForm.title" icon="i-lucide-calendar-days" :placeholder="t('common.title')" class="w-full" />
          </UFormField>
          <UFormField :label="t('common.date')" required :error="submitted ? dateError : ''">
            <UInput v-model="eventForm.eventDate" icon="i-lucide-calendar" type="date" class="w-full" />
          </UFormField>
          <UFormField :label="t('common.location')">
            <UInput v-model="eventForm.location" icon="i-lucide-map-pin" :placeholder="t('common.location')" class="w-full" />
          </UFormField>
          <UFormField :label="t('common.description')">
            <textarea v-model="eventForm.description" class="min-h-24 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-950 dark:border-gray-700 dark:bg-gray-950 dark:text-white" :placeholder="t('common.description')" />
          </UFormField>
          <FeedbackAlert :message="message" :type="messageType" />
          <FormActions :loading="saving" :disabled="saving" :show-cancel="Boolean(editingId)" @cancel="resetEventForm" />
        </form>
      </UCard>

      <EntityListCard v-model="query" :loading="pending" :empty="filteredEvents.length === 0" :empty-text="eventEmptyText">
        <div class="space-y-3 md:hidden">
          <article v-for="event in filteredEvents" :key="event.id || event.title" class="rounded border border-gray-200 p-4 dark:border-gray-800">
            <div class="flex items-start justify-between gap-3">
              <button type="button" class="min-w-0 text-left" @click="selectEvent(event)">
                <h3 class="truncate font-medium text-gray-950 dark:text-white">{{ event.title || '-' }}</h3>
                <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">{{ formatDate(event.eventDate) }} · {{ event.location || '-' }}</p>
              </button>
              <RowActions @edit="editEvent(event)" @delete="deleteEvent(event)" />
            </div>
          </article>
        </div>

        <table class="hidden w-full min-w-[760px] border-collapse text-left text-sm md:table">
          <thead>
            <tr class="border-b border-gray-200 text-gray-500 dark:border-gray-800 dark:text-gray-400">
              <th class="py-3 pr-4 font-medium">{{ t('common.title') }}</th>
              <th class="py-3 pr-4 font-medium">{{ t('common.date') }}</th>
              <th class="py-3 pr-4 font-medium">{{ t('common.location') }}</th>
              <th class="py-3 pr-0 text-right font-medium">{{ t('common.actions') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="event in filteredEvents" :key="event.id" class="border-b border-gray-100 dark:border-gray-800">
              <td class="py-3 pr-4">
                <button type="button" class="font-medium text-gray-950 hover:text-primary-700 dark:text-white dark:hover:text-primary-300" @click="selectEvent(event)">{{ event.title || '-' }}</button>
              </td>
              <td class="py-3 pr-4 text-gray-600 dark:text-gray-300">{{ formatDate(event.eventDate) }}</td>
              <td class="py-3 pr-4 text-gray-600 dark:text-gray-300">{{ event.location || '-' }}</td>
              <td class="py-3 pr-0"><RowActions @edit="editEvent(event)" @delete="deleteEvent(event)" /></td>
            </tr>
          </tbody>
        </table>
      </EntityListCard>
    </div>

    <section class="grid gap-6 xl:grid-cols-[0.75fr_1.25fr]">
      <UCard>
        <template #header>
          <div class="space-y-1">
            <h2 class="text-base font-semibold text-gray-950 dark:text-white">{{ t('events.addExpense') }}</h2>
            <p class="text-sm text-gray-500 dark:text-gray-400">{{ selectedEventLabel }}</p>
          </div>
        </template>

        <form class="space-y-4" @submit.prevent="saveEventExpense">
          <UFormField :label="t('common.title')" required :error="expenseSubmitted ? expenseTitleError : ''">
            <UInput v-model="expenseForm.title" icon="i-lucide-receipt" :placeholder="t('common.title')" class="w-full" :disabled="!selectedEventId" />
          </UFormField>
          <div class="grid gap-4 sm:grid-cols-2">
            <UFormField :label="t('common.amount')" required :error="expenseSubmitted ? expenseAmountError : ''">
              <UInput v-model.number="expenseForm.amount" icon="i-lucide-euro" type="number" min="0" step="0.01" class="w-full" :disabled="!selectedEventId" />
            </UFormField>
            <UFormField :label="t('common.date')" required :error="expenseSubmitted ? expenseDateError : ''">
              <UInput v-model="expenseForm.expenseDate" icon="i-lucide-calendar" type="date" class="w-full" :disabled="!selectedEventId" />
            </UFormField>
          </div>
          <UFormField :label="t('common.category')">
            <select v-model="expenseForm.category" class="h-9 w-full rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-950 dark:border-gray-700 dark:bg-gray-950 dark:text-white" :disabled="!selectedEventId">
              <option v-for="category in eventExpenseCategories" :key="category" :value="category">{{ categoryLabel(category) }}</option>
            </select>
          </UFormField>
          <UFormField :label="t('common.description')">
            <textarea v-model="expenseForm.description" class="min-h-20 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-950 dark:border-gray-700 dark:bg-gray-950 dark:text-white" :placeholder="t('common.description')" :disabled="!selectedEventId" />
          </UFormField>
          <FormActions :submit-label="expenseEditingId ? t('common.save') : t('common.add')" submit-icon="i-lucide-receipt" :loading="expenseSaving" :disabled="expenseSaving || !selectedEventId" :show-cancel="Boolean(expenseEditingId)" @cancel="resetExpenseForm" />
        </form>
      </UCard>

      <EntityListCard v-model="expenseQuery" :loading="expensePending" :empty="filteredEventExpenses.length === 0" :empty-text="expenseEmptyText">
        <table class="w-full min-w-[760px] border-collapse text-left text-sm">
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
            <tr v-for="expense in filteredEventExpenses" :key="expense.id" class="border-b border-gray-100 dark:border-gray-800">
              <td class="py-3 pr-4 font-medium text-gray-950 dark:text-white">{{ expense.title || '-' }}</td>
              <td class="py-3 pr-4 text-gray-600 dark:text-gray-300">{{ formatMoney(expense.amount) }}</td>
              <td class="py-3 pr-4"><UBadge color="neutral" variant="soft">{{ categoryLabel(expense.category) }}</UBadge></td>
              <td class="py-3 pr-4 text-gray-600 dark:text-gray-300">{{ formatDate(expense.expenseDate) }}</td>
              <td class="py-3 pr-0"><RowActions @edit="editEventExpense(expense)" @delete="deleteEventExpense(expense)" /></td>
            </tr>
          </tbody>
        </table>
      </EntityListCard>
    </section>
  </section>
</template>

<script setup lang="ts">
import type { EventExpenseCategory, EventExpenseRequest, EventExpenseResponse, EventRequest, EventResponse } from '~/types/api'

definePageMeta({ middleware: 'auth' })

const api = useApi()
const { t, locale } = useI18n()
const pending = ref(false)
const saving = ref(false)
const submitted = ref(false)
const events = ref<EventResponse[]>([])
const query = ref('')
const editingId = ref<number | null>(null)
const selectedEventId = ref<number | null>(null)
const message = ref('')
const messageType = ref<'success' | 'error'>('success')
const eventForm = reactive<EventRequest>({ title: '', eventDate: '', location: '', description: '' })

const expensePending = ref(false)
const expenseSaving = ref(false)
const expenseSubmitted = ref(false)
const eventExpenses = ref<EventExpenseResponse[]>([])
const expenseQuery = ref('')
const expenseEditingId = ref<number | null>(null)
const expenseForm = reactive<EventExpenseRequest>({ title: '', amount: undefined, expenseDate: '', category: 'FOOD', description: '' })
const eventExpenseCategories: EventExpenseCategory[] = ['FOOD', 'TRANSPORT', 'MATERIAL', 'RENT', 'DRINKS', 'MEDIA', 'DECORATION', 'OTHER']

const titleError = computed(() => (eventForm.title?.trim() ? '' : t('common.required')))
const dateError = computed(() => (eventForm.eventDate ? '' : t('common.required')))
const canSaveEvent = computed(() => !titleError.value && !dateError.value)
const expenseTitleError = computed(() => (expenseForm.title?.trim() ? '' : t('common.required')))
const expenseAmountError = computed(() => (Number(expenseForm.amount) > 0 ? '' : t('common.required')))
const expenseDateError = computed(() => (expenseForm.expenseDate ? '' : t('common.required')))
const canSaveExpense = computed(() => Boolean(selectedEventId.value) && !expenseTitleError.value && !expenseAmountError.value && !expenseDateError.value)
const upcomingEvents = computed(() => events.value.filter((event) => event.eventDate && event.eventDate >= today()).length)
const eventExpenseTotal = computed(() => eventExpenses.value.reduce((sum, expense) => sum + Number(expense.amount || 0), 0))
const eventEmptyText = computed(() => (query.value ? t('common.noEntries') : t('events.noEvents')))
const expenseEmptyText = computed(() => (!selectedEventId.value ? t('events.noEventSelected') : expenseQuery.value ? t('common.noEntries') : t('expenses.noExpenses')))
const selectedEvent = computed(() => events.value.find((event) => Number(event.id) === Number(selectedEventId.value)))
const selectedEventLabel = computed(() => selectedEvent.value?.title || t('events.noEventSelected'))

const filteredEvents = computed(() => {
  const needle = query.value.trim().toLowerCase()
  if (!needle) return events.value
  return events.value.filter((event) => [event.title, event.location, event.description].some((value) => String(value || '').toLowerCase().includes(needle)))
})

const filteredEventExpenses = computed(() => {
  const needle = expenseQuery.value.trim().toLowerCase()
  if (!needle) return eventExpenses.value
  return eventExpenses.value.filter((expense) => [expense.title, expense.category, expense.description].some((value) => String(value || '').toLowerCase().includes(needle)))
})

const today = () => new Date().toISOString().slice(0, 10)
const formatDate = (value?: string) => (value ? new Intl.DateTimeFormat(locale.value).format(new Date(value)) : '-')
const formatMoney = (value?: number) => new Intl.NumberFormat(locale.value, { style: 'currency', currency: 'EUR' }).format(Number(value || 0))
const categoryLabel = (category?: string) => category ? category.replaceAll('_', ' ') : '-'

const showMessage = (text: string, type: 'success' | 'error') => {
  message.value = text
  messageType.value = type
}

const loadEvents = async () => {
  pending.value = true
  try {
    events.value = await api<EventResponse[]>('admin/events')
    if (!selectedEventId.value && events.value[0]?.id) await selectEvent(events.value[0])
  } catch {
    showMessage(t('events.loadError'), 'error')
  } finally {
    pending.value = false
  }
}

const selectEvent = async (event: EventResponse) => {
  selectedEventId.value = event.id || null
  resetExpenseForm()
  await loadEventExpenses()
}

const resetEventForm = () => {
  submitted.value = false
  editingId.value = null
  eventForm.title = ''
  eventForm.eventDate = ''
  eventForm.location = ''
  eventForm.description = ''
}

const editEvent = (event: EventResponse) => {
  submitted.value = false
  editingId.value = event.id ?? null
  eventForm.title = event.title || ''
  eventForm.eventDate = event.eventDate || ''
  eventForm.location = event.location || ''
  eventForm.description = event.description || ''
}

const saveEvent = async () => {
  submitted.value = true
  if (!canSaveEvent.value) return
  saving.value = true
  try {
    const body: EventRequest = { title: eventForm.title?.trim(), eventDate: eventForm.eventDate, location: eventForm.location?.trim(), description: eventForm.description?.trim() }
    if (editingId.value) {
      await api<EventResponse>(`admin/events/${editingId.value}`, { method: 'PUT', body })
      showMessage(t('events.updated'), 'success')
    } else {
      const created = await api<EventResponse>('admin/events', { method: 'POST', body })
      selectedEventId.value = created.id || null
      showMessage(t('events.created'), 'success')
    }
    resetEventForm()
    await loadEvents()
  } catch {
    showMessage(t('events.saveError'), 'error')
  } finally {
    saving.value = false
  }
}

const deleteEvent = async (event: EventResponse) => {
  if (!event.id || !confirm(t('events.confirmDelete', { name: event.title || event.id }))) return
  try {
    await api<void>(`admin/events/${event.id}`, { method: 'DELETE' })
    if (selectedEventId.value === event.id) {
      selectedEventId.value = null
      eventExpenses.value = []
    }
    showMessage(t('events.deleted'), 'success')
    await loadEvents()
  } catch {
    showMessage(t('events.deleteError'), 'error')
  }
}

const loadEventExpenses = async () => {
  if (!selectedEventId.value) return
  expensePending.value = true
  try {
    eventExpenses.value = await api<EventExpenseResponse[]>(`admin/events/${selectedEventId.value}/expenses`)
  } finally {
    expensePending.value = false
  }
}

const resetExpenseForm = () => {
  expenseSubmitted.value = false
  expenseEditingId.value = null
  expenseForm.title = ''
  expenseForm.amount = undefined
  expenseForm.expenseDate = today()
  expenseForm.category = 'FOOD'
  expenseForm.description = ''
}

const editEventExpense = (expense: EventExpenseResponse) => {
  expenseSubmitted.value = false
  expenseEditingId.value = expense.id ?? null
  expenseForm.title = expense.title || ''
  expenseForm.amount = expense.amount
  expenseForm.expenseDate = expense.expenseDate || today()
  expenseForm.category = expense.category || 'FOOD'
  expenseForm.description = expense.description || ''
}

const saveEventExpense = async () => {
  expenseSubmitted.value = true
  if (!canSaveExpense.value || !selectedEventId.value) return
  expenseSaving.value = true
  try {
    const body: EventExpenseRequest = { title: expenseForm.title?.trim(), amount: Number(expenseForm.amount), expenseDate: expenseForm.expenseDate, category: expenseForm.category, description: expenseForm.description?.trim() }
    if (expenseEditingId.value) {
      await api<EventExpenseResponse>(`admin/events/${selectedEventId.value}/expenses/${expenseEditingId.value}`, { method: 'PUT', body })
    } else {
      await api<EventExpenseResponse>(`admin/events/${selectedEventId.value}/expenses`, { method: 'POST', body })
    }
    resetExpenseForm()
    await loadEventExpenses()
  } finally {
    expenseSaving.value = false
  }
}

const deleteEventExpense = async (expense: EventExpenseResponse) => {
  if (!selectedEventId.value || !expense.id || !confirm(t('expenses.confirmDelete', { name: expense.title || expense.id }))) return
  await api<void>(`admin/events/${selectedEventId.value}/expenses/${expense.id}`, { method: 'DELETE' })
  await loadEventExpenses()
}

onMounted(loadEvents)
</script>
