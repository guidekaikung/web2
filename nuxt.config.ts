// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  quasar: {
    lang: "th",
    sassVariables: "@/assets/scss/quasar.variables.scss",
    plugins: ["Dialog", "Loading", "Notify"],
    // Configurable Component Defaults
    components: {
      defaults: {},
    },
  },
  plugins:["~/plugins/keycloak.client","~/plugins/lotties.client"],
  css: ["@/assets/scss/app.scss"],
  modules: ["nuxt-quasar-ui", "@nuxtjs/google-fonts"],
  // css: ['~/assets/scss/main.scss'],
  compatibilityDate: "2024-04-03",
  devtools: { enabled: true },
  googleFonts: {
    families: { Sarabun: [400, 700], "Noto Sans Thai": [400, 700] },
  },
  runtimeConfig: {
    public: {
      baseUrl: process.env.NUXT_PUBLIC_BASE_URL,
      serviceUrl: process.env.NUXT_PUBLIC_SERVICE_URL,
      kcUrl: process.env.NUXT_PUBLIC_KC_URL,
      kcRealm: process.env.NUXT_PUBLIC_KC_REALM,
      kcClientId: process.env.NUXT_PUBLIC_KC_CLIENT_ID,
      KEYCLOAK_URL: process.env.KEYCLOAK_URL,
      KEYCLOAK_REALM: process.env.KEYCLOAK_REALM,
      KEYCLOAK_CLIENT_ID: process.env.KEYCLOAK_CLIENT_ID,
      KEYCLOAK_CLIENT_SECRET: process.env.KEYCLOAK_CLIENT_SECRET,
    },
  },

});
