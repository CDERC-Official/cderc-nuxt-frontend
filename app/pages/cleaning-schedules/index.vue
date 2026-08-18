<template>
  <section class="page-shell space-y-6">
    <PageHeader :eyebrow="t('cleaningSchedules.eyebrow')" :title="t('cleaningSchedules.title')">
      <template #actions>
        <UButton icon="i-lucide-refresh-cw" variant="soft" :loading="pending" @click="loadSchedules">{{ t('common.refresh') }}</UButton>
      </template>
    </PageHeader>

    <div class="grid gap-4 sm:grid-cols-3">
      <DashboardMetricCard :label="t('cleaningSchedules.summary.total')" :value="schedules.length" icon="i-lucide-calendar-range" />
      <DashboardMetricCard :label="t('cleaningSchedules.summary.nextWeek')" :value="nextScheduleLabel" icon="i-lucide-calendar-check" />
      <DashboardMetricCard :label="t('cleaningSchedules.summary.people')" :value="assignedPeopleCount" icon="i-lucide-users" />
    </div>

    <div class="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
      <UCard>
        <template #header>
          <div class="space-y-1">
            <h2 class="text-base font-semibold text-gray-950 dark:text-white">{{ t('cleaningSchedules.generateTitle') }}</h2>
            <p class="text-sm text-gray-500 dark:text-gray-400">{{ t('cleaningSchedules.formHint') }}</p>
          </div>
        </template>

        <form class="space-y-4" @submit.prevent="generateSchedules">
          <UFormField :label="t('cleaningSchedules.startDate')" required :error="submitted ? startDateError : ''">
            <UInput v-model="form.startDate" icon="i-lucide-calendar" type="date" class="w-full" />
          </UFormField>

          <UFormField :label="t('cleaningSchedules.numberOfWeeks')" required :error="submitted ? weeksError : ''">
            <UInput v-model.number="form.numberOfWeeks" icon="i-lucide-hash" type="number" min="1" max="52" class="w-full" />
          </UFormField>

          <FeedbackAlert :message="message" :type="messageType" />

          <FormActions
            :submit-label="t('cleaningSchedules.generate')"
            submit-icon="i-lucide-sparkles"
            :loading="generating"
            :disabled="generating"
            :show-cancel="false"
          />
        </form>
      </UCard>

      <EntityListCard
        v-model="query"
        :loading="pending"
        :empty="filteredSchedules.length === 0"
        :empty-text="emptyText"
      >
        <div class="space-y-3 md:hidden">
          <article v-for="schedule in filteredSchedules" :key="schedule.id || schedule.weekStart" class="rounded border border-gray-200 p-4 dark:border-gray-800">
            <div class="flex items-start justify-between gap-3">
              <div>
                <h3 class="font-medium text-gray-950 dark:text-white">{{ formatRange(schedule) }}</h3>
                <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">{{ schedule.personOneName || '-' }} · {{ schedule.personTwoName || '-' }}</p>
              </div>
              <UBadge color="neutral" variant="soft">{{ t('cleaningSchedules.week') }}</UBadge>
            </div>
          </article>
        </div>

        <table class="hidden w-full min-w-[760px] border-collapse text-left text-sm md:table">
          <thead>
            <tr class="border-b border-gray-200 text-gray-500 dark:border-gray-800 dark:text-gray-400">
              <th class="py-3 pr-4 font-medium">{{ t('cleaningSchedules.weekRange') }}</th>
              <th class="py-3 pr-4 font-medium">{{ t('cleaningSchedules.personOne') }}</th>
              <th class="py-3 pr-4 font-medium">{{ t('cleaningSchedules.personTwo') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="schedule in filteredSchedules" :key="schedule.id" class="border-b border-gray-100 dark:border-gray-800">
              <td class="py-3 pr-4 font-medium text-gray-950 dark:text-white">{{ formatRange(schedule) }}</td>
              <td class="py-3 pr-4 text-gray-600 dark:text-gray-300">{{ schedule.personOneName || '-' }}</td>
              <td class="py-3 pr-4 text-gray-600 dark:text-gray-300">{{ schedule.personTwoName || '-' }}</td>
            </tr>
          </tbody>
        </table>
      </EntityListCard>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { ApiError, CleaningScheduleResponse, GenerateCleaningScheduleRequest } from '~/types/api'

definePageMeta({ middleware: 'auth' })

const api = useApi()
const { t, locale } = useI18n()
const pending = ref(false)
const generating = ref(false)
const submitted = ref(false)
const schedules = ref<CleaningScheduleResponse[]>([])
const query = ref('')
const message = ref('')
const messageType = ref<'success' | 'error'>('success')
const form = reactive<GenerateCleaningScheduleRequest>({
  startDate: '',
  numberOfWeeks: 4,
})

const startDateError = computed(() => (form.startDate ? '' : t('common.required')))
const weeksError = computed(() => Number(form.numberOfWeeks) > 0 ? '' : t('cleaningSchedules.weeksRequired'))
const canGenerate = computed(() => !startDateError.value && !weeksError.value)
const emptyText = computed(() => query.value ? t('common.noEntries') : t('cleaningSchedules.noSchedules'))
const nextSchedule = computed(() => schedules.value.find((schedule) => schedule.weekEnd && schedule.weekEnd >= today()))
const nextScheduleLabel = computed(() => nextSchedule.value ? formatRange(nextSchedule.value) : '-')
const assignedPeopleCount = computed(() => {
  const people = new Set<number | string>()
  schedules.value.forEach((schedule) => {
    if (schedule.personOneId || schedule.personOneName) people.add(schedule.personOneId || schedule.personOneName || '')
    if (schedule.personTwoId || schedule.personTwoName) people.add(schedule.personTwoId || schedule.personTwoName || '')
  })
  return people.size
})

const filteredSchedules = computed(() => {
  const needle = query.value.trim().toLowerCase()
  if (!needle) return schedules.value

  return schedules.value.filter((schedule) =>
    [formatRange(schedule), schedule.personOneName, schedule.personTwoName].some((value) =>
      String(value || '').toLowerCase().includes(needle),
    ),
  )
})

const today = () => new Date().toISOString().slice(0, 10)
const formatDate = (value?: string) => (value ? new Intl.DateTimeFormat(locale.value).format(new Date(value)) : '-')
const formatRange = (schedule: CleaningScheduleResponse) => `${formatDate(schedule.weekStart)} - ${formatDate(schedule.weekEnd)}`

const showMessage = (text: string, type: 'success' | 'error') => {
  message.value = text
  messageType.value = type
}

const loadSchedules = async () => {
  pending.value = true
  try {
    schedules.value = await api<CleaningScheduleResponse[]>('admin/cleaning-schedules')
  } catch (error) {
    schedules.value = []
    const apiError = error as ApiError
    showMessage(apiError.message || t('cleaningSchedules.loadError'), 'error')
  } finally {
    pending.value = false
  }
}

const generateSchedules = async () => {
  submitted.value = true
  if (!canGenerate.value) return

  generating.value = true
  try {
    const body: GenerateCleaningScheduleRequest = {
      startDate: form.startDate,
      numberOfWeeks: Number(form.numberOfWeeks),
    }

    schedules.value = await api<CleaningScheduleResponse[]>('admin/cleaning-schedules/generate', { method: 'POST', body })
    showMessage(t('cleaningSchedules.generated'), 'success')
  } catch (error) {
    const apiError = error as ApiError
    showMessage(apiError.message || t('cleaningSchedules.generateError'), 'error')
  } finally {
    generating.value = false
  }
}

onMounted(async () => {
  form.startDate = today()
  await loadSchedules()
})
</script>
