<template>
  <div class="q-pa-lg">
    <div class="text-h5 q-mb-md">สรุปสถานะเอกสาร</div>

    <div class="row q-col-gutter-md">
      <div class="col-12 col-md-4" v-for="(chartData, index) in charts" :key="index">
        <q-card class="q-pa-md">
          <div class="text-subtitle2 q-mb-sm">
            {{ chartTitles[index] }}
            </div>
          <Pie :data="chartData" :options="chartOptions" />
        </q-card>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Chart as ChartJS, Title, Tooltip, Legend, ArcElement } from 'chart.js'
import { Pie } from 'vue-chartjs'
import ChartDataLabels from 'chartjs-plugin-datalabels'
import type { ChartOptions } from 'chart.js'

ChartJS.register(ChartDataLabels)
ChartJS.register(Title, Tooltip, Legend, ArcElement)

const chartOptions: ChartOptions<'pie'> = {
  responsive: true,
  plugins: {
    legend: {
      position: 'bottom'
    },
    datalabels: {
      color: '#fff',
      font: { weight: 'bold' },
      formatter: (value: number, context: any) => {
        const dataset = context.chart.data.datasets[0].data
        const total = dataset.reduce((a: number, b: number) => a + b, 0)
        const percent = ((value / total) * 100).toFixed(0)
        return `${percent}%`
      }
    }
  }
}

const chartTitles = [
  'กฟจ.นครสวรรค์ (CEO)',
  'กฟจ.ชัยนาท (CEO)',
  'กฟจ.สิงห์บุรี (CEO)',
  'กฟจ.ลพบุรี (CEO)',
  'กฟจ.อุทัยธานี CEO',
  'กฟจ.เพชรบูรณ์ CEO'
]

const charts = ref<any[]>([])

onMounted(async () => {
  const res = await fetch('/data/INSx RPA.json')
  const jsonData = await res.json()
  const raw = jsonData['ชีต3']

  // สร้าง chart สำหรับแต่ละ CEO
  charts.value = chartTitles.map((ceoTitle) => {
  let isInGroup = false
  let sumWaitingPercent = 0

  for (const row of raw) {
    const name = row.Column4

    if (name?.includes('CEO')) {
      isInGroup = name === ceoTitle
      continue
    }

    if (isInGroup) {
      sumWaitingPercent += Number(row.Column9 || 0)  // ✅ รวม % โดยตรง
    }
  }

  //ข้อมูลเป็น % 
  const waitingPercent = sumWaitingPercent
  const approvedPercent = 100 - waitingPercent

  return {
    labels: ['ตัดจำหน่ายแล้ว', 'รออนุมัติจำหน่าย'],
    datasets: [
      {
        data: [approvedPercent, waitingPercent],
        backgroundColor: ['#16A34A', '#6B7280']
        }
      ]
    }
  })
})
</script>



 