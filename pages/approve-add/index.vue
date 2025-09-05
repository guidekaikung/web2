<template>
    <div class="q-pa-md column items-start q-gutter-y-md">
      <q-file
        :model-value="files"
        @update:model-value="updateFiles"
        label="Pick files"
        outlined
        multiple
        :clearable="!isUploading"
        style="max-width: 400px"
      >
        <template v-slot:file="{ index, file }">
          <q-chip
            class="full-width q-my-xs"
            :removable="isUploading && uploadProgress[index].percent < 1"
            square
            @remove="cancelFile(index)"
          >
            <q-linear-progress
              class="absolute-full full-height"
              :value="uploadProgress[index].percent"
              :color="uploadProgress[index].color"
              track-color="grey-2"
            />
  
            <q-avatar>
              <q-icon :name="uploadProgress[index].icon" />
            </q-avatar>
  
            <div class="ellipsis relative-position">
              {{ file.name }}
            </div>
  
            <q-tooltip>
              {{ file.name }}
            </q-tooltip>
          </q-chip>
        </template>
  
        <template v-slot:after v-if="canUpload">
          <q-btn
            color="primary"
            dense
            icon="cloud_upload"
            round
            @click="upload"
            :disable="!canUpload"
            :loading="isUploading"
          />
        </template>
      </q-file>
    </div>
  </template>
  
  <script>
  import { ref, computed, onBeforeUnmount } from 'vue'
  
  export default {
    setup () {
      const files = ref(null)
const uploadProgress = ref([])
const uploading = ref(false)

function cleanUp () {
  clearTimeout(uploading.value)
}

function handleProgress(e, index) {
  if (e.lengthComputable) {
    const percent = e.loaded / e.total
    uploadProgress.value[index].percent = percent
  }
}

return {
  files,
  uploadProgress,
  uploading,

  isUploading: computed(() => uploading.value),
  canUpload: computed(() => files.value !== null),

  cancelFile(index) {
    uploadProgress.value[index].error = true
    uploadProgress.value[index].color = 'orange-2'
  },

  updateFiles(newFiles) {
    files.value = newFiles
    uploadProgress.value = (newFiles || []).map(file => ({
      error: false,
      color: 'green-2',
      percent: 0,
      icon: file.type.includes('video/')
        ? 'movie'
        : (file.type.includes('image/')
            ? 'photo'
            : (file.type.includes('audio/')
                ? 'audiotrack'
                : 'insert_drive_file'
              )
          )
    }))
  },

  async upload() {
    if (!files.value) return
    
    uploadProgress.value = uploadProgress.value.map(progress => ({
      ...progress,
      percent: 0,
      error: false,
      color: 'green-2'
    }))
    
    uploading.value = true

    Array.from(files.value).forEach((file, index) => {
      const formData = new FormData()
      formData.append('files', file)

      const xhr = new XMLHttpRequest()

      // Update to point to your backend on localhost:8080
      xhr.open('POST', 'http://localhost:8080/upload')

      // Track progress
      xhr.upload.addEventListener('progress', (e) => handleProgress(e, index))

      xhr.onload = () => {
        if (xhr.status === 200) {
          uploadProgress.value[index].percent = 1
          uploadProgress.value[index].color = 'green-2'
        } else {
          uploadProgress.value[index].error = true
          uploadProgress.value[index].color = 'red-2'
        }

        // Check if all files are done
        if (uploadProgress.value.every(p => p.percent === 1 || p.error === true)) {
          uploading.value = false
        }
      }

      xhr.onerror = () => {
        uploadProgress.value[index].error = true
        uploadProgress.value[index].color = 'red-2'
      }

      xhr.send(formData)
    })
  }
}


    }
  }
  </script>
  