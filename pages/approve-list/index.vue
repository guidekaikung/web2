<template>
  <div class="q-pa-md">
    <div class="q-pa-md">
      <q-btn color="purple" label="+ สร้างขออนุมัติจำหน่าย" @click="dialog = true" />
    </div>

    <!-- ✅ แสดงข้อมูลจาก MongoDB -->
    <ApproveListDataTable :rows="rowsWithDays" />

    <!-- ✅ Popup ฟอร์มสร้าง request -->
    <q-dialog v-model="dialog" persistent>
      <q-card style="min-width: 400px">
        <q-card-section class="text-h6">
          สร้างขออนุมัติจำหน่าย
        </q-card-section>

        <q-separator />

        <q-card-section>
          <q-form @submit.prevent="handleSubmit">
            <q-input v-model="form.document_no" label="หนังสือเลขที่" filled dense class="q-mb-sm" />
            <q-input v-model="form.document_date" label="ลงวันที่" filled dense type="date" class="q-mb-sm" />

            <div class="q-mt-md row justify-end">
              <q-btn flat label="ยกเลิก" color="negative" @click="dialog = false" />
              <q-btn label="บันทึก" type="submit" color="primary" class="q-ml-sm" />
            </div>
          </q-form>
        </q-card-section>
      </q-card>
    </q-dialog>
  </div>
</template>


<script setup lang="ts">
definePageMeta({
  middleware: ["auth"],
})

import { ref, reactive, onMounted, computed } from 'vue'
import ApproveListDataTable from '~/components/approve/list/DataTable.vue'

const dialog = ref(false)

const form = reactive({
  document_no: '',
  document_date: ''
})
interface Row {
  request_no: string
  book_no: string
  book_date: string
  created_at: string
  last_status?: string
  amount_sell?: number
  comment?: string
}

// ⬇️ กำหนด type ให้ rows อย่างถูกต้อง
const rows = ref<Row[]>([])

// ⬇️ โหลดข้อมูลจาก MongoDB
const fetchRows = async () => {
  try {
    const res = await $fetch('/api/rows')
    rows.value = res
  } catch (err) {
    console.error('โหลด rows ไม่ได้:', err)
  }
}

// ⬇️ ส่งข้อมูลไปสร้าง request ใหม่
const handleSubmit = async () => {
  try {
    await $fetch('/api/rows/create', {
      method: 'POST',
      body: {
        book_no: form.document_no,
        book_date: form.document_date
      }
    })

    dialog.value = false
    form.document_no = ''
    form.document_date = ''
    await fetchRows()
  } catch (err) {
    console.error('บันทึกไม่สำเร็จ:', err)
  }
}

// ⬇️ คำนวณ date_count_approved เป็น "xx วัน"
const rowsWithDays = computed(() =>
  rows.value.map((r, index) => {
    const bookDate = r.book_date ?? ''
    const today = new Date().toISOString().split('T')[0] as string

    const calculateDays = (startDateStr: string, endDateStr: string): number => {
      const startDate = new Date(startDateStr)
      const endDate = new Date(endDateStr)
      const diff = endDate.getTime() - startDate.getTime()
      return Math.ceil(diff / (1000 * 60 * 60 * 24))
    }

    return {
      ...r,

      // 🟣 เพิ่ม alias ให้ตรงกับชื่อ column ที่ตารางใช้
      document_no: r.book_no,
      document_date: r.book_date,
      order: index + 1, // ใช้ index แทนลำดับ

      date_count_approved: bookDate ? `${calculateDays(bookDate, today)} วัน` : '-',

      // ป้องกัน error ใน column อื่นที่รอ field พวกนี้อยู่
      amount_sell: r.amount_sell ?? 0,
      comment: r.comment ?? ''
    }
  })
)

onMounted(fetchRows)
</script>