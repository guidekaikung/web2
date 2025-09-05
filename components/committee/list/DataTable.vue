<template>
  <div>
    <q-table
      flat
      bordered
      :title="tableTitle"
      :rows="editableRows"
      :columns="columns"
      row-key="name"
      :filter="filter"
      @row-click="(evt, row, index) => rowclickHandler(evt, row, index)"
    >
      <template v-slot:top-right>
        <q-input
          borderless
          dense
          debounce="300"
          v-model="filter"
          placeholder="Search"
        >
          <template v-slot:append>
            <q-icon name="search" />
          </template>
        </q-input>
      </template>
      <template v-slot:body-cell-status="bodyProps">
        <q-td :props="bodyProps">
          <q-chip :color="bodyProps.value.color">{{ bodyProps.value.text }}</q-chip>
        </q-td>
      </template>
    </q-table>

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
          <q-btn flat label="บันทึก" @click="onClickSaveCommittee" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup lang="ts">
import type { QTableColumn } from 'quasar';
import { useRoute } from 'vue-router';
import { computed, ref, watch } from 'vue';

const emit = defineEmits(['dataUpdated']);

interface Props {
  rows: any[];
}
interface Dialog {
  committee_name: string;
  committee_position: string;
  committee_order: string;
}
const props = withDefaults(defineProps<Props>(), {
  rows: () => [],
});

const editableRows = ref([...props.rows]);
watch(
  () => props.rows,
  (newValue) => {
    editableRows.value = [...newValue];
  }
);

const route = useRoute();

const tableTitle = computed(() => {
  const titles: Record<string, string> = {
    '/committee': 'รายชื่อคณะกรรมการสอบหาข้อเท็จจริง',
    '/committee/price': 'รายชื่อคณะกรรมการประเมินราคา',
    '/committee/sale': 'รายชื่อคณะกรรมการดำเนินการขาย',
    '/committee/transfer': 'รายชื่อคณะกรรมการส่งมอบพัสดุ',
  };
  return titles[route.path] || 'รายชื่อคณะกรรมการกำหนดราคา';
});

const filter = ref('');
const alert = ref(false);
const confirm = ref(false);
const prompt = ref(false);
const dialogCommittee = ref<Dialog>({
  committee_name: '',
  committee_position: '',
  committee_order: '',
});

const columns = ref<QTableColumn[]>([
  {
    name: 'order',
    required: true,
    label: 'ลำดับ',
    align: 'left',
    field: (row) => row.order,
    format: (val) => `${val}`,
    sortable: true,
    style: 'width: 10%;',
  },
  {
    name: 'ชื่อกรรมการ',
    label: 'ชื่อกรรมการ',
    field: 'committee_name',
    align: 'left',
    sortable: true,
  },
  {
    name: 'ตำแหน่ง',
    label: 'ตำแหน่ง',
    field: 'committee_position',
    align: 'left',
  },
]);

function rowclickHandler(evt: any, row: any, index: any) {
  dialogCommittee.value.committee_order = row.order;
  dialogCommittee.value.committee_name = row.committee_name;
  dialogCommittee.value.committee_position = row.committee_position;
  prompt.value = true;
}

function onClickSaveCommittee() {
  editableRows.value.forEach((element, index) => {
    if (element.order == dialogCommittee.value.committee_order) {
      editableRows.value[index].committee_name = dialogCommittee.value.committee_name;
      editableRows.value[index].committee_position = dialogCommittee.value.committee_position;
    }
  });

  // save to db (ถ้ามี)

  emit('dataUpdated');
}
</script>

<style scoped></style>

<!-- อันเก่า
<template>
  <div>

    <q-table
      flat
      bordered
      :title="tableTitle"
      :rows="editableRows"
      :columns="columns"
      row-key="name"
      :filter="filter"
      @row-click="(evt,row,index)=>rowclickHandler(evt,row,index)"
    >
      <template v-slot:top-right>
        <q-input
          borderless
          dense
          debounce="300"
          v-model="filter"
          placeholder="Search"
        >
          <template v-slot:append>
            <q-icon name="search" />
          </template>
        </q-input>
      </template>
      <template v-slot:body-cell-status="bodyProps">
        <q-td :props="bodyProps">
          <q-chip :color="bodyProps.value.color">{{bodyProps.value.text}}</q-chip>
        </q-td>
      </template>
    </q-table>

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
          <q-btn flat label="บันทึก" @click="onClickSaveCommittee" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>

  </div>
</template>

<script setup lang="ts">
import type { QTableColumn } from 'quasar';
import { useRoute } from 'vue-router';
import { computed, ref, watch } from 'vue';

const emit = defineEmits(['dataUpdated']);

interface Props {
  rows: any[];
}
interface Dialog {
  committee_name: string;
  committee_position: string;
  committee_order: string;
}

const props = withDefaults(defineProps<Props>(), {
  rows: () => [],
});

const editableRows = ref([...props.rows]);
watch(() => props.rows, (newValue) => {
  editableRows.value = [...newValue];
});

const route = useRoute();

const tableTitle = computed(() => {
  const titles: Record<string, string> = {
    '/committee': 'รายชื่อคณะกรรมการสอบหาข้อเท็จจริง',
    '/committee/price': 'รายชื่อคณะกรรมการประเมินราคา',
    '/committee/sale': 'รายชื่อคณะกรรมการดำเนินการขาย',
    '/committee/transfer': 'รายชื่อคณะกรรมการส่งมอบพัสดุ',
  };
  return titles[route.path] || 'รายชื่อคณะกรรมการกำหนดราคา';
});

const filter = ref("");
const prompt = ref(false);
const dialogCommittee = ref<Dialog>({
  committee_name: '',
  committee_position: '',
  committee_order: '',
});

const columns = ref<QTableColumn[]>([
  {
    name: "order",
    required: true,
    label: "ลำดับ",
    align: "left",
    field: (row) => row.order,
    format: (val) => `${val}`,
    sortable: true,
    style: "width: 10%;",
  },
  {
    name: "ชื่อกรรมการ",
    label: "ชื่อกรรมการ",
    field: "committee_name",
    align: "left",
    sortable: true,
  },
  {
    name: "ตำแหน่ง",
    label: "ตำแหน่ง",
    field: "committee_position",
    align: "left",
  },
]);

function rowclickHandler(evt: any, row: any, index: any) {
  dialogCommittee.value.committee_order = row.order;
  dialogCommittee.value.committee_name = row.committee_name;
  dialogCommittee.value.committee_position = row.committee_position;
  prompt.value = true;
}

function onClickSaveCommittee() {
  editableRows.value.forEach((element, index) => {
    if (element.order == dialogCommittee.value.committee_order) {
      editableRows.value[index].committee_name = dialogCommittee.value.committee_name;
      editableRows.value[index].committee_position = dialogCommittee.value.committee_position;
    }
  });

  // save to db if needed

  emit('dataUpdated');
}
</script>

<style scoped>
</style>
-->
