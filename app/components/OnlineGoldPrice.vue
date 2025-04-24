<script lang="ts" setup>
// 定义响应式数据
const goldLow = ref(0)
const goldHigh = ref(0)
const goldPrice = ref(0)
const { data, error, execute } = await useFetch('/api/gold', { immediate: false })

// 获取数据的函数
async function fetchGoldData() {
  if (error.value) {
    console.error('API Error:', error.value)
  }
  else {
    execute()
    const newData = data.value?.data?.SH?.[0]
    if (newData) {
      goldLow.value = newData?.Low || 0
      goldHigh.value = newData?.High || 0
      goldPrice.value = newData?.SP || 0
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
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><circle cx="12" cy="2" r="0" fill="currentColor"><animate attributeName="r" begin="0" calcMode="spline" dur="1s" keySplines="0.2 0.2 0.4 0.8;0.2 0.2 0.4 0.8;0.2 0.2 0.4 0.8" repeatCount="indefinite" values="0;2;0;0" /></circle><circle cx="12" cy="2" r="0" fill="#333333" transform="rotate(45 12 12)"><animate attributeName="r" begin="0.125s" calcMode="spline" dur="1s" keySplines="0.2 0.2 0.4 0.8;0.2 0.2 0.4 0.8;0.2 0.2 0.4 0.8" repeatCount="indefinite" values="0;2;0;0" /></circle><circle cx="12" cy="2" r="0" fill="#333333" transform="rotate(90 12 12)"><animate attributeName="r" begin="0.25s" calcMode="spline" dur="1s" keySplines="0.2 0.2 0.4 0.8;0.2 0.2 0.4 0.8;0.2 0.2 0.4 0.8" repeatCount="indefinite" values="0;2;0;0" /></circle><circle cx="12" cy="2" r="0" fill="#333333" transform="rotate(135 12 12)"><animate attributeName="r" begin="0.375s" calcMode="spline" dur="1s" keySplines="0.2 0.2 0.4 0.8;0.2 0.2 0.4 0.8;0.2 0.2 0.4 0.8" repeatCount="indefinite" values="0;2;0;0" /></circle><circle cx="12" cy="2" r="0" fill="#333333" transform="rotate(180 12 12)"><animate attributeName="r" begin="0.5s" calcMode="spline" dur="1s" keySplines="0.2 0.2 0.4 0.8;0.2 0.2 0.4 0.8;0.2 0.2 0.4 0.8" repeatCount="indefinite" values="0;2;0;0" /></circle><circle cx="12" cy="2" r="0" fill="#333333" transform="rotate(225 12 12)"><animate attributeName="r" begin="0.625s" calcMode="spline" dur="1s" keySplines="0.2 0.2 0.4 0.8;0.2 0.2 0.4 0.8;0.2 0.2 0.4 0.8" repeatCount="indefinite" values="0;2;0;0" /></circle><circle cx="12" cy="2" r="0" fill="#333333" transform="rotate(270 12 12)"><animate attributeName="r" begin="0.75s" calcMode="spline" dur="1s" keySplines="0.2 0.2 0.4 0.8;0.2 0.2 0.4 0.8;0.2 0.2 0.4 0.8" repeatCount="indefinite" values="0;2;0;0" /></circle><circle cx="12" cy="2" r="0" fill="#333333" transform="rotate(315 12 12)"><animate attributeName="r" begin="0.875s" calcMode="spline" dur="1s" keySplines="0.2 0.2 0.4 0.8;0.2 0.2 0.4 0.8;0.2 0.2 0.4 0.8" repeatCount="indefinite" values="0;2;0;0" /></circle></svg>
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
