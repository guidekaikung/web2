<template>
  <div class="q-pa-md">
    <div class="q-pa-md">
      <q-btn color="purple" label="+ เพิ่มกรรมการ" @click="openDialog" />
    </div>

    <CommitteeListDataTable :rows="rows" @dataUpdated="handleDataUpdated" />

    <!-- Dialog กรอกข้อมูล -->
    <CommitteeDialog ref="dialogRef" @save="onDialogSave" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import CommitteeDialog from '~/components/committee/edit/dialog.vue' 
definePageMeta({ middleware: ["auth"] })

// ข้อมูลกรรมการ
const rows = ref<any[]>([
  {
    committee_position: "ประธานกรรมการ",
    create_date: "2024-09-01",
    committee_name: "คุณฟ้า",
    order: 1,
  },
  {
    order: 2,
    committee_position: "กรรมการ",
    create_date: "2024-09-01",
    committee_name: "คุณไอซ์",
  },
  {
    order: 3,
    committee_position: "กรรมการ",
    create_date: "2024-09-01",
    committee_name: "คุณไอซ์",
  },
]);

// 🎯 dialog ที่จะถูกเปิด
const dialogRef = ref();

const openDialog = () => {
  dialogRef.value.open();
};

// เมื่อกดบันทึกใน dialog
const onDialogSave = (newItem: any) => {
  const nextOrder = rows.value.length + 1;
  rows.value = [
    ...rows.value,
    {
      ...newItem,
      order: nextOrder,
      create_date: new Date().toISOString().split("T")[0],
    }
  ];
};

// ยังใช้สำหรับ reload ข้อมูลได้ในอนาคต
const handleDataUpdated = () => {
  const newRows = [
    {
      committee_position: "ประธานกรรมการ",
      create_date: "2024-09-01",
      committee_name: "น้องฟ้า",
      order: 1,
    },
    {
      order: 2,
      committee_position: "กรรมการ",
      create_date: "2024-09-01",
      committee_name: "น้องไอซ์",
    },
    {
      order: 3,
      committee_position: "กรรมการ",
      create_date: "2024-09-01",
      committee_name: "น้องไอซ์",
    },
  ];
  rows.value = [...newRows];
};
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
definePageMeta({
  middleware:["auth"],
})

const rows = ref<any>([]);

rows.value = [
  {
    committee_position: "ประธานกรรมการ",
    create_date: "2024-09-01",
    committee_name: "น้องฟ้า",
    order: 1,
  },
  {
    order: 2,
    committee_position: "กรรมการ",
    create_date: "2024-09-01",
    committee_name: "น้องไอซ์",
   
  },
  {
    order: 3,
    committee_position: "กรรมการ",
    create_date: "2024-09-01",
    committee_name: "น้องไอซ์",
   
  },
];

const handleDataUpdated = () => {
  
  const newRows = [
    {
      committee_position: "ประธานกรรมการ",
      create_date: "2024-09-01",
      committee_name: "น้องฟ้า",
      order: 1,
    },
    {
      order: 2,
      committee_position: "กรรมการ",
      create_date: "2024-09-01",
      committee_name: "น้องไอซ์",
    },
    {
      order: 3,
      committee_position: "กรรมการ",
      create_date: "2024-09-01",
      committee_name: "น้องไอซ์",
    },
  ];
  rows.value = [...newRows];
};


</script>

<style scoped>

</style> -->