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
                :class="row.status === 20 ? 'success-top success-bottom' : 'unsuccess-top unsuccess-bottom'"
              />
            </div>
          </td>

          <td class="text-left">{{ row.no }}</td>
          <td class="text-left">{{ row.operator }}</td>
          <td class="text-left">
            {{ row.detail }}

            <!-- แสดงไอคอน i วงกลมเฉพาะแถวที่มี tooltip -->
            <q-icon
              v-if="stepTooltips[String(row.no)]"
              name="info"              
              size="18px"
              class="q-ml-xs text-primary cursor-pointer"
              aria-label="ดูคำอธิบาย"
            >
              <q-tooltip
                :delay="0"
                anchor="top middle"
                self="bottom middle"
                :offset="[8,8]"
                transition-show="fade"
                transition-hide="fade"
                class="tooltip-lg text-body1 q-pa-sm"
              >
                <div style="white-space: pre-line; max-width: 420px;">
                  {{ stepTooltips[String(row.no)] }}
                </div>
              </q-tooltip>
            </q-icon>
          </td>

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

          <!-- ✅ ใช้คอมโพเนนต์ Upload/Preview ที่ทำไว้ -->
          <td class="text-left">
            <template v-if="shouldShowUpload(row)">
              <UploadDownloadAction
                :row="{ step: String(row.no), request_no: requestNo, file: row.file }"
                @update-row="(updated) => {
                  // จับทั้ง null/undefined/'' กรณีลบไฟล์
                  if (updated.file == null || updated.file === '') {
                    row.file = undefined
                    row.status = 10  // pending
                    // ล้างค่าที่ผูกกับไฟล์ (ถ้าต้องการให้ UI เคลียร์ด้วย)
                    row.document_no = ''
                    row.amount = undefined
                    row.date_signed = ''
                    return
                  }
                  // อัปเดตเฉพาะ field ที่เกี่ยวข้อง
                  row.file = updated.file ?? row.file
                  if (updated.document_no !== undefined) row.document_no = updated.document_no
                  if (updated.amount !== undefined) row.amount = updated.amount
                  if (updated.date_signed !== undefined) row.date_signed = updated.date_signed

                  // ถ้ามีไฟล์แล้ว → done
                  if (row.file) row.status = 20
                }"
              />
                  <small v-if="row.document_hint" class="text-caption text-grey">
            เอกสารที่ต้องใช้: {{ row.document_hint }}
          </small>
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
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, toRef } from 'vue'
import { useQuasar } from 'quasar'
import UploadDownloadAction from '~/components/UploadDownloadAction.vue'

const $q = useQuasar()

// รับ request_no จากหน้า [id].vue ผ่าน prop
const props = defineProps<{ id: string }>()
const requestNo = toRef(props, 'id')

interface TimelineItem {
  no: number | string
  operator: string
  detail: string
  status: number            // 10=pending, 20=done
  statusDesciption: string
  document: string
  document_no: string
  date: string
  comment: string
  file?: string            // <-- จะเก็บ _id ของไฟล์
  amount?: number
  date_signed?: string
  document_hint?: string
  createdAt?: string
  url?: string
}

const HIDE_UPLOAD_STEPS = new Set(['4.1', '4.2', '6', '7.1', '7.2'])

function shouldShowUpload(row: TimelineItem) {
  return !HIDE_UPLOAD_STEPS.has(String(row.no))
}

const templateMap: Record<string, string> = {
  '2': '/templates/test.pdf',
  '3': '/templates/test.pdf',
  '4': '/templates/test.pdf',
  '5': '/templates/test.pdf',
  '7': '/templates/test.pdf',
  '8': '/templates/test.pdf',
  '9': '/templates/test.pdf',
  '10': '/templates/test.pdf',
  '11': '/templates/test.pdf',
  '12': '/templates/test.pdf',
  '13': '/templates/test.pdf',
}
const stepTooltips: Record<string, string> = {
  '5': `ผู้มีอำนาจสั่งขาย ได้แก่
1. ผชก. 
2. ผจก.CEO 
3. ผจก.จุดรวมงาน 
4. ผจก.กฟส. `,
  '8': `ผู้มีอำนาจสั่งขาย ได้แก่
1. ผชก. 
2. ผจก. CEO 
3. ผจก.จุดรวมงาน 
4. ผจก. กฟส. `
}

const model = ref<TimelineItem[]>([])

function formatAmount(value: number) {
  return new Intl.NumberFormat('th-TH', { style: 'decimal', minimumFractionDigits: 0 }).format(value) + ' บาท'
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
      status: s.status === 'done' ? 20 : 10,
      statusDesciption: '',
      document: s.document ?? '',
      document_no: s.document_no ?? '',
      date: s.date ?? '',
      comment: s.comment ?? '',
      file: s.file || undefined,                         // ⬅️ ถ้ามี _id จะทำให้คอมโพเนนต์โชว์ “ดูไฟล์/ดาวน์โหลด”
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

function docHref(row: TimelineItem) {
  const stepStr = String(row.no)
  const fallback = templateMap[stepStr]
  const params = new URLSearchParams()
  params.set('request_no', requestNo.value || '')
  params.set('step', stepStr)
  if (fallback) params.set('fallback', fallback)
  return `/api/uploads/get-latest?${params.toString()}`
}
</script>

<style scoped>
.timeline { width: 30px; margin: 0 auto; }
.unsuccess-top::before { background-color: #959595 !important; }
.unsuccess-bottom::after { background-color: #959595 !important; }
.unsuccess-full::before, .unsuccess-full::after { background-color: #959595 !important; }
.success-top::before { background-color: #4caf50 !important; }
.success-bottom::after { background-color: #4caf50 !important; }
.success-full::before, .success-full::after { background-color: #4caf50 !important; }
.timeline-line-full::before {
  content: ""; position: absolute; width: 2px; height: 100%;
  transform: translate(-50%); top: 0; left: 50%; z-index: 0;
}
.timeline-line-top::before {
  content: ""; position: absolute; width: 2px; height: 50%;
  transform: translate(-50%); top: 0; left: 50%; z-index: 0;
}
.timeline-line-bottom::after {
  content: ""; position: absolute; width: 2px; height: 50%;
  transform: translate(-50%); bottom: 0; left: 50%; z-index: 0;
}
:deep(.q-tooltip.tooltip-lg) {
  font-size: 16px;   /* ขนาดตัวอักษร */
  line-height: 1.6;
  padding: 8px 10px;
}
</style>
