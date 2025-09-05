<template>
  <q-dialog v-model="prompt" persistent>
    <q-card style="min-width: 40%">
      <q-card-section>
        <div class="text-h6">ชื่อกรรมการ</div>
      </q-card-section>
      <q-card-section class="q-pt-none">
        <q-input dense v-model="dialogCommittee.committee_name" autofocus />
      </q-card-section>

      <q-card-section>
        <div class="text-h6">ตำแหน่ง</div>
      </q-card-section>
      <q-card-section class="q-pt-none">
        <q-input dense v-model="dialogCommittee.committee_position" />
      </q-card-section>

      <q-card-actions align="right" class="text-primary">
        <q-btn flat label="ยกเลิก" v-close-popup />
        <q-btn flat label="บันทึก" @click="onClickSaveCommittee" v-close-popup />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, defineExpose, defineEmits } from 'vue'

interface Dialog {
  committee_name: string;
  committee_position: string;
}

const emit = defineEmits(['save']); // emit ออกไปยังหน้าแม่

const dialogCommittee = ref<Dialog>({
  committee_name: '',
  committee_position: '',
});

const prompt = ref(false);

// function เปิด dialog
function open() {
  dialogCommittee.value = {
    committee_name: '',
    committee_position: ''
  };
  prompt.value = true;
}

// function กดบันทึก
function onClickSaveCommittee() {
  emit('save', { ...dialogCommittee.value });
  prompt.value = false;
}

// ✅ expose ให้หน้าแม่เรียกใช้ open()
defineExpose({ open });
</script>


<!-- <template>
    <div>
        <q-dialog v-model="prompt" persistent>
      <q-card style="min-width: 40%">

        <q-card-section>
          <div class="text-h6">ชื่อกรรมการ</div>
        </q-card-section>
        <q-card-section class="q-pt-none">
          <q-input dense v-model="dialogCommittee.committee_name" autofocus />
        </q-card-section>

        <q-card-section>
          <div class="text-h6">ตำแหน่ง</div>
        </q-card-section>
        <q-card-section class="q-pt-none">
          <q-input dense v-model="dialogCommittee.committee_position" autofocus />
        </q-card-section>

        <q-card-actions align="right" class="text-primary">
          <q-btn flat label="ยกเลิก" v-close-popup />
          <q-btn flat label="บันทึก" @click="onClickSaveCommittee"  v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>
    </div>
</template>

<script setup lang="ts">
const router = useRouter();
interface Dialog {
  committee_name: string;
  committee_position: string;
  committee_order: string;
}

const dialogCommittee = ref<Dialog>({
  committee_name: '',
  committee_position: '',
  committee_order: ''
});

const prompt= ref(false);

function onClickSaveCommittee(){
    prompt.value = false
}

</script>

<style scoped>

</style> -->