<template>
  <div class="q-pa-md">
    <q-markup-table separator="vertical" wrap-cells>
      <thead>
        <tr>
          <th class="text-center" style="width: 10%">TIMELINE</th>
          <th class="text-center">ลำดับ</th>
          <th class="text-center">ผู้ดำเนินการ</th>
          <th class="text-center">ขั้นตอน/รายละเอียด</th>
          <th class="text-center">เอกสาร</th>
          <th class="text-center">Action</th>
          <th class="text-center">เลขที่หนังสือ</th>
          <th class="text-center">หมายเหตุ</th>
          <th class="text-center">ลงวันที่</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(row, i) in model" :key="i">
          <td style="position: relative">
            <div class="timeline" :class="timelineClass(row, i)">
              <q-icon
                v-if="typeof row.no === 'number'"
                :name="row.status === 20 ? 'check_circle' : 'schedule'"
                :color="row.status === 20 ? 'green' : 'grey'"
                size="30px"
                style="z-index: 10; background-color: white; border-radius: 50%"
              />
              <div
                v-else
                class="timeline timeline-line-full"
                :class="
                  row.status === 20
                    ? 'success-top success-bottom'
                    : 'unsuccess-top unsuccess-bottom'
                "
              ></div>
            </div>
          </td>
          <td class="text-left">{{ row.no }}</td>
          <td class="text-left">{{ row.operator }}</td>
          <td class="text-left">{{ row.detail }}</td>
          <td class="text-left">
            <template v-if="templateMap[String(row.no)]">
              <a :href="docHref(row)" class="text-primary">
                {{ row.document }}
              </a>
            </template>
            <template v-else>
              {{ row.document || '-' }}
            </template>
          </td>
          <td class="text-left">
            <template v-if="!['4.1', '4.2', '6', '7.1', '7.2'].includes(String(row.no))">
              <div class="column">
                <q-btn flat label="Upload" @click="openUploadDialog(i)" />
                <small v-if="row.document_hint" class="text-caption text-grey">
                  เอกสารที่ต้องใช้: {{ row.document_hint }}
                </small>
              </div>
            </template>
          </td>
          <td class="text-left">
            <template v-if="row.amount">
              {{ row.document_no }} — จำนวนเงิน: {{ formatAmount(row.amount) }}
            </template>
            <template v-else>
              {{ row.document_no || '-' }}
            </template>
          </td>
          <td class="text-left">{{ row.comment }}</td>
          <td class="text-left">{{ row.createdAt ? row.createdAt.split('T')[0] : row.date }}</td>
        </tr>
      </tbody>
    </q-markup-table>
    <!-- ✅ ข้อ 3: Upload Popup -->
    <q-dialog v-model="showDialog">
      <q-card style="min-width: 400px">
        <q-card-section>
          <div class="text-h6">อัปโหลดเอกสาร</div>
        </q-card-section>
        <q-card-section>
          <q-file v-model="uploadForm.file" label="เลือกไฟล์เอกสาร" filled />
          <q-input v-model="uploadForm.date_signed" label="วันที่ลงหนังสือ" type="date" filled class="q-mt-sm" />
          <q-input
            v-if="['2','3'].includes(String(currentStep?.no))"
            v-model="uploadForm.document_no"
            label="เลขที่หนังสือ"
            filled class="q-mt-sm"
          />
          <q-input
            v-if="String(currentStep?.no) === '9'"
            v-model.number="uploadForm.amount"
            label="จำนวนเงิน"
            type="number"
            filled class="q-mt-sm"
          />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="ยกเลิก" v-close-popup />
          <q-btn color="primary" label="อัปโหลด" @click="confirmUpload" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, toRef } from 'vue'
import axios from 'axios'
import { useQuasar } from 'quasar'

const $q = useQuasar()

// รับ request_no จากหน้า [id].vue ผ่าน prop
const props = defineProps<{ id: string }>()
const requestNo = toRef(props, 'id')

interface TimelineItem {
  no: number | string
  operator: string
  detail: string
  status: number            // 10=pending, 20=done (เพื่อให้ class/ไอคอนเดิมใช้ได้)
  statusDesciption: string
  document: string
  document_no: string
  date: string
  comment: string
  file?: string
  amount?: number
  date_signed?: string
  document_hint?: string
  createdAt?: string
  url?: string
}
const templateMap: Record<string, string> = {
  '2':   'test.pdf',          // หนังสือขออนุมัติจำหน่ายมิเตอร์ฯ
  '3':   'test.pdf',           // หนังสืออนุมัติจำหน่ายจากผู้มีอำนาจฯ
  '4':   'test.pdf',           // คำนวณราคาและขออนุมัติฯ
  '5':   'test.pdf',           // หนังสืออนุมัติหลักการขาย
  '7':   'test.pdf',
  '8':   'test.pdf',
  '9':   'test.pdf',
  '10':   'test.pdf',
  '11':   'test.pdf',
  '12':   'test.pdf',
  '13':   'test.pdf',
}


const model = ref<TimelineItem[]>([])

const showDialog = ref(false)
const currentIndex = ref(-1)
const currentStep = ref<TimelineItem | null>(null)

const uploadForm = ref({
  file: null as File | null,
  date_signed: '',
  document_no: '',
  amount: null as number | null
})

const DEV_FILE_BY_STEP: Record<string, string> = {
  '1': '/files/test.pdf',
  '2': '/files/test.pdf',
  '3': '/files/test.pdf',
  '4': '/files/test.pdf',
  '5': '/files/test.pdf',
  '6': '/files/test.pdf',
  '7': '/files/test.pdf',
}

function formatAmount(value: number) {
  return new Intl.NumberFormat('th-TH', {
    style: 'decimal',
    minimumFractionDigits: 0
  }).format(value) + ' บาท'
}

function openUploadDialog(index: number) {
  currentIndex.value = index
  currentStep.value = model.value[index] || null
  showDialog.value = true
  uploadForm.value = {
    file: null,
    date_signed: '',
    document_no: currentStep.value?.document_no || '',
    amount: currentStep.value?.amount ?? null
  }
}

async function confirmUpload() {
  const stepNo = currentStep.value?.no
  const file = uploadForm.value.file
  if (!file || !stepNo) return

  const allowedExtensions = ['.doc', '.docx', '.xls', '.xlsx', '.pdf', '.txt']
  const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase()
  if (!allowedExtensions.includes(ext)) {
    $q.notify({ type: 'negative', message: 'ไฟล์ไม่อยู่ในรูปแบบที่อนุญาต' })
    return
  }

  const formData = new FormData()
  formData.append('file', file)
  formData.append('step', String(stepNo))
  formData.append('date_signed', uploadForm.value.date_signed)
  formData.append('document_no', uploadForm.value.document_no || '')
  formData.append('request_no', requestNo.value)
  if (uploadForm.value.amount !== null && !isNaN(uploadForm.value.amount)) {
    formData.append('amount', String(uploadForm.value.amount))
  }

   try {
    // ✅ ยอมรับ 400/409 กลับมาให้เราตรวจเอง (จะได้อ่าน user_message)
    const res = await axios.post('/api/uploads/upload', formData, {
      validateStatus: s => (s >= 200 && s < 300) || s === 400 || s === 409
    })

    if (res.status < 300 && res.data?.success) {
      // อัปเดต UI ตามของเดิม
      const item = model.value[currentIndex.value]
      if (item) {
        item.file = res.data.id
        item.document_no = uploadForm.value.document_no
        item.amount = uploadForm.value.amount ?? undefined
        item.date_signed = uploadForm.value.date_signed
        item.createdAt = res.data.createdAt || new Date().toISOString()
        item.status = 20
      }
      $q.notify({ type: 'positive', message: 'อัปโหลดเรียบร้อย' })
      showDialog.value = false
      return
    }

    // ❌ เคส error จาก backend: ดึง user_message มาก่อน ถ้าไม่มีค่อย fallback เป็น error/code
    const d = res.data || {}
    $q.notify({
      type: 'negative',
      message: d.user_message || d.error || 'อัปโหลดไม่สำเร็จ',
      caption: d.code ? String(d.code) : `HTTP ${res.status}`
    })
  } catch (err: any) {
    // ❌ network จริง ๆ (เช่น เซิร์ฟเวอร์ดับ) หรือ axios โยน error อย่างอื่น
    console.error(err)
    const d = err?.response?.data || {}
    $q.notify({
      type: 'negative',
      message: d.user_message || 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้',
      caption: d.code ? String(d.code) : (err?.message || 'Network error')
    })
  }
}

function timelineClass(row: TimelineItem, index: number) {
  let response = ''
  if (row.status === 20) {
    response += 'success-top success-bottom '
    if (index === 0) {
      response += 'timeline-line-bottom'
    } else if (model.value[index - 1]?.status === 20) {
      response += 'timeline-line-full'
    } else if (index + 1 === model.value.length) {
      response += 'timeline-line-top'
    } else if (model.value[index + 1]?.status) {
      response += 'timeline-line-top timeline-line-bottom'
    }
  } else if (row.status === 10) {
    if (model.value[index - 1]?.status === 20) {
      response += 'success-top unsuccess-bottom timeline-line-top timeline-line-bottom'
    } else if (index === model.value.length - 1) {
      response += 'unsuccess-top timeline-line-top timeline-line-bottom'
    } else {
      response += 'unsuccess-top unsuccess-bottom timeline-line-top timeline-line-bottom'
    }
  }
  return response
}

const downloadFile = async (id: string) => {
  try {
    const res = await fetch(`/api/uploads/get-download?id=${encodeURIComponent(id)}`)
    if (!res.ok) throw new Error('ไม่พบไฟล์')

    const blob = await res.blob()
    const disposition = res.headers.get('Content-Disposition')

    let filename = 'download.pdf'
    if (disposition) {
      const utf8Match = disposition.match(/filename\*=UTF-8''(.+)/)
      const simpleMatch = disposition.match(/filename="(.+)"/)
      if (utf8Match && utf8Match[1]) {
        filename = decodeURIComponent(utf8Match[1])
      } else if (simpleMatch && simpleMatch[1]) {
        filename = simpleMatch[1]
      }
    }

    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.click()
    URL.revokeObjectURL(url)
  } catch (e) {
    $q.notify({ type: 'negative', message: 'ไม่พบไฟล์สำหรับดาวน์โหลด' })
  }
}

/* ========== โหลด Timeline จาก API ตาม request_no ========== */
async function fetchTimeline(rno: string) {
  if (!rno) return
  try {
  const res: any = await $fetch(`/api/timelines/${encodeURIComponent(rno)}`)
  const steps = res?.steps ?? []
  model.value = steps.map((s: any) => ({
    no: s.no,
    operator: s.operator ?? '',
    detail: s.detail ?? '',
    status: s.status === 'done' ? 20 : 10,   // map → UI 10/20
    statusDesciption: '',
    document: s.document ?? '',
    document_no: s.document_no ?? '',
    date: s.date ?? '',
    comment: s.comment ?? '',
    file: s.file || undefined,
    amount: s.amount ?? undefined,
    date_signed: s.date_signed ?? '',
    document_hint: s.document_hint ?? '',
    createdAt: s.createdAt ? new Date(s.createdAt).toISOString() : '',
    url: s.url ?? ''
    }))
  } catch (err) {
    console.error('Load timeline error:', err)
    $q.notify({ type: 'negative', message: 'โหลด Timeline ไม่ได้' })
    model.value = []
  }
}

onMounted(() => { if (requestNo.value) fetchTimeline(requestNo.value) })
watch(requestNo, (v) => { if (v) fetchTimeline(v) })

function docHref(row: TimelineItem) {
  const stepStr = String(row.no)
  const fallback = templateMap[stepStr] // อาจเป็น undefined ได้

  const params = new URLSearchParams()
  params.set('request_no', requestNo.value || '')
  params.set('step', stepStr)
  if (fallback) params.set('fallback', fallback)  // ใส่เฉพาะเมื่อมีจริง

  return `/api/uploads/get-latest?${params.toString()}`
}
</script>



<style scoped>
.timeline {
  width: 30px;
  margin: 0 auto;
}
.unsuccess-top::before {
  background-color: #959595 !important;
}
.unsuccess-bottom::after {
  background-color: #959595 !important;
}
.unsuccess-full::before,
.unsuccess-full::after {
  background-color: #959595 !important;
}
.success-top::before {
  background-color: #4caf50 !important;
}
.success-bottom::after {
  background-color: #4caf50 !important;
}
.success-full::before,
.success-full::after {
  background-color: #4caf50 !important;
}
.timeline-line-full::before {
  content: "";
  position: absolute;
  width: 2px;
  height: 100%;
  transform: translate(-50%);
  top: 0;
  left: 50%;
  z-index: 0;
}
.timeline-line-top::before {
  content: "";
  position: absolute;
  width: 2px;
  height: 50%;
  transform: translate(-50%);
  top: 0;
  left: 50%;
  z-index: 0;
}
.timeline-line-bottom::after {
  content: "";
  position: absolute;
  width: 2px;
  height: 50%;
  transform: translate(-50%);
  bottom: 0;
  left: 50%;
  z-index: 0;
}
</style>
