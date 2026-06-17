<template>
  <div class="flex flex-wrap gap-2">
    <UButton type="submit" :icon="submitIcon" :loading="loading" :disabled="disabled">
      {{ submitLabel || t('common.save') }}
    </UButton>
    <UButton v-if="showCancel" type="button" icon="i-lucide-x" variant="ghost" color="neutral" @click="$emit('cancel')">
      {{ t('common.cancel') }}
    </UButton>
  </div>
</template>

<script setup lang="ts">
defineEmits<{
  cancel: []
}>()

const { t } = useI18n()

withDefaults(
  defineProps<{
    submitLabel?: string
    submitIcon?: string
    loading?: boolean
    disabled?: boolean
    showCancel?: boolean
  }>(),
  {
    submitLabel: '',
    submitIcon: 'i-lucide-save',
    loading: false,
    disabled: false,
    showCancel: false,
  },
)
</script>
