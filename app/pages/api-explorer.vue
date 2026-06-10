<template>
  <section class="page-shell space-y-6">
    <div>
      <p class="text-sm font-medium uppercase tracking-wide text-primary-700">API</p>
      <h1 class="mt-1 text-3xl font-semibold text-gray-950">API Explorer</h1>
    </div>

    <div class="grid gap-6 lg:grid-cols-[0.75fr_1.25fr]">
      <UCard>
        <template #header>
          <h2 class="text-base font-semibold text-gray-950">Request</h2>
        </template>

        <form class="space-y-4" @submit.prevent="send">
          <UFormField label="Methode">
            <select v-model="method" class="h-9 w-full rounded-md border border-gray-300 bg-white px-3 text-sm">
              <option v-for="item in methods" :key="item" :value="item">{{ item }}</option>
            </select>
          </UFormField>

          <UFormField label="Pfad">
            <UInput v-model="path" icon="i-lucide-link" placeholder="children" class="w-full" />
          </UFormField>

          <UFormField label="Body">
            <textarea
              v-model="body"
              class="min-h-40 w-full resize-y rounded-md border border-gray-300 bg-white p-3 font-mono text-sm"
              spellcheck="false"
              placeholder="{ }"
            />
          </UFormField>

          <UButton type="submit" icon="i-lucide-send" :loading="pending">Senden</UButton>
        </form>
      </UCard>

      <UCard>
        <template #header>
          <div class="flex items-center justify-between gap-3">
            <h2 class="text-base font-semibold text-gray-950">Response</h2>
            <UBadge v-if="status" :color="status < 400 ? 'success' : 'error'" variant="soft">{{ status }}</UBadge>
          </div>
        </template>

        <pre class="min-h-80 overflow-auto rounded-md bg-gray-950 p-4 text-sm text-gray-50">{{ responseText }}</pre>
      </UCard>
    </div>
  </section>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

const methods: Method[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']
const api = useApi()
const method = ref<Method>('GET')
const path = ref('children')
const body = ref('')
const pending = ref(false)
const status = ref<number | null>(null)
const responseText = ref('Noch keine Anfrage gesendet.')

const send = async () => {
  pending.value = true
  status.value = null

  try {
    const parsedBody = body.value.trim() ? JSON.parse(body.value) : undefined
    const result = await api<unknown>(path.value, {
      method: method.value,
      body: method.value === 'GET' ? undefined : parsedBody,
      onResponse({ response }) {
        status.value = response.status
      },
      onResponseError({ response }) {
        status.value = response.status
      },
    })

    responseText.value = JSON.stringify(result, null, 2)
  } catch (error) {
    responseText.value = error instanceof Error ? error.message : String(error)
  } finally {
    pending.value = false
  }
}
</script>
