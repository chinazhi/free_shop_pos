# 便利店收银系统

基于 Vue 3 + Element Plus 的现代化便利店收银系统，纯前端实现，无需后端服务器。

## ✨ 核心特性

- 🛒 **智能收银** - 条码扫描、商品搜索、购物车管理、多种支付方式
- 📦 **商品管理** - 商品信息维护、分类管理、库存跟踪
- 📊 **销售统计** - 实时销售数据、历史订单查询、Excel导出
- ⚙️ **系统配置** - 店铺信息、税率设置、界面个性化

## 🚀 技术架构

- **Vue 3** + Composition API - 现代化响应式框架
- **Element Plus** - 企业级UI组件库
- **Pinia** - 轻量级状态管理
- **IndexedDB** - 浏览器本地数据库
- **Vite** - 极速构建工具和开发服务器
- **纯前端架构** - 无需后端服务器，完全运行在浏览器中

## 📁 项目结构

```
src/
├── views/              # 页面组件
│   ├── Layout.vue      # 主布局
│   ├── POS.vue         # 收银台
│   ├── Products.vue    # 商品管理
│   ├── Sales.vue       # 销售记录
│   └── Settings.vue    # 系统设置
├── stores/             # 状态管理
│   ├── app.js          # 应用状态
│   ├── cart.js         # 购物车
│   ├── products.js     # 商品数据
│   ├── sales.js        # 销售数据
│   └── settings.js     # 系统设置
├── utils/
│   └── indexedDB.js    # 数据库管理
└── router/
    └── index.js        # 路由配置
```

## 🛠️ 快速开始

```bash
# 安装依赖
npm install

# 启动开发服务器 (默认端口: 3000)
npm run dev

# 构建生产版本
npm run build

# 预览构建结果
npm run preview
```

**环境要求**: Node.js >= 16.0.0，支持 IndexedDB 的现代浏览器

**开发服务器配置**: 默认运行在 `http://localhost:3000`，可在 `vite.config.js` 中修改端口设置

## 💾 数据存储

采用 IndexedDB 本地存储，数据完全保存在浏览器中：
- `products` - 商品信息与库存
- `categories` - 商品分类
- `sales` - 销售订单
- `sale_items` - 订单明细
- `settings` - 系统配置

## 📝 许可证

MIT License