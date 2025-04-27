<script setup lang="ts">
import type { EChartsOption } from 'echarts/types/dist/shared'
import type { Transaction } from './type'

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
    legend: [
      {
        data: ['买入', '卖出'],
        right: '5%',
      },
    ],
    xAxis: {
      type: 'category',
      data: props.transactions.map((_, index) => `${index + 1}`),
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross',
        label: {
          backgroundColor: '#283b56',
        },
      },
      formatter: (params: any) => {
        if (params.length === 0) {
          return ''
        }

        const id = params[0]!.axisValue - 1
        const weight = props.transactions![id]!.buy.weight
        const title = `<div style="text-align: left; font-weight: 600;">${weight} 克</div>`
        const details = params
          .map((item: any) => {
            return `<div style="text-align: left;">${item.marker} ${item.seriesName}: ${item.value.toFixed(4)} 元</div>`
          })
          .join('')
        return `${title}${details}`
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
  height: 300px;
}
</style>
