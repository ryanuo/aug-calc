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
      ? new Decimal(sum).plus(t.weight).toNumber()
      : new Decimal(sum).minus(t.weight).toNumber()
  }, 0),
)

const totalProfit = computed(() =>
  transactions.value.reduce((sum, t) => new Decimal(sum).plus(t.profit).toNumber(), 0),
)

const totalValue = computed(() =>
  transactions.value.reduce((sum, t) => {
    return t.type === 'buy'
      ? new Decimal(sum).plus(new Decimal(t.weight).times(t.price)).toNumber()
      : sum
  }, 0),
)

const sortByTime = reactive({ ascending: true }) // 控制时间排序

function addTransaction() {
  const { type, weight, price } = newTransaction
  const profit
    = type === 'sell'
      ? new Decimal(price).minus(getAverageBuyPrice()).times(weight).toNumber()
      : 0

  transactions.value.push({
    type,
    weight,
    price,
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
    (sum, t) => new Decimal(sum).plus(t.weight).toNumber(),
    0,
  )
  const totalCost = buyTransactions.reduce(
    (sum, t) =>
      new Decimal(sum).plus(new Decimal(t.weight).times(t.price)).toNumber(),
    0,
  )
  return totalWeight > 0 ? new Decimal(totalCost).dividedBy(totalWeight).toNumber() : 0
}
</script>

<template>
  <div class="p-y-2">
    <h1>黄金交易记录</h1>

    <h2>统计</h2>
    <table>
      <thead>
        <tr>
          <th>统计项</th>
          <th>数值</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>总克数变化</td>
          <td>{{ totalWeight }} 克</td>
        </tr>
        <tr>
          <td>总盈亏</td>
          <td :class="{ profit: totalProfit > 0, loss: totalProfit < 0 }">
            {{ totalProfit }} 元
          </td>
        </tr>
        <tr>
          <td>总价值</td>
          <td>{{ totalValue }} 元</td>
        </tr>
      </tbody>
    </table>

    <form @submit.prevent="addTransaction">
      <div class="form-row">
        <label class="flex">
          <input v-model="newTransaction.type" type="radio" value="buy"> 买入
          <input v-model="newTransaction.type" type="radio" value="sell"> 卖出
        </label>
        <label>
          克数
          <input v-model="newTransaction.weight" type="text" required>
        </label>
        <label>
          单价
          <input v-model="newTransaction.price" type="text" required>
        </label>
        <button type="submit">
          添加交易
        </button>
      </div>
    </form>

    <h2>交易记录</h2>
    <button @click="sortByTime.ascending = !sortByTime.ascending">
      按时间排序 {{ sortByTime.ascending ? '升序' : '降序' }}
    </button>
    <table>
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
          <td>{{ transaction.type === 'buy' ? '买入' : '卖出' }}</td>
          <td>{{ transaction.weight }}</td>
          <td>{{ transaction.price }}</td>
          <td :class="{ profit: transaction.profit > 0, loss: transaction.profit < 0 }">
            {{ transaction.profit }}
          </td>
          <td>{{ new Date(transaction.time).toLocaleString() }}</td>
          <td>
            <button @click="deleteTransaction(index)">
              删除
            </button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap');

body {
  font-family: 'Roboto', sans-serif;
  background-color: #f4f6f9;
  margin: 0;
  padding: 0;
}

h1,
h2 {
  color: #2c3e50;
  font-weight: 700;
}

h1 {
  font-size: 40px;
  text-align: center;
  margin-top: 40px;
  text-transform: uppercase;
  letter-spacing: 1.5px;
}

h2 {
  font-size: 30px;
  margin-top: 30px;
  text-align: center;
  color: #3498db;
}

div {
  max-width: 900px;
  margin: 30px auto;
  background-color: white;
  padding: 30px;
  border-radius: 12px;
  box-shadow: 0 6px 15px rgba(0, 0, 0, 0.1);
}

table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 20px;
  border-radius: 8px;
  overflow: hidden;
}

th,
td {
  border: 1px solid #e1e4e8;
  padding: 16px;
  text-align: center;
  font-size: 16px;
}

th {
  background-color: #f8f9fa;
  color: #3498db;
  font-weight: 500;
}

tr:nth-child(even) {
  background-color: #f9f9f9;
}

tr:hover {
  background-color: #eaf2f8;
}

button {
  padding: 10px 20px;
  background-color: #3498db;
  color: white;
  font-size: 16px;
  font-weight: 500;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition:
    background-color 0.3s ease,
    transform 0.2s ease;
}

button:hover {
  background-color: #2980b9;
  transform: translateY(-2px);
}

button:active {
  transform: translateY(0);
}

input[type='text'],
select {
  width: 100%;
  padding: 10px;
  border-radius: 6px;
  border: 1px solid #ddd;
  margin-top: 8px;
  font-size: 16px;
  transition: border-color 0.3s ease;
}

input[type='text']:focus,
select:focus {
  outline: none;
  border-color: #3498db;
}

form {
  margin-bottom: 20px;
  padding: 20px;
  background-color: #f8f9fa;
  border-radius: 12px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
}

label {
  display: block;
  font-size: 16px;
  margin-bottom: 12px;
  font-weight: 500;
}

.profit {
  color: #27ae60;
  font-weight: bold;
}

.loss {
  color: #e74c3c;
  font-weight: bold;
}

.form-row {
  display: flex;
  align-items: center;
  gap: 16px;
}

.form-row label {
  flex: 1;
}

.form-row button {
  flex-shrink: 0;
}
</style>
