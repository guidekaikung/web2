<template>
  <div class="q-pa-md">
    <div class="q-pa-md">
      <q-btn color="purple" label="+ สร้างขออนุมัติจำหน่าย" @click="dialog = true" />
    </div>
    <!--  ตัวกรองปี -->
    <div class="row items-center q-gutter-sm q-mb-sm justify-end">
      <q-select
        v-model="yearFilter"
        :options="yearOptions"
        emit-value
        map-options
        clearable
        label="ปี"
        dense
        outlined
        style="width: 140px"
      />
    </div>
    <!--  แสดงข้อมูลจาก MongoDB -->
    <ApproveListDataTable :rows="rowsWithDays" />

    <!--  Popup ฟอร์มสร้าง request -->
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
definePageMeta({ middleware: ['auth'] })

import { ref, reactive, onMounted, computed } from 'vue'
import ApproveListDataTable from '~/components/approve/list/DataTable.vue'

const dialog = ref(false)

const form = reactive({
  document_no: '',
  document_date: ''
})

/** ชนิดของแถวในตาราง (ทำเป็น optional เผื่อบางรายการยังไม่มีค่า) */
type Row = {
  request_no: string
  book_no?: string
  book_date?: string
  created_at: string
  step3_at?: string
  last_status?: string
  amount_sell?: number
  comment?: string
}

const rows = ref<Row[]>([])

/** โหลดข้อมูลจาก API — ใส่ generic ให้ $fetch แก้ unknown[] */
const fetchRows = async () => {
  try {
    // กรณี API คืนเป็น array ตรง ๆ:  [ ...rows ]
    const res = await $fetch<Row[]>('/api/rows')
    rows.value = res

    // 👇 ถ้า API ของคุณคืนเป็น { ok:true, data:[...] } ให้ใช้แบบนี้แทน:
    // const res = await $fetch<{ ok: boolean; data: Row[] }>('/api/rows')
    // rows.value = res.data
  } catch (err) {
    console.error('โหลด rows ไม่ได้:', err)
  }
}

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

/**คำนวณจำนวนวัน */
const toLocalStartOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate())
const diffDaysLocalInclusive = (start: Date, end: Date) => {
  const s = toLocalStartOfDay(start)
  const e = toLocalStartOfDay(end)
  const days = Math.floor((e.getTime() - s.getTime()) / 86400000) + 1
  return Math.max(1, days)
}
const pickUploadDateString = (r: Partial<Row> & Record<string, any>): string | null => {
  // ใช้แค่วันจาก Step 3
  const cand = r.step3_at ?? null
  if (!cand) return null
  const s = String(cand)
  return s.includes('T') ? s : `${s}T00:00:00`
}

/** enrich แถวสำหรับ DataTable */
const rowsWithDays = computed(() =>
  rows.value.map((r, index) => {
    const uStr = pickUploadDateString(r as any)
    const daysText = uStr ? `${diffDaysLocalInclusive(new Date(uStr), new Date())} วัน` : '-'
    return {
      ...r,
      document_no: r.book_no ?? '',     // ใช้ book_no เป็นหนังสือเลขที่
      document_date: r.book_date ?? '', // ใช้ book_date เป็นลงวันที่
      order: index + 1,
      date_count_approved: daysText,
      amount_sell: r.amount_sell ?? 0,
      comment: r.comment ?? ''
    }
  })
)
// ปีที่เลือก (เช่น 2024, 2025)
const yearFilter = ref<number | null>(null)

// รายการปีให้เลือก (ดึงจากข้อมูลจริง)
const yearOptions = computed(() => {
  const s = new Set<number>()
  rows.value.forEach((r) => {
    // ดึงปีจาก book_date (ถ้าไม่มี ใช้ created_at พอเป็นตัวช่วยสร้างรายการปี)
    const cand = r.book_date ?? r.created_at
    if (cand) {
      const y = new Date(String(cand)).getFullYear()
      if (!Number.isNaN(y)) s.add(y)
    }
  })
  return Array.from(s).sort((a, b) => b - a).map(y => ({ label: String(y), value: y }))
})

// กรองตามปีที่เลือก แล้วค่อย map เป็น rowsWithDays
const filteredRowsWithDays = computed(() => {
  // ใช้ document_date ที่เราสร้างไว้ใน rowsWithDays (รูปแบบ YYYY-MM-DD)
  const filtered = rows.value.filter(r => {
    if (!yearFilter.value) return true
    const raw = r.book_date ?? r.created_at
    if (!raw) return false
    const y = new Date(String(raw)).getFullYear()
    return y === yearFilter.value
  })

  // ทำเหมือน rowsWithDays เดิม แต่กับ 'filtered'
  return filtered.map((r, index) => {
    const uStr = pickUploadDateString(r as any)
    const daysText = uStr ? `${diffDaysLocalInclusive(new Date(uStr), new Date())} วัน` : '-'
    return {
      ...r,
      document_no: r.book_no ?? '',
      document_date: r.book_date ?? '',
      order: index + 1,
      date_count_approved: daysText,
      amount_sell: r.amount_sell ?? 0,
      comment: r.comment ?? ''
    }
  })
})

onMounted(fetchRows)
</script>
