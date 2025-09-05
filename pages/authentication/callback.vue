<template>
    <div >
        <client-only>
            <pre>{{userInfo}}</pre>
        </client-only>
    </div>
</template>

<script setup lang="ts">
const {$keycloak} = useNuxtApp();
const userInfo = ref();
onMounted(async ()=>{
    userInfo.value = await $keycloak?.loadUserInfo();
})
</script>

<style scoped>

</style>