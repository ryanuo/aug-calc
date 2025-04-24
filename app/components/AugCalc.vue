<script setup lang="ts">
import { useStorage } from '@vueuse/core'
import Decimal from 'decimal.js'
import { computed, reactive } from 'vue'
import { FEEPROCENTAGE } from '~/constants'

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
const transactions = useStorage<Transaction[]>('transactions', [])

const newTransaction = reactive({
  weight: 0,
  price: 0,
})

const sortByTime = reactive({
  ascending: true,
})

const staticData = reactive({
  totalWeight: 0,
  totalProfit: 0,
  waitSellAvaPrice: 0,
})

const isShowTimeRow = ref(false)
const { showMessage } = useMessageStore()

const sortedTransactions = computed(() => {
  return [...transactions.value].sort((a, b) => {
    const aTime = new Date(a.buy?.time || a.sell?.time || 0).getTime()
    const bTime = new Date(b.buy?.time || b.sell?.time || 0).getTime()
    return sortByTime.ascending ? aTime - bTime : bTime - aTime
  })
})

watch(() => transactions.value, (newVal) => {
  staticData.totalWeight = newVal.reduce((sum, transaction) => {
    if (!transaction.sell?.weight) {
      sum = new Decimal(sum).plus(transaction.buy.weight).toNumber()
    }
    return sum
  }, 0)

  staticData.totalProfit = newVal.reduce((sum, transaction) => {
    if (transaction.sell?.profit) {
      sum = new Decimal(sum).plus(transaction.sell.profit).toNumber()
    }
    return sum
  }, 0)

  const totalWaitSellAvaPrice = newVal.reduce((sum, transaction) => {
    if (!transaction.sell?.price) {
      sum = new Decimal(sum).plus(transaction.buy.totalPrice).toNumber()
    }
    return sum
  }, 0)
  staticData.waitSellAvaPrice = new Decimal(totalWaitSellAvaPrice).dividedBy(staticData.totalWeight).toNumber()
}, { immediate: true, deep: true })

function addTransaction() {
  if (newTransaction.weight > 0 && newTransaction.price > 0) {
    transactions.value.push({
      buy: {
        weight: newTransaction.weight,
        price: newTransaction.price,
        time: new Date().toISOString(),
        totalPrice: new Decimal(newTransaction.price).times(newTransaction.weight).toNumber(),
      },
    })
    newTransaction.weight = 0
    newTransaction.price = 0
  }
}

interface ShowSellModalType {
  visible: boolean
  index: number
  weight: number
  price: number
  feePercentage: number
}

const showSellModal = reactive<ShowSellModalType>({
  visible: false,
  index: -1,
  weight: 0,
  price: 0,
  feePercentage: FEEPROCENTAGE.DEFAULT,
})

function openSellModal(index: number) {
  const transaction = transactions.value[index]
  if (transaction!.buy) {
    showSellModal.visible = true
    showSellModal.index = index
    showSellModal.weight = transaction!.buy.weight
    showSellModal.price = 0
    showSellModal.feePercentage = FEEPROCENTAGE.DEFAULT
  }
}

function sellTransaction(e: ShowSellModalType) {
  const transaction = transactions.value[e.index]
  if (transaction && transaction.buy) {
    const fee = new Decimal(e.price).times(e.weight).times(e.feePercentage).dividedBy(100).toNumber()
    const profit = new Decimal(e.price).times(e.weight).minus(new Decimal(transaction.buy.price).times(e.weight)).minus(fee).toNumber()
    transaction.sell = {
      weight: e.weight,
      price: e.price,
      time: new Date().toISOString(),
      profit,
      fee,
      totalPrice: new Decimal(e.price).times(e.weight).toNumber(),
    }

    showSellModal.visible = false
    showSellModal.index = -1
    showSellModal.weight = 0
    showSellModal.price = 0
    showSellModal.feePercentage = FEEPROCENTAGE.DEFAULT
  }
}

function deleteTransaction(index: number) {
  transactions.value.splice(index, 1)
}

function importData(e: any) {
  if (e.target.files && e.target.files.length > 0) {
    const file = e.target.files[0]
    const reader = new FileReader()
    reader.onload = (event) => {
      const jsonData = JSON.parse(event.target!.result as string)
      transactions.value = jsonData
    }
    reader.readAsText(file)
  }
}

function exportData() {
  const data = JSON.stringify(transactions.value)
  const blob = new Blob([data], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'transactions.json'
  link.click()
  URL.revokeObjectURL(url)

  showMessage(
    {
      t: 'success',
      message: '导出成功',
    },
  )
}
</script>

<template>
  <div class="container">
    <header class="header">
      <h4 class="title text-black cursor-pointer" flex="~ gap-2 items-center">
        <img src="/favicon.svg">
        <div class="h-full translate-y-[3px]" flex="~ items-center">
          Gold Trades
        </div>
      </h4>
    </header>

    <main class="main-content">
      <section class="stats-section">
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-label">
              可卖克数
            </div>
            <div class="stat-value">
              {{ numberToFixed(staticData.totalWeight) }} 克
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-label">
              待卖均价
            </div>
            <div class="stat-value">
              {{ numberToFixed(staticData.waitSellAvaPrice) }} 元
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-label">
              总盈亏
            </div>
            <div class="stat-value" :class="{ profit: staticData.totalProfit > 0, loss: staticData.totalProfit < 0 }">
              {{ numberToFixed(staticData.totalProfit) }} 元
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-label">
              实时金价
            </div>
            <div class="stat-value">
              <OnlineGoldPrice />
            </div>
          </div>
        </div>
      </section>

      <section class="form-section">
        <h2 class="section-title">
          ➕ 添加买入记录
        </h2>
        <form class="transaction-form" @submit.prevent="addTransaction">
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">克数 (克)</label>
              <input v-model="newTransaction.weight" type="number" step="0.0001" min="0" class="form-input" required>
            </div>

            <div class="form-group">
              <label class="form-label">单价 (元/克)</label>
              <input v-model="newTransaction.price" type="number" step="0.0001" min="0" class="form-input" required>
            </div>

            <button type="submit" class="submit-btn">
              添加买入
            </button>
          </div>
        </form>
      </section>

      <section class="transactions-section">
        <div class="section-header">
          <h2 class="section-title">
            📋 交易记录 <span v-if="transactions.length" class="text-xs">共{{ transactions.length }}条</span>
          </h2>
          <div>
            <button class="import-btn">
              <input
                type="file" accept=".json"
                class="opacity-0 h-full w-full cursor-pointer absolute"
                @change="importData"
              >
              <div class="i-hugeicons-upload-02" /> 导入数据
            </button>
            <button class="export-btn" @click="exportData">
              <div class="i-jam-download" /> 导出数据
            </button>
            <button class="sort-btn" @click="sortByTime.ascending = !sortByTime.ascending">
              {{ sortByTime.ascending ? '↑ 时间升序' : '↓ 时间降序' }}
            </button>
            <button class="sort-btn ml-1" @click="isShowTimeRow = !isShowTimeRow">
              {{ isShowTimeRow ? '隐藏时间' : '显示时间' }}
            </button>
          </div>
        </div>

        <div class="table-container">
          <table class="transactions-table">
            <thead>
              <tr>
                <th :colspan="isShowTimeRow ? 4 : 3" class="buy-header">
                  买入
                </th>
                <th :colspan="isShowTimeRow ? 4 : 3" class="sell-header">
                  卖出
                </th>
                <th :colspan="2" class="profit-header">
                  收益
                </th>
                <th rowspan="2">
                  操作
                </th>
              </tr>
              <tr>
                <th class="buy-header">
                  克数
                </th>
                <th class="buy-header">
                  单价
                </th>
                <th class="buy-header">
                  Total
                </th>
                <th v-if="isShowTimeRow" class="buy-header">
                  时间
                </th>
                <th class="sell-header">
                  克数
                </th>
                <th class="sell-header">
                  单价
                </th>
                <th class="sell-header">
                  Total
                </th>
                <th v-if="isShowTimeRow" class="sell-header">
                  时间
                </th>
                <th class="profit-header">
                  手续费
                </th>
                <th class="profit-header">
                  盈利
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(transaction, index) in sortedTransactions" :key="index">
                <td>{{ numberToFixed(transaction.buy?.weight) }} 克</td>
                <td>{{ numberToFixed(transaction.buy?.price) }} 元</td>
                <td>{{ numberToFixed(transaction.buy?.totalPrice) }} 元</td>
                <td v-if="isShowTimeRow">
                  {{ new Date(transaction.buy!.time).toLocaleString() }}
                </td>
                <td>{{ transaction.sell?.weight ? `${numberToFixed(transaction.sell.weight)} 克` : '-' }}</td>
                <td>{{ transaction.sell?.price ? `${numberToFixed(transaction.sell.price)} 元` : '-' }}</td>
                <td>{{ transaction.sell?.totalPrice ? `${numberToFixed(transaction.sell.totalPrice)} 元` : '-' }}</td>
                <td v-if="isShowTimeRow">
                  {{ transaction.sell ? new Date(transaction.sell.time).toLocaleString() : '-' }}
                </td>
                <td>{{ transaction.sell?.fee ? `${numberToFixed(transaction.sell.fee)} 元` : '-' }}</td>
                <td
                  :class="{
                    profit: !!transaction?.sell?.profit,
                    loss: Number(transaction.sell?.profit) < 0,
                  }"
                >
                  {{ transaction.sell?.profit ? `${numberToFixed(transaction.sell.profit)} 元` : '-' }}
                </td>
                <td>
                  <button class="sell-btn" @click="openSellModal(index)">
                    卖出
                  </button>
                  <button class="delete-btn" @click="deleteTransaction(index)">
                    删除
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- Sell Modal -->
      <GoldSellModal v-model:visible="showSellModal.visible" :initial-data="showSellModal" @submit="sellTransaction" />
    </main>
  </div>
  <MessageDisplay />
</template>

<style>
/* 基础样式 */
:root {
  --primary-color: #4a6baf;
  --secondary-color: #6c757d;
  --success-color: #28a745;
  --danger-color: #dc3545;
  --warning-color: #ffc107;
  --info-color: #17a2b8;
  --light-color: #f8f9fa;
  --dark-color: #031528a0;
  --border-radius: 8px;
  --box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  --transition: all 0.3s ease;
  --light-on: white;
  --export-btn: rgba(8, 93, 83, 0.856);
  --export-hover-bth: rgb(8, 93, 83);
}

/* 暗黑模式 */
.dark:root {
  --primary-color: #5e72e4;
  /* 更明亮的主色 */
  --secondary-color: #adb5bd;
  /* 更柔和的次色 */
  --success-color: #2dce89;
  /* 更亮的绿色 */
  --danger-color: #f5365c;
  /* 更深的红色 */
  --warning-color: #f4b400;
  /* 更柔和的黄色 */
  --info-color: #11cdef;
  /* 清新的蓝色 */
  --light-color: #102333;
  /* 更深的背景色 */
  --dark-color: #172738;
  /* 更深的文字色 */
  --box-shadow: 0 4px 6px rgba(0, 0, 0, 0.2);
  /* 增强的阴影效果 */
  --transition: all 0.3s ease;
  --light-on: #ffffff;
}

/* 全局样式 */
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: 'Roboto';
  line-height: 1.6;
  color: var(--dark-color);
  background-color: var(--light-color);
}

.dark body {
  color: #fff;
  background-color: var(--dark-color);
}
</style>

<style scoped>
/* 其他样式 */
.buy-header {
  background-color: var(--success-color) !important;
  opacity: 0.5;
}

.sell-header {
  background-color: var(--danger-color) !important;
  opacity: 0.5;
}

.profit-header {
  background-color: var(--info-color) !important;
  opacity: 0.5;
}

.container {
  max-width: 98%;
  margin: 0 auto;
  padding: 32px;
}

.header {
  text-align: left;
  margin-bottom: 30px;
}

.title {
  font-size: 1rem;
  margin-bottom: 10px;
  font-weight: 600;
}

.section-title {
  color: var(--primary-color);
  font-size: 1.5rem;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.stats-section {
  margin-bottom: 30px;
  cursor: pointer;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.stat-card {
  background: var(--light-color);
  border-radius: var(--border-radius);
  padding: 20px;
  box-shadow: var(--box-shadow);
  transition: var(--transition);
}

.stat-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
}

.stat-label {
  font-size: 1rem;
  color: var(--secondary-color);
  margin-bottom: 10px;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: bold;
  color: var(--dark-color);
}

.profit {
  color: var(--success-color);
}

.loss {
  color: var(--danger-color);
}

.form-section {
  margin-bottom: 30px;
}

.transaction-form {
  background: var(--light-color);
  border-radius: var(--border-radius);
  padding: 25px;
  box-shadow: var(--box-shadow);
}

.form-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  align-items: end;
}

.form-group {
  margin-bottom: 0;
}

.form-label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: var(--secondary-color);
}

.form-input {
  width: 100%;
  padding: 10px 15px;
  border: 1px solid #ddd;
  border-radius: var(--border-radius);
  font-size: 1rem;
  transition: var(--transition);
}

.form-input:focus {
  border-color: var(--primary-color);
  outline: none;
  box-shadow: 0 0 0 3px rgba(74, 107, 175, 0.2);
}

.radio-group {
  display: flex;
  gap: 15px;
}

.radio-option {
  display: flex;
  align-items: center;
  padding: 8px 15px;
  border: 1px solid #ddd;
  border-radius: var(--border-radius);
  cursor: pointer;
  transition: var(--transition);
}

.radio-option.active {
  border-color: var(--primary-color);
  background-color: rgba(74, 107, 175, 0.1);
}

.radio-input {
  margin-right: 8px;
}

.submit-btn,
.sort-btn,
.export-btn,
.import-btn,
.delete-btn {
  position: relative;
  padding: 2px 8px;
  border: none;
  border-radius: var(--border-radius);
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
  transition: var(--transition);
}

.export-btn,
.import-btn {
  background-color: var(--export-btn);
  color: var(--light-on);
  margin-right: 8px;
}
.export-btn:hover,
.import-btn:hover {
  transition: all 0.3s ease;
  background-color: var(--export-hover-bth);
  transform: translateY(-1px);
}

.submit-btn {
  background-color: var(--primary-color);
  color: var(--light-on);
  height: 44px;
}

.submit-btn:hover {
  transition: all 0.3s ease;
  background-color: #3a5a9f;
  transform: translateY(-2px);
}

.sort-btn {
  background-color: var(--secondary-color);
  color: var(--light-on);
}

.sort-btn:hover {
  background-color: #5a6268;
}

.delete-btn {
  background-color: var(--danger-color);
  color: var(--light-on);
}

.delete-btn:hover {
  background-color: #c82333;
}

.table-container {
  width: 100%;
  overflow-x: auto;
  background: var(--light-on);
  border-radius: var(--border-radius);
  box-shadow: var(--box-shadow);
}

.transactions-table {
  width: 100%;
  border-collapse: collapse;
}

.transactions-table th,
.transactions-table td {
  padding: 12px 15px;
  text-align: left;
  border-bottom: 1px solid #eee;
}

.transactions-table th {
  background-color: var(--primary-color);
  color: var(--light-on);
  font-weight: 500;
}

.transactions-table tr:hover {
  background-color: rgba(0, 0, 0, 0.02);
}

.buy-type {
  color: var(--success-color);
  font-weight: 500;
}

.sell-type {
  color: var(--danger-color);
  font-weight: 500;
}

@media (max-width: 768px) {
  .form-row {
    grid-template-columns: 1fr;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: var(--light-on);
  padding: 25px;
  border-radius: var(--border-radius);
  width: 100%;
  max-width: 500px;
  box-shadow: var(--box-shadow);
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}

.cancel-btn {
  padding: 8px 16px;
  background-color: var(--secondary-color);
  color: var(--light-on);
  border: none;
  border-radius: var(--border-radius);
  cursor: pointer;
}

.confirm-btn {
  padding: 8px 16px;
  background-color: var(--success-color);
  color: var(--light-on);
  border: none;
  border-radius: var(--border-radius);
  cursor: pointer;
}

.sell-btn {
  padding: 2px 8px;
  background-color: var(--warning-color);
  color: var(--light-on);
  border: none;
  font-size: 0.8rem;
  border-radius: var(--border-radius);
  margin-right: 5px;
  cursor: pointer;
}
</style>
