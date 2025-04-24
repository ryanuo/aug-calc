<script setup lang="ts">
import type { EChartsOption } from 'echarts/types/dist/shared'

interface ItemTransaction {
  weight: number
  price: number
  totalPrice: number
  time: string
  profit?: number
  fee?: number
}

interface Transaction {
  buy: ItemTransaction
  sell?: ItemTransaction
}

const props = defineProps<{
  transactions: Transaction[]
}>()

const chartOptions = computed((): EChartsOption => {
  const buyData = props.transactions?.map(transaction => transaction.buy.totalPrice)
  const sellData = props.transactions?.map(transaction => transaction?.sell?.totalPrice || 0)

  return {
    color: ['green', 'red'],
    grid: { // 让图表占满容器
      top: '2%',
      left: '0px',
      right: '0px',
      bottom: '0px',
      containLabel: true,
    },

    legend: {
      data: [
        {
          name: '买入',
          icon: 'circle',
        },
        {
          name: '卖出',
          icon: 'circle',
        },
      ],
    },
    xAxis: {
      type: 'category',
      data: props.transactions.map((_, index) => `${index + 1}`),
    },
    tooltip: {
      trigger: 'axis',
      // formatter: (params) => {
      //   console.log( params)
      //   return ''
      // },
      axisPointer: {
        type: 'cross',
        label: {
          backgroundColor: '#283b56',
        },
      },
    },
    yAxis: {
      type: 'value',
      min: 0, // 设置最小值
      axisLabel: {
        formatter: (value: number) => {
          return `${value.toFixed(2)} 元`
        },
      },
    },
    series: [
      {
        name: '买入',
        type: 'line',
        data: buyData,
        smooth: true,
        lineStyle: {
          color: 'green',
        },
      },
      {
        name: '卖出',
        type: 'line',
        data: sellData,
        smooth: true,
        lineStyle: {
          color: 'red',
        },
      },
    ],
  }
})
</script>

<template>
  <div class="chart-container">
    <ClientOnly fallback-tag="div" fallback="Loading comments...">
      <v-chart :option="chartOptions" />
    </ClientOnly>
  </div>
</template>

<style scoped>
.chart-container {
  margin-top: 20px;
  width: 100%;
  height: 400px;
}
</style>
