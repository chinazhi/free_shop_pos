# 便利店收银系统

基于 Electron + Vue.js + Element Plus 开发的便利店收银系统(目前为单机离线版本)。

## 功能特性

### 🛒 收银台
- 商品扫码/手动添加
- 购物车管理
- 会员积分
- 多种支付方式
- 小票打印

### 📦 商品管理
- 商品信息维护
- 分类管理
- 库存管理
- 价格管理
- 批量导入/导出

### 👥 会员管理
- 会员信息管理
- 积分系统
- 会员等级
- 消费记录

### 📊 销售记录
- 销售订单查询
- 退款处理
- 订单详情
- 数据统计

### 📈 报表统计
- 销售趋势分析
- 商品销售排行
- 营业额统计
- 数据可视化

### ⚙️ 系统设置
- 基本信息配置
- 税务设置
- 小票设置
- 系统参数

## 技术栈

- **前端框架**: Vue 3 + Composition API
- **UI组件库**: Element Plus
- **状态管理**: Pinia
- **路由管理**: Vue Router
- **桌面应用**: Electron
- **数据库**: SQLite3
- **构建工具**: Vite
- **开发语言**: JavaScript

## 项目结构

```
free_shop_pos/
├── src/
│   ├── main/                 # Electron 主进程
│   │   ├── index.js         # 主进程入口
│   │   └── database.js      # 数据库管理
│   └── renderer/            # Vue 渲染进程
│       ├── views/           # 页面组件
│       ├── stores/          # Pinia 状态管理
│       ├── router/          # 路由配置
│       ├── App.vue          # 根组件
│       ├── main.js          # 渲染进程入口
│       └── style.css        # 全局样式
├── package.json             # 项目配置
├── vite.config.js           # Vite 配置
├── index.html               # HTML 模板
└── README.md                # 项目说明文档
```

## 安装和运行

### 环境要求
- Node.js >= 16.0.0
- npm >= 8.0.0

### 安装依赖
```bash
npm install
```

### 开发模式
```bash
npm run dev
```

### 构建应用
```bash
npm run build
```

### 打包发布
```bash
npm run build:electron
```

## 数据库

系统使用 SQLite3 作为本地数据库，数据库文件位于用户数据目录：
- Windows: `%APPDATA%/free-shop-pos/pos_database.db`
- macOS: `~/Library/Application Support/free-shop-pos/pos_database.db`
- Linux: `~/.config/free-shop-pos/pos_database.db`

### 数据表结构
- `products` - 商品信息（含 is_active 状态、价格、库存等）
- `categories` - 商品分类
- `members` - 会员信息（含 is_active 状态、积分等）
- `sales` - 销售订单
- `sale_items` - 销售明细
- `inventory_logs` - 库存变动记录
- `member_points_logs` - 会员积分变动日志
- `settings` - 系统设置

## 使用说明

### 首次使用
1. 启动应用后，系统会自动创建数据库和初始数据
2. 在「系统设置」中配置店铺基本信息
3. 在「商品管理」中添加商品信息
4. 开始使用收银功能

### 收银操作
1. 在收银台页面扫描商品条码或手动搜索添加商品
2. 确认购物车中的商品和数量
3. 选择支付方式并输入收款金额
4. 点击结账完成交易
5. 可选择打印小票

### 商品管理
1. 添加商品分类
2. 录入商品基本信息（名称、条码、价格等）
3. 设置库存数量和最低库存预警
4. 管理商品状态（上架/下架）

### 会员管理
1. 注册新会员
2. 查看会员消费记录和积分
3. 调整会员积分
4. 管理会员等级

## 开发说明

### 添加新功能
1. 在 `src/renderer/views/` 中创建新的页面组件
2. 在 `src/renderer/router/index.js` 中添加路由配置
3. 在 `src/renderer/stores/` 中添加状态管理
4. 更新数据库表结构（如需要）

### 自定义样式
- 全局样式：`src/renderer/style.css`
- 组件样式：在各个 Vue 组件的 `<style>` 标签中

### 数据库操作
- 查询：使用 `window.electronAPI.dbQuery(sql, params)`
- 单行查询：使用 `window.electronAPI.dbGet(sql, params)`
- 执行：使用 `window.electronAPI.dbRun(sql, params)`

## 许可证

MIT License

## 贡献

欢迎提交 Issue 和 Pull Request 来改进这个项目。

## 联系方式

如有问题或建议，请通过以下方式联系：
- 邮箱: 645316696@qq.com
- GitHub: https://github.com/chinazhi/free_shop_pos