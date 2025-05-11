<script setup lang="ts">
import type { Transaction } from './type'
import * as XLSX from 'xlsx'
import { useMessageStore } from '~/composables/message'

const props = defineProps({
  transactions: {
    type: Array as () => Transaction[],
    required: true,
  },
})

const emits = defineEmits(['update:transactions']) // 定义事件

const { showMessage } = useMessageStore()

function importData(e: any) {
  if (e.target.files && e.target.files.length > 0) {
    const file = e.target.files[0]
    const reader = new FileReader()
    reader.onload = (event) => {
      const data = new Uint8Array(event.target!.result as ArrayBuffer)
      const workbook = XLSX.read(data, { type: 'array' })
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName!]
      const jsonData = XLSX.utils.sheet_to_json(worksheet!)
      const updatedTransactions = jsonData.map((row: any) => ({
        buy: {
          weight: row['买入克数'] || 0,
          price: row['买入单价'] || 0,
          time: row['买入时间'] ? row['买入时间'] : '',
          totalPrice: row['买入总价'] || 0,
        },
        sell: row['卖出克数']
          ? {
              weight: row['卖出克数'] || 0,
              price: row['卖出单价'] || 0,
              time: row['卖出时间'] ? row['买入时间'] : '',
              totalPrice: row['卖出总价'] || 0,
              fee: row['手续费'] || 0,
              profit: row['盈利'] || 0,
            }
          : undefined,
        id: row.ID || '',
      }))
      emits('update:transactions', updatedTransactions) // 通过事件传递数据
    }
    reader.readAsArrayBuffer(file)
  }
}

function exportData() {
  const tableData = props.transactions.map(transaction => ({
    ID: transaction.id,
    买入克数: transaction.buy?.weight || '',
    买入单价: transaction.buy?.price || '',
    买入时间: transaction.buy?.time || '',
    买入总价: transaction.buy?.totalPrice || '',
    卖出克数: transaction.sell?.weight || '',
    卖出单价: transaction.sell?.price || '',
    卖出时间: transaction.sell?.time || '',
    卖出总价: transaction.sell?.totalPrice || '',
    手续费: transaction.sell?.fee || '',
    盈利: transaction.sell?.profit || '',
  }))

  const worksheet = XLSX.utils.json_to_sheet(tableData)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Transactions')

  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
  const blob = new Blob([excelBuffer], { type: 'application/octet-stream' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'transactions.xlsx'
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
  <button class="import-btn">
    <input
      type="file" accept=".xlsx,.xls" class="opacity-0 h-full w-full cursor-pointer absolute"
      @change="importData"
    >
    <div class="i-hugeicons-upload-02" /> 导入数据
  </button>
  <button class="export-btn" @click="exportData">
    <div class="i-jam-download" /> 导出数据
  </button>
</template>

<style scoped>
.import-btn,
.export-btn {
  position: relative;
  padding: 2px 8px;
  border: none;
  border-radius: var(--border-radius);
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
  transition: var(--transition);
}

.import-btn {
  background-color: var(--export-btn);
  color: var(--light-on);
  margin-right: 8px;
}

.import-btn:hover {
  background-color: var(--export-hover-bth);
}

.export-btn {
  background-color: var(--export-btn);
  color: var(--light-on);
}

.export-btn:hover {
  background-color: var(--export-hover-bth);
}
</style>
