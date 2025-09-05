export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.provide('keycloak', {
    login: () => console.log("🔓 Mock login เรียบร้อย"),
    logout: () => console.log("🚪 Mock logout เรียบร้อย"),
    token: "mock-token",
    authenticated: true,
    idTokenParsed: {
      preferred_username: "mockuser",
      name: "Bypass User",
      email: "bypass@example.com"
    }
  })
})
/*
import { defineNuxtPlugin } from '#app/nuxt'
import Keycloak from 'keycloak-js'

export default defineNuxtPlugin((nuxtApp) => {
  if (process.client) {
    const runtimeConfig = useRuntimeConfig()
    const keycloak = new Keycloak({
      url: runtimeConfig.public.keycloakUrl,
      realm: runtimeConfig.public.keycloakRealm,
      clientId: runtimeConfig.public.keycloakClientId,
    })

    keycloak.init({
      onLoad: 'login-required',
      checkLoginIframe: false
    }).then((authenticated) => {
      if (authenticated) {
        nuxtApp.provide('keycloak', keycloak)
      } else {
        keycloak.login()
      }
    })
  }
})
*/
