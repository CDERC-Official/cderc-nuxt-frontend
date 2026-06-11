<template>
  <div class="flex justify-end gap-1">
    <UButton icon="i-lucide-pencil" size="sm" variant="ghost" color="neutral" aria-label="Bearbeiten" @click="$emit('edit')" />
    <UButton icon="i-lucide-trash-2" size="sm" variant="ghost" color="error" aria-label="Loeschen" @click="$emit('delete')" />
  </div>
</template>

<script setup lang="ts">
defineEmits<{
  edit: []
  delete: []
}>()
</script>
