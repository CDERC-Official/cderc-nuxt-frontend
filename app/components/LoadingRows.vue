<template>
  <div class="space-y-3">
    <USkeleton v-for="item in count" :key="item" :class="rowClass" />
  </div>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    count?: number
    rowClass?: string
  }>(),
  {
    count: 6,
    rowClass: 'h-12 w-full',
  },
)
</script>
