<script setup lang="ts">
import type { ECElementEvent, EChartsOption } from 'echarts/types/dist/shared'
import type { Transaction } from './type'

const props = defineProps<{
  transactions: Transaction[]
  // 跳转到指定的表格行
  goToRow: (index: number) => void
}>()

const chartOptions = computed((): EChartsOption => {
  const buyData = props.transactions?.map(transaction => transaction.buy.price)
  const sellData = props.transactions?.map(transaction => transaction?.sell?.price || 0)

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

        let details = params?.filter((i: any) => i?.value)
          .map((item: any) => {
            return `<div style="text-align: left;">${item.marker} ${item.seriesName}: ${item.value.toFixed(4)} 元</div>`
          })
          .join('')
        // 计算盈亏
        const profit = props.transactions![id]!.sell?.profit
        if (Math.abs(profit as number)) {
          details += `<div style="text-align: left; color: ${profit! > 0 ? 'red' : 'green'}; font-weight:600; font-size:12px;">盈亏: ${profit!.toFixed(4)} 元</div>`
        }
        return `${title}${details}`
      },
    },
    yAxis: {
      type: 'value',
      min: 'dataMin',
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
        data: sellData?.map((item) => {
          if (item === 0) {
            return null
          }
          return item
        }),
        smooth: true,
        lineStyle: {
          color: 'red',
        },
      },
    ],
  }
})

function handleViewClick(params: ECElementEvent) {
  if (params.componentType === 'series') {
    const index = params.dataIndex
    props.goToRow(index)
  }
}
</script>

<template>
  <div class="chart-container">
    <ClientOnly fallback-tag="div" fallback="Loading comments...">
      <v-chart :option="chartOptions" @click="handleViewClick" />
    </ClientOnly>
  </div>
</template>

<style scoped>
.chart-container {
  margin-top: 20px;
  height: 300px;
}
</style>
