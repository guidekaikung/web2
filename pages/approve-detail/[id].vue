<template>
  <div class="q-pa-md">
    <!-- ส่ง request_no ไปให้คอมโพเนนต์ -->
    <TimeLine :id="String(route.params.id || '')" />
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: ['auth'] })
const route = useRoute()

// ✅ ปรับ path ให้ตรงกับที่ไฟล์คุณอยู่จริง
// ถ้าไฟล์อยู่ components/approve/detail/TimeLine.vue ใช้บรรทัดนี้
import TimeLine from '~/components/approve/detail/TimeLine.vue'

// ถ้าไฟล์อยู่ components/TimeLine.vue ให้ใช้:
// import TimeLine from '~/components/TimeLine.vue'
</script>
