<template>
    <div>
        <q-table
      flat
      bordered
      title="การขออนุมัติจำหน่ายทรัพย์สิน"
      :rows="rows"
      :columns="columns"
      :visible-columns="visibleColumns"
      row-key="name"
      :filter="filter"
      @row-click="(evt,row,index)=>rowclickHandler(row)"
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
        <q-td :props="bodyProps"> <q-chip :color="bodyProps.value.color" style="font-weight: bold;">{{bodyProps.value.text}}</q-chip></q-td>
      </template>
    </q-table>
    </div>
</template>

<script setup lang="ts">
import type { QTableColumn } from 'quasar';

interface Props {
  rows: any[];
}
const props = withDefaults(defineProps<Props>(), {
    rows: () => []
});

const router = useRouter();

const filter = ref("");

const visibleColumns = ref([
  "status",
  "order",
  "document_no",
  "document_date",
  "document_tag",
  "date_count_approved",
  "amount_sell",
  "comment"
])

const columns = ref<QTableColumn[]>([
  {
    name: "status",
    required: true,
    label: "สถานะ",
    align: "center",
    field: (row) => row.status,
    sortable: true,
    style: "width: 10%;",
    format: (val) => {
      let color;
      let text;

      switch (val) {
        case "done":
          color = "green-3"; 
          text = "ตัดจำหน่วยแล้ว";
          break;
        case "pending":
          color = "orange-3";
          text = "ระหว่างดำเนินการ";
          break;
          case "pending_approve":
          color = "gray-3";
          text = "รออนุมัติจำหน่าย";
          break;
        // case "rejected":
        //   color = "red-3";
        //   text = "ปฏิเสธ";
        //   break;
        default:
          color = "orange-3";
          text = "ระหว่างดำเนินการ";
      }

      return {text,color} as any;
    },
  },
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
    name: "request_no",
    label: "เลขที่คำร้องขอ",
    field: "request_no",
    align: "left",
    sortable: true,
  },
    {
    name: "document_date",
    label: "ลงวันที่",
    field: "document_date",
    align: "left",
    sortable: true,
  },
  {
    name: "document_no",
    label: "หนังสือเลขที่",
    field: "document_no",
    align: "left",
    sortable: true,
  },
  {
    name: "document_tag",
    label: "Tag",
    field: (row) => row.request_no,
    align: "left",
    sortable: true,
  },
  {
    name: "date_count_approved",
    label: "จำนวนวันนับจากวันที่อนุมัติจำหน่าย (วัน)",
    field: "date_count_approved",
    align: "left",
    sortable: true,
  },
  // {
  //   name: "date_count_pending_approve",
  //   label: "ระยะเวลาดำเนินการ (ตั้งแต่เริ่มเปิด job) (วัน)",
  //   field: "date_count_pending_approve",
  //   align: "left",
  //   sortable: true,
  // },
  {
    name: "amount_sell",
    label: "จำนวนเงินที่ขายได้",
    field: "amount_sell",
    align: "left",
    sortable: true,
  }, {
    name: "comment",
    label: "หมายเหตุเพิ่มเติม",
    field: "comment",
    align: "left",
    sortable: true,
  }
]);
function rowclickHandler(row:any) {
  router.push({ name: "approve-detail-id", params: { id: row.request_no} });
}
</script>

<style scoped>

</style>