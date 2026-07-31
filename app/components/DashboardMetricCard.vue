<template>
  <UCard>
    <div class="flex items-start justify-between gap-4">
      <div class="min-w-0">
        <p class="text-sm text-gray-500 dark:text-gray-400">{{ label }}</p>
        <p class="mt-2 text-3xl font-semibold text-gray-950 dark:text-white">{{ value }}</p>
        <p v-if="description" class="mt-1 text-xs text-gray-500 dark:text-gray-400">{{ description }}</p>
      </div>
      <span class="grid size-11 shrink-0 place-items-center rounded bg-primary-50 text-primary-700 dark:bg-primary-950 dark:text-primary-300">
        <UIcon :name="icon" class="size-5" />
      </span>
    </div>
  </UCard>
</template>

<script setup lang="ts">
defineProps<{
  label: string
  value: string | number
  icon: string
  description?: string
}>()
</script>
