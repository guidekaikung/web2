<template>
  <q-page class="column flex-center login-page">
    <q-card flat bordered class="login-card">
      <q-card-section>
        <lottie-construction-in-process />
        <div class="text-center" style="font-size: 2.5dvh">
          ระบบติดตามการจำหน่ายมิเตอร์ (WAM)
        </div>
      </q-card-section>
      <q-separator inset />
      <q-card-section>
        <div>
      <Vue3Lottie
      :animationData="data"
      :height="200"
      :width="200"
      :speed="2.5"
    />
        <client-only>
        <q-btn  unelevated
          class="full-width"
          color="primary"
          size="md" label="เข้าสู่ระบบด้วย PEA SSO" @click="onClickLogin"></q-btn>
    </client-only>
       
    </div>
        
      </q-card-section>
      <q-card-section class="text-font-primary text-center text-caption">
        พบปัญหาในการเข้าใช้ระบบโปรดติดต่อ
        <br />
        แผนกบัญชีก่อสร้างทรัพย์สิน กบฟ.ฝสบ.น.3 (13)10321
        <div>
       
        </div>
      </q-card-section>
    </q-card>
  </q-page>

    
</template>

<script setup lang="ts">
import data from '~/assets/lotties/delivery.json'
definePageMeta({
  layout:"authentication"
})
const {$keycloak} = useNuxtApp();
const {baseUrl} = useRuntimeConfig().public;

function onClickLogin(){
    if ($keycloak) { // ตรวจสอบว่า keycloak ถูกกำหนด
    console.log($keycloak);
    console.log(baseUrl);
    $keycloak.login({
      redirectUri: `${baseUrl}/`,
    });
  } else {
    console.error("Keycloak is not defined");
  }
}

</script>

<style scoped>

</style>