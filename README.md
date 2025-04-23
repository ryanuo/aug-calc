# 黄金交易计算器

这是一个基于 Vue 3 的黄金交易记录和统计应用。用户可以记录买入和卖出的交易，并实时计算总克数变化、总盈亏和总价值。

## 功能

- **交易记录**：支持记录买入和卖出的交易。
- **实时统计**：
  - 总克数变化
  - 总盈亏
  - 总价值
- **本地存储**：交易记录会保存在浏览器的本地存储中，刷新页面后数据不会丢失。

## 技术栈

- Vue 3
- TypeScript
- VueUse（`useStorage` 用于本地存储）
- Decimal.js（用于精确的金额计算）

## 使用方法

1. 克隆项目到本地：

   ```bash
   git clone https://github.com/your-repo/aug-calc.git
   cd aug-calc
   ```

2. 安装依赖：

   ```bash
   npm install
   ```

3. 启动开发服务器：

   ```bash
   npm run dev
   ```

4. 打开浏览器访问 `http://localhost:3000`。

## 项目结构

```
/app
  /components
    AugCalc.vue  # 主组件，包含交易记录和统计功能
/README.md       # 项目说明文件
```

## 截图

![应用截图](https://via.placeholder.com/800x400?text=应用截图)

## 贡献

欢迎提交 Issue 或 Pull Request 来改进本项目。

## 许可证

MIT License
