<template>
  <div class="flex flex-wrap gap-2">
    <UButton type="submit" :icon="submitIcon" :loading="loading" :disabled="disabled">
      {{ submitLabel }}
    </UButton>
    <UButton v-if="showCancel" type="button" icon="i-lucide-x" variant="ghost" color="neutral" @click="$emit('cancel')">
      Abbrechen
    </UButton>
  </div>
</template>

<script setup lang="ts">
defineEmits<{
  cancel: []
}>()

withDefaults(
  defineProps<{
    submitLabel?: string
    submitIcon?: string
    loading?: boolean
    disabled?: boolean
    showCancel?: boolean
  }>(),
  {
    submitLabel: 'Speichern',
    submitIcon: 'i-lucide-save',
    loading: false,
    disabled: false,
    showCancel: false,
  },
)
</script>
