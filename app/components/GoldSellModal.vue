<script setup lang="ts">
import { FEEPROCENTAGE } from '~/constants'

const props = defineProps({
  visible: {
    type: Boolean,
    required: true,
  },
  initialData: {
    type: Object,
    default: () => ({
      weight: 0,
      price: 0,
      feePercentage: 0.3,
    }),
  },
})

const emit = defineEmits(['update:visible', 'submit'])

const formData = ref({
  weight: props.initialData.weight,
  price: undefined,
  feePercentage: props.initialData.feePercentage,
})

// 监听初始数据变化
watch(() => props.initialData, (newVal) => {
  formData.value = { ...newVal } as any
}, { deep: true })

function closeModal() {
  emit('update:visible', false)
}
const { showMessage } = useMessageStore()

function handleSubmit() {
  if (formData.value.weight > props.initialData.weight) {
    showMessage({
      t: 'error',
      message: '卖出克数不能大于持有克数',
    })
  }
  else {
    emit('submit', formData.value)
    closeModal()
  }
}
</script>

<template>
  <transition name="modal-fade">
    <div v-if="visible" class="modal-overlay" @click.self="closeModal">
      <div class="modal-content">
        <div class="modal-header">
          <h3 class="modal-title">
            卖出黄金
          </h3>
          <button class="modal-close" @click="closeModal">
            &times;
          </button>
        </div>

        <div class="modal-body">
          <div class="form-group">
            <label class="form-label">克数 (克)</label>
            <input
              v-model="formData.weight" type="number" step="0.0001" min="0" class="form-input"
              placeholder="请输入卖出克数" required
            >
          </div>

          <div class="form-group">
            <label class="form-label">手续费 (%)</label>
            <input
              v-model="formData.feePercentage" type="number" step="0.01" :min="FEEPROCENTAGE.DEFAULT"
              class="form-input" :placeholder="`${FEEPROCENTAGE.DEFAULT}`" required
            >
          </div>

          <div class="form-group">
            <label class="form-label">单价 (元/克)</label>
            <input
              v-model="formData.price" type="number" step="0.0001" :min="`${props.initialData.price}`"
              class="form-input" placeholder="请输入当前金价" required
            >
          </div>
        </div>

        <div class="modal-footer">
          <button class="cancel-btn btn" @click="closeModal">
            取消
          </button>
          <button class="confirm-btn btn" @click="handleSubmit">
            确认卖出
          </button>
        </div>
      </div>
    </div>
  </transition>
</template>

<style scoped>
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
  backdrop-filter: blur(3px);
}

.modal-content {
  background-color: #fff;
  border-radius: 12px;
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.2);
  width: 90%;
  max-width: 420px;
  overflow: hidden;
}

.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.3s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-fade-enter-active .modal-content,
.modal-fade-leave-active .modal-content {
  transition: transform 0.3s ease;
}

.modal-fade-enter-from .modal-content,
.modal-fade-leave-to .modal-content {
  transform: translateY(-20px);
}

.modal-header {
  padding: 20px;
  background: linear-gradient(135deg, #f5d287 0%, #e8b450 100%);
  color: #333;
  position: relative;
}

.modal-title {
  margin: 0;
  font-size: 1.4rem;
  font-weight: 600;
  text-align: left;
}

.modal-close {
  position: absolute;
  top: 15px;
  right: 15px;
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #666;
  transition: color 0.2s;
}

.modal-close:hover {
  color: #333;
}

.modal-body {
  padding: 20px;
}

.form-group {
  margin-bottom: 20px;
  text-align: left;
}

.form-label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #555;
}

.form-input {
  width: 100%;
  padding: 12px 15px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 1rem;
  transition:
    border-color 0.3s,
    box-shadow 0.3s;
}

.form-input:focus {
  border-color: #e8b450;
  box-shadow: 0 0 0 3px rgba(232, 180, 80, 0.2);
  outline: none;
}

.modal-footer {
  padding: 15px 20px;
  display: flex;
  justify-content: flex-end;
  gap: 15px;
  border-top: 1px solid #eee;
}

.btn {
  padding: 10px 20px;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
  font-size: 1rem;
}

.cancel-btn {
  background-color: #f0f0f0;
  color: #666;
}

.cancel-btn:hover {
  background-color: #e0e0e0;
}

.confirm-btn {
  background: linear-gradient(135deg, #f5d287 0%, #e8b450 100%);
  color: #333;
  box-shadow: 0 2px 5px rgba(232, 180, 80, 0.3);
}

.confirm-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(232, 180, 80, 0.4);
}

.confirm-btn:active {
  transform: translateY(0);
  box-shadow: 0 2px 3px rgba(232, 180, 80, 0.3);
}
</style>
