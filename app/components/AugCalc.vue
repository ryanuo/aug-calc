<script setup lang="ts">
import type { Transaction } from './type'
import { numberToFixed, preciseAdd, preciseDiv, preciseMul, preciseSub } from '@ryanuo/utils'
import { useStorage } from '@vueuse/core'
import { reactive, ref, watch } from 'vue'
import { FEEPROCENTAGE } from '~/constants'

const transactions = useStorage<Transaction[]>('transactions', [])

const newTransaction = reactive({
  weight: 0,
  price: 0,
  totalPrice: 0,
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

watch(
  [() => newTransaction.totalPrice, () => newTransaction.price],
  ([newTotalPrice, price]) => {
    if (price > 0 && newTotalPrice > 0) {
      newTransaction.weight = numberToFixed(preciseDiv(newTotalPrice, price).toNumber())
    }
    else {
      newTransaction.weight = 0
    }
  },
)

watch(
  () => sortByTime.ascending,
  () => {
    transactions.value = [...transactions.value].sort((a, b) => {
      const aTime = new Date(a.buy?.time || a.sell?.time || 0).getTime()
      const bTime = new Date(b.buy?.time || b.sell?.time || 0).getTime()
      return sortByTime.ascending ? aTime - bTime : bTime - aTime
    })
  },
)

watch(() => transactions.value, (newVal) => {
  if (!newVal.length) {
    return
  }

  staticData.totalWeight = newVal.reduce((sum, transaction) => {
    if (!transaction.sell?.weight) {
      sum = preciseAdd(sum, transaction.buy.weight).toNumber()
    }
    return sum
  }, 0)

  staticData.totalProfit = newVal.reduce((sum, transaction) => {
    if (transaction.sell?.profit) {
      sum = preciseAdd(sum, transaction.sell.profit).toNumber()
    }
    return sum
  }, 0)

  const totalWaitSellAvaPrice = newVal.reduce((sum, transaction) => {
    if (!transaction.sell?.price) {
      sum = preciseAdd(sum, transaction.buy.totalPrice).toNumber()
    }
    return sum
  }, 0)
  staticData.waitSellAvaPrice = preciseDiv(totalWaitSellAvaPrice, staticData.totalWeight).toNumber()
}, { immediate: true, deep: true })

function addTransaction() {
  if (newTransaction.weight > 0 && newTransaction.price > 0) {
    transactions.value.push({
      buy: {
        weight: newTransaction.weight,
        price: newTransaction.price,
        time: new Date().toISOString(),
        totalPrice: preciseMul(newTransaction.price, newTransaction.weight).toNumber(),
      },
      id: new Date().getTime().toString(),
    })
    newTransaction.weight = 0
    newTransaction.price = 0
    newTransaction.totalPrice = 0
  }
}

interface ShowSellModalType {
  visible: boolean
  rowId: string
  weight: number
  price: number
  feePercentage: number
}

const showSellModal = reactive<ShowSellModalType>({
  visible: false,
  rowId: '',
  weight: 0,
  price: 0,
  feePercentage: FEEPROCENTAGE.DEFAULT,
})

function openSellModal(rowId: string) {
  const transaction = transactions.value.find(item => item.id === rowId)
  if (transaction!.buy) {
    showSellModal.visible = true
    showSellModal.rowId = rowId
    showSellModal.weight = transaction!.buy.weight - (transaction!.sell?.weight || 0)
    showSellModal.price = transaction!.buy.price
    showSellModal.feePercentage = FEEPROCENTAGE.DEFAULT
  }
}

function sellTransaction(e: ShowSellModalType) {
  const transaction = transactions.value.find(item => item.id === e.rowId)
  if (transaction && transaction.buy) {
    const totalPrice = preciseMul(e.price, e.weight).toNumber()
    const fee = preciseDiv(preciseMul(totalPrice, e.feePercentage).toNumber(), 100).toNumber()
    const profit = preciseSub(totalPrice, preciseAdd(transaction.buy.totalPrice, fee).toNumber()).toNumber()
    transaction.sell = {
      weight: e.weight,
      price: e.price,
      time: new Date().toISOString(),
      profit,
      fee,
      totalPrice,
    }

    showSellModal.visible = false
    showSellModal.rowId = ''
    showSellModal.weight = 0
    showSellModal.price = 0
    showSellModal.feePercentage = FEEPROCENTAGE.DEFAULT
  }
}

function deleteTransaction(rowId: string) {
  const index = transactions.value.findIndex(item => item.id === rowId)
  if (index > -1) {
    transactions.value.splice(index, 1)
  }
}

function goToRow(rowId: string) {
  const table = document.querySelector('.transactions-table') as HTMLTableElement
  const rows = Array.from(table.rows) // Convert rows to an array
  const row = rows.find(
    (item, i) => item.dataset.rowKey === rowId && i > 0,
  ) as HTMLTableRowElement
  if (row) {
    row.scrollIntoView({ behavior: 'smooth', block: 'center' })
    row.classList.add('highlight')
    setTimeout(() => {
      row.classList.remove('highlight')
    }, 4000)
  }
}

const selectedData = reactive({
  totalWeight: 0,
  averagePrice: 0,
})
const selectedIndexes = ref<string[]>([])

function updateSelectedData() {
  const selectedTransactions = transactions.value.filter(_ => selectedIndexes.value.includes(_.id))
  const totalWeight = selectedTransactions.reduce((sum, transaction) => {
    return preciseAdd(sum, transaction.buy?.weight || 0).toNumber()
  }, 0)
  const totalPrice = selectedTransactions.reduce((sum, transaction) => {
    return preciseAdd(sum, transaction.buy?.totalPrice || 0).toNumber()
  }, 0)
  selectedData.totalWeight = totalWeight
  selectedData.averagePrice = totalWeight > 0 ? preciseDiv(totalPrice, totalWeight).toNumber() : 0
}

function handleCheckBoxChange(checked: boolean, rowId: string) {
  if (checked) {
    selectedIndexes.value.push(rowId)
  }
  else {
    const idx = selectedIndexes.value.indexOf(rowId)
    if (idx > -1) {
      selectedIndexes.value.splice(idx, 1)
    }
  }
}

watch(selectedIndexes.value, updateSelectedData)
</script>

<template>
  <div class="container">
    <header class="header">
      <h4 class="title text-black cursor-pointer dark:text-white" flex="~ gap-2 items-center">
        <span class="i-mdi-gold" />
        <div class="h-full translate-y-[2px]" flex="~ items-center">
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
            <div class="stat-value" :class="{ profit: staticData.totalProfit < 0, loss: staticData.totalProfit > 0 }">
              {{ numberToFixed(staticData.totalProfit) }} 元
            </div>
          </div>
          <!-- 实时金价 -->
          <OnlineGoldPrice />
        </div>
      </section>

      <section class="form-section">
        <h2 class="section-title">
          ➕ 添加买入记录
        </h2>
        <div flex="~ gap-4">
          <div class="chart-wrapper flex-1">
            <TransactionChart :transactions="transactions" :go-to-row="goToRow" />
          </div>
          <form class="transaction-form" @submit.prevent="addTransaction">
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">克数 (克)</label>
                <input
                  v-model="newTransaction.weight" type="number" step="0.0001" min="0"
                  class="form-input text-#999 bg-#eaeaea dark:bg-#1c1c3057" required disabled
                >
              </div>

              <div class="form-group">
                <label class="form-label">买入金额（元）</label>
                <input
                  v-model="newTransaction.totalPrice" type="number" step="0.0001" min="0" class="form-input"
                  required
                >
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
        </div>
      </section>

      <section class="transactions-section">
        <div class="section-header">
          <h2 class="section-title">
            📋 交易记录
            <span v-if="transactions.length" class="text-xs">共{{ transactions.length }}条</span>
            <span v-if="selectedIndexes.length" class="text-xs text-green-500 ml-2">
              已选中: {{ numberToFixed(selectedData.totalWeight) }} 克, 均价: {{ numberToFixed(selectedData.averagePrice) }} 元
            </span>
          </h2>
          <div>
            <ImportExport
              :transactions="transactions"
              @update:transactions="(newTransactions) => transactions = newTransactions"
            />
            <button class="sort-btn ml-1" @click="sortByTime.ascending = !sortByTime.ascending">
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
                <th rowspan="2" />
                <th rowspan="2">
                  ID
                </th>
                <th :colspan="isShowTimeRow ? 4 : 3" class="buy-header border-thead">
                  买入
                </th>
                <th :colspan="isShowTimeRow ? 4 : 3" class="border-thead sell-header">
                  卖出
                </th>
                <th :colspan="2" class="border-thead profit-header">
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
                <th v-if="isShowTimeRow" class="buy-header">
                  时间
                </th>
                <th class="buy-header border-thead">
                  Total
                </th>
                <th class="sell-header">
                  克数
                </th>
                <th class="sell-header">
                  单价
                </th>
                <th v-if="isShowTimeRow" class="sell-header">
                  时间
                </th>
                <th class="sell-header border-thead">
                  Total
                </th>
                <!-- <th class="profit-header">
                  进度
                </th> -->
                <th class="profit-header">
                  手续费
                </th>
                <th class="profit-header">
                  盈利
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(transaction, index) in transactions"
                :key="transaction.id"
                :class="{ 'selected-row': selectedIndexes.includes(transaction.id) }"
                :data-row-key="transaction.id"
              >
                <td>
                  <Checkbox
                    @change="(e) => handleCheckBoxChange(e, transaction.id)"
                  />
                </td>
                <td>{{ index + 1 }}</td>
                <td>{{ numberToFixed(transaction.buy?.weight) }} 克</td>
                <td>{{ numberToFixed(transaction.buy?.price) }} 元</td>
                <td v-if="isShowTimeRow">
                  {{ new Date(transaction.buy!.time).toLocaleString() }}
                </td>
                <td>{{ numberToFixed(transaction.buy?.totalPrice) }} 元</td>
                <td>{{ transaction.sell?.weight ? `${numberToFixed(transaction.sell.weight)} 克` : '-' }}</td>
                <td>{{ transaction.sell?.price ? `${numberToFixed(transaction.sell.price)} 元` : '-' }}</td>
                <td v-if="isShowTimeRow">
                  {{ transaction.sell ? new Date(transaction.sell.time).toLocaleString() : '-' }}
                </td>
                <td>{{ transaction.sell?.totalPrice ? `${numberToFixed(transaction.sell.totalPrice)} 元` : '-' }}</td>
                <!-- <td>
                  <div class="flex items-center justify-center relative">
                    <svg class="h-15 w-15 transform -rotate-90">
                      <circle
                        cx="30" cy="30" r="20" stroke="currentColor" stroke-width="4" fill="transparent"
                        class="text-green-500"
                      />
                      <circle
                        cx="30" cy="30" r="20" stroke="currentColor" stroke-width="4" fill="transparent"
                        :stroke-dasharray="2 * Math.PI * 20"
                        :stroke-dashoffset="transaction.sell?.weight ? 2 * Math.PI * 20 * (transaction.sell?.weight / transaction.buy?.weight) : 0"
                        class="text-red-100"
                      />
                    </svg>
                    <span class="text-xs absolute">
                      {{ transaction.sell?.weight ? `${numberToFixed(transaction.sell.weight / transaction.buy.weight * 100, 1)}%` : '-' }}
                    </span>
                  </div>
                </td> -->
                <td>{{ transaction.sell?.fee ? `${numberToFixed(transaction.sell.fee)} 元` : '-' }}</td>
                <td
                  :class="{
                    profit: Number(transaction?.sell?.profit) < 0,
                    loss: Number(transaction.sell?.profit) > 0,
                  }"
                >
                  {{ transaction.sell?.profit ? `${numberToFixed(transaction.sell.profit)} 元` : '-' }}
                </td>
                <td>
                  <button class="sell-btn" @click="openSellModal(transaction.id)">
                    卖出
                  </button>
                  <button class="delete-btn" @click="deleteTransaction(transaction.id)">
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

<style scoped>
.highlight {
  background-color: rgba(0, 0, 0, 0.1);
  transition: background-color 0.5s ease;
  box-shadow: inset 0 0 10px rgba(0, 0, 0, 0.5);
}

.border-thead {
  border-right: 1px solid var(--td-border);
}

/* 其他样式 */
.buy-header {
  /* background-color: var(--success-color) !important; */
  opacity: 0.5;
}

.sell-header {
  /* background-color: var(--danger-color) !important; */
  opacity: 0.5;
}

.profit-header {
  /* background-color: var(--info-color) !important; */
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
  /* margin-bottom: 20px; */
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
  background: var(--card-bg-color);
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
  border: 1px solid var(--form-input);
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

/* .delete-btn { */
/* background-color: var(--danger-color);
  color: var(--light-on); */
/* } */

.delete-btn:hover,
.sell-btn:hover {
  /* background-color: #c82333; */
  text-underline-offset: 4px;
  text-decoration: underline;
}

.table-container {
  width: 100%;
  height: 80vh;
  overflow: auto;
  background: var(--card-bg-color);
  border-radius: var(--border-radius);
  box-shadow: var(--box-shadow);
  color: var(--stat-value);
}

.transactions-table {
  width: 100%;
  border-collapse: collapse;
}

.transactions-table thead {
  position: sticky;
  top: 0;
  background-color: #fff;
  z-index: 1;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

.transactions-table th,
.transactions-table td {
  padding: 12px 15px;
  text-align: left;
  border-bottom: 1px solid var(--td-border);
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
  /* background-color: var(--warning-color); */
  /* color: var(--light-on); */
  border: none;
  font-size: 0.8rem;
  border-radius: var(--border-radius);
  margin-right: 5px;
  cursor: pointer;
}

.chart-wrapper {
  background: var(--card-bg-color);
  border-radius: var(--border-radius);
  padding: 25px;
  box-shadow: var(--box-shadow);
}

.selected-row {
  background-color: rgba(0, 128, 0, 0.1);
}
</style>
