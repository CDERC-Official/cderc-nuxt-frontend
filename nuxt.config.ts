export default defineNuxtConfig({
  ssr: false,
  modules: ['@nuxt/ui'],
  css: ['~/assets/css/main.css'],
  devtools: { enabled: true },
  runtimeConfig: {
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE || 'http://localhost:30007/api',
    },
  },
  app: {
    head: {
      title: 'CDERC',
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        {
          name: 'description',
          content: 'CDERC Verwaltungsoberflaeche fuer Kinder, Organisationen und Nutzer.',
        },
      ],
    },
  },
  compatibilityDate: '2026-06-09',
})
