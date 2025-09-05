<template>
  <div class="q-pa-md">
    <div class="q-pa-md">
      <q-btn color="purple" label="+ เพิ่มกรรมการ" @click="openDialog" />
    </div>

    <CommitteeListDataTable :rows="rows" @dataUpdated="handleDataUpdated" />

    <!-- ✅ เรียก Dialog -->
    <CommitteeDialog ref="dialogRef" @save="onDialogSave" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import CommitteeDialog from '~/components/committee/edit/dialog.vue' 
definePageMeta({ middleware: ["auth"] })

const rows = ref<any[]>([
  {
    committee_position: "ประธานกรรมการ",
    create_date: "2024-09-01",
    committee_name: "คุณนภัสสร",
    order: 1,
  },
  {
    committee_position: "กรรมการ",
    create_date: "2024-09-01",
    committee_name: "คุณกฤตภาส",
    order: 2,
  },
  {
    committee_position: "กรรมการ",
    create_date: "2024-09-01",
    committee_name: "คุณมัณฑนา",
    order: 3,
  }
])

// === เปิด dialog
const dialogRef = ref()
const openDialog = () => {
  dialogRef.value.open()
}

// === เมื่อกด “บันทึก” ใน dialog
const onDialogSave = (newItem: any) => {
  const nextOrder = rows.value.length + 1
  rows.value = [
    ...rows.value,
    {
      ...newItem,
      order: nextOrder,
      create_date: new Date().toISOString().split("T")[0],
    }
  ]
}

// === ไว้สำหรับอัปเดตจากลูก component
const handleDataUpdated = () => {
  rows.value = [...rows.value]
}
</script>



<!-- <template>
  <div class="q-pa-md">
    <div class="q-pa-md">
      <q-btn color="purple" label="+ เพิ่มกรรมการ"></q-btn>
    </div>
    <CommitteeListDataTable :rows="rows" @dataUpdated="handleDataUpdated" />
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: ["auth"] })

const rows = ref<any[]>([
  {
    committee_position: "ประธานกรรมการ",
    create_date: "2024-09-01",
    committee_name: "คุณนภัสสร",
    order: 1,
  },
  {
    committee_position: "กรรมการ",
    create_date: "2024-09-01",
    committee_name: "คุณกฤตภาส",
    order: 2,
  },
  {
    committee_position: "กรรมการ",
    create_date: "2024-09-01",
    committee_name: "คุณมัณฑนา",
    order: 3,
  }
])

const handleDataUpdated = () => {
  rows.value = [...rows.value]
}
</script>
 -->