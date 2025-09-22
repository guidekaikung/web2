<template>
  <div class="row items-center q-gutter-sm">
    <!-- ยังไม่มีไฟล์ -->
    <div v-if="!row.file">
      <q-uploader
        :factory="uploadFactory"
        field-name="file"
        :max-files="1"
        accept=".doc,.docx,.xls,.xlsx,.pdf,.txt"
        @uploaded="(info) => handleUpload(info, row)"
        @failed="onUploadFailed"
        label="อัปโหลด"
        auto-upload
        hide-upload-btn
        style="max-width: 150px;"
      />
    </div>

    <!-- มีไฟล์แล้ว -->
    <div v-else class="row items-center q-gutter-sm">
      <q-btn color="secondary" label="ดูไฟล์" icon="visibility" @click.stop="openPreview()" />
      <q-btn
        color="negative"
        label="ลบไฟล์"
        icon="delete"
        :loading="deleting"
        @click="confirmDelete"
      />
    </div>

    <!-- Preview dialog -->
    <q-dialog v-model="preview.open" persistent @hide="closePreview">
      <q-card style="min-width:80vw; max-width:90vw; min-height:60vh;">
        <q-card-section class="row items-center justify-between">
          <div class="text-h6 ellipsis">{{ preview.name || 'Preview' }}</div>
          <div class="row items-center q-gutter-sm">
            <q-btn type="a" :href="downloadUrl()" target="_blank" rel="noopener" icon="download" flat label="ดาวน์โหลด" />
            <q-btn icon="close" flat label="ปิด" @click="closePreview"/>
          </div>
        </q-card-section>

        <q-separator/>

        <q-card-section class="q-pa-none" style="height:calc(80vh - 120px);">
          <div v-if="loading" class="row items-center justify-center" style="height:100%;">
            <q-spinner size="32px" class="q-mr-sm" />
            <div>กำลังโหลด...</div>
          </div>

          <div v-else-if="isImage" class="full-height">
            <q-img :src="inlineUrl()" contain style="height:100%;" />
          </div>

          <div v-else-if="isText" class="full-height">
            <q-scroll-area style="height:100%;">
              <pre class="q-pa-md" style="white-space:pre-wrap;">{{ preview.text || '(ไม่มีข้อมูล)' }}</pre>
            </q-scroll-area>
          </div>

          <div v-else class="full-height">
            <iframe :src="inlineUrl()" style="width:100%; height:100%; border:0;"></iframe>
          </div>
        </q-card-section>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useQuasar } from 'quasar'

const $q = useQuasar()
const props = defineProps<{ row: { step: string; request_no: string; file?: string } }>()
const emit  = defineEmits<(e: 'update-row', row: any) => void>()

/* ---------- URL ---------- */
const qInline = () =>
  `/api/uploads/get-latest?request_no=${encodeURIComponent(props.row.request_no)}&step=${encodeURIComponent(props.row.step)}&disposition=inline`
const qDownload = () =>
  `/api/uploads/get-latest?request_no=${encodeURIComponent(props.row.request_no)}&step=${encodeURIComponent(props.row.step)}&disposition=attachment`

const inlineUrl   = () => qInline()
const downloadUrl = () => qDownload()

/* ---------- state preview ---------- */
type PreviewState = { open: boolean; name: string; mime: string; text: string }
const preview = ref<PreviewState>({ open: false, name: 'file', mime: '', text: '' })
const loading = ref(false)
let currentAbort: AbortController | null = null

const isImage = computed(() => /^image\//.test(preview.value.mime))
const isText  = computed(() => (preview.value.mime || '').startsWith('text/'))

/* ---------- upload ---------- */
const uploadFactory = async () => ({
  url: '/api/uploads/upload',
  method: 'POST',
  formFields: [
    { name: 'step', value: props.row.step },
    { name: 'request_no', value: props.row.request_no }
  ]
})

const handleUpload = (info: any, row: any) => {
  try {
    const res = JSON.parse(info.xhr.responseText)
    if (res?.success === false) throw new Error(res?.user_message || res?.error || 'upload failed')
    const id = res?.file?.id || res?.id
    if (!id) {
      $q.notify({ type: 'negative', message: 'ไม่พบ id ของไฟล์ใน response' })
      throw new Error('ไม่พบ id ของไฟล์ใน response')
    }
    ;(row as any).file = id
    emit('update-row', row)     // parent จะเซ็ต status=done ให้
    openPreview()
  } catch (e) {
    console.error('Error parsing upload response:', e)
  }
}

/* ---------- preview ---------- */
async function openPreview() {
  if (currentAbort) currentAbort.abort()
  currentAbort = new AbortController()

  preview.value.open = true
  preview.value.name = 'file'
  preview.value.mime = ''
  preview.value.text = ''
  loading.value = true

  try {
    const rHead = await fetch(inlineUrl(), { method: 'HEAD', redirect: 'follow', cache: 'no-store', signal: currentAbort.signal })
    if (!rHead.ok) {
      loading.value = false
      preview.value.mime = 'text/plain'
      preview.value.text = rHead.status === 404 ? 'ไม่พบไฟล์ล่าสุดของขั้นตอนนี้' : `โหลดไฟล์ไม่สำเร็จ (HTTP ${rHead.status})`
      return
    }
    const ct = rHead.headers.get('Content-Type') || ''
    preview.value.mime = ct

    if (ct.startsWith('text/')) {
      const r = await fetch(inlineUrl(), { method: 'GET', redirect: 'follow', cache: 'no-store', signal: currentAbort.signal })
      preview.value.text = r.ok ? await r.text() : `โหลดไฟล์ไม่สำเร็จ (HTTP ${r.status})`
    }
  } catch (err: any) {
    if (err?.name !== 'AbortError') {
      preview.value.mime = 'text/plain'
      preview.value.text = 'โหลดไฟล์ไม่สำเร็จ'
    }
  } finally {
    loading.value = false
  }
}

function closePreview() {
  if (currentAbort) currentAbort.abort()
  preview.value.open = false
}

/* ---------- delete ---------- */
const deleting = ref(false)

function confirmDelete() {
  $q.dialog({
    title: 'ยืนยันการลบไฟล์',
    message: 'ต้องการลบไฟล์นี้และย้อนสถานะขั้นตอนเป็นรอดำเนินการ (pending) ใช่ไหม?',
    cancel: true,
    persistent: true
  }).onOk(() => doDelete())
}

async function doDelete() {
  if (!props.row.file) return
  deleting.value = true
  try {
    const r = await fetch(`/api/uploads/${encodeURIComponent(props.row.file)}`, { method: 'DELETE' })
    const data = await r.json().catch(() => ({}))
    if (!r.ok || data?.success === false) {
      throw new Error(data?.user_message || data?.error || `HTTP ${r.status}`)
    }
    // แจ้ง parent ให้เคลียร์ไฟล์ และเปลี่ยนสถานะเป็น pending
    emit('update-row', { ...props.row, file: null })
    $q.notify({ type: 'positive', message: 'ลบไฟล์เรียบร้อย' })
    closePreview()
  } catch (e: any) {
    console.error(e)
    $q.notify({ type: 'negative', message: e?.message || 'ลบไฟล์ไม่สำเร็จ' })
  } finally {
    deleting.value = false
  }
}

/* ---------- upload fail ---------- */
function onUploadFailed(info: any) {
  try {
    const txt = info?.xhr?.responseText || ''
    const data = txt ? JSON.parse(txt) : null
    const msg = data?.user_message || data?.error || `อัปโหลดไม่สำเร็จ (HTTP ${info?.xhr?.status || '-'})`
    $q.notify({ type: 'negative', message: msg })
    console.error('Upload failed:', data || txt)
  } catch {
    $q.notify({ type: 'negative', message: 'อัปโหลดไม่สำเร็จ' })
  }
}
</script>
