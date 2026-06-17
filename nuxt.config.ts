export default defineNuxtConfig({
  ssr: false,
  modules: ['@nuxt/ui', '@nuxtjs/i18n'],
  css: ['~/assets/css/main.css'],
  devtools: { enabled: false },
  runtimeConfig: {
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE || 'http://localhost:30007/api',
    },
  },
  i18n: {
    defaultLocale: 'de',
    strategy: 'no_prefix',
    detectBrowserLanguage: false,
    locales: [
      { code: 'de', name: 'Deutsch', language: 'de-AT' },
      { code: 'en', name: 'English', language: 'en-US' },
    ],
    vueI18n: './i18n.config.ts',
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

