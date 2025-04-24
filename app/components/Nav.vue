<script lang="ts" setup>
const color = useColorMode()

useHead({
  meta: [{
    id: 'theme-color',
    name: 'theme-color',
    content: () => color.value === 'dark' ? '#222222' : '#ffffff',
  }],
})
const useMsgStore = useMessageStore()

function toggleDark() {
  useMsgStore.showMessage({
    t: 'info',
    message: 'waiting for dark mode to develop...',
  })
  // color.preference = color.value === 'dark' ? 'light' : 'dark'
}
</script>

<template>
  <div flex="~ items-center gap-0.5" text-gray p1 rounded-1rem right-4 top-4 fixed backdrop-blur-md>
    <button text-sm p2 rounded-xl cursor-pointer hover:bg-gray:10>
      <a href="https://github.com/ryanuo/aug-calc" target="_blank">
        <span class="i-uit-github-alt" />
      </a>
    </button>
    <button text-sm p2 rounded-xl cursor-pointer hover:bg-gray:10 @click="toggleDark()">
      <div class="i-carbon-sun dark:i-carbon-moon" />
    </button>
  </div>
</template>
