<template>
  <div>
    <div v-if="!row.file">
      <q-uploader
        :factory="uploadFactory"
        @uploaded="(info) => handleUpload(info, row)"
        label="อัปโหลด"
        auto-upload
        hide-upload-btn
        style="max-width: 150px;"
      />
    </div>
    <div v-else>
      <q-btn
  color="primary"
  label="ดาวน์โหลด"
  :href="`/api/uploads/get-download?id=${row.file}`"
  target="_blank"
  icon="cloud_download"
/>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{ row: { step: string; file?: string } }>()
const emit = defineEmits<(e: 'update-row', row: any) => void>()

const uploadFactory = async (files: readonly File[]) => {
  const file = files[0]
  if (!file) throw new Error('ไม่พบไฟล์ที่เลือก')

  const formData = new FormData()
  formData.append('file', file)
  formData.append('step', props.row.step)

  return {
    url: '/api/uploads/upload',
    method: 'POST',
    body: formData
  }
}

const handleUpload = (info: any, row: any) => {
  try {
    const response = JSON.parse(info.xhr.responseText)
    emit('update-row', { ...row, file: response.id })
  } catch (e) {
    console.error('Error parsing upload response:', e)
  }
}
</script>
