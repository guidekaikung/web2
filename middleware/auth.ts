export default defineNuxtRouteMiddleware((to, from) => {
    if (import.meta.client) {
      const { $keycloak } = useNuxtApp();
      const { baseUrl } = useRuntimeConfig().public;
      // console.log('auth middleware '+baseUrl)
      if (!$keycloak.authenticated) {
        $keycloak.login({
          redirectUri: `${baseUrl}${to.path}`,
        });
        return abortNavigation();
      }
    }
  });