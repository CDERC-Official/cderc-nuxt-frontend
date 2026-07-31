<template>
  <UAlert
    v-if="message"
    :color="type"
    variant="soft"
    :icon="iconName"
    :description="message"
  />
</template>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    message?: string
    type?: 'success' | 'error' | 'warning'
  }>(),
  {
    message: '',
    type: 'success',
  },
)

const iconName = computed(() => {
  if (props.type === 'success') return 'i-lucide-circle-check'
  if (props.type === 'warning') return 'i-lucide-info'
  return 'i-lucide-circle-alert'
})
</script>
