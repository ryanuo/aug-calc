export default defineEventHandler(async () => {
  try {
    const response = await fetch('https://free.xwteam.cn/api/gold/trade')

    // 检查请求是否成功
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`)
    }

    // 解析响应数据
    const list = await response.json()

    // 返回解析后的数据
    return list
  }
  catch (error) {
    // 捕获错误并返回一个默认的错误响应
    console.error('Request failed', error)
    return { error: 'Failed to fetch gold trade data' }
  }
})
