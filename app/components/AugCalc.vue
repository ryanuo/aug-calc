<script setup lang="ts">
import { useStorage } from '@vueuse/core'
import Decimal from 'decimal.js'
import { computed, reactive } from 'vue'

interface ItemTransaction {
  weight: number
  price: number
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

const sortedTransactions = computed(() => {
  return [...transactions.value].sort((a, b) => {
    const aTime = new Date(a.buy?.time || a.sell?.time || 0).getTime()
    const bTime = new Date(b.buy?.time || b.sell?.time || 0).getTime()
    return sortByTime.ascending ? aTime - bTime : bTime - aTime
  })
})

const totalWeight = computed(() => {
  return transactions.value.reduce((sum, transaction) => {
    if (transaction.buy) {
      sum = new Decimal(sum).plus(transaction.buy.weight).toNumber()
    }
    return sum
  }, 0)
})

const totalProfit = computed(() => {
  return transactions.value.reduce((sum, transaction) => {
    if (transaction.sell?.profit) {
      sum = new Decimal(sum).plus(transaction.sell.profit).toNumber()
    }
    return sum
  }, 0)
})

const totalValue = computed(() => {
  return transactions.value.reduce((sum, transaction) => {
    if (transaction.buy) {
      sum = new Decimal(sum).plus(new Decimal(transaction.buy.weight).times(transaction.buy.price)).toNumber()
    }
    return sum
  }, 0)
})

function getAverageBuyPrice(): number {
  const totalWeights = transactions.value.reduce((sum, transaction) => {
    if (transaction.buy) {
      sum = new Decimal(sum).plus(transaction.buy.weight).toNumber()
    }
    return sum
  }, 0)

  const totalPrice = transactions.value.reduce((sum, transaction) => {
    if (transaction.buy) {
      sum = new Decimal(sum).plus(new Decimal(transaction.buy.weight).times(transaction.buy.price)).toNumber()
    }
    return sum
  }, 0)

  return totalWeights > 0 ? Number.parseFloat(new Decimal(totalPrice).dividedBy(totalWeights).toFixed(4)) : 0
}

function addTransaction() {
  if (newTransaction.weight > 0 && newTransaction.price > 0) {
    transactions.value.push({
      buy: {
        weight: newTransaction.weight,
        price: newTransaction.price,
        time: new Date().toISOString(),
      },
    })
    newTransaction.weight = 0
    newTransaction.price = 0
  }
}

const showSellModal = reactive({
  visible: false,
  index: -1,
  weight: 0,
  price: 0,
  feePercentage: 0.3,
})

function openSellModal(index: number) {
  const transaction = transactions.value[index]
  if (transaction!.buy) {
    showSellModal.visible = true
    showSellModal.index = index
    showSellModal.weight = transaction!.buy.weight
    showSellModal.price = 0
    showSellModal.feePercentage = 0.3
  }
}

function sellTransaction() {
  const transaction = transactions.value[showSellModal.index]
  if (transaction && transaction.buy) {
    const fee = new Decimal(showSellModal.price).times(showSellModal.weight).times(showSellModal.feePercentage).dividedBy(100).toNumber()
    const profit = new Decimal(showSellModal.price).times(showSellModal.weight).minus(new Decimal(transaction.buy.price).times(showSellModal.weight)).minus(fee).toNumber()

    transaction.sell = {
      weight: showSellModal.weight,
      price: showSellModal.price,
      time: new Date().toISOString(),
      profit,
      fee,
    }

    showSellModal.visible = false
    showSellModal.index = -1
    showSellModal.weight = 0
    showSellModal.price = 0
    showSellModal.feePercentage = 0.3
  }
}

function deleteTransaction(index: number) {
  transactions.value.splice(index, 1)
}
</script>

<template>
  <div class="container">
    <header class="header">
      <h1 class="title">
        📊 黄金交易记录
      </h1>
    </header>

    <main class="main-content">
      <section class="stats-section">
        <h2 class="section-title">
          📈 统计概览
        </h2>
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-label">
              总克数
            </div>
            <div class="stat-value">
              {{ totalWeight }} 克
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-label">
              总盈亏
            </div>
            <div class="stat-value" :class="{ profit: totalProfit > 0, loss: totalProfit < 0 }">
              {{ totalProfit }} 元
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-label">
              总价值
            </div>
            <div class="stat-value">
              {{ totalValue }} 元
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-label">
              平均买入价
            </div>
            <div class="stat-value">
              {{ getAverageBuyPrice() }} 元/克
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
            📋 交易记录
          </h2>
          <button class="sort-btn" @click="sortByTime.ascending = !sortByTime.ascending">
            {{ sortByTime.ascending ? '↑ 时间升序' : '↓ 时间降序' }}
          </button>
        </div>

        <div class="table-container">
          <table class="transactions-table">
            <thead>
              <tr>
                <th colspan="3" class="buy-header">
                  买入
                </th>
                <th colspan="3" class="sell-header">
                  卖出
                </th>
                <th colspan="2" class="profit-header">
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
                  时间
                </th>
                <th class="sell-header">
                  克数
                </th>
                <th class="sell-header">
                  单价
                </th>
                <th class="sell-header">
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
                <td>{{ transaction.buy?.weight }} 克</td>
                <td>{{ transaction.buy?.price }} 元</td>
                <td>{{ new Date(transaction.buy!.time).toLocaleString() }}</td>
                <td>{{ transaction.sell?.weight || '-' }} 克</td>
                <td>{{ transaction.sell?.price || '-' }} 元</td>
                <td>{{ transaction.sell ? new Date(transaction.sell.time).toLocaleString() : '-' }}</td>
                <td>{{ transaction.sell?.fee || '-' }} 元</td>
                <td :class="{ profit: !!transaction?.sell?.profit, loss: transaction.sell?.profit !== 0 && Number(transaction.sell?.profit) < 0 }">
                  {{ transaction.sell?.profit || '-' }} 元
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
      <GoldSellModal
        v-model:visible="showSellModal.visible"
        :initial-data="showSellModal"
        @submit="sellTransaction"
      />
    </main>
  </div>
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
  --dark-color: #343a40;
  --border-radius: 8px;
  --box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  --transition: all 0.3s ease;
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  line-height: 1.6;
  color: #333;
  background-color: #f5f7fa;
}
</style>

<style scoped>
.buy-header {
  background-color: var(--success-color) !important; /* 买入背景颜色 */
  opacity: 0.5;
}

.sell-header {
  background-color: var(--danger-color) !important; /* 卖出背景颜色 */
  opacity: 0.5;
}

.profit-header {
  background-color: var(--info-color) !important; /* 收益背景颜色 */
  opacity: 0.5;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.header {
  text-align: center;
  margin-bottom: 30px;
}

.title {
  color: var(--primary-color);
  font-size: 2.5rem;
  margin-bottom: 10px;
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

/* 统计卡片样式 */
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
  background: white;
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

/* 表单样式 */
.form-section {
  margin-bottom: 30px;
}

.transaction-form {
  background: white;
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

/* 按钮样式 */
.submit-btn,
.sort-btn,
.delete-btn {
  padding: 4px 8px;
  border: none;
  border-radius: var(--border-radius);
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
  transition: var(--transition);
}

.submit-btn {
  background-color: var(--primary-color);
  color: white;
  height: 42px;
}

.submit-btn:hover {
  background-color: #3a5a9f;
  transform: translateY(-2px);
}

.sort-btn {
  background-color: var(--secondary-color);
  color: white;
}

.sort-btn:hover {
  background-color: #5a6268;
}

.delete-btn {
  background-color: var(--danger-color);
  color: white;
}

.delete-btn:hover {
  background-color: #c82333;
}

/* 表格样式 */
.table-container {
  overflow-x: auto;
  background: white;
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
  color: white;
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

/* 响应式设计 */
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
  background: white;
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
  color: white;
  border: none;
  border-radius: var(--border-radius);
  cursor: pointer;
}

.confirm-btn {
  padding: 8px 16px;
  background-color: var(--success-color);
  color: white;
  border: none;
  border-radius: var(--border-radius);
  cursor: pointer;
}

.sell-btn {
  padding: 4px 8px;
  background-color: var(--warning-color);
  color: white;
  border: none;
  border-radius: var(--border-radius);
  margin-right: 5px;
  cursor: pointer;
}
</style>
