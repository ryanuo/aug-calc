<script setup lang="ts">
import { useStorage } from '@vueuse/core' // 引入 useStorage
import Decimal from 'decimal.js' // 引入金额计算库
import { computed, reactive } from 'vue'

const transactions = useStorage<any[]>('transactions', []) // 使用 useStorage 替代本地存储
const newTransaction = reactive({
  type: 'buy',
  weight: 0,
  price: 0,
})

const totalWeight = computed(() =>
  transactions.value.reduce((sum, t) => {
    return t.type === 'buy'
      ? new Decimal(sum).plus(t.weight).toDecimalPlaces(4).toNumber()
      : new Decimal(sum).minus(t.weight).toDecimalPlaces(4).toNumber()
  }, 0),
)

const totalProfit = computed(() =>
  transactions.value.reduce((sum, t) =>
    new Decimal(sum).plus(t.profit).toDecimalPlaces(4).toNumber(), 0),
)

const totalValue = computed(() =>
  transactions.value.reduce((sum, t) => {
    return t.type === 'buy'
      ? new Decimal(sum).plus(new Decimal(t.weight).times(t.price)).toDecimalPlaces(4).toNumber()
      : sum
  }, 0),
)

const sortByTime = reactive({ ascending: true }) // 控制时间排序

function addTransaction() {
  const { type, weight, price } = newTransaction
  const profit = type === 'sell'
    ? new Decimal(price).minus(getAverageBuyPrice()).times(weight).toDecimalPlaces(4).toNumber()
    : 0

  transactions.value.push({
    type,
    weight: new Decimal(weight).toDecimalPlaces(4).toNumber(),
    price: new Decimal(price).toDecimalPlaces(4).toNumber(),
    profit,
    time: new Date().toISOString(), // 添加时间戳
  })
  newTransaction.type = 'buy'
  newTransaction.weight = 0
  newTransaction.price = 0
}

function deleteTransaction(index: number) {
  transactions.value.splice(index, 1) // 删除指定交易
}

const sortedTransactions = computed(() => {
  return [...transactions.value].sort((a, b) => {
    return sortByTime.ascending
      ? new Date(a.time).getTime() - new Date(b.time).getTime()
      : new Date(b.time).getTime() - new Date(a.time).getTime()
  })
})

function getAverageBuyPrice() {
  const buyTransactions = transactions.value.filter(t => t.type === 'buy')
  const totalWeight = buyTransactions.reduce(
    (sum, t) => new Decimal(sum).plus(t.weight).toDecimalPlaces(4).toNumber(),
    0,
  )
  const totalCost = buyTransactions.reduce(
    (sum, t) =>
      new Decimal(sum).plus(new Decimal(t.weight).times(t.price)).toDecimalPlaces(4).toNumber(),
    0,
  )
  return totalWeight > 0
    ? new Decimal(totalCost).dividedBy(totalWeight).toDecimalPlaces(4).toNumber()
    : 0
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
              总克数变化
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
          ➕ 添加交易
        </h2>
        <form class="transaction-form" @submit.prevent="addTransaction">
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">交易类型</label>
              <div class="radio-group">
                <label class="radio-option" :class="{ active: newTransaction.type === 'buy' }">
                  <input v-model="newTransaction.type" type="radio" value="buy" class="radio-input">
                  <span class="radio-label">买入</span>
                </label>
                <label class="radio-option" :class="{ active: newTransaction.type === 'sell' }">
                  <input v-model="newTransaction.type" type="radio" value="sell" class="radio-input">
                  <span class="radio-label">卖出</span>
                </label>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">克数 (克)</label>
              <input v-model="newTransaction.weight" type="number" step="0.01" min="0" class="form-input" required>
            </div>

            <div class="form-group">
              <label class="form-label">单价 (元/克)</label>
              <input v-model="newTransaction.price" type="number" step="0.01" min="0" class="form-input" required>
            </div>

            <button type="submit" class="submit-btn">
              添加交易
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
                <th>类型</th>
                <th>克数</th>
                <th>单价</th>
                <th>盈利</th>
                <th>时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(transaction, index) in sortedTransactions" :key="index">
                <td :class="{ 'buy-type': transaction.type === 'buy', 'sell-type': transaction.type === 'sell' }">
                  {{ transaction.type === 'buy' ? '买入' : '卖出' }}
                </td>
                <td>{{ transaction.weight }} 克</td>
                <td>{{ transaction.price }} 元</td>
                <td :class="{ profit: transaction.profit > 0, loss: transaction.profit < 0 }">
                  {{ transaction.profit || '-' }} 元
                </td>
                <td>{{ new Date(transaction.time).toLocaleString() }}</td>
                <td>
                  <button class="delete-btn" @click="deleteTransaction(index)">
                    删除
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
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
</style>
