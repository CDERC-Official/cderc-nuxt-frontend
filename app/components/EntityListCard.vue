<template>
  <UCard>
    <template #header>
      <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 class="text-base font-semibold text-gray-950">{{ title || t('common.list') }}</h2>
        <UInput v-model="query" icon="i-lucide-search" :placeholder="t('common.search')" class="w-full sm:w-64" />
      </div>
    </template>

    <LoadingRows v-if="loading" :count="loadingRows" />
    <div v-else-if="empty" class="py-10 text-center text-sm text-gray-500">
      {{ emptyText || t('common.noEntries') }}
    </div>
    <div v-else class="overflow-x-auto">
      <slot />
    </div>
  </UCard>
</template>

<script setup lang="ts">
const query = defineModel<string>({ required: true })
const { t } = useI18n()

withDefaults(
  defineProps<{
    title?: string
    loading?: boolean
    empty?: boolean
    emptyText?: string
    loadingRows?: number
  }>(),
  {
    title: '',
    loading: false,
    empty: false,
    emptyText: '',
    loadingRows: 6,
  },
)
</script>
