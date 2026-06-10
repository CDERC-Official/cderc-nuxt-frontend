<template>
  <section class="page-shell grid min-h-[calc(100vh-128px)] items-center">
    <div class="mx-auto w-full max-w-md">
      <div class="mb-8">
        <p class="text-sm font-medium uppercase tracking-wide text-primary-700">CDERC</p>
        <h1 class="mt-2 text-3xl font-semibold text-gray-950">Anmelden</h1>
        <p class="mt-2 text-sm text-gray-600">Zugang zur Verwaltungsoberflaeche.</p>
      </div>

      <UCard>
        <form class="space-y-5" @submit.prevent="submit">
          <UFormField label="E-Mail" name="email" required>
            <UInput
              v-model="form.email"
              icon="i-lucide-mail"
              type="email"
              autocomplete="email"
              placeholder="name@organisation.at"
              class="w-full"
            />
          </UFormField>

          <UFormField label="Passwort" name="password" required>
            <UInput
              v-model="form.password"
              icon="i-lucide-lock-keyhole"
              type="password"
              autocomplete="current-password"
              placeholder="Passwort"
              class="w-full"
            />
          </UFormField>

          <UAlert
            v-if="error"
            color="error"
            variant="soft"
            icon="i-lucide-circle-alert"
            :description="error"
          />

          <UButton
            type="submit"
            block
            icon="i-lucide-log-in"
            :loading="pending"
            :disabled="!form.email || !form.password"
          >
            Einloggen
          </UButton>
        </form>
      </UCard>
    </div>
  </section>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const auth = useAuth()
const pending = ref(false)
const error = ref('')
const form = reactive({
  email: '',
  password: '',
})

const submit = async () => {
  error.value = ''
  pending.value = true

  try {
    await auth.login(form)
    await navigateTo('/dashboard')
  } catch {
    error.value = 'Login fehlgeschlagen. Bitte E-Mail und Passwort pruefen.'
  } finally {
    pending.value = false
  }
}
</script>
