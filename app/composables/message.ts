import { acceptHMRUpdate, defineStore } from 'pinia'

type MessageType = 'success' | 'error' | 'warn' | 'info'
interface Message {
  message: string
  t: MessageType
  duration?: number
}

export const useMessageStore = defineStore('message', () => {
  // 定义响应式变量
  const msg = ref<string>('')
  const type = ref<MessageType>('success')
  const isVisible = ref<boolean>(false)

  // 通用的显示消息函数
  const showMessage = ({ message, t = 'success', duration = 1000 }: Message) => {
    msg.value = message
    type.value = t
    isVisible.value = true

    // 设置定时器以自动隐藏消息
    setTimeout(() => {
      isVisible.value = false
      msg.value = ''
      type.value = 'success'
    }, duration)
  }

  return {
    message: msg,
    type,
    isVisible,
    showMessage,
  }
})

if (import.meta.hot)
  import.meta.hot.accept(acceptHMRUpdate(useMessageStore, import.meta.hot))
