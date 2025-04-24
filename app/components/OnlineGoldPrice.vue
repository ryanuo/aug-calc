<script lang="ts" setup>
const goldLow = ref(0)
const goldHigh = ref(0)
const goldPrice = ref(0)

const { data, error, execute } = await useFetch<{
  data: {
    SH: {
      Low: number
      High: number
      SP: number
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
    if (newData) {
      goldLow.value = newData.Low || 0
      goldHigh.value = newData.High || 0
      goldPrice.value = newData.SP || 0
    }
  }
}

useIntervalFn(fetchGoldData, 3000, { immediate: true })
</script>

<template>
  <div>
    <div v-if="goldPrice">
      <div class="text-xl font-bold">
        {{ goldPrice ? `${goldPrice || 0} 元` : '-' }}
      </div>
      <div class="text-xs font-bold">
        <span class="profit text-green-500 mr-2">↑ {{ goldHigh }}</span>
        <span class="loss text-red-500">↓ {{ goldLow }}</span>
      </div>
    </div>
    <div v-else class="text-xl font-bold flex items-center justify-center">
      <span class="i-codex-loader" />
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
