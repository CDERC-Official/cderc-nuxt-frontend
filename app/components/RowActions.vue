<template>
  <div class="flex justify-end gap-1">
    <UButton icon="i-lucide-pencil" size="sm" variant="ghost" color="neutral" :aria-label="t('common.edit')" @click="$emit('edit')" />
    <UButton icon="i-lucide-trash-2" size="sm" variant="ghost" color="error" :aria-label="t('common.delete')" @click="$emit('delete')" />
  </div>
</template>

<script setup lang="ts">
defineEmits<{
  edit: []
  delete: []
}>()

const { t } = useI18n()
</script>
