<template>
  <div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
    <div>
      <p class="text-sm font-medium uppercase tracking-wide text-primary-700 dark:text-primary-300">{{ eyebrow }}</p>
      <h1 class="mt-1 text-3xl font-semibold text-gray-950 dark:text-white">{{ title }}</h1>
    </div>
    <div v-if="$slots.actions" class="flex flex-wrap gap-2">
      <slot name="actions" />
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  eyebrow: string
  title: string
}>()
</script>

