interface OnlineGoldInfo {
  SH: {
    Low: number
    High: number
    SP: number
  }[]
  GJ: {
    SP: number
    Low: number
    Symbol: string
  }[]
}
export const useOnlineGoldStore = defineStore('online-gold', {
  state: () => ({
    onlineGoldInfo: null,
    error: null,
  }) as {
    onlineGoldInfo: OnlineGoldInfo | null
    error: any
  },

  actions: {
    async getOnlineGold() {
      try {
        const { data } = await $fetch<{
          data: OnlineGoldInfo
        }>('https://free.xwteam.cn/api/gold/trade')

        this.onlineGoldInfo = data
        this.error = ''
      }
      catch (err) {
        this.error = err
      }
    },
  },
})

if (import.meta.hot)
  import.meta.hot.accept(acceptHMRUpdate(useMessageStore, import.meta.hot))
