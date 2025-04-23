<script setup lang="ts">
// 获取消息、类型和可见性
const messageStore = useMessageStore()
</script>

<template>
  <transition name="message-fade">
    <div v-if="messageStore.isVisible" :class="[messageStore.type]" class="message-container message">
      <p>{{ messageStore.message }}</p>
    </div>
  </transition>
</template>

<style scoped>
.message-container {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  padding: 10px 20px;
  border-radius: 5px;
  color: white;
  font-size: 16px;
  z-index: 9999;
  transition: all 0.3s ease;
}

.message.success {
  background-color: #28a745;
}

.message.error {
  background-color: #dc3545;
}

.message.warn {
  background-color: #ffc107;
}

.message.info {
  background-color: #17a2b8;
}

/* 过渡效果 */
.message-fade-enter-active,
.message-fade-leave-active {
  transition:
    opacity 0.5s ease,
    transform 0.5s ease;
}

.message-fade-enter-from,
.message-fade-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(-20px);
}
</style>
