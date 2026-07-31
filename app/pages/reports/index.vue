<template>
  <section class="page-shell space-y-6">
    <PageHeader :eyebrow="t('reports.eyebrow')" :title="t('reports.title')">
      <template #actions>
        <UButton icon="i-lucide-refresh-cw" variant="soft" :loading="pending" @click="loadReports">{{ t('reports.reload') }}</UButton>
      </template>
    </PageHeader>

    <UCard>
      <template #header>
        <h2 class="text-base font-semibold text-gray-950 dark:text-white">{{ t('reports.filters') }}</h2>
      </template>
      <div class="grid gap-4 lg:grid-cols-[1fr_160px_160px_auto] lg:items-end">
        <UFormField :label="t('reports.selectedEvent')">
          <select v-model.number="selectedEventId" class="h-9 w-full rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-950 dark:border-gray-700 dark:bg-gray-950 dark:text-white">
            <option :value="undefined">{{ t('reports.noEvents') }}</option>
            <option v-for="event in events" :key="event.id" :value="event.id">{{ event.title || event.id }}</option>
          </select>
        </UFormField>
        <UFormField :label="t('reports.yearOne')">
          <UInput v-model.number="yearOne" type="number" min="2000" max="2100" class="w-full" />
        </UFormField>
        <UFormField :label="t('reports.yearTwo')">
          <UInput v-model.number="yearTwo" type="number" min="2000" max="2100" class="w-full" />
        </UFormField>
        <UButton icon="i-lucide-chart-column" :loading="pending" @click="loadReports">{{ t('reports.reload') }}</UButton>
      </div>
    </UCard>

    <FeedbackAlert :message="message" type="error" />

    <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <DashboardMetricCard :label="t('reports.organizationTotal')" :value="formatMoney(organizationTotal?.totalExpenses)" icon="i-lucide-building-2" />
      <DashboardMetricCard :label="t('reports.eventTotal')" :value="formatMoney(eventTotal?.totalExpenses)" icon="i-lucide-calendar-days" :description="eventTotal?.eventTitle" />
      <DashboardMetricCard :label="t('reports.activeMembers')" :value="activeMembers" icon="i-lucide-user-check" />
      <DashboardMetricCard :label="t('reports.supportingMembers')" :value="supportingMembers" icon="i-lucide-hand-heart" />
    </div>

    <section class="grid gap-6 lg:grid-cols-2">
      <DashboardBarList :title="t('reports.byCategory')" :items="categoryItems" :empty-text="t('reports.noData')" />
      <DashboardBarList :title="t('reports.yearComparison')" :items="yearItems" :empty-text="t('reports.noData')" />
      <DashboardBarList :title="t('reports.memberSegments')" :items="memberItems" :empty-text="t('reports.noData')" />
      <UCard>
        <template #header>
          <h2 class="text-base font-semibold text-gray-950 dark:text-white">{{ t('reports.boardMembers') }}</h2>
        </template>
        <div v-if="boardMembers.length" class="divide-y divide-gray-100 dark:divide-gray-800">
          <div v-for="member in boardMembers" :key="member.id || member.email" class="py-3">
            <p class="font-medium text-gray-950 dark:text-white">{{ member.name || '-' }}</p>
            <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">{{ member.email || member.type || '-' }}</p>
          </div>
        </div>
        <div v-else class="py-8 text-center text-sm text-gray-500 dark:text-gray-400">{{ t('reports.noData') }}</div>
      </UCard>
    </section>
  </section>
</template>

<script setup lang="ts">
import type { CategoryReportResponse, EventResponse, EventTotalReportResponse, OrganizationTotalReportResponse, YearReportResponse } from '~/types/api'

definePageMeta({ middleware: 'auth' })

interface ReportMember {
  id?: number
  name?: string
  email?: string
  type?: string
  status?: string
}

const api = useApi()
const { t, locale } = useI18n()
const pending = ref(false)
const message = ref('')
const events = ref<EventResponse[]>([])
const selectedEventId = ref<number | undefined>(undefined)
const currentYear = new Date().getFullYear()
const yearOne = ref(currentYear - 1)
const yearTwo = ref(currentYear)
const organizationTotal = ref<OrganizationTotalReportResponse | null>(null)
const eventTotal = ref<EventTotalReportResponse | null>(null)
const categories = ref<CategoryReportResponse[]>([])
const years = ref<YearReportResponse[]>([])
const activeMembers = ref(0)
const supportingMembers = ref(0)
const boardMembers = ref<ReportMember[]>([])
const volunteers = ref<ReportMember[]>([])
const inactiveMembers = ref<ReportMember[]>([])

const formatMoney = (value?: number) => new Intl.NumberFormat(locale.value, { style: 'currency', currency: 'EUR' }).format(Number(value || 0))
const labelCategory = (category?: string) => category ? category.replaceAll('_', ' ') : '-'

const categoryItems = computed(() => categories.value.map((item) => ({ label: labelCategory(item.category), value: Number(item.total || 0) })))
const yearItems = computed(() => years.value.map((item) => ({ label: String(item.year || '-'), value: Number(item.total || 0) })))
const memberItems = computed(() => [
  { label: t('reports.activeMembers'), value: activeMembers.value },
  { label: t('reports.supportingMembers'), value: supportingMembers.value },
  { label: t('reports.boardMembers'), value: boardMembers.value.length },
  { label: t('reports.volunteers'), value: volunteers.value.length },
  { label: t('reports.inactiveMembers'), value: inactiveMembers.value.length },
])

const loadEvents = async () => {
  events.value = await api<EventResponse[]>('admin/events')
  if (!selectedEventId.value && events.value[0]?.id) selectedEventId.value = events.value[0].id
}

const loadReports = async () => {
  pending.value = true
  message.value = ''

  try {
    if (!events.value.length) await loadEvents()

    const requests: Array<Promise<unknown>> = [
      api<OrganizationTotalReportResponse>('admin/reports/organization/total'),
      api<YearReportResponse[]>(`admin/reports/events/compare?year1=${yearOne.value}&year2=${yearTwo.value}`),
      api<number>('admin/reports/members/active/count'),
      api<number>('admin/reports/members/supporting/count'),
      api<ReportMember[]>('admin/reports/members/board'),
      api<ReportMember[]>('admin/reports/members/volunteers'),
      api<ReportMember[]>('admin/reports/members/inactive'),
    ]

    if (selectedEventId.value) {
      requests.push(api<EventTotalReportResponse>(`admin/reports/events/${selectedEventId.value}/total`))
      requests.push(api<CategoryReportResponse[]>(`admin/reports/events/${selectedEventId.value}/by-category`))
    }

    const results = await Promise.allSettled(requests)

    organizationTotal.value = results[0]?.status === 'fulfilled' ? results[0].value as OrganizationTotalReportResponse : null
    years.value = results[1]?.status === 'fulfilled' ? results[1].value as YearReportResponse[] : []
    activeMembers.value = results[2]?.status === 'fulfilled' ? Number(results[2].value) : 0
    supportingMembers.value = results[3]?.status === 'fulfilled' ? Number(results[3].value) : 0
    boardMembers.value = results[4]?.status === 'fulfilled' ? results[4].value as ReportMember[] : []
    volunteers.value = results[5]?.status === 'fulfilled' ? results[5].value as ReportMember[] : []
    inactiveMembers.value = results[6]?.status === 'fulfilled' ? results[6].value as ReportMember[] : []
    eventTotal.value = selectedEventId.value && results[7]?.status === 'fulfilled' ? results[7].value as EventTotalReportResponse : null
    categories.value = selectedEventId.value && results[8]?.status === 'fulfilled' ? results[8].value as CategoryReportResponse[] : []

    if (results.some((result) => result.status === 'rejected')) {
      message.value = t('reports.loadError')
    }
  } finally {
    pending.value = false
  }
}

watch(selectedEventId, () => {
  void loadReports()
})

onMounted(loadReports)
</script>
