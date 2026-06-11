<template>
  <UAlert
    v-if="message"
    :color="type"
    variant="soft"
    :icon="type === 'success' ? 'i-lucide-circle-check' : 'i-lucide-circle-alert'"
    :description="message"
  />
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    message?: string
    type?: 'success' | 'error'
  }>(),
  {
    message: '',
    type: 'success',
  },
)
</script>
