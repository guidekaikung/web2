<template>
  <div>
    <q-header elevated class="my-menu-link" height-hint="98">
      <q-toolbar>
        <q-btn dense flat round icon="menu" @click="toggleLeftDrawer" />

        <q-toolbar-title>
          <q-avatar>
            <!-- <img src="favicon.png" /> -->
          </q-avatar>
          Write off Asset Managment (WAM)
        </q-toolbar-title>
      </q-toolbar>
    </q-header>
    <q-drawer v-model="leftDrawerOpen" :show-if-above="false" bordered>
      <q-list>
        <themenu v-for="item in menu" :key="item.name" v-bind="item" />

        <q-item v-ripple clickable exact active-class="my-menu-link">
          <q-item-section avatar>
            <q-icon name="logout" />
          </q-item-section>
          <q-item-section @click="handleUserLogout">ออกจากระบบบ</q-item-section>
        </q-item>
      </q-list>
    </q-drawer>
  </div>
</template>

<script setup lang="ts">
const { $keycloak } = useNuxtApp();
const { baseUrl } = useRuntimeConfig().public;
const leftDrawerOpen = ref(true);
function toggleLeftDrawer() {
  leftDrawerOpen.value = !leftDrawerOpen.value;
}
const menu = ref([
  {
    name: "หน้าหลัก",
    path: "/",
    icon: "home",
  },
  {
    name: "คณะกรรมการ",
    // path: "/",
    icon: "manage_accounts",
    children: [
      {
        name: "คณะกรรมการสอบหาข้อเท็จจริง",
        path: "/committee",
      },
      {
        name: "คณะกรรมการประเมินราคา",
        path: "/committee/price",
      },
      {
        name: "คณะกรรมการดำเนินการขาย",
        path: "/committee/sale",
      },
      {
        name: "คณะกรรมการส่งมอบพัสดุ",
        path: "/committee/transfer",
      },
    ],
  },{
    name: "อนุมัติจำหน่ายมิเตอร์",
    path: "/approve-list",
    icon: "insert_drive_file",
  },
  // {
  //   name: "อนุมัติจำหน่ายมิเตอร์",
  //   path: "/approve-list",
  //   icon: "insert_drive_file",
  //   children: [
  //     {
  //       name: "งบลงทุน จัดซื้อพัสดุ",
  //       path: "/investment",
  //     },
  //     {
  //       name: " งบสำรองกรณีจำเป็นเร่งด่วน",
  //       path: "/urgent",
  //     },
  //   ],
  // },
  // {
  //   name: "ติดต่อ",
  //   path: "/about",
  //   icon: "money",
  // },
]);
function handleUserLogout() {
  $keycloak.logout({
    redirectUri: `${baseUrl}/authentication/login`,
  });
}
</script>

<style lang="scss">
.my-menu-link {
  color: #e1daef;
  background: $purple;
}
</style>
