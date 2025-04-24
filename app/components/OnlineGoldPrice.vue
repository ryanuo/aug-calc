<script lang="ts" setup>
const goldInfo = reactive({
  goldPrice: 0,
  goldLow: 0,
  goldHigh: 0,
  goldLDPrice: {
    Low: 0,
    SP: 0,
  },
  goldRate: 0,
  goldUDI: 0,
})

const symbolSign = computed(() => {
  if (goldInfo.goldLDPrice.SP > goldInfo.goldLDPrice.Low)
    return '↑'

  return '↓'
})

const { data, error, execute } = await useFetch<{
  data: {
    SH: {
      Low: number
      High: number
      SP: number
    }[]
    GJ: {
      SP: number
      Low: number
      Symbol: string
    }[]
  }
}>('https://free.xwteam.cn/api/gold/trade', { immediate: false })

// 获取数据的函数
async function fetchGoldData() {
  if (error.value) {
    console.error('API Error:', error.value)
  }
  else {
    await execute()
    const newData = data.value?.data?.SH?.[0]
    const newData2 = data.value?.data?.GJ
    if (newData) {
      goldInfo.goldLow = newData.Low || 0
      goldInfo.goldHigh = newData.High || 0
      goldInfo.goldPrice = newData.SP || 0
      goldInfo.goldLDPrice = newData2?.find(item => item.Symbol === 'GJ_Au') || {
        Low: 0,
        SP: 0,
      }
      goldInfo.goldRate = newData2?.find(item => item.Symbol === 'GJ_USD')?.SP || 0
      goldInfo.goldUDI = newData2?.find(item => item.Symbol === 'GJ_UDI')?.SP || 0
    }
  }
}

useIntervalFn(fetchGoldData, 3000, { immediate: true })
</script>

<template>
  <div class="stat-card relative">
    <div class="stat-label">
      实时金价
    </div>
    <div class="stat-value">
      <div>
        <div v-if="goldInfo.goldPrice">
          <div
            class="text-xs font-normal text-right op-50 right-1 top-1 absolute"
          >
            <div
              :class="{
                profit: goldInfo.goldLDPrice.SP > goldInfo.goldLDPrice.Low,
                loss: goldInfo.goldLDPrice.SP < goldInfo.goldLDPrice.Low,
              }"
            >
              {{ `${symbolSign} ${goldInfo.goldLDPrice.SP}` }}
            </div>
            <!-- <div>{{ goldInfo.goldRate }}</div>
            <div>{{ goldInfo.goldUDI }}</div> -->
          </div>
          <div
            class="text-xl font-bold"
            :class="{
              profit: goldInfo.goldPrice > goldInfo.goldLow,
              loss: goldInfo.goldPrice < goldInfo.goldLow,
            }"
          >
            {{ goldInfo.goldPrice ? `${goldInfo.goldPrice || 0} 元` : '-' }}
          </div>
          <div class="text-xs font-bold op-30">
            <span class="text-green-500 mr-2">↑ {{ goldInfo.goldHigh }}</span>
            <span class="text-red-500">↓ {{ goldInfo.goldLow }}</span>
          </div>
        </div>
        <div v-else class="text-xl font-bold flex items-center justify-center">
          <span class="i-codex-loader" />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.profit {
  color: var(--success-color);
}

.loss {
  color: var(--danger-color);
}
</style>
