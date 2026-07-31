<template>
  <UCard>
    <template #header>
      <div class="flex items-center justify-between gap-3">
        <h2 class="text-base font-semibold text-gray-950 dark:text-white">{{ title }}</h2>
        <UBadge v-if="total" color="neutral" variant="soft">{{ total }}</UBadge>
      </div>
    </template>

    <div v-if="items.length" class="space-y-4">
      <div v-for="item in items" :key="item.label" class="space-y-1.5">
        <div class="flex items-center justify-between gap-3 text-sm">
          <span class="truncate font-medium text-gray-700 dark:text-gray-200">{{ item.label }}</span>
          <span class="shrink-0 text-gray-500 dark:text-gray-400">{{ item.value }}</span>
        </div>
        <div class="h-2 overflow-hidden rounded bg-gray-100 dark:bg-gray-800">
          <div
            class="h-full rounded bg-primary-600 transition-all dark:bg-primary-400"
            :style="{ width: `${percentage(item.value)}%`, backgroundColor: item.color || undefined }"
          />
        </div>
      </div>
    </div>

    <div v-else class="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
      {{ emptyText }}
    </div>
  </UCard>
</template>

<script setup lang="ts">
const props = defineProps<{
  title: string
  items: Array<{
    label: string
    value: number
    color?: string
  }>
  emptyText: string
}>()

const total = computed(() => props.items.reduce((sum, item) => sum + item.value, 0))
const maxValue = computed(() => Math.max(1, ...props.items.map((item) => item.value)))

const percentage = (value: number) => Math.max(4, Math.round((value / maxValue.value) * 100))
</script>
